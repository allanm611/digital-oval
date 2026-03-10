import { useState, useEffect, useRef } from "react";
import { Users, Gift, Plus, X } from "lucide-react";
import {
  CreateCampaignRequest,
  CampaignSegment,
  CampaignOffer,
} from "../../types/campaign";
import { CampaignFlowConfig, CampaignFlowType } from "../../types/campaignFlow";
import { color, tw, components } from "../../../../shared/utils/utils";
import HeadlessSelect from "../../../../shared/components/ui/HeadlessSelect";
import OfferSelectionModal from "./OfferSelectionModal";

interface CampaignFlowsStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  formData: CreateCampaignRequest;
  setFormData: (data: CreateCampaignRequest) => void;
  selectedSegments: CampaignSegment[];
  selectedOffers: CampaignOffer[];
  setSelectedOffers: (offers: CampaignOffer[]) => void;
  campaignFlows?: CampaignFlowConfig[];
  setCampaignFlows?: (flows: CampaignFlowConfig[]) => void;
  validationErrors?: { [key: string]: string };
  setValidationErrors?: (errors: { [key: string]: string }) => void;
  stepOrder?: number; // Flow execution step order from Step 2
}

interface SegmentFlowState {
  offers: CampaignOffer[];
  waitHours: number;
  allocation?: string;
  offerCreativeId?: number;
}

