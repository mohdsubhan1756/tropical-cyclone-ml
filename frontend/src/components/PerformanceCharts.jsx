function MetricBarChart({ title, description, items, formatValue, lowerIsBetter = false, scaleMax }) {
    const maxValue = scaleMax ?? Math.max(...items.map((item) => item.value), 0);

    return (
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-5">
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="mt-1 text-sm text-slate-400">{description}</p>
            </div>
            {items.length === 0 ? (
                <p className="text-sm text-slate-500">No saved metrics are available.</p>
            ) : (
                <div className="space-y-5">
                {items.map((item) => (
                    <div key={item.label}>
                        <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                            <span className="truncate text-slate-300">{item.label}</span>
                            <span className="shrink-0 font-semibold text-white">
                                {formatValue(item.value)}
                            </span>
                        </div>
                        <div
                            className="h-2.5 overflow-hidden rounded-full bg-slate-800"
                            role="img"
                            aria-label={`${item.label}: ${formatValue(item.value)}`}
                        >
                            <div
                                className={`h-full rounded-full ${lowerIsBetter ? "bg-cyan-400" : "bg-blue-500"}`}
                                style={{
                                    width: `${maxValue > 0 ? Math.max(0, Math.min(100, (item.value / maxValue) * 100)) : 0}%`,
                                }}
                            />
                        </div>
                    </div>
                ))}
                </div>
            )}
        </section>
    );
}

function HorizonTrendChart({ title, description, horizons, metric, color, formatValue }) {
    const data = [...horizons].sort((a, b) => a.horizon_hours - b.horizon_hours);
    if (data.length === 0) {
        return (
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="mt-1 text-sm text-slate-400">{description}</p>
                <p className="mt-6 text-sm text-slate-500">No horizon data is available.</p>
            </section>
        );
    }
    const values = data.map((item) => item[metric]);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || Math.max(Math.abs(maxValue) * 0.1, 1);
    const chart = { left: 58, right: 570, top: 24, bottom: 210 };
    const x = (index) => chart.left + (data.length === 1 ? 0 : (index / (data.length - 1)) * (chart.right - chart.left));
    const y = (value) => chart.bottom - ((value - minValue) / range) * (chart.bottom - chart.top);
    const points = data.map((item, index) => `${x(index)},${y(item[metric])}`).join(" ");

    return (
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4">
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="mt-1 text-sm text-slate-400">{description}</p>
            </div>
            <svg
                className="h-64 w-full overflow-visible"
                viewBox="0 0 600 260"
                role="img"
                aria-label={`${title} across forecast horizons`}
            >
                {[0, 1, 2, 3].map((tick) => {
                    const value = minValue + (range * tick) / 3;
                    const tickY = chart.bottom - ((value - minValue) / range) * (chart.bottom - chart.top);
                    return (
                        <g key={tick}>
                            <line x1={chart.left} y1={tickY} x2={chart.right} y2={tickY} stroke="#334155" strokeDasharray="4 5" />
                            <text x="0" y={tickY + 4} fill="#94a3b8" fontSize="12">
                                {formatValue(value)}
                            </text>
                        </g>
                    );
                })}
                <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                {data.map((item, index) => (
                    <g key={item.horizon_hours}>
                        <circle cx={x(index)} cy={y(item[metric])} r="5" fill={color} stroke="#0f172a" strokeWidth="2">
                            <title>{item.horizon_hours} hours: {formatValue(item[metric])}</title>
                        </circle>
                        <text x={x(index)} y="238" textAnchor="middle" fill="#cbd5e1" fontSize="12">
                            {item.horizon_hours}h
                        </text>
                    </g>
                ))}
            </svg>
        </section>
    );
}

function ComparisonBarChart({ currentValue, predictedValue, horizonLabel }) {
    const maxValue = Math.max(currentValue, predictedValue, 1);
    const values = [
        { label: "Current wind", value: currentValue, color: "bg-slate-500" },
        { label: horizonLabel, value: predictedValue, color: "bg-cyan-400" },
    ];

    return (
        <div className="space-y-5" role="img" aria-label={`Current wind ${currentValue} knots; ${horizonLabel} ${predictedValue} knots`}>
            {values.map((item) => (
                <div key={item.label}>
                    <div className="mb-2 flex justify-between gap-3 text-sm">
                        <span className="text-slate-300">{item.label}</span>
                        <span className="font-semibold">{item.value.toFixed(2)} kt</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                        <div
                            className={`h-full rounded-full ${item.color}`}
                            style={{ width: `${(item.value / maxValue) * 100}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

function LocationPlot({ latitude, longitude }) {
    const left = 56;
    const right = 450;
    const top = 28;
    const bottom = 190;
    const x = left + ((longitude + 180) / 360) * (right - left);
    const y = bottom - ((latitude + 90) / 180) * (bottom - top);
    const longitudes = [-180, -90, 0, 90, 180];
    const latitudes = [-90, -45, 0, 45, 90];

    return (
        <svg
            className="h-56 w-full"
            viewBox="0 0 500 245"
            role="img"
            aria-label={`Submitted location at latitude ${latitude}, longitude ${longitude}; plotted on longitude and latitude axes, not a map.`}
        >
            {longitudes.map((value) => {
                const gridX = left + ((value + 180) / 360) * (right - left);
                return (
                    <g key={value}>
                        <line x1={gridX} y1={top} x2={gridX} y2={bottom} stroke="#334155" strokeDasharray="4 5" />
                        <text x={gridX} y="212" textAnchor="middle" fill="#94a3b8" fontSize="11">{value}°</text>
                    </g>
                );
            })}
            {latitudes.map((value) => {
                const gridY = bottom - ((value + 90) / 180) * (bottom - top);
                return (
                    <g key={value}>
                        <line x1={left} y1={gridY} x2={right} y2={gridY} stroke="#334155" strokeDasharray="4 5" />
                        <text x="48" y={gridY + 4} textAnchor="end" fill="#94a3b8" fontSize="11">{value}°</text>
                    </g>
                );
            })}
            <circle cx={x} cy={y} r="7" fill="#22d3ee" stroke="#e0f2fe" strokeWidth="2">
                <title>{latitude}° latitude, {longitude}° longitude</title>
            </circle>
            <text x={(left + right) / 2} y="238" textAnchor="middle" fill="#cbd5e1" fontSize="12">Longitude</text>
        </svg>
    );
}

export { ComparisonBarChart, HorizonTrendChart, LocationPlot, MetricBarChart };
