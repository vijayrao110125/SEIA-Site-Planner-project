export default function DeleteSessionModal({
  status,
  targetLabel,
  confirmText,
  setConfirmText,
  onConfirm,
  onClose
}: {
  status: string;
  targetLabel: string;
  confirmText: string;
  setConfirmText: (v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md mx-4 rounded-2xl bg-white dark:bg-[#111C2D] shadow-xl border border-zinc-200 dark:border-[#26334A] p-5">
        <div className="text-base font-semibold text-zinc-900 dark:text-[#E9F0FA]">Delete session</div>
        <div className="text-sm text-zinc-500 dark:text-[#AAB6C9] mt-1">
          This action cannot be undone. Type <span className="font-semibold">DELETE</span> to confirm removing{" "}
          <span className="font-semibold">{targetLabel}</span>.
        </div>
        <input
          autoFocus
          className="mt-4 w-full rounded-xl border border-zinc-300 dark:border-[#2E3E5C] bg-white dark:bg-[#0B1525] text-zinc-900 dark:text-[#E9F0FA] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700"
          placeholder="Type DELETE"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "Enter" && confirmText === "DELETE") onConfirm();
          }}
        />
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            className="rounded-xl border border-zinc-300 dark:border-[#2E3E5C] bg-white dark:bg-[#0B1525] text-zinc-700 dark:text-[#D5DEEB] px-3 py-2 text-sm font-medium"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="rounded-xl bg-blue-600 text-white px-3 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            onClick={onConfirm}
            disabled={status === "Deleting…" || confirmText !== "DELETE"}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

