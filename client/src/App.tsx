import { useEffect, useMemo, useState } from "react";
import { apiDelete, apiGet, apiPost, apiPut } from "./api";
import PageShell from "./components/layout/PageShell";
import AuthScreen from "./screens/AuthScreen";
import DashboardScreen from "./screens/DashboardScreen";
import DeleteSessionModal from "./modals/DeleteSessionModal";
import SaveSessionModal from "./modals/SaveSessionModal";
import {
  AUTH_TOKEN_KEY,
  BATTERY_TYPES,
  EMPTY_COUNTS,
  PARTICLES_KEY,
  THEME_KEY,
  lastSessionKey
} from "./lib/constants";
import { safeGet, safeRemove, safeSet } from "./lib/storage";

type User = { id: string; email: string; name?: string | null };
type Catalog = Record<string, any>;

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = safeGet(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
  });

  const [showParticles, setShowParticles] = useState(() => {
    const saved = safeGet(PARTICLES_KEY);
    if (saved === "0") return false;
    if (saved === "1") return true;
    return true;
  });

  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authStatus, setAuthStatus] = useState("");
  const [authError, setAuthError] = useState("");

  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [counts, setCounts] = useState<Record<(typeof BATTERY_TYPES)[number], number>>(() => ({
    ...EMPTY_COUNTS
  }));

  const [computed, setComputed] = useState<any>(null);
  const [sessions, setSessions] = useState<Array<{ id: string; name: string }>>([]);
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
        const token = safeGet(AUTH_TOKEN_KEY) || "";
        if (!token) {
          setAuthReady(true);
          return;
        }
        const me = await apiGet("/api/auth/me");
        setUser(me.user);
      } catch {
        safeRemove(AUTH_TOKEN_KEY);
      }
      setAuthReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    setActiveSessionId("");
    setCounts({ ...EMPTY_COUNTS });
    setComputed(null);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const data = await apiGet("/api/catalog");
        setCatalog(data.catalog);
      } catch (e: any) {
        setError(String(e.message || e));
      }
    })();
  }, [user?.id]);

  useEffect(() => {
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.body.classList.toggle("dark", isDark);
    safeSet(THEME_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  function toggleParticles() {
    setShowParticles((v) => {
      const next = !v;
      safeSet(PARTICLES_KEY, next ? "1" : "0");
      return next;
    });
  }

  function signOut() {
    if (user?.id) safeRemove(lastSessionKey(user.id));
    safeRemove(AUTH_TOKEN_KEY);
    setUser(null);
    setCatalog(null);
    setCounts({ ...EMPTY_COUNTS });
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

  function toggleAuthMode() {
    setAuthMode((m) => (m === "login" ? "register" : "login"));
    setAuthError("");
    setAuthStatus("");
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
      safeSet(AUTH_TOKEN_KEY, res.token);
      setUser(res.user);
      setComputed(null);
      setCounts({ ...EMPTY_COUNTS });
      setAuthPassword("");
      setAuthStatus("");
    } catch (e: any) {
      setAuthStatus("");
      setAuthError(String(e.message || e));
    }
  }

  async function recompute(nextCounts: typeof counts) {
    try {
      setError("");
      const data = await apiPost("/api/compute", { counts: nextCounts });
      setComputed(data);
    } catch (e: any) {
      setError(String(e.message || e));
    }
  }

  async function onCountChange(type: (typeof BATTERY_TYPES)[number], value: string) {
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
    refreshSessions().catch(() => {});
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
      safeSet(lastSessionKey(user?.id), res.id);
      await refreshSessions();
      setStatus("Saved.");
      setIsSaveOpen(false);
      setNewSessionName("");
      setTimeout(() => setStatus(""), 1200);
    } catch (e: any) {
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
    } catch (e: any) {
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
      safeRemove(lastSessionKey(user?.id));
      setCounts({ ...EMPTY_COUNTS });
      setComputed(null);
      await refreshSessions();
      setStatus("Deleted.");
      setIsDeleteOpen(false);
      setDeleteTargetId("");
      setDeleteConfirmText("");
      setTimeout(() => setStatus(""), 1200);
    } catch (e: any) {
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

  async function loadSession(id: string) {
    setError("");
    setStatus("Loading…");
    try {
      const s = await apiGet(`/api/sessions/${id}`);
      const loadedCounts = {
        MegapackXL: s.payload.counts.MegapackXL ?? 0,
        Megapack2: s.payload.counts.Megapack2 ?? 0,
        Megapack: s.payload.counts.Megapack ?? 0,
        PowerPack: s.payload.counts.PowerPack ?? 0
      };
      setCounts(loadedCounts);
      setComputed(s.payload);
      setActiveSessionId(id);
      safeSet(lastSessionKey(user?.id), id);
      setStatus("");
    } catch (e: any) {
      setStatus("");
      setError(String(e.message || e));
    }
  }

  async function createNewSession() {
    setError("");
    setStatus("");
    setSaveError("");
    setActiveSessionId("");
    safeRemove(lastSessionKey(user?.id));
    setCounts({ ...EMPTY_COUNTS });
    setComputed(null);
    setNewSessionName("");
  }

  if (!authReady) {
    return (
      <div className={theme === "dark" ? "dark" : ""}>
        <PageShell theme={theme} showParticles={showParticles} center>
          <div className="relative z-10 rounded-2xl bg-white dark:bg-[#111C2D] shadow-sm border border-zinc-200 dark:border-[#26334A] p-6 w-full max-w-xl">
            <div className="text-xl font-semibold text-zinc-900 dark:text-[#E9F0FA]">Loading…</div>
          </div>
        </PageShell>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={theme === "dark" ? "dark" : ""}>
        <PageShell theme={theme} showParticles={showParticles} center>
          <AuthScreen
            theme={theme}
            showParticles={showParticles}
            onToggleTheme={toggleTheme}
            onToggleParticles={toggleParticles}
            authMode={authMode}
            onToggleMode={toggleAuthMode}
            authName={authName}
            setAuthName={setAuthName}
            authEmail={authEmail}
            setAuthEmail={setAuthEmail}
            authPassword={authPassword}
            setAuthPassword={setAuthPassword}
            authStatus={authStatus}
            authError={authError}
            onSubmit={submitAuth}
          />
        </PageShell>
      </div>
    );
  }

  if (!catalog) {
    return (
      <div className={theme === "dark" ? "dark" : ""}>
        <PageShell theme={theme} showParticles={showParticles} center>
          <div className="relative z-10 rounded-2xl bg-white dark:bg-[#111C2D] shadow-sm border border-zinc-200 dark:border-[#26334A] p-6 w-full max-w-xl">
            <div className="text-xl font-semibold text-zinc-900 dark:text-[#E9F0FA]">Loading…</div>
            {error && <div className="mt-3 text-sm text-red-500">{error}</div>}
          </div>
        </PageShell>
      </div>
    );
  }

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <PageShell theme={theme} showParticles={showParticles}>
        <DashboardScreen
          user={user}
          theme={theme}
          showParticles={showParticles}
          onToggleTheme={toggleTheme}
          onToggleParticles={toggleParticles}
          onSignOut={signOut}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onLoadSession={loadSession}
          onNewSession={createNewSession}
          onOpenSaveModal={openSaveModal}
          onUpdateSession={updateSession}
          onDeleteSession={deleteActiveSession}
          status={status}
          error={error}
          catalog={catalog}
          counts={counts}
          onCountChange={onCountChange}
          transformerCount={transformerCount}
          computed={computed}
        >
          {isSaveOpen && (
            <SaveSessionModal
              status={status}
              value={newSessionName}
              setValue={setNewSessionName}
              error={saveError}
              onSave={saveNewSession}
              onClose={closeSaveModal}
            />
          )}

          {isDeleteOpen && (
            <DeleteSessionModal
              status={status}
              targetLabel={sessions.find((s) => s.id === deleteTargetId)?.name || deleteTargetId}
              confirmText={deleteConfirmText}
              setConfirmText={setDeleteConfirmText}
              onConfirm={confirmDeleteSession}
              onClose={closeDeleteModal}
            />
          )}
        </DashboardScreen>
      </PageShell>
    </div>
  );
}

