import { useEffect, useState } from "react";
import { HorizonTrendChart } from "../components/PerformanceCharts";

const API_URL = "http://127.0.0.1:8000";

function Dashboard() {
    const [health, setHealth] = useState(null);
    const [performance, setPerformance] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const [healthResponse, performanceResponse] =
                    await Promise.all([
                        fetch(`${API_URL}/api/health`),
                        fetch(`${API_URL}/api/model-performance`),
                    ]);

                if (!healthResponse.ok || !performanceResponse.ok) {
                    throw new Error("Failed to load dashboard data");
                }

                const healthData = await healthResponse.json();
                const performanceData =
                    await performanceResponse.json();

                setHealth(healthData);
                setPerformance(performanceData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    const horizons = performance
        ? Object.values(performance.horizons).sort((a, b) => a.horizon_hours - b.horizon_hours)
        : [];
    const latestHorizon = horizons[horizons.length - 1];

    return (
        <div className="page-container p-6 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">
                    Tropical Cyclone Dashboard
                </h1>

                <p className="text-slate-400 mt-2">
                    AI-powered cyclone intensity analysis and prediction.
                </p>
            </div>

            {/* <p className="mb-6 rounded-lg border border-amber-900/70 bg-amber-950/30 p-4 text-sm text-amber-200">
                Educational analysis based on historical data. Predictions are not live forecasts or official warnings.
            </p> */}

            {error && (
                <div role="alert" className="mb-6 rounded-lg border border-red-800 bg-red-950/40 p-4 text-red-300">
                    Backend connection failed: {error}
                </div>
            )}

            <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                    <p className="text-sm text-slate-400">Backend status</p>
                    <p className={`mt-2 text-2xl font-bold ${health?.status === "ok" ? "text-emerald-400" : "text-slate-300"}`}>
                        {loading ? "Checking..." : health?.status === "ok" ? "Online" : "Unavailable"}
                    </p>
                </article>
                <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                    <p className="text-sm text-slate-400">Model artifacts loaded</p>
                    <p className="mt-2 text-3xl font-bold">
                        {health?.model_artifacts_loaded?.length ?? health?.models_loaded?.length ?? "—"}
                    </p>
                </article>
                <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                    <p className="text-sm text-slate-400">Forecast horizons</p>
                    <p className="mt-2 text-3xl font-bold">{horizons.length || "—"}</p>
                    <p className="mt-1 text-xs text-slate-500">
                        {horizons.map((item) => `${item.horizon_hours}h`).join(" · ") || "Waiting for data"}
                    </p>
                </article>
                <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                    <p className="text-sm text-slate-400">12-hour forecast RMSE</p>
                    <p className="mt-2 text-3xl font-bold">
                        {latestHorizon ? `${latestHorizon.rmse.toFixed(2)} kt` : "—"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Lower error is better</p>
                </article>
            </div>

            {horizons.length > 0 && (
                <div className="mb-8 grid gap-5 xl:grid-cols-2">
                    <HorizonTrendChart
                        title="Forecast error by horizon"
                        description="Linear Regression RMSE in knots; lower is better."
                        horizons={horizons}
                        metric="rmse"
                        color="#22d3ee"
                        formatValue={(value) => value.toFixed(1)}
                    />
                    <HorizonTrendChart
                        title="Explained variance by horizon"
                        description="Linear Regression R²; closer to 1 indicates a better fit."
                        horizons={horizons}
                        metric="r2"
                        color="#818cf8"
                        formatValue={(value) => value.toFixed(2)}
                    />
                </div>
            )}

            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <div className="mb-5">
                    <h2 className="text-xl font-semibold">Deployed horizon metrics</h2>
                    <p className="mt-1 text-sm text-slate-400">
                        Evaluation scores for Linear Regression at each forecast horizon.
                    </p>
                </div>
                {loading && <p className="py-6 text-center text-slate-400">Loading dashboard data...</p>}
                {!loading && horizons.length === 0 && !error && (
                    <p className="py-6 text-center text-slate-400">No horizon metrics are available.</p>
                )}
                {horizons.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-400">
                                    <th className="px-3 py-3">Horizon</th>
                                    <th className="px-3 py-3">Model</th>
                                    <th className="px-3 py-3">RMSE (kt)</th>
                                    <th className="px-3 py-3">R²</th>
                                </tr>
                            </thead>
                            <tbody>
                                {horizons.map((item) => (
                                    <tr key={item.horizon_hours} className="border-b border-slate-800 last:border-0">
                                        <td className="px-3 py-3 font-medium">{item.horizon_hours}h</td>
                                        <td className="px-3 py-3">{item.model}</td>
                                        <td className="px-3 py-3">{item.rmse.toFixed(3)}</td>
                                        <td className="px-3 py-3 font-semibold text-blue-400">{item.r2.toFixed(3)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

export default Dashboard;