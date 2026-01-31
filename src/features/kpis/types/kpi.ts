export interface KPI {
  id: string;
  name: string;
  category: "System Event" | "Customer Device Info" | "Usage Metric" | "Revenue Metric" | "Customer Profile Info";
  subcategory?: string;
  description: string;
  source: string;
}
