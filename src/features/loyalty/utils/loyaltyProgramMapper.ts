import type {
  AttributeConditionOperator,
  AttributeSourceType,
  CustomAttribute,
  CustomAttributeCondition,
  CustomAttributeOperand,
  LoyaltyProgram,
  LoyaltyProgramStats,
  LoyaltyProgramStatus,
  PointsValidityMode,
  SegmentationTier,
  TierEvaluationMode,
} from "../types/loyaltyProgram";

const STATUSES = new Set<LoyaltyProgramStatus>([
  "active",
  "scheduled",
  "expired",
  "cancelled",
  "draft",
]);

export function normalizeLoyaltyProgram(input: unknown): LoyaltyProgram | null {
  const record = asRecord(input);
  if (!record) return null;
  const source = {
    ...record,
    ...asRecord(record.configuration),
    ...asRecord(record.config),
  };
  const id = readNumber(source.id ?? source.program_id ?? source.loyalty_program_id);
  if (id == null || id <= 0) return null;

  const startDate = readDate(source.start_date ?? source.startDate);
  const endDate = readDate(source.end_date ?? source.endDate);
  const bonus = readValidity(
    source.bonus_points_validity ?? source.bonusPointsValidity,
    source.bonus_points_validity_days ??
      source.bonus_points_valid_days ??
      source.bonusPointsValidityDays,
  );
  const segmentation = readValidity(
    source.segmentation_points_validity ?? source.segmentationPointsValidity,
    source.segmentation_points_validity_days ??
      source.segmentationPointsValidityDays,
  );
  const tierMode = readTierMode(
    source.tier_evaluation_mode ??
      source.segmentation_tier_evaluation_mode ??
      source.tierEvaluationMode,
  );

  return {
    id,
    name: readText(source.name ?? source.program_name) || "Untitled program",
    description: readText(source.description),
    status: resolveStatus(source, startDate, endDate),
    memberCount: readNumber(source.member_count ?? source.memberCount) ?? 0,
    startDate,
    endDate,
    bonusPointsValidity: bonus.mode,
    bonusPointsValidityDays: bonus.days,
    tierEvaluationMode: tierMode,
    tiers: readTiers(
      source.segmentation_tiers ?? source.tiers ?? source.segmentationTiers,
      tierMode,
    ),
    segmentationPointsValidity: segmentation.mode,
    segmentationPointsValidityDays: segmentation.days,
    customAttributes: readAttributes(
      source.custom_attributes ?? source.customAttributes,
    ),
    createdBy: readPerson(source, [
      "created_by_name",
      "createdByName",
      "created_by_user",
      "created_by",
    ]),
    updatedBy: readPerson(source, [
      "updated_by_name",
      "last_modified_by",
      "lastModifiedBy",
      "updated_by_user",
      "updated_by",
    ]),
    createdAt: readTimestamp(source.created_at ?? source.createdAt),
    updatedAt: readTimestamp(
      source.updated_at ?? source.last_modified_at ?? source.updatedAt,
    ),
  };
}

export function normalizeLoyaltyStats(input: unknown): LoyaltyProgramStats {
  const record = asRecord(input) ?? {};
  const source = asRecord(record.data) ?? record;
  return {
    total: readNumber(source.total ?? source.total_programs ?? source.totalPrograms) ?? 0,
    active: readNumber(source.active ?? source.active_programs ?? source.activePrograms) ?? 0,
    scheduled:
      readNumber(source.scheduled ?? source.scheduled_programs ?? source.scheduledPrograms) ?? 0,
    expired: readNumber(source.expired ?? source.expired_programs ?? source.expiredPrograms) ?? 0,
    cancelled:
      readNumber(
        source.cancelled ??
          source.canceled ??
          source.cancelled_programs ??
          source.cancelledPrograms,
      ) ?? 0,
  };
}

export function summarizeLoyaltyPrograms(
  programs: LoyaltyProgram[],
): LoyaltyProgramStats {
  return {
    total: programs.length,
    active: programs.filter((program) => program.status === "active").length,
    scheduled: programs.filter((program) => program.status === "scheduled").length,
    expired: programs.filter((program) => program.status === "expired").length,
    cancelled: programs.filter((program) => program.status === "cancelled").length,
  };
}

