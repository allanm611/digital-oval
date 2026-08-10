export interface OfferTrackingRule {
  id: string;
  name: string;
  /**
   * Evaluation order within the tracking source.
   * Must be unique per source; allowed range is 1–20 (lower runs first).
   * Rules themselves are optional on a source.
   */
  priority: number;
  parameter: string;
  /** Offer-catalog conditions or engine operator symbols (e.g. equals, >=, IN). */
  condition:
    | "equals"
    | "greater_than"
    | "less_than"
    | "contains"
    | "is_any_of"
    | string;
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
  /**
   * FK into engine attribution catalog (`cvm.tracking_sources` via `/tracking-sources`).
   * Required for offer reward mappings; resolved from catalog type/code when possible.
   */
  engine_tracking_source_id?: number;
  is_default?: boolean;
}
