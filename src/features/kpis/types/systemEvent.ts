export type SystemEventCategory = "email" | "sms" | "campaign" | "customer_journey" | "customer_care";
export type SystemEventTimeOperator =
  | "occurred"
  | "occurred_in_last"
  | "on_date"
  | "between_dates"
  | "greater_than"
  | "equals"
  | "less_than"
  | "never_occurred";

export interface SystemEventTimeOperatorOption {
  value: SystemEventTimeOperator;
  label: string;
  requiresValue: boolean;
  valueType?: "number" | "days" | "months";
  placeholder?: string;
}

export interface SystemEvent {
  id: number;
  event_code: string;
  event_name: string;
  event_description: string;
  category: SystemEventCategory;
  source_table: string;
  data_source: "Live" | "DB";
  frequency: "Per Min" | "Daily" | "Monthly";

  time_operators: SystemEventTimeOperator[];

  created_at?: string;
  updated_at?: string;
}

export type SystemEventCode =
  // Email
  | "email_sent"
  | "email_delivered"
  | "email_opened"
  | "email_clicked"
  | "email_bounced"
  | "email_unsubscribed"
  // SMS
  | "sms_sent"
  | "sms_delivered"
  | "sms_failed"
  | "sms_clicked"
  // Campaign
  | "campaign_executed"
  | "campaign_conversion"
  | "offer_accepted"
  | "offer_rejected"
  // Customer Journey
  | "customer_subscribed"
  | "customer_unsubscribed"
  | "profile_updated_cvm"
  // Customer Care
  | "customer_care_contact"
  | "complaint_logged"
  | "support_ticket_created";

export const TIME_OPERATOR_OPTIONS: Record<SystemEventTimeOperator, SystemEventTimeOperatorOption> = {
  occurred: {
    value: "occurred",
    label: "Ever Occurred",
    requiresValue: false,
  },
  occurred_in_last: {
    value: "occurred_in_last",
    label: "Occurred in Last",
    requiresValue: true,
    valueType: "number",
    placeholder: "e.g., 7",
  },
  on_date: {
    value: "on_date",
    label: "On Date",
    requiresValue: true,
    valueType: "number",
    placeholder: "Select date",
  },
  between_dates: {
    value: "between_dates",
    label: "Between Dates",
    requiresValue: true,
    valueType: "number",
    placeholder: "Select dates",
  },
  greater_than: {
    value: "greater_than",
    label: "Greater Than",
    requiresValue: true,
    valueType: "number",
    placeholder: "e.g., 5",
  },
  less_than: {
    value: "less_than",
    label: "Less Than",
    requiresValue: true,
    valueType: "number",
    placeholder: "e.g., 10",
  },
  equals: {
    value: "equals",
    label: "Equals",
    requiresValue: true,
    valueType: "number",
    placeholder: "e.g., 3",
  },
  never_occurred: {
    value: "never_occurred",
    label: "Never Occurred",
    requiresValue: false,
  },
};

