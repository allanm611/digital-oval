import { useState, useEffect, useRef, Suspense, lazy } from "react";
import Input from '../../../../shared/components/ui/Input';
import { Trash2, Eye, Edit, Settings } from "lucide-react";
import {
  CreateCampaignRequest,
  CampaignSegment,
  CampaignOffer,
} from "../../types/campaign";
import { CampaignFlowConfig, CampaignFlowType } from "../../types/campaignFlow";
import { color, tw, components, getButtonStyles, button } from "../../../../shared/utils/utils";
import OfferSelectionModal from "./OfferSelectionModal";
import OfferPreviewModal from "./OfferPreviewModal";
import ConfigureTrackingRewardsModal from "./ConfigureTrackingRewardsModal";
import type { MappingTrackingRewardConfig } from "../../types/trackingRewardConfig";
import {
  hasCommittedTrackingReward,
  readTrackingRewardFromConditionRule,
  writeTrackingRewardToConditionRule,
} from "../../utils/trackingRewardConfig";
import {
  exclusiveOfferLimitMessage,
  isMutuallyExclusiveCampaign,
  segmentsExceedingExclusiveOfferLimit,
} from "../../utils/mutuallyExclusiveOffers";

const CreateOfferModalWrapper = lazy(() => import("./CreateOfferModalWrapper"));

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
  trackingRewardByOffer: { [offerId: string]: MappingTrackingRewardConfig };
  existingFlowByOffer: { [offerId: string]: CampaignFlowConfig };
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
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewOffer, setPreviewOffer] = useState<CampaignOffer | null>(null);
  const [showEditOfferModal, setShowEditOfferModal] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<number | null>(null);
  const [segmentFlows, setSegmentFlows] = useState<{
    [segmentId: string]: SegmentFlowState;
  }>({});
  const [showTrackingRewardModal, setShowTrackingRewardModal] = useState(false);
  const [configuringMapping, setConfiguringMapping] = useState<{
    segmentId: string;
    segmentName: string;
    offer: CampaignOffer;
  } | null>(null);
  const hasInitializedFromFlowsRef = useRef(false);
  const isMutuallyExclusive = isMutuallyExclusiveCampaign(
    selectedSegments,
    formData.metadata,
  );

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
            trackingRewardByOffer: {},
            existingFlowByOffer: {},
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
        flowsBySegment[segmentIdStr].existingFlowByOffer[offerIdStr] = flow;
        flowsBySegment[segmentIdStr].trackingRewardByOffer[offerIdStr] =
          readTrackingRewardFromConditionRule(flow.condition_rule);
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

    const hasLocalMappings = Object.values(segmentFlows).some(
      (data) => data.offers.length > 0,
    );
    // Do not wipe hydrated campaign flows before local state is initialized.
    if (!hasLocalMappings && campaignFlows.length > 0) {
      return;
    }

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
        const existing = data.existingFlowByOffer?.[offer.id];
        const trackingReward = data.trackingRewardByOffer?.[offer.id];
        flows.push({
          ...existing,
          campaign_id: existing?.campaign_id ?? 0,
          segment_id: parseInt(segmentId),
          offer_id: parseInt(offer.id),
          flow_type: existing?.flow_type || getFlowType(),
          step_order: existing?.step_order ?? flowStepOrder,
          wait_interval_hours: data.offerWaitHours[offer.id] || 0,
          bucket_allocation: data.allocation,
          condition_rule: writeTrackingRewardToConditionRule(
            existing?.condition_rule,
            trackingReward,
          ),
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

    const nextOffers = isMutuallyExclusive ? offers.slice(0, 1) : offers;

    setSegmentFlows((prev) => {
      const updated = { ...prev };
      const currentState = updated[editingSegmentId] || {
        offers: [],
        offerWaitHours: {},
        trackingRewardByOffer: {},
        existingFlowByOffer: {},
      };

      // Preserve existing wait hours for offers that are still selected
      const newOfferWaitHours: { [offerId: string]: number } = {};
      const newTrackingRewardByOffer: {
        [offerId: string]: MappingTrackingRewardConfig;
      } = {};
      const newExistingFlowByOffer: { [offerId: string]: CampaignFlowConfig } =
        {};
      nextOffers.forEach((offer) => {
        newOfferWaitHours[offer.id] =
          currentState.offerWaitHours[offer.id] || 0;
        if (currentState.trackingRewardByOffer[offer.id]) {
          newTrackingRewardByOffer[offer.id] =
            currentState.trackingRewardByOffer[offer.id];
        }
        if (currentState.existingFlowByOffer[offer.id]) {
          newExistingFlowByOffer[offer.id] =
            currentState.existingFlowByOffer[offer.id];
        }
      });

      updated[editingSegmentId] = {
        ...currentState,
        offers: nextOffers,
        offerWaitHours: newOfferWaitHours,
        trackingRewardByOffer: newTrackingRewardByOffer,
        existingFlowByOffer: newExistingFlowByOffer,
      };
      return updated;
    });

    // Update selectedOffers to include all unique offers from all segments
    const offerMap = new Map(selectedOffers.map((offer) => [offer.id, offer]));
    nextOffers.forEach((offer) => {
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
        const nextTracking = { ...updated[segmentId].trackingRewardByOffer };
        const nextExisting = { ...updated[segmentId].existingFlowByOffer };
        const nextWait = { ...updated[segmentId].offerWaitHours };
        delete nextTracking[offerId];
        delete nextExisting[offerId];
        delete nextWait[offerId];
        updated[segmentId].trackingRewardByOffer = nextTracking;
        updated[segmentId].existingFlowByOffer = nextExisting;
        updated[segmentId].offerWaitHours = nextWait;
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
        updated[segmentId] = {
          offers: [],
          offerWaitHours: {},
          trackingRewardByOffer: {},
          existingFlowByOffer: {},
        };
      }
      updated[segmentId].offerWaitHours[offerId] = hours;
      return updated;
    });
  };

  const handleUpdateAllocation = (segmentId: string, allocation: string) => {
    setSegmentFlows((prev) => {
      const updated = { ...prev };
      if (!updated[segmentId]) {
        updated[segmentId] = {
          offers: [],
          offerWaitHours: {},
          trackingRewardByOffer: {},
          existingFlowByOffer: {},
        };
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

  const handleConfigureTrackingRewards = (
    segment: CampaignSegment,
    offer: CampaignOffer,
  ) => {
    setConfiguringMapping({
      segmentId: segment.id,
      segmentName: segment.name,
      offer,
    });
    setShowTrackingRewardModal(true);
  };

  const handleSaveTrackingRewards = (config: MappingTrackingRewardConfig) => {
    if (!configuringMapping) return;
    const { segmentId, offer } = configuringMapping;
    setSegmentFlows((prev) => {
      const updated = { ...prev };
      const current = updated[segmentId] || {
        offers: [],
        offerWaitHours: {},
        trackingRewardByOffer: {},
        existingFlowByOffer: {},
      };
      updated[segmentId] = {
        ...current,
        trackingRewardByOffer: {
          ...current.trackingRewardByOffer,
          [offer.id]: config,
        },
        existingFlowByOffer: {
          ...current.existingFlowByOffer,
          [offer.id]: {
            ...current.existingFlowByOffer[offer.id],
            campaign_id: current.existingFlowByOffer[offer.id]?.campaign_id ?? 0,
            segment_id: parseInt(segmentId, 10) || 0,
            offer_id: parseInt(offer.id, 10) || 0,
            flow_type:
              current.existingFlowByOffer[offer.id]?.flow_type || "STANDARD",
            step_order: current.existingFlowByOffer[offer.id]?.step_order ?? 1,
            wait_interval_hours:
              current.offerWaitHours[offer.id] ||
              current.existingFlowByOffer[offer.id]?.wait_interval_hours ||
              0,
            condition_rule: writeTrackingRewardToConditionRule(
              current.existingFlowByOffer[offer.id]?.condition_rule,
              config,
            ),
          },
        },
      };
      return updated;
    });
    setShowTrackingRewardModal(false);
    setConfiguringMapping(null);
  };

  const emptyFlowState = (): SegmentFlowState => ({
    offers: [],
    offerWaitHours: {},
    trackingRewardByOffer: {},
    existingFlowByOffer: {},
  });

  const exclusiveViolations = isMutuallyExclusive
    ? segmentsExceedingExclusiveOfferLimit(
        Object.entries(segmentFlows).flatMap(([segmentId, data]) =>
          data.offers.map(() => ({ segment_id: segmentId })),
        ),
        selectedSegments,
      )
    : [];

  const canAddOfferToSegment = (segmentId: string, currentOfferCount: number) =>
    !isMutuallyExclusive || currentOfferCount < 1;

  const renderAddOfferButton = (
    segmentId: string,
    currentOfferCount: number,
  ) => {
    const allowed = canAddOfferToSegment(segmentId, currentOfferCount);
    return (
      <button
        type="button"
        onClick={() => {
          if (!allowed) return;
          handleSelectOffers(segmentId);
        }}
        disabled={!allowed}
        title={
          allowed
            ? "Add Offer"
            : "Mutually exclusive campaigns allow only one offer per segment"
        }
        style={{
          ...getButtonStyles(button.action),
          fontWeight: "500",
          transition: "opacity 0.2s",
          opacity: allowed ? 1 : 0.45,
          cursor: allowed ? "pointer" : "not-allowed",
        }}
        onMouseEnter={(e) => {
          if (allowed) e.currentTarget.style.opacity = "0.9";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = allowed ? "1" : "0.45";
        }}
      >
        Add Offer
      </button>
    );
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
          {isMutuallyExclusive
            ? " Mutually exclusive is on: each segment can have only one offer."
            : ""}
        </p>
      </div>

      {exclusiveViolations.length > 0 && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-700">
            {exclusiveOfferLimitMessage(exclusiveViolations[0].name)}
          </p>
        </div>
      )}

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
                  const flowState = segmentFlows[segment.id] || emptyFlowState();

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
                            <Input
                              type="text"
                              value={flowState.allocation || ""}
                              onChange={(value) =>
                                handleUpdateAllocation(segment.id, String(value))
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
                          <div className="flex items-center justify-end">
                            {renderAddOfferButton(segment.id, 0)}
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
                        <Input
                          type="text"
                          inputMode="numeric"
                          min="0"
                          placeholder="0"
                          value={flowState.offerWaitHours[offer.id] || 0}
                          onChange={(value) => {
                            const stringValue = String(value);
                            if (stringValue === "") {
                              handleUpdateWaitHours(segment.id, offer.id, 0);
                            } else {
                              const numValue = parseInt(stringValue, 10);
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
                            if (String(value) === "") {
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
                          <Input
                            type="text"
                            value={flowState.allocation || ""}
                            onChange={(value) =>
                              handleUpdateAllocation(segment.id, String(value))
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
                          {(() => {
                            const configured = hasCommittedTrackingReward(
                              flowState.trackingRewardByOffer?.[offer.id],
                            );
                            return (
                              <button
                                type="button"
                                onClick={() =>
                                  handleConfigureTrackingRewards(segment, offer)
                                }
                                className={`p-1.5 rounded transition-colors cursor-pointer hover:bg-gray-100 ${
                                  configured ? "" : "text-gray-900"
                                }`}
                                style={
                                  configured
                                    ? { color: color.primary.accent }
                                    : undefined
                                }
                                title={
                                  configured
                                    ? "View tracking and rewards configuration"
                                    : "Configure tracking and rewards"
                                }
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                            );
                          })()}
                          <button
                            onClick={() => {
                              setEditingOfferId(Number(offer.id));
                              setShowEditOfferModal(true);
                            }}
                            className="p-1.5 text-gray-900 rounded transition-colors cursor-pointer hover:bg-gray-100"
                            title="Edit Offer"
                          >
                            <Edit className="w-4 h-4" />
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
                          {renderAddOfferButton(segment.id, offers.length)}
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
        singleSelect={isMutuallyExclusive}
      />

      {/* Offer Preview Modal */}
      <OfferPreviewModal
        isOpen={showPreviewModal}
        offer={previewOffer}
        onClose={() => {
          setShowPreviewModal(false);
          setPreviewOffer(null);
        }}
        onEditOffer={(offerId) => {
          setEditingOfferId(offerId);
          setShowEditOfferModal(true);
          setShowPreviewModal(false);
        }}
      />

      <ConfigureTrackingRewardsModal
        isOpen={showTrackingRewardModal && Boolean(configuringMapping)}
        segmentName={configuringMapping?.segmentName || ""}
        offerName={configuringMapping?.offer.name || ""}
        offerId={configuringMapping?.offer.id || ""}
        initialConfig={
          configuringMapping
            ? segmentFlows[configuringMapping.segmentId]?.trackingRewardByOffer[
                configuringMapping.offer.id
              ]
            : undefined
        }
        onClose={() => {
          setShowTrackingRewardModal(false);
          setConfiguringMapping(null);
        }}
        onSave={handleSaveTrackingRewards}
      />

      {/* Edit Offer Modal */}
      <Suspense fallback={null}>
        <CreateOfferModalWrapper
          isOpen={showEditOfferModal}
          onClose={() => {
            setShowEditOfferModal(false);
            setEditingOfferId(null);
          }}
          onOfferCreated={(offerId) => {
            setShowEditOfferModal(false);
            setEditingOfferId(null);
          }}
          offerId={editingOfferId || undefined}
        />
      </Suspense>
    </div>
  );
}
