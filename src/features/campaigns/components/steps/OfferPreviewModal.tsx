import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CampaignOffer } from "../../types/campaign";
import { buttons } from "../../../../shared/utils/tokens";

interface OfferPreviewModalProps {
  isOpen: boolean;
  offer: CampaignOffer | null;
  onClose: () => void;
}

export default function OfferPreviewModal({
  isOpen,
  offer,
  onClose,
}: OfferPreviewModalProps) {
  const navigate = useNavigate();

  if (!isOpen || !offer) return null;

  const handleViewDetails = () => {
    navigate(`/dashboard/offers/${offer.id}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md shadow-lg max-w-lg w-full">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Offer Preview</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-4">
          {/* Offer Name */}
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {offer.name}
            </h3>
            {offer.description && (
              <p className="text-sm text-gray-600 mt-1">{offer.description}</p>
            )}
          </div>

          {/* Offer Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Type
              </p>
              <p className="text-sm text-gray-900 mt-1">{offer.offer_type}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Reward
              </p>
              <p className="text-sm text-gray-900 mt-1">
                {offer.reward_type}
                {offer.reward_value && ` - ${offer.reward_value}`}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Valid For
              </p>
              <p className="text-sm text-gray-900 mt-1">
                {offer.validity_period} days
              </p>
            </div>
            {offer.code && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Code
                </p>
                <p className="text-sm font-mono text-gray-900 mt-1">
                  {offer.code}
                </p>
              </div>
            )}
          </div>

          {/* Terms & Conditions */}
          {offer.terms_conditions && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Terms & Conditions
              </p>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                {offer.terms_conditions}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            style={{
              background: "#F5FCFF",
              color: "#000000",
              paddingTop: buttons.secondaryAction.paddingY,
              paddingBottom: buttons.secondaryAction.paddingY,
              paddingLeft: buttons.secondaryAction.paddingX,
              paddingRight: buttons.secondaryAction.paddingX,
              borderRadius: buttons.secondaryAction.borderRadius,
              fontSize: buttons.secondaryAction.fontSize,
              fontWeight: "500",
              border: "none",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#E0F7FF")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "#F5FCFF")
            }
            className="font-medium"
          >
            Close
          </button>
          <button
            onClick={handleViewDetails}
            style={{
              background: buttons.action.background,
              color: buttons.action.color,
              paddingTop: buttons.action.paddingY,
              paddingBottom: buttons.action.paddingY,
              paddingLeft: buttons.action.paddingX,
              paddingRight: buttons.action.paddingX,
              borderRadius: buttons.action.borderRadius,
              fontSize: buttons.action.fontSize,
              fontWeight: "500",
              border: "none",
              cursor: "pointer",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            className="font-medium"
          >
            View Full Details
          </button>
        </div>
      </div>
    </div>
  );
}
