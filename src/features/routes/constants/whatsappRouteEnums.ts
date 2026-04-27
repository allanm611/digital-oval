export const WHATSAPP_GATEWAY_OPTIONS = [
  { value: "TWILIO_WHATSAPP", label: "Twilio WhatsApp" },
  { value: "META_BUSINESS_API", label: "Meta Business API" },
  { value: "CUSTOM", label: "Custom" },
] as const;

export type WhatsAppGatewayEnum = (typeof WHATSAPP_GATEWAY_OPTIONS)[number]["value"];

export const MESSAGE_TEMPLATE_OPTIONS = [
  { value: "true", label: "Enabled" },
  { value: "false", label: "Disabled" },
] as const;
