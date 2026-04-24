/**
 * Mapping configuration for KPI-based segment conditions
 * Maps each condition type to its KPI category and UI labels
 */

export type KPIConditionType =
  | "revenue_metric"
  | "usage_metric"
  | "kpi";

export interface KPIConditionConfig {
  conditionType: KPIConditionType;
  label: string;
  description: string;
  kpiCategory:
    | "Customer Profile Info"
    | "Revenue Metric"
    | "Usage Metric"
    | "Customer Device Info";
  icon: "User" | "DollarSign" | "Activity" | "Smartphone";
}

export const KPI_CONDITION_CONFIG: Record<
  KPIConditionType,
  KPIConditionConfig
> = {
  revenue_metric: {
    conditionType: "revenue_metric" as KPIConditionType,
    label: "Revenue Metric",
    description: "Revenue and billing metrics",
    kpiCategory: "Revenue Metric",
    icon: "DollarSign",
  },
  usage_metric: {
    conditionType: "usage_metric" as KPIConditionType,
    label: "Usage Metric",
    description: "Customer usage and activity metrics",
    kpiCategory: "Usage Metric",
    icon: "Activity",
  },
  kpi: {
    conditionType: "kpi" as KPIConditionType,
    label: "KPI",
    description: "Key performance indicator metrics",
    kpiCategory: "KPI",
    icon: "Activity",
  },
};

/**
 * Get KPI category for a condition type
 */
export function getKPICategoryForConditionType(
  conditionType: string
): string | null {
  const config = KPI_CONDITION_CONFIG[conditionType as KPIConditionType];
  return config ? config.kpiCategory : null;
}

/**
 * Get icon name for a condition type
 */
export function getKPIIconForConditionType(
  conditionType: string
): string | null {
  const config = KPI_CONDITION_CONFIG[conditionType as KPIConditionType];
  return config ? config.icon : null;
}
