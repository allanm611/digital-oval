import type { GatewayProviderField } from "../services/gatewayProviderService";

/**
 * How CVM connects to a gateway vendor.
 * Distinct from communication channel (SMS/Email/WhatsApp) — a channel
 * can be served over more than one protocol (e.g. SMS over SMPP or HTTP).
 */
export type GatewayProtocol =
  | "smpp"
  | "smtp"
  | "smtps"
  | "http"
  | "https"
  | "soap"
  | "fcm"
  | "apns"
  | "custom";

export interface GatewayProtocolDefinition {
  value: GatewayProtocol;
  label: string;
  description: string;
  /** Channel families this protocol typically applies to. Empty = all. */
  channelFamilies: string[];
  fields: GatewayProviderField[];
}

function field(
  name: string,
  label: string,
  type: GatewayProviderField["type"],
  extras: Partial<GatewayProviderField> = {},
): GatewayProviderField {
  return { name, label, type, required: false, ...extras };
}

const SMPP_FIELDS: GatewayProviderField[] = [
  field("host", "Host", "text", {
    required: true,
    placeholder: "smpp.provider.com",
  }),
  field("port", "Port", "number", {
    required: true,
    placeholder: "2775",
    default: 2775,
  }),
  field("system_id", "System ID", "text", {
    required: true,
    placeholder: "SMPP username / bind ID",
  }),
  field("password", "Password", "password", { required: true }),
  field("system_type", "System type", "text", {
    placeholder: "Optional SMPP system_type",
  }),
  field("bind_mode", "Bind mode", "select", {
    required: true,
    default: "transceiver",
    options: ["transceiver", "transmitter", "receiver"],
  }),
  field("enquire_link_interval", "Enquire link interval (seconds)", "number", {
    placeholder: "30",
    default: 30,
  }),
];

const SMTP_FIELDS: GatewayProviderField[] = [
  field("host", "SMTP host", "text", {
    required: true,
    placeholder: "smtp.provider.com",
  }),
  field("port", "Port", "number", {
    required: true,
    placeholder: "587",
    default: 587,
  }),
  field("username", "Username", "text", { required: true }),
  field("password", "Password", "password", { required: true }),
  field("from_address", "From address", "text", {
    required: true,
    placeholder: "noreply@example.com",
  }),
  field("tls_enabled", "Use STARTTLS", "boolean", { default: true }),
];

const SMTPS_FIELDS: GatewayProviderField[] = [
  field("host", "SMTPS host", "text", {
    required: true,
    placeholder: "smtp.provider.com",
  }),
  field("port", "Port", "number", {
    required: true,
    placeholder: "465",
    default: 465,
  }),
  field("username", "Username", "text", { required: true }),
  field("password", "Password", "password", { required: true }),
  field("from_address", "From address", "text", {
    required: true,
    placeholder: "noreply@example.com",
  }),
];

const HTTP_FIELDS: GatewayProviderField[] = [
  field("base_url", "Base URL", "text", {
    required: true,
    placeholder: "https://api.provider.com",
  }),
  field("http_method", "HTTP method", "select", {
    required: true,
    default: "POST",
    options: ["POST", "GET", "PUT", "PATCH"],
  }),
  field("auth_type", "Auth type", "select", {
    required: true,
    default: "api_key",
    options: ["api_key", "bearer", "basic", "none"],
  }),
  field("api_key", "API key / token", "password", {
    placeholder: "Used for API key or Bearer auth",
  }),
  field("username", "Username", "text", {
    placeholder: "Used for Basic auth",
  }),
  field("password", "Password", "password", {
    placeholder: "Used for Basic auth",
  }),
  field("sender_id", "Default sender ID", "text", {
    placeholder: "Optional originator / from value",
  }),
  field("timeout_seconds", "Timeout (seconds)", "number", {
    placeholder: "30",
    default: 30,
  }),
];

const SOAP_FIELDS: GatewayProviderField[] = [
  field("endpoint_url", "SOAP endpoint", "text", {
    required: true,
    placeholder: "https://api.provider.com/soap",
  }),
  field("soap_action", "SOAP action", "text", { placeholder: "Optional SOAPAction" }),
  field("username", "Username", "text", { required: true }),
  field("password", "Password", "password", { required: true }),
  field("namespace", "XML namespace", "text"),
];

const FCM_FIELDS: GatewayProviderField[] = [
  field("project_id", "Project ID", "text", { required: true }),
  field("server_key", "Server key", "password", { required: true }),
  field("sender_id", "Sender ID", "text"),
  field("client_email", "Client email", "text", {
    placeholder: "Optional service-account email",
  }),
  field("private_key", "Private key", "password", {
    placeholder: "Optional service-account private key",
  }),
];

const APNS_FIELDS: GatewayProviderField[] = [
  field("team_id", "Team ID", "text", { required: true }),
  field("key_id", "Key ID", "text", { required: true }),
  field("bundle_id", "Bundle ID", "text", { required: true }),
  field("p8_private_key", "P8 private key", "password", { required: true }),
];

