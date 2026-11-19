import { useState } from "react";
import { ComparisonBarChart } from "../components/PerformanceCharts";

const API_URL = "http://127.0.0.1:8000";

const initialForm = {
    horizon: 3,
    LAT: 15.2,
    LON: 82.4,
    USA_WIND: 52,
    USA_PRES: 980,
    DIST2LAND: 120,
    STORM_SPEED: 8,
    STORM_DIR_SIN: 0.5,
    STORM_DIR_COS: 0.86,
    TIME_DIFF_HOURS: 3,
    WIND_CHANGE: 2,
    PRESSURE_CHANGE: -4,
};

const fields = [
    ["LAT", "Latitude"],
    ["LON", "Longitude"],
    ["USA_WIND", "Current Wind Speed (kt)"],
    ["USA_PRES", "Current Pressure (hPa)"],
    ["DIST2LAND", "Distance from Land (km)"],
    ["STORM_SPEED", "Storm Speed (kt)"],
    ["STORM_DIR_SIN", "Storm Direction Sin"],
    ["STORM_DIR_COS", "Storm Direction Cos"],
    ["TIME_DIFF_HOURS", "Time Difference (hours)"],
    ["WIND_CHANGE", "Wind Change (kt)"],
    ["PRESSURE_CHANGE", "Pressure Change (hPa)"],
];

const classificationModels = {
    classification_logistic_regression: "logistic_regression",
    classification_svm: "svm",
    classification_random_forest: "random_forest",
};

const intensityClasses = [
    { label: "Weak", range: "< 34 kt", width: "34%" },
    { label: "Tropical Storm", range: "34 to <64 kt", width: "30%" },
    { label: "Hurricane", range: "64+ kt", width: "36%" },
];

