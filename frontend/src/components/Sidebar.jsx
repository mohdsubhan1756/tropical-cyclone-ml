function Sidebar({ page, setPage }) {
    const menuItems = [
        {
            id: "dashboard",
            label: "Dashboard",
            icon: "⌂",
        },
        {
            id: "pattern-analysis",
            label: "Pattern Analysis",
            icon: "◉",
        },
        {
            id: "intensity-prediction",
            label: "Intensity Prediction",
            icon: "◈",
        },
        {
            id: "performance",
            label: "Model Performance",
            icon: "▥",
        },
    ];

    return (
        <aside className="app-sidebar w-64 min-h-screen bg-slate-900 border-r border-slate-800 p-5">

            <div className="sidebar-brand mb-10">
                <h1 className="text-xl font-bold text-white">
                    Cyclone AI
                </h1>

                <p className="text-xs text-slate-500 mt-1">
                    Tropical Cyclone Analysis
                </p>
            </div>

            <nav className="sidebar-nav space-y-2">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setPage(item.id)}
                        className={`nav-item w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${page === item.id
                            ? "bg-blue-600 text-white"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            }`}
                    >
                        <span className="text-lg">
                            {item.icon}
                        </span>

                        <span className="text-sm font-medium">
                            {item.label}
                        </span>
                    </button>
                ))}
            </nav>

            {/* <div className="sidebar-footer mt-10 pt-6 border-t border-slate-800">
                <p className="text-xs text-slate-600">
                    AIML Course Based Project
                </p>

                <p className="text-xs text-slate-600 mt-1">
                    Tropical Cyclone Pattern Analysis
                </p>
            </div> */}

        </aside>
    );
}

export default Sidebar;