export const GATEWAY_PROTOCOLS: GatewayProtocolDefinition[] = [
  {
    value: "smpp",
    label: "SMPP",
    description:
      "SMPP bind to an SMSC. Used by most carrier and aggregator SMS connections.",
    channelFamilies: ["sms", "ussd"],
    fields: SMPP_FIELDS,
  },
  {
    value: "smtp",
    label: "SMTP",
    description: "SMTP with STARTTLS (typically port 587).",
    channelFamilies: ["email"],
    fields: SMTP_FIELDS,
  },
  {
    value: "smtps",
    label: "SMTPS",
    description: "SMTP over implicit TLS (typically port 465).",
    channelFamilies: ["email"],
    fields: SMTPS_FIELDS,
  },
  {
    value: "http",
    label: "HTTP",
    description: "REST / HTTP API. Common for Twilio, Infobip HTTP, WhatsApp Cloud, and similar.",
    channelFamilies: [],
    fields: HTTP_FIELDS,
  },
  {
    value: "https",
    label: "HTTPS",
    description: "REST / HTTPS API. Same fields as HTTP; use when the vendor requires TLS.",
    channelFamilies: [],
    fields: HTTP_FIELDS.map((f) =>
      f.name === "base_url"
        ? { ...f, placeholder: "https://api.provider.com" }
        : f,
    ),
  },
  {
    value: "soap",
    label: "SOAP",
    description: "SOAP / XML web service endpoint.",
    channelFamilies: ["sms", "ussd", "email"],
    fields: SOAP_FIELDS,
  },
  {
    value: "fcm",
    label: "FCM",
    description: "Firebase Cloud Messaging credentials for Android / web push.",
    channelFamilies: ["push"],
    fields: FCM_FIELDS,
  },
  {
    value: "apns",
    label: "APNS",
    description: "Apple Push Notification service token-based authentication.",
    channelFamilies: ["push"],
    fields: APNS_FIELDS,
  },
  {
    value: "custom",
    label: "Custom",
    description:
      "No standard connection fields. Define your own keys for a vendor-specific integration.",
    channelFamilies: [],
    fields: [],
  },
];

const PROTOCOL_BY_VALUE = new Map(
  GATEWAY_PROTOCOLS.map((p) => [p.value, p]),
);

const CHANNEL_FAMILY_ALIASES: Record<string, string> = {
  sms: "sms",
  email: "email",
  mail: "email",
  whatsapp: "whatsapp",
  wa: "whatsapp",
  push: "push",
  pushnotification: "push",
  ussd: "ussd",
  ivr: "ivr",
  inapp: "inapp",
  inappmessage: "inapp",
};

export function cloneProtocolFields(
  fields: GatewayProviderField[],
): GatewayProviderField[] {
  return fields.map((f) => ({
    ...f,
    options: f.options ? [...f.options] : undefined,
  }));
}

export function getGatewayProtocol(
  value?: string | null,
): GatewayProtocolDefinition | undefined {
  if (!value) return undefined;
  return PROTOCOL_BY_VALUE.get(value as GatewayProtocol);
}

export function gatewayProtocolLabel(value?: string | null): string {
  if (!value) return "—";
  return getGatewayProtocol(value)?.label || value.toUpperCase();
}

export function normalizeChannelKey(input?: string | null): string {
  return (input || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function resolveChannelFamily(
  code?: string | null,
  name?: string | null,
): string | null {
  for (const raw of [code, name]) {
    const key = normalizeChannelKey(raw);
    if (!key) continue;
    if (CHANNEL_FAMILY_ALIASES[key]) return CHANNEL_FAMILY_ALIASES[key];
    for (const [alias, family] of Object.entries(CHANNEL_FAMILY_ALIASES)) {
      if (key.includes(alias)) return family;
    }
  }
  return null;
}

export function protocolsForChannel(
  code?: string | null,
  name?: string | null,
): GatewayProtocolDefinition[] {
  const family = resolveChannelFamily(code, name);
  if (!family) return GATEWAY_PROTOCOLS;
  const matched = GATEWAY_PROTOCOLS.filter(
    (p) =>
      p.channelFamilies.length === 0 || p.channelFamilies.includes(family),
  );
  return matched.length ? matched : GATEWAY_PROTOCOLS;
}

export function protocolSelectOptions(
  code?: string | null,
  name?: string | null,
): { value: string; label: string }[] {
  return protocolsForChannel(code, name).map((p) => ({
    value: p.value,
    label: p.label,
  }));
}

export function resolveGatewayProtocol(source: {
  protocol?: string | null;
  field_schema?: { protocol?: string | null } | null;
}): string {
  return (
    source.protocol?.trim() ||
    source.field_schema?.protocol?.trim() ||
    ""
  );
}

/**
 * Apply a protocol preset. Canonical protocol fields replace the previous
 * protocol's fields; custom (non-preset) keys are kept unless they collide.
 */
export function applyProtocolFields(
  nextProtocol: string,
  currentFields: GatewayProviderField[],
  previousProtocol?: string | null,
): GatewayProviderField[] {
  const nextPreset = cloneProtocolFields(
    getGatewayProtocol(nextProtocol)?.fields || [],
  );
  const prevKeys = new Set(
    (getGatewayProtocol(previousProtocol || "")?.fields || []).map(
      (f) => f.name,
    ),
  );
  const nextKeys = new Set(nextPreset.map((f) => f.name));
  const customFields = currentFields.filter((f) => {
    if (prevKeys.has(f.name)) return false;
    if (nextKeys.has(f.name)) return false;
    return Boolean(f.name?.trim());
  });
  return [...nextPreset, ...customFields];
}

export function isProtocolOwnedField(
  protocol: string | null | undefined,
  fieldName: string,
): boolean {
  if (!protocol || protocol === "custom") return false;
  return (getGatewayProtocol(protocol)?.fields || []).some(
    (f) => f.name === fieldName,
  );
}
