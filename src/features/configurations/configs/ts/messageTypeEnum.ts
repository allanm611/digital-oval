/**
 * Valid message types for Character Sets
 * These are managed as a formal Enum in the backend
 */
export enum MessageTypeEnum {
  SMS = "SMS",
  FLASH_SMS = "FLASH_SMS",
  UNICODE = "UNICODE",
  BINARY = "BINARY",
  USSD = "USSD",
}

export const MESSAGE_TYPE_OPTIONS = [
  { value: MessageTypeEnum.SMS, label: "SMS" },
  { value: MessageTypeEnum.FLASH_SMS, label: "Flash SMS" },
  { value: MessageTypeEnum.UNICODE, label: "Unicode" },
  { value: MessageTypeEnum.BINARY, label: "Binary" },
  { value: MessageTypeEnum.USSD, label: "USSD" },
];
