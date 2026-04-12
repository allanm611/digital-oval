import { useState, useEffect } from "react";
import { X, ExternalLink, Loader } from "lucide-react";
import { CampaignOffer } from "../../types/campaign";
import { OfferCreative } from "../../../offers/types/offerCreative";
import { offerCreativeService } from "../../../offers/services/offerCreativeService";
import { color, tw } from "../../../../shared/utils/utils";
import { useToast } from "../../../../contexts/ToastContext";

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
  const [creatives, setCreatives] = useState<OfferCreative[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { error: showError } = useToast();

  // Fetch creatives when modal opens
  useEffect(() => {
    if (isOpen && offer) {
      loadCreatives();
    }
  }, [isOpen, offer?.id]);

  const loadCreatives = async () => {
    if (!offer) return;

    try {
      setIsLoading(true);
      const response = await offerCreativeService.getByOffer(Number(offer.id), {
        limit: 100,
      });
      setCreatives(response.data || []);
    } catch (err) {
      showError("Failed to load creatives", "Could not fetch offer creatives");
      console.error("Error loading creatives:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !offer) return null;

  // Group creatives by channel
  const creativesByChannel = creatives.reduce(
    (acc, creative) => {
      if (!acc[creative.channel]) {
        acc[creative.channel] = [];
      }
      acc[creative.channel].push(creative);
      return acc;
    },
    {} as Record<string, OfferCreative[]>,
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Offer Preview</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Offer Details Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {offer.name}
              </h3>
              {offer.description && (
                <p className="text-sm text-gray-600 mt-1">{offer.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Offer Type
                </p>
                <p className="text-sm text-gray-900 mt-1">{offer.offer_type}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Reward
                </p>
                <p className="text-sm text-gray-900 mt-1">
                  {offer.reward_type}{" "}
                  {offer.reward_value && `- ${offer.reward_value}`}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Validity Period
                </p>
                <p className="text-sm text-gray-900 mt-1">
                  {offer.validity_period} days
                </p>
              </div>
              {offer.code && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Promo Code
                  </p>
                  <p className="text-sm font-mono text-gray-900 mt-1">
                    {offer.code}
                  </p>
                </div>
              )}
            </div>

            {offer.terms_conditions && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Terms & Conditions
                </p>
                <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-3 rounded max-h-48 overflow-y-auto">
                  {offer.terms_conditions}
                </p>
              </div>
            )}
          </div>

          {/* Creatives Section */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Creatives by Channel
            </h4>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-5 h-5 text-gray-400 animate-spin" />
              </div>
            ) : creatives.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">
                No creatives configured for this offer
              </p>
            ) : (
              <div className="space-y-4">
                {Object.entries(creativesByChannel).map(([channel, items]) => (
                  <div key={channel} className="border border-gray-200 rounded p-4">
                    <h5 className="font-medium text-gray-900 mb-3">
                      {channel}{" "}
                      <span className="text-xs text-gray-500">
                        ({items.length})
                      </span>
                    </h5>
                    <div className="space-y-3">
                      {items.map((creative, idx) => (
                        <div key={creative.id} className="bg-gray-50 p-3 rounded">
                          <p className="text-xs text-gray-600 mb-2">
                            Locale: {creative.locale}
                            {creative.is_latest && (
                              <span className="ml-2 inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                Latest
                              </span>
                            )}
                          </p>

                          {creative.title && (
                            <div className="mb-2">
                              <p className="text-xs text-gray-600">Title:</p>
                              <p className="text-sm text-gray-900">
                                {creative.title}
                              </p>
                            </div>
                          )}

                          {creative.text_body && (
                            <div className="mb-2">
                              <p className="text-xs text-gray-600">Body:</p>
                              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                {creative.text_body}
                              </p>
                            </div>
                          )}

                          {creative.html_body && (
                            <div>
                              <p className="text-xs text-gray-600 mb-1">
                                HTML Body:
                              </p>
                              <div className="text-xs text-gray-500 max-h-24 overflow-y-auto bg-white p-2 rounded border border-gray-200">
                                <code>{creative.html_body}</code>
                              </div>
                            </div>
                          )}

                          {creative.variables &&
                            Object.keys(creative.variables).length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-600 mb-1">
                                  Variables:
                                </p>
                                <ul className="text-xs text-gray-700 space-y-1">
                                  {Object.entries(creative.variables).map(
                                    ([key, value]) => (
                                      <li key={key}>
                                        <code>{key}</code>: {String(value)}
                                      </li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded transition-colors hover:bg-gray-50"
          >
            Close
          </button>
          <a
            href={`/offers/${offer.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded transition-colors hover:bg-blue-700 flex items-center gap-2"
          >
            View Full Details
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
