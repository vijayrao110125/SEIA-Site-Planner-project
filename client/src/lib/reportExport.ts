function safeFilenamePart(s: string) {
  return (s || "")
    .trim()
    .replace(/[^\w\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 64);
}

function nowStamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

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

function requireSvg(reportElement: HTMLElement) {
  const svg = reportElement.querySelector("svg");
  if (!svg) throw new Error("Could not find layout SVG to export");
  return svg as SVGSVGElement;
}

function serializeSvg(svg: SVGSVGElement) {
  // Ensure xmlns so browsers can load it as an image.
  if (!svg.getAttribute("xmlns")) svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const s = new XMLSerializer().serializeToString(svg);
  return s;
}

async function svgStringToImage(svgString: string) {
  const encoded = encodeURIComponent(svgString)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encoded}`;
  const img = new Image();
  img.decoding = "async";
  img.src = dataUrl;
  try {
    await img.decode();
  } catch {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load SVG image"));
    });
  }
  return img;
}

function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, opts: { font: string; color: string }) {
  ctx.font = opts.font;
  ctx.fillStyle = opts.color;
  ctx.fillText(text, x, y);
}

function drawKpiBox(
  ctx: CanvasRenderingContext2D,
  {
    x,
    y,
    w,
    h,
    label,
    value
  }: { x: number; y: number; w: number; h: number; label: string; value: string }
) {
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === "function") {
    (ctx as any).roundRect(x, y, w, h, 16);
  } else {
    const r = 16;
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();

  drawText(ctx, label, x + 18, y + 34, { font: "500 20px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto", color: "#6b7280" });
  drawText(ctx, value, x + 18, y + 76, { font: "700 30px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto", color: "#111827" });
}

function openPrintWindow({ title, pngDataUrl }: { title: string; pngDataUrl: string }) {
  const w = window.open("", "_blank");
  if (!w) throw new Error("Pop-up blocked. Allow pop-ups to export PDF.");

  const safeTitle = title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  w.document.open();
  w.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${safeTitle}</title>
    <style>
      html, body { margin: 0; padding: 0; background: white; }
      img { width: 100%; height: auto; display: block; }
      @page { margin: 0.5in; }
    </style>
  </head>
  <body>
    <img src="${pngDataUrl}" alt="Report" />
    <script>
      window.onload = () => {
        setTimeout(() => window.print(), 50);
      };
    </script>
  </body>
</html>`);
  w.document.close();
}

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === "function") {
    (ctx as any).roundRect(x, y, w, h, r);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawLayoutLabels({
  ctx,
  placements,
  layout,
  drawX,
  drawY,
  drawW,
  drawH
}: {
  ctx: CanvasRenderingContext2D;
  placements: Array<{ id: string; type: string; w: number; d: number; x: number; y: number }>;
  layout: { siteLengthFt: number; maxWidthFt: number };
  drawX: number;
  drawY: number;
  drawW: number;
  drawH: number;
}) {
  if (!placements?.length) return;
  const pad = 20;
  const scale = 8;
  const isoX = 6;
  const isoY = 4;
  const displayLengthFt = Math.max(Number(layout.siteLengthFt || 0), 20);
  const viewW = Number(layout.maxWidthFt || 100) * scale + pad * 2 + isoX;
  const viewH = displayLengthFt * scale + pad * 2 + isoY;
  const sx = drawW / viewW;
  const sy = drawH / viewH;

  // Avoid huge perf hits on massive layouts.
  const step = placements.length > 500 ? Math.ceil(placements.length / 500) : 1;

  ctx.save();
  ctx.textBaseline = "alphabetic";
  ctx.font = "600 12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";

  for (let i = 0; i < placements.length; i += step) {
    const p = placements[i];
    const label = String(p.type || "").trim();
    if (!label) continue;

    const labelX = pad + Number(p.x || 0) * scale + 4;
    const labelY = pad + Number(p.y || 0) * scale + 12;
    const x = drawX + labelX * sx;
    const y = drawY + labelY * sy;

    const maxLabelW = Math.max(30, Number(p.w || 0) * scale * sx - 8);
    const textW = Math.min(ctx.measureText(label).width, Math.max(10, maxLabelW - 14));
    const boxW = Math.min(maxLabelW, textW + 14);
    const boxH = 16;

    // Background pill
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.strokeStyle = "rgba(15, 23, 42, 0.12)";
    ctx.lineWidth = 1;
    drawRoundRect(ctx, x - 2, y - 12, boxW, boxH, 4);
    ctx.fill();
    ctx.stroke();

    // Text
    ctx.fillStyle = "rgba(17, 24, 39, 0.92)";
    ctx.fillText(label, x + 4, y);
  }

  ctx.restore();
}

export async function exportReportPng({
  reportElement,
  title,
  user,
  session,
  generatedAtIso,
  computed,
  catalog
}: {
  reportElement: HTMLElement;
  title: string;
  user: { name?: string | null; email: string };
  session: { id: string; name: string } | null;
  generatedAtIso: string;
  computed: any;
  catalog: Record<string, { w: number; d: number; energyMWh: number; cost: number; release: number | null }> | null;
}) {
  const totals = computed?.totals ?? { totalCost: 0, totalEnergyMWh: 0, energyDensity: 0 };
  const layout = computed?.layout ?? { siteWidthFt: 0, siteLengthFt: 0, siteAreaSqFt: 0, maxWidthFt: 100 };
  const counts = computed?.counts ?? {};
  const placements = layout?.placements ?? [];

  const svg = requireSvg(reportElement);
  const svgString = serializeSvg(svg);
  const layoutImg = await svgStringToImage(svgString);

  const W = 1600;
  const margin = 80;

  // Layout drawing area
  const contentW = W - margin * 2;
  const layoutW = contentW;
  const layoutH = Math.round(layoutW * (layoutImg.height / layoutImg.width));

  // Rough fixed header + KPI sections + table
  const headerH = 220;
  const kpisH = 260;
  const tableH = catalog ? 320 : 0;
  const footerH = 80;
  const H = headerH + kpisH + (tableH ? tableH + 30 : 40) + layoutH + footerH;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // header
  drawText(ctx, "SEIA Site Planner — Report", margin, 84, {
    font: "700 44px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
    color: "#111827"
  });
  drawText(ctx, "Layout image + computed summary + session metadata", margin, 124, {
    font: "500 22px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
    color: "#6b7280"
  });

  const metaLeft = `${user?.name || user?.email}${user?.name ? ` (${user.email})` : ""}`;
  const metaRight = `${session?.name || "(unsaved)"}${session?.id ? ` • ID: ${session.id}` : ""}`;
  drawText(ctx, `User: ${metaLeft}`, margin, 170, {
    font: "600 22px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
    color: "#111827"
  });
  drawText(ctx, `Session: ${metaRight}`, margin, 200, {
    font: "500 20px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
    color: "#374151"
  });
  ctx.textAlign = "right";
  drawText(ctx, `Generated: ${fmtDateTime(generatedAtIso)}`, W - margin, 170, {
    font: "500 20px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
    color: "#6b7280"
  });
  ctx.textAlign = "left";

  // KPIs
  const boxW = Math.floor((contentW - 30) / 2);
  const boxH = 110;
  const kpiX1 = margin;
  const kpiX2 = margin + boxW + 30;
  let kpiY = headerH;

  drawKpiBox(ctx, { x: kpiX1, y: kpiY, w: boxW, h: boxH, label: "Total cost", value: fmtMoney(totals.totalCost) });
  drawKpiBox(ctx, { x: kpiX2, y: kpiY, w: boxW, h: boxH, label: "Total energy (MWh)", value: Number(totals.totalEnergyMWh).toFixed(2) });
  kpiY += boxH + 24;
  drawKpiBox(ctx, { x: kpiX1, y: kpiY, w: boxW, h: boxH, label: "Site width (ft)", value: Number(layout.siteWidthFt).toFixed(0) });
  drawKpiBox(ctx, { x: kpiX2, y: kpiY, w: boxW, h: boxH, label: "Site length (ft)", value: Number(layout.siteLengthFt).toFixed(0) });

  // Device table
  const tableTopY = headerH + kpisH + 24;
  let afterTableY = headerH + kpisH + 40;
  if (catalog) {
    afterTableY = tableTopY + tableH + 20;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === "function") {
      (ctx as any).roundRect(margin, tableTopY, contentW, tableH, 16);
    } else {
      ctx.rect(margin, tableTopY, contentW, tableH);
    }
    ctx.fill();
    ctx.stroke();

    drawText(ctx, "Device details", margin + 18, tableTopY + 36, {
      font: "700 22px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
      color: "#111827"
    });
    drawText(ctx, "Per-device specs from the catalog.", margin + 18, tableTopY + 62, {
      font: "500 16px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
      color: "#6b7280"
    });

    const cols = [
      { key: "type", label: "Type", w: 260, align: "left" as const },
      { key: "count", label: "Count", w: 90, align: "right" as const },
      { key: "size", label: "Size (ft)", w: 140, align: "right" as const },
      { key: "energy", label: "Energy", w: 120, align: "right" as const },
      { key: "cost", label: "Unit cost", w: 150, align: "right" as const },
      { key: "release", label: "Release", w: 90, align: "right" as const }
    ];
    const startX = margin + 18;
    const startY = tableTopY + 94;
    const rowH = 36;

    // header row
    let x = startX;
    for (const c of cols) {
      ctx.textAlign = c.align === "right" ? "right" : "left";
      const tx = c.align === "right" ? x + c.w : x;
      drawText(ctx, c.label, tx, startY, {
        font: "600 14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
        color: "#6b7280"
      });
      x += c.w;
    }
    ctx.textAlign = "left";
    ctx.strokeStyle = "#f3f4f6";
    ctx.beginPath();
    ctx.moveTo(margin + 18, startY + 12);
    ctx.lineTo(margin + contentW - 18, startY + 12);
    ctx.stroke();

    const order = ["MegapackXL", "Megapack2", "Megapack", "PowerPack", "Transformer"];
    const rows = order
      .map((t) => ({ type: t, count: Number(counts?.[t] ?? 0), def: (catalog as any)[t] }))
      .filter((r) => r.count > 0 && r.def);

    let rowY = startY + 32;
    for (const r of rows.slice(0, 7)) {
      let cx = startX;
      const cells = {
        type: r.type,
        count: String(r.count),
        size: `${r.def.w}×${r.def.d}`,
        energy: `${r.def.energyMWh} MWh`,
        cost: fmtMoney(r.def.cost),
        release: r.def.release ?? "-"
      };
      for (const c of cols) {
        ctx.textAlign = c.align === "right" ? "right" : "left";
        const tx = c.align === "right" ? cx + c.w : cx;
        drawText(ctx, (cells as any)[c.key], tx, rowY, {
          font: "500 16px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
          color: "#111827"
        });
        cx += c.w;
      }
      ctx.textAlign = "left";
      ctx.strokeStyle = "#f9fafb";
      ctx.beginPath();
      ctx.moveTo(margin + 18, rowY + 12);
      ctx.lineTo(margin + contentW - 18, rowY + 12);
      ctx.stroke();
      rowY += rowH;
    }
    ctx.textAlign = "left";
  }

  // Layout
  const layoutY = afterTableY;
  drawText(ctx, `Layout (max width ${layout.maxWidthFt ?? 100}ft)`, margin, layoutY - 12, {
    font: "700 24px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
    color: "#111827"
  });
  ctx.drawImage(layoutImg, margin, layoutY, layoutW, layoutH);
  drawLayoutLabels({ ctx, placements, layout, drawX: margin, drawY: layoutY, drawW: layoutW, drawH: layoutH });

  // footer
  drawText(ctx, "Tip: Export PDF uses your browser print dialog (Save as PDF).", margin, H - 36, {
    font: "500 18px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
    color: "#6b7280"
  });

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to create PNG"))), "image/png");
  });
  const filename = `${safeFilenamePart(title) || "seia_report"}_${nowStamp()}.png`;
  downloadBlob(blob, filename);
}

