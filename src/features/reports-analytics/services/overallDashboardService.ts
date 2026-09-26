import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import type { OverallDashboardPerformanceResponse, ReportQueryParams } from "../types/ReportsAPI";
import { campaignReportsService } from "./campaignReportsService";
import { customerProfileReportsService } from "./customerProfileReportsService";
import { emailDeliveryReportsService } from "./emailDeliveryReportsService";
import { offerReportsService } from "./offerReportsService";
import { segmentReportsService } from "./segmentReportsService";
import { smsDeliveryReportsService } from "./smsDeliveryReportsService";
import { normalizeCampaignPortfolio } from "../utils/normalizeCampaignReport";
import { normalizeCustomerProfileReport } from "../utils/normalizeCustomerProfileReport";
import { normalizeEmailDeliveryReport } from "../utils/normalizeEmailDeliveryReport";
import { normalizeOfferPortfolio } from "../utils/normalizeOfferReport";
import { normalizeSegmentReport } from "../utils/normalizeSegmentReport";
import { normalizeSmsDeliveryReport } from "../utils/normalizeSmsDeliveryReport";
import type { OverallLiveSources, OverallReportDomain, OverallSource } from "../utils/overallCvmMetrics";

function failure(id: OverallReportDomain, error: unknown): OverallSource<never> {
  return {
    id,
    ok: false,
    data: null,
    error: error instanceof Error ? error.message : "Request failed",
  };
}

async function load<T>(
  id: OverallReportDomain,
  request: () => Promise<unknown>,
  normalize: (payload: unknown) => T | null,
): Promise<OverallSource<T>> {
  try {
    const payload = await request();
    const data = normalize(payload);
    if (!data) return failure(id, new Error("Empty portfolio"));
    return { id, ok: true, data, error: null };
  } catch (error) {
    return failure(id, error);
  }
}

/**
 * Loads the six report portfolios for one window. A failed source does not
 * blank the others; the page shows that source as unavailable.
 */
const DASHBOARD_URL = buildApiUrl("/monitoring/reporting/dashboard");

function toQuery(params: ReportQueryParams): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/** One portfolio for the overall dashboard. Throws when the route is unavailable. */
export async function fetchOverallPortfolio(
  params: ReportQueryParams = {},
): Promise<OverallDashboardPerformanceResponse> {
  const response = await fetch(`${DASHBOARD_URL}/portfolio${toQuery(params)}`, {
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      (body as { error?: string; message?: string }).error ||
      (body as { message?: string }).message ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }
  const data = (body as { data?: OverallDashboardPerformanceResponse }).data;
  if (!data || !Array.isArray(data.channels) || !Array.isArray(data.domains)) {
    throw new Error("Dashboard portfolio was empty");
  }
  return data;
}

export async function loadOverallDashboard(
  params: ReportQueryParams = {},
): Promise<OverallLiveSources> {
  const [campaigns, offers, email, sms, segments, profiles] = await Promise.all([
    load("campaigns", () => campaignReportsService.getPortfolio(params), (payload) =>
      normalizeCampaignPortfolio(payload as Parameters<typeof normalizeCampaignPortfolio>[0]),
    ),
    load("offers", () => offerReportsService.getPortfolio(params), (payload) =>
      normalizeOfferPortfolio(payload as Parameters<typeof normalizeOfferPortfolio>[0]),
    ),
    load("email", () => emailDeliveryReportsService.getPortfolio(params), (payload) =>
      normalizeEmailDeliveryReport(payload),
    ),
    load("sms", () => smsDeliveryReportsService.getPortfolio(params), (payload) =>
      normalizeSmsDeliveryReport(payload),
    ),
    load("segments", () => segmentReportsService.getPortfolio(params), (payload) =>
      normalizeSegmentReport(payload),
    ),
    load("profiles", () => customerProfileReportsService.getPortfolio(params), (payload) =>
      normalizeCustomerProfileReport(payload),
    ),
  ]);

  return { campaigns, offers, email, sms, segments, profiles };
}
