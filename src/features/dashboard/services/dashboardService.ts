import offerService from "../../offers/services/offerService";
import { segmentService } from "../../segments/services/segmentService";
import campaignService from "../../campaigns/services/campaignService";

export interface DashboardStats {
  totalOffers: number;
  totalSegments: number;
  activeCampaigns: number;
  conversionRate: number;
}

interface CampaignStatsData {
  overview?: Record<string, unknown>;
  activity_status?: Record<string, unknown>;
  status_breakdown?: Record<string, unknown>;
  active_campaigns?: number;
  currently_active?: number;
}

class DashboardService {
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Fetch offers and segments stats
      const offersStatsResponse = await offerService.getStats(true);
      const segmentsStatsResponse = await segmentService.getSegmentStats(true);

      // Extract total offers from stats response (backend uses snake_case)
      const offersData = offersStatsResponse.data as
        | Record<string, unknown>
        | undefined;
      const totalOffersRaw = offersData?.total_offers;
      const totalOffers =
        typeof totalOffersRaw === "string"
          ? parseInt(totalOffersRaw, 10) || 0
          : (totalOffersRaw as number) || 0;

      // Extract total segments from stats response (backend uses snake_case and returns strings)
      const segmentsData = segmentsStatsResponse.data as
        | Record<string, unknown>
        | undefined;
      const totalSegmentsRaw = segmentsData?.total_segments;
      const totalSegments =
        typeof totalSegmentsRaw === "string"
          ? parseInt(totalSegmentsRaw, 10) || 0
          : (totalSegmentsRaw as number) || 0;

      // Fetch campaign stats
      let activeCampaigns = 0;
      let conversionRate = 0;

      try {
        const campaignStatsResponse = await campaignService.getCampaignStats(
          true
        );

        if (campaignStatsResponse.success && campaignStatsResponse.data) {
          const stats = campaignStatsResponse.data as CampaignStatsData;
          const overview = stats.overview ?? {};
          const activityStatus = stats.activity_status ?? {};
          const statusBreakdown = stats.status_breakdown ?? {};

          // Parse active campaigns (check multiple possible locations)
          const activeCampaignsRaw =
            activityStatus.is_active_flag_true ||
            activityStatus.currently_running ||
            statusBreakdown.active ||
            stats.active_campaigns ||
            stats.currently_active ||
            0;
          activeCampaigns =
            typeof activeCampaignsRaw === "string"
              ? parseInt(activeCampaignsRaw, 10) || 0
              : (activeCampaignsRaw as number) || 0;

          // Calculate conversion rate from completed vs total
          // Check overview first (like CampaignsPage does), then direct
          const totalCampaignsRaw =
            overview.total_campaigns || stats.total_campaigns || 0;
          const totalCampaigns =
            typeof totalCampaignsRaw === "string"
              ? parseInt(totalCampaignsRaw, 10) || 0
              : (totalCampaignsRaw as number) || 0;

          const completedCampaignsRaw = stats.completed || 0;
          const completedCampaigns =
            typeof completedCampaignsRaw === "string"
              ? parseInt(completedCampaignsRaw, 10) || 0
              : (completedCampaignsRaw as number) || 0;

          conversionRate =
            totalCampaigns > 0
              ? Math.round((completedCampaigns / totalCampaigns) * 100)
              : 0;
        }
      } catch (error) {
        console.error("Error fetching campaign stats:", error);
        // Continue with offers and segments stats
      }

      return {
        totalOffers,
        totalSegments,
        activeCampaigns,
        conversionRate,
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return {
        totalOffers: 0,
        totalSegments: 0,
        activeCampaigns: 0,
        conversionRate: 0,
      };
    }
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
