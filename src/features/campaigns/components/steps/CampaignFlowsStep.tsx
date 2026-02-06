import { useState, useEffect } from "react";
import { Users, Gift, Plus, X } from "lucide-react";
import {
  CreateCampaignRequest,
  CampaignSegment,
  CampaignOffer,
} from "../../types/campaign";
import { CampaignFlowConfig, CampaignFlowType } from "../../types/campaignFlow";
import { color, tw, components } from "../../../../shared/utils/utils";
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
}

interface SegmentFlowState {
  offers: CampaignOffer[];
  waitHours: number;
  allocation?: string;
}

export default function CampaignFlowsStep({
  formData,
  selectedSegments,
  selectedOffers,
  setSelectedOffers,
  campaignFlows = [],
  setCampaignFlows,
  validationErrors = {},
}: CampaignFlowsStepProps) {
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [segmentFlows, setSegmentFlows] = useState<{
    [segmentId: string]: SegmentFlowState;
  }>({});

  // Get flow type based on campaign type (auto-derived, not user-selectable)
  const getFlowTypeFromCampaignType = (): CampaignFlowType => {
    switch (formData.campaign_type) {
      case "ab_test":
        return "AB_TEST";
      case "champion_challenger":
        return "CHAMPION_CHALLENGER";
      case "round_robin":
        return "ROUND_ROBIN";
      case "multiple_level":
        return "MULTIPLE_LEVEL";
      default:
        return "STANDARD";
    }
  };

  // Sync campaign flows from segment flows state
  useEffect(() => {
    if (!setCampaignFlows) return;

    const flows: CampaignFlowConfig[] = [];
    let stepOrder = 1;

    Object.entries(segmentFlows).forEach(([segmentId, data]) => {
      data.offers.forEach((offer) => {
        flows.push({
          campaign_id: 0,
          segment_id: parseInt(segmentId),
          offer_id: parseInt(offer.id),
          flow_type: getFlowTypeFromCampaignType(),
          step_order: stepOrder,
          wait_interval_hours: data.waitHours || 0,
          bucket_allocation: data.allocation,
        });
        stepOrder++;
      });
    });

    setCampaignFlows(flows);
  }, [segmentFlows, formData.campaign_type, setCampaignFlows]);

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
    setSelectedOffers((prevOffers) => {
      const offerMap = new Map(prevOffers.map((offer) => [offer.id, offer]));
      offers.forEach((offer) => {
        if (!offerMap.has(offer.id)) {
          offerMap.set(offer.id, offer);
        }
      });
      return Array.from(offerMap.values());
    });

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
      if (updated[segmentId]) {
        updated[segmentId].waitHours = hours;
      }
      return updated;
    });
  };

  const handleUpdateAllocation = (segmentId: string, allocation: string) => {
    setSegmentFlows((prev) => {
      const updated = { ...prev };
      if (updated[segmentId]) {
        updated[segmentId].allocation = allocation;
      }
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
          Add Delivery Flows
        </h2>
        <p className={`text-sm ${tw.textMuted}`}>
          Define how and when your offers will be delivered to each segment. Select
          offers for each segment to create delivery flows.
        </p>
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
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={flowState.waitHours}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === "" ? 0 : parseInt(value, 10);
                        if (!isNaN(numValue) && numValue >= 0) {
                          handleUpdateWaitHours(segment.id, numValue);
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