export function programMatchesQuery(
  program: LoyaltyProgram,
  search: string,
  status: LoyaltyProgramStatus | "all",
): boolean {
  if (status !== "all" && program.status !== status) return false;
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return `${program.name} ${program.description}`.toLowerCase().includes(needle);
}

export function formatValidity(
  mode: PointsValidityMode,
  days: number | null,
): string {
  if (mode === "unlimited") return "Unlimited";
  if (days == null) return "Limited";
  return `Limited, ${days} ${days === 1 ? "day" : "days"}`;
}

const CONDITION_LABELS: Record<AttributeConditionOperator, string> = {
  greater_than: "Greater than",
  greater_than_or_equal: "Greater than or equal to",
  less_than: "Less than",
  less_than_or_equal: "Less than or equal to",
  equals: "Equals",
  between: "Between",
};

export function formatCondition(condition: CustomAttributeCondition): string {
  if (condition.operator === "between") {
    return `Between ${condition.value} and ${condition.valueTo ?? ""}`.trim();
  }
  return `${CONDITION_LABELS[condition.operator]} ${condition.value}`;
}

export function formatSourceType(source: AttributeSourceType): string {
  if (source === "usage_metric") return "Usage metric";
  if (source === "static_field") return "Static field";
  return "Numeric profile";
}

export function formatTierRange(tier: SegmentationTier, automated: boolean): string {
  if (!automated) return "Assigned manually";
  const from = tier.pointsFrom ?? 0;
  if (tier.pointsTo == null) return `${from} to Unlimited`;
  return `${from} to ${tier.pointsTo}`;
}

export interface ExtractedList {
  rows: unknown[];
  total: number | null;
  sawPagination: boolean;
}

export function extractLoyaltyList(payload: unknown): ExtractedList {
  if (Array.isArray(payload)) {
    return { rows: payload, total: null, sawPagination: false };
  }
  const body = asRecord(payload);
  if (!body) return { rows: [], total: 0, sawPagination: false };

  const topPagination = asRecord(body.pagination);
  const data = body.data;
  if (Array.isArray(data)) {
    return {
      rows: data,
      total: topPagination ? readNumber(topPagination.total) : null,
      sawPagination: Boolean(topPagination),
    };
  }

  const nested = asRecord(data);
  if (!nested) return { rows: [], total: 0, sawPagination: false };
  const nestedPagination = asRecord(nested.pagination) ?? topPagination;
  for (const key of ["items", "programs", "loyalty_programs", "results", "rows"]) {
    if (Array.isArray(nested[key])) {
      return {
        rows: nested[key] as unknown[],
        total: nestedPagination
          ? readNumber(nestedPagination.total)
          : readNumber(nested.total),
        sawPagination: Boolean(nestedPagination) || nested.total != null,
      };
    }
  }
  return { rows: [], total: 0, sawPagination: false };
}

function readTiers(value: unknown, mode: TierEvaluationMode): SegmentationTier[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const tier = asRecord(item);
    if (!tier) return [];
    const name = readText(tier.tier_name ?? tier.name ?? tier.tierName);
    if (!name) return [];
    if (mode === "manual") {
      return [{ name, pointsFrom: null, pointsTo: null }];
    }
    const unlimited = isUnlimited(tier.points_to ?? tier.pointsTo ?? tier.point_to);
    return [
      {
        name,
        pointsFrom: readNumber(tier.points_from ?? tier.pointsFrom ?? tier.point_from),
        pointsTo: unlimited
          ? null
          : readNumber(tier.points_to ?? tier.pointsTo ?? tier.point_to),
      },
    ];
  });
}

function readAttributes(value: unknown): CustomAttribute[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const attribute = asRecord(item);
    if (!attribute) return [];
    const name = readText(attribute.name ?? attribute.attribute_name);
    const operands = readOperands(attribute.operands ?? attribute.k_attributes);
    const condition = asRecord(attribute.condition) ?? {};
    const operator = readOperator(condition.operator ?? attribute.operator);
    const amount = readNumber(condition.value ?? attribute.value);
    if (!name || operands.length === 0 || amount == null) return [];
    return [
      {
        name,
        operands,
        formula: readText(attribute.formula ?? attribute.combination_formula),
        condition: {
          operator,
          value: amount,
          valueTo:
            operator === "between"
              ? readNumber(condition.value_to ?? condition.valueTo ?? attribute.value_to)
              : null,
        },
      },
    ];
  });
}

