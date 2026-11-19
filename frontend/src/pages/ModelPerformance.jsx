import { useEffect, useState } from "react";
import { HorizonTrendChart, MetricBarChart } from "../components/PerformanceCharts";

const API_URL = "http://127.0.0.1:8000";

function ModelPerformance() {
    const [performance, setPerformance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchPerformance = async () => {
            try {
                const response = await fetch(`${API_URL}/api/model-performance`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.detail || "Failed to load performance");
                }

                setPerformance(data);
            } catch (requestError) {
                setError(requestError.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPerformance();
    }, []);

    if (loading) {
        return (
            <div className="page-container p-8">
                <p className="text-blue-400">Loading model performance...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-container p-8">
                <div role="alert" className="rounded-lg border border-red-800 bg-red-950/40 p-4 text-red-300">
                    {error}
                </div>
            </div>
        );
    }

    const horizons = Object.values(performance.horizons);
    const metrics = performance.models;
    const findMetrics = (group, metric) => metrics
        .filter((item) => item.group === group && item.metric.toLowerCase().replace("²", "2").includes(metric))
        .map((item) => ({ label: item.model, value: item.value }));

    return (
        <div className="page-container p-6 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Model Performance</h1>
                <p className="mt-2 text-slate-400">
                    Evaluation metrics from the saved model results and horizon metadata.
                </p>
            </div>

            <div className="mb-8 grid gap-5 xl:grid-cols-2">
                <HorizonTrendChart
                    title="Wind-speed error by forecast horizon"
                    description="Linear Regression RMSE in knots; lower is better."
                    horizons={horizons}
                    metric="rmse"
                    color="#22d3ee"
                    formatValue={(value) => value.toFixed(1)}
                />
                <HorizonTrendChart
                    title="R² by forecast horizon"
                    description="Linear Regression fit score; closer to 1 indicates a better fit."
                    horizons={horizons}
                    metric="r2"
                    color="#818cf8"
                    formatValue={(value) => value.toFixed(2)}
                />
            </div>

            <div className="mb-8 grid gap-5 xl:grid-cols-2">
                <MetricBarChart
                    title="Regression RMSE"
                    description="One-step wind-speed prediction error in knots; lower is better."
                    items={findMetrics("Regression", "rmse")}
                    formatValue={(value) => `${value.toFixed(3)} kt`}
                    lowerIsBetter
                />
                <MetricBarChart
                    title="Regression R²"
                    description="One-step model fit score on a 0–1 scale; closer to 1 is better."
                    items={findMetrics("Regression", "r2")}
                    formatValue={(value) => value.toFixed(4)}
                    scaleMax={1}
                />
                <MetricBarChart
                    title="Classification accuracy"
                    description="Held-out test accuracy on a 0–1 scale; higher is better."
                    items={findMetrics("Classification", "accuracy")}
                    formatValue={(value) => `${(value * 100).toFixed(2)}%`}
                    scaleMax={1}
                />
                <MetricBarChart
                    title="Clustering silhouette score"
                    description="Saved K-Means score; DBSCAN has no saved evaluation score."
                    items={findMetrics("Clustering", "silhouette")}
                    formatValue={(value) => value.toFixed(4)}
                    scaleMax={1}
                />
            </div>

            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <div className="mb-5">
                    <h2 className="text-xl font-semibold">Saved evaluation data</h2>
                    <p className="mt-1 text-sm text-slate-400">
                        {metrics.length} metric records from the training evaluation results.
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-800 text-slate-400">
                                <th className="px-3 py-3">Group</th>
                                <th className="px-3 py-3">Model</th>
                                <th className="px-3 py-3">Metric</th>
                                <th className="px-3 py-3">Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {performance.models.map((item, index) => (
                                <tr
                                    key={`${item.group}-${item.model}-${item.metric}-${index}`}
                                    className="border-b border-slate-800 last:border-0"
                                >
                                    <td className="px-3 py-3">{item.group}</td>
                                    <td className="px-3 py-3">{item.model}</td>
                                    <td className="px-3 py-3">{item.metric}</td>
                                    <td className="px-3 py-3 font-semibold">
                                        {item.metric.toLowerCase().includes("accuracy")
                                            ? `${(item.value * 100).toFixed(2)}%`
                                            : item.value.toFixed(4)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="mt-4 text-xs text-slate-500">
                    RMSE bars use the largest displayed error as their scale; score bars use 1 as the upper bound. Metrics use different scales and should not be compared across charts.
                </p>
            </section>
        </div>
    );
}

export default ModelPerformance;
