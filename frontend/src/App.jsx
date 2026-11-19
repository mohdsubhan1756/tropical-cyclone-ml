import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import PatternAnalysis from "./pages/PatternAnalysis";
import IntensityPrediction from "./pages/IntensityPrediction";
import ModelPerformance from "./pages/ModelPerformance";

function App() {
  const [page, setPage] = useState("dashboard");

  const renderPage = () => {
    switch (page) {
      case "pattern-analysis":
        return <PatternAnalysis />;

      case "intensity-prediction":
        return <IntensityPrediction />;

      case "performance":
        return <ModelPerformance />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-shell min-h-screen bg-slate-950 text-white flex">
      <Sidebar page={page} setPage={setPage} />

      <main className="app-main flex-1 min-w-0">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;