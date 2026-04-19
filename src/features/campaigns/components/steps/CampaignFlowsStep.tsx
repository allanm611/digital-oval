import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Eye, Edit } from "lucide-react";
import {
  CreateCampaignRequest,
  CampaignSegment,
  CampaignOffer,
} from "../../types/campaign";
import { CampaignFlowConfig, CampaignFlowType } from "../../types/campaignFlow";
import { color, tw, components } from "../../../../shared/utils/utils";
import HeadlessSelect from "../../../../shared/components/ui/HeadlessSelect";
import OfferSelectionModal from "./OfferSelectionModal";
import OfferPreviewModal from "./OfferPreviewModal";

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
  offerWaitHours: { [offerId: string]: number }; // Per-offer wait hours
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
  stepOrder,
}: CampaignFlowsStepProps) {
  const navigate = useNavigate();
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewOffer, setPreviewOffer] = useState<CampaignOffer | null>(null);
  const [segmentFlows, setSegmentFlows] = useState<{
    [segmentId: string]: SegmentFlowState;
  }>({});
  const hasInitializedFromFlowsRef = useRef(false);

  // Initialize segmentFlows from existing campaignFlows when editing
  // Allows initialization once on mount OR once when campaignFlows is loaded (for edit mode)
  useEffect(() => {
    if (
      campaignFlows &&
      campaignFlows.length > 0 &&
      !hasInitializedFromFlowsRef.current
    ) {
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
            offerWaitHours: {},
            allocation: flow.bucket_allocation,
          };
        }

        // Add offer if it exists and not already in the list
        if (
          offer &&
          !flowsBySegment[segmentIdStr].offers.some((o) => o.id === offerIdStr)
        ) {
          flowsBySegment[segmentIdStr].offers.push(offer);
        }

        // Store wait hours per offer
        flowsBySegment[segmentIdStr].offerWaitHours[offerIdStr] =
          flow.wait_interval_hours;
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
          wait_interval_hours: data.offerWaitHours[offer.id] || 0,
          bucket_allocation: data.allocation,
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
        offerWaitHours: {},
      };

      // Preserve existing wait hours for offers that are still selected
      const newOfferWaitHours: { [offerId: string]: number } = {};
      offers.forEach((offer) => {
        newOfferWaitHours[offer.id] =
          currentState.offerWaitHours[offer.id] || 0;
      });

      updated[editingSegmentId] = {
        ...currentState,
        offers,
        offerWaitHours: newOfferWaitHours,
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
          (o) => o.id !== offerId,
        );
      }
      return updated;
    });

    // Check if offer is used by any other segment
    const offerUsedElsewhere = Object.entries(segmentFlows).some(
      ([sid, data]) =>
        sid !== segmentId && data.offers.some((o) => o.id === offerId),
    );

    // If not used elsewhere, remove from selectedOffers
    if (!offerUsedElsewhere) {
      setSelectedOffers(selectedOffers.filter((o) => o.id !== offerId));
    }
  };

  const handleUpdateWaitHours = (
    segmentId: string,
    offerId: string,
    hours: number
  ) => {
    setSegmentFlows((prev) => {
      const updated = { ...prev };
      if (!updated[segmentId]) {
        updated[segmentId] = { offers: [], offerWaitHours: {} };
      }
      updated[segmentId].offerWaitHours[offerId] = hours;
      return updated;
    });
  };

  const handleUpdateAllocation = (segmentId: string, allocation: string) => {
    setSegmentFlows((prev) => {
      const updated = { ...prev };
      if (!updated[segmentId]) {
        updated[segmentId] = { offers: [], offerWaitHours: {} };
      }
      updated[segmentId].allocation = allocation;
      return updated;
    });
  };

  const getOffersForSegment = (segmentId: string): CampaignOffer[] => {
    return segmentFlows[segmentId]?.offers || [];
  };

  const handlePreviewOffer = (offer: CampaignOffer) => {
    setPreviewOffer(offer);
    setShowPreviewModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-1 `}>
          Map Segments to Offers
        </h2>
        <p className={`text-xs ${tw.textMuted}`}>
          Select offers for each segment to create the mappings.
        </p>
      </div>

      {/* Error Display */}
      {validationErrors?.flows && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-700">{validationErrors.flows}</p>
        </div>
      )}

      {/* Segment Offers Table */}
      <div>
        {selectedSegments.length === 0 ? (
          <div className={components.card.surface}>
            <p className={`${tw.caption} ${tw.textSecondary} text-center py-8`}>
              No segments selected. Please add segments in the Audience step
              first.
            </p>
          </div>
        ) : (
          <div className={`border border-gray-200 ${tw.rounded} overflow-hidden`}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex-1">
                    Segment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex-1">
                    Offer
                  </th>
                  {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex-1">
                    Wait Hours
                  </th> */}
                  {(formData.campaign_type === "ab_test" ||
                    formData.campaign_type === "champion_challenger") && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex-1">
                      Allocation
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex-1 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedSegments.flatMap((segment, segmentIndex) => {
                  const offers = getOffersForSegment(segment.id);
                  const flowState = segmentFlows[segment.id] || {
                    offers: [],
                    offerWaitHours: {},
                  };

                  if (offers.length === 0) {
                    // Show one empty row for segment with no offers
                    return (
                      <tr
                        key={`${segment.id}-empty-${segmentIndex}`}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {segment.name}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-500">—</div>
                        </td>
                        {/* <td className="px-4 py-3">
                          <div className="text-sm text-gray-500">—</div>
                        </td> */}
                        {(formData.campaign_type === "ab_test" ||
                          formData.campaign_type === "champion_challenger") && (
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={flowState.allocation || ""}
                              onChange={(e) =>
                                handleUpdateAllocation(segment.id, e.target.value)
                              }
                              placeholder={
                                formData.campaign_type === "ab_test"
                                  ? "50-50"
                                  : "70-30"
                              }
                              className="w-full px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-50"
                              style={{
                                border: "none",
                                outline: "none",
                                background: "transparent",
                                boxShadow: "none"
                              }}
                            />
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSelectOffers(segment.id)}
                              className="p-1.5 text-gray-900 rounded transition-colors cursor-pointer hover:bg-gray-100"
                              title="Select Offers"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  // Show one row per offer
                  return offers.map((offer, offerIndex) => (
                    <tr
                      key={`${segment.id}-${offer.id}-${offerIndex}`}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {segment.name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{offer.name}</div>
                      </td>
                      {/* <td className="px-4 py-3">
                        <input
                          type="text"
                          inputMode="numeric"
                          min="0"
                          placeholder="0"
                          value={flowState.offerWaitHours[offer.id] || 0}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "") {
                              handleUpdateWaitHours(segment.id, offer.id, 0);
                            } else {
                              const numValue = parseInt(value, 10);
                              if (!isNaN(numValue) && numValue >= 0) {
                                handleUpdateWaitHours(
                                  segment.id,
                                  offer.id,
                                  numValue
                                );
                              }
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value === "") {
                              handleUpdateWaitHours(segment.id, offer.id, 0);
                            }
                          }}
                          className="w-full px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-50"
                          style={{
                            border: "none",
                            outline: "none",
                            background: "transparent",
                            boxShadow: "none"
                          }}
                        />
                      </td> */}
                      {(formData.campaign_type === "ab_test" ||
                        formData.campaign_type === "champion_challenger") && (
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={flowState.allocation || ""}
                            onChange={(e) =>
                              handleUpdateAllocation(segment.id, e.target.value)
                            }
                            placeholder={
                              formData.campaign_type === "ab_test"
                                ? "50-50"
                                : "70-30"
                            }
                            className="w-full px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-50"
                            style={{
                              border: "none",
                              outline: "none",
                              background: "transparent",
                              boxShadow: "none"
                            }}
                          />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handlePreviewOffer(offer)}
                            className="p-1.5 text-gray-900 rounded transition-colors cursor-pointer hover:bg-gray-100"
                            title="Preview Offer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/dashboard/offers/${offer.id}/edit`)}
                            className="p-1.5 text-gray-900 rounded transition-colors cursor-pointer hover:bg-gray-100"
                            title="Edit Offer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSelectOffers(segment.id)}
                            className="p-1.5 text-gray-900 rounded transition-colors cursor-pointer hover:bg-gray-100"
                            title="Add More Offers"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleRemoveOffer(segment.id, offer.id)
                            }
                            className="p-1.5 text-red-600 rounded transition-colors cursor-pointer hover:bg-red-50"
                            title="Remove This Offer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
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

      {/* Offer Preview Modal */}
      <OfferPreviewModal
        isOpen={showPreviewModal}
        offer={previewOffer}
        onClose={() => {
          setShowPreviewModal(false);
          setPreviewOffer(null);
        }}
      />
    </div>
  );
}
