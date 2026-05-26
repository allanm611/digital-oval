export type PriorityLevel = "low" | "medium" | "high" | "critical";

export interface PriorityOption {
  value: PriorityLevel;
  label: string;
  bars: number;          // 1-4, visual indicator count
  color: string;         // Tailwind color class (e.g., "text-blue-600")
}

export interface RankOption {
  value: number;         // 1-5
  label?: string;        // Optional, for display
}

export interface PriorityConfig {
  priority?: PriorityLevel;
  priority_rank?: number;  // 1-5, rank within the selected priority level
}

export interface PrioritySectionState extends PriorityConfig {
  priorityOptions: PriorityOption[];
  rankOptions: RankOption[];
}

export const PRIORITY_OPTIONS: PriorityOption[] = [
  {
    value: "low",
    label: "Low",
    bars: 1,
    color: "text-blue-600",
  },
  {
    value: "medium",
    label: "Medium",
    bars: 2,
    color: "text-yellow-600",
  },
  {
    value: "high",
    label: "High",
    bars: 3,
    color: "text-orange-600",
  },
  {
    value: "critical",
    label: "Critical",
    bars: 4,
    color: "text-red-600",
  },
];

export const RANK_OPTIONS: RankOption[] = [1, 2, 3, 4, 5].map((rank) => ({
  value: rank,
}));
