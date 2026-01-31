export type SystemEventCategory = "transaction" | "usage" | "engagement" | "account";
export type SystemEventTimeOperator =
  | "occurred"
  | "occurred_in_last"
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
  | "customer_recharge"
  | "data_bundle_purchase"
  | "voice_bundle_purchase"
  | "call_made"
  | "sms_sent"
  | "data_session"
  | "customer_login"
  | "app_opened"
  | "profile_update"
  | "password_reset";

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
  {
    id: 1,
    event_code: "customer_recharge",
    event_name: "Recharge",
    event_description: "Customer added airtime/credit to account",
    category: "transaction",
    source_table: "OCS_VOU",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "greater_than", "equals", "never_occurred"],
  },
  {
    id: 2,
    event_code: "data_bundle_purchase",
    event_name: "Data Bundle Purchase",
    event_description: "Customer purchased a data bundle",
    category: "transaction",
    source_table: "OCS_MON",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "greater_than", "never_occurred"],
  },
  {
    id: 3,
    event_code: "voice_bundle_purchase",
    event_name: "Voice Bundle Purchase",
    event_description: "Customer purchased a voice/call bundle",
    category: "transaction",
    source_table: "OCS_MGR",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "greater_than", "never_occurred"],
  },

  {
    id: 4,
    event_code: "call_made",
    event_name: "Call Made",
    event_description: "Customer made a phone call",
    category: "usage",
    source_table: "OCS_REC",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "greater_than", "never_occurred"],
  },
  {
    id: 5,
    event_code: "sms_sent",
    event_name: "SMS Sent",
    event_description: "Customer sent an SMS message",
    category: "usage",
    source_table: "OCS_SMS",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "greater_than", "never_occurred"],
  },
  {
    id: 6,
    event_code: "data_session",
    event_name: "Data Session",
    event_description: "Customer used data/internet",
    category: "usage",
    source_table: "OCS_DATA",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "greater_than", "never_occurred"],
  },

  {
    id: 7,
    event_code: "app_opened",
    event_name: "App Opened",
    event_description: "Customer opened the mobile app",
    category: "engagement",
    source_table: "APP_LOGS",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "greater_than", "never_occurred"],
  },
  {
    id: 8,
    event_code: "customer_login",
    event_name: "Customer Login",
    event_description: "Customer logged into their account",
    category: "engagement",
    source_table: "APP_LOGS",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "greater_than", "never_occurred"],
  },

  {
    id: 9,
    event_code: "profile_update",
    event_name: "Profile Updated",
    event_description: "Customer updated their profile information",
    category: "account",
    source_table: "APP_LOGS",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "never_occurred"],
  },
  {
    id: 10,
    event_code: "password_reset",
    event_name: "Password Reset",
    event_description: "Customer reset their account password",
    category: "account",
    source_table: "APP_LOGS",
    data_source: "Live",
    frequency: "Per Min",
    time_operators: ["occurred", "occurred_in_last", "never_occurred"],
  },
];

export const SYSTEM_EVENTS_BY_CATEGORY = {
  transaction: SYSTEM_EVENTS.filter((e) => e.category === "transaction"),
  usage: SYSTEM_EVENTS.filter((e) => e.category === "usage"),
  engagement: SYSTEM_EVENTS.filter((e) => e.category === "engagement"),
  account: SYSTEM_EVENTS.filter((e) => e.category === "account"),
};

export const SYSTEM_EVENT_CATEGORIES = [
  { value: "transaction", label: "Transaction Events" },
  { value: "usage", label: "Usage Events" },
  { value: "engagement", label: "Engagement Events" },
  { value: "account", label: "Account Events" },
] as const;
