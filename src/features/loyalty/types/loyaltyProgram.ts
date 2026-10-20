/**
 * Loyalty program catalog.
 *
 * A program is its own points wallet. Bonus points are earned and redeemed
 * inside that program. Segmentation points only decide the tier. Neither
 * balance is shared with another program.
 *
 * Custom attributes are stored on the program that defined them. They are
 * not registered in the profile dictionary and cannot be reused elsewhere.
 */

export type PointsValidityMode = "unlimited" | "limited";

export type TierEvaluationMode = "automated" | "manual";

export type LoyaltyProgramStatus =
  | "active"
  | "scheduled"
  | "expired"
  | "cancelled"
  | "draft";

export type AttributeSourceType =
  | "numeric_profile"
  | "usage_metric"
  | "static_field";

export type AttributeConditionOperator =
  | "greater_than"
  | "greater_than_or_equal"
  | "less_than"
  | "less_than_or_equal"
  | "equals"
  | "between";

export interface SegmentationTier {
  name: string;
  /** Null when the program maps tiers manually. */
  pointsFrom: number | null;
  /** Null is Unlimited for automated tiers, and unused for manual tiers. */
  pointsTo: number | null;
}

export interface CustomAttributeOperand {
  key: string;
  sourceType: AttributeSourceType;
  fieldId: number | null;
  fieldName: string;
  fieldValue: string;
}

export interface CustomAttributeCondition {
  operator: AttributeConditionOperator;
  value: number;
  valueTo: number | null;
}

export interface CustomAttribute {
  name: string;
  operands: CustomAttributeOperand[];
  formula: string;
  condition: CustomAttributeCondition;
}

export interface LoyaltyProgram {
  id: number;
  name: string;
  description: string;
  status: LoyaltyProgramStatus;
  memberCount: number;
  startDate: string;
  endDate: string;
  bonusPointsValidity: PointsValidityMode;
  bonusPointsValidityDays: number | null;
  tierEvaluationMode: TierEvaluationMode;
  tiers: SegmentationTier[];
  segmentationPointsValidity: PointsValidityMode;
  segmentationPointsValidityDays: number | null;
  customAttributes: CustomAttribute[];
  createdBy: string;
  updatedBy: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface LoyaltyProgramTierPayload {
  tier_name: string;
  points_from: number | null;
  points_to: number | null;
}

export interface LoyaltyProgramAttributePayload {
  name: string;
  operands: Array<{
    key: string;
    source_type: AttributeSourceType;
    field_id: number | null;
    field_name: string;
    field_value: string;
  }>;
  formula: string;
  condition: {
    operator: AttributeConditionOperator;
    value: number;
    value_to: number | null;
  };
}

export interface LoyaltyProgramWritePayload {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  bonus_points_validity: PointsValidityMode;
  bonus_points_validity_days: number | null;
  tier_evaluation_mode: TierEvaluationMode;
  segmentation_tiers: LoyaltyProgramTierPayload[];
  segmentation_points_validity: PointsValidityMode;
  segmentation_points_validity_days: number | null;
  custom_attributes: LoyaltyProgramAttributePayload[];
  created_by?: number;
  updated_by?: number;
}

export interface LoyaltyProgramStats {
  total: number;
  active: number;
  scheduled: number;
  expired: number;
  cancelled: number;
}

export interface LoyaltyProgramListResult {
  items: LoyaltyProgram[];
  total: number;
  /** True when the server already returned one page and a separate total. */
  serverPaginated: boolean;
  /** Sample means the loyalty API was unavailable and the session catalog is in use. */
  source: "live" | "sample";
}

export interface AttributeFieldOption {
  id: string;
  numericId: number | null;
  name: string;
  fieldValue: string;
  sourceType: AttributeSourceType;
}
