export type RangeOption = "7d" | "30d" | "90d";
export type ReportGrain = "daily" | "weekly" | "monthly";
export type ReportViewMode = "overview" | "trends";

/**
 * Named calendar windows.
 * Overview keeps snapshot presets (Today, This week, Last month, …).
 * Trends keeps trailing windows plus MTD / LMD; Today / Yesterday / This week /
 * Last week / This month / Last month are overview-only.
 */
export type TimeWindowPreset =
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_14_days"
  | "this_week"
  | "last_week"
  | "last_4_weeks"
  | "last_8_weeks"
  | "this_month"
  | "last_month"
  | "last_month_to_date"
  | "last_3_months"
  | "last_6_months"
  | "last_12_months"
  | "custom";

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface SavedReportDateRange {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  /** Grain tab this range was created under. Never shown on other tabs. */
  grain: ReportGrain;
}

export interface ReportQueryParams {
  range?: RangeOption; // Legacy alias derived from day count
  startDate?: string;
  endDate?: string;
  grain?: ReportGrain;
  /** Calendar preset from Daily/Weekly/Monthly tabs. Optional when startDate+endDate are sent. */
  preset?: TimeWindowPreset;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  segment?: string;
  campaignId?: string | number;
  offerId?: string | number;
  status?: string;
  metric?: string;
  limit?: number;
}

// ============================================================================
// CUSTOMER PROFILE REPORTS
// ============================================================================

export interface CustomerProfileReportsResponse {
  // Hero metrics (summary KPIs)
  heroMetrics: {
    activeCustomers: number;
    avgClv: number;
    avgOrderValue: number;
    purchaseFrequency: number;
    engagementScore: number;
    churnRate: number; // Percentage (e.g., 8.3 for 8.3%)
  };

  // Value Matrix Chart Data (Scatter/Bubble Chart)
  // X-axis: Recency (days since last purchase)
  // Y-axis: Value Score (0-100)
  // Bubble size: Number of customers
  valueMatrix: Array<{
    segment: string; // e.g., "Champions", "Loyalists", "At-Risk", "Churned"
    recency: number; // Days since last purchase
    valueScore: number; // 0-100 score
    customers: number; // Number of customers in this segment
    lifecycle: "New" | "Active" | "At-Risk" | "Churned";
  }>;

  // Lifecycle Distribution Chart Data (Multi-bar Chart - 6 bars per month)
  // Shows customer lifecycle states over time
  lifecycleDistribution: Array<{
    month: string; // Short month name: "Jun", "Jul", "Aug", etc.
    new: number; // New customers
    active: number; // Active customers
    atRisk: number; // At-risk customers
    dormant: number; // Dormant customers
    churned: number; // Churned customers
    reactivated: number; // Reactivated customers
  }>;

  // CLV Distribution Chart Data (Composed Chart: Bar + Line)
  // Bar: Number of customers per CLV range
  // Line: Revenue share percentage
  clvDistribution: Array<{
    range: string; // e.g., "< $250", "$250-$500", "$500-$1K", etc.
    customers: number; // Number of customers in this range
    revenueShare: number; // Percentage of total revenue (e.g., 12 for 12%)
  }>;

  // Cohort Retention Chart Data (Multi-line Chart)
  // Shows retention rates for different cohorts over time
  cohortRetention: Array<{
    month: number; // Months since cohort start (0, 1, 2, 3, ...)
    cohort: string; // Cohort identifier (e.g., "Jan 2024", "Apr 2024")
    retention: number; // Retention percentage (e.g., 85.5 for 85.5%)
  }>;

  // Customer Table Data
  customers: Array<CustomerRow>;
  totalCustomers: number; // Total count for pagination

  // Optional Real Data extras from GET /monitoring/reporting/subscribers/portfolio
  heroTrends?: {
    activeCustomers?: CustomerProfileTrend;
    avgClv?: CustomerProfileTrend;
    avgOrderValue?: CustomerProfileTrend;
    purchaseFrequency?: CustomerProfileTrend;
    engagementScore?: CustomerProfileTrend;
    churnRate?: CustomerProfileTrend;
  };
  meta?: {
    timezone?: string;
    currency?: string;
    country?: string;
    range?: string;
    grain?: string;
    preset?: TimeWindowPreset;
    isCustom?: boolean;
    warning?: string;
    previousStartDate?: string;
    previousEndDate?: string;
    days?: number;
    startDate?: string;
    endDate?: string;
    computedAt?: string;
    source?: "live" | "snapshot";
    churnInactivityDays?: number;
  };
}

