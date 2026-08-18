import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { CampaignOffer } from "../../types/campaign";
import { Offer } from "../../../../features/offers/types/offer";
import { getButtonStyles, button } from "../../../../shared/utils/utils";
import { offerService } from "../../../../features/offers/services/offerService";
import { offerCreativeService } from "../../../../features/offers/services/offerCreativeService";
import { productService } from "../../../../features/products/services/productService";
import DateFormatter from "../../../../shared/components/DateFormatter";

interface OfferPreviewModalProps {
  isOpen: boolean;
  offer: CampaignOffer | null;
  onClose: () => void;
  onEditOffer?: (offerId: number) => void;
}

interface OfferCreative {
  id: number;
  channel: string;
  locale: string;
  content: string;
  variables?: Record<string, string>;
}

interface Product {
  id: number;
  name: string;
  unit?: string;
}

export default function OfferPreviewModal({
  isOpen,
  offer,
  onClose,
  onEditOffer,
}: OfferPreviewModalProps) {
  const navigate = useNavigate();
  const [offerDetails, setOfferDetails] = useState<Offer | null>(null);
  const [creatives, setCreatives] = useState<OfferCreative[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !offer) {
      setOfferDetails(null);
      setCreatives([]);
      setProducts([]);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch full offer details
        const offerResponse = await offerService.getOfferById(Number(offer.id), true);
        if (offerResponse.success && offerResponse.data) {
          setOfferDetails(offerResponse.data);
        }

        // Fetch creatives
        const creativesResponse = await offerCreativeService.getByOffer(
          Number(offer.id)
        );
        if (creativesResponse.success && Array.isArray(creativesResponse.data)) {
          setCreatives(
            creativesResponse.data.map((c: any) => ({
              id: c.id,
              channel: c.channel || "Unknown",
              locale: c.locale || "Unknown",
              content: c.content || c.body || "No content",
              variables: c.variables,
            }))
          );
        }

        // Fetch products if offer has product_ids
        let productIds = offer.product_ids;
        if (!productIds && offerResponse.success && offerResponse.data?.product_ids) {
          productIds = offerResponse.data.product_ids;
        }

        if (productIds && productIds.length > 0) {
          const productIdArray = Array.isArray(productIds)
            ? productIds
            : [productIds];
          const productList = await Promise.all(
            productIdArray.map((id: any) =>
              productService.getProductById(Number(id)).catch(() => null)
            )
          );
          const validProducts = productList
            .filter((p: any) => p?.success && p?.data)
            .map((p: any) => ({
              id: p.data.id,
              name: p.data.name,
              unit: p.data.unit,
            }));
          setProducts(validProducts);
        }
      } catch (error) {
        console.error("Error loading offer data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, offer]);

  if (!isOpen || !offer) return null;

  const handleViewDetails = () => {
    window.open(`${window.location.origin}/dashboard/offers/${offer.id}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">Offer Preview</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Loading offer details...</p>
              </div>
            </div>
          ) : offerDetails ? (
            <>
              {/* Offer Name & Description */}
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {offerDetails.name}
                </h3>
                {offerDetails.description && (
                  <p className="text-sm text-gray-600 mt-1">{offerDetails.description}</p>
                )}
              </div>

              {/* Offer Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Type
                  </p>
                  <p className="text-sm text-gray-900 mt-1">{offerDetails.offer_type || "-"}</p>
                </div>
                {offerDetails.bonus_value !== undefined && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Bonus Value
                    </p>
                    <p className="text-sm text-gray-900 mt-1">{offerDetails.bonus_value}</p>
                  </div>
                )}
                {offerDetails.discount_percentage !== undefined && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Discount
                    </p>
                    <p className="text-sm text-gray-900 mt-1">{offerDetails.discount_percentage}%</p>
                  </div>
                )}
                {offerDetails.discount_amount !== undefined && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Discount Amount
                    </p>
                    <p className="text-sm text-gray-900 mt-1">{offerDetails.discount_amount}</p>
                  </div>
                )}
                {offerDetails.valid_from && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Valid From
                    </p>
                    <p className="text-sm text-gray-900 mt-1">
                      <DateFormatter date={new Date(offerDetails.valid_from)} useUserTimezone />
                    </p>
                  </div>
                )}
                {offerDetails.valid_to && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Valid To
                    </p>
                    <p className="text-sm text-gray-900 mt-1">
                      <DateFormatter date={new Date(offerDetails.valid_to)} useUserTimezone />
                    </p>
                  </div>
                )}
                {offerDetails.code && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Code
                    </p>
                    <p className="text-sm font-mono text-gray-900 mt-1">
                      {offerDetails.code}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Failed to load offer details</p>
            </div>
          )}

          {/* Products Section */}
          {products.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                Products
              </p>
              <div className="space-y-2">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {product.name}
                      </p>
                      {product.unit && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Unit: {product.unit}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Creatives Section */}
          {creatives.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                Creatives
              </p>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {creatives.map((creative) => (
                  <div
                    key={creative.id}
                    className="p-3 bg-gray-50 rounded border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900">
                        {creative.channel}
                      </p>
                      <p className="text-xs text-gray-500">{creative.locale}</p>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {creative.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state for creatives and products */}
          {!loading && offerDetails && creatives.length === 0 && products.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">
                No products or creatives found for this offer
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 bg-gray-50 sticky bottom-0">
          <button
            onClick={onClose}
            style={{
              ...getButtonStyles(button.secondaryAction),
              fontWeight: "500",
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
            onClick={() => {
              if (offer) {
                window.open(`/dashboard/offers/${offer.id}`, "_blank");
              }
            }}
            style={{
              ...getButtonStyles(button.action),
              fontWeight: "500",
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
