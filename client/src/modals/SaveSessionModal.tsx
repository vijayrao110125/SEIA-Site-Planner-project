export default function SaveSessionModal({
  status,
  value,
  setValue,
  error,
  onSave,
  onClose
}: {
  status: string;
  value: string;
  setValue: (v: string) => void;
  error: string;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md mx-4 rounded-2xl bg-white dark:bg-[#111C2D] shadow-xl border border-zinc-200 dark:border-[#26334A] p-5">
        <div className="text-base font-semibold text-zinc-900 dark:text-[#E9F0FA]">Save session</div>
        <div className="text-sm text-zinc-500 dark:text-[#AAB6C9] mt-1">
          Give this configuration a name (required).
        </div>
        <input
          autoFocus
          className="mt-4 w-full rounded-xl border border-zinc-300 dark:border-[#2E3E5C] bg-white dark:bg-[#0B1525] text-zinc-900 dark:text-[#E9F0FA] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700"
          placeholder="e.g., Q1 buildout"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave();
            if (e.key === "Escape") onClose();
          }}
        />
        {error && <div className="mt-3 text-sm text-red-500">{error}</div>}
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            className="rounded-xl border border-zinc-300 dark:border-[#2E3E5C] bg-white dark:bg-[#0B1525] text-zinc-700 dark:text-[#D5DEEB] px-3 py-2 text-sm font-medium"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="rounded-xl bg-blue-600 text-white px-3 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            onClick={onSave}
            disabled={status === "Saving…"}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

