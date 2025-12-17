import { useState, useEffect, useRef } from "react";
import { Gift } from "lucide-react";
import {
  CreateCampaignRequest,
  CampaignSegment,
  CampaignOffer,
  SequentialOfferMapping,
  ControlGroup,
} from "../../types/campaign";
import OfferSelectionModal from "./OfferSelectionModal";
import { offerService } from "../../../offers/services/offerService";
import { OfferStatusEnum } from "../../../offers/types/offer";
import OfferFlowChart from "./OfferFlowChart";
import ChampionChallengerOfferMapping from "../displays/ChampionChallengerOfferMapping";
import ABTestOfferMapping from "../displays/ABTestOfferMapping";
import MultipleTargetOfferMapping from "./MultipleTargetOfferMapping";
import { SegmentOfferMapping } from "../../pages/CreateCampaignPage";

import { tw } from "../../../../shared/utils/utils";
interface OfferMappingStepProps {
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
  segmentOfferMappings?: SegmentOfferMapping[];
  setSegmentOfferMappings?: (mappings: SegmentOfferMapping[]) => void;
  controlGroup: ControlGroup;
  setControlGroup: (group: ControlGroup) => void;
  isLoading?: boolean;
  onSaveDraft?: () => void;
  onCancel?: () => void;
  validationErrors?: { [key: string]: string };
  clearValidationErrors?: () => void;
  setValidationErrors?: (errors: { [key: string]: string }) => void;
}

