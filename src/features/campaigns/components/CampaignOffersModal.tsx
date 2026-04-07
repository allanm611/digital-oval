import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { color, tw } from "../../../shared/utils/utils";

interface Offer {
  offer_id: number;
  offer_name: string;
  flow_count?: string | number;
}

interface CampaignOffersModalProps {
  isOpen: boolean;
  onClose: () => void;
  offers: Offer[] | undefined;
  campaignName: string;
}

export default function CampaignOffersModal({
  isOpen,
  onClose,
  offers,
  campaignName,
}: CampaignOffersModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleOfferClick = (offerId: number) => {
    navigate(`/dashboard/offers/${offerId}`);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-black">
              Campaign Offers
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {campaignName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Check if offers is an array before attempting to map */}
          {Array.isArray(offers) && offers.length > 0 ? (
            <div className="space-y-2">
              {offers.map((offer) => (
                <div
                  key={offer.offer_id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
                >
                  <p className="text-sm text-black">
                    {offer.offer_name}
                  </p>
                  <button
                    onClick={() => handleOfferClick(offer.offer_id)}
                    className={`px-3 py-1 text-sm font-medium  rounded transition-colors`}
                    style={{
                      backgroundColor: color.primary.action,
                    }}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No offers associated with this campaign</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
