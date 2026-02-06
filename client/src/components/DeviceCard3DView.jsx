const TYPE_COLOR = {
  MegapackXL: "#2563eb",
  Megapack2: "#16a34a",
  Megapack: "#f59e0b",
  PowerPack: "#a855f7",
  Transformer: "#ef4444"
};

function ColorDot({ type }) {
  const c = TYPE_COLOR[type] ?? "#94a3b8";
  return (
    <span
      className="inline-block h-3 w-3 rounded-full"
      style={{ backgroundColor: c }}
      aria-hidden="true"
    />
  );
}

export default function DeviceCard3DView({ selected, theme, onClear }) {
  if (!selected) {
    return (
      <div className="rounded-2xl bg-white dark:bg-slate-900 shadow p-4 border border-slate-200 dark:border-slate-800">
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Details</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Click a unit in the 3D layout to see details.
        </div>
      </div>
    );
  }

  const typeColor = TYPE_COLOR[selected.type] ?? "#94a3b8";

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 shadow p-4 border border-slate-200 dark:border-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ColorDot type={selected.type} />
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {selected.type}
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {selected.w}ft × {selected.d}ft • ID: {selected.id}
          </div>
        </div>

        <button
          onClick={onClear}
          className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          Clear
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Position</div>
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            x: {selected.x}ft
          </div>
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            y: {selected.y}ft
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Center</div>
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            ({selected.x + selected.w / 2}, {selected.y + selected.d / 2})
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 col-span-2">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Type color</div>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: typeColor }} />
            <div className="text-sm text-slate-700 dark:text-slate-200">{typeColor}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
        Tip: drag to rotate, scroll to zoom, right-drag to pan.
      </div>
    </div>
  );
}
