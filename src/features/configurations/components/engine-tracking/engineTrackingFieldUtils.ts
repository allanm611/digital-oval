import type {
  CreateEngineTrackingSourceFieldPayload,
  EngineFieldDataType,
} from "../../types/engineTrackingSource";

export interface EngineTrackingDraftField {
  key: string;
  fieldName: string;
  fieldKey: string;
  dataType: EngineFieldDataType;
  isRequired: boolean;
  isPrimaryKey: boolean;
  isAmountField: boolean;
  isRevenueField: boolean;
  isProductField: boolean;
  displayOrder: number;
  description: string;
}

export function emptyDraftField(order: number): EngineTrackingDraftField {
  return {
    key: `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    fieldName: "",
    fieldKey: "",
    dataType: "text",
    isRequired: false,
    isPrimaryKey: false,
    isAmountField: false,
    isRevenueField: false,
    isProductField: false,
    displayOrder: order,
    description: "",
  };
}

export function deriveTrackingSourceCode(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);
}

export function deriveFieldKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}

export function parseCsvCodes(value: string): string[] | null {
  const parts = value
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length ? parts : null;
}

/**
 * Validate draft fields for create. Empty rows (no name and no key) are skipped.
 * Returns field-level errors keyed like `fields_0_fieldName`.
 */
export function validateDraftFields(
  fields: EngineTrackingDraftField[],
): {
  errors: Record<string, string>;
  payloads: CreateEngineTrackingSourceFieldPayload[];
} {
  const errors: Record<string, string> = {};
  const payloads: CreateEngineTrackingSourceFieldPayload[] = [];
  const seenKeys = new Set<string>();
  let amountFieldCount = 0;
  let primaryKeyCount = 0;

  fields.forEach((f, i) => {
    const prefix = `fields_${i}`;
    const fieldName = f.fieldName.trim();
    const rawKey = f.fieldKey.trim().toLowerCase();
    const isBlank = !fieldName && !rawKey;

    if (isBlank) return;

    if (!fieldName) {
      errors[`${prefix}_fieldName`] = "Field name is required";
      return;
    }

    const fieldKey = rawKey || deriveFieldKey(fieldName);
    if (!fieldKey) {
      errors[`${prefix}_fieldKey`] = "Could not derive a field key from the name";
    } else if (!/^[a-z][a-z0-9_]*$/.test(fieldKey)) {
      errors[`${prefix}_fieldKey`] =
        "Use lowercase letters, numbers, underscores (must start with a letter)";
    } else if (seenKeys.has(fieldKey)) {
      errors[`${prefix}_fieldKey`] = "Field key must be unique";
    } else {
      seenKeys.add(fieldKey);
    }

    if (f.isAmountField) amountFieldCount += 1;
    if (f.isPrimaryKey) primaryKeyCount += 1;

    payloads.push({
      fieldName,
      fieldKey,
      dataType: f.dataType,
      isRequired: f.isRequired,
      isPrimaryKey: f.isPrimaryKey,
      isAmountField: f.isAmountField,
      isRevenueField: f.isRevenueField,
      isProductField: f.isProductField,
      displayOrder: f.displayOrder,
      description: f.description.trim() || null,
    });
  });

  if (amountFieldCount > 1) {
    errors.fields =
      "Only one amount field is allowed per tracking source";
  }
  if (primaryKeyCount > 1) {
    errors.fields = errors.fields
      ? `${errors.fields}. Only one primary key field is allowed`
      : "Only one primary key field is allowed per tracking source";
  }

  return { errors, payloads };
}

export function validateTrackingSourceBasics(input: {
  name: string;
  code: string;
  attributionWindowHours: string;
  cooldownHours: string;
  minAmount: string;
  maxAmount: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  const trimmedName = input.name.trim();
  const trimmedCode = input.code.trim().toLowerCase();

  if (!trimmedName) {
    errors.name = "Name is required";
  } else if (trimmedName.length > 100) {
    errors.name = "Name must be 100 characters or less";
  }

  if (!trimmedCode) {
    errors.code = "Code is required";
  } else if (!/^[a-z][a-z0-9_]*$/.test(trimmedCode)) {
    errors.code =
      "Code must be lowercase snake_case starting with a letter";
  }

  const attr = Number(input.attributionWindowHours);
  if (!Number.isFinite(attr) || attr < 1) {
    errors.attributionWindowHours =
      "Attribution window must be at least 1 hour";
  }

  const cool = Number(input.cooldownHours);
  if (!Number.isFinite(cool) || cool < 0) {
    errors.cooldownHours = "Cooldown must be 0 or greater";
  }

  const minRaw = input.minAmount.trim();
  const maxRaw = input.maxAmount.trim();
  const minAmount = minRaw === "" ? null : Number(minRaw);
  const maxAmount = maxRaw === "" ? null : Number(maxRaw);

  if (minAmount != null && !Number.isFinite(minAmount)) {
    errors.minAmount = "Min amount must be a valid number";
  } else if (minAmount != null && minAmount < 0) {
    errors.minAmount = "Min amount cannot be negative";
  }

  if (maxAmount != null && !Number.isFinite(maxAmount)) {
    errors.maxAmount = "Max amount must be a valid number";
  } else if (maxAmount != null && maxAmount < 0) {
    errors.maxAmount = "Max amount cannot be negative";
  }

  if (
    minAmount != null &&
    maxAmount != null &&
    Number.isFinite(minAmount) &&
    Number.isFinite(maxAmount) &&
    minAmount > maxAmount
  ) {
    errors.maxAmount = "Max amount must be greater than or equal to min amount";
  }

  return errors;
}
