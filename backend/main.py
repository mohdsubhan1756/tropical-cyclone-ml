import csv
import json
from pathlib import Path
from typing import Literal, Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"

with (MODEL_DIR / "model_metadata.json").open(encoding="utf-8") as metadata_file:
    MODEL_METADATA = json.load(metadata_file)

FEATURES = MODEL_METADATA["features"]["regression_and_classification"]
CLUSTER_FEATURES = MODEL_METADATA["features"]["clustering"]
TARGET_CLASSES = MODEL_METADATA["target_classes"]

HORIZON_MODELS = {
    horizon: joblib.load(MODEL_DIR / f"regression_{horizon}h.joblib")
    for horizon in (3, 6, 9, 12)
}
REGRESSION_MODELS = {
    "decision_tree": joblib.load(MODEL_DIR / "regression_dt.joblib"),
    "random_forest": joblib.load(MODEL_DIR / "regression_rf.joblib"),
}
CLASSIFICATION_MODELS = {
    "logistic_regression": joblib.load(MODEL_DIR / "classification_lr.joblib"),
    "svm": joblib.load(MODEL_DIR / "classification_svm.joblib"),
    "random_forest": joblib.load(MODEL_DIR / "classification_rf.joblib"),
}
CLUSTER_PREPROCESSOR = joblib.load(MODEL_DIR / "cluster_preprocessor.joblib")
CLUSTERING_MODELS = {
    "kmeans": joblib.load(MODEL_DIR / "kmeans.joblib"),
    "dbscan": joblib.load(MODEL_DIR / "dbscan.joblib"),
}

if list(CLUSTER_PREPROCESSOR.feature_names_in_) != CLUSTER_FEATURES:
    raise ValueError("Clustering preprocessor feature order does not match model_metadata.json")

app = FastAPI(
    title="Tropical Cyclone Prediction API",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CycloneFeatures(BaseModel):
    LAT: float = Field(..., ge=-90, le=90)
    LON: float = Field(..., ge=-180, le=180)
    USA_WIND: float = Field(..., ge=0)
    USA_PRES: float = Field(..., gt=0)
    DIST2LAND: float = Field(..., ge=0)
    STORM_SPEED: float = Field(..., ge=0)
    STORM_DIR_SIN: float = Field(..., ge=-1, le=1)
    STORM_DIR_COS: float = Field(..., ge=-1, le=1)
    TIME_DIFF_HOURS: float = Field(..., gt=0)
    WIND_CHANGE: float
    PRESSURE_CHANGE: float


class RegressionRequest(CycloneFeatures):
    model: Literal["linear_regression", "decision_tree", "random_forest"] = "linear_regression"
    horizon: Optional[int] = Field(default=None, description="Linear Regression forecast horizon in hours")


class ClassificationRequest(CycloneFeatures):
    model: Literal["logistic_regression", "svm", "random_forest"] = "logistic_regression"


class ClusteringRequest(BaseModel):
    model: Literal["kmeans", "dbscan"]
    LAT: float = Field(..., ge=-90, le=90)
    LON: float = Field(..., ge=-180, le=180)
    USA_WIND: float = Field(..., ge=0)
    USA_PRES: float = Field(..., gt=0)
    DIST2LAND: float = Field(..., ge=0)
    STORM_SPEED: float = Field(..., ge=0)


def _feature_frame(request: BaseModel, feature_names: list[str]) -> pd.DataFrame:
    return pd.DataFrame(
        [[getattr(request, name) for name in feature_names]],
        columns=feature_names,
    )


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "models_loaded": list(HORIZON_MODELS.keys()),
        "model_artifacts_loaded": [
            "regression_3h.joblib",
            "regression_6h.joblib",
            "regression_9h.joblib",
            "regression_12h.joblib",
            "regression_dt.joblib",
            "regression_rf.joblib",
            "classification_lr.joblib",
            "classification_svm.joblib",
            "classification_rf.joblib",
            "kmeans.joblib",
            "dbscan.joblib",
            "cluster_preprocessor.joblib",
        ],
    }


