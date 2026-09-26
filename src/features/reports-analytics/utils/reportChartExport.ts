import { getCurrencySettings } from "../../../shared/services/currencyService";
import { getSettingsTimezone } from "../../../shared/utils/settingsHelper";
import type { ReportGrain } from "../types/ReportsAPI";

export type ReportChartAudit = {
  grain?: ReportGrain | string;
  startDate?: string;
  endDate?: string;
  timezone?: string;
  currency?: string;
  windowLabel?: string;
};

export function resolveReportChartAudit(
  audit?: ReportChartAudit,
): Required<Pick<ReportChartAudit, "timezone" | "currency">> & ReportChartAudit {
  const currencySettings = getCurrencySettings();
  return {
    grain: audit?.grain || "",
    startDate: audit?.startDate || "",
    endDate: audit?.endDate || "",
    timezone: audit?.timezone || getSettingsTimezone(),
    currency: audit?.currency || currencySettings.currency,
    windowLabel: audit?.windowLabel || "",
  };
}

export const AUDIT_COLUMNS = [
  { key: "isoDate", label: "ISO date" },
  { key: "grain", label: "Grain" },
  { key: "timezone", label: "Timezone" },
  { key: "currency", label: "Currency" },
  { key: "windowStart", label: "Window start" },
  { key: "windowEnd", label: "Window end" },
] as const;

export function withAuditFields(
  row: Record<string, string | number | null | undefined>,
  audit: ReturnType<typeof resolveReportChartAudit>,
): Record<string, string | number | null | undefined> {
  return {
    isoDate: String(row.date || row.isoDate || ""),
    grain: audit.grain || "",
    timezone: audit.timezone,
    currency: audit.currency,
    windowStart: audit.startDate || "",
    windowEnd: audit.endDate || "",
    ...row,
  };
}

export function auditFilename(base: string, audit?: ReportChartAudit): string {
  const stem = base.replace(/\.(csv|png)$/i, "");
  const grain = audit?.grain ? `-${audit.grain}` : "";
  const start = audit?.startDate ? `-${audit.startDate}` : "";
  const end = audit?.endDate ? `-${audit.endDate}` : "";
  return `${stem}${grain}${start}${end}`;
}

function ensureSvgSize(svg: SVGElement) {
  const box = svg.getBoundingClientRect();
  if (!svg.getAttribute("width")) {
    svg.setAttribute("width", String(Math.max(1, Math.round(box.width))));
  }
  if (!svg.getAttribute("height")) {
    svg.setAttribute("height", String(Math.max(1, Math.round(box.height))));
  }
  if (!svg.getAttribute("xmlns")) {
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function chartSvg(container: HTMLElement): SVGElement | null {
  return container.querySelector("svg");
}

export function downloadChartSvg(
  container: HTMLElement,
  filename: string,
): boolean {
  const svg = chartSvg(container);
  if (!svg) return false;
  ensureSvgSize(svg);
  const source = new XMLSerializer().serializeToString(svg);
  const href = URL.createObjectURL(
    new Blob([source], { type: "image/svg+xml;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = href;
  link.download = filename.endsWith(".svg") ? filename : `${filename}.svg`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
  return true;
}

async function rasterizeChart(
  container: HTMLElement,
): Promise<{ canvas: HTMLCanvasElement } | null> {
  const svg = chartSvg(container);
  if (!svg) return null;
  ensureSvgSize(svg);
  const source = new XMLSerializer().serializeToString(svg);
  const svgUrl = URL.createObjectURL(
    new Blob([source], { type: "image/svg+xml;charset=utf-8" }),
  );
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not rasterize chart"));
      img.src = svgUrl;
    });
    const width = image.naturalWidth || svg.getBoundingClientRect().width;
    const height = image.naturalHeight || svg.getBoundingClientRect().height;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * 2));
    canvas.height = Math.max(1, Math.round(height * 2));
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return { canvas };
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export async function downloadChartPng(
  container: HTMLElement,
  filename: string,
): Promise<boolean> {
  const raster = await rasterizeChart(container);
  if (!raster) return false;
  await new Promise<void>((resolve, reject) => {
    raster.canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("PNG export failed"));
        return;
      }
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
      resolve();
    }, "image/png");
  });
  return true;
}

export async function copyChartPng(container: HTMLElement): Promise<boolean> {
  if (!navigator.clipboard || typeof ClipboardItem === "undefined") return false;
  const raster = await rasterizeChart(container);
  if (!raster) return false;
  const blob = await new Promise<Blob | null>((resolve) => {
    raster.canvas.toBlob((next) => resolve(next), "image/png");
  });
  if (!blob) return false;
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
  return true;
}

export function printChart(container: HTMLElement, title: string): boolean {
  const svg = chartSvg(container);
  if (!svg) return false;
  ensureSvgSize(svg);
  const markup = new XMLSerializer().serializeToString(svg);
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    return false;
  }
  doc.open();
  doc.write(`<!doctype html><html><head><title>${escapeHtml(title)}</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 24px; color: #111827; }
      h1 { font-size: 18px; margin: 0 0 16px; }
      svg { max-width: 100%; height: auto; }
    </style>
  </head><body><h1>${escapeHtml(title)}</h1>${markup}</body></html>`);
  doc.close();
  const cleanup = () => {
    frame.remove();
  };
  frame.contentWindow?.addEventListener("afterprint", cleanup);
  setTimeout(() => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    setTimeout(cleanup, 1500);
  }, 50);
  return true;
}