export interface CustomerProfileTrend {
  value: number;
  direction: "up" | "down";
  label: string;
}

export interface CustomerRow {
  id: string; // Customer ID
  name: string; // Customer full name
  segment: string; // Customer segment (e.g., "Champions", "Loyalists")
  segments?: string[]; // optional list of segments if customer belongs to multiple
  email?: string;
  phone?: string;
  msisdn?: string;
  lifetimeValue: number; // Total lifetime value in currency units
  clv: number; // CLV score
  orders: number; // Total number of orders
  aov: number; // Average order value
  lastPurchase: string; // Human-readable: "Today", "5 days ago", "2 weeks ago"
  lastInteractionDate: string; // ISO 8601 format: YYYY-MM-DD
  engagementScore: number; // 0-100 engagement score
  churnRisk: number; // 0-100 churn risk percentage
  preferredChannel: "Email" | "SMS" | "Push";
  location: string; // Customer location/city
}

export type CustomerWithContact = CustomerRow & {
  email: string;
  phone: string;
  msisdn: string;
};

// ============================================================================
// CUSTOMER SEARCH RESULTS
// ============================================================================

/**
 *
 * Returns detailed information about a specific customer including
 * segments, offers, events, subscribed lists, and activity metrics.
 */

export interface CustomerSearchResultsResponse {
  customer: CustomerRow;

  // Customer segments
  segments: Array<{
    id: string;
    name: string;
    type: "Static" | "Dynamic";
    addedDate: string; // ISO 8601 format: YYYY-MM-DD
  }>;

  // Customer offers
  offers: Array<{
    id: string;
    name: string;
    type: string; // e.g., "Discount", "Cashback"
    status: "Redeemed" | "Active";
    redeemedDate?: string; // ISO 8601 format: YYYY-MM-DD (if redeemed)
    value: number; // Offer value in currency units
  }>;

  // Customer events (interactions across all channels)
  events: Array<{
    id: string;
    type: "sms" | "email" | "push" | "other";
    title: string;
    description: string;
    date: string; // ISO 8601 format: YYYY-MM-DDTHH:mm:ssZ
    status: string; // e.g., "Opened", "Clicked", "Delivered", "Sent"
  }>;

  // Subscribed lists
  subscribedLists: Array<{
    id: string;
    name: string;
    subscribedDate: string; // ISO 8601 format: YYYY-MM-DD
    status: "active" | "unsubscribed";
  }>;

  // Event distribution for pie chart
  eventDistribution: Array<{
    name: string; // Channel name: "Email", "SMS", "Push"
    value: number; // Count of events
  }>;

  // Activity timeline for bar chart
  activityTimeline: Array<{
    month: string; // Format: "Jan 2024", "Feb 2024", etc.
    events: number; // Count of events in that month
  }>;
}

// ============================================================================
// OFFER REPORTS
// ============================================================================

/**
 * Endpoint: GET /monitoring/reporting/offers/portfolio
 *
 * Returns offer performance analytics including redemption funnel,
 * timeline, type comparison, and offer table data.
 */

export interface OfferReportTrend {
  value: number;
  direction: "up" | "down";
  label: string;
}

export interface OfferReportsResponse {
  // Summary metrics
  summary: {
    totalRedemptions: number;
    redemptionRate: number; // Take-up rate. Kept under this key for live payload compatibility.
    revenueGenerated: number; // Value generated
    incrementalRevenue: number; // Incremental value versus the control group
    totalCost: number; // Reward cost
    roi: number; // ROMI multiplier (value generated / reward cost)
    /** Customers who qualified for the offer. */
    eligible?: number;
    /** Customers the offer was presented to. */
    offered?: number;
    /** Customers who accepted the offer. */
    takenUp?: number;
    /** Rewards provisioned after take-up. */
    fulfilled?: number;
    targetGroup?: number;
    controlGroup?: number;
    targetGroupTakenUp?: number;
    controlGroupTakenUp?: number;
  };

