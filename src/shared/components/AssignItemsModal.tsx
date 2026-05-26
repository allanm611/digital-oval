import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  X,
  Check,
  CheckCircle2,
  MessageSquare,
  Package,
  Users,
} from "lucide-react";
import SearchInput from "./ui/SearchInput";
import Checkbox from "./ui/Checkbox";
import { color, tw, zIndex, button, getButtonStyles } from "../utils/utils";
import { useToast } from "../../contexts/ToastContext";
import { extractBackendError } from "../utils/errorHandler";;;
import { useConfirm } from "../../contexts/ConfirmContext";
import { useRemoveFromCatalog } from "../hooks/useRemoveFromCatalog";
import LoadingSpinner from "./ui/LoadingSpinner";
import HeadlessSelect from "./ui/HeadlessSelect";
import { offerService } from "../../features/offers/services/offerService";
import { productService } from "../../features/products/services/productService";
import { segmentService } from "../../features/segments/services/segmentService";
import { offerCategoryService } from "../../features/offers/services/offerCategoryService";
import { productCategoryService } from "../../features/products/services/productCategoryService";
import { campaignService } from "../../features/campaigns/services/campaignService";
import { buildCatalogTag } from "../utils/catalogTags";
import { formatDateWithTimezone } from "../services/dateService";
import { getSettingsTimezoneOffset } from "../utils/settingsHelper";
import {
  Offer,
  OfferStatusEnum,
  OfferTypeEnum,
  UpdateOfferRequest,
} from "../../features/offers/types/offer";
import { Product } from "../../features/products/types/product";
import {
  Segment,
  UpdateSegmentRequest,
} from "../../features/segments/types/segment";
import { BackendCampaignType } from "../../features/campaigns/types/campaign";

type ItemType = "offers" | "products" | "segments" | "campaigns";

interface AssignItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalogId: number | string;
  itemType: ItemType;
  onAssignComplete?: () => void;
}

