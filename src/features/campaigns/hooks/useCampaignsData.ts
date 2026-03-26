import { useRef } from "react";
import { campaignService } from "../services/campaignService";
import { CampaignStatsSummary, CampaignCategory } from "../types/campaign";

export interface CampaignsPageData {
  categories: CampaignCategory[];
  stats: CampaignStatsSummary;
}

export function useCampaignsInitialData(): CampaignsPageData {
  const cacheRef = useRef<CampaignsPageData | null>(null);
  const loadingPromiseRef = useRef<Promise<CampaignsPageData> | null>(null);

  if (cacheRef.current) {
    return cacheRef.current;
  }

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
        loadingPromiseRef.current = null;
        throw error;
      });
  }

  throw loadingPromiseRef.current;
}

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
