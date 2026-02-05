const TYPE_STYLE = {
  MegapackXL: {
    light: { top: "#f2f2f2", front: "#e0e0e0", side: "#cfcfcf" },
    dark: { top: "#2b2b2b", front: "#1f1f1f", side: "#141414" }
  },
  Megapack2: {
    light: { top: "#f7f7f7", front: "#e9e9e9", side: "#d9d9d9" },
    dark: { top: "#333333", front: "#262626", side: "#1a1a1a" }
  },
  Megapack: {
    light: { top: "#ffffff", front: "#ededed", side: "#dddddd" },
    dark: { top: "#3a3a3a", front: "#2c2c2c", side: "#1f1f1f" }
  },
  PowerPack: {
    light: { top: "#f5f5f5", front: "#e6e6e6", side: "#d6d6d6" },
    dark: { top: "#3b3b3b", front: "#2e2e2e", side: "#1f1f1f" }
  },
  Transformer: {
    light: { top: "#e31b23", front: "#c9151c", side: "#a90f15" },
    dark: { top: "#e31b23", front: "#c9151c", side: "#a90f15" }
  }
};

function pointsToString(points) {
  return points.map((p) => `${p[0]},${p[1]}`).join(" ");
}

function getIsoPolys({ x, y, w, d, pad, scale, isoX, isoY }) {
  const px = pad + x * scale;
  const py = pad + y * scale;
  const wPx = w * scale;
  const dPx = d * scale;

  const top = [
    [px, py],
    [px + wPx, py],
    [px + wPx - isoX, py - isoY],
    [px - isoX, py - isoY]
  ];

  const front = [
    [px, py],
    [px + wPx, py],
    [px + wPx, py + dPx],
    [px, py + dPx]
  ];

  const side = [
    [px + wPx, py],
    [px + wPx - isoX, py - isoY],
    [px + wPx - isoX, py - isoY + dPx],
    [px + wPx, py + dPx]
  ];

  return { top, front, side, labelX: px + 4, labelY: py + 12 };
}

function shade(hex, amount) {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((n >> 16) & 255) + amount));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 255) + amount));
  const b = Math.min(255, Math.max(0, (n & 255) + amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export default function LayoutView({ computed, theme }) {
  if (!computed) return null;

  const { layout } = computed;
  const { placements, siteWidthFt, siteLengthFt, maxWidthFt } = layout;
  const isDark = theme === "dark";

  // scale ft -> px
  const pad = 20;
  const scale = 8; // 1ft = 8px (tweak as desired)
  const isoX = 6;
  const isoY = 4;
  const displayLengthFt = Math.max(siteLengthFt, 20);
  const wPx = maxWidthFt * scale + pad * 2 + isoX;
  const hPx = displayLengthFt * scale + pad * 2 + isoY;

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 shadow p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Site layout</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Max width: {maxWidthFt}ft • Current width: {siteWidthFt.toFixed(0)}ft
          </div>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Tip: Zoom browser for bigger view
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        <svg
          viewBox={`0 0 ${wPx} ${hPx}`}
          preserveAspectRatio="xMinYMin meet"
          className="w-full h-auto"
        >
          <defs>
            <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path
                d="M 24 0 L 0 0 0 24"
                className="stroke-slate-200 dark:stroke-slate-700"
                strokeWidth="1"
                fill="none"
                opacity="0.6"
              />
            </pattern>

            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25" />
            </filter>

            {Array.from(new Set(placements.map((p) => p.type))).map((type) => {
              const palette = TYPE_STYLE[type] ?? TYPE_STYLE.Megapack;
              const face = isDark ? palette.dark : palette.light;
              const top1 = shade(face.top, 16);
              const top2 = shade(face.top, -10);
              const front1 = shade(face.front, 10);
              const front2 = shade(face.front, -12);
              const side1 = shade(face.side, 8);
              const side2 = shade(face.side, -14);
              const suffix = isDark ? "d" : "l";
              return (
                <g key={`${type}-${suffix}`}>
                  <linearGradient id={`grad-${type}-top-${suffix}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={top1} />
                    <stop offset="100%" stopColor={top2} />
                  </linearGradient>
                  <linearGradient id={`grad-${type}-front-${suffix}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={front1} />
                    <stop offset="100%" stopColor={front2} />
                  </linearGradient>
                  <linearGradient id={`grad-${type}-side-${suffix}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={side1} />
                    <stop offset="100%" stopColor={side2} />
                  </linearGradient>
                </g>
              );
            })}
          </defs>

          <rect
            x={pad - 8}
            y={pad - 8}
            width={maxWidthFt * scale + 16}
            height={displayLengthFt * scale + 16}
            fill="url(#grid)"
          />

          {/* 100ft boundary */}
          <rect
            x={pad}
            y={pad}
            width={maxWidthFt * scale}
            height={displayLengthFt * scale}
            className="fill-none stroke-slate-300 dark:stroke-slate-600"
            strokeDasharray="6 4"
          />
          <text x={pad} y={12} className="fill-slate-500 dark:fill-slate-400" fontSize="10">
            Width cap: {maxWidthFt}ft
          </text>

          {placements.map((p) => {
            const poly = getIsoPolys({ ...p, pad, scale, isoX, isoY });
            const palette = TYPE_STYLE[p.type] ?? TYPE_STYLE.Megapack;
            const suffix = isDark ? "d" : "l";
            return (
              <g key={p.id} className="stroke-slate-700/70 dark:stroke-slate-300/70" filter="url(#softShadow)">
                <polygon points={pointsToString(poly.top)} fill={`url(#grad-${p.type}-top-${suffix})`} />
                <polygon points={pointsToString(poly.side)} fill={`url(#grad-${p.type}-side-${suffix})`} />
                <polygon points={pointsToString(poly.front)} fill={`url(#grad-${p.type}-front-${suffix})`} />
                <polyline
                  points={pointsToString([poly.top[0], poly.top[1], poly.top[2]])}
                  className="stroke-white/50 dark:stroke-white/20"
                  strokeWidth="1"
                  fill="none"
                />
                <text
                  x={poly.labelX}
                  y={poly.labelY}
                  fontSize="9"
                  className="fill-slate-700/90 dark:fill-slate-200/90"
                >
                  {p.type}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