  // Offer outcome funnel. Stages: Eligible, Offered, Taken Up, Fulfilled.
  // Legacy payloads may still send Exposed / Viewed / Engaged / Redeemed; the UI maps those.
  redemptionFunnel: Array<{
    stage: string;
    value: number; // Count at this stage
    percentage?: number;
  }>;

  // Redemption Timeline Chart Data (Composed Chart: Bar + Line)
  // Bar: Redemptions per period
  // Line: Cumulative redemptions
  redemptionTimeline: Array<{
    period: string; // Period label based on range (daily/weekly/monthly)
    date?: string;
    redemptions: number; // Redemptions in this period
    cumulativeRedemptions: number; // Cumulative total
  }>;

  // Offer Type Comparison Chart Data (Multi-bar Chart)
  offerTypeComparison: Array<{
    type: string; // Catalog name from system.offer_types, e.g. "Data", "SEEDING"
    typeId?: number;
    isActive?: boolean;
    isSeedingReward?: boolean;
    redemptionRate: number; // Percentage
    aov: number; // Average order value
    marginPercent: number; // Margin percentage
    incrementalRevenue: number; // Incremental revenue
  }>;

  // Offer Table Data
  offers: Array<OfferRow>;
  totalOffers: number; // Total count for pagination

  heroTrends?: {
    totalRedemptions?: OfferReportTrend;
    redemptionRate?: OfferReportTrend;
    revenueGenerated?: OfferReportTrend;
    incrementalRevenue?: OfferReportTrend;
    totalCost?: OfferReportTrend;
    roi?: OfferReportTrend;
    eligible?: OfferReportTrend;
    offered?: OfferReportTrend;
    takenUp?: OfferReportTrend;
    fulfilled?: OfferReportTrend;
    takeUpRate?: OfferReportTrend;
    rewardCost?: OfferReportTrend;
    romi?: OfferReportTrend;
    valueGenerated?: OfferReportTrend;
    incrementalValue?: OfferReportTrend;
  };
  meta?: {
    timezone?: string;
    currency?: string;
    country?: string;
    range?: string;
    grain?: string;
    preset?: TimeWindowPreset;
    isCustom?: boolean;
    warning?: string;
    previousStartDate?: string;
    previousEndDate?: string;
    days?: number;
    startDate?: string;
    endDate?: string;
    computedAt?: string;
    source?: "live" | "snapshot";
    offerId?: number | null;
  };
}

export interface OfferRow {
  id: string;
  offerName: string;
  campaignName: string;
  segment: string;
  status: "Active" | "Expired" | "Scheduled" | "Paused" | string;
  targetGroup: number; // Size of target group
  controlGroup: number; // Size of control group
  messagesGenerated: number;
  sent: number;
  delivered: number;
  conversions: number;
  lastUpdated: string; // ISO 8601 format: YYYY-MM-DD
  revenue?: number;
  cost?: number;
}

export interface OfferReportEnvelope<T = unknown> {
  success: boolean;
  data?: T;
  trends?: OfferReportsResponse["heroTrends"];
  meta?: OfferReportsResponse["meta"];
  total?: number;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
  error?: string;
  message?: string;
}

export type OfferKpiSummary = OfferReportsResponse["summary"] & {
  sent?: number;
  delivered?: number;
  opened?: number;
  clicked?: number;
  converted?: number;
  uniqueConverters?: number;
  revenue?: number;
  deliveryRate?: number;
  openRate?: number;
  clickRate?: number;
  conversionRate?: number;
};

export interface OfferRevenueReport {
  totalRevenue: number;
  incrementalRevenue: number;
  totalRewardCost: number;
  deliveryCost: number;
  totalCost: number;
  roi: number;
  roiPercent: number;
  revenuePerContact: number;
  revenuePerConverter: number;
  sent?: number;
  delivered?: number;
  opened?: number;
  clicked?: number;
  converted?: number;
  uniqueConverters?: number;
  deliveryRate?: number;
  openRate?: number;
  clickRate?: number;
  conversionRate?: number;
}

export interface OfferRedemptionRow {
  status?: string;
  rewardType?: string;
  count?: number;
  totalRewardAmount?: number;
  totalCost?: number;
  avgAmount?: number;
}

