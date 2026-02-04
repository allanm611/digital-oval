export interface KPI {
  id: string;
  name: string;
  category: "System Event" | "Usage Metric" | "Revenue Metric";
  subcategory?: string;
  description: string;
  source: string;
}
