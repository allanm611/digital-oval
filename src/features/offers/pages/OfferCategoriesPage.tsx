import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Edit,
  Trash2,
  MessageSquare,
  Grid,
  List,
  FolderOpen,
  CheckCircle,
  XCircle,
  Filter,
  Archive,
  Star,
  X,
  Power,
  PowerOff,
} from "lucide-react";
import CatalogItemsModal from "../../../shared/components/CatalogItemsModal";
import { color, tw, button } from "../../../shared/utils/utils";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { zIndex } from "../../../shared/utils/tokens";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useRemoveFromCatalog } from "../../../shared/hooks/useRemoveFromCatalog";
import { offerCategoryService } from "../services/offerCategoryService";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
// import BackButton from "../../../shared/components/ui/BackButton";
import { offerService } from "../services/offerService";
import CurrencyFormatter from "../../../shared/components/CurrencyFormatter";
import {
  OfferCategoryType,
  CreateOfferCategoryRequest,
  UpdateOfferCategoryRequest,
} from "../types/offerCategory";
import { Offer, UpdateOfferRequest } from "../types/offer";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import CreateButton from "../../../shared/components/ui/CreateButton";
import Pagination from "../../../shared/components/ui/Pagination";
import { PermissionGate } from "../../auth/components/PermissionGate";
import Radio from "../../../shared/components/ui/Radio";

const CATALOG_TAG_PREFIX = "catalog:";

const buildCatalogTag = (categoryId: number | string) =>
  `${CATALOG_TAG_PREFIX}${categoryId}`;

const parseCatalogTag = (tag?: string): number | null => {
  if (!tag || !tag.startsWith(CATALOG_TAG_PREFIX)) {
    return null;
  }
  const value = tag.slice(CATALOG_TAG_PREFIX.length);
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const fetchAllOffers = async (): Promise<Offer[]> => {
  const limit = 100;
  let offset = 0;
  const offers: Offer[] = [];

  while (true) {
    try {
      const response = await offerService.searchOffers({
        limit,
        offset,
        skipCache: true,
      });

      const batch = (response.data || []) as Offer[];
      offers.push(...batch);

      const hasMore =
        batch.length === limit &&
        (response.pagination?.hasMore ?? batch.length === limit);

      if (!hasMore) {
        break;
      }

      offset += limit;
    } catch {
      break;
    }
  }

  return offers;
};

interface OfferCategoryWithCount extends OfferCategoryType {
  offer_count?: number;
}

interface BasicOffer {
  id: string | number;
  name: string;
  description?: string;
  status?: string;
  [key: string]: unknown;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: OfferCategoryType;
  onSave: (category: { name: string; description?: string }) => Promise<void>;
}

function CategoryModal({
  isOpen,
  onClose,
  category,
  onSave,
}: CategoryModalProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
      });
    } else {
      setFormData({ name: "", description: "" });
    }
    setFormError("");
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError(t.offerCatalogs.catalogNameRequired);
      return;
    }

    setIsLoading(true);
    setFormError("");

    try {
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      };

      await onSave(categoryData); // Wait for save to complete
      onClose(); // Only close after save succeeds
    } catch (err) {
      console.error("Failed to save category:", err);
      setFormError(t.offerCatalogs.saveFailed);
    } finally {
      setIsLoading(false);
    }
  };

  return isOpen
    ? createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div
            className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto`}
          >
            <div className="flex items-start sm:items-center justify-between gap-4 p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex-1 min-w-0">
                {category
                  ? t.offerCatalogs.editModalTitle
                  : t.offerCatalogs.createModalTitle}
              </h2>
              <button
                onClick={onClose}
                className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors flex-shrink-0`}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.offerCatalogs.catalogNameLabel} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none`}
                    placeholder={t.offerCatalogs.catalogNamePlaceholder}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.offerCatalogs.description}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none`}
                    placeholder={t.offerCatalogs.descriptionPlaceholder}
                    rows={3}
                  />
                </div>
              </div>

              {formError && (
                <p className="text-sm text-red-600 mt-4">{formError}</p>
              )}

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 ${tw.rounded} transition-colors`}
                >
                  {t.offerCatalogs.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-4 py-2 text-white ${tw.rounded} transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  style={{ backgroundColor: color.primary.action }}
                >
                  {isLoading
                    ? t.offerCatalogs.saving
                    : category
                      ? t.offerCatalogs.update
                      : t.offerCatalogs.create}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )
    : null;
}

interface OffersModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: OfferCategoryType | null;
  onRefreshCategories: () => Promise<void> | void;
  onRefreshCounts: () => Promise<void> | void;
}

function OffersModal({
  isOpen,
  onClose,
  category,
  onRefreshCategories,
  onRefreshCounts,
}: OffersModalProps) {
  const { removeFromCatalog, removingId } = useRemoveFromCatalog();
  const { success: showSuccess, error: showError } = useToast();
  const [offers, setOffers] = useState<BasicOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && category) {
      loadOffers();
    }
  }, [isOpen, category]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadOffers = async () => {
    if (!category) return;

    try {
      setLoading(true);
      setModalError(null);
      const catalogTag = buildCatalogTag(category.id);

      const [primaryResponse, allOffers] = await Promise.all([
        offerCategoryService.getCategoryOffers(category.id, {
          limit: 100,
          skipCache: true,
        }),
        fetchAllOffers().catch(() => []),
      ]);

      const primaryOffers =
        ((primaryResponse?.data || []) as BasicOffer[]) ?? [];

      let taggedOffers: BasicOffer[] = [];
      taggedOffers = (allOffers as Offer[])
        .filter(
          (offer) =>
            Array.isArray(offer.tags) && offer.tags.includes(catalogTag),
        )
        .map((offer) => ({
          id: offer.id,
          name: offer.name,
          description: offer.description,
          status: offer.status,
        }));

      const combinedOffersMap = new Map<string | number, BasicOffer>();
      [...primaryOffers, ...taggedOffers].forEach((offer) => {
        if (!offer?.id) {
          return;
        }
        combinedOffersMap.set(offer.id, offer);
      });

      setOffers(Array.from(combinedOffersMap.values()));
    } catch (err) {
      console.error("Failed to load offers:", err);
      const errorMsg1 = extractBackendError(err, "Failed to load offers");
      showError("Error", errorMsg1, true);
      setModalError("Failed to load offers. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveOffer = async (offerId: number | string) => {
    if (!category) return;

    await removeFromCatalog({
      entityType: "offer",
      entityId: offerId,
      categoryId: category.id,
      categoryName: category.name,
      onRefresh: loadOffers,
      onRefreshCounts: onRefreshCounts,
      onRefreshCategories: onRefreshCategories,
      getEntityById: async (id) => await offerService.getOfferById(id),
      updateEntity: async (id, updates) => {
        await offerService.updateOffer(id, updates as UpdateOfferRequest);
      },
    });
  };

  // const handleCreateOffer = () => {
  //   if (category) {
  //     navigate(`/dashboard/offers/create?categoryId=${category.id}`);
  //   }
  // };

  return (
    <CatalogItemsModal<BasicOffer>
      isOpen={isOpen}
      onClose={onClose}
      category={category}
      items={offers}
      loading={loading}
      error={modalError}
      entityName="offer"
      entityNamePlural="offers"
      assignRoute={`/dashboard/offer-catalogs/${category?.id}/assign`}
      viewRoute={(id) => `/dashboard/offers/${id}`}
      onRemove={handleRemoveOffer}
      removingId={removingId}
      onRefresh={async () => {
        await loadOffers();
        await Promise.resolve(onRefreshCounts());
        await Promise.resolve(onRefreshCategories());
      }}
      renderStatus={(offer) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            offer?.status === "active"
              ? "bg-green-100 text-green-800"
              : offer?.status === "draft"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
          }`}
        >
          {offer?.status || "unknown"}
        </span>
      )}
    />
  );
}

