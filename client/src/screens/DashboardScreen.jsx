import DeviceCard from "../components/cards/DeviceCard.jsx";
import SummaryCard from "../components/cards/SummaryCard.jsx";
import LayoutView from "../components/layout/LayoutView.jsx";
import SessionsBar from "../components/sessions/SessionsBar.jsx";
import { BATTERY_TYPES } from "../lib/constants.js";

export default function DashboardScreen({
  user,
  theme,
  showParticles,
  onToggleTheme,
  onToggleParticles,
  onSignOut,
  sessions,
  activeSessionId,
  onLoadSession,
  onNewSession,
  onOpenSaveModal,
  onUpdateSession,
  onDeleteSession,
  status,
  error,
  catalog,
  counts,
  onCountChange,
  transformerCount,
  computed,
  children
}) {
  return (
    <>
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
                      <path
                        className="fill-current"
                        d="M21 14.5A8.5 8.5 0 0 1 9.5 3a8.5 8.5 0 1 0 11.5 11.5z"
                      />
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

                <button
                  onClick={onSignOut}
                  className="rounded-xl border border-zinc-300 dark:border-[#2E3E5C] bg-white dark:bg-[#0B1525] text-zinc-700 dark:text-[#D5DEEB] px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-[#16253A]"
                >
                  Sign out
                </button>
              </div>
              <SessionsBar
                sessions={sessions}
                activeSessionId={activeSessionId}
                onLoad={onLoadSession}
                onNewSession={onNewSession}
                onSaveNew={onOpenSaveModal}
                onUpdate={onUpdateSession}
                onDelete={onDeleteSession}
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
              <div className="text-sm font-semibold text-zinc-800 dark:text-[#E9F0FA] mb-3">
                Device configuration
              </div>

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
                      <div className="text-sm font-semibold text-zinc-800 dark:text-[#E9F0FA]">
                        Transformer
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-[#AAB6C9] mt-0.5">
                        {catalog["Transformer"].w}ft × {catalog["Transformer"].d}ft •{" "}
                        {catalog["Transformer"].energyMWh} MWh • $
                        {catalog["Transformer"].cost.toLocaleString()}
                        {catalog["Transformer"].release ? ` • ${catalog["Transformer"].release}` : ""}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-[#AAB6C9]">
                        Rule: 1 transformer per 2 industrial batteries
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-zinc-900 dark:text-[#E9F0FA]">
                      {transformerCount}
                    </div>
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
      </div>
      {children}
    </>
  );
}
