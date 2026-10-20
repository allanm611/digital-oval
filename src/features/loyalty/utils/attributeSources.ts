import { kpiService, type KPIProfile } from "../../kpis/services/kpiService";
import type {
  AttributeFieldOption,
  AttributeSourceType,
} from "../types/loyaltyProgram";

const NUMERIC_TYPES = new Set([
  "numeric",
  "decimal",
  "number",
  "integer",
  "int",
  "bigint",
  "float",
  "double",
  "real",
  "money",
]);

const NUMERIC_PG_TOKENS = [
  "int",
  "numeric",
  "decimal",
  "double",
  "float",
  "real",
  "money",
];

export function classifyAttributeSource(
  field: Pick<KPIProfile, "field_type" | "field_pg_type" | "tag" | "is_computable">,
): AttributeSourceType | null {
  if (!isNumericField(field)) return null;
  const tag = (field.tag || "").toLowerCase();
  if (tag.includes("usage")) return "usage_metric";
  if (tag.includes("static")) return "static_field";
  if (field.is_computable === false) return "static_field";
  return "numeric_profile";
}

export async function loadAttributeFieldOptions(): Promise<AttributeFieldOption[]> {
  const fields = await kpiService.getAllKPIs(undefined, true, true);
  return fields
    .flatMap((field) => {
      const sourceType = classifyAttributeSource(field);
      if (!sourceType || field.id == null) return [];
      return [
        {
          id: String(field.id),
          numericId: field.id,
          name: field.field_name || field.field_value || `Field ${field.id}`,
          fieldValue: field.field_value || "",
          sourceType,
        },
      ];
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function isNumericField(
  field: Pick<KPIProfile, "field_type" | "field_pg_type">,
): boolean {
  const type = (field.field_type || "").toLowerCase();
  if (NUMERIC_TYPES.has(type)) return true;
  const pgType = (field.field_pg_type || "").toLowerCase();
  return NUMERIC_PG_TOKENS.some((token) => pgType.includes(token));
}
