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
        className="rounded-xl border border-zinc-300 dark:border-[#2E3E5C] bg-white dark:bg-[#0B1525] text-zinc-900 dark:text-[#E9F0FA] px-3 py-2 text-sm w-full sm:w-auto"
        value={activeSessionId}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "__new__") onNewSession();
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
        className="rounded-xl bg-blue-600 text-white px-3 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto"
      >
        Save new
      </button>

      <button
        onClick={onUpdate}
        disabled={!activeSessionId}
        className="rounded-xl border border-zinc-300 dark:border-[#2E3E5C] bg-white dark:bg-[#0B1525] text-zinc-900 dark:text-[#E9F0FA] px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-[#16253A] disabled:opacity-50 w-full sm:w-auto"
      >
        Update
      </button>

      <button
        onClick={onDelete}
        disabled={!activeSessionId}
        className="rounded-xl border border-red-300 dark:border-red-800 bg-white dark:bg-[#0B1525] text-red-700 dark:text-red-400 px-3 py-2 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 w-full sm:w-auto"
      >
        Delete
      </button>

      {status && <div className="text-xs text-zinc-500 dark:text-[#AAB6C9] ml-1">{status}</div>}
    </div>
  );
}

