export interface OfferTrackingRule {
  id: string;
  name: string;
  priority: number;
  parameter: string;
  condition: "equals" | "greater_than" | "less_than" | "contains" | "is_any_of";
  value: string;
  enabled: boolean;
}

/** Instance of a tracking source attached to an offer (wizard / metadata). */
export interface OfferTrackingSource {
  id: string;
  name: string;
  type: "recharge" | "usage_metric" | "engagement" | "redemption" | "churn_prevention" | "custom" | string;
  enabled: boolean;
  rules: OfferTrackingRule[];
  /** Optional link to Configuration → Offer Tracking Sources catalog id */
  catalog_source_id?: number | string;
  is_default?: boolean;
}
