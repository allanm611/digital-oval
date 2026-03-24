/**
 * Valid character set types
 * These are managed as a formal Enum in the backend
 */
export enum CharacterSetTypeEnum {
  GSM7 = "GSM7",
  UCS2 = "UCS2",
  UTF8 = "UTF8",
  ISO_8859_1 = "ISO-8859-1",
}

export const CHARACTER_SET_TYPE_OPTIONS = [
  { value: CharacterSetTypeEnum.GSM7, label: "GSM7" },
  { value: CharacterSetTypeEnum.UCS2, label: "UCS2" },
  { value: CharacterSetTypeEnum.UTF8, label: "UTF8" },
  { value: CharacterSetTypeEnum.ISO_8859_1, label: "ISO-8859-1" },
];
