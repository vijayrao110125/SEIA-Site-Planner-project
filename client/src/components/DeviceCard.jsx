export default function DeviceCard({ type, def, value, onChange }) {
  const displayValue = value ? value : "";
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 bg-white dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{type}</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {def.w}ft × {def.d}ft • {def.energyMWh} MWh • ${def.cost.toLocaleString()}
            {def.release ? ` • ${def.release}` : ""}
          </div>
        </div>

        <input
          className="w-20 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700"
          type="number"
          min="0"
          placeholder="0"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
