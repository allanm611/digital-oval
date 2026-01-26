import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  AlertCircle,
  Play,
  Pause,
  Edit,
  Trash2,
  Tag,
  CheckCircle,
  XCircle,
  Zap,
  Clock,
  MoreHorizontal,
  Users,
  Send,
  TrendingUp,
  DollarSign,
  Package,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { color, tw, button } from "../../../shared/utils/utils";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import BackButton from "../../../shared/components/ui/BackButton";
import { campaignService } from "../services/campaignService";
import { campaignSegmentOfferService } from "../services/campaignSegmentOfferService";
import { offerService } from "../../offers/services/offerService";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import CurrencyFormatter from "../../../shared/components/CurrencyFormatter";
import DateFormatter from "../../../shared/components/DateFormatter";
import { userService } from "../../users/services/userService";
import {
  Campaign,
  CampaignSegmentDetail,
  CampaignBudgetUtilisation,
} from "../types/campaign";
import { Offer } from "../../offers/types/offer";

export default function CampaignDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { t } = useLanguage();

  // Check if we came from a catalog modal
  const returnTo = (
    location.state as {
      returnTo?: {
        pathname: string;
        fromModal?: boolean;
        catalogId?: number | string;
      };
    }
  )?.returnTo;

  const handleBack = () => {
    if (returnTo?.pathname) {
      navigate(returnTo.pathname, { replace: true });
      return;
    }

    navigateBackOrFallback(navigate, "/dashboard/campaigns");
  };
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [rejectComments, setRejectComments] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isApproveLoading, setIsApproveLoading] = useState(false);
  const [categoryName, setCategoryName] = useState<string>("Uncategorized");
  const [performanceData, setPerformanceData] = useState<{
    sent: number;
    delivered: number;
    opened?: number;
    converted: number;
    revenue: number;
  } | null>(null);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);
  const [segments, setSegments] = useState<CampaignSegmentDetail[]>([]);
  const [isLoadingSegments, setIsLoadingSegments] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const [budgetUtilisation, setBudgetUtilisation] =
    useState<CampaignBudgetUtilisation | null>(null);
  const [isLoadingBudgetUtil, setIsLoadingBudgetUtil] = useState(false);
  const [createdByName, setCreatedByName] = useState<string>("");

  const formatObjective = (objective?: string | null) => {
    if (!objective) return "—";
    return objective
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  useEffect(() => {
    const fetchCampaignDetails = async () => {
      try {
        setIsLoading(true);

        // Skip cache to get fresh data
        const response = (await campaignService.getCampaignById(id!, true)) as {
          data?: Campaign;
          success?: boolean;
        };
        const campaignData = response.data || (response as Campaign);

        setCampaign(campaignData);

        // Fetch category name if category_id exists
        if (campaignData.category_id) {
          try {
            const categoriesResponse =
              (await campaignService.getCampaignCategories()) as {
                data?: Array<{ id: string | number; name: string }>;
              };
            const categories = categoriesResponse.data || [];
            const category = categories.find(
              (cat) => String(cat.id) === String(campaignData.category_id),
            );
            if (category) {
              setCategoryName(category.name);
            }
          } catch (error) {
            console.error("Failed to fetch category name:", error);
          }
        }

        setPerformanceData(null);
        setIsLoadingPerformance(false);

        if (campaignData.created_by) {
          try {
            const creatorResponse = await userService.getUserById(
              Number(campaignData.created_by),
              true,
            );
            const creator = creatorResponse?.data;
            if (creator) {
              const nameFromParts = `${creator.first_name || ""} ${
                creator.last_name || ""
              }`.trim();
              const displayName =
                creator.display_name ||
                nameFromParts ||
                creator.email_address ||
                `User #${campaignData.created_by}`;
              setCreatedByName(displayName);
            }
          } catch (error) {
            console.error("Failed to fetch creator info:", error);
            setCreatedByName(`User #${campaignData.created_by}`);
          }
        } else {
          setCreatedByName("");
        }

        // Fetch campaign segments, offers, and budget utilisation
        if (campaignData.id) {
          const campaignId = parseInt(campaignData.id);
          await Promise.all([
            fetchCampaignSegments(campaignId),
            fetchCampaignOffers(campaignId),
            fetchBudgetUtilisation(campaignId),
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch campaign details:", error);
        showToast("error", "Failed to load campaign details");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchCampaignDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchCampaignSegments = async (campaignId: number) => {
    try {
      setIsLoadingSegments(true);
      const response = await campaignService.getCampaignSegments(
        campaignId,
        true,
      );
      if (response && typeof response === "object" && "data" in response) {
        // Backend returns: { success: true, data: CampaignSegmentDetail[], total: number }
        // Handle both nested and direct array responses
        let fetchedSegments: CampaignSegmentDetail[] = [];
        if (Array.isArray(response.data)) {
          // Direct array: { data: [...] }
          fetchedSegments = response.data;
        } else if (
          response.data &&
          typeof response.data === "object" &&
          "data" in response.data &&
          Array.isArray(
            (response.data as { data?: CampaignSegmentDetail[] }).data,
          )
        ) {
          // Nested: { data: { data: [...] } }
          fetchedSegments = (response.data as { data: CampaignSegmentDetail[] })
            .data;
        }
        setSegments(fetchedSegments);
      } else {
        setSegments([]);
      }
    } catch (error) {
      console.error("Failed to fetch campaign segments:", error);
      // Don't show error toast for segments as it's not critical
      setSegments([]);
    } finally {
      setIsLoadingSegments(false);
    }
  };

  const fetchCampaignOffers = async (campaignId: number) => {
    try {
      setIsLoadingOffers(true);
      const response =
        await campaignSegmentOfferService.getMappingsByCampaign(campaignId);
      if (response && response.success && Array.isArray(response.data)) {
        // Extract unique offer IDs from mappings
        const offerIds = new Set<number>();
        response.data.forEach((mapping) => {
          if (mapping.offer_id) {
            offerIds.add(mapping.offer_id);
          }
        });

        // Fetch full offer details for each offer ID
        const offerPromises = Array.from(offerIds).map(async (offerId) => {
          try {
            const offerResponse = await offerService.getOfferById(
              offerId,
              true,
            );
            // Handle both direct Offer and { success: true, data: Offer } response formats
            if (offerResponse && typeof offerResponse === "object") {
              if ("data" in offerResponse && offerResponse.data) {
                return offerResponse.data as Offer;
              } else if ("id" in offerResponse) {
                return offerResponse as unknown as Offer;
              }
            }
            return null;
          } catch (error) {
            console.error(`Failed to fetch offer ${offerId}:`, error);
            return null;
          }
        });

        const fetchedOffers = await Promise.all(offerPromises);
        setOffers(
          fetchedOffers.filter((offer): offer is Offer => offer !== null),
        );
      } else {
        setOffers([]);
      }
    } catch (error) {
      console.error("Failed to fetch campaign offers:", error);
      setOffers([]);
    } finally {
      setIsLoadingOffers(false);
    }
  };

  const fetchBudgetUtilisation = async (campaignId: number) => {
    try {
      setIsLoadingBudgetUtil(true);
      const response = await campaignService.getCampaignBudgetUtilisation(
        campaignId,
        true,
      );
      if (response && typeof response === "object" && "data" in response) {
        const budgetData = response.data as CampaignBudgetUtilisation;
        setBudgetUtilisation(budgetData);
      }
    } catch (error) {
      console.error("Failed to fetch budget utilisation:", error);
      // Don't show error toast as it's not critical
    } finally {
      setIsLoadingBudgetUtil(false);
    }
  };

  // Action handlers
  // Note: Campaigns are automatically set to 'pending' approval status when created
  // No manual submit is needed - editing a rejected campaign automatically resets to pending

  const handleApproveCampaign = async () => {
    if (!id) return;

    try {
      setIsApproveLoading(true);
      await campaignService.approveCampaign(parseInt(id), {
        comments: "Approved from details page",
      });
      showToast("success", "Campaign approved successfully");
      // Refresh campaign data
      if (campaign) {
        setCampaign({ ...campaign, approval_status: "approved" });
      }
    } catch (error) {
      console.error("Failed to approve campaign:", error);
      showToast("error", "Failed to approve campaign");
    } finally {
      setIsApproveLoading(false);
    }
  };

  const handleRejectCampaign = async () => {
    if (!id || !rejectComments.trim()) {
      showToast("error", "Please provide rejection comments");
      return;
    }

    try {
      setIsActionLoading(true);
      await campaignService.rejectCampaign(parseInt(id), {
        comments: rejectComments,
      });
      showToast("success", "Campaign rejected");
      setShowRejectModal(false);
      setRejectComments("");
      // Refresh campaign data
      if (campaign) {
        setCampaign({ ...campaign, approval_status: "rejected" });
      }
    } catch (error) {
      console.error("Failed to reject campaign:", error);
      showToast("error", "Failed to reject campaign");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleActivateCampaign = async () => {
    if (!id) return;

    try {
      setIsActionLoading(true);
      await campaignService.activateCampaign(parseInt(id));
      showToast("success", "Campaign activated successfully");
      // Refresh campaign data
      if (campaign) {
        setCampaign({ ...campaign, status: "active" });
      }
    } catch (error) {
      console.error("Failed to activate campaign:", error);
      showToast("error", "Failed to activate campaign");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePauseCampaign = async () => {
    if (!id) return;

    try {
      setIsActionLoading(true);
      const pauseResponse = await campaignService.pauseCampaign(parseInt(id), {
        comments: "Paused from details page",
      });
      showToast("success", "Campaign paused");

      // Use fresh API data instead of optimistic update
      const responseData = pauseResponse as unknown as {
        success: boolean;
        data?: { status?: string };
      };
      if (responseData.success && responseData.data?.status) {
        const newCampaign = {
          ...campaign,
          status: responseData.data.status,
        } as Campaign;
        setCampaign(newCampaign);
      }
    } catch (error) {
      console.error("Failed to pause campaign:", error);
      showToast("error", "Failed to pause campaign");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResumeCampaign = async () => {
    if (!id) return;

    try {
      setIsActionLoading(true);
      const resumeResponse = await campaignService.resumeCampaign(parseInt(id));
      showToast("success", "Campaign resumed");

      // Use fresh API data instead of optimistic update
      const responseData = resumeResponse as unknown as {
        success: boolean;
        data?: { status?: string };
      };
      if (responseData.success && responseData.data?.status) {
        setCampaign({
          ...campaign,
          status: responseData.data.status,
        } as Campaign);
      }
    } catch (error) {
      console.error("Failed to resume campaign:", error);
      showToast("error", "Failed to resume campaign");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!id) return;

    try {
      setIsActionLoading(true);
      await campaignService.deleteCampaign(parseInt(id));
      showToast("success", "Campaign deleted successfully");
      navigate("/dashboard/campaigns");
    } catch (error) {
      console.error("Failed to delete campaign:", error);
      showToast("error", "Failed to delete campaign");
    } finally {
      setIsActionLoading(false);
      setShowDeleteModal(false);
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return "bg-gray-100 text-gray-800";
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getApprovalBadge = (status?: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Use DateFormatter component instead of local formatDate function

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner variant="modern" size="xl" color="primary" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle
            className={`w-16 h-16 text-[${color.primary.action}] mx-auto mb-4`}
          />
          <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
            Campaign Not Found
          </h3>
          <p className={`${tw.textMuted} mb-6`}>
            The campaign you are looking for does not exist.
          </p>
          <button
            onClick={handleBack}
            className={`px-4 py-2 ${tw.rounded} font-semibold flex items-center gap-2 mx-auto text-base text-white`}
            style={{ backgroundColor: color.primary.action }}
          >
            <ArrowLeft className="w-4 h-4" />
            {returnTo?.pathname ? "Back" : "Back to Campaigns"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <BackButton fallbackTo="/dashboard/campaigns" onClick={handleBack} />
          <div>
            <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
              {t.pages.campaignDetails}
            </h1>
            <p className={`${tw.textSecondary} mt-2 text-sm`}>
              View and manage campaign information
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Primary Action - Based on Status */}
          {campaign.approval_status === "pending" && (
              <button
                onClick={handleApproveCampaign}
                disabled={isApproveLoading}
                className={`flex items-center gap-2 ${tw.rounded} font-semibold text-sm disabled:opacity-50`}
                style={{
                  backgroundColor: button.secondaryAction.background,
                  color: button.secondaryAction.color,
                  border: button.secondaryAction.border,
                  padding: `${button.secondaryAction.paddingY} ${button.secondaryAction.paddingX}`,
                  borderRadius: button.secondaryAction.borderRadius,
                  fontSize: button.secondaryAction.fontSize,
                }}
              >
                {isApproveLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {isApproveLoading ? "Approving..." : "Approve"}
              </button>
            )}

          {campaign.approval_status === "approved" &&
            campaign.status === "draft" && (
              <button
                onClick={handleActivateCampaign}
                disabled={isActionLoading}
                className={`px-4 py-2 text-white ${tw.rounded} font-semibold flex items-center gap-2 text-sm disabled:opacity-50`}
                style={{ backgroundColor: color.primary.action }}
              >
                {isActionLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {isActionLoading ? "Activating..." : "Activate"}
              </button>
            )}

          {/* Run Campaign Button - Commented out until required fields are properly connected */}
          {/* {campaign.status === 'active' && campaign.status !== 'running' && campaign.status !== 'paused' && (
                        <button
                            onClick={handleRunCampaign}
                            disabled={isRunLoading}
                            className={`px-4 py-2 text-white ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-sm disabled:opacity-50`}
                            style={{ backgroundColor: '#059669' }}
                        >
                            {isRunLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                                <Play className="w-4 h-4" />
                            )}
                            {isRunLoading ? 'Running...' : 'Run Campaign'}
                        </button>
                    )} */}

          {campaign.status === "active" && (
            <button
              onClick={handlePauseCampaign}
              disabled={isActionLoading}
              className={`flex items-center gap-2 ${tw.rounded} font-semibold text-sm disabled:opacity-50`}
              style={{
                backgroundColor: button.secondaryAction.background,
                color: button.secondaryAction.color,
                border: button.secondaryAction.border,
                padding: `${button.secondaryAction.paddingY} ${button.secondaryAction.paddingX}`,
                borderRadius: button.secondaryAction.borderRadius,
                fontSize: button.secondaryAction.fontSize,
              }}
            >
              {isActionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              ) : (
                <Pause className="w-4 h-4" />
              )}
              {isActionLoading ? "Pausing..." : "Pause"}
            </button>
          )}

          {campaign.status === "paused" && (
            <button
              onClick={handleResumeCampaign}
              disabled={isActionLoading}
              className={`flex items-center gap-2 ${tw.rounded} font-semibold text-sm disabled:opacity-50`}
              style={{
                backgroundColor: button.secondaryAction.background,
                color: button.secondaryAction.color,
                border: button.secondaryAction.border,
                padding: `${button.secondaryAction.paddingY} ${button.secondaryAction.paddingX}`,
                borderRadius: button.secondaryAction.borderRadius,
                fontSize: button.secondaryAction.fontSize,
              }}
            >
              {isActionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isActionLoading ? "Resuming..." : "Resume"}
            </button>
          )}

          {/* Edit Button - Always Visible */}
          <button
            onClick={() =>
              navigate(`/dashboard/campaigns/${id}/edit`, {
                state: { campaign: campaign },
              })
            }
            className={`px-4 py-2 text-white ${tw.rounded} font-semibold flex items-center gap-2 text-sm`}
            style={{ backgroundColor: color.primary.action }}
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`flex items-center gap-2 ${tw.rounded} font-semibold text-sm`}
              style={{
                backgroundColor: button.secondaryAction.background,
                color: button.secondaryAction.color,
                border: button.secondaryAction.border,
                padding: `${button.secondaryAction.paddingY} ${button.secondaryAction.paddingX}`,
                borderRadius: button.secondaryAction.borderRadius,
                fontSize: button.secondaryAction.fontSize,
              }}
            >
              <MoreHorizontal className="w-4 h-4" />
              More
            </button>

            {showMoreMenu && (
              <div
                className={`absolute right-0 mt-2 w-52 bg-white border border-gray-200 ${tw.rounded} shadow-xl py-2 z-50`}
              >
                {/* Reject - Only if pending */}
                {campaign.approval_status === "pending" && (
                    <button
                      onClick={() => {
                        setShowRejectModal(true);
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600"
                    >
                      <XCircle className="w-4 h-4 mr-3" />
                      Reject Campaign
                    </button>
                  )}

                {/* Delete - Always available */}
                <button
                  onClick={() => {
                    setShowDeleteModal(true);
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm"
                  style={{
                    color: button.delete.background,
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-3" />
                  Delete Campaign
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Sent Card */}
        <div
          className={`bg-white ${tw.rounded} border border-[${color.border.default}] p-6 shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${tw.textMuted} mb-1`}>Sent</p>
              {isLoadingPerformance ? (
                <div className="animate-pulse h-8 w-24 bg-gray-200 rounded mt-1"></div>
              ) : (
                <p className={`text-2xl font-bold ${tw.textPrimary}`}>
                  {performanceData?.sent?.toLocaleString() || 0}
                </p>
              )}
            </div>
            <div
              className={`w-12 h-12 ${tw.rounded} flex items-center justify-center`}
              style={{ backgroundColor: `${color.primary.accent}15` }}
            >
              <Send
                className="w-6 h-6"
                style={{ color: color.primary.accent }}
              />
            </div>
          </div>
        </div>

        {/* Delivered Card */}
        <div
          className={`bg-white ${tw.rounded} border border-[${color.border.default}] p-6 shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${tw.textMuted} mb-1`}>
                Delivered
              </p>
              {isLoadingPerformance ? (
                <div className="animate-pulse h-8 w-24 bg-gray-200 rounded mt-1"></div>
              ) : (
                <p className={`text-2xl font-bold ${tw.textPrimary}`}>
                  {performanceData?.delivered?.toLocaleString() || 0}
                </p>
              )}
            </div>
            <div
              className={`w-12 h-12 ${tw.rounded} flex items-center justify-center`}
              style={{ backgroundColor: `${color.primary.accent}15` }}
            >
              <CheckCircle
                className="w-6 h-6"
                style={{ color: color.primary.accent }}
              />
            </div>
          </div>
        </div>

        {/* Converted Card */}
        <div
          className={`bg-white ${tw.rounded} border border-[${color.border.default}] p-6 shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${tw.textMuted} mb-1`}>
                Converted
              </p>
              {isLoadingPerformance ? (
                <div className="animate-pulse h-8 w-24 bg-gray-200 rounded mt-1"></div>
              ) : (
                <p className={`text-2xl font-bold ${tw.textPrimary}`}>
                  {performanceData?.converted?.toLocaleString() || 0}
                </p>
              )}
            </div>
            <div
              className={`w-12 h-12 ${tw.rounded} flex items-center justify-center`}
              style={{ backgroundColor: `${color.primary.accent}15` }}
            >
              <TrendingUp
                className="w-6 h-6"
                style={{ color: color.primary.accent }}
              />
            </div>
          </div>
        </div>

        {/* Conversion Rate Card */}
        <div
          className={`bg-white ${tw.rounded} border border-[${color.border.default}] p-6 shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${tw.textMuted} mb-1`}>
                Conversion Rate
              </p>
              {isLoadingPerformance ? (
                <div className="animate-pulse h-8 w-24 bg-gray-200 rounded mt-1"></div>
              ) : (
                <p className={`text-2xl font-bold ${tw.textPrimary}`}>
                  {performanceData?.delivered && performanceData?.converted
                    ? (
                        (performanceData.converted /
                          performanceData.delivered) *
                        100
                      ).toFixed(2)
                    : "0.00"}
                  %
                </p>
              )}
            </div>
            <div
              className={`w-12 h-12 ${tw.rounded} flex items-center justify-center`}
              style={{ backgroundColor: `${color.primary.accent}15` }}
            >
              <TrendingUp
                className="w-6 h-6"
                style={{ color: color.primary.accent }}
              />
            </div>
          </div>
        </div>

        {/* Revenue Card */}
        <div
          className={`bg-white ${tw.rounded} border border-[${color.border.default}] p-6 shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${tw.textMuted} mb-1`}>
                Revenue
              </p>
              {isLoadingPerformance ? (
                <div className="animate-pulse h-8 w-24 bg-gray-200 rounded mt-1"></div>
              ) : (
                <p className={`text-2xl font-bold ${tw.textPrimary}`}>
                  <CurrencyFormatter amount={performanceData?.revenue || 0} />
                </p>
              )}
            </div>
            <div
              className={`w-12 h-12 ${tw.rounded} flex items-center justify-center`}
              style={{ backgroundColor: `${color.primary.accent}15` }}
            >
              <DollarSign
                className="w-6 h-6"
                style={{ color: color.primary.accent }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Information and Budget Utilization - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-start">
        {/* Campaign Information Card */}
        <div
          className={`bg-white ${tw.rounded} border border-[${color.border.default}] p-6 shadow-sm`}
        >
          {/* Campaign Header */}
          <div className="mb-3 pb-3 border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className={`text-2xl font-bold ${tw.textPrimary}`}>
                {campaign.name}
              </h2>
              <div className="flex items-center flex-wrap gap-2">
                {(!campaign.approval_status ||
                  campaign.approval_status?.toLowerCase() !==
                    campaign.status?.toLowerCase()) && (
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                      campaign.status,
                    )}`}
                  >
                    {campaign.status?.charAt(0).toUpperCase() +
                      campaign.status?.slice(1)}
                  </span>
                )}
                {campaign.approval_status && (
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getApprovalBadge(
                      campaign.approval_status,
                    )}`}
                  >
                    {campaign.approval_status === "approved" && (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    )}
                    {campaign.approval_status === "rejected" && (
                      <XCircle className="w-3 h-3 mr-1" />
                    )}
                    {campaign.approval_status === "pending" && (
                      <Clock className="w-3 h-3 mr-1" />
                    )}
                    {campaign.approval_status?.charAt(0).toUpperCase() +
                      campaign.approval_status?.slice(1)}
                  </span>
                )}
              </div>
            </div>
            <p className={`${tw.textSecondary} mb-2 text-base leading-relaxed`}>
              {campaign.description}
            </p>
            {/* Rejection Reason Display */}
            {campaign.approval_status === "rejected" && campaign.rejection_reason && (
              <div
                className={`mt-4 p-4 bg-red-50 border border-red-200 ${tw.rounded}`}
              >
                <div className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-sm font-semibold text-red-800 mb-1`}>
                      Rejection Reason
                    </p>
                    <p className={`text-sm text-red-700`}>
                      {campaign.rejection_reason}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Campaign Details Grid */}
          <div>
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
              Campaign Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  className={`text-sm font-medium ${tw.textMuted} block mb-2`}
                >
                  Campaign ID
                </label>
                <p className={`text-base ${tw.textPrimary} font-mono`}>
                  {campaign.id}
                </p>
              </div>
              <div>
                <label
                  className={`text-sm font-medium ${tw.textMuted} block mb-2`}
                >
                  Objective
                </label>
                <p className={`text-base ${tw.textPrimary}`}>
                  {formatObjective(campaign.objective)}
                </p>
              </div>
              <div>
                <label
                  className={`text-sm font-medium ${tw.textMuted} block mb-2`}
                >
                  Category
                </label>
                <p className={`text-base ${tw.textPrimary}`}>{categoryName}</p>
              </div>
              <div>
                <label
                  className={`text-sm font-medium ${tw.textMuted} block mb-2`}
                >
                  Segments
                </label>
                <p className={`text-base ${tw.textPrimary}`}>
                  {segments.length} segment{segments.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div>
                <label
                  className={`text-sm font-medium ${tw.textMuted} block mb-2`}
                >
                  Offers
                </label>
                <p className={`text-base ${tw.textPrimary}`}>
                  {isLoadingOffers
                    ? "Loading..."
                    : `${offers.length} offer${offers.length !== 1 ? "s" : ""}`}
                </p>
              </div>
              <div>
                <label
                  className={`text-sm font-medium ${tw.textMuted} block mb-2`}
                >
                  Created Date
                </label>
                <p className={`text-base ${tw.textPrimary} flex items-center`}>
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  <DateFormatter
                    date={campaign.created_at}
                    useLocale
                    year="numeric"
                    month="long"
                    day="numeric"
                  />
                </p>
              </div>
              <div>
                <label
                  className={`text-sm font-medium ${tw.textMuted} block mb-2`}
                >
                  Created By
                </label>
                <p className={`text-base ${tw.textPrimary}`}>
                  {createdByName || "—"}
                </p>
              </div>
              <div className="md:col-span-2">
                <label
                  className={`text-sm font-medium ${tw.textMuted} block mb-2`}
                >
                  Tags
                </label>
                {campaign.tags && campaign.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {campaign.tags.map((tag, index) => (
                      <span
                        key={`${tag}-${index}`}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[${color.primary.accent}]/10 text-[${color.primary.accent}]`}
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag.replace("catalog:", "")}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className={`text-base ${tw.textSecondary}`}>
                    No tags added
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Budget Utilization Card */}
        {budgetUtilisation && (
          <div
            className={`bg-white ${tw.rounded} border border-[${color.border.default}] p-6 shadow-sm`}
          >
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
              Budget Utilization
            </h3>
            {isLoadingBudgetUtil ? (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner variant="modern" size="sm" color="primary" />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-sm ${tw.textSecondary}`}>
                      Utilization:{" "}
                      {budgetUtilisation.utilization_percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          budgetUtilisation.utilization_percentage,
                          100,
                        )}%`,
                        backgroundColor: color.primary.accent,
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className={`text-sm ${tw.textSecondary}`}>
                    Remaining Budget
                  </span>
                  <span className={`text-sm font-semibold ${tw.textPrimary}`}>
                    <CurrencyFormatter
                      amount={budgetUtilisation.remaining_budget}
                    />
                  </span>
                </div>
                {campaign.budget_allocated && campaign.budget_spent && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                    <div>
                      <span
                        className={`text-xs ${tw.textSecondary} block mb-1`}
                      >
                        Allocated
                      </span>
                      <span className={`text-sm font-medium ${tw.textPrimary}`}>
                        <CurrencyFormatter
                          amount={parseFloat(String(campaign.budget_allocated))}
                        />
                      </span>
                    </div>
                    <div>
                      <span
                        className={`text-xs ${tw.textSecondary} block mb-1`}
                      >
                        Spent
                      </span>
                      <span className={`text-sm font-medium ${tw.textPrimary}`}>
                        <CurrencyFormatter
                          amount={parseFloat(String(campaign.budget_spent))}
                        />
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Campaign Segments Table */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`text-lg font-semibold ${tw.textPrimary} flex items-center gap-2`}
          >
            <Users className="w-5 h-5" />
            Campaign Segments ({segments.length})
          </h3>
        </div>
        {isLoadingSegments ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner variant="modern" size="md" color="primary" />
          </div>
        ) : segments.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className={`text-sm ${tw.textSecondary}`}>
              No segments connected to this campaign
            </p>
          </div>
        ) : (
          <div
            className={`overflow-x-auto ${tw.rounded} border border-[${color.border.default}]`}
          >
            <table
              className="w-full"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead style={{ background: color.surface.tableHeader }}>
                <tr>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Segment
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Description
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Type
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Primary
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Include/Exclude
                  </th>
                </tr>
              </thead>
              <tbody>
                {segments.map((segment) => (
                  <tr key={segment.id} className="transition-colors">
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/dashboard/segments/${segment.segment_id}`,
                            {
                              state: {
                                returnTo: {
                                  pathname: `/dashboard/campaigns/${id}`,
                                },
                              },
                            },
                          )
                        }
                        className={`font-semibold text-base ${tw.textPrimary} truncate`}
                        title={segment.segment_name}
                        style={{ color: color.primary.accent }}
                      >
                        {segment.segment_name}
                      </button>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {segment.segment_description ? (
                        <div
                          className={`text-sm ${tw.textMuted} truncate`}
                          title={segment.segment_description}
                        >
                          {segment.segment_description}
                        </div>
                      ) : (
                        <span className={`text-sm ${tw.textMuted}`}>
                          No description
                        </span>
                      )}
                    </td>
                    <td
                      className={`px-6 py-4 text-base ${tw.textPrimary}`}
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {segment.segment_type}
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {segment.is_primary ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          Primary
                        </span>
                      ) : (
                        <span className={`text-sm ${tw.textMuted}`}>—</span>
                      )}
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          segment.include_exclude === "include"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {segment.include_exclude === "include"
                          ? "Include"
                          : "Exclude"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Campaign Offers Table */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`text-lg font-semibold ${tw.textPrimary} flex items-center gap-2`}
          >
            <Package className="w-5 h-5" />
            Campaign Offers ({offers.length})
          </h3>
        </div>
        {isLoadingOffers ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner variant="modern" size="md" color="primary" />
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className={`text-sm ${tw.textSecondary}`}>
              No offers mapped to this campaign
            </p>
          </div>
        ) : (
          <div
            className={`overflow-x-auto ${tw.rounded} border border-[${color.border.default}]`}
          >
            <table
              className="w-full"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead style={{ background: color.surface.tableHeader }}>
                <tr>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Offer
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Description
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Code
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Status
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Type
                  </th>
                </tr>
              </thead>
              <tbody>
                {offers.map((offer) => (
                  <tr key={offer.id} className="transition-colors">
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/dashboard/offers/${offer.id}`, {
                            state: {
                              returnTo: {
                                pathname: `/dashboard/campaigns/${id}`,
                              },
                            },
                          })
                        }
                        className={`font-semibold text-base ${tw.textPrimary} truncate`}
                        title={offer.name}
                        style={{ color: color.primary.accent }}
                      >
                        {offer.name}
                      </button>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {offer.description ? (
                        <div
                          className={`text-sm ${tw.textMuted} truncate`}
                          title={offer.description}
                        >
                          {offer.description}
                        </div>
                      ) : (
                        <span className={`text-sm ${tw.textMuted}`}>
                          No description
                        </span>
                      )}
                    </td>
                    <td
                      className={`px-6 py-4 text-base ${tw.textPrimary}`} /* font-mono commented out - use normal font */
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {offer.code || "—"}
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {offer.status ? (
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            offer.status === "active"
                              ? "bg-green-100 text-green-800"
                              : offer.status === "draft"
                                ? "bg-gray-100 text-gray-800"
                                : offer.status === "expired"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {offer.status}
                        </span>
                      ) : (
                        <span className={`text-sm ${tw.textMuted}`}>—</span>
                      )}
                    </td>
                    <td
                      className={`px-6 py-4 hidden md:table-cell text-base ${tw.textMuted}`}
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {offer.offer_type || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Campaign Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowRejectModal(false)}
            />
            <div
              className={`relative bg-white ${tw.rounded} shadow-xl max-w-md w-full p-6`}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${tw.textPrimary}`}>
                    Reject Campaign
                  </h3>
                  <p className={`text-sm ${tw.textMuted}`}>
                    Please provide a reason
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                >
                  Rejection Comments <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectComments}
                  onChange={(e) => setRejectComments(e.target.value)}
                  placeholder="Explain why this campaign is being rejected..."
                  className={`w-full px-4 py-3 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                  rows={4}
                  maxLength={500}
                />
                <p className={`text-xs ${tw.textMuted} mt-1`}>
                  {rejectComments.length}/500 characters
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectComments("");
                  }}
                  disabled={isActionLoading}
                  className={`flex-1 px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} hover:bg-gray-50 font-medium transition-colors disabled:opacity-50`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectCampaign}
                  disabled={isActionLoading || !rejectComments.trim()}
                  className={`flex-1 px-4 py-2 bg-red-600 text-white ${tw.rounded} hover:bg-red-700 font-medium transition-colors disabled:opacity-50`}
                >
                  {isActionLoading ? "Rejecting..." : "Reject Campaign"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteCampaign}
        title="Delete Campaign"
        description="Are you sure you want to delete this campaign? This action cannot be undone and all campaign data will be permanently removed."
        itemName={campaign?.name || ""}
        isLoading={isActionLoading}
        confirmText="Delete Campaign"
        cancelText="Cancel"
      />
    </div>
  );
}
