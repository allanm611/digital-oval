import { SYSTEM_EVENTS } from "../types/systemEvent";
import { REVENUE_METRICS } from "../types/revenueMetrics";
import { USAGE_METRICS } from "../types/usageMetrics";
import { type KPI } from "../types/kpi";

export const generateAllKPIs = (): KPI[] => {
  const kpis: KPI[] = [];

  SYSTEM_EVENTS.forEach((event, idx) => {
    kpis.push({
      id: `se-${idx + 1}`,
      name: event.event_name,
      category: "System Event",
      subcategory: event.category,
      description: event.event_description,
      source: "System Events Table",
    });
  });

  REVENUE_METRICS.forEach((metric, idx) => {
    kpis.push({
      id: `rm-${idx + 1}`,
      name: metric.name,
      category: "Revenue Metric",
      subcategory: metric.category,
      description: metric.description,
      source: "Revenue Table",
    });
  });

  USAGE_METRICS.forEach((metric, idx) => {
    kpis.push({
      id: `um-${idx + 1}`,
      name: metric.name,
      category: "Usage Metric",
      subcategory: metric.category,
      description: metric.description,
      source: "Usage Table",
    });
  });

  return kpis;
};
