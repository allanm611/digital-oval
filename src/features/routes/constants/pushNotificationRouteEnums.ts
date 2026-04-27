export const PUSH_GATEWAY_OPTIONS = [
  { value: "FIREBASE", label: "Firebase Cloud Messaging" },
  { value: "ONESIGNAL", label: "OneSignal" },
  { value: "PUSHER", label: "Pusher" },
  { value: "CUSTOM", label: "Custom" },
] as const;

export type PushGatewayEnum = (typeof PUSH_GATEWAY_OPTIONS)[number]["value"];

export const PUSH_PLATFORM_OPTIONS = [
  { value: "IOS", label: "iOS" },
  { value: "ANDROID", label: "Android" },
  { value: "WEB", label: "Web" },
] as const;

export type PushPlatformEnum = (typeof PUSH_PLATFORM_OPTIONS)[number]["value"];

export const PRIORITY_LEVEL_OPTIONS = [
  { value: "HIGH", label: "High" },
  { value: "NORMAL", label: "Normal" },
  { value: "LOW", label: "Low" },
] as const;

export type PriorityLevelEnum = (typeof PRIORITY_LEVEL_OPTIONS)[number]["value"];
