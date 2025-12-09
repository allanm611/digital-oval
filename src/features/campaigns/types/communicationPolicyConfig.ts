// Types pour les Communication Policies selon les spécifications

export type CommunicationPolicyType =
  | "timeWindow"
  | "maximumCommunication"
  | "dnd"
  | "vipList";

export type CommunicationChannel = "SMS" | "EMAIL" | "USSD" | "APP";

// Configuration Time Window
export interface TimeWindowConfig {
  startTime: string; // Format HH:MM
  endTime: string; // Format HH:MM
  timezone?: string;
  days?: string[]; // Jours de la semaine
}

// Configuration Maximum Communication
export interface MaximumCommunicationConfig {
  type: "daily" | "weekly" | "monthly";
  maxCount: number;
  resetTime?: string; // Heure de reset pour daily
  resetDay?: string; // Jour de reset pour weekly/monthly
}

// Configuration DND (Do Not Disturb)
export interface DNDConfig {
  categories: DNDCategory[];
}

export interface DNDCategory {
  id: string;
  name: string;
  description?: string;
  status: "start" | "stop";
  type: "marketing" | "promotional" | "transactional" | "service" | "other";
  value?: "allowed" | "not allowed";
}

// Configuration VIP List
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

// Interface principale pour Communication Policy
export interface CommunicationPolicyConfiguration {
  id: number;
  name: string;
  description?: string;
  channels: CommunicationChannel[]; // Changé en array pour multi-sélection
  type: CommunicationPolicyType;
  config:
    | TimeWindowConfig
    | MaximumCommunicationConfig
    | DNDConfig
    | VIPListConfig;
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

// Interface pour créer une nouvelle Communication Policy
export interface CreateCommunicationPolicyRequest {
  name: string;
  description?: string;
  channels: CommunicationChannel[]; // Changé en array pour multi-sélection
  type: CommunicationPolicyType;
  config:
    | TimeWindowConfig
    | MaximumCommunicationConfig
    | DNDConfig
    | VIPListConfig;
  isActive?: boolean;
}

// Options pour les types de Communication Policy
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

// Types prédéfinis pour DND
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

// Jours de la semaine
export const DAYS_OF_WEEK = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
] as const;

// Canaux de communication
export const COMMUNICATION_CHANNELS = [
  { value: "SMS" as const, label: "SMS", description: "Short Message Service" },
  {
    value: "EMAIL" as const,
    label: "Email",
    description: "Email Communication",
  },
  {
    value: "USSD" as const,
    label: "USSD",
    description: "Unstructured Supplementary Service Data",
  },
  {
    value: "APP" as const,
    label: "App Notification",
    description: "In-App Push Notification",
  },
] as const;
