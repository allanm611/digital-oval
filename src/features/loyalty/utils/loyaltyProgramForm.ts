import type {
  AttributeConditionOperator,
  AttributeSourceType,
  CustomAttribute,
  LoyaltyProgram,
  LoyaltyProgramWritePayload,
  PointsValidityMode,
  SegmentationTier,
  TierEvaluationMode,
} from "../types/loyaltyProgram";
import { validateCombinationFormula } from "./formulaValidation";
import {
  validateAutomatedTiers,
  validateManualTiers,
} from "./tierValidation";

export interface TierDraft {
  clientId: string;
  name: string;
  pointsFrom: string;
  pointsTo: string;
  pointsToUnlimited: boolean;
}

export interface AttributeOperandDraft {
  clientId: string;
  key: string;
  sourceType: AttributeSourceType;
  fieldId: string;
  fieldName: string;
  fieldValue: string;
}

export interface AttributeDraft {
  clientId: string;
  name: string;
  operands: AttributeOperandDraft[];
  formula: string;
  operator: AttributeConditionOperator;
  value: string;
  valueTo: string;
}

export interface LoyaltyProgramFormValues {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  bonusValidity: PointsValidityMode;
  bonusValidityDays: string;
  tierMode: TierEvaluationMode;
  tiers: TierDraft[];
  segmentationValidity: PointsValidityMode;
  segmentationValidityDays: string;
  attributes: AttributeDraft[];
}

export interface LoyaltyProgramFormErrors {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  bonusDays?: string;
  tiers?: string[];
  segmentationDays?: string;
  attributes?: string[];
}

let clientSequence = 0;

export function createClientId(prefix: string): string {
  clientSequence += 1;
  return `${prefix}-${Date.now().toString(36)}-${clientSequence}`;
}

export function createEmptyTier(partial?: Partial<TierDraft>): TierDraft {
  return {
    clientId: createClientId("tier"),
    name: "",
    pointsFrom: "",
    pointsTo: "",
    pointsToUnlimited: false,
    ...partial,
  };
}

export function createEmptyOperand(
  key: string,
  sourceType: AttributeSourceType = "usage_metric",
): AttributeOperandDraft {
  return {
    clientId: createClientId("operand"),
    key,
    sourceType,
    fieldId: "",
    fieldName: "",
    fieldValue: "",
  };
}

export function createEmptyAttribute(): AttributeDraft {
  return {
    clientId: createClientId("attribute"),
    name: "",
    operands: [createEmptyOperand("K1"), createEmptyOperand("K2")],
    formula: "",
    operator: "greater_than",
    value: "",
    valueTo: "",
  };
}

export function nextOperandKey(operands: Array<{ key: string }>): string {
  const used = operands.map((operand) => {
    const match = /^K(\d+)$/i.exec(operand.key.trim());
    return match ? Number(match[1]) : 0;
  });
  return `K${Math.max(0, ...used) + 1}`;
}

export function createEmptyLoyaltyProgramForm(): LoyaltyProgramFormValues {
  return {
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    bonusValidity: "limited",
    bonusValidityDays: "",
    tierMode: "automated",
    tiers: [
      createEmptyTier({ pointsFrom: "0", pointsTo: "999" }),
      createEmptyTier({ pointsFrom: "1000", pointsToUnlimited: true }),
    ],
    segmentationValidity: "limited",
    segmentationValidityDays: "",
    attributes: [],
  };
}

export function loyaltyProgramToForm(
  program: LoyaltyProgram,
): LoyaltyProgramFormValues {
  return {
    name: program.name,
    description: program.description,
    startDate: program.startDate,
    endDate: program.endDate,
    bonusValidity: program.bonusPointsValidity,
    bonusValidityDays:
      program.bonusPointsValidityDays == null
        ? ""
        : String(program.bonusPointsValidityDays),
    tierMode: program.tierEvaluationMode,
    tiers:
      program.tiers.length > 0
        ? program.tiers.map((tier) => tierToDraft(tier, program.tierEvaluationMode))
        : [createEmptyTier()],
    segmentationValidity: program.segmentationPointsValidity,
    segmentationValidityDays:
      program.segmentationPointsValidityDays == null
        ? ""
        : String(program.segmentationPointsValidityDays),
    attributes: program.customAttributes.map(attributeToDraft),
  };
}