export async function exportReportPdf({
  reportElement,
  title,
  user,
  session,
  generatedAtIso,
  computed,
  catalog
}: {
  reportElement: HTMLElement;
  title: string;
  user: { name?: string | null; email: string };
  session: { id: string; name: string } | null;
  generatedAtIso: string;
  computed: any;
  catalog: Record<string, { w: number; d: number; energyMWh: number; cost: number; release: number | null }> | null;
}) {
  // Generate a PNG and send it to the browser print dialog (Save as PDF).
  const pngDataUrl = await (async () => {
    const totals = computed?.totals ?? { totalCost: 0, totalEnergyMWh: 0, energyDensity: 0 };
    const layout = computed?.layout ?? { siteWidthFt: 0, siteLengthFt: 0, siteAreaSqFt: 0, maxWidthFt: 100 };
    const counts = computed?.counts ?? {};
    const placements = layout?.placements ?? [];

    const svg = requireSvg(reportElement);
    const svgString = serializeSvg(svg);
    const layoutImg = await svgStringToImage(svgString);

    const W = 1600;
    const margin = 80;
    const contentW = W - margin * 2;
    const layoutW = contentW;
    const layoutH = Math.round(layoutW * (layoutImg.height / layoutImg.width));
    const headerH = 220;
    const kpisH = 260;
    const tableH = catalog ? 320 : 0;
    const footerH = 40;
    const H = headerH + kpisH + (tableH ? tableH + 30 : 40) + layoutH + footerH;

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    drawText(ctx, "SEIA Site Planner — Report", margin, 84, {
      font: "700 44px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
      color: "#111827"
    });
    drawText(ctx, "Layout image + computed summary + session metadata", margin, 124, {
      font: "500 22px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
      color: "#6b7280"
    });

    const metaLeft = `${user?.name || user?.email}${user?.name ? ` (${user.email})` : ""}`;
    const metaRight = `${session?.name || "(unsaved)"}${session?.id ? ` • ID: ${session.id}` : ""}`;
    drawText(ctx, `User: ${metaLeft}`, margin, 170, {
      font: "600 22px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
      color: "#111827"
    });
    drawText(ctx, `Session: ${metaRight}`, margin, 200, {
      font: "500 20px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
      color: "#374151"
    });
    ctx.textAlign = "right";
    drawText(ctx, `Generated: ${fmtDateTime(generatedAtIso)}`, W - margin, 170, {
      font: "500 20px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
      color: "#6b7280"
    });
    ctx.textAlign = "left";

    const boxW = Math.floor((contentW - 30) / 2);
    const boxH = 110;
    const kpiX1 = margin;
    const kpiX2 = margin + boxW + 30;
    let kpiY = headerH;
    drawKpiBox(ctx, { x: kpiX1, y: kpiY, w: boxW, h: boxH, label: "Total cost", value: fmtMoney(totals.totalCost) });
    drawKpiBox(ctx, { x: kpiX2, y: kpiY, w: boxW, h: boxH, label: "Total energy (MWh)", value: Number(totals.totalEnergyMWh).toFixed(2) });
    kpiY += boxH + 24;
    drawKpiBox(ctx, { x: kpiX1, y: kpiY, w: boxW, h: boxH, label: "Site width (ft)", value: Number(layout.siteWidthFt).toFixed(0) });
    drawKpiBox(ctx, { x: kpiX2, y: kpiY, w: boxW, h: boxH, label: "Site length (ft)", value: Number(layout.siteLengthFt).toFixed(0) });

    const tableTopY = headerH + kpisH + 24;
    let afterTableY = headerH + kpisH + 40;
    if (catalog) {
      afterTableY = tableTopY + tableH + 20;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === "function") {
        (ctx as any).roundRect(margin, tableTopY, contentW, tableH, 16);
      } else {
        ctx.rect(margin, tableTopY, contentW, tableH);
      }
      ctx.fill();
      ctx.stroke();

      drawText(ctx, "Device details", margin + 18, tableTopY + 36, {
        font: "700 22px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
        color: "#111827"
      });
      drawText(ctx, "Per-device specs from the catalog.", margin + 18, tableTopY + 62, {
        font: "500 16px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
        color: "#6b7280"
      });

      const cols = [
        { key: "type", label: "Type", w: 260, align: "left" as const },
        { key: "count", label: "Count", w: 90, align: "right" as const },
        { key: "size", label: "Size (ft)", w: 140, align: "right" as const },
        { key: "energy", label: "Energy", w: 120, align: "right" as const },
        { key: "cost", label: "Unit cost", w: 150, align: "right" as const },
        { key: "release", label: "Release", w: 90, align: "right" as const }
      ];
      const startX = margin + 18;
      const startY = tableTopY + 94;
      const rowH = 36;

      let x = startX;
      for (const c of cols) {
        ctx.textAlign = c.align === "right" ? "right" : "left";
        const tx = c.align === "right" ? x + c.w : x;
        drawText(ctx, c.label, tx, startY, {
          font: "600 14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
          color: "#6b7280"
        });
        x += c.w;
      }
      ctx.textAlign = "left";
      ctx.strokeStyle = "#f3f4f6";
      ctx.beginPath();
      ctx.moveTo(margin + 18, startY + 12);
      ctx.lineTo(margin + contentW - 18, startY + 12);
      ctx.stroke();

      const order = ["MegapackXL", "Megapack2", "Megapack", "PowerPack", "Transformer"];
      const rows = order
        .map((t) => ({ type: t, count: Number(counts?.[t] ?? 0), def: (catalog as any)[t] }))
        .filter((r) => r.count > 0 && r.def);

      let rowY = startY + 32;
      for (const r of rows.slice(0, 7)) {
        let cx = startX;
        const cells = {
          type: r.type,
          count: String(r.count),
          size: `${r.def.w}×${r.def.d}`,
          energy: `${r.def.energyMWh} MWh`,
          cost: fmtMoney(r.def.cost),
          release: r.def.release ?? "-"
        };
        for (const c of cols) {
          ctx.textAlign = c.align === "right" ? "right" : "left";
          const tx = c.align === "right" ? cx + c.w : cx;
          drawText(ctx, (cells as any)[c.key], tx, rowY, {
            font: "500 16px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
            color: "#111827"
          });
          cx += c.w;
        }
        ctx.textAlign = "left";
        ctx.strokeStyle = "#f9fafb";
        ctx.beginPath();
        ctx.moveTo(margin + 18, rowY + 12);
        ctx.lineTo(margin + contentW - 18, rowY + 12);
        ctx.stroke();
        rowY += rowH;
      }
      ctx.textAlign = "left";
    }

    const layoutY = afterTableY;
    drawText(ctx, `Layout (max width ${layout.maxWidthFt ?? 100}ft)`, margin, layoutY - 12, {
      font: "700 24px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
      color: "#111827"
    });
    ctx.drawImage(layoutImg, margin, layoutY, layoutW, layoutH);
    drawLayoutLabels({ ctx, placements, layout, drawX: margin, drawY: layoutY, drawW: layoutW, drawH: layoutH });

    return canvas.toDataURL("image/png");
  })();
  openPrintWindow({ title, pngDataUrl });
}
