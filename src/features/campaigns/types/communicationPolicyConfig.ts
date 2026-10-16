
export type CommunicationPolicyType =
  | "timeWindow"
  | "maximumCommunication"
  | "dnd"
  | "vipList";

export interface TimeWindowConfig {
  startTime: string;
  endTime: string;
  timezone?: string;
  days?: string[];
}

export interface FrequencyCappingPeriod {
  type: "daily" | "weekly" | "monthly";
  maxCount: number;
}

export interface MaximumCommunicationConfig {
  /** Cap enforced by the current broadcast engine. Mirrors the daily period when one exists. */
  type: "daily" | "weekly" | "monthly";
  maxCount: number;
  resetTime?: string;
  resetDay?: string;
  /** Every period the user configured. This is the source of truth for create/edit. */
  periods?: FrequencyCappingPeriod[];
}

export interface DNDConfig {
  categories: DNDCategory[];
}

export interface DNDCategory {
  id: string;
  name: string;
  description?: string;
  status: "start" | "stop";
  type: string;
  value?: "allowed" | "not allowed";
}

export interface VIPListRule {
  vipListId: string;
  vipListName?: string;
  action: "include" | "exclude";
  priority: number;
}

export interface VIPListConfig {
  /**
   * Legacy single action used by the exclusion engine.
   * "exclude" when any rule excludes a list; those lists are the only entries in vipLists.
   */
  action: "include" | "exclude";
  vipLists: VIPList[];
  priority?: number;
  /** Per-list action and priority. This is the source of truth for create/edit. */
  rules?: VIPListRule[];
}

export interface VIPList {
  id: string;
  name: string;
  description?: string;
  customerCount?: number;
  status: "active" | "inactive";
}

/** One policy can enforce any combination of these configurations. */
export interface PolicyConfigurationBundle {
  timeWindow?: TimeWindowConfig | null;
  maximumCommunication?: MaximumCommunicationConfig | null;
  dnd?: DNDConfig | null;
  vipList?: VIPListConfig | null;
}

export type CommunicationPolicyConfigValue =
  | TimeWindowConfig
  | MaximumCommunicationConfig
  | DNDConfig
  | VIPListConfig
  | PolicyConfigurationBundle;

export interface CommunicationPolicyConfiguration {
  id: number;
  name: string;
  description?: string;
  channels: string[];
  type_code: string;
  type_codes?: string[];
  config: CommunicationPolicyConfigValue;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCommunicationPolicyRequest {
  name: string;
  description?: string;
  channels: string[];
  type_code: string;
  /** Configurations included on this save. Omitted keys are removed on update. */
  type_codes?: CommunicationPolicyType[];
  config: CommunicationPolicyConfigValue;
  is_active?: boolean;
}

export const COMMUNICATION_POLICY_TYPES = [
  {
    value: "timeWindow" as const,
    label: "Time Window",
    description:
      "Define interval time between start and end time for communications",
    icon: "🕐",
  },
  {
    value: "maximumCommunication" as const,
    label: "Frequency Capping",
    description:
      "Limits the maximum number of communications a customer can receive daily, weekly, or monthly.",
    icon: "📊",
  },
  {
    value: "dnd" as const,
    label: "Do Not Disturb (DND)",
    description:
      "Manage customer preferences for different types of communications",
    icon: "🔕",
  },
  {
    value: "vipList" as const,
    label: "VIP List Rules",
    description:
      "Defines inclusion or exclusion rules for high-priority VIP customer lists.",
    icon: "⭐",
  },
] as const;

export const DND_CATEGORIES = [
  {
    type: "marketing",
    label: "Marketing Campaigns",
    description: "Promotional and marketing communications",
  },
  {
    type: "promotional",
    label: "Promotional Messages",
    description: "Special offers and promotions",
  },
  {
    type: "transactional",
    label: "Transactional Messages",
    description: "Order confirmations, receipts, etc.",
  },
  {
    type: "service",
    label: "Service Messages",
    description: "Service updates and notifications",
  },
  {
    type: "other",
    label: "Other Communications",
    description: "Miscellaneous communications",
  },
] as const;

export const DAYS_OF_WEEK = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
] as const;