export interface OfferABTestRow {
  test_id?: string | number;
  test_name?: string;
  status?: string;
  variant_id?: string | number;
  variant_name?: string;
  traffic_percentage?: number;
  metric_name?: string;
  metric_value?: number;
  sample_size?: number;
}

export interface OfferEligibility {
  id?: number;
  name?: string;
  code?: string;
  offerType?: string;
  maxUsagePerCustomer?: number | null;
  isReusable?: boolean;
  validFrom?: string | null;
  validTo?: string | null;
  status?: string;
  totalRedemptions?: number;
  uniqueRedeemers?: number;
  totalCost?: number;
}

export interface OfferLifecycleRow {
  previous_status?: string;
  new_status?: string;
  created_at?: string;
  changed_by?: string;
  comments?: string;
}

export interface OfferCategoryRow {
  category_id?: string | number;
  category_name?: string;
  offer_count?: number;
  total_conversions?: number;
  total_revenue?: number;
  avg_conversion_rate?: number;
}

export interface OfferSnapshotRefreshResult {
  upserted: number;
  computedAt: string;
}

export interface OfferLegacyPerformance {
  sent?: number;
  delivered?: number;
  opened?: number;
  clicked?: number;
  converted?: number;
  revenue?: number;
  conversionRate?: number;
  openRate?: number;
  clickRate?: number;
}

// ============================================================================
// SEGMENT REPORTS
// ============================================================================

/**
 * Endpoint: GET /monitoring/reporting/segments/portfolio
 *
 * Returns segment performance analytics including member growth,
 * size distribution, campaign usage, and segment table data.
 */

export interface SegmentReportTrend {
  value: number;
  direction: "up" | "down";
  label: string;
}

export interface SegmentReportsResponse {
  summary: {
    totalSegments: number;
    totalMembers: number;
    avgMemberGrowth: number;
    activeInCampaigns: number;
    /** @deprecated Use activityScore. Kept for live payload compatibility. */
    engagementRate: number;
    /** @deprecated Use takeUpRate. Kept for live payload compatibility. */
    conversionRate: number;
    activityScore?: number;
    takeUpRate?: number;
    arpu?: number;
    activeSubscribers?: number;
    dormantSubscribers?: number;
  };

  memberGrowth: Array<{
    period: string;
    date?: string;
    members: number;
    cumulativeMembers: number;
  }>;

  sizeDistribution: Array<{
    segmentId?: string;
    segmentName: string;
    members: number;
  }>;

  campaignUsage: Array<{
    segmentId?: string;
    segmentName: string;
    campaigns: number;
  }>;

  performanceComparison: Array<{
    segmentId?: string;
    segmentName: string;
    /** @deprecated Use activityScore. */
    engagement: number;
    /** @deprecated Use takeUpRate. */
    conversion: number;
    activityScore?: number;
    takeUpRate?: number;
  }>;

  segments: Array<SegmentReportRow>;
  totalSegments: number;

  heroTrends?: {
    totalSegments?: SegmentReportTrend;
    totalMembers?: SegmentReportTrend;
    avgMemberGrowth?: SegmentReportTrend;
    activeInCampaigns?: SegmentReportTrend;
    engagementRate?: SegmentReportTrend;
    conversionRate?: SegmentReportTrend;
    activityScore?: SegmentReportTrend;
    takeUpRate?: SegmentReportTrend;
    arpu?: SegmentReportTrend;
  };
  meta?: {
    timezone?: string;
    currency?: string;
    country?: string;
    range?: string;
    grain?: string;
    preset?: TimeWindowPreset;
    isCustom?: boolean;
    warning?: string;
    previousStartDate?: string;
    previousEndDate?: string;
    days?: number;
    startDate?: string;
    endDate?: string;
    computedAt?: string;
    source?: "live" | "snapshot";
    segmentId?: number | null;
  };
}

export interface SegmentReportRow {
  id: string;
  name: string;
  memberCount: number;
  growthRate: number;
  campaignsUsed: number;
  /** @deprecated Use activityScore. */
  engagementRate: number;
  /** @deprecated Use takeUpRate. */
  conversionRate: number;
  avgValue: number;
  activityScore?: number;
  takeUpRate?: number;
  arpu?: number;
  status: "Active" | "Inactive";
  lastUpdated: string;
}

// ============================================================================
// CAMPAIGN REPORTS
// ============================================================================

