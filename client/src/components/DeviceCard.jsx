export default function DeviceCard({ type, def, value, onChange }) {
  const displayValue = value ? value : "";
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-[#26334A] p-3 bg-white dark:bg-[#111C2D]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-[#E9F0FA]">{type}</div>
          <div className="text-xs text-zinc-500 dark:text-[#AAB6C9] mt-0.5">
            {def.w}ft × {def.d}ft • {def.energyMWh} MWh • ${def.cost.toLocaleString()}
            {def.release ? ` • ${def.release}` : ""}
          </div>
        </div>

        <input
          className="w-20 rounded-lg border border-zinc-300 dark:border-[#2E3E5C] bg-white dark:bg-[#0B1525] text-zinc-900 dark:text-[#E9F0FA] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700"
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
