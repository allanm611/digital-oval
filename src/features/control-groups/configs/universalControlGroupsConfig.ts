export interface UniversalControlGroup {
  id: string;
  name: string;
  status: "active" | "inactive" | "expired";
  generationTime: string;
  percentage: number;
  memberCount: number;
  customerBase: "active_subscribers" | "all_customers" | "saved_segments";
  recurrence: "once" | "daily" | "weekly" | "monthly";
  lastGenerated?: string;
  nextGeneration?: string;
  createdBy?: string;
  description?: string;
  sizeMethod?: "percentage" | "fixed_value" | "advanced_parameters";
  outlierRemoval?: boolean;
  varianceCalculation?: boolean;
  createdAt?: string;
}

export const UNIVERSAL_CONTROL_GROUPS: UniversalControlGroup[] = [
  {
    id: "1",
    name: "Premium Customer Control",
    status: "active",
    generationTime: "2025-01-20 09:00",
    percentage: 15,
    memberCount: 12500,
    customerBase: "active_subscribers",
    recurrence: "weekly",
    lastGenerated: "2025-01-20",
    nextGeneration: "2025-01-27",
    createdBy: "Marketing Team",
    description: "Control group for premium customer campaigns",
  },
  {
    id: "2",
    name: "General Population Control",
    status: "active",
    generationTime: "2025-01-19 14:30",
    percentage: 10,
    memberCount: 25000,
    customerBase: "all_customers",
    recurrence: "monthly",
    lastGenerated: "2025-01-19",
    nextGeneration: "2025-02-19",
    createdBy: "Data Science Team",
    description: "Standard control group for all customer campaigns",
  },
  {
    id: "3",
    name: "Segment-Based Control",
    status: "inactive",
    generationTime: "2025-01-15 11:00",
    percentage: 20,
    memberCount: 8750,
    customerBase: "saved_segments",
    recurrence: "once",
    lastGenerated: "2025-01-15",
    createdBy: "Campaign Manager",
    description: "One-time control group for specific segment testing",
  },
];
