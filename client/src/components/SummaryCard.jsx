function fmtMoney(n) {
  return `$${Math.round(n).toLocaleString()}`;
}

export default function SummaryCard({ computed }) {
  if (!computed) return null;

  const { totals, layout, counts } = computed;

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 shadow p-4">
      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Summary</div>

      <div className="grid grid-cols-2 gap-3">
        <Metric label="Total cost" value={fmtMoney(totals.totalCost)} />
        <Metric label="Total energy (MWh)" value={totals.totalEnergyMWh.toFixed(2)} />
        <Metric label="Site width (ft)" value={layout.siteWidthFt.toFixed(0)} />
        <Metric label="Site length (ft)" value={layout.siteLengthFt.toFixed(0)} />
        <Metric label="Area (sq ft)" value={layout.siteAreaSqFt.toFixed(0)} />
        <Metric label="Energy density (MWh/sq ft)" value={totals.energyDensity.toExponential(3)} />
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
        <div className="text-xs text-slate-600 dark:text-slate-300">Derived device counts</div>
        <div className="mt-2 text-xs text-slate-700 dark:text-slate-200 grid grid-cols-2 gap-2">
          {Object.entries(counts).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">{k}</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-base font-semibold text-slate-900 dark:text-slate-100 mt-1">{value}</div>
    </div>
  );
}