/**
 *
 * Returns campaign performance analytics including channel reach,
 * funnel, trends, revenue, and campaign table data.
 */

export interface CampaignReportsResponse {
  // Summary metrics — CVM core KPIs are sent, delivered, converted.
  summary: {
    eligibleAudience: number;
    executedAudience?: number;
    recipients: number;
    /** Unique customers reached (de-duplicated by customer identifier). */
    uniqueAudience: number;
    /** @deprecated Use uniqueAudience. Kept for live payload compatibility. */
    reach: number;
    /** Total messages dispatched across channels. */
    sent: number;
    /** @deprecated Use sent. Kept for live payload compatibility. */
    impressions: number;
    /** Customers the message was delivered to. */
    delivered: number;
    deliveryRate: number; // Percentage
    opens: number;
    clicks?: number;
    clickRate: number; // Percentage
    /** @deprecated Not a core CVM KPI. Kept for live payload compatibility. */
    engagementRate: number;
    conversions: number;
    converted: number;
    conversionRate: number; // Percentage
    uniqueConverters?: number;
    targetGroup: number;
    controlGroup: number;
    targetGroupReached?: number;
    controlGroupReached?: number;
    revenue: number; // Total revenue in currency units
    roas: number; // Return on marketing investment multiplier
    cac: number; // Customer acquisition cost
    leads: number;
    campaignCost: number; // Total campaign cost
  };

  // Channel Reach Chart Data (Bar Chart)
  channelReach: Array<{
    channel: string;
    channelCode?: string;
    channelId?: number;
    /** Unique customers reached on this channel. */
    uniqueAudience: number;
    /** @deprecated Use uniqueAudience. */
    reach: number;
    /** Messages sent on this channel. */
    sent: number;
    /** @deprecated Use sent. */
    impressions: number;
    delivered: number;
    conversions?: number;
    converted?: number;
    deliveryRate?: number;
    conversionRate?: number;
  }>;

  // Conversion Funnel Chart Data (Bar Chart)
  conversionFunnel: Array<{
    stage: string; // e.g., "Sent", "Delivered", "Converted"
    value: number; // Count at this stage
  }>;

  // Performance Trend Chart Data (Composed Chart: Multiple Lines)
  performanceTrend: Array<{
    period: string; // Period label based on range
    date?: string;
    sent?: number;
    delivered?: number;
    converted?: number;
    conversions?: number;
    deliveryRate?: number;
    conversionRate?: number;
    ctr: number; // Legacy click-through rate percentage
    engagement: number; // Legacy engagement rate percentage
    revenue: number; // Revenue in currency units
    spend: number; // Spend in currency units
  }>;

  // Revenue Trend Chart Data (Line Chart)
  revenueTrend: Array<{
    period: string; // Period label based on range
    revenue: number; // Revenue in currency units
    spend?: number;
    target: number; // Target revenue (optional)
  }>;

  // Campaign Table Data
  campaigns: Array<CampaignRow>;
  totalCampaigns: number; // Total count for pagination

  heroTrends?: {
    uniqueAudience?: CampaignReportTrend;
    reach?: CampaignReportTrend;
    sent?: CampaignReportTrend;
    delivered?: CampaignReportTrend;
    deliveryRate?: CampaignReportTrend;
    converted?: CampaignReportTrend;
    conversions?: CampaignReportTrend;
    conversionRate?: CampaignReportTrend;
    engagementRate?: CampaignReportTrend;
    revenue?: CampaignReportTrend;
    roas?: CampaignReportTrend;
    romi?: CampaignReportTrend;
    campaignCost?: CampaignReportTrend;
  };
  meta?: {
    timezone?: string;
    currency?: string;
    country?: string;
    range?: string;
    grain?: string;
    preset?: TimeWindowPreset;
    isCustom?: boolean;
    warning?: string;
    previousStartDate?: string;
    previousEndDate?: string;
    days?: number;
    startDate?: string;
    endDate?: string;
    computedAt?: string;
    source?: "live" | "snapshot";
    campaignId?: number | null;
    sources?: {
      summary?: boolean;
      notifications?: boolean;
      broadcasts?: boolean;
      channelCatalog?: number;
    };
  };
}

export interface CampaignReportTrend {
  value: number;
  direction: "up" | "down" | "flat";
  label: string;
}

