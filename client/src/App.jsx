import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "./api.js";
import DeviceCard from "./components/DeviceCard.jsx";
import SummaryCard from "./components/SummaryCard.jsx";
import LayoutView from "./components/LayoutView.jsx";
import SessionsBar from "./components/SessionsBar.jsx";
import StarsCanvas from "./canvas/StarsCanvas.jsx";

const BATTERY_TYPES = ["MegapackXL", "Megapack2", "Megapack", "PowerPack"];
const AUTH_TOKEN_KEY = "seia:token";
const lastSessionKey = (userId) => `seia:lastSessionId:${userId || "anon"}`;
const EMPTY_COUNTS = {
  MegapackXL: 0,
  Megapack2: 0,
  Megapack: 0,
  PowerPack: 0
};

export default function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("seia:theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
  });

  const [showParticles, setShowParticles] = useState(() => {
    const saved = localStorage.getItem("seia:particles");
    if (saved === "0") return false;
    if (saved === "1") return true;
    return true;
  });

  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authStatus, setAuthStatus] = useState("");
  const [authError, setAuthError] = useState("");

  const [catalog, setCatalog] = useState(null);
  const [counts, setCounts] = useState(EMPTY_COUNTS);

  const [computed, setComputed] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const batteryCount = useMemo(
    () => BATTERY_TYPES.reduce((s, t) => s + (Number(counts[t]) || 0), 0),
    [counts]
  );
  const transformerCount = Math.ceil(batteryCount / 2);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY) || "";
        if (!token) {
          setAuthReady(true);
          return;
        }
        const me = await apiGet("/api/auth/me");
        setUser(me.user);
      } catch (e) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
      setAuthReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    setActiveSessionId("");
    setCounts(EMPTY_COUNTS);
    setComputed(null);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const data = await apiGet("/api/catalog");
        setCatalog(data.catalog);
      } catch (e) {
        setError(String(e.message || e));
      }
    })();
  }, [user?.id]);

  useEffect(() => {
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.body.classList.toggle("dark", isDark);
    localStorage.setItem("seia:theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  function toggleParticles() {
    setShowParticles((v) => {
      const next = !v;
      localStorage.setItem("seia:particles", next ? "1" : "0");
      return next;
    });
  }

  function signOut() {
    if (user?.id) localStorage.removeItem(lastSessionKey(user.id));
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
    setCatalog(null);
    setCounts(EMPTY_COUNTS);
    setSessions([]);
    setActiveSessionId("");
    setComputed(null);
    setStatus("");
    setError("");
    setSaveError("");
    setIsSaveOpen(false);
    setIsDeleteOpen(false);
    setDeleteTargetId("");
    setDeleteConfirmText("");
  }

  async function submitAuth() {
    const name = authName.trim();
    const email = authEmail.trim();
    const password = authPassword;
    setAuthError("");
    setAuthStatus(authMode === "login" ? "Signing in…" : "Creating account…");
    try {
      const path = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
      if (authMode === "register" && !name) {
        setAuthStatus("");
        setAuthError("Name is required.");
        return;
      }
      const payload = authMode === "register" ? { name, email, password } : { email, password };
      const res = await apiPost(path, payload);
      localStorage.setItem(AUTH_TOKEN_KEY, res.token);
      setUser(res.user);
      setComputed(null);
      setCounts(EMPTY_COUNTS);
      setAuthPassword("");
      setAuthStatus("");
    } catch (e) {
      setAuthStatus("");
      setAuthError(String(e.message || e));
    }
  }

  async function recompute(nextCounts) {
    try {
      setError("");
      const data = await apiPost("/api/compute", { counts: nextCounts });
      setComputed(data);
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  async function onCountChange(type, value) {
    const v = Math.max(0, Math.floor(Number(value || 0)));
    const next = { ...counts, [type]: v };
    setCounts(next);
    await recompute(next);
  }

  async function refreshSessions() {
    if (!user?.id) return;
    const data = await apiGet("/api/sessions");
    setSessions(data.sessions);
  }

  useEffect(() => {
    refreshSessions().catch(() => { });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function saveNewSession() {
    const name = newSessionName.trim();
    setStatus("Saving…");
    setError("");
    setSaveError("");
    if (!name) {
      setStatus("");
      setSaveError("Session name is required.");
      return;
    }
    try {
      const res = await apiPost("/api/sessions", { name, counts });
      setActiveSessionId(res.id);
      localStorage.setItem(lastSessionKey(user?.id), res.id);
      await refreshSessions();
      setStatus("Saved.");
      setIsSaveOpen(false);
      setNewSessionName("");
      setTimeout(() => setStatus(""), 1200);
    } catch (e) {
      setStatus("");
      if (e?.status === 409) {
        setSaveError("Session name already exists.");
      } else {
        setSaveError(String(e.message || e));
      }
    }
  }

  async function updateSession() {
    if (!activeSessionId) return;
    setStatus("Updating…");
    setError("");
    try {
      await apiPut(`/api/sessions/${activeSessionId}`, {
        name: sessions.find((s) => s.id === activeSessionId)?.name ?? "",
        counts
      });
      await refreshSessions();
      setStatus("Updated.");
      setTimeout(() => setStatus(""), 1200);
    } catch (e) {
      setStatus("");
      if (e?.status === 409) {
        setError("Session name already exists.");
      } else {
        setError(String(e.message || e));
      }
    }
  }

  async function deleteActiveSession() {
    if (!activeSessionId) return;
    setDeleteTargetId(activeSessionId);
    setDeleteConfirmText("");
    setIsDeleteOpen(true);
  }

  async function confirmDeleteSession() {
    if (!deleteTargetId) return;
    setStatus("Deleting…");
    setError("");
    try {
      await apiDelete(`/api/sessions/${deleteTargetId}`);
      setActiveSessionId("");
      localStorage.removeItem(lastSessionKey(user?.id));
      const resetCounts = {
        MegapackXL: 0,
        Megapack2: 0,
        Megapack: 0,
        PowerPack: 0
      };
      setCounts(resetCounts);
      setComputed(null);
      await refreshSessions();
      setStatus("Deleted.");
      setIsDeleteOpen(false);
      setDeleteTargetId("");
      setDeleteConfirmText("");
      setTimeout(() => setStatus(""), 1200);
    } catch (e) {
      setStatus("");
      setError(String(e.message || e));
    }
  }

  function closeDeleteModal() {
    if (status === "Deleting…") return;
    setIsDeleteOpen(false);
    setDeleteTargetId("");
    setDeleteConfirmText("");
  }

  function openSaveModal() {
    setNewSessionName("");
    setIsSaveOpen(true);
  }

  function closeSaveModal() {
    if (status === "Saving…") return;
    setIsSaveOpen(false);
  }

  async function loadSession(id) {
    setError("");
    setStatus("Loading…");
    try {
      const s = await apiGet(`/api/sessions/${id}`);
      const loadedCounts = {
        MegapackXL: s.payload.counts.MegapackXL,
        Megapack2: s.payload.counts.Megapack2,
        Megapack: s.payload.counts.Megapack,
        PowerPack: s.payload.counts.PowerPack
      };
      setCounts(loadedCounts);
      setComputed(s.payload);
      setActiveSessionId(id);
      localStorage.setItem(lastSessionKey(user?.id), id);
      setStatus("");
    } catch (e) {
      setStatus("");
      setError(String(e.message || e));
    }
  }
  async function createNewSession() {
    setError("");
    setStatus("");
    setSaveError("");

    setActiveSessionId("");
    localStorage.removeItem(lastSessionKey(user?.id));

    const empty = {
      MegapackXL: 0,
      Megapack2: 0,
      Megapack: 0,
      PowerPack: 0
    };

    setCounts(empty);
    setComputed(null);
    setNewSessionName("");
  }

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0F1B2A] relative overflow-hidden flex items-center justify-center p-6">
        {showParticles && <StarsCanvas theme={theme} />}
        <div className="relative z-10 rounded-2xl bg-white dark:bg-[#111C2D] shadow-sm border border-zinc-200 dark:border-[#26334A] p-6 w-full max-w-xl">
          <div className="text-xl font-semibold text-zinc-900 dark:text-[#E9F0FA]">Loading…</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={theme === "dark" ? "dark" : ""}>
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0F1B2A] relative overflow-hidden flex items-center justify-center p-6">
          {showParticles && <StarsCanvas theme={theme} />}
          <div className="relative z-10 rounded-2xl bg-white dark:bg-[#111C2D] shadow-sm p-6 w-full max-w-md border border-zinc-200 dark:border-[#26334A]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xl font-semibold text-zinc-900 dark:text-[#E9F0FA]">
                  {authMode === "login" ? "Sign in" : "Create account"}
                </div>
                <div className="text-sm text-zinc-500 dark:text-[#AAB6C9] mt-1">
                  Sign in to view and save your sessions.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="group inline-flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-[#C2CDDD]"
                  aria-label="Toggle dark mode"
                >
                  <span className="relative inline-flex h-6 w-6 items-center justify-center" aria-hidden="true">
                    {/* Sun */}
                    <svg
                      viewBox="0 0 24 24"
                      className={`absolute h-5 w-5 transition-all ${theme === "dark" ? "opacity-0 scale-90" : "opacity-100 scale-100"
                        }`}
                    >
                      <path
                        className="fill-current"
                        d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zm0-16h1.5V5H12V2zm0 17h1.5v3H12v-3zM4.22 5.64 5.64 4.22 7.76 6.34 6.34 7.76 4.22 5.64zm12.02 12.02 1.42-1.42 2.12 2.12-1.42 1.42-2.12-2.12zM2 10.5h3v1.5H2v-1.5zm17 0h3v1.5h-3v-1.5zM4.22 18.36l2.12-2.12 1.42 1.42-2.12 2.12-1.42-1.42zM16.24 6.34l2.12-2.12 1.42 1.42-2.12 2.12-1.42-1.42z"
                      />
                    </svg>
                    {/* Moon */}
                    <svg
                      viewBox="0 0 24 24"
                      className={`absolute h-5 w-5 transition-all ${theme === "dark" ? "opacity-100 scale-100" : "opacity-0 scale-90"
                        }`}
                    >
                      <path
                        className="fill-current"
                        d="M21 14.5A8.5 8.5 0 0 1 9.5 3a8.5 8.5 0 1 0 11.5 11.5z"
                      />
                    </svg>
                  </span>
                  <span className="relative inline-flex h-6 w-11 items-center rounded-full border border-zinc-300 dark:border-[#2E3E5C] bg-zinc-200 dark:bg-[#16253A] transition-colors">
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${theme === "dark" ? "translate-x-5" : "translate-x-1"
                        }`}
                    />
                  </span>
                </button>

                <button
                  onClick={toggleParticles}
                  className="rounded-xl border border-zinc-300 dark:border-[#2E3E5C] bg-white dark:bg-[#0B1525] text-zinc-700 dark:text-[#D5DEEB] px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-[#16253A]"
                >
                  {showParticles ? "Particles: On" : "Particles: Off"}
                </button>
              </div>

            </div>

            <div className="mt-5 space-y-3">
              {authMode === "register" && (
                <input
                  className="w-full rounded-xl border border-zinc-300 dark:border-[#2E3E5C] bg-white dark:bg-[#0B1525] text-zinc-900 dark:text-[#E9F0FA] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700"
                  placeholder="Full name"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitAuth();
                  }}
                />
              )}
              <input
                className="w-full rounded-xl border border-zinc-300 dark:border-[#2E3E5C] bg-white dark:bg-[#0B1525] text-zinc-900 dark:text-[#E9F0FA] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700"
                placeholder="Email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitAuth();
                }}
              />
              <input
                className="w-full rounded-xl border border-zinc-300 dark:border-[#2E3E5C] bg-white dark:bg-[#0B1525] text-zinc-900 dark:text-[#E9F0FA] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700"
                placeholder="Password"
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitAuth();
                }}
              />
            </div>

            {authError && <div className="mt-3 text-sm text-red-500">{authError}</div>}
            {authStatus && (
              <div className="mt-3 text-sm text-zinc-500 dark:text-[#AAB6C9]">{authStatus}</div>
            )}

            <div className="mt-5 flex items-center justify-between gap-2">
              <button
                className="text-sm text-zinc-600 dark:text-[#C2CDDD] hover:underline"
                onClick={() => {
                  setAuthMode((m) => (m === "login" ? "register" : "login"));
                  setAuthError("");
                  setAuthStatus("");
                }}
                disabled={!!authStatus}
              >
                {authMode === "login" ? "Create an account" : "I already have an account"}
              </button>
              <button
                className="rounded-xl bg-blue-600 text-white px-3 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                onClick={submitAuth}
                disabled={!!authStatus}
              >
                {authMode === "login" ? "Sign in" : "Create"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!catalog) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0F1B2A] relative overflow-hidden flex items-center justify-center p-6">
        {showParticles && <StarsCanvas theme={theme} />}
        <div className="relative z-10 rounded-2xl bg-white dark:bg-[#111C2D] shadow-sm border border-zinc-200 dark:border-[#26334A] p-6 w-full max-w-xl">
          <div className="text-xl font-semibold text-zinc-900 dark:text-[#E9F0FA]">Loading…</div>
          {error && <div className="mt-3 text-sm text-red-500">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0F1B2A] relative overflow-hidden">
        {showParticles && <StarsCanvas theme={theme} />}
        <div className="foreground relative z-10">
          <header className="border-b border-zinc-200 dark:border-[#26334A] bg-white/80 dark:bg-[#0B1525]/70 backdrop-blur">
            <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
	            <div className="lg:max-w-xl">
	              <h1 className="text-xl font-semibold text-zinc-900 dark:text-[#E9F0FA]">SEIA Site Planner</h1>
	              <p className="text-sm text-zinc-500 dark:text-[#AAB6C9]">
	                Configure devices → auto-add transformers → generate 100ft-max layout.
              </p>
              <div className="text-xs text-zinc-500 dark:text-[#AAB6C9] mt-1">
                Signed in as{" "}
                <span className="font-medium text-zinc-700 dark:text-[#D5DEEB]">
                  {user.name || user.email}
                </span>
              </div>
            </div>

	            <div className="flex flex-col lg:items-end gap-2 w-full lg:w-auto">
	              <div className="flex items-center justify-end gap-2 w-full">
	                <button
	                  onClick={toggleTheme}
	                  className="group inline-flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-[#C2CDDD]"
                  aria-label="Toggle dark mode"
                >
                  <span className="relative inline-flex h-6 w-6 items-center justify-center" aria-hidden="true">
                    {/* Sun */}
                    <svg
                      viewBox="0 0 24 24"
                      className={`absolute h-5 w-5 transition-all ${theme === "dark" ? "opacity-0 scale-90" : "opacity-100 scale-100"
                        }`}
                    >
                      <path
                        className="fill-current"
                        d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zm0-16h1.5V5H12V2zm0 17h1.5v3H12v-3zM4.22 5.64 5.64 4.22 7.76 6.34 6.34 7.76 4.22 5.64zm12.02 12.02 1.42-1.42 2.12 2.12-1.42 1.42-2.12-2.12zM2 10.5h3v1.5H2v-1.5zm17 0h3v1.5h-3v-1.5zM4.22 18.36l2.12-2.12 1.42 1.42-2.12 2.12-1.42-1.42zM16.24 6.34l2.12-2.12 1.42 1.42-2.12 2.12-1.42-1.42z"
                      />
                    </svg>
                    {/* Moon */}
                    <svg
                      viewBox="0 0 24 24"
                      className={`absolute h-5 w-5 transition-all ${theme === "dark" ? "opacity-100 scale-100" : "opacity-0 scale-90"
                        }`}
                    >
                      <path
                        className="fill-current"
                        d="M21 14.5A8.5 8.5 0 0 1 9.5 3a8.5 8.5 0 1 0 11.5 11.5z"
                      />
                    </svg>
                  </span>
                  <span className="relative inline-flex h-6 w-11 items-center rounded-full border border-zinc-300 dark:border-[#2E3E5C] bg-zinc-200 dark:bg-[#16253A] transition-colors">
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${theme === "dark" ? "translate-x-5" : "translate-x-1"
                        }`}
                    />
	                  </span>
	                </button>

                  <button
                    onClick={toggleParticles}
                    className="rounded-xl border border-zinc-300 dark:border-[#2E3E5C] bg-white dark:bg-[#0B1525] text-zinc-700 dark:text-[#D5DEEB] px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-[#16253A]"
                  >
                    {showParticles ? "Particles: On" : "Particles: Off"}
                  </button>

	                <button
	                  onClick={signOut}
	                  className="rounded-xl border border-zinc-300 dark:border-[#2E3E5C] bg-white dark:bg-[#0B1525] text-zinc-700 dark:text-[#D5DEEB] px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-[#16253A]"
	                >
	                  Sign out
	                </button>
	              </div>
              <SessionsBar
                sessions={sessions}
                activeSessionId={activeSessionId}
                onLoad={loadSession}
                onNewSession={createNewSession}
                onSaveNew={openSaveModal}
                onUpdate={updateSession}
                onDelete={deleteActiveSession}
                status={status}
              />
            </div>
            </div>
          </header>

          {error && (
            <div className="border-b border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40">
              <div className="mx-auto max-w-6xl px-4 py-2 text-sm text-red-700 dark:text-red-300 text-center">
                {error}
              </div>
            </div>
          )}

	        <main className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
	          <section className="lg:col-span-1 space-y-4">
	            <div className="rounded-2xl bg-white dark:bg-[#111C2D] shadow-sm border border-zinc-200 dark:border-[#26334A] p-4">
	              <div className="text-sm font-semibold text-zinc-800 dark:text-[#E9F0FA] mb-3">Device configuration</div>

              <div className="space-y-3">
                {BATTERY_TYPES.map((type) => (
                  <DeviceCard
                    key={type}
                    type={type}
                    def={catalog[type]}
                    value={counts[type]}
                    onChange={(v) => onCountChange(type, v)}
                  />
                ))}

                <div className="rounded-xl border border-zinc-200 dark:border-[#26334A] p-3 bg-zinc-50 dark:bg-[#0E1A2B]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-zinc-800 dark:text-[#E9F0FA]">Transformer</div>
                      <div className="text-xs text-zinc-500 dark:text-[#AAB6C9] mt-0.5">
                        {catalog["Transformer"].w}ft × {catalog["Transformer"].d}ft • {catalog["Transformer"].energyMWh} MWh • ${catalog["Transformer"].cost.toLocaleString()}
                        {catalog["Transformer"].release ? ` • ${catalog["Transformer"].release}` : ""}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-[#AAB6C9]">
                        Rule: 1 transformer per 2 industrial batteries
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-zinc-900 dark:text-[#E9F0FA]">{transformerCount}</div>
                  </div>
                </div>
              </div>

            </div>

            <SummaryCard computed={computed} />
          </section>

          <section className="lg:col-span-2">
            <LayoutView computed={computed} theme={theme} />
          </section>
        </main>

	        <footer className="py-8 text-center text-xs text-zinc-500 dark:text-[#8090AA]">
	          Frontend and API running
	        </footer>

        {isSaveOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={closeSaveModal}
              aria-hidden="true"
            />
            <div className="relative w-full max-w-md mx-4 rounded-2xl bg-white dark:bg-[#111C2D] shadow-xl border border-zinc-200 dark:border-[#26334A] p-5">
              <div className="text-base font-semibold text-zinc-900 dark:text-[#E9F0FA]">
                Save session
              </div>
              <div className="text-sm text-zinc-500 dark:text-[#AAB6C9] mt-1">
                Give this configuration a name (required).
              </div>
              <input
                autoFocus
                className="mt-4 w-full rounded-xl border border-zinc-300 dark:border-[#2E3E5C] bg-white dark:bg-[#0B1525] text-zinc-900 dark:text-[#E9F0FA] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700"
                placeholder="e.g., Q1 buildout"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveNewSession();
                  if (e.key === "Escape") closeSaveModal();
                }}
              />
              {saveError && <div className="mt-3 text-sm text-red-500">{saveError}</div>}
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  className="rounded-xl border border-zinc-300 dark:border-[#2E3E5C] bg-white dark:bg-[#0B1525] text-zinc-700 dark:text-[#D5DEEB] px-3 py-2 text-sm font-medium"
                  onClick={closeSaveModal}
                >
                  Cancel
                </button>
                <button
                  className="rounded-xl bg-blue-600 text-white px-3 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  onClick={saveNewSession}
                  disabled={status === "Saving…"}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
	        )}

        {isDeleteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={closeDeleteModal}
              aria-hidden="true"
            />
            <div className="relative w-full max-w-md mx-4 rounded-2xl bg-white dark:bg-[#111C2D] shadow-xl border border-zinc-200 dark:border-[#26334A] p-5">
              <div className="text-base font-semibold text-zinc-900 dark:text-[#E9F0FA]">
                Delete session
              </div>
              <div className="text-sm text-zinc-500 dark:text-[#AAB6C9] mt-1">
                This action cannot be undone. Type <span className="font-semibold">DELETE</span> to confirm removing{" "}
                <span className="font-semibold">
                  {sessions.find((s) => s.id === deleteTargetId)?.name || deleteTargetId}
                </span>
                .
              </div>
              <input
                autoFocus
                className="mt-4 w-full rounded-xl border border-zinc-300 dark:border-[#2E3E5C] bg-white dark:bg-[#0B1525] text-zinc-900 dark:text-[#E9F0FA] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700"
                placeholder="Type DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") closeDeleteModal();
                  if (e.key === "Enter" && deleteConfirmText === "DELETE") confirmDeleteSession();
                }}
              />
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  className="rounded-xl border border-zinc-300 dark:border-[#2E3E5C] bg-white dark:bg-[#0B1525] text-zinc-700 dark:text-[#D5DEEB] px-3 py-2 text-sm font-medium"
                  onClick={closeDeleteModal}
                >
                  Cancel
                </button>
                <button
                  className="rounded-xl bg-blue-600 text-white px-3 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  onClick={confirmDeleteSession}
                  disabled={status === "Deleting…" || deleteConfirmText !== "DELETE"}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
	        )}
        </div>
      </div>
    </div>
  );
}
