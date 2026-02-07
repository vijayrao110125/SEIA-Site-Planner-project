function fmtMoney(n) {
  return `$${Math.round(n).toLocaleString()}`;
}

export default function SummaryCard({ computed }) {
  const totals = computed?.totals ?? { totalCost: 0, totalEnergyMWh: 0, energyDensity: 0 };
  const layout = computed?.layout ?? { siteWidthFt: 0, siteLengthFt: 0, siteAreaSqFt: 0 };
  const counts =
    computed?.counts ?? { MegapackXL: 0, Megapack2: 0, Megapack: 0, PowerPack: 0, Transformer: 0 };

  return (
    <div className="rounded-2xl bg-white dark:bg-[#111C2D] shadow-sm border border-zinc-200 dark:border-[#26334A] p-4">
      <div className="text-sm font-semibold text-zinc-800 dark:text-[#E9F0FA] mb-3">Summary</div>

      <div className="grid grid-cols-2 gap-3">
        <Metric label="Total cost" value={fmtMoney(totals.totalCost)} />
        <Metric label="Total energy (MWh)" value={totals.totalEnergyMWh.toFixed(2)} />
        <Metric label="Site width (ft)" value={layout.siteWidthFt.toFixed(0)} />
        <Metric label="Site length (ft)" value={layout.siteLengthFt.toFixed(0)} />
        <Metric label="Area (sq ft)" value={layout.siteAreaSqFt.toFixed(0)} />
        <Metric label="Energy density (MWh/sq ft)" value={totals.energyDensity.toExponential(3)} />
      </div>

      <div className="mt-4 rounded-xl bg-zinc-50 dark:bg-[#0E1A2B] border border-zinc-200 dark:border-[#26334A] p-3">
        <div className="text-xs text-zinc-600 dark:text-[#C2CDDD]">Derived device counts</div>
        {!computed && (
          <div className="text-xs text-zinc-500 dark:text-[#AAB6C9] mt-1">
            Adjust device counts to compute totals and layout.
          </div>
        )}
        <div className="mt-2 text-xs text-zinc-700 dark:text-[#D5DEEB] grid grid-cols-2 gap-2">
          {Object.entries(counts).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between">
              <span className="text-zinc-500 dark:text-[#AAB6C9]">{k}</span>
              <span className="font-medium text-zinc-900 dark:text-[#E9F0FA]">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-[#26334A] p-3">
      <div className="text-xs text-zinc-500 dark:text-[#AAB6C9]">{label}</div>
      <div className="text-base font-semibold text-zinc-900 dark:text-[#E9F0FA] mt-1">{value}</div>
    </div>
  );
}

