export default function DeviceCard({ type, def, value, onChange }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{type}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {def.w}ft × {def.d}ft • {def.energyMWh} MWh • ${def.cost.toLocaleString()}
            {def.release ? ` • ${def.release}` : ""}
          </div>
        </div>

        <input
          className="w-20 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600"
          type="number"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
