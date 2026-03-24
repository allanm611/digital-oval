/**
 * Valid gateway keys for Sender IDs
 * These are managed as a formal Enum in the backend
 */
export enum GatewayKeyEnum {
  INTERNAL = "INTERNAL",
  MOCANA = "MOCANA",
  SMSGW_HUB = "SMSGW_HUB",
  EXTERNAL_PROVIDER_A = "EXTERNAL_PROVIDER_A",
  EXTERNAL_PROVIDER_B = "EXTERNAL_PROVIDER_B",
}

export const GATEWAY_KEY_OPTIONS = [
  { value: GatewayKeyEnum.INTERNAL, label: "Internal" },
  { value: GatewayKeyEnum.MOCANA, label: "Mocana" },
  { value: GatewayKeyEnum.SMSGW_HUB, label: "SMS Gateway Hub" },
  { value: GatewayKeyEnum.EXTERNAL_PROVIDER_A, label: "External Provider A" },
  { value: GatewayKeyEnum.EXTERNAL_PROVIDER_B, label: "External Provider B" },
];
