/**
 * System Event Types for Segment Conditions
 * Communication events that customers can trigger
 */

export interface SystemEvent {
  id: number;
  event_code: string;
  event_name: string;
  event_description: string;
  channel?: "email" | "sms" | "push" | "in_app" | "all";
  created_at?: string;
  updated_at?: string;
}

export type SystemEventCode =
  | "email_opened"
  | "email_clicked"
  | "email_bounced"
  | "email_unsubscribed"
  | "sms_delivered"
  | "sms_failed"
  | "sms_clicked"
  | "push_notification_received"
  | "push_notification_clicked"
  | "push_notification_dismissed"
  | "in_app_message_viewed"
  | "in_app_message_clicked"
  | "unsubscribe_requested"
  | "preference_updated"
  | "communication_failed";

// Predefined system events
export const SYSTEM_EVENTS: SystemEvent[] = [
  {
    id: 1,
    event_code: "email_opened",
    event_name: "Email Opened",
    event_description: "Customer opened an email message",
    channel: "email",
  },
  {
    id: 2,
    event_code: "email_clicked",
    event_name: "Email Clicked",
    event_description: "Customer clicked a link in an email",
    channel: "email",
  },
  {
    id: 3,
    event_code: "email_bounced",
    event_name: "Email Bounced",
    event_description: "Email delivery failed/bounced",
    channel: "email",
  },
  {
    id: 4,
    event_code: "email_unsubscribed",
    event_name: "Email Unsubscribed",
    event_description: "Customer unsubscribed from email communications",
    channel: "email",
  },
  {
    id: 5,
    event_code: "sms_delivered",
    event_name: "SMS Delivered",
    event_description: "SMS message successfully delivered",
    channel: "sms",
  },
  {
    id: 6,
    event_code: "sms_failed",
    event_name: "SMS Failed",
    event_description: "SMS delivery failed",
    channel: "sms",
  },
  {
    id: 7,
    event_code: "sms_clicked",
    event_name: "SMS Clicked",
    event_description: "Customer clicked a link in SMS message",
    channel: "sms",
  },
  {
    id: 8,
    event_code: "push_notification_received",
    event_name: "Push Notification Received",
    event_description: "Push notification delivered to device",
    channel: "push",
  },
  {
    id: 9,
    event_code: "push_notification_clicked",
    event_name: "Push Notification Clicked",
    event_description: "Customer clicked a push notification",
    channel: "push",
  },
  {
    id: 10,
    event_code: "push_notification_dismissed",
    event_name: "Push Notification Dismissed",
    event_description: "Customer dismissed a push notification",
    channel: "push",
  },
  {
    id: 11,
    event_code: "in_app_message_viewed",
    event_name: "In-App Message Viewed",
    event_description: "Customer viewed an in-app message",
    channel: "in_app",
  },
  {
    id: 12,
    event_code: "in_app_message_clicked",
    event_name: "In-App Message Clicked",
    event_description: "Customer interacted with in-app message",
    channel: "in_app",
  },
  {
    id: 13,
    event_code: "unsubscribe_requested",
    event_name: "Unsubscribe Requested",
    event_description: "Customer requested to unsubscribe from communications",
    channel: "all",
  },
  {
    id: 14,
    event_code: "preference_updated",
    event_name: "Communication Preference Updated",
    event_description: "Customer updated communication preferences",
    channel: "all",
  },
  {
    id: 15,
    event_code: "communication_failed",
    event_name: "Communication Failed",
    event_description: "Any communication attempt failed",
    channel: "all",
  },
];

// Group events by channel for UI display
export const SYSTEM_EVENTS_BY_CHANNEL = {
  email: SYSTEM_EVENTS.filter((e) => e.channel === "email"),
  sms: SYSTEM_EVENTS.filter((e) => e.channel === "sms"),
  push: SYSTEM_EVENTS.filter((e) => e.channel === "push"),
  in_app: SYSTEM_EVENTS.filter((e) => e.channel === "in_app"),
  other: SYSTEM_EVENTS.filter((e) => e.channel === "all"),
};

export const SYSTEM_EVENT_CHANNELS = [
  { value: "email", label: "Email Events" },
  { value: "sms", label: "SMS Events" },
  { value: "push", label: "Push Events" },
  { value: "in_app", label: "In-App Events" },
  { value: "other", label: "Other Events" },
] as const;
