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

export async function downloadChartPng(
  container: HTMLElement,
  filename: string,
): Promise<boolean> {
  const svg = container.querySelector("svg");
  if (!svg) return false;
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
    if (!context) return false;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    await new Promise<void>((resolve, reject) => {
      canvas.toBlob((blob) => {
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
  } catch {
    return false;
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
