# Tropical Cyclone Pattern Analysis and Intensity Prediction

An end-to-end cyclone analysis application for historical North Indian Ocean observations. It combines unsupervised pattern analysis with supervised intensity prediction and exposes the saved machine-learning models through a FastAPI backend and React interface.

This is an educational prototype. It does not use live meteorological data, issue official forecasts or warnings, and must not replace guidance from authorized weather agencies.

## Features

- **Dashboard:** backend status, loaded model count, forecast horizons, and evaluation trends.
- **Pattern Analysis:** K-Means and DBSCAN clustering from six observation features.
- **Intensity Prediction:** wind-speed regression and three-class intensity classification.
- **Model Performance:** saved metrics and model comparisons by task.
- **Interactive API:** validated FastAPI endpoints with automatic Swagger documentation.

## Project Structure

```text
cyclone/
|-- backend/
|   |-- main.py
|   |-- models/
|   |-- models_backup/
|   `-- requirements.txt
|-- frontend/
|   |-- src/
|   |-- package.json
|   `-- README.md
|-- cyclone_training.ipynb
|-- report.md
|-- script.md
`-- README.md
```

## Technology Stack

- Python and FastAPI
- Pydantic
- pandas, NumPy, scikit-learn 1.6.1, and joblib
- React 19 and Vite
- Tailwind CSS 4
- Oxlint

## Model Outputs

### Regression

The Linear Regression horizon models estimate wind speed 3, 6, 9, or 12 hours ahead. Decision Tree and Random Forest regression models provide one-step predictions.

### Classification

The three intensity classes are:

| Class | Wind speed |
|---:|---|
| 0 — Weak | Below 34 knots |
| 1 — Tropical Storm | 34 to below 64 knots |
| 2 — Hurricane | At least 64 knots |

### Clustering

K-Means assigns observations to three clusters. DBSCAN identifies dense regions and noise; for an incoming observation, this application assigns the observation to the nearest fitted core sample when it is within the saved epsilon distance.

Cluster identifiers are arbitrary and are not intensity categories.

## Setup

Use Python 3.10 or a compatible environment and Node.js with npm.

### Backend

From the project root:

```powershell
Set-Location .\backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The API is available at `http://127.0.0.1:8000`. Interactive documentation is available at `http://127.0.0.1:8000/docs`.

### Frontend

Open another terminal from the project root:

```powershell
Set-Location .\frontend
npm install
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`.

The frontend is configured to call `http://127.0.0.1:8000`.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Backend status and loaded artifacts |
| `GET` | `/api/models` | Available models, horizons, and feature lists |
| `POST` | `/api/predict/regression` | Future wind-speed prediction |
| `POST` | `/api/predict/classification` | Intensity-class prediction |
| `POST` | `/api/predict/clustering` | K-Means or DBSCAN cluster assignment |
| `GET` | `/api/model-performance` | Saved evaluation metrics |

## Example Requests

### Regression

```json
{
  "model": "linear_regression",
  "horizon": 3,
  "LAT": 20,
  "LON": 85,
  "USA_WIND": 60,
  "USA_PRES": 980,
  "DIST2LAND": 200,
  "STORM_SPEED": 10,
  "STORM_DIR_SIN": 0.707,
  "STORM_DIR_COS": 0.707,
  "TIME_DIFF_HOURS": 3,
  "WIND_CHANGE": 5,
  "PRESSURE_CHANGE": -5
}
```

Example 3-hour output:

```json
{
  "horizon_hours": 3,
  "prediction_kt": 63.21,
  "model": "Linear Regression"
}
```

### K-Means clustering

```json
{
  "model": "kmeans",
  "LAT": 20,
  "LON": 85,
  "USA_WIND": 60,
  "USA_PRES": 980,
  "DIST2LAND": 200,
  "STORM_SPEED": 10
}
```

## Validation

Run the frontend checks:

```powershell
Set-Location .\frontend
npm run lint
npm run build
```

Before a presentation or submission, also start the backend and confirm:

1. `/api/health` reports status `ok`.
2. All four Linear Regression horizons are available.
3. Regression, classification, and clustering requests return predictions.
4. All four frontend pages render without browser errors.

## Documentation

- [Detailed project report](./report.md)
- [Presentation script](./script.md)
- [Training notebook](./cyclone_training.ipynb)
- [Frontend setup](./frontend/README.md)
