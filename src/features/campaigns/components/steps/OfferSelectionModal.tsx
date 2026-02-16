import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  X,
  Search,
} from "lucide-react";
import { CampaignOffer } from "../../types/campaign";
import HeadlessSelect from "../../../../shared/components/ui/HeadlessSelect";
import { color, tw, zIndexTokens } from "../../../../shared/utils/utils";
import { offerService } from "../../../offers/services/offerService";
import { Offer, OfferStatusEnum } from "../../../offers/types/offer";
import { useAuth } from "../../../../contexts/AuthContext";
import { useToast } from "../../../../contexts/ToastContext";

const CreateOfferModalWrapper = lazy(() => import("./CreateOfferModalWrapper"));

interface OfferSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (offers: CampaignOffer[]) => void;
  selectedOffers: CampaignOffer[];
  editingOffer?: CampaignOffer | null;
  onCreateNew?: () => void;
  onSaveCampaignData?: () => void;
}

const rewardTypeColors = {
  bundle: "bg-blue-100 text-blue-700",
  points: "bg-purple-100 text-purple-700",
  discount: "bg-green-100 text-green-700",
  cashback: "bg-orange-100 text-orange-700",
  free_service: "bg-indigo-100 text-indigo-700",
};

export default function OfferSelectionModal({
  isOpen,
  onClose,
  onSelect,
  selectedOffers,
  editingOffer,
  onSaveCampaignData,
}: OfferSelectionModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [tempSelectedOffers, setTempSelectedOffers] =
    useState<CampaignOffer[]>(selectedOffers);
  const [offers, setOffers] = useState<CampaignOffer[]>([]);
  const [offersWithStatus, setOffersWithStatus] = useState<Map<number, Offer>>(
    new Map(),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingOfferId, setUpdatingOfferId] = useState<number | null>(null);
  const [createOfferModalOpen, setCreateOfferModalOpen] = useState(false);

  const filterOptions = [
    { value: "all", label: "All Offers" },
    { value: "bundle", label: "Bundles" },
    { value: "discount", label: "Discounts" },
    { value: "points", label: "Points" },
    { value: "cashback", label: "Cashback" },
  ];

  useEffect(() => {
    if (isOpen) {
      setTempSelectedOffers(selectedOffers);
      loadOffers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Only depend on isOpen to prevent loops

  const loadOffers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get offers created during this campaign flow session
      let campaignFlowOfferIds: number[] = [];
      const campaignFlowOffersStr = sessionStorage.getItem(
        "campaignFlowCreatedOffers",
      );

      if (campaignFlowOffersStr) {
        try {
          const parsed = JSON.parse(campaignFlowOffersStr);
          // Validate all IDs: must be number > 0
          campaignFlowOfferIds = (Array.isArray(parsed) ? parsed : []).filter(
            (id) => typeof id === "number" && id > 0 && id !== undefined && id !== null
          );
        } catch (err) {
          console.warn("Failed to parse campaignFlowCreatedOffers, using empty array:", err);
          // Clear corrupted data
          sessionStorage.removeItem("campaignFlowCreatedOffers");
        }
      }

      // Fetch only active and approved offers (standard offers)
      // Handle errors gracefully so we can still show campaign flow offers
      let activeOffers: Offer[] = [];
      let approvedOffers: Offer[] = [];

      try {
        const [activeResponse, approvedResponse] = await Promise.allSettled([
          offerService.getActiveOffers({
            limit: 100,
            skipCache: true,
          }),
          offerService.getApprovedOffers({
            limit: 100,
            skipCache: true,
          }),
        ]);

        if (activeResponse.status === "fulfilled") {
          activeOffers = activeResponse.value.data || [];
        } else {
          console.warn("Failed to load active offers:", activeResponse.reason);
        }

        if (approvedResponse.status === "fulfilled") {
          approvedOffers = approvedResponse.value.data || [];
        } else {
          console.warn(
            "Failed to load approved offers:",
            approvedResponse.reason,
          );
        }
      } catch (err) {
        console.warn(
          "Error fetching standard offers, continuing with campaign flow offers only:",
          err,
        );
      }

      // Create a map to store full Offer objects with status
      const offersMap = new Map<number, Offer>();

      // Add active and approved offers
      [...activeOffers, ...approvedOffers].forEach((offer) => {
        if (offer.id) {
          offersMap.set(offer.id, offer);
        }
      });

      // Fetch and add offers created during this campaign flow (even if draft/pending)
      if (campaignFlowOfferIds && campaignFlowOfferIds.length > 0) {
        try {
          // Double-check: filter out any undefined/null values before fetching
          const validOfferIds = campaignFlowOfferIds.filter(
            (id) => typeof id === "number" && id > 0 && id !== undefined && id !== null
          );

          if (validOfferIds.length > 0) {
            const campaignFlowOffersPromises = validOfferIds.map(
              (offerId) =>
                offerService.getOfferById(offerId, true).catch((err) => {
                  console.warn(`Failed to load offer ${offerId}:`, err);
                  return null;
                }),
            );
            const campaignFlowOffersResults = await Promise.all(
              campaignFlowOffersPromises,
            );

            campaignFlowOffersResults.forEach((response) => {
              if (response?.data?.id) {
                const offer = response.data;
                offersMap.set(offer.id, offer);
              }
            });
          }
        } catch (err) {
          console.error("Failed to load campaign flow offers:", err);
        }
      }

      // Store full offer objects for status updates
      setOffersWithStatus(offersMap);

      // Convert Offer objects to CampaignOffer format
      const uniqueOffers = Array.from(offersMap.values());
      const campaignOffers: CampaignOffer[] = uniqueOffers.map(
        (offer: Offer) => ({
          id: offer.id?.toString() || "",
          name: offer.name,
          description: offer.description || "",
          offer_type: offer.category?.name || "General",
          reward_type: "bundle" as const,
          reward_value: "Special Offer",
          validity_period: 30,
          terms_conditions: "See offer details",
          segments: [],
        }),
      );

      setOffers(campaignOffers);
    } catch (err) {
      console.error("Failed to load offers:", err);
      setError(err instanceof Error ? err.message : "Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  // Define callbacks before the early return
  const handleCreateNew = useCallback(() => {
    // Open the create offer modal instead of navigating
    setCreateOfferModalOpen(true);
  }, []);

  const handleOfferCreated = useCallback(
    (offerId: number) => {
      // Only store valid offer IDs (not undefined, not null, not 0)
      if (offerId === undefined || offerId === null || offerId <= 0) {
        console.warn("Invalid offer ID, skipping storage:", offerId);
        return;
      }

      // Store the created offer ID in sessionStorage so it shows with action buttons
      const campaignFlowOffersStr = sessionStorage.getItem(
        "campaignFlowCreatedOffers",
      );
      let campaignFlowOfferIds: number[] = [];

      try {
        campaignFlowOfferIds = campaignFlowOffersStr
          ? JSON.parse(campaignFlowOffersStr)
          : [];
        // Validate all existing IDs and filter out invalid ones
        campaignFlowOfferIds = campaignFlowOfferIds.filter(
          (id) => id !== undefined && id !== null && id > 0
        );
      } catch (err) {
        console.warn("Failed to parse campaignFlowCreatedOffers, resetting:", err);
        campaignFlowOfferIds = [];
      }

      if (!campaignFlowOfferIds.includes(offerId)) {
        campaignFlowOfferIds.push(offerId);
        sessionStorage.setItem(
          "campaignFlowCreatedOffers",
          JSON.stringify(campaignFlowOfferIds),
        );
      }

      // Reload offers to show newly created offer with action buttons
      loadOffers();
      // Close the create offer modal so you see the created offer in the selection modal
      setCreateOfferModalOpen(false);
    },
    [loadOffers],
  );

  if (!isOpen) return null;

  const filteredOffers = offers.filter((offer) => {
    const matchesSearch =
      offer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (offer.description &&
        offer.description.toLowerCase().includes(searchTerm.toLowerCase()));

    if (selectedFilter === "all") return matchesSearch;
    if (selectedFilter === "bundle")
      return matchesSearch && offer.reward_type === "bundle";
    if (selectedFilter === "discount")
      return matchesSearch && offer.reward_type === "discount";
    if (selectedFilter === "points")
      return matchesSearch && offer.reward_type === "points";
    if (selectedFilter === "cashback")
      return matchesSearch && offer.reward_type === "cashback";

    return matchesSearch;
  });

  // Check if there are any campaign flow offers that need actions
  const campaignFlowOffersStr = sessionStorage.getItem(
    "campaignFlowCreatedOffers",
  );
  const campaignFlowOfferIds: number[] = campaignFlowOffersStr
    ? JSON.parse(campaignFlowOffersStr)
    : [];

  const hasActionableOffers = filteredOffers.some((offer) => {
    const isCampaignFlowOffer = campaignFlowOfferIds.includes(Number(offer.id));
    if (!isCampaignFlowOffer) return false;
    const fullOffer = offersWithStatus.get(Number(offer.id));
    const offerStatus = fullOffer?.status;
    return (
      offerStatus === OfferStatusEnum.DRAFT ||
      offerStatus === OfferStatusEnum.PENDING_APPROVAL
    );
  });

  const handleOfferToggle = (offer: CampaignOffer) => {
    const isSelected = tempSelectedOffers.some((o) => o.id === offer.id);
    if (isSelected) {
      setTempSelectedOffers(
        tempSelectedOffers.filter((o) => o.id !== offer.id),
      );
    } else {
      setTempSelectedOffers([...tempSelectedOffers, offer]);
    }
  };

  const handleConfirm = () => {
    onSelect(tempSelectedOffers);
  };

  const handleSubmitForApproval = async (offerId: number) => {
    if (!user?.user_id) return;

    try {
      setUpdatingOfferId(offerId);
      await offerService.submitForApproval(offerId, {
        updated_by: user.user_id,
      });
      showSuccess("Offer submitted for approval");
      // Reload offers to reflect status change
      await loadOffers();
    } catch (err) {
      console.error("Failed to submit offer for approval:", err);
      showError("Failed to submit offer for approval");
    } finally {
      setUpdatingOfferId(null);
    }
  };

  const handleActivate = async (offerId: number) => {
    if (!user?.user_id) return;

    try {
      setUpdatingOfferId(offerId);
      // First approve if pending, then activate
      const offer = offersWithStatus.get(offerId);
      if (offer?.status === OfferStatusEnum.PENDING_APPROVAL) {
        await offerService.approveOffer(offerId, {
          approved_by: user.user_id,
        });
      }
      // Then activate
      await offerService.updateOfferStatus(offerId, {
        status: OfferStatusEnum.ACTIVE,
        updated_by: user.user_id,
      });
      showSuccess("Offer activated successfully");
      // Reload offers to reflect status change
      await loadOffers();
    } catch (err) {
      console.error("Failed to activate offer:", err);
      showError("Failed to activate offer");
    } finally {
      setUpdatingOfferId(null);
    }
  };

  return createPortal(
    <div
      className="fixed bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: zIndexTokens.overlay,
      }}
    >
      <div
        className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col`}
        style={{ zIndex: zIndexTokens.modal }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-black">
              {editingOffer ? "Edit Offer" : "Select Campaign Offers"}
            </h2>
            <p className="text-sm text-black mt-1">
              Choose offers to include in your campaign
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="px-6 pt-4 space-y-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search offers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border border-gray-300 ${tw.rounded}`}
              />
            </div>
            <div className="w-48">
              <div className="[&_button]:py-2 [&_li]:py-1.5">
                <HeadlessSelect
                  options={filterOptions}
                  value={selectedFilter}
                  onChange={(value: string | number) =>
                    setSelectedFilter(value as string)
                  }
                  placeholder="Filter offers"
                />
              </div>
            </div>
            <button
              onClick={handleCreateNew}
              className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium whitespace-nowrap`}
              style={{
                backgroundColor: color.primary.action,
                color: "white",
              }}
            >
              Create New
            </button>
          </div>
        </div>

        {/* Selection Summary */}
        {tempSelectedOffers.length > 0 && (
          <div className="px-6 flex-shrink-0 my-3">
            <div
              className={`${tw.rounded} p-4 border text-sm text-black bg-white`}
              style={{
                borderColor: color.border.default,
              }}
            >
              <div className="flex items-center justify-between">
                <span>
                  {tempSelectedOffers.length} offer
                  {tempSelectedOffers.length !== 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={() => setTempSelectedOffers([])}
                  className="font-medium text-black hover:opacity-70 transition-opacity"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Offers List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-black">Loading offers...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-black mb-4">{error}</p>
                <button
                  onClick={loadOffers}
                  className={`px-4 py-2 bg-gray-100 text-black ${tw.rounded} hover:bg-gray-200 transition-colors`}
                >
                  Retry
                </button>
              </div>
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-black mb-2">No offers found</p>
                <p className="text-sm text-black">
                  {searchTerm
                    ? "Try adjusting your search terms."
                    : "No offers available at the moment."}
                </p>
              </div>
            </div>
          ) : (
            <div
              className={`border ${tw.rounded} overflow-hidden`}
              style={{ borderColor: color.border.default }}
            >
              <table
                className="min-w-full divide-y"
                style={{ borderColor: color.border.default }}
              >
                <thead style={{ backgroundColor: color.surface.cards }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      Select
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Offer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Value
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Status
                    </th>
                    {hasActionableOffers && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody
                  className="bg-white divide-y"
                  style={{ borderColor: color.border.default }}
                >
                  {filteredOffers.map((offer) => {
                    const isSelected = tempSelectedOffers.some(
                      (o) => o.id === offer.id,
                    );
                    const fullOffer = offersWithStatus.get(Number(offer.id));
                    const offerStatus = fullOffer?.status;
                    const isDraft = offerStatus === OfferStatusEnum.DRAFT;
                    const isPending =
                      offerStatus === OfferStatusEnum.PENDING_APPROVAL;
                    const isUpdating = updatingOfferId === Number(offer.id);

                    return (
                      <tr
                        key={offer.id}
                        onClick={() => handleOfferToggle(offer)}
                        className="cursor-pointer transition-colors hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleOfferToggle(offer)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 border-gray-400 rounded"
                            style={{ accentColor: "#111827" }}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-black truncate">
                            {offer.name}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-black">
                            {offer.reward_type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-black">
                            {offer.reward_value}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-black">
                            {offer.validity_period}d
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-black">
                            {offerStatus || "Unknown"}
                          </span>
                        </td>
                        {hasActionableOffers && (
                          <td
                            className="px-4 py-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {(() => {
                              // Only show action buttons for offers created during this campaign flow
                              const isCampaignFlowOffer =
                                campaignFlowOfferIds.includes(Number(offer.id));

                              if (!isCampaignFlowOffer) {
                                return null;
                              }

                              if (isDraft) {
                                return (
                                  <button
                                    onClick={() =>
                                      handleSubmitForApproval(Number(offer.id))
                                    }
                                    disabled={isUpdating}
                                    className={`inline-flex items-center px-3 py-1.5 text-sm font-medium ${tw.rounded} text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
                                    style={{
                                      backgroundColor: color.primary.action,
                                    }}
                                  >
                                    {isUpdating ? (
                                      <>
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                        Submitting...
                                      </>
                                    ) : (
                                      <>
                                        Submit for Approval
                                      </>
                                    )}
                                  </button>
                                );
                              }

                              if (isPending) {
                                return (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() =>
                                        handleActivate(Number(offer.id))
                                      }
                                      disabled={isUpdating}
                                      className={`inline-flex items-center px-3 py-1.5 text-sm font-medium ${tw.rounded} text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
                                      style={{
                                        backgroundColor: color.primary.action,
                                      }}
                                    >
                                      {isUpdating ? (
                                        <>
                                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                          Activating...
                                        </>
                                      ) : (
                                        <>
                                          Activate
                                        </>
                                      )}
                                    </button>
                                  </div>
                                );
                              }

                              return null;
                            })()}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 flex-shrink-0">
          <div className="text-sm text-gray-500">
            {tempSelectedOffers.length} of {filteredOffers.length} offers
            selected
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-colors`}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={tempSelectedOffers.length === 0}
              className={`px-5 py-2 ${tw.rounded} text-sm font-medium ${
                tempSelectedOffers.length === 0 ? "cursor-not-allowed" : ""
              }`}
              style={{
                backgroundColor:
                  tempSelectedOffers.length > 0
                    ? color.primary.action
                    : color.interactive.disabled,
                color:
                  tempSelectedOffers.length === 0 ? color.text.muted : "white",
              }}
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </div>

      {/* Create Offer Modal */}
      <Suspense fallback={null}>
        <CreateOfferModalWrapper
          isOpen={createOfferModalOpen}
          onClose={() => setCreateOfferModalOpen(false)}
          onOfferCreated={handleOfferCreated}
        />
      </Suspense>
    </div>,
    document.body,
  );
}
