import { forwardRef } from "react";
import LayoutView from "../layout/LayoutView";

function fmtMoney(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

function fmtDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

type User = { name?: string | null; email: string };
type ReportSession = { id: string; name: string } | null;

type Props = {
  user: User;
  session: ReportSession;
  generatedAtIso: string;
  computed: any;
  catalog?: Record<string, { w: number; d: number; energyMWh: number; cost: number; release: number | null }>;
};

const ReportView = forwardRef<HTMLDivElement, Props>(function ReportView(
  { user, session, generatedAtIso, computed, catalog },
  ref
) {
  const totals = computed?.totals ?? { totalCost: 0, totalEnergyMWh: 0, energyDensity: 0 };
  const layout = computed?.layout ?? { siteWidthFt: 0, siteLengthFt: 0, siteAreaSqFt: 0, maxWidthFt: 100 };
  const counts =
    computed?.counts ?? { MegapackXL: 0, Megapack2: 0, Megapack: 0, PowerPack: 0, Transformer: 0 };

  return (
    <div
      ref={ref}
      className="w-[980px] bg-white text-zinc-900 p-10 font-sans"
      style={{ WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" } as any}
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-2xl font-semibold tracking-tight">SEIA Site Planner — Report</div>
          <div className="text-sm text-zinc-500 mt-1">Layout image + computed summary + session metadata</div>
        </div>
        <div className="text-right text-xs text-zinc-600">
          <div className="font-medium text-zinc-900">Generated</div>
          <div>{fmtDateTime(generatedAtIso)}</div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <Meta label="User" value={user?.name || user?.email} sub={user?.name ? user.email : ""} />
        <Meta
          label="Session"
          value={session?.name || "(unsaved)"}
          sub={session?.id ? `ID: ${session.id}` : ""}
        />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-6">
        <div className="rounded-xl border border-zinc-200 p-4">
          <div className="text-sm font-semibold">Summary</div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <Kpi label="Total cost" value={fmtMoney(totals.totalCost)} />
            <Kpi label="Total energy (MWh)" value={Number(totals.totalEnergyMWh).toFixed(2)} />
            <Kpi label="Site width (ft)" value={Number(layout.siteWidthFt).toFixed(0)} />
            <Kpi label="Site length (ft)" value={Number(layout.siteLengthFt).toFixed(0)} />
            <Kpi label="Area (sq ft)" value={Number(layout.siteAreaSqFt).toFixed(0)} />
            <Kpi label="Energy density (MWh/sq ft)" value={Number(totals.energyDensity).toExponential(3)} />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 p-4">
          <div className="text-sm font-semibold">Device counts</div>
          <div className="text-xs text-zinc-500 mt-1">Transformers are derived (1 per 2 industrial batteries)</div>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {Object.entries(counts).map(([k, v]) => (
                <tr key={k} className="border-t border-zinc-100">
                  <td className="py-2 text-zinc-600">{k}</td>
                  <td className="py-2 text-right font-medium">{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {catalog ? (
        <div className="mt-8 rounded-xl border border-zinc-200 p-4">
          <div className="text-sm font-semibold">Device details</div>
          <div className="text-xs text-zinc-500 mt-1">Per-device specs from the catalog.</div>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-xs text-zinc-500 border-b border-zinc-100">
                <th className="py-2 text-left font-medium">Type</th>
                <th className="py-2 text-right font-medium">Count</th>
                <th className="py-2 text-right font-medium">Size (ft)</th>
                <th className="py-2 text-right font-medium">Energy (MWh)</th>
                <th className="py-2 text-right font-medium">Unit cost</th>
                <th className="py-2 text-right font-medium">Release</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(counts)
                .filter(([k, v]) => Number(v) > 0 && Boolean((catalog as any)[k]))
                .map(([k, v]) => {
                  const def = (catalog as any)[k];
                  return (
                    <tr key={k} className="border-b border-zinc-50">
                      <td className="py-2">{k}</td>
                      <td className="py-2 text-right font-medium tabular-nums">{String(v)}</td>
                      <td className="py-2 text-right tabular-nums">
                        {def.w}×{def.d}
                      </td>
                      <td className="py-2 text-right tabular-nums">{def.energyMWh}</td>
                      <td className="py-2 text-right tabular-nums">{fmtMoney(def.cost)}</td>
                      <td className="py-2 text-right tabular-nums">{def.release ?? "-"}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="mt-8">
        <div className="text-sm font-semibold mb-2">Layout (max width {layout.maxWidthFt ?? 100}ft)</div>
        <div className="rounded-xl border border-zinc-200 p-3">
          <LayoutView computed={computed} theme="light" />
        </div>
      </div>

      <div className="mt-6 text-[11px] text-zinc-500">
        Notes: This report captures the current computed result (totals + layout) at generation time.
      </div>
    </div>
  );
});

export default ReportView;

function Meta({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 font-medium text-zinc-900">{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-zinc-500">{sub}</div> : null}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1 text-base font-semibold">{value}</div>
    </div>
  );
}