export const SYSTEM_EVENTS: SystemEvent[] = [
  // ==================== EMAIL EVENTS ====================
  {
    id: 1,
    event_code: "email_sent",
    event_name: "Email Sent",
    event_description: "Email campaign message sent to customer",
    category: "email",
    source_table: "CAMPAIGN_EMAIL_LOGS",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "greater_than", "equals", "never_occurred"],
  },
  {
    id: 2,
    event_code: "email_delivered",
    event_name: "Email Delivered",
    event_description: "Email successfully delivered to customer inbox",
    category: "email",
    source_table: "CAMPAIGN_EMAIL_LOGS",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "greater_than", "never_occurred"],
  },
  {
    id: 3,
    event_code: "email_opened",
    event_name: "Email Opened",
    event_description: "Customer opened the email message",
    category: "email",
    source_table: "CAMPAIGN_EMAIL_LOGS",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "greater_than", "never_occurred"],
  },
  {
    id: 4,
    event_code: "email_clicked",
    event_name: "Email Link Clicked",
    event_description: "Customer clicked a link in the email",
    category: "email",
    source_table: "CAMPAIGN_EMAIL_LOGS",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "greater_than", "never_occurred"],
  },
  {
    id: 5,
    event_code: "email_bounced",
    event_name: "Email Bounced",
    event_description: "Email delivery failed (hard or soft bounce)",
    category: "email",
    source_table: "CAMPAIGN_EMAIL_LOGS",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "greater_than", "never_occurred"],
  },
  {
    id: 6,
    event_code: "email_unsubscribed",
    event_name: "Email Unsubscribed",
    event_description: "Customer unsubscribed from email campaigns",
    category: "email",
    source_table: "CAMPAIGN_EMAIL_LOGS",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "never_occurred"],
  },

  // ==================== SMS EVENTS ====================
  {
    id: 7,
    event_code: "sms_sent",
    event_name: "SMS Sent",
    event_description: "SMS campaign message sent to customer",
    category: "sms",
    source_table: "CAMPAIGN_SMS_LOGS",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "greater_than", "equals", "never_occurred"],
  },
  {
    id: 8,
    event_code: "sms_delivered",
    event_name: "SMS Delivered",
    event_description: "SMS successfully delivered to customer",
    category: "sms",
    source_table: "CAMPAIGN_SMS_LOGS",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "greater_than", "never_occurred"],
  },
  {
    id: 9,
    event_code: "sms_failed",
    event_name: "SMS Failed",
    event_description: "SMS delivery failed",
    category: "sms",
    source_table: "CAMPAIGN_SMS_LOGS",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "greater_than", "never_occurred"],
  },
  {
    id: 10,
    event_code: "sms_clicked",
    event_name: "SMS Link Clicked",
    event_description: "Customer clicked a link in SMS message",
    category: "sms",
    source_table: "CAMPAIGN_SMS_LOGS",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "greater_than", "never_occurred"],
  },

  // ==================== CAMPAIGN EVENTS ====================
  {
    id: 11,
    event_code: "campaign_executed",
    event_name: "Campaign Executed",
    event_description: "Customer was targeted by a campaign",
    category: "campaign",
    source_table: "CAMPAIGN_EXECUTION_LOGS",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "greater_than", "equals", "never_occurred"],
  },
  {
    id: 12,
    event_code: "campaign_conversion",
    event_name: "Campaign Conversion",
    event_description: "Customer converted after campaign (achieved goal)",
    category: "campaign",
    source_table: "CAMPAIGN_EXECUTION_LOGS",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "greater_than", "never_occurred"],
  },
  {
    id: 13,
    event_code: "offer_accepted",
    event_name: "Offer Accepted",
    event_description: "Customer accepted a campaign offer",
    category: "campaign",
    source_table: "CAMPAIGN_EXECUTION_LOGS",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "greater_than", "never_occurred"],
  },
  {
    id: 14,
    event_code: "offer_rejected",
    event_name: "Offer Rejected",
    event_description: "Customer rejected or ignored campaign offer",
    category: "campaign",
    source_table: "CAMPAIGN_EXECUTION_LOGS",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "greater_than", "never_occurred"],
  },

  // ==================== CUSTOMER JOURNEY EVENTS ====================
  {
    id: 15,
    event_code: "customer_subscribed",
    event_name: "Customer Subscribed",
    event_description: "Customer subscribed to CVM communications",
    category: "customer_journey",
    source_table: "CUSTOMER_PROFILE_LOGS",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "never_occurred"],
  },
  {
    id: 16,
    event_code: "customer_unsubscribed",
    event_name: "Customer Unsubscribed",
    event_description: "Customer unsubscribed from CVM communications",
    category: "customer_journey",
    source_table: "CUSTOMER_PROFILE_LOGS",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "never_occurred"],
  },
  {
    id: 17,
    event_code: "profile_updated_cvm",
    event_name: "Profile Updated (CVM)",
    event_description: "Customer profile updated via CVM system",
    category: "customer_journey",
    source_table: "CUSTOMER_PROFILE_LOGS",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "greater_than", "never_occurred"],
  },

  // ==================== CUSTOMER CARE EVENTS ====================
  {
    id: 18,
    event_code: "customer_care_contact",
    event_name: "Customer Care Contact",
    event_description: "Customer contacted customer care/support",
    category: "customer_care",
    source_table: "CUSTOMER_CARE_LOGS",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "greater_than", "never_occurred"],
  },
  {
    id: 19,
    event_code: "complaint_logged",
    event_name: "Complaint Logged",
    event_description: "Customer complaint was logged in the system",
    category: "customer_care",
    source_table: "CUSTOMER_CARE_LOGS",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "greater_than", "never_occurred"],
  },
  {
    id: 20,
    event_code: "support_ticket_created",
    event_name: "Support Ticket Created",
    event_description: "Support ticket created for customer issue",
    category: "customer_care",
    source_table: "CUSTOMER_CARE_LOGS",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "greater_than", "never_occurred"],
  },
];

export const SYSTEM_EVENTS_BY_CATEGORY = {
  email: SYSTEM_EVENTS.filter((e) => e.category === "email"),
  sms: SYSTEM_EVENTS.filter((e) => e.category === "sms"),
  campaign: SYSTEM_EVENTS.filter((e) => e.category === "campaign"),
  customer_journey: SYSTEM_EVENTS.filter((e) => e.category === "customer_journey"),
  customer_care: SYSTEM_EVENTS.filter((e) => e.category === "customer_care"),
};

export const SYSTEM_EVENT_CATEGORIES = [
  { value: "email", label: "Email Events" },
  { value: "sms", label: "SMS Events" },
  { value: "campaign", label: "Campaign Events" },
  { value: "customer_journey", label: "Customer Journey Events" },
  { value: "customer_care", label: "Customer Care Events" },
] as const;