@app.get("/api/models")
def models():
    return {
        "available_horizons": list(HORIZON_MODELS.keys()),
        "regression_models": ["linear_regression", *REGRESSION_MODELS.keys()],
        "classification_models": list(CLASSIFICATION_MODELS.keys()),
        "clustering_models": list(CLUSTERING_MODELS.keys()),
        "features": {
            "regression_and_classification": FEATURES,
            "clustering": CLUSTER_FEATURES,
        },
    }


@app.post("/api/predict/regression")
def predict_regression(request: RegressionRequest):
    input_data = _feature_frame(request, FEATURES)

    if request.model == "linear_regression":
        if request.horizon not in HORIZON_MODELS:
            raise HTTPException(
                status_code=400,
                detail="Linear Regression horizon must be one of: 3, 6, 9, 12 hours",
            )
        model = HORIZON_MODELS[request.horizon]
        prediction = model.predict(input_data)[0]
        return {
            "horizon_hours": request.horizon,
            "prediction_kt": round(float(prediction), 2),
            "model": "Linear Regression",
        }

    if request.horizon is not None:
        raise HTTPException(
            status_code=400,
            detail="The horizon field is only supported by Linear Regression",
        )

    model = REGRESSION_MODELS[request.model]
    prediction = model.predict(input_data)[0]
    model_names = {
        "decision_tree": "Decision Tree Regression",
        "random_forest": "Random Forest Regression",
    }
    return {
        "prediction_kt": round(float(prediction), 2),
        "model": model_names[request.model],
    }


@app.post("/api/predict/classification")
def predict_classification(request: ClassificationRequest):
    model = CLASSIFICATION_MODELS[request.model]
    input_data = _feature_frame(request, FEATURES)
    predicted_class = int(model.predict(input_data)[0])

    return {
        "predicted_class": predicted_class,
        "class_label": TARGET_CLASSES[str(predicted_class)],
        "model": request.model,
    }


@app.post("/api/predict/clustering")
def predict_clustering(request: ClusteringRequest):
    input_data = _feature_frame(request, CLUSTER_FEATURES)
    scaled_data = CLUSTER_PREPROCESSOR.transform(input_data)
    model = CLUSTERING_MODELS[request.model]

    if request.model == "kmeans":
        cluster = int(model.predict(scaled_data)[0])
        return {
            "cluster": cluster,
            "model": "K-Means",
        }

    if model.metric != "euclidean":
        raise HTTPException(
            status_code=500,
            detail="DBSCAN inference currently requires the saved Euclidean metric",
        )

    distances = np.linalg.norm(model.components_ - scaled_data[0], axis=1)
    nearest_core = int(np.argmin(distances))
    nearest_distance = float(distances[nearest_core])
    cluster = -1
    if nearest_distance <= model.eps:
        cluster = int(model.labels_[model.core_sample_indices_[nearest_core]])

    return {
        "cluster": cluster,
        "model": "DBSCAN",
        "nearest_core_distance": round(nearest_distance, 6),
        "assignment_method": "nearest fitted core sample within eps; otherwise noise",
    }


@app.get("/api/model-performance")
def model_performance():
    with (MODEL_DIR / "all_model_results.csv").open(
        newline="",
        encoding="utf-8",
    ) as results_file:
        model_metrics = [
            {
                "group": row["Model Group"],
                "model": row["Model Name"],
                "metric": row["Metric Type"],
                "value": float(row["Value"]),
            }
            for row in csv.DictReader(results_file)
        ]

    return {
        "horizons": {
            "3h": {
                "horizon_hours": 3,
                "model": "Linear Regression",
                "rmse": 1.825428,
                "r2": 0.994013,
            },
            "6h": {
                "horizon_hours": 6,
                "model": "Linear Regression",
                "rmse": 3.731796,
                "r2": 0.975160,
            },
            "9h": {
                "horizon_hours": 9,
                "model": "Linear Regression",
                "rmse": 5.515619,
                "r2": 0.946150,
            },
            "12h": {
                "horizon_hours": 12,
                "model": "Linear Regression",
                "rmse": 7.317705,
                "r2": 0.906044,
            },
        },
        "models": model_metrics,
    }