export interface CampaignRow {
  id: string;
  name: string;
  segment?: string;
  offer?: string;
  targetGroup: number;
  controlGroup: number;
  controlGroupPercentage?: number;
  controlGroupEnabled?: boolean;
  sent: number;
  delivered: number;
  conversions: number; // TG conversions (treatment group)
  cgConversions: number; // CG conversions (control group)
  messagesGenerated: number;
  tgConversionPercentage?: number; // Target group conversion rate percentage
  cgConversionPercentage?: number; // Control group conversion rate percentage
  lastRunDate: string; // ISO 8601 format: YYYY-MM-DD
  startDate?: string;
  endDate?: string;
  status?: string;
  segmentCount?: number;
  offerCount?: number;
  revenue?: number;
  campaignCost?: number;
  budgetAllocated?: number;
  currentParticipants?: number;
  maxParticipants?: number;
}

export interface CampaignReportEnvelope<T = unknown> {
  success: boolean;
  data?: T;
  trends?: CampaignReportsResponse["heroTrends"];
  meta?: CampaignReportsResponse["meta"];
  total?: number;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
  error?: string;
  message?: string;
}

export type CampaignKpiSummary = CampaignReportsResponse["summary"] & {
  opened?: number;
  clicked?: number;
  failed?: number;
  openRate?: number;
};

export interface CampaignRoiReport {
  totalRevenue: number;
  incrementalRevenue: number;
  totalRewardCost: number;
  campaignCost: number;
  roiPercent: number;
  roas: number;
  revenuePerContact: number;
  revenuePerConverter: number;
}

export interface CampaignControlReport {
  treatmentConversions: number;
  controlConversions: number;
  treatmentRevenue: number;
  controlRevenue: number;
  uniqueConverters: number;
  controlGroupCount: number;
  liftVsControl: number;
  isStatisticallySignificant: boolean;
  bestPValue: number | null;
}

export interface CampaignBudgetReport {
  name?: string;
  status?: string;
  budget_allocated?: number;
  budget_spent?: number;
  target_reach?: number;
  target_revenue?: number;
  target_conversion_rate?: number;
  budget_utilization_pct?: number | null;
  revenue_attainment_pct?: number | null;
  actual_revenue?: number;
  roas?: number;
}

export interface CampaignBroadcastRun {
  broadcast_id?: string | number;
  broadcast_name?: string;
  run_id?: string | number;
  status?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  messages_queued?: number;
  messages_sent?: number;
  messages_delivered?: number;
  messages_failed?: number;
  total_batches?: number;
  processed_count?: number;
  error_count?: number;
  retry_count?: number;
  avg_processing_time_ms?: number;
  delivery_rate?: number;
}

export interface CampaignRewardRow {
  reward_type?: string;
  status?: string;
  count?: number;
  total_reward_amount?: number;
  total_cost?: number;
  avg_reward_amount?: number;
}

export interface CampaignAttributionRow {
  condition_type?: string;
  notification_channel?: string;
  product_code?: string;
  conversions?: number;
  incremental_conversions?: number;
  total_revenue?: number;
  avg_hours_to_convert?: number;
  avg_confidence?: number;
}

export interface CampaignLifecycleRow {
  previous_status?: string;
  new_status?: string;
  created_at?: string;
  changed_by?: string;
  comments?: string;
}

export interface CampaignSnapshotRefreshResult {
  upserted: number;
  computedAt: string;
}

// ============================================================================
// DELIVERY SMS REPORTS
// ============================================================================

/**
 * GET /monitoring/reporting/sms/portfolio
 *
 * SMS channel delivery for the selected window: dispatch, handset delivery,
 * subscriber reach, offer take-up, and opt-out. Digital-marketing aliases
 * (open rate, click-through, conversion) are accepted on the payload and
 * mapped to CVM measures before the UI reads them.
 */

export type SmsDeliveryStatus = "Delivered" | "Failed" | "Pending" | "Rejected";

export interface SmsDeliveryReportTrend {
  value: number;
  direction: "up" | "down";
  label: string;
}

