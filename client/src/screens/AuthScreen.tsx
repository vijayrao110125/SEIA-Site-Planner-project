export default function AuthScreen({
  theme,
  showParticles,
  onToggleTheme,
  onToggleParticles,
  authMode,
  onToggleMode,
  authName,
  setAuthName,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authStatus,
  authError,
  onSubmit
}: {
  theme: "light" | "dark";
  showParticles: boolean;
  onToggleTheme: () => void;
  onToggleParticles: () => void;
  authMode: "login" | "register";
  onToggleMode: () => void;
  authName: string;
  setAuthName: (v: string) => void;
  authEmail: string;
  setAuthEmail: (v: string) => void;
  authPassword: string;
  setAuthPassword: (v: string) => void;
  authStatus: string;
  authError: string;
  onSubmit: () => void;
}) {
  return (
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
            onClick={onToggleTheme}
            className="group inline-flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-[#C2CDDD]"
            aria-label="Toggle dark mode"
          >
            <span className="relative inline-flex h-6 w-6 items-center justify-center" aria-hidden="true">
              {/* Sun */}
              <svg
                viewBox="0 0 24 24"
                className={`absolute h-5 w-5 transition-all ${
                  theme === "dark" ? "opacity-0 scale-90" : "opacity-100 scale-100"
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
                className={`absolute h-5 w-5 transition-all ${
                  theme === "dark" ? "opacity-100 scale-100" : "opacity-0 scale-90"
                }`}
              >
                <path className="fill-current" d="M21 14.5A8.5 8.5 0 0 1 9.5 3a8.5 8.5 0 1 0 11.5 11.5z" />
              </svg>
            </span>
            <span className="relative inline-flex h-6 w-11 items-center rounded-full border border-zinc-300 dark:border-[#2E3E5C] bg-zinc-200 dark:bg-[#16253A] transition-colors">
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  theme === "dark" ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </span>
          </button>

          <button
            onClick={onToggleParticles}
            className="rounded-xl border border-zinc-300 dark:border-[#2E3E5C] bg-white dark:bg-[#0B1525] text-zinc-700 dark:text-[#D5DEEB] px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-[#16253A]"
          >
            {showParticles ? "Animation: On" : "Animation: Off"}
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
              if (e.key === "Enter") onSubmit();
            }}
          />
        )}
        <input
          className="w-full rounded-xl border border-zinc-300 dark:border-[#2E3E5C] bg-white dark:bg-[#0B1525] text-zinc-900 dark:text-[#E9F0FA] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700"
          placeholder="Email"
          value={authEmail}
          onChange={(e) => setAuthEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
          }}
        />
        <input
          className="w-full rounded-xl border border-zinc-300 dark:border-[#2E3E5C] bg-white dark:bg-[#0B1525] text-zinc-900 dark:text-[#E9F0FA] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700"
          placeholder="Password"
          type="password"
          value={authPassword}
          onChange={(e) => setAuthPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
          }}
        />
      </div>

      {authError && <div className="mt-3 text-sm text-red-500">{authError}</div>}
      {authStatus && <div className="mt-3 text-sm text-zinc-500 dark:text-[#AAB6C9]">{authStatus}</div>}

      <div className="mt-5 flex items-center justify-between gap-2">
        <button
          className="text-sm text-zinc-600 dark:text-[#C2CDDD] hover:underline"
          onClick={onToggleMode}
          disabled={!!authStatus}
        >
          {authMode === "login" ? "Create an account" : "I already have an account"}
        </button>
        <button
          className="rounded-xl bg-blue-600 text-white px-3 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          onClick={onSubmit}
          disabled={!!authStatus}
        >
          {authMode === "login" ? "Sign in" : "Create"}
        </button>
      </div>
    </div>
  );
}

