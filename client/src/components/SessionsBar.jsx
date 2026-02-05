export default function SessionsBar({
  sessions,
  activeSessionId,
  onLoad,
  onSaveNew,
  onUpdate,
  onDelete,
  status
}) {
  return (
    <div className="flex items-center gap-2">
      <select
        className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm"
        value={activeSessionId}
        onChange={(e) => onLoad(e.target.value)}
      >
        <option value="">Choose a session</option>
        {sessions.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name ? `${s.name} (${s.id})` : `Session ${s.id}`} • {new Date(s.updatedAt).toLocaleString()}
          </option>
        ))}
      </select>

      <button
        onClick={onSaveNew}
        className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm font-medium hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
      >
        Save new
      </button>

      <button
        onClick={onUpdate}
        disabled={!activeSessionId}
        className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm font-medium disabled:opacity-50"
      >
        Update
      </button>

      <button
        onClick={onDelete}
        disabled={!activeSessionId}
        className="rounded-xl border border-red-300 dark:border-red-800 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 px-3 py-2 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50"
      >
        Delete
      </button>

      {status && <div className="text-xs text-slate-500 dark:text-slate-400 ml-2">{status}</div>}
    </div>
  );
}