export default function CampaignFlowsStep({
  formData,
  selectedSegments,
  selectedOffers,
  setSelectedOffers,
  campaignFlows = [],
  setCampaignFlows,
  validationErrors = {},
  stepOrder,
}: CampaignFlowsStepProps) {
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [segmentFlows, setSegmentFlows] = useState<{
    [segmentId: string]: SegmentFlowState;
  }>({});
  const hasInitializedFromFlowsRef = useRef(false);

  // Initialize segmentFlows from existing campaignFlows when editing
  // Allows initialization once on mount OR once when campaignFlows is loaded (for edit mode)
  useEffect(() => {
    if (campaignFlows && campaignFlows.length > 0 && !hasInitializedFromFlowsRef.current) {
      hasInitializedFromFlowsRef.current = true;

      const flowsBySegment: { [segmentId: string]: SegmentFlowState } = {};

      campaignFlows.forEach((flow) => {
        const segmentIdStr = String(flow.segment_id);
        const offerIdStr = String(flow.offer_id);

        // Find the offer in selectedOffers
        const offer = selectedOffers.find((o) => o.id === offerIdStr);

        if (!flowsBySegment[segmentIdStr]) {
          flowsBySegment[segmentIdStr] = {
            offers: [],
            waitHours: 0,
            allocation: flow.bucket_allocation,
          };
        }

        // Add offer if it exists and not already in the list
        if (offer && !flowsBySegment[segmentIdStr].offers.some((o) => o.id === offerIdStr)) {
          flowsBySegment[segmentIdStr].offers.push(offer);
        }

        // Update wait hours (use the highest value if multiple flows for same segment)
        if (flow.wait_interval_hours > flowsBySegment[segmentIdStr].waitHours) {
          flowsBySegment[segmentIdStr].waitHours = flow.wait_interval_hours;
        }
      });

      setSegmentFlows(flowsBySegment);
    }
    // Initialize once on mount or when campaignFlows first arrives (edit mode)
    // The ref ensures we don't reinitialize on every campaignFlows change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignFlows]);

  // Sync campaign flows from segment flows state
  useEffect(() => {
    if (!setCampaignFlows) return;

    const getFlowType = (): CampaignFlowType => {
      switch (formData.campaign_type) {
        case "ab_test":
          return "AB_TEST";
        case "champion_challenger":
          return "CHAMPION_CHALLENGER";
        case "round_robin":
          return "ROUND_ROBIN";
        case "multiple_target_group":
          return "STANDARD";
        default:
          return "STANDARD";
      }
    };

    const flows: CampaignFlowConfig[] = [];
    const flowStepOrder = stepOrder ?? 1; // Use step_order from props, default to 1

    Object.entries(segmentFlows).forEach(([segmentId, data]) => {
      data.offers.forEach((offer) => {
        flows.push({
          campaign_id: 0,
          segment_id: parseInt(segmentId),
          offer_id: parseInt(offer.id),
          flow_type: getFlowType(),
          step_order: flowStepOrder, // Hard coded to value from Step 2
          wait_interval_hours: data.waitHours || 0,
          bucket_allocation: data.allocation,
          offer_creative_id: data.offerCreativeId, // Optional offer creative
        });
      });
    });

    setCampaignFlows(flows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segmentFlows, formData.campaign_type, stepOrder]);

  const handleSelectOffers = (segmentId: string) => {
    setEditingSegmentId(segmentId);
    setShowOfferModal(true);
  };

  const handleOfferSelect = (offers: CampaignOffer[]) => {
    if (!editingSegmentId) return;

    setSegmentFlows((prev) => {
      const updated = { ...prev };
      const currentState = updated[editingSegmentId] || {
        offers: [],
        waitHours: 0,
      };
      updated[editingSegmentId] = {
        ...currentState,
        offers,
      };
      return updated;
    });

    // Update selectedOffers to include all unique offers from all segments
    const offerMap = new Map(selectedOffers.map((offer) => [offer.id, offer]));
    offers.forEach((offer) => {
      if (!offerMap.has(offer.id)) {
        offerMap.set(offer.id, offer);
      }
    });
    setSelectedOffers(Array.from(offerMap.values()));

    setShowOfferModal(false);
    setEditingSegmentId(null);
  };

  const handleRemoveOffer = (segmentId: string, offerId: string) => {
    setSegmentFlows((prev) => {
      const updated = { ...prev };
      if (updated[segmentId]) {
        updated[segmentId].offers = updated[segmentId].offers.filter(
          (o) => o.id !== offerId
        );
      }
      return updated;
    });

    // Check if offer is used by any other segment
    const offerUsedElsewhere = Object.entries(segmentFlows).some(
      ([sid, data]) => sid !== segmentId && data.offers.some((o) => o.id === offerId)
    );

    // If not used elsewhere, remove from selectedOffers
    if (!offerUsedElsewhere) {
      setSelectedOffers(
        selectedOffers.filter((o) => o.id !== offerId)
      );
    }
  };

  const handleUpdateWaitHours = (segmentId: string, hours: number) => {
    setSegmentFlows((prev) => {
      const updated = { ...prev };
      if (!updated[segmentId]) {
        updated[segmentId] = { offers: [], waitHours: 0 };
      }
      updated[segmentId].waitHours = hours;
      return updated;
    });
  };

  const handleUpdateAllocation = (segmentId: string, allocation: string) => {
    setSegmentFlows((prev) => {
      const updated = { ...prev };
      if (!updated[segmentId]) {
        updated[segmentId] = { offers: [], waitHours: 0 };
      }
      updated[segmentId].allocation = allocation;
      return updated;
    });
  };

  const handleUpdateOfferCreative = (segmentId: string, creativeId?: number) => {
    setSegmentFlows((prev) => {
      const updated = { ...prev };
      if (!updated[segmentId]) {
        updated[segmentId] = { offers: [], waitHours: 0 };
      }
      updated[segmentId].offerCreativeId = creativeId;
      return updated;
    });
  };

  const getOffersForSegment = (segmentId: string): CampaignOffer[] => {
    return segmentFlows[segmentId]?.offers || [];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className={`text-xl font-semibold ${tw.textPrimary} mb-2`}>
          Map Segments to Offers
        </h2>
        <p className={`text-sm ${tw.textMuted}`}>
          Assign offers to segments. Select offers for each segment to create the mappings.
        </p>
      </div>

      {/* Offer Creative Selection - Optional */}
      <div className="w-full">
        <label className={`block text-sm font-medium ${tw.textSecondary} mb-2`}>
          Offer Creative (Optional)
        </label>
        <HeadlessSelect
          value={String(segmentFlows[selectedSegments[0]?.id]?.offerCreativeId || "")}
          onChange={(value) => {
            const numValue = value ? parseInt(value) : undefined;
            if (selectedSegments.length > 0) {
              handleUpdateOfferCreative(selectedSegments[0].id, numValue);
            }
          }}
          options={[
            { value: "", label: "Select offer creative..." },
            { value: "1", label: "Creative 1" },
            { value: "2", label: "Creative 2" },
            { value: "3", label: "Creative 3" },
          ]}
        />
      </div>

      {/* Error Display */}
      {validationErrors?.flows && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-700">{validationErrors.flows}</p>
        </div>
      )}

      {/* Segment Cards */}
      <div className="space-y-4">
        {selectedSegments.length === 0 ? (
          <div className={components.card.surface}>
            <p className={`${tw.caption} ${tw.textSecondary} text-center py-8`}>
              No segments selected. Please add segments in the Audience step first.
            </p>
          </div>
        ) : (
          selectedSegments.map((segment) => {
            const offers = getOffersForSegment(segment.id);
            const flowState = segmentFlows[segment.id] || {
              offers: [],
              waitHours: 0,
            };

            return (
              <div key={segment.id} className={components.card.surface}>
                {/* Segment Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Users
                      className="w-5 h-5"
                      style={{ color: color.primary.accent }}
                    />
                    <div>
                      <h4 className={`text-base font-medium ${tw.textPrimary}`}>
                        {segment.name}
                      </h4>
                      <p className={`text-sm ${tw.textSecondary}`}>
                        {segment.customer_count?.toLocaleString() || "0"} customers
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectOffers(segment.id)}
                    className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium`}
                    style={{
                      backgroundColor: color.primary.action,
                      color: "white",
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Select Offers
                  </button>
                </div>

                {/* Assigned Offers */}
                <div className="mb-4">
                  <div className={`text-sm font-medium ${tw.textSecondary} mb-2`}>
                    Assigned Offers:
                  </div>
                  {offers.length === 0 ? (
                    <div
                      className={`text-center py-4 border-2 border-dashed ${tw.rounded}`}
                      style={{ borderColor: color.border.default }}
                    >
                      <p className={`text-sm ${tw.textSecondary}`}>
                        No offers assigned yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {offers.map((offer) => (
                        <div
                          key={offer.id}
                          className={`flex items-center justify-between p-3 ${tw.rounded}`}
                          style={{ backgroundColor: color.surface.cards }}
                        >
                          <div className="flex items-center gap-3">
                            <Gift
                              className="w-5 h-5"
                              style={{ color: color.primary.accent }}
                            />
                            <div>
                              <div
                                className={`text-base font-medium ${tw.textPrimary}`}
                              >
                                {offer.name}
                              </div>
                              <div className={`text-sm ${tw.textSecondary}`}>
                                {offer.offer_type}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveOffer(segment.id, offer.id)}
                            className={`${tw.borderedButton} inline-flex items-center gap-1 p-2`}
                            style={{
                              borderColor: "#DC2626",
                              color: "#DC2626",
                            }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Flow Configuration */}
                <div
                  className="grid grid-cols-2 gap-4 pt-4"
                  style={{ borderTop: `1px solid ${color.border.default}` }}
                >
                  <div>
                    <label
                      className={`block text-sm font-medium ${tw.textSecondary} mb-2`}
                    >
                      Wait Interval (hours)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      min="0"
                      placeholder="0"
                      value={flowState.waitHours}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty string or numeric values
                        if (value === "") {
                          handleUpdateWaitHours(segment.id, 0);
                        } else {
                          const numValue = parseInt(value, 10);
                          if (!isNaN(numValue) && numValue >= 0) {
                            handleUpdateWaitHours(segment.id, numValue);
                          }
                        }
                      }}
                      onBlur={(e) => {
                        // Ensure a valid number on blur
                        if (e.target.value === "") {
                          handleUpdateWaitHours(segment.id, 0);
                        }
                      }}
                      className={`w-full px-3 py-2 border ${tw.rounded} text-sm`}
                      style={{ borderColor: color.border.default }}
                    />
                  </div>

                  {/* Show allocation for A/B test or champion-challenger */}
                  {(formData.campaign_type === "ab_test" ||
                    formData.campaign_type === "champion_challenger") && (
                    <div>
                      <label
                        className={`block text-sm font-medium ${tw.textSecondary} mb-2`}
                      >
                        Bucket Allocation
                      </label>
                      <input
                        type="text"
                        value={flowState.allocation || ""}
                        onChange={(e) =>
                          handleUpdateAllocation(segment.id, e.target.value)
                        }
                        placeholder={
                          formData.campaign_type === "ab_test" ? "50-50" : "70-30"
                        }
                        className={`w-full px-3 py-2 border ${tw.rounded} text-sm`}
                        style={{ borderColor: color.border.default }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Offer Selection Modal */}
      <OfferSelectionModal
        isOpen={showOfferModal}
        onClose={() => {
          setShowOfferModal(false);
          setEditingSegmentId(null);
        }}
        onSelect={handleOfferSelect}
        selectedOffers={
          editingSegmentId ? getOffersForSegment(editingSegmentId) : []
        }
      />
    </div>
  );
}
