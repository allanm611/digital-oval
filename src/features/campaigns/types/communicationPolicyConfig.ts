
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

export interface MaximumCommunicationConfig {
  type: "daily" | "weekly" | "monthly";
  maxCount: number;
  resetTime?: string;
  resetDay?: string;
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

export interface VIPListConfig {
  action: "include" | "exclude";
  vipLists: VIPList[];
  priority?: number;
}

export interface VIPList {
  id: string;
  name: string;
  description?: string;
  customerCount?: number;
  status: "active" | "inactive";
}

export interface CommunicationPolicyConfiguration {
  id: number;
  name: string;
  description?: string;
  channels: string[];
  type_code: string;
  config:
    | TimeWindowConfig
    | MaximumCommunicationConfig
    | DNDConfig
    | VIPListConfig;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCommunicationPolicyRequest {
  name: string;
  description?: string;
  channels: string[];
  type_code: string;
  config:
    | TimeWindowConfig
    | MaximumCommunicationConfig
    | DNDConfig
    | VIPListConfig;
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
    label: "Maximum Communication",
    description:
      "Set maximum number of communications sent to a customer in a given period",
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
    label: "VIP List",
    description: "Include or exclude VIP customers from campaigns",
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

