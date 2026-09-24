import {
  customerProfileReportsService,
  SUBSCRIBER_REPORT_RESOURCES,
  type SubscriberReportResource,
} from "../../reports-analytics/services/customerProfileReportsService";
import type { ReportQueryParams } from "../../reports-analytics/types/ReportsAPI";
import { asRecord } from "../utils/customerSegmentHelpers";
import {
  buildSubscriberAnalytics,
  unwrapReportData,
} from "../utils/customerAnalyticsHelpers";
import type { SubscriberAnalyticsResult } from "../types/customerAnalytics";
import { EMPTY_ANALYTICS_RESULT } from "../types/customerAnalytics";

function resourceFromLegacy(
  legacy: unknown,
  resource: SubscriberReportResource,
): unknown {
  const data = asRecord(unwrapReportData(legacy));
  if (!data) return undefined;
  return data[resource];
}

export const customerAnalyticsService = {
  async getSubscriberAnalytics(
    subscriberId: string | number,
    params: ReportQueryParams = {},
  ): Promise<SubscriberAnalyticsResult> {
    const id = String(subscriberId ?? "").trim();
    if (!id) return EMPTY_ANALYTICS_RESULT;

    const settled = await Promise.allSettled(
      SUBSCRIBER_REPORT_RESOURCES.map((resource) =>
        customerProfileReportsService.getSubscriberResource(id, resource, params),
      ),
    );

    const loadedResources: string[] = [];
    const failedResources: string[] = [];
    const byResource: Partial<Record<SubscriberReportResource, unknown>> = {};

    SUBSCRIBER_REPORT_RESOURCES.forEach((resource, index) => {
      const result = settled[index];
      if (result.status === "fulfilled") {
        loadedResources.push(resource);
        byResource[resource] = result.value;
        return;
      }
      failedResources.push(resource);
    });

    let usedLegacy = false;
    let legacy: unknown;
    if (loadedResources.length === 0) {
      try {
        legacy = await customerProfileReportsService.getSubscriberReport(
          id,
          params,
        );
        usedLegacy = true;
      } catch {
        legacy = undefined;
      }
    }

    return buildSubscriberAnalytics({
      activity: byResource.activity ?? resourceFromLegacy(legacy, "activity"),
      profile: byResource.profile ?? resourceFromLegacy(legacy, "profile"),
      engagement:
        byResource.engagement ?? resourceFromLegacy(legacy, "engagement"),
      consent: byResource.consent ?? resourceFromLegacy(legacy, "consent"),
      segments: byResource.segments ?? resourceFromLegacy(legacy, "segments"),
      devices: byResource.devices ?? resourceFromLegacy(legacy, "devices"),
      conversions:
        byResource.conversions ?? resourceFromLegacy(legacy, "conversions"),
      lifecycle:
        byResource.lifecycle ?? resourceFromLegacy(legacy, "lifecycle"),
      touchpoints:
        byResource.touchpoints ?? resourceFromLegacy(legacy, "touchpoints"),
      legacy,
      loadedResources: usedLegacy
        ? ["legacy-report", ...loadedResources]
        : loadedResources,
      failedResources: usedLegacy ? [] : failedResources,
      usedLegacy,
    });
  },
};

export default customerAnalyticsService;
