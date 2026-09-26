/**
 * Customer 360 Analytics — subscriber-scoped CVM reporting.
 *
 * Source of truth (Campaign Reports pattern):
 *   GET /monitoring/reporting/subscribers/:id/activity
 *   GET /monitoring/reporting/subscribers/:id/profile
 *   GET /monitoring/reporting/subscribers/:id/engagement
 *   GET /monitoring/reporting/subscribers/:id/consent
 *   GET /monitoring/reporting/subscribers/:id/segments
 *   GET /monitoring/reporting/subscribers/:id/devices
 *   GET /monitoring/reporting/subscribers/:id/conversions
 *   GET /monitoring/reporting/subscribers/:id/lifecycle
 *   GET /monitoring/reporting/subscribers/:id/touchpoints
 * Legacy:
 *   GET /monitoring/reporting/subscribers/:id
 */

export type CvmChannel = string;

export interface AnalyticsNamedCount {
  name: string;
  value: number;
}

export interface AnalyticsSeriesPoint {
  period: string;
  value: number;
  secondary?: number;
}

export interface AnalyticsChannelEngagement {
  channel: string;
  sent: number;
  delivered: number;
  engaged: number;
  converted: number;
  engagementRate: number;
}

export interface AnalyticsFunnelStage {
  stage: string;
  count: number;
}

export interface AnalyticsConsentRow {
  channel: string;
  status: string;
  optedIn: boolean | null;
}

export interface AnalyticsSegmentRow {
  id: string;
  name: string;
  type: string;
  addedAt: string | null;
}

export interface AnalyticsDeviceRow {
  id: string;
  name: string;
  type: string;
  status: string;
  lastSeen: string | null;
}

export interface SubscriberAnalyticsKpis {
  engagementScore: number | null;
  conversions: number;
  conversionRate: number | null;
  touchpoints: number;
  lifecycleStage: string | null;
  segmentCount: number;
  optedInChannels: number;
  deviceCount: number;
  clv: number | null;
  churnRisk: number | null;
  preferredChannel: string | null;
}

export interface SubscriberAnalyticsResult {
  kpis: SubscriberAnalyticsKpis;
  activitySeries: AnalyticsSeriesPoint[];
  activityByChannel: AnalyticsNamedCount[];
  engagementByChannel: AnalyticsChannelEngagement[];
  engagementSeries: AnalyticsSeriesPoint[];
  conversionSeries: AnalyticsSeriesPoint[];
  conversionFunnel: AnalyticsFunnelStage[];
  lifecycleSeries: AnalyticsSeriesPoint[];
  touchpointsByChannel: AnalyticsNamedCount[];
  consent: AnalyticsConsentRow[];
  segments: AnalyticsSegmentRow[];
  devices: AnalyticsDeviceRow[];
  loadedResources: string[];
  failedResources: string[];
  warnings: string[];
  usedLegacy: boolean;
}

export const EMPTY_ANALYTICS_KPIS: SubscriberAnalyticsKpis = {
  engagementScore: null,
  conversions: 0,
  conversionRate: null,
  touchpoints: 0,
  lifecycleStage: null,
  segmentCount: 0,
  optedInChannels: 0,
  deviceCount: 0,
  clv: null,
  churnRisk: null,
  preferredChannel: null,
};

export const EMPTY_ANALYTICS_RESULT: SubscriberAnalyticsResult = {
  kpis: { ...EMPTY_ANALYTICS_KPIS },
  activitySeries: [],
  activityByChannel: [],
  engagementByChannel: [],
  engagementSeries: [],
  conversionSeries: [],
  conversionFunnel: [],
  lifecycleSeries: [],
  touchpointsByChannel: [],
  consent: [],
  segments: [],
  devices: [],
  loadedResources: [],
  failedResources: [],
  warnings: [],
  usedLegacy: false,
};
