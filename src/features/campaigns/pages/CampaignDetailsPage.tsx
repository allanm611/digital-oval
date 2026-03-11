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
  Send,
  TrendingUp,
  Eye,
  X,
  ChevronDown,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { color, tw, button } from "../../../shared/utils/utils";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import { getUserDisplayName } from "../../../shared/utils/userNameCache";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import BackButton from "../../../shared/components/ui/BackButton";
import { campaignService } from "../services/campaignService";
import { campaignFlowService } from "../services/campaignFlowService";
import { canShowCampaignButton, handleCampaignAction, type CampaignActionParams } from "../utils/campaignActions";
import { offerService } from "../../offers/services/offerService";
import { segmentService } from "../../segments/services/segmentService";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import CurrencyFormatter from "../../../shared/components/CurrencyFormatter";
import DateFormatter from "../../../shared/components/DateFormatter";
import { userService } from "../../users/services/userService";
import { PermissionGate } from "../../auth/components/PermissionGate";
import ExecuteCampaignModal from "../components/ExecuteCampaignModal";
import EditCampaignFlowModal from "../components/EditCampaignFlowModal";
import {
  Campaign,
  CampaignSegmentDetail,
  CampaignBudgetUtilisation,
} from "../types/campaign";
import { CampaignFlowConfig, CampaignFlowResponseData } from "../types/campaignFlow";
import { Offer } from "../../offers/types/offer";
import { SegmentType } from "../../segments/types/segment";

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
  const [showMetadata, setShowMetadata] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [categoryName, setCategoryName] = useState<string>("Uncategorized");
  const [segments, setSegments] = useState<CampaignSegmentDetail[]>([]);
  const [isLoadingSegments, setIsLoadingSegments] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const [flows, setFlows] = useState<CampaignFlowResponseData[]>([]);
  const [isLoadingFlows, setIsLoadingFlows] = useState(false);
  const [budgetUtilisation, setBudgetUtilisation] =
    useState<CampaignBudgetUtilisation | null>(null);
  const [isLoadingBudgetUtil, setIsLoadingBudgetUtil] = useState(false);
  const [createdByName, setCreatedByName] = useState<string>("");
  const [updatedByName, setUpdatedByName] = useState<string>("");
  const [showFlowEditModal, setShowFlowEditModal] = useState(false);
  const [showFlowDeleteModal, setShowFlowDeleteModal] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<CampaignFlowResponseData | null>(
    null,
  );
  const [editedFlow, setEditedFlow] = useState<Partial<CampaignFlowConfig>>({});
  const [rawConditionRuleInput, setRawConditionRuleInput] = useState<string>("");
  const [conditionRuleError, setConditionRuleError] = useState<string>("");
  const [isFlowActionLoading, setIsFlowActionLoading] = useState(false);
  const [activeSegments, setActiveSegments] = useState<SegmentType[]>([]);
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

        // Fetch created_by and updated_by user names
        if (campaignData.created_by || campaignData.updated_by) {
          try {
            const [createdName, updatedName] = await Promise.all([
              getUserDisplayName(campaignData.created_by),
              getUserDisplayName(campaignData.updated_by),
            ]);
            setCreatedByName(createdName);
            setUpdatedByName(updatedName);
          } catch (error) {
            console.error("Failed to fetch user names:", error);
            setCreatedByName(campaignData.created_by ? `User #${campaignData.created_by}` : "");
            setUpdatedByName(campaignData.updated_by ? `User #${campaignData.updated_by}` : "");
          }
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
        const fetchedSegments: CampaignSegmentDetail[] = response.data
          .map((segment) => {
            // API returns segment_id and segment_name
            if (!segment || !segment.segment_id || !segment.segment_name) {
              return null;
            }
            return {
              id: parseInt(segment.segment_id),
              name: segment.segment_name,
              code: segment.code || "",
              total_subscribers: 0,
              created_at: "",
              updated_at: "",
            };
          })
          .filter((s): s is CampaignSegmentDetail => s !== null);
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

  const fetchCampaignFlows = async (
    campaignId: number,
  ): Promise<CampaignFlowResponseData[]> => {
    try {
      setIsLoadingFlows(true);
      const response = await campaignFlowService.getCampaignFlows(campaignId);
      if (response && response.success && Array.isArray(response.data)) {
        // Convert API response to CampaignFlowResponseData format (includes id)
        const flowsData: CampaignFlowResponseData[] = response.data
          .map((flow) => {
            // Null checks for critical fields
            if (!flow || !flow.id || !flow.campaign_id || !flow.offer_id) {
              console.warn("Flow data invalid:", flow);
              return null;
            }
            return {
              id: flow.id,
              campaign_id: flow.campaign_id,
              segment_id:
                typeof flow.segment_id === "string" && flow.segment_id
                  ? parseInt(flow.segment_id)
                  : flow.segment_id || 0,
              offer_id: flow.offer_id,
              offer_creative_id: flow.offer_creative_id || undefined,
              template_id: flow.template_id || undefined,
              flow_type: flow.flow_type || "",
              step_order: flow.step_order || 0,
              wait_interval_hours: flow.wait_interval_hours || 0,
              bucket_allocation: flow.bucket_allocation || undefined,
              condition_rule: flow.condition_rule || undefined,
              is_active: flow.is_active ?? true,
              created_at: flow.created_at || "",
              updated_at: flow.updated_at || "",
              created_by: flow.created_by || null,
              updated_by: flow.updated_by || null,
            };
          })
          .filter((f): f is CampaignFlowResponseData => f !== null);
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

  const fetchOffersFromFlows = async (flowsData: CampaignFlowResponseData[]) => {
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

  const handleSubmitForApproval = async () => {
    if (!id) return;

    try {
      setIsApproveLoading(true);
      await campaignService.submitForApproval(parseInt(id));
      showToast("success", "Campaign submitted for approval");
      // Refresh campaign data
      if (campaign) {
        setCampaign({ ...campaign, status: "pending_approval" });
      }
    } catch (error) {
      console.error("Failed to submit campaign for approval:", error);
      showToast("error", "Failed to submit campaign for approval");
    } finally {
      setIsApproveLoading(false);
    }
  };

  const handleApproveCampaign = async () => {
    if (!id) return;

    try {
      setIsApproveLoading(true);
      await campaignService.approveCampaign(parseInt(id), {
        comments: "Approved from details page",
      });
      showToast("success", "Campaign approved successfully");
      // Refresh campaign data with both approval_status and status updates
      if (campaign) {
        setCampaign({ ...campaign, approval_status: "approved", status: "approved" });
      }
    } catch (error) {
      console.error("Failed to approve campaign:", error);

      // Extract specific error message from backend response
      let errorMessage = "Failed to approve campaign";
      if (error instanceof Error) {
        // Try to extract backend error message
        const match = error.message.match(/details: ({.*})/);
        if (match) {
          try {
            const errorData = JSON.parse(match[1]);
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch {
            errorMessage = error.message;
          }
        } else if (error.message.includes("Campaign must have")) {
          errorMessage = error.message;
        }
      }

      showToast("error", errorMessage);
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
        setCampaign({ ...campaign, is_active: true });
      }
    } catch (error) {
      console.error("Failed to activate campaign:", error);
      showToast("error", "Failed to activate campaign");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Consolidated campaign action handler for details page
  interface CampaignDetailActionParams {
    action: "pause" | "resume" | "delete";
    successMessage: string;
    onSuccess?: () => void;
  }

  const handleCampaignDetailAction = async (params: CampaignDetailActionParams) => {
    const { action, successMessage, onSuccess } = params;
    if (!id || !campaign) return;

    const campaignId = parseInt(id);
    const updateFields: Partial<Campaign> = {};

    // Map action to fields that need updating
    switch (action) {
      case "pause":
        updateFields.status = "paused";
        break;
      case "resume":
        updateFields.status = "active";
        break;
    }

    await handleCampaignAction(
      {
        campaignId,
        campaignName: campaign.name,
        action: action as "pause" | "resume" | "activate" | "submit",
        successMessage,
        errorMessage: `Failed to ${action} campaign`,
        updateFields,
      },
      {
        onSetLoading: (state) => setIsActionLoading(typeof state === "function" ? state(new Set([campaignId])).size > 0 : state.size > 0),
        onCloseMenu: () => {},
        onSetCampaign: (updatedCampaign) => setCampaign({ ...campaign, ...updatedCampaign }),
        onSuccess: (message) => {
          showToast("success", message);
          // Close dropdown immediately so user doesn't see stale button state
          if (onSuccess) onSuccess();

          // Refetch campaign data for pause/resume to sync button state (in background)
          if (action === "pause" || action === "resume") {
            campaignService
              .getCampaignById(id, true)
              .then((response) => {
                if (response && response.data) {
                  setCampaign(response.data);
                }
              })
              .catch((error) => {
                console.error("Failed to refetch campaign:", error);
              });
          }
        },
        onError: (title, message) => showToast("error", title, message),
      },
    );

    if (action === "delete") {
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

  const handleFlowEdit = async (flow: CampaignFlowResponseData) => {
    setSelectedFlow(flow);
    setEditedFlow({
      flow_type: flow.flow_type,
      segment_id: flow.segment_id,
      offer_id: flow.offer_id,
      offer_creative_id: flow.offer_creative_id,
      template_id: flow.template_id,
      condition_rule: flow.condition_rule,
      bucket_allocation: flow.bucket_allocation,
      step_order: flow.step_order,
      wait_interval_hours: flow.wait_interval_hours,
      is_active: flow.is_active,
    });
    // Initialize raw condition rule input from existing rule or empty
    setRawConditionRuleInput(
      flow.condition_rule ? JSON.stringify(flow.condition_rule, null, 2) : ""
    );

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

      // Check if there are any JSON errors before saving
      if (conditionRuleError) {
        setConditionRuleError("Please fix the JSON error before saving");
        return;
      }

      // Parse condition_rule from raw input to ensure it's an object
      let parsedConditionRule: any = undefined;
      if (rawConditionRuleInput.trim()) {
        try {
          parsedConditionRule = JSON.parse(rawConditionRuleInput);
        } catch {
          setConditionRuleError("Invalid JSON format");
          return;
        }
      }

      // Prepare update data - include all editable fields
      const updateData = {
        flow_type: editedFlow.flow_type,
        segment_id: editedFlow.segment_id,
        offer_id: editedFlow.offer_id,
        offer_creative_id: editedFlow.offer_creative_id,
        template_id: editedFlow.template_id,
        condition_rule: parsedConditionRule,
        bucket_allocation: editedFlow.bucket_allocation,
        step_order: editedFlow.step_order,
        wait_interval_hours: editedFlow.wait_interval_hours,
        is_active: editedFlow.is_active,
      };

      // Get flow ID - must be numeric
      let flowId = selectedFlow?.id;
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
      setRawConditionRuleInput(""); // Reset raw input
      setSelectedFlow(null);

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
      let flowId = selectedFlow?.id;
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

  const handleFlowView = (flow: CampaignFlowResponseData) => {
    // Navigate to flow details page using flow ID
    const flowId = flow.id;
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
        <div className="flex flex-wrap items-center gap-2">
          {/* Step 1: Request Approval (draft status) */}
          {campaign.status === "draft" && (
            <button
              onClick={handleSubmitForApproval}
              disabled={isApproveLoading}
              className={`flex items-center gap-2 ${tw.button} text-sm disabled:opacity-50`}
              style={{ backgroundColor: color.primary.action }}
            >
              {isApproveLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isApproveLoading ? "Requesting..." : "Request Approval"}
            </button>
          )}

          {/* Step 2: Approve Campaign (pending_approval status) */}
          {campaign.status === "pending_approval" && (
            <button
              onClick={handleApproveCampaign}
              disabled={isApproveLoading}
              className={`flex items-center gap-2 ${tw.button} text-sm disabled:opacity-50`}
              style={{ backgroundColor: color.primary.action }}
            >
              {isApproveLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {isApproveLoading ? "Approving..." : "Approve Campaign"}
            </button>
          )}

          {/* Step 3: Activate Campaign (approved + is_active=false) */}
          {campaign.approval_status === "approved" && campaign?.is_active === false && (
            <button
              onClick={handleActivateCampaign}
              disabled={isActionLoading}
              className={`flex items-center gap-2 ${tw.button} text-sm disabled:opacity-50`}
              style={{ backgroundColor: color.primary.action }}
            >
              {isActionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Zap className="w-4 h-4" />
              )}
              {isActionLoading ? "Activating..." : "Activate Campaign"}
            </button>
          )}

          {/* Step 4: Execute Campaign (approved + is_active=true) */}
          {campaign.approval_status === "approved" && campaign?.is_active === true && (
            <PermissionGate permission="campaigns.execute">
              <button
                onClick={() => setShowExecuteModal(true)}
                className={`flex items-center gap-2 ${tw.button} text-sm`}
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
                {/* Pause Campaign - Only if approved and not paused */}
                {canShowCampaignButton(campaign, "pause") && (
                    <button
                      onClick={() => {
                        handleCampaignDetailAction({
                          action: "pause",
                          successMessage: "Campaign paused successfully!",
                          onSuccess: () => setShowMoreMenu(false),
                        });
                      }}
                      disabled={isActionLoading}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 disabled:opacity-50"
                    >
                      {isActionLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-3"></div>
                      ) : (
                        <Pause className="w-4 h-4 mr-3" />
                      )}
                      {isActionLoading ? "Pausing..." : "Pause Campaign"}
                    </button>
                  )}

                {/* Resume Campaign - Only if approved and paused */}
                {canShowCampaignButton(campaign, "resume") && (
                    <button
                      onClick={() => {
                        handleCampaignDetailAction({
                          action: "resume",
                          successMessage: "Campaign resumed successfully!",
                          onSuccess: () => setShowMoreMenu(false),
                        });
                      }}
                      disabled={isActionLoading}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 disabled:opacity-50"
                    >
                      {isActionLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-3"></div>
                      ) : (
                        <Play className="w-4 h-4 mr-3" />
                      )}
                      {isActionLoading ? "Resuming..." : "Resume Campaign"}
                    </button>
                  )}

                {/* Reject - Only if pending */}
                {canShowCampaignButton(campaign, "reject") && (
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
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <div className="flex items-center gap-2">
              <Send
                className="h-5 w-5"
                style={{ color: color.primary.accent }}
              />
              <p className="text-sm font-medium text-gray-600">Messages Sent</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {(executionMetrics?.total_messages_sent || 0).toLocaleString()}
            </p>
          </div>

          {/* Messages Failed Card */}
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle
                className="h-5 w-5"
                style={{ color: "#DC2626" }}
              />
              <p className="text-sm font-medium text-gray-600">Failed</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {(executionMetrics?.total_messages_failed || 0).toLocaleString()}
            </p>
          </div>

          {/* Success Rate Card */}
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle
                className="h-5 w-5"
                style={{ color: color.primary.accent }}
              />
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {(executionMetrics?.total_messages_sent || 0) + (executionMetrics?.total_messages_failed || 0) > 0
                ? (
                    ((executionMetrics?.total_messages_sent || 0) /
                      ((executionMetrics?.total_messages_sent || 0) +
                        (executionMetrics?.total_messages_failed || 0))) *
                    100
                  ).toFixed(1)
                : "0.0"}
              %
            </p>
          </div>

          {/* Broadcasts Card */}
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp
                className="h-5 w-5"
                style={{ color: color.primary.accent }}
              />
              <p className="text-sm font-medium text-gray-600">Broadcasts</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {executionMetrics?.broadcasts_completed || 0} /
              {executionMetrics?.total_broadcasts || 0}
            </p>
          </div>

          {/* Execution Time Card */}
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <div className="flex items-center gap-2">
              <Clock
                className="h-5 w-5"
                style={{ color: color.primary.accent }}
              />
              <p className="text-sm font-medium text-gray-600">Execution Time</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {((executionMetrics?.execution_time_ms || 0) / 1000).toFixed(2)}s
            </p>
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
              <h2 className={`${tw.tableFirstColumn} ${tw.textPrimary}`}>
                {campaign.name || "—"}
              </h2>
              <div className="flex items-center flex-wrap gap-2">
                {campaign.status && (!campaign.approval_status ||
                  campaign.approval_status?.toLowerCase() !==
                    campaign.status?.toLowerCase()) && (
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                      campaign.status,
                    )}`}
                  >
                    {campaign.status?.replace(/_/g, " ") || "Unknown"}
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
                    {campaign.approval_status?.replace(/_/g, " ") || "Unknown"}
                  </span>
                )}
              </div>
            </div>
            <p className={`${tw.textSecondary} mb-2 text-base leading-relaxed`}>
              {campaign.description || "—"}
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

          {/* Campaign Details - Organized by Priority - Each in Own Card */}
          <div className="space-y-6">
            {/* Core Details Card */}
            <div className={`bg-white ${tw.rounded} border p-6 shadow-sm`} style={{ borderColor: color.border.default }}>
              <h4 className={`text-sm font-semibold ${tw.textMuted} uppercase tracking-wide mb-4`}>
                Core Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`text-sm font-medium ${tw.textMuted} block mb-2`}>
                    Campaign ID
                  </label>
                  <p className={`text-base ${tw.textPrimary} font-mono`}>
                    {campaign.id}
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${tw.textMuted} block mb-2`}>
                    Objective
                  </label>
                  <p className={`text-base ${tw.textPrimary}`}>
                    {formatObjective(campaign.objective)}
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${tw.textMuted} block mb-2`}>
                    Category
                  </label>
                  <p className={`text-base ${tw.textPrimary}`}>{categoryName}</p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${tw.textMuted} block mb-2`}>
                    Campaign Manager
                  </label>
                  <p className={`text-base ${tw.textPrimary}`}>
                    {campaign.campaign_manager_id || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline Card */}
            <div className={`bg-white ${tw.rounded} border p-6 shadow-sm`} style={{ borderColor: color.border.default }}>
              <h4 className={`text-sm font-semibold ${tw.textMuted} uppercase tracking-wide mb-4`}>
                Schedule & Timeline
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`text-sm font-medium ${tw.textMuted} block mb-2`}>
                    Start Date
                  </label>
                  <p className={`text-base ${tw.textPrimary}`}>
                    {campaign.start_date ? (
                      <DateFormatter
                        date={campaign.start_date}
                        useLocale
                        year="numeric"
                        month="long"
                        day="numeric"
                      />
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${tw.textMuted} block mb-2`}>
                    End Date
                  </label>
                  <p className={`text-base ${tw.textPrimary}`}>
                    {campaign.end_date ? (
                      <DateFormatter
                        date={campaign.end_date}
                        useLocale
                        year="numeric"
                        month="long"
                        day="numeric"
                      />
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${tw.textMuted} block mb-2`}>
                    Timezone
                  </label>
                  <p className={`text-base ${tw.textPrimary}`}>
                    {campaign.timezone || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Targets & Performance Card */}
            <div className={`bg-white ${tw.rounded} border p-6 shadow-sm`} style={{ borderColor: color.border.default }}>
              <h4 className={`text-sm font-semibold ${tw.textMuted} uppercase tracking-wide mb-4`}>
                Targets & Performance
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`text-sm font-medium ${tw.textMuted} block mb-2`}>
                    Max Participants
                  </label>
                  <p className={`text-base ${tw.textPrimary}`}>
                    {campaign.max_participants ?? "—"}
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${tw.textMuted} block mb-2`}>
                    Current Participants
                  </label>
                  <p className={`text-base ${tw.textPrimary}`}>
                    {campaign.current_participants ?? "—"}
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${tw.textMuted} block mb-2`}>
                    Target Reach
                  </label>
                  <p className={`text-base ${tw.textPrimary}`}>
                    {campaign.target_reach ?? "—"}
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${tw.textMuted} block mb-2`}>
                    Target Conversion Rate
                  </label>
                  <p className={`text-base ${tw.textPrimary}`}>
                    {campaign.target_conversion_rate ? `${campaign.target_conversion_rate}%` : "—"}
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${tw.textMuted} block mb-2`}>
                    Target Revenue
                  </label>
                  <p className={`text-base ${tw.textPrimary}`}>
                    {campaign.target_revenue ? (
                      <CurrencyFormatter amount={parseFloat(String(campaign.target_revenue))} />
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Audit Trail Card - Collapsible */}
            <div className={`bg-white ${tw.rounded} border p-6 shadow-sm`} style={{ borderColor: color.border.default }}>
              <button
                onClick={() => setShowAuditTrail(!showAuditTrail)}
                className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
              >
                <h4 className={`text-sm font-semibold ${tw.textMuted} uppercase tracking-wide`}>
                  Audit Trail
                </h4>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${
                    showAuditTrail ? "transform rotate-180" : ""
                  }`}
                  style={{ color: color.textSecondary }}
                />
              </button>

              {showAuditTrail && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`text-sm font-medium ${tw.textMuted} block mb-2`}>
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
                      <label className={`text-sm font-medium ${tw.textMuted} block mb-2`}>
                        Created By
                      </label>
                      <p className={`text-base ${tw.textPrimary}`}>
                        {createdByName || "—"}
                      </p>
                    </div>
                    <div>
                      <label className={`text-sm font-medium ${tw.textMuted} block mb-2`}>
                        Updated Date
                      </label>
                      <p className={`text-base ${tw.textPrimary} flex items-center`}>
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <DateFormatter
                          date={campaign.updated_at}
                          useLocale
                          year="numeric"
                          month="long"
                          day="numeric"
                        />
                      </p>
                    </div>
                    <div>
                      <label className={`text-sm font-medium ${tw.textMuted} block mb-2`}>
                        Updated By
                      </label>
                      <p className={`text-base ${tw.textPrimary}`}>
                        {updatedByName || "—"}
                      </p>
                    </div>
                    <div>
                      <label className={`text-sm font-medium ${tw.textMuted} block mb-2`}>
                        Approved Date
                      </label>
                      <p className={`text-base ${tw.textPrimary}`}>
                        {campaign.approved_at ? (
                          <DateFormatter
                            date={campaign.approved_at}
                            useLocale
                            year="numeric"
                            month="long"
                            day="numeric"
                          />
                        ) : (
                          "—"
                        )}
                      </p>
                    </div>
                    <div>
                      <label className={`text-sm font-medium ${tw.textMuted} block mb-2`}>
                        Approved By
                      </label>
                      <p className={`text-base ${tw.textPrimary}`}>
                        {campaign.approved_by || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tags Card */}
            {campaign.tags && campaign.tags.length > 0 && (
              <div className={`bg-white ${tw.rounded} border p-6 shadow-sm`} style={{ borderColor: color.border.default }}>
                <h4 className={`text-sm font-semibold ${tw.textMuted} uppercase tracking-wide mb-4`}>
                  Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {campaign.tags.map((tag, index) => (
                    <span
                      key={`${tag}-${index}`}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium`}
                      style={{
                        backgroundColor: color.primary.accent,
                        color: "white",
                      }}
                    >
                      {tag.replace("catalog:", "")}
                    </span>
                  ))}
                </div>
              </div>
            )}
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

      {/* System Metadata Section - Collapsible */}
      <div
        className={`bg-white ${tw.rounded} border p-6 shadow-sm`}
        style={{ borderColor: color.border.default }}
      >
        <button
          onClick={() => setShowMetadata(!showMetadata)}
          className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
        >
          <h3 className={`text-lg font-semibold ${tw.textPrimary}`}>
            System Metadata
          </h3>
          <ChevronDown
            className={`w-5 h-5 transition-transform ${
              showMetadata ? "transform rotate-180" : ""
            }`}
            style={{ color: color.textSecondary }}
          />
        </button>

        {showMetadata && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  className={`text-sm font-medium ${tw.textMuted} block mb-2`}
                >
                  Campaign UUID
                </label>
                <p className={`text-base ${tw.textPrimary} font-mono text-xs break-all`}>
                  {campaign.campaign_uuid || "—"}
                </p>
              </div>
              <div>
                <label
                  className={`text-sm font-medium ${tw.textMuted} block mb-2`}
                >
                  Campaign Code
                </label>
                <p className={`text-base ${tw.textPrimary} font-mono`}>
                  {campaign.code || "—"}
                </p>
              </div>
              <div>
                <label
                  className={`text-sm font-medium ${tw.textMuted} block mb-2`}
                >
                  Type
                </label>
                <p className={`text-base ${tw.textPrimary}`}>
                  {campaign.type || "—"}
                </p>
              </div>
              <div>
                <label
                  className={`text-sm font-medium ${tw.textMuted} block mb-2`}
                >
                  Program ID
                </label>
                <p className={`text-base ${tw.textPrimary}`}>
                  {campaign.program_id || "—"}
                </p>
              </div>
              <div>
                <label
                  className={`text-sm font-medium ${tw.textMuted} block mb-2`}
                >
                  Control Group Enabled
                </label>
                <p className={`text-base ${tw.textPrimary}`}>
                  {campaign.control_group_enabled ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <label
                  className={`text-sm font-medium ${tw.textMuted} block mb-2`}
                >
                  Control Group Percentage
                </label>
                <p className={`text-base ${tw.textPrimary}`}>
                  {campaign.control_group_percentage ? `${campaign.control_group_percentage}%` : "—"}
                </p>
              </div>
              <div>
                <label
                  className={`text-sm font-medium ${tw.textMuted} block mb-2`}
                >
                  Is Active
                </label>
                <p className={`text-base ${tw.textPrimary}`}>
                  {campaign.is_active ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <label
                  className={`text-sm font-medium ${tw.textMuted} block mb-2`}
                >
                  Attribution Model ID
                </label>
                <p className={`text-base ${tw.textPrimary}`}>
                  {campaign.attribution_model_id || "—"}
                </p>
              </div>
              <div>
                <label
                  className={`text-sm font-medium ${tw.textMuted} block mb-2`}
                >
                  Tenant ID
                </label>
                <p className={`text-base ${tw.textPrimary}`}>
                  {campaign.tenant_id || "—"}
                </p>
              </div>
              <div>
                <label
                  className={`text-sm font-medium ${tw.textMuted} block mb-2`}
                >
                  Client ID
                </label>
                <p className={`text-base ${tw.textPrimary}`}>
                  {campaign.client_id || "—"}
                </p>
              </div>
              <div>
                <label
                  className={`text-sm font-medium ${tw.textMuted} block mb-2`}
                >
                  Deleted At
                </label>
                <p className={`text-base ${tw.textPrimary}`}>
                  {campaign.deleted_at ? (
                    <DateFormatter
                      date={campaign.deleted_at}
                      useLocale
                      year="numeric"
                      month="long"
                      day="numeric"
                    />
                  ) : (
                    "—"
                  )}
                </p>
              </div>
              <div>
                <label
                  className={`text-sm font-medium ${tw.textMuted} block mb-2`}
                >
                  Deleted By
                </label>
                <p className={`text-base ${tw.textPrimary}`}>
                  {campaign.deleted_by || "—"}
                </p>
              </div>
            </div>
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

      {/* Segment-Offer Mappings Table */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h3
              className={`text-lg font-semibold ${tw.textPrimary}`}
            >
              Segment-Offer Mappings
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
              No mappings configured for this campaign
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
                    (s) => s.segment_id === flow.segment_id
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
                              `/dashboard/segments/${segment?.segment_id || flow.segment_id}`,
                            )
                          }
                          className="text-sm font-medium hover:underline"
                          style={{ color: color.primary.accent }}
                        >
                          {segment?.segment_name || `Segment${flow.segment_id}`}
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
      {/* Flow Edit Modal - Using Reusable Component */}
      <EditCampaignFlowModal
        isOpen={showFlowEditModal}
        onClose={() => {
          setShowFlowEditModal(false);
          setRawConditionRuleInput("");
          setConditionRuleError("");
        }}
        selectedFlow={selectedFlow}
        editedFlow={editedFlow}
        setEditedFlow={setEditedFlow}
        rawConditionRuleInput={rawConditionRuleInput}
        setRawConditionRuleInput={setRawConditionRuleInput}
        conditionRuleError={conditionRuleError}
        setConditionRuleError={setConditionRuleError}
        activeSegments={activeSegments}
        activeOffers={offers}
        isLoadingActiveData={isLoadingActiveData}
        isActionLoading={isFlowActionLoading}
        onSave={handleFlowSave}
        campaignId={campaign?.id}
      />

      {/* OLD CODE - TO BE REMOVED */}
      {false && selectedFlow && (
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
                            value: String(seg.id),
                            label: seg.name,
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
                      value={rawConditionRuleInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        setRawConditionRuleInput(value);
                        setConditionRuleError(""); // Clear error on change

                        if (value.trim()) {
                          try {
                            JSON.parse(value);
                            setEditedFlow({
                              ...editedFlow,
                              condition_rule: JSON.parse(value),
                            });
                          } catch (err) {
                            setConditionRuleError("Invalid JSON format");
                          }
                        } else {
                          setEditedFlow({
                            ...editedFlow,
                            condition_rule: undefined,
                          });
                        }
                      }}
                      placeholder='{"condition": "value"}'
                      className={`w-full px-3 py-2 border ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs ${
                        conditionRuleError ? "border-red-500" : "border-gray-300"
                      }`}
                      rows={3}
                    />
                    {conditionRuleError && (
                      <p className="text-xs text-red-600 mt-1">{conditionRuleError}</p>
                    )}
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
                      value={String(editedFlow.offer_creative_id || "")}
                      onChange={(value) =>
                        setEditedFlow({
                          ...editedFlow,
                          offer_creative_id: parseInt(value) || undefined,
                        })
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
                      value={editedFlow.template_id || ""}
                      onChange={(e) =>
                        setEditedFlow({
                          ...editedFlow,
                          template_id: parseInt(e.target.value) || undefined,
                        })
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
      {/* END OLD CODE */}

      {/* Flow Delete Modal */}
      <DeleteConfirmModal
        isOpen={showFlowDeleteModal && selectedFlow !== null}
        onClose={() => setShowFlowDeleteModal(false)}
        onConfirm={handleFlowDeleteConfirm}
        title="Delete Flow"
        description="Are you sure you want to delete this campaign flow? This action cannot be undone and the flow will be permanently removed."
        itemName={`Flow ${selectedFlow?.step_order || ""}`}
        isLoading={isFlowActionLoading}
        confirmText="Delete Flow"
        cancelText="Cancel"
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() =>
          handleCampaignDetailAction({
            action: "delete",
            successMessage: "Campaign deleted successfully!",
            onSuccess: () => navigate("/dashboard/campaigns"),
          })
        }
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
          isActive={campaign?.is_active}
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
