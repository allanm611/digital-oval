import { useState } from "react";
import { Gift, Users, Plus, X } from "lucide-react";
import { CampaignSegment, CampaignOffer } from "../../types/campaign";
import OfferSelectionModal from "./OfferSelectionModal";
import { color, tw, components } from "../../../../shared/utils/utils";
import { SegmentOfferMapping } from "../../pages/CreateCampaignPage";

interface MultipleTargetOfferMappingProps {
  selectedSegments: CampaignSegment[];
  segmentOfferMappings: SegmentOfferMapping[];
  setSegmentOfferMappings: (mappings: SegmentOfferMapping[]) => void;
  selectedOffers: CampaignOffer[];
  setSelectedOffers: (offers: CampaignOffer[]) => void;
}

export default function MultipleTargetOfferMapping({
  selectedSegments,
  segmentOfferMappings,
  setSegmentOfferMappings,
  selectedOffers,
  setSelectedOffers,
}: MultipleTargetOfferMappingProps) {
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);

  const handleAddOffer = (segmentId: string) => {
    setEditingSegmentId(segmentId);
    setShowOfferModal(true);
  };

  const handleOfferSelect = (offers: CampaignOffer[]) => {
    if (!editingSegmentId) return;

    setSegmentOfferMappings((prevMappings) => {
      const updatedMappings = [...prevMappings];

      offers.forEach((offer) => {
        const offerId = parseInt(offer.id);
        const exists = updatedMappings.some(
          (mapping) =>
            mapping.segment_id === editingSegmentId &&
            mapping.offer_id === offerId
        );

        if (!exists) {
          updatedMappings.push({
            segment_id: editingSegmentId,
            offer_id: offerId,
          });
        }
      });

      return updatedMappings;
    });

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

  const handleRemoveMapping = (segmentId: string, offerId: number) => {
    // Remove mapping
    setSegmentOfferMappings(
      segmentOfferMappings.filter(
        (m) => !(m.segment_id === segmentId && m.offer_id === offerId)
      )
    );

    // Check if this offer is used by any other segment
    const offerUsedElsewhere = segmentOfferMappings.some(
      (m) => m.offer_id === offerId && m.segment_id !== segmentId
    );

    // If not used elsewhere, remove from selectedOffers
    if (!offerUsedElsewhere) {
      setSelectedOffers(
        selectedOffers.filter((o) => parseInt(o.id) !== offerId)
      );
    }
  };

  const getOffersForSegment = (segmentId: string): CampaignOffer[] => {
    const mappings = segmentOfferMappings.filter(
      (m) => m.segment_id === segmentId
    );
    return mappings
      .map((m) => selectedOffers.find((o) => parseInt(o.id) === m.offer_id))
      .filter(Boolean) as CampaignOffer[];
  };

  return (
    <div className="space-y-4">
      {/* Segment to Offer Mappings */}
      <div className="space-y-3">
        {selectedSegments.length === 0 ? (
          <div className={components.card.surface}>
            <p className={`${tw.caption} ${tw.textSecondary} text-center py-8`}>
              No segments selected. Please add segments in the Audience step
              first.
            </p>
          </div>
        ) : (
          selectedSegments.map((segment) => {
            const mappedOffers = getOffersForSegment(segment.id);

            return (
              <div key={segment.id} className={components.card.surface}>
                {/* Segment Header */}
                <div className="flex items-center justify-between mb-3">
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
                        {segment.customer_count?.toLocaleString() || "0"}{" "}
                        customers
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddOffer(segment.id)}
                    className={`inline-flex items-center px-3 py-1.5 text-sm font-medium ${tw.rounded}`}
                    style={{
                      backgroundColor: color.primary.action,
                      color: "white",
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Offer
                  </button>
                </div>

                {/* Mapped Offers */}
                <div>
                  <div
                    className={`text-sm font-medium ${tw.textSecondary} mb-2`}
                  >
                    Mapped Offers:
                  </div>
                  {mappedOffers.length === 0 ? (
                    <div
                      className={`text-center py-4 border-2 border-dashed ${tw.rounded}`}
                      style={{ borderColor: color.border.default }}
                    >
                      <p className={`text-sm ${tw.textSecondary}`}>
                        No offers mapped to this segment
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {mappedOffers.map((offer) => (
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
                                {offer.reward_value} • {offer.validity_period}d
                                validity
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              handleRemoveMapping(
                                segment.id,
                                parseInt(offer.id)
                              )
                            }
                            className={`p-1.5 ${tw.rounded}`}
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      ))}
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
