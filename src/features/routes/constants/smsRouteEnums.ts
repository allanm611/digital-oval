export const NOTIFICATION_CHANNEL_OPTIONS = [
  { value: "NORMAL_SMS", label: "Normal SMS" },
  { value: "FLASH_SMS", label: "Flash SMS" },
  { value: "USSD", label: "USSD" },
  { value: "EMAIL", label: "Email" },
  { value: "PUSH_NOTIFICATION", label: "Push Notification" },
  { value: "WHATSAPP", label: "WhatsApp" },
] as const;

export type NotificationChannelEnum =
  (typeof NOTIFICATION_CHANNEL_OPTIONS)[number]["value"];

export const SMS_GATEWAY_OPTIONS = [
  { value: "INTERNAL", label: "Internal" },
  { value: "EXTERNAL_PROVIDER_A", label: "External Provider A" },
  { value: "EXTERNAL_PROVIDER_B", label: "External Provider B" },
  { value: "MOCANA", label: "Mocana" },
  { value: "SMSGW_HUB", label: "SMS Gateway Hub" },
] as const;

export type SmsGatewayEnum = (typeof SMS_GATEWAY_OPTIONS)[number]["value"];
