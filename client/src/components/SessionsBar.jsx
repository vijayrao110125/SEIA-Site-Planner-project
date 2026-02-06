export default function SessionsBar({
  sessions,
  activeSessionId,
  onLoad,
  onNewSession,
  onSaveNew,
  onUpdate,
  onDelete,
  status
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
      <select
        className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm w-full sm:w-auto"
        value={activeSessionId}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "__new__") onNewSession();   // ✅ handle new session selection
          else onLoad(v);
        }}
      >
        <option value="">{activeSessionId ? "" : "(Unsaved session)"}</option>
        <option value="__new__">+ New session</option>
        {sessions.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <button
        onClick={onSaveNew}
        className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm font-medium hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 w-full sm:w-auto"
      >
        Save new
      </button>

      <button
        onClick={onUpdate}
        disabled={!activeSessionId}
        className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm font-medium disabled:opacity-50 w-full sm:w-auto"
      >
        Update
      </button>

      <button
        onClick={onDelete}
        disabled={!activeSessionId}
        className="rounded-xl border border-red-300 dark:border-red-800 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 px-3 py-2 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 w-full sm:w-auto"
      >
        Delete
      </button>

      {status && <div className="text-xs text-slate-500 dark:text-slate-400 ml-1">{status}</div>}
    </div>
  );
}
