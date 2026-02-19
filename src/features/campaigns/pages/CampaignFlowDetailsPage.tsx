import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, Edit2, Trash2, X } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { color, tw, button } from "../../../shared/utils/utils";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { campaignFlowService } from "../services/campaignFlowService";
import { segmentService } from "../../segments/services/segmentService";
import { offerService } from "../../offers/services/offerService";
import { CampaignFlowConfig } from "../types/campaignFlow";
import { CampaignSegmentDetail } from "../types/campaign";
import { Offer } from "../../offers/types/offer";

export default function CampaignFlowDetailsPage() {
  const { flowId } = useParams<{
    flowId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [flow, setFlow] = useState<CampaignFlowConfig | null>(
    (location.state as any)?.flow || null
  );
  const [isLoading, setIsLoading] = useState(!flow);
  const [segment, setSegment] = useState<CampaignSegmentDetail | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editedFlow, setEditedFlow] = useState<Partial<CampaignFlowConfig>>({});
  const [activeSegments, setActiveSegments] = useState<CampaignSegmentDetail[]>([]);
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);
  const [isLoadingActiveData, setIsLoadingActiveData] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    const loadFlowDetails = async () => {
      if (!flowId) return;

      try {
        setIsLoading(true);

        let flowData = flow;

        if (!flowData) {
          const numericId = parseInt(flowId);
          if (!isNaN(numericId)) {
            const flowResponse = await campaignFlowService.getCampaignFlowById(
              numericId
            );
            if (flowResponse?.data) {
              flowData = flowResponse.data as any;
              setFlow(flowData);
            }
          }
        }

        if (flowData) {
          if ((flowData as any).segment_id) {
            const segmentResponse = await segmentService.getSegmentById(
              String((flowData as any).segment_id)
            );
            if (segmentResponse?.data) {
              setSegment(segmentResponse.data as CampaignSegmentDetail);
            }
          }

          if ((flowData as any).offer_id) {
            const offerResponse = await offerService.getOfferById(
              String((flowData as any).offer_id)
            );
            if (offerResponse?.data) {
              setOffer(offerResponse.data as Offer);
            }
          }
        }
      } catch (error) {
        console.error("Error loading flow details:", error);
        showToast("error", "Failed to load flow details");
      } finally {
        setIsLoading(false);
      }
    };

    loadFlowDetails();
  }, [flowId, flow, showToast]);

  const getFlowTypeLabel = (flowType: string): string => {
    const labels: Record<string, string> = {
      STANDARD: "Multiple Target Group",
      AB_TEST: "A/B Test",
      CHAMPION_CHALLENGER: "Champion-Challenger",
      ROUND_ROBIN: "Round Robin",
      MULTIPLE_LEVEL: "Multiple Level",
    };
    return labels[flowType] || flowType;
  };

  const handleEditClick = async () => {
    if (!flow) return;

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

    setIsEditModalOpen(true);
  };

  const handleFlowSave = async () => {
    if (!flow?.id) return;

    try {
      setIsActionLoading(true);

      // Prepare update data
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

      await campaignFlowService.updateCampaignFlow(flow.id, updateData);
      showToast("success", "Flow updated successfully");
      setIsEditModalOpen(false);

      // Reload flow details
      const flowResponse = await campaignFlowService.getCampaignFlowById(flow.id);
      if (flowResponse?.data) {
        setFlow(flowResponse.data as any);
      }
    } catch (error) {
      console.error("Error updating flow:", error);
      showToast("error", "Failed to update flow");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!flow?.id) return;

    try {
      setIsActionLoading(true);
      await campaignFlowService.deleteCampaignFlow(flow.id);
      showToast("success", "Flow deleted successfully");
      setIsDeleteModalOpen(false);
      navigate(-1);
    } catch (error) {
      console.error("Error deleting flow:", error);
      showToast("error", "Failed to delete flow");
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <BackButton onClick={() => navigate(-1)} />
        <div className="flex flex-col items-center justify-center py-16">
          <LoadingSpinner variant="modern" size="xl" color="primary" className="mb-4" />
          <p className={`${tw.textMuted} font-medium text-sm`}>
            Loading flow details...
          </p>
        </div>
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="space-y-6">
        <BackButton onClick={() => navigate(-1)} />
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-2`}>
            Flow Not Found
          </h3>
          <p className={`text-sm ${tw.textSecondary}`}>
            The campaign flow doesn't exist or has been deleted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton onClick={() => navigate(-1)} />
          <div>
            <h1 className={`text-3xl font-bold ${tw.textPrimary}`}>
              Campaign Flow {flow.id || flow.campaign_id}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleEditClick}
            className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium transition-colors`}
            style={{
              backgroundColor: color.primary.action,
              color: "white",
            }}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium transition-colors`}
            style={{
              backgroundColor: "#F3F4F6",
              color: "#DC2626",
              border: `1px solid #E5E7EB`,
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Basic Information - Horizontal Table */}
      <div
        className={`bg-white ${tw.rounded} border overflow-hidden`}
        style={{ borderColor: color.border.default }}
      >
        <div className="px-6 py-4 bg-gray-50">
          <h3 className={`text-sm font-semibold ${tw.textPrimary} uppercase tracking-wide`}>
            Basic Information
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody>
              <tr style={{ borderBottom: `1px solid ${color.border.default}` }}>
                <td className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap w-1/6">
                  Flow ID
                </td>
                <td className={`px-6 py-4 text-sm ${tw.textPrimary} font-semibold`}>
                  {flow.id || "—"}
                </td>
                <td className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap w-1/6">
                  Campaign
                </td>
                <td className={`px-6 py-4 text-sm ${tw.textPrimary} font-semibold`}>
                  {flow.campaign_id}
                </td>
                <td className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap w-1/6">
                  Flow Type
                </td>
                <td className={`px-6 py-4 text-sm ${tw.textPrimary} font-semibold`}>
                  {getFlowTypeLabel(flow.flow_type)}
                </td>
              </tr>
              <tr style={{ borderBottom: `1px solid ${color.border.default}` }}>
                <td className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap w-1/6">
                  Step Order
                </td>
                <td className={`px-6 py-4 text-sm ${tw.textPrimary} font-semibold`}>
                  {flow.step_order}
                </td>
                <td className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap w-1/6">
                  Wait Interval
                </td>
                <td className={`px-6 py-4 text-sm ${tw.textPrimary} font-semibold`}>
                  {flow.wait_interval_hours}h
                </td>
                <td className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap w-1/6">
                  Status
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium"
                    style={{
                      backgroundColor: flow.is_active ? color.status.success : "#D1D5DB",
                      color: "white",
                    }}
                  >
                    {flow.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Targeting Section */}
      <div
        className={`bg-white ${tw.rounded} border p-6`}
        style={{ borderColor: color.border.default }}
      >
        <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
          Targeting
        </h3>
        <div className="space-y-6">
          {/* Segment */}
          <div>
            <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide block mb-2`}>
              Segment
            </label>
            <p
              className={`text-base ${tw.textPrimary} font-semibold`}
              style={{ color: color.primary.accent }}
            >
              {segment?.name || `Segment ${flow.segment_id}`}
            </p>
          </div>

          {/* Condition Rule */}
          {(flow as any).condition_rule && (
            <div>
              <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide block mb-2`}>
                Condition Rule
              </label>
              <pre className={`text-sm ${tw.textSecondary} bg-gray-50 p-3 ${tw.rounded} overflow-auto max-h-40`}>
                {JSON.stringify((flow as any).condition_rule, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Offer Configuration Section */}
      <div
        className={`bg-white ${tw.rounded} border p-6`}
        style={{ borderColor: color.border.default }}
      >
        <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
          Offer Configuration
        </h3>
        <div className="space-y-6">
          {/* Offer */}
          <div>
            <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide block mb-2`}>
              Offer
            </label>
            <p
              className={`text-base ${tw.textPrimary} font-semibold`}
              style={{ color: color.primary.accent }}
            >
              {offer?.name || `Offer ${flow.offer_id}`}
            </p>
          </div>

          {/* Offer Creative ID */}
          {(flow as any).offer_creative_id && (
            <div>
              <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide block mb-2`}>
                Offer Creative ID
              </label>
              <p className={`text-base ${tw.textPrimary} font-semibold`}>
                {(flow as any).offer_creative_id}
              </p>
            </div>
          )}

          {/* Template ID */}
          {(flow as any).template_id && (
            <div>
              <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide block mb-2`}>
                Template ID
              </label>
              <p className={`text-base ${tw.textPrimary} font-semibold`}>
                {(flow as any).template_id}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Settings Section */}
      {flow.bucket_allocation && (
        <div
          className={`bg-white ${tw.rounded} border p-6`}
          style={{ borderColor: color.border.default }}
        >
          <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
            Advanced Settings
          </h3>
          <div>
            <label className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide block mb-2`}>
              Bucket Allocation
            </label>
            <p className={`text-base ${tw.textPrimary} font-semibold`}>
              {flow.bucket_allocation}
            </p>
          </div>
        </div>
      )}

      {/* Metadata Section */}
      <div
        className={`bg-white ${tw.rounded} border overflow-hidden`}
        style={{ borderColor: color.border.default }}
      >
        <div className="px-6 py-4 bg-gray-50">
          <h3 className={`text-sm font-semibold ${tw.textPrimary} uppercase tracking-wide`}>
            Metadata
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody>
              {(flow as any).created_at && (
                <tr style={{ borderBottom: `1px solid ${color.border.default}` }}>
                  <td className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap w-1/4">
                    Created At
                  </td>
                  <td className={`px-6 py-4 text-sm ${tw.textSecondary}`}>
                    {new Date((flow as any).created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap w-1/4">
                    Updated At
                  </td>
                  <td className={`px-6 py-4 text-sm ${tw.textSecondary}`}>
                    {(flow as any).updated_at
                      ? new Date((flow as any).updated_at).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              )}
              {(flow as any).created_by && (
                <tr>
                  <td className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap w-1/4">
                    Created By
                  </td>
                  <td className={`px-6 py-4 text-sm ${tw.textPrimary}`}>
                    {(flow as any).created_by}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap w-1/4">
                    Updated By
                  </td>
                  <td className={`px-6 py-4 text-sm ${tw.textPrimary}`}>
                    {(flow as any).updated_by || "—"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && flow && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setIsEditModalOpen(false)}
            />
            <div
              className={`relative bg-white ${tw.rounded} shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto`}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-semibold ${tw.textPrimary}`}>
                  Edit Campaign Flow
                </h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="space-y-6 mb-6">
                {/* Campaign ID and Flow Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                      Campaign ID
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={flow.campaign_id || ""}
                      className={`w-full px-4 py-2 border ${tw.rounded} text-sm ${tw.textSecondary} bg-gray-50`}
                      style={{ borderColor: color.border.default }}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                      Flow Type
                    </label>
                    <HeadlessSelect
                      value={editedFlow.flow_type || ""}
                      onChange={(value) =>
                        setEditedFlow({
                          ...editedFlow,
                          flow_type: value as any,
                        })
                      }
                      options={[
                        { value: "", label: "Select Flow Type" },
                        { value: "STANDARD", label: "Standard" },
                        { value: "AB_TEST", label: "A/B Test" },
                        { value: "CHAMPION_CHALLENGER", label: "Champion-Challenger" },
                        { value: "ROUND_ROBIN", label: "Round Robin" },
                        { value: "MULTIPLE_LEVEL", label: "Multiple Level" },
                      ]}
                      disabled={isLoadingActiveData}
                    />
                  </div>
                </div>

                {/* Segment and Offer */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
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
                      <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
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
                </div>

                {/* Execution Settings */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
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
                      <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
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
                    <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                      Bucket Allocation
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
                      className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
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
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isActionLoading}
                  className={`px-6 py-2 ${tw.rounded} text-sm font-medium transition-colors disabled:opacity-50`}
                  style={{
                    backgroundColor: "#F3F4F6",
                    color: "#374151",
                    border: `1px solid #E5E7EB`,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleFlowSave}
                  disabled={isActionLoading || isLoadingActiveData}
                  className={`px-6 ${tw.rounded} text-white font-medium transition-colors disabled:opacity-50`}
                  style={{
                    backgroundColor: button.action.background,
                    color: button.action.color,
                    padding: `${button.action.paddingY} ${button.action.paddingX}`,
                  }}
                >
                  {isActionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen && flow !== null}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Flow"
        description="Are you sure you want to delete this campaign flow? This action cannot be undone and the flow will be permanently removed."
        itemName={`Flow ${flow ? (flow as any).step_order || "" : ""}`}
        isLoading={isActionLoading}
        confirmText="Delete Flow"
        cancelText="Cancel"
      />
    </div>
  );
}
