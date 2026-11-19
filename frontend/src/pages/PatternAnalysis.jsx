import { useState } from "react";
import { LocationPlot } from "../components/PerformanceCharts";

const API_URL = "http://127.0.0.1:8000";

const initialForm = {
    LAT: 15.2,
    LON: 82.4,
    USA_WIND: 52,
    USA_PRES: 980,
    DIST2LAND: 120,
    STORM_SPEED: 8,
};

const fields = [
    ["LAT", "Latitude"],
    ["LON", "Longitude"],
    ["USA_WIND", "Current Wind Speed (kt)"],
    ["USA_PRES", "Current Pressure (hPa)"],
    ["DIST2LAND", "Distance from Land (km)"],
    ["STORM_SPEED", "Storm Speed (kt)"],
];

function PatternAnalysis() {
    const [form, setForm] = useState(initialForm);
    const [model, setModel] = useState("kmeans");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");
        setResult(null);

        try {
            const response = await fetch(`${API_URL}/api/predict/clustering`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ ...form, model }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Clustering request failed");
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
                <h1 className="text-3xl font-bold">Pattern Analysis</h1>
                <p className="mt-2 text-slate-400">
                    Assign observations to patterns using the trained clustering models.
                </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 rounded-xl border border-slate-800 bg-slate-900 p-6 xl:col-span-2"
                >
                    <div>
                        <label htmlFor="cluster-model" className="mb-2 block text-sm font-medium">
                            Clustering model
                        </label>
                        <select
                            id="cluster-model"
                            value={model}
                            onChange={(event) => {
                                setModel(event.target.value);
                                setResult(null);
                                setError("");
                            }}
                            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3"
                        >
                            <option value="kmeans">K-Means</option>
                            <option value="dbscan">DBSCAN</option>
                        </select>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {fields.map(([name, label]) => (
                            <div key={name}>
                                <label htmlFor={`cluster-${name}`} className="mb-2 block text-sm text-slate-300">
                                    {label}
                                </label>
                                <input
                                    id={`cluster-${name}`}
                                    type="number"
                                    step="any"
                                    value={form[name]}
                                    onChange={(event) => {
                                        setForm((previous) => ({
                                            ...previous,
                                            [name]: Number(event.target.value),
                                        }));
                                    }}
                                    required
                                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3"
                                />
                            </div>
                        ))}
                    </div>

                    <p className="text-sm text-slate-400">
                        The saved median imputer and scaler are applied in the training feature order.
                    </p>

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
                        {loading ? "Analyzing pattern..." : "Analyze pattern"}
                    </button>
                </form>

                <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                    <h2 className="text-xl font-semibold">Analysis result</h2>
                    {!result && !loading && (
                        <p className="py-16 text-center text-slate-500">
                            Enter cyclone observations and select a clustering model.
                        </p>
                    )}
                    {loading && (
                        <p className="py-16 text-center text-blue-400">
                            Running {model.toUpperCase()}...
                        </p>
                    )}
                    {result && (
                        <div className="mt-6 space-y-4">
                            <div className="rounded-xl bg-slate-800 p-5">
                                <p className="text-sm text-slate-400">Cluster assignment</p>
                                <p className="mt-2 text-3xl font-bold text-blue-400">
                                    {result.cluster === -1 ? "Noise" : `Cluster ${result.cluster}`}
                                </p>
                            </div>
                            <div className="rounded-lg border border-slate-700 p-4">
                                <p className="text-xs text-slate-400">Model</p>
                                <p className="mt-1 font-medium">{result.model}</p>
                            </div>
                            {result.nearest_core_distance !== undefined && (
                                <div className="rounded-lg border border-slate-700 p-4">
                                    <p className="text-xs text-slate-400">Nearest core distance</p>
                                    <p className="mt-1 font-medium">{result.nearest_core_distance}</p>
                                    <p className="mt-2 text-xs text-slate-500">
                                        {result.assignment_method}
                                    </p>
                                </div>
                            )}
                            <div className="rounded-lg border border-slate-700 p-4">
                                <div className="mb-2">
                                    <p className="font-medium">Submitted storm location</p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        Coordinate plot only; this does not display cluster boundaries or storm tracks.
                                    </p>
                                </div>
                                <LocationPlot latitude={form.LAT} longitude={form.LON} />
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
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

export default PatternAnalysis;
