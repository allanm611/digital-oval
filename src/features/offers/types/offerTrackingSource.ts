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
  /** Engine source_type (e.g. recharge, usage_data) or legacy offer-catalog type */
  type: string;
  /** Engine source code when linked via `/tracking-sources` */
  code?: string;
  enabled: boolean;
  rules: OfferTrackingRule[];
  /**
   * @deprecated Prefer `engine_tracking_source_id`. Kept for older drafts that
   * linked Configuration → Offer Tracking Sources (`/offer-tracking-sources`).
   */
  catalog_source_id?: number | string;
  /**
   * FK into engine attribution catalog (`cvm.tracking_sources` via `/tracking-sources`).
   * Primary link for offer tracking + reward mappings.
   */
  engine_tracking_source_id?: number;
  is_default?: boolean;
}