function readOperands(value: unknown): CustomAttributeOperand[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const operand = asRecord(item);
    if (!operand) return [];
    const key = readText(operand.key ?? operand.attribute_key).toUpperCase();
    if (!/^K\d+$/.test(key)) return [];
    return [
      {
        key,
        sourceType: readSourceType(operand.source_type ?? operand.sourceType),
        fieldId: readNumber(operand.field_id ?? operand.fieldId),
        fieldName: readText(operand.field_name ?? operand.fieldName),
        fieldValue: readText(operand.field_value ?? operand.fieldValue),
      },
    ];
  });
}

function resolveStatus(
  source: Record<string, unknown>,
  startDate: string,
  endDate: string,
): LoyaltyProgramStatus {
  const raw = readText(source.status).toLowerCase();
  if (
    raw === "cancelled" ||
    raw === "canceled" ||
    source.is_cancelled === true ||
    source.is_canceled === true
  ) {
    return "cancelled";
  }
  if (raw === "draft") return "draft";
  const derived = deriveStatusFromDates(startDate, endDate);
  if (STATUSES.has(raw as LoyaltyProgramStatus) && raw !== "active") {
    return raw as LoyaltyProgramStatus;
  }
  if (raw === "active" && derived === "expired") return "expired";
  if (raw === "active") return "active";
  return derived;
}

function deriveStatusFromDates(
  startDate: string,
  endDate: string,
): LoyaltyProgramStatus {
  const today = todayIso();
  if (endDate && endDate < today) return "expired";
  if (startDate && startDate > today) return "scheduled";
  return "active";
}

function readValidity(
  modeValue: unknown,
  daysValue: unknown,
): { mode: PointsValidityMode; days: number | null } {
  const modeRecord = asRecord(modeValue);
  const rawMode = readText(
    modeRecord?.mode ?? modeRecord?.type ?? modeValue,
  ).toLowerCase();
  const days = readNumber(modeRecord?.days ?? daysValue);
  if (rawMode === "unlimited") return { mode: "unlimited", days: null };
  return { mode: "limited", days };
}

function readTierMode(value: unknown): TierEvaluationMode {
  return readText(value).toLowerCase() === "manual" ? "manual" : "automated";
}

function readSourceType(value: unknown): AttributeSourceType {
  const raw = readText(value).toLowerCase();
  if (raw.includes("usage")) return "usage_metric";
  if (raw.includes("static")) return "static_field";
  return "numeric_profile";
}

function readOperator(value: unknown): AttributeConditionOperator {
  const raw = readText(value).toLowerCase().replace(/\s+/g, "_");
  const allowed: AttributeConditionOperator[] = [
    "greater_than",
    "greater_than_or_equal",
    "less_than",
    "less_than_or_equal",
    "equals",
    "between",
  ];
  return allowed.includes(raw as AttributeConditionOperator)
    ? (raw as AttributeConditionOperator)
    : "greater_than";
}

function readPerson(
  source: Record<string, unknown>,
  keys: string[],
): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim() && !/^\d+$/.test(value.trim())) {
      return value.trim();
    }
    const person = asRecord(value);
    if (!person) continue;
    const name = [person.first_name, person.last_name]
      .map((part) => readText(part))
      .filter(Boolean)
      .join(" ")
      .trim();
    if (name) return name;
    const fallback = readText(person.name ?? person.username ?? person.email);
    if (fallback) return fallback;
  }
  return "—";
}

function isUnlimited(value: unknown): boolean {
  if (value == null || value === "") return true;
  if (typeof value === "string" && value.trim().toLowerCase() === "unlimited") {
    return true;
  }
  return false;
}

function readDate(value: unknown): string {
  const text = readText(value);
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? "";
}

function readTimestamp(value: unknown): string | null {
  const text = readText(value);
  return text || null;
}

function readText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && value.trim().toLowerCase() !== "unlimited") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
