import type { TrackingSourceType } from "../../offers/utils/trackingSourcesConfig";

/**
 * Catalog item for Configuration → Offer Tracking Sources.
 * Sourced from GET/POST/PUT/DELETE `/offer-tracking-sources`
 * (app.use("/offer-tracking-sources", OfferTrackingSourcesRouter)).
 *
 * Not the engine attribution catalog at `/tracking-sources`.
 */
export interface TrackingSourceCatalogItem {
  id: number | string;
  name: string;
  description?: string;
  type: TrackingSourceType | string;
  dataSource: string;
  parameters: string[];
  displayMetrics: string[];
  conditions?: string[];
  lookbackPeriod?: string;
  customLookbackDate?: string;
  isActive?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTrackingSourceRequest {
  name: string;
  description?: string;
  type: string;
  dataSource: string;
  parameters?: string[];
  displayMetrics?: string[];
  conditions?: string[];
  lookbackPeriod?: string;
  customLookbackDate?: string;
  isActive?: boolean;
}

export type UpdateTrackingSourceRequest = Partial<CreateTrackingSourceRequest>;

export function isTrackingSourceActive(
  item: Pick<TrackingSourceCatalogItem, "isActive" | "is_active">,
): boolean {
  if (item.isActive === false || item.is_active === false) return false;
  return true;
}