function AssignItemsModal({
  isOpen,
  onClose,
  catalogId,
  itemType,
  onAssignComplete,
}: AssignItemsModalProps) {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  const { confirm } = useConfirm();
  const { removeFromCatalog, removingId } = useRemoveFromCatalog();

  const [items, setItems] = useState<
    (Offer | Product | Segment | BackendCampaignType)[]
  >([]);
  const [assignedItemIds, setAssignedItemIds] = useState<(number | string)[]>(
    []
  );
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number | string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [assigningItemIds, setAssigningItemIds] = useState<Set<number | string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState<
    (Offer | Product | Segment | BackendCampaignType)[]
  >([]);
  const [catalogName, setCatalogName] = useState("");
  const [showPrimaryCategoryModal, setShowPrimaryCategoryModal] = useState(false);
  const [primaryCategoryItemId, setPrimaryCategoryItemId] = useState<
    number | string | null
  >(null);

  // Filter states
  const [filters, setFilters] = useState<{
    status?: string;
    type?: string;
    isActive?: boolean | null;
  }>({});

  // Get item type display info
  const getItemTypeInfo = () => {
    switch (itemType) {
      case "offers":
        return {
          singular: "offer",
          plural: "offers",
          icon: <MessageSquare className="w-5 h-5" />,
          title: "Assign Offers",
        };
      case "products":
        return {
          singular: "product",
          plural: "products",
          icon: <Package className="w-5 h-5" />,
          title: "Assign Products",
        };
      case "segments":
        return {
          singular: "segment",
          plural: "segments",
          icon: <Users className="w-5 h-5" />,
          title: "Assign Segments",
        };
      case "campaigns":
        return {
          singular: "campaign",
          plural: "campaigns",
          icon: <MessageSquare className="w-5 h-5" />,
          title: "Assign Campaigns",
        };
    }
  };

  const typeInfo = getItemTypeInfo();

  // Load catalog name
  useEffect(() => {
    const loadCatalogName = async () => {
      if (!catalogId) return;

      try {
        let catalog;
        switch (itemType) {
          case "offers":
            catalog = await offerCategoryService.getCategoryById(
              Number(catalogId),
              true
            );
            setCatalogName(catalog.data?.name || "");
            break;
          case "products":
            catalog = await productCategoryService.getCategoryById(
              Number(catalogId),
              true
            );
            setCatalogName(catalog.data?.name || "");
            break;
          case "segments":
            catalog = await segmentService.getSegmentCategoryById(
              Number(catalogId),
              true
            );
            setCatalogName(catalog.data?.name || "");
            break;
          case "campaigns": {
            const campaignCatalog =
              await campaignService.getCampaignCategoryById(
                Number(catalogId),
                true
              );
            setCatalogName(
              (campaignCatalog as { data?: { name?: string } })?.data?.name ||
                ""
            );
            break;
          }
        }
      } catch {
        // Failed to load catalog name
      }
    };

    if (isOpen) {
      loadCatalogName();
    }
  }, [catalogId, itemType, isOpen]);

  // Load all items
  useEffect(() => {
    if (!isOpen) return;

    const loadItems = async () => {
      try {
        setLoading(true);
        let response;
        let itemsData: (Offer | Product | Segment | BackendCampaignType)[] = [];

        switch (itemType) {
          case "offers":
            response = await offerService.searchOffers({
              limit: 100,
              skipCache: true,
            });
            itemsData = (response.data || []).filter(
              (offer: Offer) => offer.status !== "archived"
            ) as Offer[];
            break;
          case "products":
            response = await productService.getAllProducts({
              limit: 100,
              skipCache: true,
            });
            itemsData = (response.data || []) as Product[];
            break;
          case "segments":
            response = await segmentService.getSegments({
              skipCache: true,
            });
            if (
              response &&
              typeof response === "object" &&
              "data" in response
            ) {
              itemsData = (
                Array.isArray(response.data) ? response.data : []
              ) as Segment[];
            } else if (Array.isArray(response)) {
              itemsData = response as Segment[];
            } else {
              itemsData = [];
            }
            break;
          case "campaigns": {
            let allCampaigns: BackendCampaignType[] = [];
            let offset = 0;
            const limit = 100;
            let hasMore = true;

            while (hasMore) {
              const batchResponse = await campaignService.getCampaigns({
                limit: limit,
                offset: offset,
                skipCache: true,
              });

              const campaigns = (batchResponse.data ||
                []) as BackendCampaignType[];
              allCampaigns = [...allCampaigns, ...campaigns];

              const total = batchResponse.meta?.total || 0;
              hasMore =
                allCampaigns.length < total && campaigns.length === limit;
              offset += limit;
            }

            // Filter out archived campaigns
            itemsData = allCampaigns.filter(
              (campaign: BackendCampaignType) => campaign.status !== "archived"
            );
            break;
          }
        }

        setItems(itemsData);

        // Load assigned items for this catalog
        const loadAssignedItems = async () => {
          if (!catalogId) return;

          try {
            let assigned: (number | string)[] = [];
            switch (itemType) {
              case "offers": {
                const offersResponse =
                  await offerCategoryService.getCategoryOffers(
                    Number(catalogId),
                    { limit: 100, skipCache: true }
                  );
                const offers = (offersResponse.data || []) as Offer[];
                const assignedSet = new Set<number | string>(
                  offers.map((offer) => offer.id)
                );
                const catalogTag = buildCatalogTag(catalogId);
                (itemsData as Offer[]).forEach((offer) => {
                  if (
                    Array.isArray(offer.tags) &&
                    offer.tags.includes(catalogTag)
                  ) {
                    assignedSet.add(offer.id);
                  }
                });
                assigned = Array.from(assignedSet);
                break;
              }
              case "products": {
                const catalogTag = buildCatalogTag(catalogId);
                const [productsResponse, taggedResponse] = await Promise.all([
                  productService.getProductsByCategory(Number(catalogId), {
                    limit: 100,
                    skipCache: true,
                  }),
                  productService.getProductsByTag({
                    tag: catalogTag,
                    limit: 100,
                    skipCache: true,
                  }),
                ]);

                const assignedSet = new Set<number | string>();
                (productsResponse.data || []).forEach((product: Product) => {
                  if (product?.id !== undefined) {
                    assignedSet.add(product.id);
                  }
                });
                (taggedResponse.data || []).forEach((product: Product) => {
                  if (product?.id !== undefined) {
                    assignedSet.add(product.id);
                  }
                });

                assigned = Array.from(assignedSet);
                break;
              }
              case "segments": {
                try {
                  const segmentsResponse =
                    await segmentService.getSegmentsByCategory(
                      Number(catalogId),
                      { skipCache: true }
                    );
                  let categorySegments: Segment[] = [];
                  if (
                    segmentsResponse &&
                    typeof segmentsResponse === "object" &&
                    "data" in segmentsResponse
                  ) {
                    categorySegments = Array.isArray(segmentsResponse.data)
                      ? (segmentsResponse.data as Segment[])
                      : [];
                  } else if (Array.isArray(segmentsResponse)) {
                    categorySegments = segmentsResponse as Segment[];
                  }
                  const assignedSet = new Set<number | string>(
                    categorySegments.map((s: Segment) => s.id)
                  );
                  const catalogTag = buildCatalogTag(catalogId);
                  (itemsData as Segment[]).forEach((segment) => {
                    if (
                      Array.isArray(segment.tags) &&
                      segment.tags.includes(catalogTag)
                    ) {
                      assignedSet.add(segment.id);
                    }
                  });
                  assigned = Array.from(assignedSet);
                } catch {
                  try {
                    const allSegmentsResponse =
                      await segmentService.getSegments({
                        skipCache: true,
                      });
                    let allSegments: Segment[] = [];
                    if (
                      allSegmentsResponse &&
                      typeof allSegmentsResponse === "object" &&
                      "data" in allSegmentsResponse
                    ) {
                      allSegments = Array.isArray(allSegmentsResponse.data)
                        ? (allSegmentsResponse.data as Segment[])
                        : [];
                    } else if (Array.isArray(allSegmentsResponse)) {
                      allSegments = allSegmentsResponse as Segment[];
                    }
                    assigned = allSegments
                      .filter(
                        (s: Segment) =>
                          (s.category &&
                            String(s.category) === String(catalogId)) ||
                          (Array.isArray(s.tags) &&
                            s.tags.includes(buildCatalogTag(catalogId)))
                      )
                      .map((s: Segment) => s.id);
                  } catch {
                    assigned = [];
                  }
                }
                break;
              }
              case "campaigns": {
                try {
                  const campaignsResponse =
                    await campaignService.getCampaignsByCategory(
                      Number(catalogId),
                      { limit: 100, skipCache: true }
                    );
                  const campaigns = (campaignsResponse.data ||
                    []) as BackendCampaignType[];
                  const assignedSet = new Set<number | string>(
                    campaigns.map((campaign) => campaign.id)
                  );
                  const catalogTag = buildCatalogTag(catalogId);
                  (itemsData as BackendCampaignType[]).forEach((campaign) => {
                    if (
                      Array.isArray(campaign.tags) &&
                      campaign.tags.includes(catalogTag)
                    ) {
                      assignedSet.add(campaign.id);
                    }
                    if (
                      campaign.category_id &&
                      Number(campaign.category_id) === Number(catalogId)
                    ) {
                      assignedSet.add(campaign.id);
                    }
                  });
                  assigned = Array.from(assignedSet);
                } catch {
                  const catalogTag = buildCatalogTag(catalogId);
                  assigned = (itemsData as BackendCampaignType[])
                    .filter(
                      (campaign) =>
                        (campaign.category_id &&
                          Number(campaign.category_id) === Number(catalogId)) ||
                        (Array.isArray(campaign.tags) &&
                          campaign.tags.includes(catalogTag))
                    )
                    .map((campaign) => campaign.id);
                }
                break;
              }
            }
            setAssignedItemIds(assigned);
            setSelectedItemIds(new Set());
          } catch {
            setAssignedItemIds([]);
            setSelectedItemIds(new Set());
          }
        };

        await loadAssignedItems();
      } catch (err) {
        showError(
          `Failed to load ${typeInfo.plural}`,
          err instanceof Error ? err.message : "Unknown error"
        );
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [itemType, catalogId, isOpen]);

  // Filter items based on search and filters
  useEffect(() => {
    let filtered = items;

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (item) =>
          (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.description &&
            item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (itemType === "offers") {
      if (filters.status) {
        filtered = filtered.filter(
          (item) => (item as Offer).status === filters.status
        );
      }
      if (filters.type) {
        filtered = filtered.filter(
          (item) => (item as Offer).offer_type === filters.type
        );
      }
    } else if (itemType === "segments") {
      if (filters.type) {
        filtered = filtered.filter(
          (item) => (item as Segment).type === filters.type
        );
      }
      if (filters.isActive !== null && filters.isActive !== undefined) {
        filtered = filtered.filter(
          (item) => (item as Segment).is_active === filters.isActive
        );
      }
    } else if (itemType === "products") {
      if (filters.isActive !== null && filters.isActive !== undefined) {
        filtered = filtered.filter(
          (item) => (item as Product).is_active === filters.isActive
        );
      }
    }

    setFilteredItems(filtered);
  }, [searchTerm, items, filters, itemType]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setSelectedItemIds(new Set());
      setFilters({});
      setAssigningItemIds(new Set());
    }
  }, [isOpen]);

  // Handle select all
  const handleSelectAll = () => {
    const availableItems = filteredItems.filter(
      (item) => !assignedItemIds.includes(item.id)
    );

    if (selectedItemIds.size === availableItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(availableItems.map((item) => item.id)));
    }
  };

  // Handle individual selection
  const handleToggleSelection = (itemId: number | string) => {
    if (assignedItemIds.includes(itemId)) {
      return;
    }

    setSelectedItemIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Handle adding a single item
  const handleAddSingleItem = async (itemId: number | string) => {
    if (!catalogId) {
      showError("Catalog ID not found");
      return;
    }

    try {
      setAssigningItemIds((prev) => new Set([...prev, itemId]));
      const ids = [Number(itemId)];
      const catalogIdNumber = Number(catalogId);
      const catalogTag = buildCatalogTag(catalogIdNumber);

      // Step 1: Batch assign category_id
      switch (itemType) {
        case "segments":
          await segmentService.batchAssignCategory(ids, catalogIdNumber);
          break;
        case "products":
          await productService.batchAssignCategory(ids, catalogIdNumber);
          break;
        case "offers":
          await offerService.batchAssignCategory(ids, catalogIdNumber);
          break;
        case "campaigns":
          await campaignService.batchAssignCategory(ids, catalogIdNumber);
          break;
      }

      // Step 2: Add catalog tags to items (will be removed when backend supports batch tags)
      let tagSuccess = 0;
      let tagFailed = 0;
      for (const itemId of ids) {
        try {
          const item = items.find((i) => i.id === itemId);
          if (!item) continue;

          const existingTags = Array.isArray(item.tags) ? item.tags : [];
          if (existingTags.includes(catalogTag)) continue;

          const updatedTags = [...existingTags, catalogTag];

          switch (itemType) {
            case "offers": {
              const offer = item as Offer;
              await offerService.updateOffer(Number(itemId), { tags: updatedTags });
              break;
            }
            case "products": {
              await productService.addProductTag(Number(itemId), catalogTag);
              break;
            }
            case "segments": {
              const segment = item as Segment;
              await segmentService.updateSegment(Number(itemId), { tags: updatedTags });
              break;
            }
            case "campaigns": {
              const campaign = item as BackendCampaignType;
              await campaignService.updateCampaign(Number(itemId), { tags: updatedTags });
              break;
            }
          }
          tagSuccess++;
        } catch {
          tagFailed++;
        }
      }

      if (tagSuccess > 0 || tagFailed === 0) {
        showSuccess(`${typeInfo.singular} assigned successfully`);
        setAssignedItemIds((prev) =>
          Array.from(new Set([...prev, itemId]))
        );
        onAssignComplete?.();
      } else {
        showError(
          `Failed to assign ${typeInfo.singular}. Please try again.`
        );
      }
    } catch (err) {
      showError(
        `Failed to assign ${typeInfo.singular}`,
        err instanceof Error ? err.message : "Unknown error"
      );
    } finally {
      setAssigningItemIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Handle assignment for bulk selections
  const handleAssignSelected = async () => {
    if (!catalogId || selectedItemIds.size === 0) {
      showError("Please select items to assign");
      return;
    }

    try {
      setAssigning(true);
      const ids = Array.from(selectedItemIds).map((id) => Number(id));
      const catalogIdNumber = Number(catalogId);
      const catalogTag = buildCatalogTag(catalogIdNumber);

      // Step 1: Batch assign category_id
      switch (itemType) {
        case "segments":
          await segmentService.batchAssignCategory(ids, catalogIdNumber);
          break;
        case "products":
          await productService.batchAssignCategory(ids, catalogIdNumber);
          break;
        case "offers":
          await offerService.batchAssignCategory(ids, catalogIdNumber);
          break;
        case "campaigns":
          await campaignService.batchAssignCategory(ids, catalogIdNumber);
          break;
      }

      // Step 2: Add catalog tags to items (will be removed when backend supports batch tags)
      let tagSuccess = 0;
      let tagFailed = 0;
      for (const itemId of ids) {
        try {
          const item = items.find((i) => i.id === itemId);
          if (!item) continue;

          const existingTags = Array.isArray(item.tags) ? item.tags : [];
          if (existingTags.includes(catalogTag)) continue;

          const updatedTags = [...existingTags, catalogTag];

          switch (itemType) {
            case "offers": {
              const offer = item as Offer;
              await offerService.updateOffer(Number(itemId), { tags: updatedTags });
              break;
            }
            case "products": {
              await productService.addProductTag(Number(itemId), catalogTag);
              break;
            }
            case "segments": {
              const segment = item as Segment;
              await segmentService.updateSegment(Number(itemId), { tags: updatedTags });
              break;
            }
            case "campaigns": {
              const campaign = item as BackendCampaignType;
              await campaignService.updateCampaign(Number(itemId), { tags: updatedTags });
              break;
            }
          }
          tagSuccess++;
        } catch {
          tagFailed++;
        }
      }

      if (tagSuccess > 0 || tagFailed === 0) {
        showSuccess(`${ids.length} ${typeInfo.plural} assigned successfully`);
        setAssignedItemIds((prev) =>
          Array.from(new Set([...prev, ...ids]))
        );
        setSelectedItemIds(new Set());
        onAssignComplete?.();
      } else {
        showError(
          `Failed to assign ${typeInfo.plural}. Please try again.`
        );
      }
    } catch (err) {
      showError(
        `Failed to assign ${typeInfo.plural}`,
        err instanceof Error ? err.message : "Unknown error"
      );
    } finally {
      setAssigning(false);
    }
  };

  // Handle removal - uses confirmation modal first
  const handleRemoveItem = async (itemId: number | string) => {
    if (!catalogId || !typeInfo) return;

    const catalogIdNumber = Number(catalogId);
    const catalogTag = buildCatalogTag(
      Number.isNaN(catalogIdNumber) ? catalogId || "" : catalogIdNumber
    );

    // Get the appropriate service methods based on item type
    const getEntityById = async (id: number) => {
      switch (itemType) {
        case "offers":
          return offerService.getOfferById(id);
        case "products":
          return productService.getProductById(id, true);
        case "segments":
          return segmentService.getSegmentById(id);
        case "campaigns":
          return campaignService.getCampaignById(id, true);
      }
    };

    const updateEntity = async (id: number, updates: Record<string, unknown>) => {
      switch (itemType) {
        case "offers":
          return offerService.updateOffer(id, updates as UpdateOfferRequest);
        case "products":
          return productService.updateProduct(id, updates);
        case "segments":
          return segmentService.updateSegment(id, updates as UpdateSegmentRequest);
        case "campaigns":
          return campaignService.updateCampaign(id, updates as Partial<BackendCampaignType>);
      }
    };

    const removeEntityTag = async (id: number, tag: string) => {
      if (itemType === "products") {
        return productService.removeProductTag(id, tag);
      }
    };

    // Callback to show the custom primary category warning modal
    const handleShowPrimaryCategoryWarning = async (
      entityId: number | string
    ) => {
      setShowPrimaryCategoryModal(true);
      setPrimaryCategoryItemId(entityId);
    };

    // Callback to update local state after successful removal
    const handleRemoveSuccess = () => {
      setAssignedItemIds((prev) => prev.filter((id) => id !== itemId));
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === itemId) {
            return {
              ...item,
              tags: Array.isArray(item.tags)
                ? item.tags.filter((tag) => tag !== catalogTag)
                : [],
            };
          }
          return item;
        })
      );
      onAssignComplete?.();
    };

    // Call the hook's removeFromCatalog function
    await removeFromCatalog({
      entityType: itemType as "offer" | "product" | "segment" | "campaign",
      entityId: itemId,
      categoryId: catalogId,
      categoryName: catalogName || "Catalog",
      getEntityById,
      updateEntity,
      removeEntityTag,
      onSuccess: handleRemoveSuccess,
      onShowPrimaryCategoryWarning: handleShowPrimaryCategoryWarning,
    });
  };

  // Handle navigation to item details page to change primary category
  const handleNavigateToChangeCategory = () => {
    if (!primaryCategoryItemId) return;

    const detailsRoute = {
      offers: `/dashboard/offers/${primaryCategoryItemId}`,
      products: `/dashboard/products/${primaryCategoryItemId}`,
      segments: `/dashboard/segments/${primaryCategoryItemId}`,
      campaigns: `/dashboard/campaigns/${primaryCategoryItemId}`,
    };

    setShowPrimaryCategoryModal(false);
    setPrimaryCategoryItemId(null);
    onClose(); // Close the assign modal
    navigate(detailsRoute[itemType]);
  };

  // Get status display
  const getStatusDisplay = (
    item: Offer | Product | Segment | BackendCampaignType
  ) => {
    if (itemType === "offers") {
      const offer = item as Offer;
      return offer.status || "unknown";
    } else if (itemType === "products") {
      const product = item as Product;
      return product.is_active ? "active" : "inactive";
    } else if (itemType === "campaigns") {
      const campaign = item as BackendCampaignType;
      return campaign.status || "unknown";
    } else {
      const segment = item as Segment;
      return segment.is_active ? "active" : "inactive";
    }
  };

  // Get type display
  const getTypeDisplay = (
    item: Offer | Product | Segment | BackendCampaignType
  ) => {
    if (itemType === "offers") {
      const offer = item as Offer;
      return offer.offer_type || "N/A";
    } else if (itemType === "products") {
      return "N/A";
    } else if (itemType === "campaigns") {
      const campaign = item as BackendCampaignType;
      return campaign.campaign_type || "N/A";
    } else {
      const segment = item as Segment;
      return segment.type || "N/A";
    }
  };

  // Get created at display
  const getCreatedAtDisplay = (
    item: Offer | Product | Segment | BackendCampaignType
  ) => {
    const createdAt =
      (item as Offer).created_at ||
      (item as Product).created_at ||
      (item as Segment).created_at ||
      (item as BackendCampaignType).created_at;
    return createdAt ? formatDateWithTimezone(new Date(createdAt), getSettingsTimezoneOffset()) : "N/A";
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    return (
      <span className="text-sm font-medium capitalize text-gray-700">
        {status}
      </span>
    );
  };

  const availableItems = filteredItems.filter(
    (item) => !assignedItemIds.includes(item.id)
  );
  const allSelected =
    availableItems.length > 0 &&
    availableItems.every((item) => selectedItemIds.has(item.id));

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 overflow-y-auto"
      style={{ zIndex: zIndex.modal }}
    >
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div
          className={`relative bg-white ${tw.rounded} shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col`}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 border-b border-gray-200">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                {typeInfo.title} to {catalogName || "Catalog"}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Select {typeInfo.plural} to assign to this catalog
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors flex-shrink-0`}
              title="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Search and Filters */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row items-center gap-4 flex-wrap">
              {/* Search Bar */}
              <div className="flex-1 w-full sm:w-auto min-w-[200px]">
                <SearchInput
                  placeholder={`Search ${typeInfo.plural}...`}
                  value={searchTerm}
                  onChange={(value) => setSearchTerm(value)}
                />
              </div>

              {/* Inline Filters */}
              {itemType === "offers" && (
                <>
                  <HeadlessSelect
                    options={[
                      { value: "", label: "All Statuses" },
                      ...Object.values(OfferStatusEnum).map((status) => ({
                        value: status,
                        label: status
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase()),
                      })),
                    ]}
                    value={filters.status || ""}
                    onChange={(value) =>
                      setFilters({
                        ...filters,
                        status: value === "" ? undefined : String(value),
                      })
                    }
                    placeholder="All Statuses"
                    className="w-full sm:w-48"
                    zIndex={zIndex.popover}
                  />
                  <HeadlessSelect
                    options={[
                      { value: "", label: "All Types" },
                      ...Object.values(OfferTypeEnum).map((type) => ({
                        value: type,
                        label: type.charAt(0).toUpperCase() + type.slice(1),
                      })),
                    ]}
                    value={filters.type || ""}
                    onChange={(value) =>
                      setFilters({
                        ...filters,
                        type: value === "" ? undefined : String(value),
                      })
                    }
                    placeholder="All Types"
                    className="w-full sm:w-48"
                    zIndex={zIndex.popover}
                  />
                </>
              )}

              {itemType === "segments" && (
                <>
                  <HeadlessSelect
                    options={[
                      { value: "", label: "All Types" },
                      { value: "static", label: "Static" },
                      { value: "dynamic", label: "Dynamic" },
                      { value: "trigger", label: "Trigger" },
                    ]}
                    value={filters.type || ""}
                    onChange={(value) =>
                      setFilters({
                        ...filters,
                        type: value === "" ? undefined : String(value),
                      })
                    }
                    placeholder="All Types"
                    className="w-full sm:w-48"
                    zIndex={zIndex.popover}
                  />
                  <HeadlessSelect
                    options={[
                      { value: "", label: "All Statuses" },
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" },
                    ]}
                    value={
                      filters.isActive === null ||
                      filters.isActive === undefined
                        ? ""
                        : filters.isActive
                        ? "active"
                        : "inactive"
                    }
                    onChange={(value) =>
                      setFilters({
                        ...filters,
                        isActive: value === "" ? null : value === "active",
                      })
                    }
                    placeholder="All Statuses"
                    className="w-full sm:w-48"
                    zIndex={zIndex.popover}
                  />
                </>
              )}

              {itemType === "products" && (
                <HeadlessSelect
                  options={[
                    { value: "", label: "All Statuses" },
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                  value={
                    filters.isActive === null || filters.isActive === undefined
                      ? ""
                      : filters.isActive
                      ? "active"
                      : "inactive"
                  }
                  onChange={(value) =>
                    setFilters({
                      ...filters,
                      isActive: value === "" ? null : value === "active",
                    })
                  }
                  placeholder="All Statuses"
                  className="w-full sm:w-48"
                  zIndex={zIndex.popover}
                />
              )}

              {/* Count and Assign Button */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 whitespace-nowrap">
                  {selectedItemIds.size} {typeInfo.plural} selected
                </span>
                <button
                  onClick={handleAssignSelected}
                  disabled={assigning || selectedItemIds.size === 0}
                  className={`px-5 py-2.5 text-white ${tw.rounded} font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap`}
                  style={{
                    backgroundColor:
                      assigning || selectedItemIds.size === 0
                        ? color.primary.action + "80"
                        : color.primary.action,
                  }}
                >
                  {assigning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Assigning...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Assign Selected ({selectedItemIds.size})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {searchTerm
                    ? `No ${typeInfo.plural} found matching "${searchTerm}"`
                    : `No ${typeInfo.plural} available`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead
                    className="border-b border-gray-200"
                    style={{ background: color.surface.tableHeader }}
                  >
                    <tr>
                      <th
                        className="px-3 sm:px-6 py-3 text-left text-sm font-medium uppercase tracking-wider"
                        style={{ color: color.surface.tableHeaderText }}
                      >
                        <div className="flex items-center gap-2 cursor-pointer" onClick={(e) => {
                          if (!availableItems.length > 0) return;
                          const availableForClick = filteredItems.filter((item) => !assignedItemIds.includes(item.id));
                          if (selectedItemIds.size === availableForClick.length) {
                            setSelectedItemIds(new Set());
                          } else {
                            setSelectedItemIds(new Set(availableForClick.map((item) => item.id)));
                          }
                        }}>
                          <Checkbox
                            id="select-all-items"
                            checked={allSelected}
                            onChange={handleSelectAll}
                            disabled={availableItems.length === 0}
                          />
                          <span className="hidden sm:inline text-sm font-medium uppercase tracking-wider" style={{ color: color.surface.tableHeaderText }}>
                            Select All
                          </span>
                        </div>
                      </th>
                      <th
                        className="px-3 sm:px-6 py-3 text-left text-sm font-medium uppercase tracking-wider"
                        style={{ color: color.surface.tableHeaderText }}
                      >
                        Name
                      </th>
                      <th
                        className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell"
                        style={{ color: color.surface.tableHeaderText }}
                      >
                        Description
                      </th>
                      <th
                        className="px-3 sm:px-6 py-3 text-left text-sm font-medium uppercase tracking-wider"
                        style={{ color: color.surface.tableHeaderText }}
                      >
                        Status
                      </th>
                      {itemType !== "products" && itemType !== "campaigns" && (
                        <th
                          className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden lg:table-cell"
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          Type
                        </th>
                      )}
                      {/* {itemType === "campaigns" && (
                        <th
                          className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden lg:table-cell"
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          Campaign Type
                        </th>
                      )} */}
                      <th
                        className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden xl:table-cell"
                        style={{ color: color.surface.tableHeaderText }}
                      >
                        Created At
                      </th>
                      <th
                        className="px-3 sm:px-6 py-3 text-left text-sm font-medium uppercase tracking-wider"
                        style={{ color: color.surface.tableHeaderText }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map((item) => {
                      const isAssigned = assignedItemIds.includes(item.id);
                      const isSelected =
                        !isAssigned && selectedItemIds.has(item.id);

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-3 sm:px-6 py-4">
                            <label className="flex items-center cursor-pointer">
                              <Checkbox
                                id={`item-${item.id}`}
                                checked={isSelected}
                                onChange={() => handleToggleSelection(item.id)}
                                disabled={isAssigned}
                              />
                            </label>
                          </td>
                          <td
                            className={`px-3 sm:px-6 py-4 ${
                              !isAssigned ? "cursor-pointer" : ""
                            }`}
                            onClick={() => {
                              if (!isAssigned) {
                                handleToggleSelection(item.id);
                              }
                            }}
                          >
                            <div>
                              <div className="font-semibold text-sm text-gray-900 truncate max-w-[200px] sm:max-w-none">
                                {item.name}
                              </div>
                              {isAssigned && (
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block"
                                  style={{
                                    backgroundColor: color.primary.accent,
                                    color: "#FFFFFF",
                                  }}
                                >
                                  Already in catalog
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 hidden md:table-cell">
                            <p className="text-sm text-gray-600 line-clamp-2 max-w-md">
                              {item.description || "No description"}
                            </p>
                          </td>
                          <td className="px-3 sm:px-6 py-4">
                            {getStatusBadge(getStatusDisplay(item))}
                          </td>
                          {itemType !== "products" &&
                            itemType !== "campaigns" && (
                              <td className="px-3 sm:px-6 py-4 hidden lg:table-cell">
                                <span className="px-2.5 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 capitalize">
                                  {getTypeDisplay(item)}
                                </span>
                              </td>
                            )}
                          {/* {itemType === "campaigns" && (
                            <td className="px-3 sm:px-6 py-4 hidden lg:table-cell">
                              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                                {getTypeDisplay(item)}
                              </span>
                            </td>
                          )} */}
                          <td className="px-3 sm:px-6 py-4 text-sm text-gray-600 hidden xl:table-cell">
                            {getCreatedAtDisplay(item)}
                          </td>
                          <td className="px-3 sm:px-6 py-4">
                            {isAssigned ? (
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={removingId === item.id}
                                style={getButtonStyles(button.bordered)}
                                className="min-w-24 transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
                                title={`Remove ${typeInfo.singular} from catalog`}
                              >
                                {removingId === item.id
                                  ? "Removing..."
                                  : "Remove"}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAddSingleItem(item.id)}
                                disabled={assigningItemIds.has(item.id)}
                                style={getButtonStyles(button.action)}
                                className="min-w-24 transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                                title={`Add ${typeInfo.singular} to catalog`}
                              >
                                {assigningItemIds.has(item.id) ? "Adding..." : "Add"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Primary Category Warning Modal */}
      {showPrimaryCategoryModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: zIndex.popover }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Primary Catalog
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              This catalog is the {typeInfo?.singular}'s primary catalog.
              Update the {typeInfo?.singular} to use a different primary
              catalog before removing it here.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowPrimaryCategoryModal(false);
                  setPrimaryCategoryItemId(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleNavigateToChangeCategory}
                className="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors"
                style={{ backgroundColor: color.primary.action }}
              >
                Change Primary Catalog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

export default AssignItemsModal;
