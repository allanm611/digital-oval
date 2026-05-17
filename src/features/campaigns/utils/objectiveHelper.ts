const objectiveMap: Record<string, string> = {
  acquisition: "Acquisition",
  retention: "Retention",
  churn_prevention: "Churn Prevention",
  upsell_cross_sell: "Upsell & Cross Sell",
  reactivation: "Reactivation",
};

export function getObjectiveDisplayName(
  objective: string | number | null | undefined,
): string {
  if (!objective) return "—";

  const key = String(objective).toLowerCase();
  return objectiveMap[key] || String(objective);
}
