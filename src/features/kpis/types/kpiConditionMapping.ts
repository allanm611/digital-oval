/**
 * Mapping configuration for KPI-based segment conditions
 * Maps each condition type to its KPI category and UI labels
 */

export type KPIConditionType =
  | "customer_profile_kpi"
  | "revenue_metric_kpi"
  | "usage_metric_kpi"
  | "device_info_kpi";

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
  customer_profile_kpi: {
    conditionType: "customer_profile_kpi",
    label: "Customer Profile KPI",
    description: "Customer profile information metrics",
    kpiCategory: "Customer Profile Info",
    icon: "User",
  },
  revenue_metric_kpi: {
    conditionType: "revenue_metric_kpi",
    label: "Revenue Metric",
    description: "Revenue and billing metrics",
    kpiCategory: "Revenue Metric",
    icon: "DollarSign",
  },
  usage_metric_kpi: {
    conditionType: "usage_metric_kpi",
    label: "Usage Metric",
    description: "Customer usage and activity metrics",
    kpiCategory: "Usage Metric",
    icon: "Activity",
  },
  device_info_kpi: {
    conditionType: "device_info_kpi",
    label: "Device Info",
    description: "Device and platform information",
    kpiCategory: "Customer Device Info",
    icon: "Smartphone",
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
