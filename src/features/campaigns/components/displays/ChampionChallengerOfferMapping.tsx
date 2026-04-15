import { Award, Target, Gift, Plus, X, ArrowRight, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CampaignSegment, CampaignOffer } from "../../types/campaign";
import { color , tw} from "../../../../shared/utils/utils";

interface ChampionChallengerOfferMappingProps {
  champion: CampaignSegment | null;
  challengers: CampaignSegment[];
  selectedOffers: CampaignOffer[];
  offerMappings: { [segmentId: string]: string[] }; // segmentId -> offerIds[]
  onMapOffers: (segmentId: string) => void;
  onRemoveOfferFromSegment: (segmentId: string, offerId: string) => void;
}

export default function ChampionChallengerOfferMapping({
  champion,
  challengers,
  selectedOffers,
  offerMappings,
  onMapOffers,
  onRemoveOfferFromSegment,
}: ChampionChallengerOfferMappingProps) {
  const navigate = useNavigate();

  const getOffersForSegment = (segmentId: string) => {
    const offerIds = offerMappings[segmentId] || [];
    return selectedOffers.filter((offer) => offerIds.includes(offer.id));
  };

  const hasOffersForSegment = (segmentId: string) => {
    return offerMappings[segmentId] && offerMappings[segmentId].length > 0;
  };

  if (!champion) {
    return (
      <div className={`bg-gray-50 border-2 border-dashed border-gray-300 ${tw.rounded} p-12`}>
        <div className="text-center text-gray-500">
          <Award className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="font-medium">No Champion segment configured</p>
          <p className="text-sm mt-1">
            Please configure your Champion segment in the previous step.
          </p>
        </div>
      </div>
    );
  }

  const allSegments = [champion, ...challengers];
  const totalMappedSegments = allSegments.filter((s) =>
    hasOffersForSegment(s.id)
  ).length;
  const totalOffersMapped = Object.values(offerMappings).flat().length;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className={`bg-gray-50 ${tw.rounded} p-6 border border-gray-200`}>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {totalMappedSegments}/{allSegments.length}
            </div>
            <div className="text-sm text-gray-600">Segments Mapped</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {totalOffersMapped}
            </div>
            <div className="text-sm text-gray-600">Total Offer Mappings</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {selectedOffers.length}
            </div>
            <div className="text-sm text-gray-600">Available Offers</div>
          </div>
        </div>
      </div>

      {/* Champion Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5" style={{ color: color.primary.accent }} />
          <h3 className="text-lg font-semibold text-gray-900">
            Champion Offers
          </h3>
        </div>

        <div className={`bg-white border border-gray-200 ${tw.rounded} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Award
                className="w-5 h-5"
                style={{ color: color.primary.accent }}
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-gray-900">
                    {champion.name}
                  </span>
                  <span className="px-2.5 py-0.5 text-gray-700 text-xs font-bold rounded-full border border-gray-200">
                    🏆 CHAMPION
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  {champion.customer_count.toLocaleString()} customers
                </span>
              </div>
            </div>
            <button
              onClick={() => onMapOffers(champion.id)}
              className={`inline-flex items-center px-4 py-2 text-white ${tw.rounded} text-sm font-medium`}
              style={{ backgroundColor: color.primary.action }}
            >
              <Plus className="w-4 h-4 mr-2" />
              {hasOffersForSegment(champion.id)
                ? "Add More Offers"
                : "Map Offers"}
            </button>
          </div>

          {/* Offers List */}
          {hasOffersForSegment(champion.id) ? (
            <div className="space-y-2">
              {getOffersForSegment(champion.id).map((offer) => (
                <div
                  key={offer.id}
                  className={`bg-white border border-gray-200 ${tw.rounded} p-4 flex items-center justify-between`}
                >
                  <div className="flex items-center space-x-3">
                    <Gift
                      className="w-5 h-5"
                      style={{ color: color.primary.accent }}
                    />
                    <div>
                      <div className="text-base font-medium text-gray-900">
                        {offer.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {offer.reward_type} - {offer.reward_value}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/dashboard/offers/${offer.id}/edit`)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                      title="Edit offer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        onRemoveOfferFromSegment(champion.id, offer.id)
                      }
                      className="p-1.5 text-gray-400 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`bg-gray-50 border-2 border-dashed border-gray-300 ${tw.rounded} p-8 text-center`}>
              <Gift className="w-10 h-10 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">No offers mapped yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Challengers Section */}
      {challengers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Target
              className="w-5 h-5"
              style={{ color: color.primary.accent }}
            />
            <h3 className="text-lg font-semibold text-gray-900">
              Challenger Offers
            </h3>
            <span className="text-sm text-gray-500">
              ({challengers.length})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {challengers.map((challenger, index) => (
              <div
                key={challenger.id}
                className={`bg-white border border-gray-200 ${tw.rounded} p-5`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${tw.rounded} flex items-center justify-center border border-gray-200`}>
                      <span className="text-gray-700 font-bold text-sm">
                        C{index + 1}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900 text-base">
                          {challenger.name}
                        </span>
                        <span className="px-2 py-0.5 text-gray-700 text-xs font-medium rounded-full border border-gray-200">
                          Challenger
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {challenger.customer_count.toLocaleString()} customers
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onMapOffers(challenger.id)}
                    className={`inline-flex items-center px-3 py-1.5 text-white ${tw.rounded} text-xs font-medium`}
                    style={{ backgroundColor: color.primary.action }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Offers
                  </button>
                </div>

                {/* Offers List */}
                {hasOffersForSegment(challenger.id) ? (
                  <div className="space-y-2">
                    {getOffersForSegment(challenger.id).map((offer) => (
                      <div
                        key={offer.id}
                        className={`bg-white border border-gray-200 ${tw.rounded} p-3 flex items-center justify-between`}
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <Gift
                            className="w-4 h-4 flex-shrink-0"
                            style={{ color: color.primary.accent }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 text-base truncate">
                              {offer.name}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {offer.reward_type}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => navigate(`/dashboard/offers/${offer.id}/edit`)}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded"
                            title="Edit offer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              onRemoveOfferFromSegment(challenger.id, offer.id)
                            }
                            className="p-1 text-gray-400 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`bg-gray-50 border border-dashed border-gray-300 ${tw.rounded} p-6 text-center`}>
                    <Gift className="w-8 h-8 mx-auto mb-1 text-gray-400" />
                    <p className="text-sm text-gray-500">No offers</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mapping Visualization */}
      {totalOffersMapped > 0 && (
        <div className={`bg-gray-50 border border-gray-200 ${tw.rounded} p-4`}>
          <div className="flex items-start space-x-3">
            <ArrowRight
              className="w-4 h-4 mt-1"
              style={{ color: color.primary.accent }}
            />
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                Mapping Summary
              </h4>
              <p className="text-sm text-gray-700">
                {totalMappedSegments} segment
                {totalMappedSegments !== 1 ? "s" : ""} mapped with{" "}
                {totalOffersMapped} offer assignment
                {totalOffersMapped !== 1 ? "s" : ""}. The champion and
                challengers can have different offers to test various
                strategies.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
