export interface KPI {
  id: string;
  name: string;
  category: "System Event" | "Usage Metric" | "Revenue Metric" | "Subscriber Profile";
  subcategory?: string;
  description: string;
  source: string;
  field_type?: string;
}