export default function OfferMappingStep({
  formData,
  selectedSegments,
  selectedOffers,
  setSelectedOffers,
  segmentOfferMappings = [],
  setSegmentOfferMappings,
  controlGroup,
  validationErrors = {},
  clearValidationErrors,
  setValidationErrors,
}: OfferMappingStepProps) {
  const [showOfferModal, setShowOfferModal] = useState(false);
  const hasAutoOpenedRef = useRef(false);
  const [offerMappings, setOfferMappings] = useState<{
    [segmentId: string]: CampaignOffer[];
  }>({});
  const [sequentialMappings, setSequentialMappings] = useState<
    SequentialOfferMapping[]
  >([]);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);

  const isRoundRobinOrMultiLevel =
    formData.campaign_type === "round_robin" ||
    formData.campaign_type === "multiple_level";

  // Auto-open modal when returning from offer creation
  useEffect(() => {
    // Only try to auto-open once
    if (hasAutoOpenedRef.current) {
      return;
    }

    // Wait for segments to be restored before opening modal
    if (selectedSegments.length === 0) {
      return;
    }

    // Check if we have newly created offers
    const campaignFlowOffersStr = sessionStorage.getItem(
      "campaignFlowCreatedOffers"
    );
    const campaignFlowOfferIds: number[] = campaignFlowOffersStr
      ? JSON.parse(campaignFlowOffersStr)
      : [];

    // Check if we're returning from offer creation
    const returnFromOfferCreate = new URLSearchParams(
      window.location.search
    ).get("returnFromOfferCreate");

    // Auto-open modal if we have newly created offers or are returning from offer creation
    if (campaignFlowOfferIds.length > 0 || returnFromOfferCreate === "true") {
      // Mark as attempted immediately to prevent loops
      hasAutoOpenedRef.current = true;

      // Determine which segment to map to
      let segmentToMap: string | null = null;

      if (isRoundRobinOrMultiLevel && selectedSegments.length > 0) {
        segmentToMap = selectedSegments[0].id;
      } else if (
        formData.campaign_type === "multiple_target_group" &&
        selectedSegments.length > 0
      ) {
        segmentToMap = selectedSegments[0].id;
      } else if (
        formData.campaign_type === "champion_challenger" &&
        selectedSegments.length > 0
      ) {
        const champion = selectedSegments.find((s) => s.priority === 1);
        segmentToMap = champion?.id || selectedSegments[0].id;
      } else if (
        formData.campaign_type === "ab_test" &&
        selectedSegments.length > 0
      ) {
        segmentToMap = selectedSegments[0].id;
      }

      if (segmentToMap) {
        // Use a delay to ensure everything is fully mounted and data is restored
        const timer = setTimeout(() => {
          console.log(
            "Auto-opening offer selection modal with segment:",
            segmentToMap
          );
          setEditingSegmentId(segmentToMap);
          setShowOfferModal(true);
        }, 800); // Increased delay to ensure data restoration is complete

        return () => clearTimeout(timer);
      }
    }
  }, [selectedSegments, formData.campaign_type, isRoundRobinOrMultiLevel]);

  const syncSelectedOffersFromMappings = (
    mappings: Record<string, CampaignOffer[]>
  ) => {
    const uniqueOffers = new Map<string, CampaignOffer>();
    Object.values(mappings).forEach((offers) => {
      offers.forEach((offer) => {
        if (offer.id) {
          uniqueOffers.set(offer.id, offer);
        }
      });
    });
    setSelectedOffers(Array.from(uniqueOffers.values()));
  };

  const handleOfferSelect = (offers: CampaignOffer[]) => {
    // Clear validation errors when offers are selected
    if (clearValidationErrors) {
      clearValidationErrors();
    }

    if (isRoundRobinOrMultiLevel && selectedSegments.length > 0) {
      // For Round Robin/Multiple Level: add offers sequentially
      const segmentId = selectedSegments[0].id;
      offers.forEach((offer) => {
        if (!selectedOffers.find((o) => o.id === offer.id)) {
          const newMapping: SequentialOfferMapping = {
            offer_id: offer.id,
            segment_id: segmentId,
            sequence_order: sequentialMappings.length + 1,
            ...(formData.campaign_type === "round_robin" && {
              interval_config: { interval_type: "days", interval_value: 1 },
            }),
            ...(formData.campaign_type === "multiple_level" && {
              condition_config: {
                condition_type: "customer_attribute",
                operator: "equals",
                field: "",
                value: "",
              },
            }),
          };
          setSequentialMappings((prev) => [...prev, newMapping]);
        }
      });

      // Add to selected offers
      const newOffers = [...selectedOffers];
      offers.forEach((offer) => {
        if (!newOffers.find((o) => o.id === offer.id)) {
          newOffers.push(offer);
        }
      });
      setSelectedOffers(newOffers);
    } else if (editingSegmentId && offers.length > 0) {
      // For other types: map all selected offers to the current segment
      setOfferMappings((prev) => {
        const updatedMappings = {
          ...prev,
          [editingSegmentId]: offers,
        };
        syncSelectedOffersFromMappings(updatedMappings);
        return updatedMappings;
      });
    }
    setShowOfferModal(false);
    setEditingSegmentId(null);
  };

  const handleRemoveOfferFromSegment = (segmentId: string, offerId: string) => {
    const currentMapping = offerMappings[segmentId];
    if (currentMapping) {
      const updatedOffers = currentMapping.filter(
        (offer) => offer.id !== offerId
      );

      const newMappings = { ...offerMappings };
      if (updatedOffers.length > 0) {
        newMappings[segmentId] = updatedOffers;
      } else {
        delete newMappings[segmentId];
      }

      setOfferMappings(newMappings);
      syncSelectedOffersFromMappings(newMappings);
    }
  };

  // Validate offer statuses - ensure all offers are ACTIVE or APPROVED
  const validateOfferStatuses = async (
    offers: CampaignOffer[]
  ): Promise<{ isValid: boolean; invalidOffers: string[] }> => {
    if (offers.length === 0) {
      return { isValid: true, invalidOffers: [] };
    }

    try {
      // Fetch status for each offer
      const statusPromises = offers.map(async (offer) => {
        try {
          const response = await offerService.getOfferById(
            Number(offer.id),
            true
          );
          const offerData =
            (response as { data?: { status?: string } })?.data || response;
          const status = offerData.status;

          if (
            status !== OfferStatusEnum.ACTIVE &&
            status !== OfferStatusEnum.APPROVED
          ) {
            return offer.name || offer.id;
          }
          return null;
        } catch {
          // If we can't fetch the offer, assume it's invalid
          return offer.name || offer.id;
        }
      });

      const results = await Promise.all(statusPromises);
      const invalid = results.filter((name): name is string => name !== null);

      return { isValid: invalid.length === 0, invalidOffers: invalid };
    } catch (error) {
      console.error("Error validating offer statuses:", error);
      // On error, allow proceeding (graceful degradation)
      return { isValid: true, invalidOffers: [] };
    }
  };

  // Validate offers when they change
  useEffect(() => {
    const checkOfferStatuses = async () => {
      if (selectedOffers.length === 0) {
        return;
      }

      const validation = await validateOfferStatuses(selectedOffers);

      // Set validation error if there are invalid offers
      if (!validation.isValid && validation.invalidOffers.length > 0) {
        const errorMessage = `Cannot proceed: Campaigns can only be created with offers that are Active or Approved. Please remove or activate/approve the following offers: ${validation.invalidOffers.join(
          ", "
        )}`;
        if (setValidationErrors) {
          setValidationErrors({ offers: errorMessage });
        }
      } else if (validation.isValid) {
        // Clear validation errors if all offers are valid
        if (clearValidationErrors) {
          clearValidationErrors();
        }
      }
    };

    checkOfferStatuses();
  }, [selectedOffers, clearValidationErrors]);

  // Transform offerMappings for specialized components (extract offerIds only)
  const simplifiedOfferMappings: { [segmentId: string]: string[] } = {};
  Object.keys(offerMappings).forEach((segmentId) => {
    simplifiedOfferMappings[segmentId] = offerMappings[segmentId].map(
      (offer) => offer.id
    );
  });

  return (
    <div className="space-y-8">
      {/* Validation Error Message */}
      {validationErrors.offers && (
        <div
          className={`mt-8 p-3 bg-red-50 border border-red-200 ${tw.rounded}`}
        >
          <p className="text-sm text-red-600">{validationErrors.offers}</p>
        </div>
      )}

      {/* Header */}
      <div className="mt-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Offer Selection & Mapping
        </h2>
        <p className="text-sm text-gray-600">
          {isRoundRobinOrMultiLevel
            ? `Configure offers with ${
                formData.campaign_type === "round_robin"
                  ? "time intervals"
                  : "conditions"
              } for sequential delivery`
            : "Select offers and map them to your audience segments"}
        </p>
      </div>

      {/* Champion-Challenger Offer Mapping */}
      {formData.campaign_type === "champion_challenger" && (
        <ChampionChallengerOfferMapping
          champion={selectedSegments.find((s) => s.priority === 1) || null}
          challengers={selectedSegments.filter((s) => s.priority !== 1)}
          selectedOffers={selectedOffers}
          offerMappings={simplifiedOfferMappings}
          onMapOffers={(segmentId) => {
            setEditingSegmentId(segmentId);
            setShowOfferModal(true);
          }}
          onRemoveOfferFromSegment={handleRemoveOfferFromSegment}
        />
      )}

      {/* A/B Test Offer Mapping */}
      {formData.campaign_type === "ab_test" && (
        <ABTestOfferMapping
          variantA={selectedSegments[0] || null}
          variantB={selectedSegments[1] || null}
          selectedOffers={selectedOffers}
          offerMappings={simplifiedOfferMappings}
          onMapOffers={(segmentId) => {
            setEditingSegmentId(segmentId);
            setShowOfferModal(true);
          }}
          onRemoveOfferFromSegment={handleRemoveOfferFromSegment}
        />
      )}

      {/* Flow Chart for Round Robin and Multiple Level */}
      {isRoundRobinOrMultiLevel && selectedSegments.length > 0 && (
        <OfferFlowChart
          campaignType={
            formData.campaign_type as "round_robin" | "multiple_level"
          }
          segment={selectedSegments[0]}
          selectedOffers={selectedOffers}
          offerMappings={sequentialMappings}
          onUpdateMappings={setSequentialMappings}
          onAddOffer={() => setShowOfferModal(true)}
        />
      )}

      {/* Multiple Target Group - Use specialized component */}
      {formData.campaign_type === "multiple_target_group" &&
        setSegmentOfferMappings && (
          <MultipleTargetOfferMapping
            selectedSegments={selectedSegments}
            segmentOfferMappings={segmentOfferMappings}
            setSegmentOfferMappings={setSegmentOfferMappings}
            selectedOffers={selectedOffers}
            setSelectedOffers={setSelectedOffers}
          />
        )}

      {/* Empty State for Types without Segments */}
      {!isRoundRobinOrMultiLevel &&
        formData.campaign_type !== "multiple_target_group" &&
        selectedSegments.length === 0 && (
          <div
            className={`border-2 border-dashed ${tw.rounded} p-12 ${
              validationErrors.offers
                ? "border-red-300 bg-red-50"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <div className="text-center text-gray-500">
              <Gift className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="font-medium">No segments configured</p>
              <p className="text-sm mt-1">
                Please configure your segments in the previous step.
              </p>
            </div>
          </div>
        )}

      {/* Offer Selection Modal */}
      {showOfferModal && (
        <OfferSelectionModal
          isOpen={showOfferModal}
          onClose={() => {
            setShowOfferModal(false);
            setEditingSegmentId(null);
          }}
          onSelect={handleOfferSelect}
          selectedOffers={
            editingSegmentId ? offerMappings[editingSegmentId] || [] : []
          }
          onCreateNew={() => {
            // Navigation is handled inside OfferSelectionModal
            setShowOfferModal(false);
          }}
          onSaveCampaignData={() => {
            // Save campaign form data to sessionStorage before navigating
            try {
              const campaignData = {
                formData: JSON.parse(JSON.stringify(formData)),
                selectedSegments: JSON.parse(JSON.stringify(selectedSegments)),
                selectedOffers: JSON.parse(JSON.stringify(selectedOffers)),
                segmentOfferMappings: JSON.parse(
                  JSON.stringify(segmentOfferMappings)
                ),
                controlGroup: JSON.parse(JSON.stringify(controlGroup)),
                currentStep: 3,
              };
              console.log(
                "Saving campaign data before navigating:",
                campaignData
              );
              sessionStorage.setItem(
                "campaignFormData",
                JSON.stringify(campaignData)
              );
              // Clear the auto-opened flag so modal can open when returning
              sessionStorage.removeItem("offerModalAutoOpened");
              // Reset the ref so modal can open when component remounts
              hasAutoOpenedRef.current = false;
            } catch (error) {
              console.error("Error saving campaign data:", error);
            }
          }}
        />
      )}
    </div>
  );
}
