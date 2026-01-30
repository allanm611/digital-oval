export type RangeOption = "7d" | "30d" | "90d";

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface ReportQueryParams {
  range?: RangeOption; // Default: "30d"
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
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
 * Endpoint: GET /api/reports/offers
 *
 * Returns offer performance analytics including redemption funnel,
 * timeline, type comparison, and offer table data.
 */

export interface OfferReportsResponse {
  // Summary metrics
  summary: {
    totalRedemptions: number;
    redemptionRate: number; // Percentage (e.g., 3.4 for 3.4%)
    revenueGenerated: number; // Total revenue in currency units
    incrementalRevenue: number; // Incremental revenue in currency units
    totalCost: number; // Total cost in currency units
    roi: number; // Return on investment (e.g., 2.3 for 230%)
  };

  // Redemption Funnel Chart Data (Bar Chart)
  redemptionFunnel: Array<{
    stage: string; // e.g., "Eligible", "Sent", "Delivered", "Opened", "Clicked", "Redeemed"
    value: number; // Count at this stage
    percentage?: number; // Percentage of total (optional, can be calculated client-side)
  }>;

  // Redemption Timeline Chart Data (Composed Chart: Bar + Line)
  // Bar: Redemptions per period
  // Line: Cumulative redemptions
  redemptionTimeline: Array<{
    period: string; // Period label based on range (daily/weekly/monthly)
    redemptions: number; // Redemptions in this period
    cumulativeRedemptions: number; // Cumulative total
  }>;

  // Offer Type Comparison Chart Data (Multi-bar Chart)
  offerTypeComparison: Array<{
    type: string; // Offer type: "Discount", "Cashback", "Free Shipping", etc.
    redemptionRate: number; // Percentage
    aov: number; // Average order value
    marginPercent: number; // Margin percentage
    incrementalRevenue: number; // Incremental revenue
  }>;

  // Offer Table Data
  offers: Array<OfferRow>;
  totalOffers: number; // Total count for pagination
}

export interface OfferRow {
  id: string;
  offerName: string;
  campaignName: string;
  segment: string;
  status: "Active" | "Expired" | "Scheduled" | "Paused";
  targetGroup: number; // Size of target group
  controlGroup: number; // Size of control group
  messagesGenerated: number;
  sent: number;
  delivered: number;
  conversions: number;
  lastUpdated: string; // ISO 8601 format: YYYY-MM-DD
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
  // Summary metrics
  summary: {
    eligibleAudience: number;
    recipients: number;
    reach: number;
    impressions: number;
    opens: number;
    clickRate: number; // Percentage
    engagementRate: number; // Percentage
    conversions: number;
    conversionRate: number; // Percentage
    revenue: number; // Total revenue in currency units
    roas: number; // Return on ad spend
    cac: number; // Customer acquisition cost
    leads: number;
    campaignCost: number; // Total campaign cost
  };

  // Channel Reach Chart Data (Bar Chart)
  channelReach: Array<{
    channel: string; // e.g., "Email", "SMS", "Push", "Social"
    reach: number;
    impressions: number;
  }>;

  // Conversion Funnel Chart Data (Bar Chart)
  conversionFunnel: Array<{
    stage: string; // e.g., "Sent", "Delivered", "Opened", "Clicked", "Converted"
    value: number; // Count at this stage
  }>;

  // Performance Trend Chart Data (Composed Chart: Multiple Lines)
  performanceTrend: Array<{
    period: string; // Period label based on range
    ctr: number; // Click-through rate percentage
    engagement: number; // Engagement rate percentage
    revenue: number; // Revenue in currency units
    spend: number; // Spend in currency units
  }>;

  // Revenue Trend Chart Data (Line Chart)
  revenueTrend: Array<{
    period: string; // Period label based on range
    revenue: number; // Revenue in currency units
    target: number; // Target revenue (optional)
  }>;

  // Campaign Table Data
  campaigns: Array<CampaignRow>;
  totalCampaigns: number; // Total count for pagination
}

export interface CampaignRow {
  id: string;
  name: string;
  segment: string;
  offer: string;
  targetGroup: number;
  controlGroup: number;
  sent: number;
  delivered: number;
  conversions: number;
  messagesGenerated: number;
  lastRunDate: string; // ISO 8601 format: YYYY-MM-DD
}

// ============================================================================
// DELIVERY SMS REPORTS
// ============================================================================

/**
 *
 * Returns SMS delivery analytics including delivery rates, conversion rates,
 * and message log data.
 */

export interface DeliverySMSReportsResponse {
  // Summary snapshot
  summary: {
    sent: number;
    delivered: number;
    deliveryRate: number; // Percentage
    failedRate: number; // Percentage
    conversionRate: number; // Percentage
    conversions: number;
    openRate: number; // Percentage (if applicable)
    ctr: number; // Click-through rate percentage
    optOutRate: number; // Percentage
  };

  // Delivery Timeline Chart Data (Bar Chart)
  deliveryTimeline: Array<{
    period: string; // Period label based on range (daily/weekly/monthly)
    sent: number;
    delivered: number;
    converted: number; // Conversions from this period
  }>;

  // Message Log Table Data
  messageLogs: Array<SMSLogEntry>;
  totalLogs: number; // Total count for pagination
}

export interface SMSLogEntry {
  id: string;
  campaignId: string;
  campaignName: string;
  recipient: string; // Phone number or masked identifier
  region: string; // Geographic region
  senderId: string;
  timestamp: string; // ISO 8601 format: YYYY-MM-DDTHH:mm:ssZ
  status: "Delivered" | "Failed" | "Pending" | "Rejected";
  sent: number; // Count sent
  delivered: number; // Count delivered
  conversions: number; // Count converted
  conversionRate: number; // Percentage
  errorCode?: string; // Error code if status is Failed/Rejected
}

// ============================================================================
// DELIVERY EMAIL REPORTS
// ============================================================================

/**
 *
 * Returns email delivery analytics including delivery rates, bounce rates,
 * open rates, and email log data.
 */

export interface DeliveryEmailReportsResponse {
  // Summary snapshot
  summary: {
    sent: number;
    delivered: number;
    deliveryRate: number; // Percentage
    conversionRate: number; // Percentage
    conversions: number;
    bounceRate: number; // Percentage
    openRate: number; // Percentage
    ctr: number; // Click-through rate percentage
    unsubscribeRate: number; // Percentage
  };

  // Delivery Timeline Chart Data (Bar Chart)
  deliveryTimeline: Array<{
    period: string; // Period label based on range (daily/weekly/monthly)
    sent: number;
    delivered: number;
    converted: number; // Conversions from this period
  }>;

  // Email Log Table Data
  emailLogs: Array<EmailLogEntry>;
  totalLogs: number; // Total count for pagination
}

export interface EmailLogEntry {
  id: string;
  campaignId: string;
  campaignName: string;
  status: "Delivered" | "Bounced" | "Deferred" | "Spam";
  sent: number; // Count sent
  delivered: number; // Count delivered
  conversions: number; // Count converted
  conversionRate: number; // Percentage
  sentDate: string; // ISO 8601 format: YYYY-MM-DD
}

// ============================================================================
// OVERALL DASHBOARD PERFORMANCE
// ============================================================================

/**
 *
 * Returns overall dashboard performance metrics across all channels
 * including KPIs, channel breakdown, SMS delivery, and time series data.
 */

export interface OverallDashboardPerformanceResponse {
  // KPI Snapshot
  kpiSnapshot: {
    totalReach: number;
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number; // Total revenue in currency units
    totalSpend: number; // Total spend in currency units
    overallROAS: number; // Return on ad spend
    averageCTR: number; // Average click-through rate percentage
    averageCVR: number; // Average conversion rate percentage
  };

  // Channel Performance Breakdown
  channelSnapshot: Array<ChannelPerformance>;

  // SMS Delivery Snapshot
  smsDeliverySnapshot: {
    sent: number;
    delivered: number;
    deliveryRate: number; // Percentage
    conversionRate: number; // Percentage
    conversions: number;
  };

  // Time Series Performance
  timeSeriesSnapshot: Array<{
    date: string; // ISO 8601 format: YYYY-MM-DD
    reach: number;
    clicks: number;
    conversions: number;
    revenue: number; // Revenue in currency units
  }>;
}

export interface ChannelPerformance {
  channel: string; // e.g., "Email", "SMS", "Push", "Social"
  reach: number;
  clicks: number;
  opens: number; // For Email/SMS
  conversions: number;
  revenue: number; // Revenue in currency units
  spend: number; // Spend in currency units
  ctr: number; // Click-through rate percentage
  openRate: number; // Open rate percentage (for Email/SMS)
  cvr: number; // Conversion rate percentage
  cpc: number; // Cost per click
  cpl: number; // Cost per lead
  cpa: number; // Cost per acquisition
  roas: number; // Return on ad spend
  engagementRate: number; // Engagement rate percentage (for Social)
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
