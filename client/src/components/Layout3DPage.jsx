import { useLocation, useNavigate } from "react-router-dom";
import Layout3D from "../components/Layout3D.jsx";

export default function Layout3DPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const computed = state?.computed ?? null;
  const theme = state?.theme ?? (localStorage.getItem("seia:theme") || "light");

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">3D Layout</h1>
            <button
              onClick={() => navigate("/")}
              className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800"
            >
              Back to 2D
            </button>
          </div>

          {!computed ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 shadow p-6 text-slate-700 dark:text-slate-200">
              No layout data found. Go back to 2D and click “View 3D Layout”.
            </div>
          ) : (
            <Layout3D computed={computed} theme={theme} />
          )}
        </div>
      </div>
    </div>
  );
}
