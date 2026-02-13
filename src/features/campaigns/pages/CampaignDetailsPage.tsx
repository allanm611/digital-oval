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
  ChevronDown,
  Eye,
  X,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { color, tw, button } from "../../../shared/utils/utils";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import BackButton from "../../../shared/components/ui/BackButton";
import { campaignService } from "../services/campaignService";
import { campaignSegmentOfferService } from "../services/campaignSegmentOfferService";
import { campaignFlowService } from "../services/campaignFlowService";
import { offerService } from "../../offers/services/offerService";
import { segmentService } from "../../segments/services/segmentService";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import CurrencyFormatter from "../../../shared/components/CurrencyFormatter";
import DateFormatter from "../../../shared/components/DateFormatter";
import { userService } from "../../users/services/userService";
import { PermissionGate } from "../../auth/components/PermissionGate";
import ExecuteCampaignModal from "../components/ExecuteCampaignModal";
import {
  Campaign,
  CampaignSegmentDetail,
  CampaignBudgetUtilisation,
} from "../types/campaign";
import { CampaignFlowConfig } from "../types/campaignFlow";
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
  const [flows, setFlows] = useState<CampaignFlowConfig[]>([]);
  const [isLoadingFlows, setIsLoadingFlows] = useState(false);
  const [budgetUtilisation, setBudgetUtilisation] =
    useState<CampaignBudgetUtilisation | null>(null);
  const [isLoadingBudgetUtil, setIsLoadingBudgetUtil] = useState(false);
  const [createdByName, setCreatedByName] = useState<string>("");
  const [showFlowEditModal, setShowFlowEditModal] = useState(false);
  const [showFlowDeleteModal, setShowFlowDeleteModal] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<CampaignFlowConfig | null>(
    null,
  );
  const [editedFlow, setEditedFlow] = useState<Partial<CampaignFlowConfig>>({});
  const [isFlowActionLoading, setIsFlowActionLoading] = useState(false);
  const [activeSegments, setActiveSegments] = useState<CampaignSegmentDetail[]>([]);
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);
  const [isLoadingActiveData, setIsLoadingActiveData] = useState(false);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [executionMetrics, setExecutionMetrics] = useState<{
    total_messages_sent: number;
    total_messages_failed: number;
    total_broadcasts: number;
    broadcasts_completed: number;
    execution_time_ms: number;
  } | null>(null);

  const formatObjective = (objective?: string | null) => {
    if (!objective) return "—";
    return objective
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Flow type mapping - matches backend naming (UPPERCASE) to frontend display (matching campaign type labels)
  const flowTypeOptions = [
    {
      value: "STANDARD",
      label: "Multiple Target Group",
      backendType: "STANDARD",
    },
    {
      value: "AB_TEST",
      label: "A/B Test",
      backendType: "AB_TEST",
    },
    {
      value: "CHAMPION_CHALLENGER",
      label: "Champion-Challenger",
      backendType: "CHAMPION_CHALLENGER",
    },
    {
      value: "ROUND_ROBIN",
      label: "Round Robin",
      backendType: "ROUND_ROBIN",
    },
    {
      value: "MULTIPLE_LEVEL",
      label: "Multiple Level",
      backendType: "MULTIPLE_LEVEL",
    },
  ];

  const getFlowTypeLabel = (flowType: string): string => {
    const option = flowTypeOptions.find((opt) => opt.backendType === flowType);
    return option?.label || flowType;
  };

  // Refetch campaign status after actions like execute
  const refreshCampaignStatus = async () => {
    try {
      const response = (await campaignService.getCampaignById(id!, true)) as {
        data?: Campaign;
        success?: boolean;
      };
      const campaignData = response.data || (response as Campaign);
      setCampaign(campaignData);
    } catch (error) {
      console.error("Failed to refresh campaign status:", error);
    }
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

        // Fetch campaign segments and offers FIRST (they're needed for flows matching)
        if (campaignData.id) {
          const campaignId = parseInt(campaignData.id);
          // Load segments first
          await fetchCampaignSegments(campaignId);
          // Then load flows to get offer IDs
          const flowsData = await fetchCampaignFlows(campaignId);
          // Then load offers based on flow offer IDs and budget in parallel
          await Promise.all([
            fetchOffersFromFlows(flowsData),
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
      // Use new endpoint to get segments directly from campaign flows
      const response = await campaignFlowService.getCampaignSegments(
        campaignId,
        true,
      );
      if (response && response.success && Array.isArray(response.data)) {
        // Convert segment info from API to CampaignSegmentDetail format
        const fetchedSegments: CampaignSegmentDetail[] = response.data.map(
          (segment) => ({
            id: segment.id,
            name: segment.name,
            code: segment.code,
            total_subscribers: 0, // Not provided by campaign flows endpoint
            created_at: "",
            updated_at: "",
          }),
        );
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
      // Use new endpoint to get offers directly from campaign flows
      const response = await campaignFlowService.getCampaignOffers(
        campaignId,
        true,
      );

      if (response && response.success && Array.isArray(response.data)) {
        // Fetch full offer details for each offer in the response
        const offerPromises = response.data.map(async (offerInfo) => {
          try {
            const offerResponse = await offerService.getOfferById(
              offerInfo.id,
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
            console.error(`Failed to fetch offer ${offerInfo.id}:`, error);
            return null;
          }
        });

        const fetchedOffers = await Promise.all(offerPromises);
        const validOffers = fetchedOffers.filter(
          (offer): offer is Offer => offer !== null,
        );
        setOffers(validOffers);
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

  const fetchCampaignFlows = async (
    campaignId: number,
  ): Promise<CampaignFlowConfig[]> => {
    try {
      setIsLoadingFlows(true);
      const response = await campaignFlowService.getCampaignFlows(campaignId);
      if (response && response.success && Array.isArray(response.data)) {
        // Convert API response to CampaignFlowConfig format
        const flowsData: CampaignFlowConfig[] = response.data.map((flow) => ({
          campaign_id: flow.campaign_id,
          segment_id:
            typeof flow.segment_id === "string"
              ? parseInt(flow.segment_id)
              : flow.segment_id,
          offer_id: flow.offer_id,
          offer_creative_id: flow.offer_creative_id || undefined,
          template_id: flow.template_id || undefined,
          flow_type: flow.flow_type,
          step_order: flow.step_order,
          wait_interval_hours: flow.wait_interval_hours,
          bucket_allocation: flow.bucket_allocation || undefined,
          condition_rule: flow.condition_rule || undefined,
          is_active: flow.is_active,
          created_by: flow.created_by,
        }));
        setFlows(flowsData);
        return flowsData;
      } else {
        setFlows([]);
        return [];
      }
    } catch (error) {
      console.error("Failed to fetch campaign flows:", error);
      setFlows([]);
      return [];
    } finally {
      setIsLoadingFlows(false);
    }
  };

  const fetchOffersFromFlows = async (flowsData: CampaignFlowConfig[]) => {
    try {
      setIsLoadingOffers(true);
      // Extract unique offer IDs from flows data
      const offerIds = new Set(flowsData.map((flow) => flow.offer_id));

      if (offerIds.size === 0) {
        setOffers([]);
        return;
      }

      // Fetch each offer by ID
      const offerPromises = Array.from(offerIds).map(async (offerId) => {
        try {
          const offerResponse = await offerService.getOfferById(offerId, true);
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
      const validOffers = fetchedOffers.filter(
        (offer): offer is Offer => offer !== null,
      );
      setOffers(validOffers);
    } catch (error) {
      console.error("Failed to fetch offers from flows:", error);
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
        updated_by: 1,
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

  const handleFlowEdit = async (flow: CampaignFlowConfig) => {
    setSelectedFlow(flow);
    setEditedFlow({
      flow_type: flow.flow_type,
      segment_id: flow.segment_id,
      offer_id: flow.offer_id,
      offer_creative_id: (flow as any).offer_creative_id,
      template_id: (flow as any).template_id,
      condition_rule: (flow as any).condition_rule,
      bucket_allocation: flow.bucket_allocation,
      step_order: (flow as any).step_order,
      wait_interval_hours: flow.wait_interval_hours,
      is_active: flow.is_active,
    });

    // Load active segments and offers if not already loaded
    if (activeSegments.length === 0 || activeOffers.length === 0) {
      try {
        setIsLoadingActiveData(true);
        const [segmentsResponse, offersResponse] = await Promise.all([
          segmentService.getActiveSegments(),
          offerService.getActiveOffers(),
        ]);

        if (segmentsResponse?.data) {
          const activeSegs = Array.isArray(segmentsResponse.data)
            ? segmentsResponse.data
            : [];
          setActiveSegments(activeSegs);
        }

        if (offersResponse?.data) {
          const activeOffersList = Array.isArray(offersResponse.data)
            ? offersResponse.data
            : [];
          setActiveOffers(activeOffersList);
        }
      } catch (error) {
        console.error("Error loading active segments/offers:", error);
        showToast("warning", "Failed to load active options");
      } finally {
        setIsLoadingActiveData(false);
      }
    }

    setShowFlowEditModal(true);
  };

  const handleFlowSave = async () => {
    if (!selectedFlow || !id) return;

    try {
      setIsFlowActionLoading(true);

      // Prepare update data - include all editable fields
      const updateData = {
        flow_type: editedFlow.flow_type,
        segment_id: editedFlow.segment_id,
        offer_id: editedFlow.offer_id,
        offer_creative_id: editedFlow.offer_creative_id,
        template_id: editedFlow.template_id,
        condition_rule: editedFlow.condition_rule,
        bucket_allocation: editedFlow.bucket_allocation,
        step_order: editedFlow.step_order,
        wait_interval_hours: editedFlow.wait_interval_hours,
        is_active: editedFlow.is_active,
      };

      // Get flow ID - must be numeric
      let flowId = (selectedFlow as any).id;
      if (!flowId) {
        showToast("error", "Flow ID not found - cannot update");
        return;
      }

      flowId = parseInt(String(flowId));
      if (isNaN(flowId)) {
        showToast("error", "Invalid flow ID - cannot update");
        return;
      }

      console.log("Updating flow with ID:", flowId, "Data:", updateData);
      await campaignFlowService.updateCampaignFlow(flowId, updateData);

      showToast("success", "Flow updated successfully");
      setShowFlowEditModal(false);

      // Reload flows
      const campaignId = parseInt(id);
      await fetchCampaignFlows(campaignId);
    } catch (error) {
      console.error("Error updating flow:", error);
      showToast("error", "Failed to update flow");
    } finally {
      setIsFlowActionLoading(false);
    }
  };

  const handleFlowDelete = (flow: CampaignFlowConfig) => {
    setSelectedFlow(flow);
    setShowFlowDeleteModal(true);
  };

  const handleFlowDeleteConfirm = async () => {
    if (!selectedFlow || !id) return;

    try {
      setIsFlowActionLoading(true);

      // Get flow ID - must be numeric
      let flowId = (selectedFlow as any).id;
      if (!flowId) {
        showToast("error", "Flow ID not found - cannot delete");
        return;
      }

      flowId = parseInt(String(flowId));
      if (isNaN(flowId)) {
        showToast("error", "Invalid flow ID - cannot delete");
        return;
      }

      console.log("Deleting flow with ID:", flowId);
      // Call deleteCampaignFlow
      await campaignFlowService.deleteCampaignFlow(flowId);

      showToast("success", "Flow deleted successfully");
      setShowFlowDeleteModal(false);

      // Reload flows
      const campaignId = parseInt(id);
      await fetchCampaignFlows(campaignId);
    } catch (error) {
      console.error("Error deleting flow:", error);
      showToast("error", "Failed to delete flow");
    } finally {
      setIsFlowActionLoading(false);
    }
  };

  const handleFlowView = (flow: CampaignFlowConfig) => {
    // Navigate to flow details page using flow ID
    // If flow has an id property, use it; otherwise use composite key
    const flowId = (flow as any).id || `${flow.segment_id}-${flow.offer_id}-${flow.step_order}`;
    navigate(`/dashboard/campaigns/${id}/flows/${flowId}`, {
      state: { flow }, // Pass flow data via state for immediate display
    });
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
            className={`w-16 h-16 mx-auto mb-4`}
            style={{ color: color.primary.action }}
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

          {(campaign as any).is_active === true && campaign.status !== "paused" && (
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

          {/* Execute Campaign Button */}
          {campaign.approval_status === "approved" && (campaign as any).is_active === true && (
            <PermissionGate permission="campaigns.execute">
              <button
                onClick={() => setShowExecuteModal(true)}
                className={`px-4 py-2 text-white ${tw.rounded} font-semibold flex items-center gap-2 text-sm`}
                style={{ backgroundColor: color.primary.action }}
              >
                <Play className="w-4 h-4" />
                Execute Campaign
              </button>
            </PermissionGate>
          )}

          {/* Edit Button - Always Visible */}
          <PermissionGate permission="campaigns.update">
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
          </PermissionGate>

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
                <PermissionGate permission="campaigns.delete">
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
                </PermissionGate>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Execution Metrics Cards - Always Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Messages Sent Card */}
          <div
            className={`bg-white ${tw.rounded} border p-6 shadow-sm`}
            style={{ borderColor: color.border.default }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${tw.textMuted} mb-1`}>
                  Messages Sent
                </p>
                <p className={`text-2xl font-bold ${tw.textPrimary}`}>
                  {executionMetrics.total_messages_sent.toLocaleString()}
                </p>
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

          {/* Messages Failed Card */}
          <div
            className={`bg-white ${tw.rounded} border p-6 shadow-sm`}
            style={{ borderColor: color.border.default }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${tw.textMuted} mb-1`}>
                  Failed
                </p>
                <p className={`text-2xl font-bold ${tw.textPrimary}`}>
                  {executionMetrics.total_messages_failed.toLocaleString()}
                </p>
              </div>
              <div
                className={`w-12 h-12 ${tw.rounded} flex items-center justify-center`}
                style={{ backgroundColor: `#FEE2E215` }}
              >
                <AlertCircle
                  className="w-6 h-6"
                  style={{ color: "#DC2626" }}
                />
              </div>
            </div>
          </div>

          {/* Success Rate Card */}
          <div
            className={`bg-white ${tw.rounded} border p-6 shadow-sm`}
            style={{ borderColor: color.border.default }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${tw.textMuted} mb-1`}>
                  Success Rate
                </p>
                <p className={`text-2xl font-bold ${tw.textPrimary}`}>
                  {executionMetrics.total_messages_sent + executionMetrics.total_messages_failed > 0
                    ? (
                        (executionMetrics.total_messages_sent /
                          (executionMetrics.total_messages_sent +
                            executionMetrics.total_messages_failed)) *
                        100
                      ).toFixed(1)
                    : "0.0"}
                  %
                </p>
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

          {/* Broadcasts Card */}
          <div
            className={`bg-white ${tw.rounded} border p-6 shadow-sm`}
            style={{ borderColor: color.border.default }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${tw.textMuted} mb-1`}>
                  Broadcasts
                </p>
                <p className={`text-2xl font-bold ${tw.textPrimary}`}>
                  {executionMetrics.broadcasts_completed} /
                  {executionMetrics.total_broadcasts}
                </p>
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

          {/* Execution Time Card */}
          <div
            className={`bg-white ${tw.rounded} border p-6 shadow-sm`}
            style={{ borderColor: color.border.default }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${tw.textMuted} mb-1`}>
                  Execution Time
                </p>
                <p className={`text-2xl font-bold ${tw.textPrimary}`}>
                  {(executionMetrics.execution_time_ms / 1000).toFixed(2)}s
                </p>
              </div>
              <div
                className={`w-12 h-12 ${tw.rounded} flex items-center justify-center`}
                style={{ backgroundColor: `${color.primary.accent}15` }}
              >
                <Clock
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
          className={`bg-white ${tw.rounded} border p-6 shadow-sm`}
          style={{ borderColor: color.border.default }}
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
            {campaign.approval_status === "rejected" &&
              campaign.rejection_reason && (
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
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium`}
                        style={{
                          backgroundColor: `${color.primary.accent}19`,
                          color: color.primary.accent,
                        }}
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
            className={`bg-white ${tw.rounded} border p-6 shadow-sm`}
          style={{ borderColor: color.border.default }}
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

      {/* Campaign Segments Table - COMMENTED OUT */}
      {/* <div className="mb-6">
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
            className={`overflow-x-auto ${tw.rounded} border`}
            style={{ borderColor: color.border.default }}
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
      </div> */}

      {/* Campaign Offers Table - Commented out: using Campaign Flows instead */}
      {/* <div className="mb-6">
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
            className={`overflow-x-auto ${tw.rounded} border`}
            style={{ borderColor: color.border.default }}
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
                      className={`px-6 py-4 text-base ${tw.textPrimary}`}
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
      </div> */}

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

      {/* Campaign Flows Table */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h3
              className={`text-lg font-semibold ${tw.textPrimary}`}
            >
              Campaign Flows
            </h3>
          </div>
        </div>
        {isLoadingFlows ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner variant="modern" size="md" color="primary" />
          </div>
        ) : flows.length === 0 ? (
          <div className="text-center py-8">
            <Zap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className={`text-sm ${tw.textSecondary}`}>
              No delivery flows configured for this campaign
            </p>
          </div>
        ) : (
          <div
            className={`overflow-x-auto ${tw.rounded} border`}
            style={{ borderColor: color.border.default }}
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
                    Step
                  </th>
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
                    Offer
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Flow Type
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Wait (hours)
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Allocation
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {flows.map((flow) => {
                  // Match on segment_id (not id which is the association ID)
                  // Name is in segment_name (not name)
                  const segment = segments.find(
                    (s) =>
                      parseInt((s as any).segment_id || s.id) ===
                      flow.segment_id,
                  );
                  const offer = offers.find(
                    (o) => parseInt(o.id) === flow.offer_id,
                  );
                  return (
                    <tr
                      key={`${flow.segment_id}-${flow.offer_id}-${flow.step_order}`}
                      className="transition-colors"
                    >
                      <td
                        className="px-6 py-4"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold"
                          style={{ color: "#000000" }}
                        >
                          {flow.step_order}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <button
                          onClick={() =>
                            navigate(
                              `/dashboard/segments/${(segment as any)?.segment_id || flow.segment_id}`,
                            )
                          }
                          className="text-sm font-medium hover:underline"
                          style={{ color: color.primary.accent }}
                        >
                          {(segment as any)?.segment_name ||
                            segment?.name ||
                            `Segment${flow.segment_id}`}
                        </button>
                      </td>
                      <td
                        className="px-6 py-4"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <button
                          onClick={() =>
                            navigate(
                              `/dashboard/offers/${offer?.id || flow.offer_id}`,
                            )
                          }
                          className="text-sm font-medium hover:underline"
                          style={{ color: color.primary.accent }}
                        >
                          {offer?.name || `Offer${flow.offer_id}`}
                        </button>
                      </td>
                      <td
                        className="px-6 py-4"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span
                          className={`text-sm font-medium ${tw.textPrimary}`}
                        >
                          {getFlowTypeLabel(flow.flow_type)}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div className={`text-sm ${tw.textPrimary}`}>
                          {flow.wait_interval_hours}h
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 hidden md:table-cell"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div className={`text-sm ${tw.textMuted}`}>
                          {flow.bucket_allocation || "—"}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleFlowView(flow)}
                            title="View flow details"
                            className="p-2 hover:bg-gray-50 rounded transition-colors"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleFlowEdit(flow)}
                            title="Edit flow"
                            className="p-2 hover:bg-gray-50 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleFlowDelete(flow)}
                            title="Delete flow"
                            className="p-2 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Flow Edit Modal */}
      {showFlowEditModal && selectedFlow && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowFlowEditModal(false)}
            />
            <div
              className={`relative bg-white ${tw.rounded} shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto`}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-semibold ${tw.textPrimary}`}>
                  Edit Campaign Flow
                </h3>
                <button
                  onClick={() => setShowFlowEditModal(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="space-y-6 mb-6">
                {/* Campaign ID and Campaign Type on same line */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Campaign ID - Read Only Input */}
                  <div>
                    <label
                      className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                    >
                      Campaign ID
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={campaign?.id || selectedFlow?.campaign_id || ""}
                      className={`w-full px-4 py-2 border ${tw.rounded} text-sm ${tw.textSecondary} bg-gray-50`}
                      style={{ borderColor: color.border.default }}
                    />
                  </div>

                  {/* Campaign Type */}
                  <div>
                    <label
                      className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                    >
                      Campaign Type
                    </label>
                    <HeadlessSelect
                      value={editedFlow.flow_type || ""}
                      onChange={(value) =>
                        setEditedFlow({
                          ...editedFlow,
                          flow_type: value,
                        })
                      }
                      options={[
                        { value: "", label: "Select Campaign Type" },
                        ...flowTypeOptions.map((opt) => ({
                          value: opt.value,
                          label: opt.label,
                        })),
                      ]}
                      disabled={isLoadingActiveData}
                    />
                  </div>
                </div>

                {/* Core Selection */}
                <div className="space-y-4">

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                      >
                        Segment
                      </label>
                      <HeadlessSelect
                        value={String(editedFlow.segment_id || "")}
                        onChange={(value) =>
                          setEditedFlow({
                            ...editedFlow,
                            segment_id: parseInt(value) || 0,
                          })
                        }
                        options={[
                          { value: "", label: "Select Segment" },
                          ...activeSegments.map((seg) => ({
                            value: String((seg as any).segment_id || seg.id),
                            label: (seg as any).segment_name || seg.name,
                          })),
                        ]}
                        disabled={isLoadingActiveData}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                      >
                        Offer
                      </label>
                      <HeadlessSelect
                        value={String(editedFlow.offer_id || "")}
                        onChange={(value) =>
                          setEditedFlow({
                            ...editedFlow,
                            offer_id: parseInt(value) || 0,
                          })
                        }
                        options={[
                          { value: "", label: "Select Offer" },
                          ...activeOffers.map((offer) => ({
                            value: String(offer.id),
                            label: offer.name,
                          })),
                        ]}
                        disabled={isLoadingActiveData}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                    >
                      Condition Rule (JSON)
                    </label>
                    <textarea
                      value={(editedFlow as any).condition_rule ? JSON.stringify((editedFlow as any).condition_rule, null, 2) : ""}
                      onChange={(e) => {
                        try {
                          const parsed = e.target.value ? JSON.parse(e.target.value) : undefined;
                          setEditedFlow({
                            ...editedFlow,
                            condition_rule: parsed,
                          } as any);
                        } catch {
                          // Invalid JSON, just update as string for now
                        }
                      }}
                      placeholder='{"condition": "value"}'
                      className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs`}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Execution Settings */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                      >
                        Step Order
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={editedFlow.step_order || 1}
                        onChange={(e) =>
                          setEditedFlow({
                            ...editedFlow,
                            step_order: parseInt(e.target.value) || 1,
                          })
                        }
                        className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                      >
                        Wait Interval (hours)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editedFlow.wait_interval_hours || 0}
                        onChange={(e) =>
                          setEditedFlow({
                            ...editedFlow,
                            wait_interval_hours: parseInt(e.target.value) || 0,
                          })
                        }
                        className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                    >
                      Bucket Allocation
                      {editedFlow.flow_type === "AB_TEST" && (
                        <span className="text-red-600 ml-1">*</span>
                      )}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 50-50"
                      value={editedFlow.bucket_allocation || ""}
                      onChange={(e) =>
                        setEditedFlow({
                          ...editedFlow,
                          bucket_allocation: e.target.value,
                        })
                      }
                      className={`w-full px-3 py-2 border ${
                        editedFlow.flow_type === "AB_TEST" &&
                        !editedFlow.bucket_allocation
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300"
                      } ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {editedFlow.flow_type === "AB_TEST" &&
                      !editedFlow.bucket_allocation && (
                        <p className="text-red-600 text-sm mt-1">
                          Bucket allocation is required for A/B Test campaigns
                        </p>
                      )}
                  </div>
                </div>

                {/* Advanced Fields */}
                <div className="space-y-4">
                  <div>
                    <label
                      className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                    >
                      Offer Creative
                    </label>
                    <HeadlessSelect
                      value={String((editedFlow as any).offer_creative_id || "")}
                      onChange={(value) =>
                        setEditedFlow({
                          ...editedFlow,
                          offer_creative_id: parseInt(value) || undefined,
                        } as any)
                      }
                      options={[
                        { value: "", label: "Select Creative" },
                        // Add creative options here when available from API
                      ]}
                    />
                  </div>

                  {/* <div>
                    <label
                      className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                    >
                      Template ID
                    </label>
                    <input
                      type="number"
                      value={(editedFlow as any).template_id || ""}
                      onChange={(e) =>
                        setEditedFlow({
                          ...editedFlow,
                          template_id: parseInt(e.target.value) || undefined,
                        } as any)
                      }
                      className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div> */}
                </div>

                {/* Status */}
                <div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="flowActive"
                      checked={editedFlow.is_active !== false}
                      onChange={(e) =>
                        setEditedFlow({
                          ...editedFlow,
                          is_active: e.target.checked,
                        })
                      }
                      className="w-4 h-4"
                    />
                    <label htmlFor="flowActive" className={`text-sm font-medium ${tw.textPrimary}`}>
                      Active Flow
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleFlowSave}
                  disabled={
                    isFlowActionLoading ||
                    isLoadingActiveData ||
                    (editedFlow.flow_type === "AB_TEST" &&
                      !editedFlow.bucket_allocation)
                  }
                  className={`px-6 ${tw.rounded} text-white font-medium transition-colors disabled:opacity-50`}
                  style={{
                    backgroundColor: button.action.background,
                    color: button.action.color,
                    padding: `${button.action.paddingY} ${button.action.paddingX}`,
                  }}
                  title={
                    editedFlow.flow_type === "AB_TEST" &&
                    !editedFlow.bucket_allocation
                      ? "Bucket allocation is required for A/B Test"
                      : ""
                  }
                >
                  {isFlowActionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flow Delete Modal */}
      <DeleteConfirmModal
        isOpen={showFlowDeleteModal && selectedFlow !== null}
        onClose={() => setShowFlowDeleteModal(false)}
        onConfirm={handleFlowDeleteConfirm}
        title="Delete Flow"
        description="Are you sure you want to delete this campaign flow? This action cannot be undone and the flow will be permanently removed."
        itemName={`Flow ${selectedFlow ? (selectedFlow as any).step_order || "" : ""}`}
        isLoading={isFlowActionLoading}
        confirmText="Delete Flow"
        cancelText="Cancel"
      />

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

      {/* Execute Campaign Modal */}
      {campaign && (
        <ExecuteCampaignModal
          isOpen={showExecuteModal}
          onClose={() => setShowExecuteModal(false)}
          campaignId={parseInt(id || "0")}
          campaignName={campaign.name}
          isActive={(campaign as any).is_active}
          approvalStatus={campaign.approval_status}
          onSuccess={(executionData) => {
            setShowExecuteModal(false);
            // Store execution metrics
            if (executionData) {
              setExecutionMetrics({
                total_messages_sent: executionData.total_messages_sent || 0,
                total_messages_failed: executionData.total_messages_failed || 0,
                total_broadcasts: executionData.total_broadcasts || 0,
                broadcasts_completed: executionData.broadcasts_completed || 0,
                execution_time_ms: executionData.execution_time_ms || 0,
              });
            }
            refreshCampaignStatus();
          }}
        />
      )}
    </div>
  );
}