export function validateLoyaltyProgramForm(
  values: LoyaltyProgramFormValues,
): LoyaltyProgramFormErrors {
  const errors: LoyaltyProgramFormErrors = {};
  const name = values.name.trim();
  const description = values.description.trim();

  if (!name) errors.name = "Enter a program name.";
  else if (name.length > 120) errors.name = "Use 120 characters or fewer.";

  if (!description) errors.description = "Enter a description.";
  else if (description.length > 1000) {
    errors.description = "Use 1000 characters or fewer.";
  }

  if (!values.startDate) errors.startDate = "Enter a start date.";
  if (!values.endDate) errors.endDate = "Enter an end date.";
  if (
    values.startDate &&
    values.endDate &&
    values.endDate < values.startDate
  ) {
    errors.endDate = "The end date must be on or after the start date.";
  }

  const bonusDaysError = validateValidityDays(
    values.bonusValidity,
    values.bonusValidityDays,
    "bonus points",
  );
  if (bonusDaysError) errors.bonusDays = bonusDaysError;

  const tierErrors =
    values.tierMode === "automated"
      ? validateAutomatedTiers(values.tiers)
      : validateManualTiers(values.tiers);
  if (tierErrors.length > 0) errors.tiers = tierErrors;

  const segmentationDaysError = validateValidityDays(
    values.segmentationValidity,
    values.segmentationValidityDays,
    "segmentation points",
  );
  if (segmentationDaysError) errors.segmentationDays = segmentationDaysError;

  const attributeErrors = validateAttributes(values.attributes);
  if (attributeErrors.length > 0) errors.attributes = attributeErrors;

  return errors;
}

export function hasFormErrors(errors: LoyaltyProgramFormErrors): boolean {
  return Boolean(
    errors.name ||
      errors.description ||
      errors.startDate ||
      errors.endDate ||
      errors.bonusDays ||
      errors.segmentationDays ||
      (errors.tiers && errors.tiers.length > 0) ||
      (errors.attributes && errors.attributes.length > 0),
  );
}

export function toLoyaltyProgramPayload(
  values: LoyaltyProgramFormValues,
  actorId?: number,
  mode: "create" | "update" = "create",
): LoyaltyProgramWritePayload {
  const automated = values.tierMode === "automated";
  const tiers = values.tiers.map((tier) => ({
    tier_name: tier.name.trim(),
    points_from: automated ? Number(tier.pointsFrom) : null,
    points_to:
      automated && !tier.pointsToUnlimited ? Number(tier.pointsTo) : null,
  }));

  const orderedTiers = automated
    ? [...tiers].sort(
        (left, right) => (left.points_from ?? 0) - (right.points_from ?? 0),
      )
    : tiers;

  const payload: LoyaltyProgramWritePayload = {
    name: values.name.trim(),
    description: values.description.trim(),
    start_date: values.startDate,
    end_date: values.endDate,
    bonus_points_validity: values.bonusValidity,
    bonus_points_validity_days:
      values.bonusValidity === "limited"
        ? Number(values.bonusValidityDays)
        : null,
    tier_evaluation_mode: values.tierMode,
    segmentation_tiers: orderedTiers,
    segmentation_points_validity: values.segmentationValidity,
    segmentation_points_validity_days:
      values.segmentationValidity === "limited"
        ? Number(values.segmentationValidityDays)
        : null,
    custom_attributes: values.attributes.map((attribute) => ({
      name: attribute.name.trim(),
      operands: attribute.operands.map((operand) => ({
        key: operand.key.toUpperCase(),
        source_type: operand.sourceType,
        field_id: operand.fieldId ? Number(operand.fieldId) : null,
        field_name: operand.fieldName,
        field_value: operand.fieldValue,
      })),
      formula: attribute.formula.replace(/\s+/g, ""),
      condition: {
        operator: attribute.operator,
        value: Number(attribute.value),
        value_to:
          attribute.operator === "between" ? Number(attribute.valueTo) : null,
      },
    })),
  };

  if (actorId != null) {
    if (mode === "create") payload.created_by = actorId;
    payload.updated_by = actorId;
  }

  return payload;
}