function IntensityPrediction() {
    const [form, setForm] = useState(initialForm);
    const [model, setModel] = useState("linear_regression");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((previous) => ({
            ...previous,
            [name]: Number(value),
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");
        setResult(null);

        const isClassification = Object.hasOwn(classificationModels, model);
        const endpoint = isClassification
            ? "/api/predict/classification"
            : "/api/predict/regression";
        const requestModel = isClassification
            ? classificationModels[model]
            : model;
        const body = {
            ...form,
            model: requestModel,
        };

        if (model !== "linear_regression") {
            delete body.horizon;
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Prediction failed");
            }

            setResult(data);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container p-6 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Intensity Prediction</h1>
                <p className="mt-2 text-slate-400">
                    Compare trained regression and intensity-classification models.
                </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 rounded-xl border border-slate-800 bg-slate-900 p-6 xl:col-span-2"
                >
                    <div>
                        <label htmlFor="model" className="mb-2 block text-sm font-medium">
                            Prediction model
                        </label>
                        <select
                            id="model"
                            value={model}
                            onChange={(event) => {
                                setModel(event.target.value);
                                setResult(null);
                                setError("");
                            }}
                            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3"
                        >
                            <optgroup label="Regression">
                                <option value="linear_regression">Linear Regression</option>
                                <option value="decision_tree">Decision Tree Regression</option>
                                <option value="random_forest">Random Forest Regression</option>
                            </optgroup>
                            <optgroup label="Classification">
                                <option value="classification_logistic_regression">Logistic Regression</option>
                                <option value="classification_svm">SVM</option>
                                <option value="classification_random_forest">Random Forest Classification</option>
                            </optgroup>
                        </select>
                    </div>

                    {model === "linear_regression" && (
                        <div>
                            <label htmlFor="horizon" className="mb-2 block text-sm font-medium">
                                Forecast horizon
                            </label>
                            <select
                                id="horizon"
                                name="horizon"
                                value={form.horizon}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3"
                            >
                                {[3, 6, 9, 12].map((horizon) => (
                                    <option key={horizon} value={horizon}>
                                        {horizon} hours
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                        {fields.map(([name, label]) => (
                            <div key={name}>
                                <label htmlFor={name} className="mb-2 block text-sm text-slate-300">
                                    {label}
                                </label>
                                <input
                                    id={name}
                                    type="number"
                                    step="any"
                                    name={name}
                                    value={form[name]}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3"
                                />
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div role="alert" className="rounded-lg border border-red-800 bg-red-950/40 p-4 text-red-300">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-600 py-3 font-semibold hover:bg-blue-700 disabled:bg-slate-700"
                    >
                        {loading ? "Running model..." : "Run prediction"}
                    </button>
                </form>

                <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                    <h2 className="text-xl font-semibold">Prediction result</h2>
                    {!result && !loading && (
                        <p className="py-16 text-center text-slate-500">
                            Enter cyclone observations and run a model.
                        </p>
                    )}
                    {loading && (
                        <p className="py-16 text-center text-blue-400">
                            Running {model.replaceAll("_", " ")}...
                        </p>
                    )}
                    {result && (
                        <div className="mt-6 space-y-4">
                            <div className="rounded-xl bg-slate-800 p-5">
                                <p className="text-sm text-slate-400">
                                    {result.class_label ? "Predicted intensity class" : "Predicted wind speed"}
                                </p>
                                <p className="mt-2 text-3xl font-bold text-blue-400">
                                    {result.class_label || `${result.prediction_kt} kt`}
                                </p>
                            </div>
                            {result.prediction_kt !== undefined && (
                                <>
                                    <div className="rounded-lg border border-slate-700 p-4">
                                        <div className="mb-4">
                                            <p className="font-medium">Wind speed comparison</p>
                                            <p className="mt-1 text-xs text-slate-400">
                                                A point prediction from the selected regression model; no uncertainty range is returned.
                                            </p>
                                        </div>
                                        <ComparisonBarChart
                                            currentValue={form.USA_WIND}
                                            predictedValue={result.prediction_kt}
                                            horizonLabel={result.horizon_hours
                                                ? `Predicted at ${result.horizon_hours}h`
                                                : "Predicted next observation"}
                                        />
                                        <p className="mt-4 text-sm text-slate-300">
                                            Change from current:{" "}
                                            <span className={result.prediction_kt >= form.USA_WIND ? "font-semibold text-amber-300" : "font-semibold text-cyan-300"}>
                                                {result.prediction_kt - form.USA_WIND >= 0 ? "+" : ""}
                                                {(result.prediction_kt - form.USA_WIND).toFixed(2)} kt
                                            </span>
                                        </p>
                                    </div>
                                    <details className="rounded-lg border border-slate-700 p-4">
                                        <summary className="cursor-pointer text-sm font-medium">
                                            Input observations used
                                        </summary>
                                        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                            {fields.map(([name, label]) => (
                                                <div key={name}>
                                                    <dt className="text-xs text-slate-500">{label}</dt>
                                                    <dd className="mt-1 text-slate-200">{form[name]}</dd>
                                                </div>
                                            ))}
                                        </dl>
                                    </details>
                                </>
                            )}
                            {result.class_label && (
                                <div
                                    className="rounded-lg border border-slate-700 p-4"
                                    role="img"
                                    aria-label={`Predicted class ${result.class_label}. Intensity classes: Weak below 34 knots, Tropical Storm 34 to 63 knots, Hurricane 64 knots or more.`}
                                >
                                    <p className="font-medium">Project intensity ranges</p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        The highlighted range is the predicted class. Class probabilities are not returned.
                                    </p>
                                    <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-800">
                                        {intensityClasses.map((item) => (
                                            <div
                                                key={item.label}
                                                className={`${
                                                    result.class_label === item.label
                                                        ? "bg-blue-400"
                                                        : "bg-slate-700"
                                                }`}
                                                style={{ width: item.width }}
                                            />
                                        ))}
                                    </div>
                                    <div className="mt-3 grid grid-cols-3 gap-2">
                                        {intensityClasses.map((item) => (
                                            <div
                                                key={item.label}
                                                className={`rounded-md p-2 text-center ${
                                                    result.class_label === item.label
                                                        ? "bg-blue-950/60 text-blue-200"
                                                        : "text-slate-400"
                                                }`}
                                            >
                                                <p className="text-xs font-medium">{item.label}</p>
                                                <p className="mt-1 text-[11px]">{item.range}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="rounded-lg border border-slate-700 p-4">
                                <p className="text-xs text-slate-400">Model</p>
                                <p className="mt-1 font-medium">{result.model}</p>
                            </div>
                            {result.horizon_hours && (
                                <div className="rounded-lg border border-slate-700 p-4">
                                    <p className="text-xs text-slate-400">Forecast horizon</p>
                                    <p className="mt-1 font-medium">{result.horizon_hours} hours</p>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

export default IntensityPrediction;