export interface DeliverySMSReportsResponse {
  summary: {
    sent: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
    failedRate: number;
    subscribersReached: number;
    takenUp: number;
    takeUpRate: number;
    optOutRate: number;
    /** @deprecated Use takenUp. Kept so older payloads still parse. */
    conversions: number;
    /** @deprecated Use takeUpRate. */
    conversionRate: number;
    /** @deprecated Digital-marketing alias. Not shown. */
    openRate?: number;
    /** @deprecated Digital-marketing alias. Not shown. */
    ctr?: number;
  };

  deliveryTimeline: Array<{
    period: string;
    date?: string;
    sent: number;
    delivered: number;
    takenUp: number;
    /** @deprecated Use takenUp. */
    converted: number;
  }>;

  broadcasts: Array<SmsBroadcastRow>;
  /** @deprecated Use broadcasts. */
  messageLogs: Array<SMSLogEntry>;
  totalLogs: number;
  totalBroadcasts: number;

  heroTrends?: {
    sent?: SmsDeliveryReportTrend;
    delivered?: SmsDeliveryReportTrend;
    deliveryRate?: SmsDeliveryReportTrend;
    failedRate?: SmsDeliveryReportTrend;
    subscribersReached?: SmsDeliveryReportTrend;
    takenUp?: SmsDeliveryReportTrend;
    takeUpRate?: SmsDeliveryReportTrend;
    optOutRate?: SmsDeliveryReportTrend;
  };
  meta?: {
    timezone?: string;
    range?: string;
    grain?: string;
    preset?: TimeWindowPreset;
    total?: number;
    page?: number;
    pageSize?: number;
    computedAt?: string;
    source?: "live" | "snapshot";
  };
}

/** One SMS broadcast in the delivery log, tied to campaign, offer, and segment. */
export interface SmsBroadcastRow {
  id: string;
  campaignId: string;
  campaignName: string;
  offerId?: string;
  offerName: string;
  segmentId?: string;
  segmentName: string;
  status: SmsDeliveryStatus;
  sent: number;
  delivered: number;
  subscribersReached: number;
  takenUp: number;
  takeUpRate: number;
  timestamp: string;
  errorCode?: string;
}

export interface SMSLogEntry {
  id: string;
  campaignId: string;
  campaignName: string;
  recipient: string;
  region: string;
  senderId: string;
  timestamp: string;
  status: SmsDeliveryStatus;
  sent: number;
  delivered: number;
  conversions: number;
  conversionRate: number;
  errorCode?: string;
}

// ============================================================================
// DELIVERY EMAIL REPORTS
// ============================================================================

/**
 * GET /monitoring/reporting/email/portfolio
 *
 * Email-channel delivery for the selected window: dispatch, mailbox delivery,
 * subscriber reach, offer take-up, bounce, and opt-out. Digital-marketing
 * aliases (open rate, click-through, conversion, unsubscribe) are accepted on
 * the payload and mapped to CVM measures before the UI reads them.
 */

export type EmailDeliveryStatus = "Delivered" | "Bounced" | "Deferred" | "Rejected";

export interface EmailDeliveryReportTrend {
  value: number;
  direction: "up" | "down";
  label: string;
}

export interface DeliveryEmailReportsResponse {
  summary: {
    sent: number;
    delivered: number;
    bounced: number;
    deliveryRate: number;
    bounceRate: number;
    subscribersReached: number;
    takenUp: number;
    takeUpRate: number;
    optOutRate: number;
    /** @deprecated Use takenUp. Kept so older payloads still parse. */
    conversions: number;
    /** @deprecated Use takeUpRate. */
    conversionRate: number;
    /** @deprecated Digital-marketing alias. Not shown. */
    openRate?: number;
    /** @deprecated Digital-marketing alias. Not shown. */
    ctr?: number;
    /** @deprecated Use optOutRate. */
    unsubscribeRate?: number;
  };

  deliveryTimeline: Array<{
    period: string;
    date?: string;
    sent: number;
    delivered: number;
    takenUp: number;
    /** @deprecated Use takenUp. */
    converted: number;
  }>;

  dispatches: Array<EmailDispatchRow>;
  /** @deprecated Use dispatches. */
  emailLogs: Array<EmailLogEntry>;
  totalLogs: number;
  totalDispatches: number;