function validateValidityDays(
  mode: PointsValidityMode,
  days: string,
  label: string,
): string | undefined {
  if (mode !== "limited") return undefined;
  if (!/^\d+$/.test(days.trim())) {
    return `Enter the number of days ${label} stay valid.`;
  }
  const value = Number(days);
  if (value < 1 || value > 36500) {
    return `Use 1 to 36500 days for ${label}.`;
  }
  return undefined;
}

function validateAttributes(attributes: AttributeDraft[]): string[] {
  const errors: string[] = [];
  const seenNames = new Set<string>();

  attributes.forEach((attribute, index) => {
    const label = attribute.name.trim() || `Custom attribute ${index + 1}`;
    const name = attribute.name.trim();
    if (!name) {
      errors.push(`Custom attribute ${index + 1} needs a name.`);
    } else if (seenNames.has(name.toLowerCase())) {
      errors.push(`Custom attribute "${name}" is used more than once.`);
    }
    if (name) seenNames.add(name.toLowerCase());

    if (attribute.operands.length < 2) {
      errors.push(`${label} needs at least K1 and K2.`);
    }

    attribute.operands.forEach((operand) => {
      if (!operand.fieldId) {
        errors.push(`${label} ${operand.key} needs a field.`);
      }
    });

    const formula = validateCombinationFormula(
      attribute.formula,
      attribute.operands.map((operand) => operand.key),
    );
    if (!formula.valid && formula.error) {
      errors.push(`${label}: ${formula.error}`);
    }

    if (!isDecimal(attribute.value)) {
      errors.push(`${label} needs a condition value.`);
    } else if (
      attribute.operator === "between" &&
      !isDecimal(attribute.valueTo)
    ) {
      errors.push(`${label} needs both values for a between condition.`);
    } else if (
      attribute.operator === "between" &&
      Number(attribute.valueTo) < Number(attribute.value)
    ) {
      errors.push(`${label} condition range is reversed.`);
    }
  });

  return errors;
}

function isDecimal(value: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(value.trim());
}

function tierToDraft(
  tier: SegmentationTier,
  mode: TierEvaluationMode,
): TierDraft {
  const unlimited = mode === "automated" && tier.pointsTo === null;
  return createEmptyTier({
    name: tier.name,
    pointsFrom: tier.pointsFrom == null ? "" : String(tier.pointsFrom),
    pointsTo: tier.pointsTo == null ? "" : String(tier.pointsTo),
    pointsToUnlimited: unlimited,
  });
}

function attributeToDraft(attribute: CustomAttribute): AttributeDraft {
  return {
    clientId: createClientId("attribute"),
    name: attribute.name,
    operands: attribute.operands.map((operand) => ({
      clientId: createClientId("operand"),
      key: operand.key,
      sourceType: operand.sourceType,
      fieldId: operand.fieldId == null ? "" : String(operand.fieldId),
      fieldName: operand.fieldName,
      fieldValue: operand.fieldValue,
    })),
    formula: attribute.formula,
    operator: attribute.condition.operator,
    value: String(attribute.condition.value),
    valueTo:
      attribute.condition.valueTo == null
        ? ""
        : String(attribute.condition.valueTo),
  };
}