function OfferCategoriesPage() {
  const { t } = useLanguage();
  const { success, error: showError } = useToast();

  const [offerCategories, setOfferCategories] = useState<
    OfferCategoryWithCount[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [categoryOfferCounts, setCategoryOfferCounts] = useState<
    Record<
      number,
      {
        totalOffers: number;
        activeOffers: number;
        expiredOffers: number;
        draftOffers: number;
        pendingOffers: number;
      }
    >
  >({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<
    OfferCategoryType | undefined
  >();
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isOffersModalOpen, setIsOffersModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<OfferCategoryType | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] =
    useState<OfferCategoryType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingCategoryId, setTogglingCategoryId] = useState<number | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Pagination states
  const [catalogPage, setCatalogPage] = useState(1);
  const catalogPageSize = 9; // Show 9 items per page (3x3 grid)

  const [stats, setStats] = useState<{
    totalCategories: number;
    activeCategories: number;
    inactiveCategories: number;
    categoriesWithOffers: number;
  } | null>(null);

  // Analytics data for stat cards
  const [unusedCount, setUnusedCount] = useState<number>(0);
  const [popularCategory, setPopularCategory] = useState<{
    name: string;
    count: number;
  } | null>(null);
  const [categoryPerformance, setCategoryPerformance] = useState<
    Record<
      number,
      {
        totalRevenue: number;
        conversionRate: number;
      }
    >
  >({});

  // Filter states
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [filterType, setFilterType] = useState<
    "all" | "unused" | "popular" | "active" | "inactive"
  >("all");

  // Advanced search states
  const [advancedSearch, setAdvancedSearch] = useState({
    exactName: "",
    isActive: null as boolean | null,
    createdAfter: "",
    createdBefore: "",
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter handlers
  const handleCloseModal = () => {
    setIsClosingModal(true);
    setTimeout(() => {
      setShowAdvancedFilters(false);
      setIsClosingModal(false);
    }, 300); // Match the transition duration
  };

  const handleFilterChange = (
    type: "all" | "unused" | "popular" | "active" | "inactive",
  ) => {
    setFilterType(type);
  };

  // Check if advanced search has any active filters
  const hasAdvancedFilters = () => {
    return (
      advancedSearch.exactName.trim() !== "" ||
      advancedSearch.isActive !== null ||
      advancedSearch.createdAfter !== "" ||
      advancedSearch.createdBefore !== ""
    );
  };

  // Clear all advanced search filters
  const clearAdvancedSearch = () => {
    setAdvancedSearch({
      exactName: "",
      isActive: null,
      createdAfter: "",
      createdBefore: "",
    });
  };

  useEffect(() => {
    const loadData = async () => {
      // Load all data in parallel for better performance
      await Promise.all([
        loadStats(),
        loadUnusedCategories(),
        loadPopularCategory(),
        loadCategoryPerformance(),
        loadAllOffers(),
      ]);
      // Load categories after offers to avoid race condition
      await loadCategories(true);
    };
    loadData();
  }, [debouncedSearchTerm, filterType, advancedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAllOffers = async () => {
    try {
      // TODO: Update to use new offer service endpoints when we update OffersPage
      // For now, just return empty array to avoid errors
      return [];
    } catch {
      // Failed to load offers for counting
      return [];
    }
  };

  const loadStats = async () => {
    try {
      const response = await offerCategoryService.getStats(true); // skipCache = true
      const data = response.data as unknown as Record<string, string>; // Backend returns snake_case, types expect camelCase
      setStats({
        totalCategories: parseInt(data.total_categories) || 0,
        activeCategories: parseInt(data.active_categories) || 0,
        inactiveCategories:
          parseInt(data.total_categories) - parseInt(data.active_categories) ||
          0,
        categoriesWithOffers: parseInt(data.categories_with_description) || 0, // Using categories_with_description as proxy
      });
    } catch (err) {
      console.error("Failed to load offer category stats:", err);
      setStats(null);
    }
  };

  const loadUnusedCategories = async () => {
    try {
      const response = await offerCategoryService.getUnusedCategories({
        limit: 50,
        skipCache: true,
      });
      if (response.success && response.data) {
        setUnusedCount(response.data.length);
      }
    } catch (err) {
      console.error("Failed to load unused categories:", err);
      setUnusedCount(0);
    }
  };

  const loadPopularCategory = async () => {
    try {
      const response = await offerCategoryService.getPopularCategories({
        limit: 1, // Just get the top one
        skipCache: true,
      });
      if (response.success && response.data && response.data.length > 0) {
        const topCategory = response.data[0] as {
          name?: string;
          offerCount?: number;
          offer_count?: string | number;
          total_offers?: string | number;
        };
        const parsedTotalOffers =
          topCategory.total_offers !== undefined
            ? Number(topCategory.total_offers)
            : topCategory.offer_count !== undefined
              ? Number(topCategory.offer_count)
              : (topCategory.offerCount ?? 0);
        setPopularCategory({
          name: topCategory.name ?? "Unknown",
          count: Number.isNaN(parsedTotalOffers) ? 0 : parsedTotalOffers,
        });
      }
    } catch (err) {
      console.error("Failed to load popular category:", err);
      setPopularCategory(null);
    }
  };

  const loadCategoryPerformance = async () => {
    try {
      const response = await offerService.getCategoryPerformance(true);
      if (response.success && response.data) {
        const performanceMap: Record<
          number,
          {
            totalRevenue: number;
            conversionRate: number;
          }
        > = {};

        (response.data || []).forEach((item) => {
          const categoryId = Number(item.categoryId);
          if (!Number.isFinite(categoryId)) {
            return;
          }
          performanceMap[categoryId] = {
            totalRevenue: item.totalRevenue || 0,
            conversionRate: item.conversionRate || 0,
          };
        });

        setCategoryPerformance(performanceMap);
      }
    } catch (err) {
      console.error("Failed to load category performance:", err);
      setCategoryPerformance({});
    }
  };

  const getOfferCountForCategory = () => {
    // TODO: Update when we fix offer service - for now return 0
    return 0;
  };

  // Load offer counts for all categories at once
  const loadAllOfferCounts = async (categories?: OfferCategoryWithCount[]) => {
    try {
      const [response, allOffers] = await Promise.all([
        offerCategoryService.getOfferCounts(true),
        fetchAllOffers().catch(() => []),
      ]);

      if (response.success && response.data) {
        // Use provided categories or fall back to state
        const categoriesToMatch = categories || offerCategories;

        // Backend returns: { category_name: string, offer_count: string }
        // We need to match by category name to get the category ID
        const countsMap: Record<
          number,
          {
            totalOffers: number;
            activeOffers: number;
            expiredOffers: number;
            draftOffers: number;
            pendingOffers: number;
          }
        > = {};

        const offerCountEntries = ((response.data as unknown) ?? []) as Array<{
          category_name: string;
          offer_count: string | number;
        }>;

        offerCountEntries.forEach((item) => {
          // Find the category by name to get its ID
          const matchingCategory = categoriesToMatch.find(
            (cat) => cat.name === item.category_name,
          );

          if (matchingCategory) {
            const categoryId =
              typeof matchingCategory.id === "string"
                ? parseInt(matchingCategory.id, 10)
                : matchingCategory.id;
            const offerCount =
              typeof item.offer_count === "string"
                ? parseInt(item.offer_count, 10)
                : item.offer_count || 0;

            countsMap[categoryId] = {
              totalOffers: offerCount,
              activeOffers: 0, // Backend doesn't provide this breakdown
              expiredOffers: 0,
              draftOffers: 0,
              pendingOffers: 0,
            };
          }
        });

        if (Array.isArray(allOffers)) {
          const categoriesIndex = new Map<number, boolean>();
          (categories || offerCategories).forEach((cat) => {
            const catId =
              typeof cat.id === "string" ? parseInt(cat.id, 10) : cat.id;
            categoriesIndex.set(catId, true);
          });

          (allOffers as Offer[]).forEach((offer) => {
            if (!Array.isArray(offer.tags)) {
              return;
            }
            const primaryCategoryId =
              typeof offer.category_id === "string"
                ? parseInt(offer.category_id, 10)
                : offer.category_id;

            const catalogIds = offer.tags
              .map((tag) => parseCatalogTag(tag))
              .filter(
                (id): id is number =>
                  typeof id === "number" && categoriesIndex.has(id),
              );

            const uniqueCatalogIds = new Set(catalogIds);
            uniqueCatalogIds.forEach((catalogId) => {
              if (primaryCategoryId === catalogId) {
                return;
              }
              if (!countsMap[catalogId]) {
                countsMap[catalogId] = {
                  totalOffers: 0,
                  activeOffers: 0,
                  expiredOffers: 0,
                  draftOffers: 0,
                  pendingOffers: 0,
                };
              }
              countsMap[catalogId].totalOffers += 1;
            });
          });
        }

        setCategoryOfferCounts(countsMap);
      }
    } catch {
      // Failed to load all offer counts
    }
  };

  const loadCategories = async (skipCache = false) => {
    try {
      setLoading(true);

      let response;

      // Choose endpoint based on filter type and advanced search
      if (hasAdvancedFilters()) {
        // Use advanced search when advanced filters are set
        response = await offerCategoryService.advancedSearch({
          name: advancedSearch.exactName.trim() || undefined,
          is_active: advancedSearch.isActive ?? undefined,
          created_after: advancedSearch.createdAfter || undefined,
          created_before: advancedSearch.createdBefore || undefined,
          limit: 50,
          skipCache: skipCache,
        });
      } else if (debouncedSearchTerm) {
        // Use search endpoint when there's a search term
        response = await offerCategoryService.searchCategories({
          q: debouncedSearchTerm,
          limit: 50,
          skipCache: skipCache,
        });
      } else {
        // Use different endpoints based on filter type
        switch (filterType) {
          case "unused":
            response = await offerCategoryService.getUnusedCategories({
              limit: 50,
              skipCache: skipCache,
            });
            break;
          case "popular":
            response = await offerCategoryService.getPopularCategories({
              limit: 50,
              skipCache: skipCache,
            });
            break;
          case "active":
            response = await offerCategoryService.getActiveCategories({
              limit: 50,
              skipCache: skipCache,
            });
            break;
          case "inactive":
            // For inactive, we'll get all and filter client-side
            response = await offerCategoryService.getAllCategories({
              limit: 50,
              skipCache: skipCache,
            });
            break;
          default: // 'all'
            response = await offerCategoryService.getAllCategories({
              limit: 50,
              skipCache: skipCache,
            });
            break;
        }
      }

      const categoriesData = response.data || [];

      // Use provided offers data or fall back to state
      // Add offer count to each category by counting from offers
      let categoriesWithCounts = categoriesData.map((category) => {
        const categoryId =
          typeof category.id === "string"
            ? parseInt(category.id, 10)
            : category.id;
        return {
          ...category,
          id: categoryId, // Ensure ID is a number
          offer_count: getOfferCountForCategory(),
        };
      });

      // Apply client-side filtering for inactive categories
      if (filterType === "inactive" && !debouncedSearchTerm) {
        categoriesWithCounts = categoriesWithCounts.filter(
          (category) => !category.is_active,
        );
      }

      setOfferCategories(categoriesWithCounts);
      setPageError("");

      // Load offer counts for all categories at once
      // Note: loadAllOfferCounts needs offerCategories to match by name,
      // so we need to call it after setting the state, but we'll use the local variable
      // We'll pass categoriesWithCounts to loadAllOfferCounts
      await loadAllOfferCounts(categoriesWithCounts);
    } catch (err) {
      console.error("Failed to load categories:", err);
      const errorMsg2 = extractBackendError(err, "Failed to load categories");
      showError("Error", errorMsg2, true);
      setPageError("Failed to load offer catalogs. Please try again later.");
      setOfferCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = () => {
    setEditingCategory(undefined);
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: OfferCategoryType) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDeleteCategory = (category: OfferCategoryType) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const handleToggleActive = async (category: OfferCategoryType) => {
    try {
      setTogglingCategoryId(category.id);
      const newActiveStatus = !category.is_active;

      // Optimistic update - update local state immediately
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === category.id ? { ...cat, is_active: newActiveStatus } : cat
        )
      );

      if (newActiveStatus) {
        await offerCategoryService.activateCategory(category.id, {});
      } else {
        await offerCategoryService.deactivateCategory(category.id, {});
      }

      success(
        newActiveStatus
          ? t.offerCatalogs.activateSuccess
          : t.offerCatalogs.deactivateSuccess,
        newActiveStatus
          ? t.offerCatalogs.activateSuccess
          : t.offerCatalogs.deactivateSuccess,
      );
    } catch (err) {
      console.error("Failed to toggle category status:", err);
      // Revert optimistic update on error by reloading
      await Promise.all([loadCategories(true), loadStats()]);
      // Display backend error message and bypass silent mode for important errors
      const errorMessage = extractBackendError(err, "Failed to update category");
      showError(errorMessage, "", true);
    } finally {
      setTogglingCategoryId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    try {
      await offerCategoryService.deleteCategory(categoryToDelete.id);

      // Refresh from server to ensure cache is cleared
      await loadAllOffers();
      await loadCategories(true); // skipCache = true
      await loadStats(); // Refresh stats too

      success(t.offerCatalogs.deleteSuccess, t.offerCatalogs.deleteSuccess);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    } catch (err) {
      console.error("Error deleting category:", err);
      const errorMsg = extractBackendError(err, "Failed to delete category");
      showError(errorMsg, "", true);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setCategoryToDelete(null);
  };

  const handleViewOffers = (category: OfferCategoryType) => {
    setSelectedCategory(category);
    setIsOffersModalOpen(true);
  };

  const handleCategorySaved = async (categoryData: {
    name: string;
    description?: string;
  }) => {
    try {
      if (editingCategory) {
        // Update existing category
        await offerCategoryService.updateCategory(
          editingCategory.id,
          categoryData as UpdateOfferCategoryRequest,
        );
        success(t.offerCatalogs.updateSuccess);
      } else {
        // Create new category
        await offerCategoryService.createCategory(
          categoryData as CreateOfferCategoryRequest,
        );
        success(t.offerCatalogs.createSuccess);
      }

      // Refresh both offers and categories to get updated counts
      await loadAllOffers();
      await loadCategories(true);
      await loadStats(); // Refresh stats too

      setIsModalOpen(false);
      setEditingCategory(undefined);
    } catch (err) {
      console.error("Failed to save category:", err);
      const errorMsg3 = extractBackendError(err, t.offerCatalogs.saveFailed);
      showError("Error", errorMsg3, true);
    }
  };

  const filteredOfferCategories = (offerCategories || [])
    .filter(
      (category) =>
        category?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category?.description &&
          category.description.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    .sort((a, b) => {
      // Sort by created_at (newest first), keeping items in place regardless of active status
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });

  const formatNumber = (value?: number | null) =>
    typeof value === "number" ? value.toLocaleString() : "...";

  const catalogStatsCards = [
    {
      name: t.offerCatalogs.totalCatalogs,
      value: formatNumber(stats?.totalCategories),
      icon: FolderOpen,
      color: color.tertiary.tag1,
    },
    {
      name: t.offerCatalogs.activeCatalogs,
      value: formatNumber(stats?.activeCategories),
      icon: CheckCircle,
      color: color.tertiary.tag4,
    },
    {
      name: t.offerCatalogs.inactiveCatalogs,
      value: formatNumber(stats?.inactiveCategories),
      icon: XCircle,
      color: color.tertiary.tag3,
    },
    {
      name: "Unused Categories",
      value: formatNumber(unusedCount),
      icon: Archive,
      color: color.tertiary.tag2,
    },
    {
      name: "Most Popular",
      value: popularCategory?.name || "None",
      icon: Star,
      color: color.primary.accent,
      description: `${formatNumber(popularCategory?.count ?? 0)} offers`,
      title: popularCategory?.name || undefined,
      valueClass: "text-xl",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* <BackButton fallbackTo="/dashboard/offers" /> */}
          <div>
            <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
              {t.offerCatalogs.title}
            </h1>
            <p className={`${tw.textSecondary} mt-2 text-sm`}>
              {t.offerCatalogs.subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <PermissionGate permission="offer-catalog.create">
            <CreateButton onClick={handleCreateCategory} />
          </PermissionGate>
        </div>
      </div>

      {pageError && (
        <div
          className={`${tw.rounded} border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700`}
        >
          {pageError}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {catalogStatsCards.map((stat) => {
            const Icon = stat.icon;
            const valueClass = stat.valueClass ?? "text-3xl";
            const displayValue = stat.value ?? "...";

            return (
              <div
                key={stat.name}
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600">
                    {stat.name}
                  </p>
                </div>
                <p
                  className={`mt-2 ${valueClass} font-bold text-gray-900`}
                  title={stat.title}
                >
                  {displayValue}
                </p>
                {stat.description && (
                  <p className="mt-1 text-sm text-gray-500">
                    {stat.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Search and View Toggle */}
      <div className=" flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.offerCatalogs.searchPlaceholder}
            className={`w-full pl-10 pr-4 py-2 border border-gray-300 ${tw.rounded} focus:outline-none`}
          />
        </div>
        <div className="flex items-center gap-2 p-1">
          <button
            onClick={() => setShowAdvancedFilters(true)}
            className={`flex items-center gap-2 ${tw.rounded} transition-colors font-medium`}
            style={{
              backgroundColor: button.secondaryAction.background,
              color: button.secondaryAction.color,
              border: button.secondaryAction.border,
              padding: `${button.secondaryAction.paddingY} ${button.secondaryAction.paddingX}`,
              borderRadius: button.secondaryAction.borderRadius,
              fontSize: button.secondaryAction.fontSize,
            }}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded transition-colors ${
              viewMode === "grid" ? "" : "text-gray-500 hover:text-gray-700"
            }`}
            style={
              viewMode === "grid"
                ? {
                    backgroundColor: button.activeIconDisplay.background,
                    color: button.activeIconDisplay.color,
                    padding: `${button.activeIconDisplay.paddingY} ${button.activeIconDisplay.paddingX}`,
                    borderRadius: button.activeIconDisplay.borderRadius,
                  }
                : { padding: "0.5rem" }
            }
            title="Grid View"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded transition-colors ${
              viewMode === "list" ? "" : "text-gray-500 hover:text-gray-700"
            }`}
            style={
              viewMode === "list"
                ? {
                    backgroundColor: button.activeIconDisplay.background,
                    color: button.activeIconDisplay.color,
                    padding: `${button.activeIconDisplay.paddingY} ${button.activeIconDisplay.paddingX}`,
                    borderRadius: button.activeIconDisplay.borderRadius,
                  }
                : { padding: "0.5rem" }
            }
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filterType !== "all" || hasAdvancedFilters()) && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
          <span className={`text-sm font-medium ${tw.textPrimary} py-2`}>
            Active filters:
          </span>

          {/* Basic filter type */}
          {filterType !== "all" && (
            <span
              className="inline-flex items-center px-3 py-1.5 text-sm rounded-full border"
              style={{
                backgroundColor: `${color.primary.accent}20`, // 20% opacity
                color: color.text.primary, // Black text
                borderColor: color.primary.accent,
              }}
            >
              {filterType === "unused" && "Unused Categories"}
              {filterType === "popular" && "Popular Categories"}
              {filterType === "active" && "Active Categories"}
              {filterType === "inactive" && "Inactive Categories"}
              <button
                onClick={() => setFilterType("all")}
                className="ml-2 hover:opacity-70 transition-opacity"
              >
                ×
              </button>
            </span>
          )}

          {/* Advanced search filters */}
          {hasAdvancedFilters() && (
            <>
              {advancedSearch.exactName.trim() && (
                <span
                  className="inline-flex items-center px-3 py-1.5 text-sm rounded-full border"
                  style={{
                    backgroundColor: `${color.primary.accent}20`,
                    color: color.text.primary,
                    borderColor: color.primary.accent,
                  }}
                >
                  Name: "{advancedSearch.exactName}"
                  <button
                    onClick={() =>
                      setAdvancedSearch((prev) => ({ ...prev, exactName: "" }))
                    }
                    className="ml-2 hover:opacity-70 transition-opacity"
                  >
                    ×
                  </button>
                </span>
              )}

              {advancedSearch.isActive !== null && (
                <span
                  className="inline-flex items-center px-3 py-1.5 text-sm rounded-full border"
                  style={{
                    backgroundColor: `${color.primary.accent}20`,
                    color: color.text.primary,
                    borderColor: color.primary.accent,
                  }}
                >
                  Status: {advancedSearch.isActive ? "Active" : "Inactive"}
                  <button
                    onClick={() =>
                      setAdvancedSearch((prev) => ({ ...prev, isActive: null }))
                    }
                    className="ml-2 hover:opacity-70 transition-opacity"
                  >
                    ×
                  </button>
                </span>
              )}

              {(advancedSearch.createdAfter ||
                advancedSearch.createdBefore) && (
                <span
                  className="inline-flex items-center px-3 py-1.5 text-sm rounded-full border"
                  style={{
                    backgroundColor: `${color.primary.accent}20`,
                    color: color.text.primary,
                    borderColor: color.primary.accent,
                  }}
                >
                  Date: {advancedSearch.createdAfter || "Any"} to{" "}
                  {advancedSearch.createdBefore || "Any"}
                  <button
                    onClick={() =>
                      setAdvancedSearch((prev) => ({
                        ...prev,
                        createdAfter: "",
                        createdBefore: "",
                      }))
                    }
                    className="ml-2 hover:opacity-70 transition-opacity"
                  >
                    ×
                  </button>
                </span>
              )}
            </>
          )}
        </div>
      )}

      {/* Categories */}
      {(() => {
        const startIndex = (catalogPage - 1) * catalogPageSize;
        const endIndex = startIndex + catalogPageSize;
        const paginatedCategories = filteredOfferCategories.slice(startIndex, endIndex);

        return (
          <>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <LoadingSpinner
            variant="modern"
            size="xl"
            color="primary"
            className="mb-4"
          />
          <p className={`${tw.textMuted} font-medium`}>
            {t.offerCatalogs.loadingCatalogs}
          </p>
        </div>
      ) : filteredOfferCategories.length === 0 ? (
        <div
          className={`${tw.rounded} shadow-sm border border-gray-200 text-center py-16 px-4`}
          style={{ backgroundColor: color.surface.cards }}
        >
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className={`${tw.cardHeading} text-gray-900 mb-1`}>
            {searchTerm
              ? t.offerCatalogs.noCatalogsFound
              : t.offerCatalogs.noCatalogsYet}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {searchTerm
              ? "Try adjusting your search terms"
              : t.offerCatalogs.createFirstCatalog}
          </p>
          {!searchTerm && (
            <PermissionGate permission="offer-catalog.create">
              <CreateButton onClick={handleCreateCategory} />
            </PermissionGate>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedCategories.map((category) => (
            <div
              key={category.id}
              className={`border border-gray-200 ${tw.rounded} p-6 hover:shadow-md transition-all`}
              style={{ backgroundColor: color.surface.cards }}
            >
              <div className="flex items-start justify-between mb-2">
                <h3
                  className={`${tw.tableFirstColumn} text-gray-900 flex-1 truncate`}
                >
                  {category.name}
                </h3>
                <div className="flex items-center space-x-1">
                  {/* <button
                    onClick={() => handleViewDetails(category)}
                    className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
                    title="View Details"
                  >
                    <Eye className="w-4 h-4 text-gray-600" />
                  </button> */}
                  <PermissionGate permission="offer-catalog.update">
                    <button
                      onClick={() => handleToggleActive(category)}
                      disabled={togglingCategoryId === category.id}
                      className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={
                        category.is_active
                          ? t.offerCatalogs.deactivate
                          : t.offerCatalogs.activate
                      }
                    >
                      {togglingCategoryId === category.id ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      ) : category.is_active ? (
                        <PowerOff className="w-4 h-4 text-orange-600" />
                      ) : (
                        <Power className="w-4 h-4 text-green-600" />
                      )}
                    </button>
                  </PermissionGate>
                  <button
                    onClick={() => handleEditCategory(category)}
                    className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
                    title={t.offerCatalogs.edit}
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category)}
                    className={`p-2 hover:bg-red-50 ${tw.rounded} transition-colors`}
                    title={t.offerCatalogs.delete}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
              {category.description && (
                <p
                  className={`${tw.cardSubHeading} text-gray-500 mb-4 line-clamp-2`}
                >
                  {category.description}
                </p>
              )}

              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {(() => {
                      const categoryId =
                        typeof category.id === "string"
                          ? parseInt(category.id, 10)
                          : category.id;
                      const count = categoryOfferCounts[categoryId];
                      return count ? (
                        <>
                          {count.totalOffers} offer
                          {count.totalOffers !== 1 ? "s" : ""}
                          {count.activeOffers > 0 && (
                            <span className="text-green-600 ml-1">
                              ({count.activeOffers} active)
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          {category.offer_count || 0} offer
                          {category.offer_count !== 1 ? "s" : ""}
                        </>
                      );
                    })()}
                  </span>
                  <PermissionGate permission="offer-catalog-view.read">
                    <button
                      onClick={() => handleViewOffers(category)}
                      className="text-sm font-medium text-gray-700 hover:underline transition-colors"
                      title={t.offerCatalogs.viewOffers}
                    >
                      {t.offerCatalogs.viewOffers}
                    </button>
                  </PermissionGate>
                </div>
                {(() => {
                  const categoryId =
                    typeof category.id === "string"
                      ? parseInt(category.id, 10)
                      : category.id;
                  const performance = categoryPerformance[categoryId];
                  if (
                    performance &&
                    (performance.totalRevenue > 0 ||
                      performance.conversionRate > 0)
                  ) {
                    return (
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500">Revenue</p>
                          <p className="text-sm font-semibold text-gray-900">
                            <CurrencyFormatter
                              amount={performance.totalRevenue}
                            />
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Conversion</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {performance.conversionRate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOfferCategories.map((category) => {
            const categoryId =
              typeof category.id === "string"
                ? parseInt(category.id, 10)
                : category.id;
            const performance = categoryPerformance[categoryId];
            return (
              <div
                key={category.id}
                className={`border border-gray-200 ${tw.rounded} p-4 hover:shadow-md transition-all`}
                style={{ backgroundColor: color.surface.cards }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                      <h3
                        className={`${tw.tableFirstColumn} text-gray-900 truncate`}
                      >
                        {category.name}
                      </h3>
                      <p
                        className={`${tw.cardSubHeading} text-gray-600 mt-0.5`}
                      >
                        {(() => {
                          const count = categoryOfferCounts[categoryId];
                          return count ? (
                            <>
                              {count.totalOffers} offer
                              {count.totalOffers !== 1 ? "s" : ""}
                              {count.activeOffers > 0 && (
                                <span className="text-green-600 ml-1">
                                  ({count.activeOffers} active)
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              {category.offer_count || 0} offer
                              {category.offer_count !== 1 ? "s" : ""}
                            </>
                          );
                        })()}
                      </p>
                      {performance &&
                        (performance.totalRevenue > 0 ||
                          performance.conversionRate > 0) && (
                          <div className="flex items-center gap-4 mt-2">
                            <div>
                              <span className="text-xs text-gray-500">
                                Revenue:{" "}
                              </span>
                              <span className="text-sm font-semibold text-gray-900">
                                <CurrencyFormatter
                                  amount={performance.totalRevenue}
                                />
                              </span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">
                                Conversion:{" "}
                              </span>
                              <span className="text-sm font-semibold text-gray-900">
                                {performance.conversionRate.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        )}
                    </div>
                    <button
                      onClick={() => handleViewOffers(category)}
                      className="text-sm font-medium text-gray-700 hover:underline transition-colors"
                      title={t.offerCatalogs.viewOffers}
                    >
                      {t.offerCatalogs.viewOffers}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                  {/* <button
                  onClick={() => handleViewDetails(category)}
                  className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
                  title="View Details"
                >
                  <Eye className="w-4 h-4 text-gray-600" />
                </button> */}
                  <button
                    onClick={() => handleToggleActive(category)}
                    disabled={togglingCategoryId === category.id}
                    className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={
                      category.is_active
                        ? t.offerCatalogs.deactivate
                        : t.offerCatalogs.activate
                    }
                  >
                    {togglingCategoryId === category.id ? (
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : category.is_active ? (
                      <PowerOff className="w-4 h-4 text-orange-600" />
                    ) : (
                      <Power className="w-4 h-4 text-green-600" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEditCategory(category)}
                    className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
                    title={t.offerCatalogs.edit}
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category)}
                    className={`p-2 hover:bg-red-50 ${tw.rounded} transition-colors`}
                    title={t.offerCatalogs.delete}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {filteredOfferCategories.length > catalogPageSize && (
        <div className="flex justify-center mt-6">
          <Pagination
            currentPage={catalogPage}
            pageSize={catalogPageSize}
            totalItems={filteredOfferCategories.length}
            onPageChange={(newPage) => {
              setCatalogPage(newPage);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      )}
          </>
        );
      })()}

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={editingCategory}
        onSave={handleCategorySaved}
      />

      <OffersModal
        isOpen={isOffersModalOpen}
        onClose={() => {
          setIsOffersModalOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onRefreshCategories={async () => {
          await loadAllOfferCounts();
          await loadCategories(true);
        }}
        onRefreshCounts={loadAllOfferCounts}
      />

      {/* Advanced Filters Side Modal */}
      {(showAdvancedFilters || isClosingModal) &&
        createPortal(
          <div
            className={`fixed inset-0 overflow-hidden ${
              isClosingModal
                ? "animate-out fade-out duration-300"
                : "animate-in fade-in duration-300"
            }`}
            style={{ zIndex: zIndex.modal - 1 }}
          >
            <div
              className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
              onClick={handleCloseModal}
            ></div>
            <div
              className={`absolute right-0 top-0 h-full w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
                isClosingModal ? "translate-x-full" : "translate-x-0"
              }`}
            >
              <div className={`p-6 border-b ${tw.borderDefault}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Filter Categories
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className={`p-2 ${tw.textMuted} hover:bg-gray-50 ${tw.rounded} transition-colors`}
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
                {/* Filter Type */}
                <div>
                  <label
                    className={`block text-sm font-medium ${tw.textPrimary} mb-3`}
                  >
                    Category Type
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: "all", label: "All Categories" },
                      { value: "unused", label: "Unused Categories" },
                      { value: "popular", label: "Popular Categories" },
                      { value: "active", label: "Active Categories" },
                      { value: "inactive", label: "Inactive Categories" },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center">
                        <Radio name="filterType"
                          value={option.value}
                          checked={filterType === option.value}
                          onChange={() =>
                            handleFilterChange(
                              option.value as
                                | "all"
                                | "unused"
                                | "popular"
                                | "active"
                                | "inactive",
                            )
                          }
                          className={`mr-3 text-[${color.primary.action}] focus:ring-[${color.primary.action}]`} />
                        <span className={`text-sm ${tw.textSecondary}`}>
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Advanced Search Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Advanced Search
                  </h3>

                  <div className="space-y-4">
                    {/* Exact Name Search */}
                    <div>
                      <label
                        className={`block text-sm font-medium ${tw.textSecondary} mb-2`}
                      >
                        Exact Name Match
                      </label>
                      <input
                        type="text"
                        value={advancedSearch.exactName}
                        onChange={(e) =>
                          setAdvancedSearch((prev) => ({
                            ...prev,
                            exactName: e.target.value,
                          }))
                        }
                        placeholder="Enter exact category name..."
                        className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label
                        className={`block text-sm font-medium ${tw.textSecondary} mb-2`}
                      >
                        Status
                      </label>
                      <HeadlessSelect
                        value={
                          advancedSearch.isActive === null
                            ? ""
                            : advancedSearch.isActive.toString()
                        }
                        onChange={(value) => {
                          const boolValue =
                            value === "" ? null : value === "true";
                          setAdvancedSearch((prev) => ({
                            ...prev,
                            isActive: boolValue,
                          }));
                        }}
                        options={[
                          { label: "All Status", value: "" },
                          { label: "Active Only", value: "true" },
                          { label: "Inactive Only", value: "false" },
                        ]}
                        placeholder="All Status"
                        className="w-full"
                        zIndex={zIndex.popover}
                      />
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block text-sm font-medium ${tw.textSecondary} mb-2`}
                        >
                          Created After
                        </label>
                        <input
                          type="date"
                          value={advancedSearch.createdAfter}
                          onChange={(e) =>
                            setAdvancedSearch((prev) => ({
                              ...prev,
                              createdAfter: e.target.value,
                            }))
                          }
                          className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>
                      <div>
                        <label
                          className={`block text-sm font-medium ${tw.textSecondary} mb-2`}
                        >
                          Created Before
                        </label>
                        <input
                          type="date"
                          value={advancedSearch.createdBefore}
                          onChange={(e) =>
                            setAdvancedSearch((prev) => ({
                              ...prev,
                              createdBefore: e.target.value,
                            }))
                          }
                          className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setFilterType("all");
                      clearAdvancedSearch();
                    }}
                    className={`flex-1 px-4 py-2 text-sm border border-gray-300 ${tw.textSecondary} ${tw.rounded} hover:bg-gray-50 transition-colors`}
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => {
                      handleCloseModal();
                    }}
                    className={`${tw.button} flex-1 px-4 py-2 text-sm`}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title={t.offerCatalogs.deleteConfirmTitle}
        description={t.offerCatalogs.deleteConfirmMessage}
        itemName={categoryToDelete?.name || ""}
        isLoading={isDeleting}
        confirmText={t.offerCatalogs.delete}
        cancelText={t.offerCatalogs.cancel}
      />
    </div>
  );
}

export default OfferCategoriesPage;