  heroTrends?: {
    sent?: EmailDeliveryReportTrend;
    delivered?: EmailDeliveryReportTrend;
    deliveryRate?: EmailDeliveryReportTrend;
    bounceRate?: EmailDeliveryReportTrend;
    subscribersReached?: EmailDeliveryReportTrend;
    takenUp?: EmailDeliveryReportTrend;
    takeUpRate?: EmailDeliveryReportTrend;
    optOutRate?: EmailDeliveryReportTrend;
  };
  meta?: {
    timezone?: string;
    range?: string;
    grain?: string;
    preset?: TimeWindowPreset;
    total?: number;
    page?: number;
    pageSize?: number;
    computedAt?: string;
    source?: "live" | "snapshot";
  };
}

/** One email dispatch in the delivery log, tied to campaign, offer, and segment. */
export interface EmailDispatchRow {
  id: string;
  campaignId: string;
  campaignName: string;
  offerId?: string;
  offerName: string;
  segmentId?: string;
  segmentName: string;
  status: EmailDeliveryStatus;
  sent: number;
  delivered: number;
  subscribersReached: number;
  takenUp: number;
  takeUpRate: number;
  sentDate: string;
  errorCode?: string;
}

export interface EmailLogEntry {
  id: string;
  campaignId: string;
  campaignName: string;
  status: EmailDeliveryStatus;
  sent: number;
  delivered: number;
  conversions: number;
  conversionRate: number;
  sentDate: string;
  offerName?: string;
  segmentName?: string;
}

// ============================================================================
// OVERALL DASHBOARD PERFORMANCE
// ============================================================================

/**
 * Portfolio assembled from the campaign, offer, email, SMS, segment, and
 * subscriber report endpoints for the same time window.
 * Measures use CVM terms. Digital-marketing aliases (clicks, CTR, open rate,
 * ROAS, CPC) are not part of this contract.
 */
export interface OverallDashboardPerformanceResponse {
  subscribersReached: number;
  dispatched: number;
  delivered: number;
  deliveryRate: number;
  takenUp: number;
  takeUpRate: number;
  valueGenerated: number;
  romi: number;
  activeSubscribers: number;
  arpu: number;
  churnRate: number;
  segmentPortfolio: number;
  subscriberBase: number;
  campaignCount: number;
  offerCount: number;
  channels: OverallChannelPerformance[];
  deliveryTimeline: OverallDeliveryPoint[];
  offerLifecycle: Array<{ stage: string; value: number }>;
  valueBands: Array<{ segment: string; subscribers: number }>;
  domains: OverallDomainSnapshot[];
  sourceErrors?: string[];
}

export type OverallReportDomain =
  | "campaigns"
  | "offers"
  | "email"
  | "sms"
  | "segments"
  | "profiles";

export interface OverallChannelPerformance {
  channel: string;
  channelCode?: string;
  dispatched: number;
  delivered: number;
  subscribersReached: number;
  takenUp: number;
  deliveryRate: number;
  takeUpRate: number;
  optOutRate: number;
}

export interface OverallChannelVolume {
  channel: string;
  dispatched: number;
  delivered: number;
  takenUp: number;
}

export interface OverallDeliveryPoint {
  period: string;
  channels: OverallChannelVolume[];
}

export interface OverallDomainSnapshot {
  id: OverallReportDomain;
  available: boolean;
  metrics: Array<{ label: string; value: string }>;
}

// ============================================================================
// FILTERING & SORTING
// ============================================================================

/**
 * Common filter options for report tables
 */
export interface TableFilters {
  search?: string; // Text search across relevant fields
  status?: string[]; // Filter by status (varies by report type)
  dateFrom?: string; // ISO 8601 format: YYYY-MM-DD
  dateTo?: string; // ISO 8601 format: YYYY-MM-DD
  segment?: string[]; // Filter by segment
  channel?: string[]; // Filter by channel
}

/**
 * Sort options for report tables
 */
export interface TableSort {
  field: string; // Field name to sort by
  order: "asc" | "desc";
}

// ============================================================================
// EXPORT FUNCTIONALITY
// ============================================================================

/**
 * Export options for report data
 */
export interface ExportOptions {
  format: "csv" | "xlsx" | "pdf";
  includeCharts?: boolean; // Whether to include chart images in export
  dateRange?: DateRange; // Date range for export (if different from current view)
}

/**
 * Export endpoint response
 */
export interface ExportResponse {
  downloadUrl: string; // URL to download the exported file
  expiresAt: string; // ISO 8601 format: when the download URL expires
}
