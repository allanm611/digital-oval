import { useRef } from "react";
import { campaignService } from "../services/campaignService";
import { CampaignStatsSummary, CampaignCategory } from "../types/campaign";

/**
 * Data structure for campaigns page initial load
 */
export interface CampaignsPageData {
  categories: CampaignCategory[];
  stats: CampaignStatsSummary;
}

/**
 * Suspense-compatible hook for loading CampaignsPage initial data
 *
 * This hook throws a promise to Suspense while loading data,
 * allowing the page skeleton to render immediately while data loads.
 *
 * Usage:
 * function CampaignsDataLoader() {
 *   const data = useCampaignsInitialData();
 *   return <CampaignsContent {...data} />;
 * }
 *
 * Wrap with: <SuspenseBoundary><CampaignsDataLoader /></SuspenseBoundary>
 */
export function useCampaignsInitialData(): CampaignsPageData {
  const cacheRef = useRef<CampaignsPageData | null>(null);
  const loadingPromiseRef = useRef<Promise<CampaignsPageData> | null>(null);

  // Return cached data if available
  if (cacheRef.current) {
    return cacheRef.current;
  }

  // Create loading promise if not already started
  if (!loadingPromiseRef.current) {
    loadingPromiseRef.current = Promise.all([
      campaignService.getCampaignCategories(),
      campaignService.getCampaignStats(true),
    ])
      .then(([categoriesResponse, statsResponse]) => {
        const data: CampaignsPageData = {
          categories: categoriesResponse.data || [],
          stats: statsResponse.data || {
            total_campaigns: 0,
            active_campaigns: 0,
            draft_campaigns: 0,
            completed_campaigns: 0,
            total_sent: 0,
            total_conversions: 0,
            avg_conversion_rate: 0,
            total_revenue: 0,
          },
        };
        cacheRef.current = data;
        return data;
      })
      .catch((error) => {
        // Clear promise on error so it retries next time
        loadingPromiseRef.current = null;
        throw error;
      });
  }

  // Throw promise to Suspense boundary
  throw loadingPromiseRef.current;
}

/**
 * Hook for loading detailed campaign list with filters
 * Can be called multiple times with different filters
 */
export function useCampaignsList(
  filters: {
    limit?: number;
    offset?: number;
    search?: string;
    status?: string;
  } = {}
) {
  const cacheRef = useRef<any | null>(null);
  const filterKeyRef = useRef(JSON.stringify(filters));

  // Reset cache if filters changed
  if (filterKeyRef.current !== JSON.stringify(filters)) {
    cacheRef.current = null;
    filterKeyRef.current = JSON.stringify(filters);
  }

  if (cacheRef.current) {
    return cacheRef.current;
  }

  throw campaignService
    .getCampaigns({
      limit: filters.limit || 100,
      offset: filters.offset || 0,
    })
    .then((response) => {
      cacheRef.current = response;
      return response;
    });
}
