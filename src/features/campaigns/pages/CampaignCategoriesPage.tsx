import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import Input from '../../../shared/components/ui/Input';
import { useNavigate } from "react-router-dom";
import { Edit, Trash2, MessageSquare, Grid, List } from "lucide-react";
import CatalogItemsModal from "../../../shared/components/CatalogItemsModal";
import { color, tw, button, zIndex } from "../../../shared/utils/utils";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useRemoveFromCatalog } from "../../../shared/hooks/useRemoveFromCatalog";
import { campaignService } from "../services/campaignService";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import CreateButton from "../../../shared/components/ui/CreateButton";
import Pagination from "../../../shared/components/ui/Pagination";
import { PermissionGate } from "../../auth/components/PermissionGate";
import { BackendCampaignType } from "../types/campaign";
import {
  FolderOpen,
  CheckCircle,
  XCircle,
  X,
  Archive,
  Star,
  Power,
  PowerOff,
} from "lucide-react";

const CATALOG_TAG_PREFIX = "catalog:";

const buildCatalogTag = (categoryId: number | string) =>
  `${CATALOG_TAG_PREFIX}${categoryId}`;

interface CampaignCategory {
  id: number;
  name: string;
  description: string | null;
  parent_category_id: number | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  campaign_count?: number;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: CampaignCategory;
  onSave: (category: { name: string; description?: string }) => Promise<void>;
  isSaving?: boolean;
}

function CategoryModal({
  isOpen,
  onClose,
  category,
  onSave,
  isSaving = false,
}: CategoryModalProps) {
  const { error: showError } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
      });
    } else {
      setFormData({ name: "", description: "" });
    }
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showError("Validation Error", "Catalog name is required", true);
      return;
    }

    if (formData.name.length > 64) {
      showError("Validation Error", "Catalog name must be 64 characters or less", true);
      return;
    }

    if (formData.description && formData.description.length > 500) {
      showError("Validation Error", "Description must be 500 characters or less", true);
      return;
    }

    const categoryData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
    };

    await onSave(categoryData);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div
        className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-start sm:items-center justify-between gap-4 p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex-1 min-w-0">
            {category ? "Edit Campaign Catalog" : "Create New Campaign Catalog"}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 ${tw.rounded} transition-colors flex-shrink-0`}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Catalog Name *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, name: String(value) }))
                }
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                placeholder="Enter campaign catalog name"
                maxLength={64}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                placeholder="Enter campaign catalog description"
                rows={3}
                maxLength={500}
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-gray-700 bg-gray-100 ${tw.rounded} transition-colors`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-4 py-2 text-white ${tw.rounded} transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ backgroundColor: color.primary.action }}
            >
              {isSaving
                ? "Saving..."
                : category
                  ? "Update Category"
                  : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

export default function CampaignCategoriesPage() {
  const navigate = useNavigate();
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { removeFromCatalog, removingId } = useRemoveFromCatalog();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] =
    useState<CampaignCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [campaignCategories, setCampaignCategories] = useState<
    CampaignCategory[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<
    CampaignCategory | undefined
  >();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Pagination states
  const [catalogPage, setCatalogPage] = useState(1);
  const catalogPageSize = 9; // Show 9 items per page (3x3 grid)

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [togglingCategoryId, setTogglingCategoryId] = useState<number | null>(
    null,
  );
  const [stats, setStats] = useState<{
    totalCategories: number;
    activeCategories: number;
    inactiveCategories: number;
    categoriesWithCampaigns: number;
  } | null>(null);

  // Analytics data for stat cards
  const [unusedCount, setUnusedCount] = useState<number>(0);
  const [popularCategory, setPopularCategory] = useState<{
    name: string;
    count: number;
  } | null>(null);

  // Primary category warning modal states
  const [showPrimaryCategoryModal, setShowPrimaryCategoryModal] = useState(false);
  const [primaryCategoryItemId, setPrimaryCategoryItemId] = useState<number | string | null>(null);

  // Campaigns modal state
  const [isCampaignsModalOpen, setIsCampaignsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<CampaignCategory | null>(null);
  const [campaigns, setCampaigns] = useState<
    Array<{
      id: string;
      name: string;
      description?: string;
      status?: string;
      approval_status?: string;
      start_date?: string;
      end_date?: string;
      category_id?: number;
      tags?: string[];
    }>
  >([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  // Note: allCampaigns state removed - not used here anymore
  // getAllCampaigns is only used in AssignItemsPage for campaigns

  // Campaign assignment state

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadStats = useCallback(async (skipCache = false) => {
    try {
      // Use backend endpoint for stats instead of calculating manually
      const statsResponse =
        await campaignService.getCampaignCategoryStats(skipCache);

      if (statsResponse.success && statsResponse.data) {
        const data = statsResponse.data as {
          total_categories?: string | number;
          active_categories?: string | number;
          inactive_categories?: string | number;
          root_categories?: string | number;
          categories_with_children?: string | number;
          categories_with_campaigns?: string | number;
          categories_without_campaigns?: string | number;
          avg_display_order?: string | number;
          most_used_category?: {
            id: number;
            name: string;
            campaign_count: number;
          };
        };

        // Parse string values to numbers
        const totalCategories = Number(data.total_categories) || 0;
        const activeCategories = Number(data.active_categories) || 0;
        const inactiveCategories = Number(data.inactive_categories) || 0;
        const categoriesWithCampaigns =
          Number(data.categories_with_campaigns) || 0;

        setStats({
          totalCategories,
          activeCategories,
          inactiveCategories:
            inactiveCategories || totalCategories - activeCategories,
          categoriesWithCampaigns,
        });

        // Set unused count from backend (categories without campaigns)
        const unusedCount = Number(data.categories_without_campaigns) || 0;
        setUnusedCount(unusedCount);

        // Set popular category from backend if available
        if (
          data.most_used_category &&
          data.most_used_category.campaign_count > 0
        ) {
          setPopularCategory({
            name: data.most_used_category.name,
            count: data.most_used_category.campaign_count,
          });
        } else {
          setPopularCategory(null);
        }
      }
    } catch (err) {
      console.error("Failed to load campaign category stats:", err);
      setStats(null);
      setUnusedCount(0);
      setPopularCategory(null);
    }
  }, []);

  // Helper function to count campaigns for a category (checking both category_id AND tags)
  // Same logic as segments - supports multi-catalog assignment via tags
  const getCampaignCountForCategory = (
    categoryId: number,
    campaigns: BackendCampaignType[],
  ) => {
    const catalogTag = buildCatalogTag(categoryId);
    return campaigns.filter((campaign) => {
      // Check if category_id matches (handle string/number conversion like segments)
      const campaignCategoryId =
        typeof campaign.category_id === "string"
          ? parseInt(campaign.category_id, 10)
          : campaign.category_id;
      const matchesPrimary =
        campaignCategoryId !== null &&
        campaignCategoryId !== undefined &&
        !isNaN(campaignCategoryId) &&
        Number(campaignCategoryId) === categoryId;

      // Check if tags include the catalog tag
      const tags = Array.isArray(campaign.tags) ? campaign.tags : [];
      const matchesTag = tags.includes(catalogTag);

      return matchesPrimary || matchesTag;
    }).length;
  };

  const loadCategories = useCallback(
    async (skipCache = false) => {
      try {
        setLoading(true);

        // Use searchCampaignCategories endpoint when there's a search term,
        // otherwise use getCampaignCategories
        let response;
        if (debouncedSearchTerm.trim()) {
          response = await campaignService.searchCampaignCategories(
            debouncedSearchTerm,
            {
              skipCache: skipCache,
            },
          );
        } else {
          response = await campaignService.getCampaignCategories({
            skipCache: skipCache,
          });
        }

        // Handle new response structure with success and data properties
        const categoriesData =
          response.success && response.data ? response.data : [];

        // Fetch all campaigns once to calculate counts (checking both category_id AND tags)
        // This ensures campaigns assigned via tags are counted correctly
        let allCampaigns: BackendCampaignType[] = [];
        let offset = 0;
        const limit = 100;
        let hasMore = true;

        while (hasMore) {
          const campaignsResponse = await campaignService.getCampaigns({
            limit: limit,
            offset: offset,
            skipCache: skipCache,
          });

          const campaigns = (campaignsResponse.data ||
            []) as BackendCampaignType[];
          allCampaigns = [...allCampaigns, ...campaigns];

          const total = campaignsResponse.pagination?.total || 0;
          hasMore = allCampaigns.length < total && campaigns.length === limit;
          offset += limit;
        }

        // Calculate count for each category by checking both category_id AND tags
        // (same logic as offers/segments - supports multi-catalog assignment)
        const categoriesWithCounts = (categoriesData as CampaignCategory[]).map(
          (category: CampaignCategory) => {
            const count = getCampaignCountForCategory(
              category.id,
              allCampaigns,
            );
            return {
              ...category,
              campaign_count: count,
            };
          },
        );

        setCampaignCategories(categoriesWithCounts);

        // Load stats from backend endpoint (not from categories data)
        await loadStats(skipCache);
      } catch (err) {
        console.error("Failed to load Campaigns catalogs:", err);
        const errorMessage = extractBackendError(err, "Failed to load catalogs");
        showError("Error", errorMessage, true);
        setCampaignCategories([]);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearchTerm, showError, loadStats],
  );

  useEffect(() => {
    loadCategories(true);
  }, [loadCategories]);

  // Track visibility state with refs to avoid unnecessary reloads
  const wasHiddenRef = useRef(false);
  const lastHiddenTimeRef = useRef<number | null>(null);

  // Refresh when page becomes visible (e.g., when navigating back from assign page)
  // Only reload if we're coming back from another page, not on every focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        wasHiddenRef.current = true;
        lastHiddenTimeRef.current = Date.now();
      } else if (
        document.visibilityState === "visible" &&
        wasHiddenRef.current
      ) {
        // Only reload if page was hidden for more than 1 second (user likely navigated away)
        const timeHidden = lastHiddenTimeRef.current
          ? Date.now() - lastHiddenTimeRef.current
          : 0;
        if (timeHidden > 1000) {
          loadCategories(true);
        }
        wasHiddenRef.current = false;
        lastHiddenTimeRef.current = null;
      }
    };

    // Remove focus listener - it causes too many unnecessary reloads
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadCategories]);

  const handleCreateCategory = useCallback(() => {
    setEditingCategory(undefined);
    setIsModalOpen(true);
  }, []);

  const handleEditCategory = useCallback((category: CampaignCategory) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  }, []);

  const handleDeleteCategory = useCallback((category: CampaignCategory) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    try {
      await campaignService.deleteCampaignCategory(categoryToDelete.id);
      // Refresh from server to ensure cache is cleared
      await loadCategories(true); // skipCache = true
      showToast(
        "Category Deleted",
        `"${categoryToDelete.name}" has been deleted successfully.`,
      );
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    } catch (err) {
      console.error("Failed to delete category:", err);
      const errorMessage = extractBackendError(err, "Failed to delete category");
      showError("Error", errorMessage, true);
    } finally {
      setIsDeleting(false);
    }
  }, [categoryToDelete, loadCategories, showToast, showError]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteModal(false);
    setCategoryToDelete(null);
  }, []);

  const handleToggleActive = useCallback(
    async (category: CampaignCategory) => {
      try {
        setTogglingCategoryId(category.id);
        const newActiveStatus = !category.is_active;

        // Optimistic update - update local state immediately
        setCampaignCategories((prev) =>
          prev.map((cat) =>
            cat.id === category.id ? { ...cat, is_active: newActiveStatus } : cat
          )
        );

        await campaignService.updateCampaignCategory(category.id, {
          is_active: newActiveStatus,
        });

        showToast(
          newActiveStatus ? "Category Activated" : "Category Deactivated",
          `"${category.name}" has been ${
            newActiveStatus ? "activated" : "deactivated"
          } successfully.`,
        );
      } catch (err) {
        console.error("Failed to toggle category status:", err);
        // Revert optimistic update on error by reloading
        await loadCategories(true);
        // Display backend error message and bypass silent mode for important errors
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update category";
        showError("Toggle Failed", errorMessage, true);
      } finally {
        setTogglingCategoryId(null);
      }
    },
    [loadCategories, showToast, showError],
  );

  const handleCategorySaved = useCallback(
    async (categoryData: { name: string; description?: string }) => {
      try {
        setIsSaving(true);
        if (editingCategory) {
          // Update existing category
          await campaignService.updateCampaignCategory(
            editingCategory.id,
            categoryData,
          );
          await loadCategories(true);
          showToast("Category updated successfully");
        } else {
          // Create new category - ensure created_by is a number
          const createdBy = user?.user_id;
          if (!createdBy) {
            showError("User ID is required", "Please log in again.", true);
            return;
          }

          // Convert to number if it's a string
          const createdByNumber =
            typeof createdBy === "string" ? parseInt(createdBy, 10) : createdBy;

          if (isNaN(createdByNumber)) {
            showError("Invalid user ID", "Please log in again.", true);
            return;
          }

          // Create new category with all required and optional fields
          await campaignService.createCampaignCategory({
            name: categoryData.name,
            description: categoryData.description || "", // required, default to empty string
            parent_category_id: null, // optional, default to null
            display_order: 10, // optional, default to 10
            is_active: true, // optional, default to true
            created_by: createdByNumber, // required, must be a number
          });
          await loadCategories(true);
          showToast("Category created successfully");
        }
        setIsModalOpen(false);
        setEditingCategory(undefined);
      } catch (err) {
        const errorMessage = extractBackendError(err, "Failed to save category");
        showError("Error", errorMessage, true);
      } finally {
        setIsSaving(false);
      }
    },
    [editingCategory, loadCategories, showToast, showError, user],
  );

  const handleViewCampaigns = useCallback(
    async (category: CampaignCategory) => {
      try {
        const categoryId = Number(category.id);
        if (isNaN(categoryId)) {
          showError("Invalid category", "Category ID must be a number", true);
          return;
        }

        setSelectedCategory(category);
        setIsCampaignsModalOpen(true);
        setCampaignsLoading(true);

        // Fetch campaigns for this category using the dedicated endpoint
        // Backend handles both primary category_id and tag-based assignments
        let allCampaigns: BackendCampaignType[] = [];
        let offset = 0;
        const limit = 100;
        let hasMore = true;

        while (hasMore) {
          const response = await campaignService.getCampaignsByCategory(
            categoryId,
            {
              limit: limit,
              offset: offset,
              skipCache: true,
            },
          );

          const campaigns = (response.data || []) as BackendCampaignType[];
          allCampaigns = [...allCampaigns, ...campaigns];

          const total = response.pagination?.total || 0;
          hasMore = allCampaigns.length < total && campaigns.length === limit;
          offset += limit;
        }

        const formattedCampaigns = allCampaigns.map((campaign) => ({
          id: String(campaign.id),
          name: campaign.name,
          description: campaign.description || undefined,
          status: campaign.status,
          approval_status: campaign.approval_status,
          start_date: campaign.start_date || undefined,
          end_date: campaign.end_date || undefined,
          category_id: campaign.category_id || undefined,
          tags: campaign.tags || [],
        }));

        setCampaigns(formattedCampaigns);
      } catch (err) {
        const errorMessage = extractBackendError(err, "Failed to load campaigns");
        showError("Error", errorMessage, true);
        setCampaigns([]);
      } finally {
        setCampaignsLoading(false);
      }
    },
    [showError],
  );

  const handleNavigateToCampaignDetails = () => {
    if (!primaryCategoryItemId) return;
    setShowPrimaryCategoryModal(false);
    setPrimaryCategoryItemId(null);
    navigate(`/dashboard/campaigns/${primaryCategoryItemId}`);
  };

  const handleRemoveCampaign = useCallback(
    async (campaignId: number | string) => {
      if (!selectedCategory) return;

      await removeFromCatalog({
        entityType: "campaign",
        entityId: campaignId,
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        onRefresh: async () => {
          if (selectedCategory) {
            await handleViewCampaigns(selectedCategory);
          }
        },
        onRefreshCategories: async () => {
          await loadCategories(true);
        },
        getEntityById: async (id) =>
          await campaignService.getCampaignById(id, true),
        updateEntity: async (id, updates) => {
          await campaignService.updateCampaign(id, updates);
        },
        onShowPrimaryCategoryWarning: async (id) => {
          setPrimaryCategoryItemId(id);
          setShowPrimaryCategoryModal(true);
        },
      });
    },
    [selectedCategory, removeFromCatalog, handleViewCampaigns, loadCategories],
  );

  const filteredCampaignCategories = useMemo(() => {
    return (campaignCategories || [])
      .filter(
        (category) =>
          category?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (category?.description &&
            category.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase())),
      )
      .sort((a, b) => {
        // Sort by created_at (newest first), keeping items in place regardless of active status
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });
  }, [campaignCategories, searchTerm]);

  const formatNumber = useCallback(
    (value?: number | null) =>
      typeof value === "number" ? value.toLocaleString() : "...",
    [],
  );

  const catalogStatsCards = useMemo(
    () => [
      {
        name: "Total Catalogs",
        value: formatNumber(stats?.totalCategories),
        icon: FolderOpen,
        color: color.tertiary.tag1,
      },
      {
        name: "Active Catalogs",
        value: formatNumber(stats?.activeCategories),
        icon: CheckCircle,
        color: color.tertiary.tag4,
      },
      {
        name: "Inactive Catalogs",
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
        description: `${formatNumber(popularCategory?.count ?? 0)} campaigns`,
        title: popularCategory?.name || undefined,
        valueClass: "text-xl",
      },
    ],
    [stats, unusedCount, popularCategory, formatNumber],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* <button
            onClick={() => navigate("/dashboard/campaigns")}
            className={`p-2 text-gray-600 hover:text-gray-800 ${tw.rounded} transition-colors`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button> */}
          <div>
            <h1
              className={`font-['Satoshi_Variable',sans-serif] text-xl sm:text-2xl font-[800] leading-[110%] tracking-[-0.04em] ${tw.textPrimary}`}
            >
              {t.campaignCatalogs.title}
            </h1>
            <p className={`${tw.textSecondary} mt-2 text-sm`}>
              {t.campaignCatalogs.subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <PermissionGate permission="campaign-catalog.create">
            <CreateButton onClick={handleCreateCategory} />
          </PermissionGate>
        </div>
      </div>

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
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={t.campaignCatalogs.searchPlaceholder}
        />
        <div className="flex items-center gap-2">
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

      {/* Categories */}
      {(() => {
        const startIndex = (catalogPage - 1) * catalogPageSize;
        const endIndex = startIndex + catalogPageSize;
        const paginatedCategories = filteredCampaignCategories.slice(startIndex, endIndex);

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
          <p className={`${tw.textMuted} font-medium`}>Loading catalogs...</p>
        </div>
      ) : filteredCampaignCategories.length === 0 ? (
        <div
          className={`${tw.rounded} shadow-sm border border-gray-200 text-center py-16 px-4`}
          style={{ backgroundColor: color.surface.cards }}
        >
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className={`${tw.cardHeading} text-gray-900 mb-1`}>
            {searchTerm ? "No catalogs found" : "No catalogs yet"}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {searchTerm
              ? "Try adjusting your search terms"
              : "Create your first campaign catalog to organize your campaigns"}
          </p>
          {!searchTerm && (
            <PermissionGate permission="campaign-catalog.create">
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
                  <button
                    onClick={() => handleToggleActive(category)}
                    disabled={togglingCategoryId === category.id}
                    className={`p-2 ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={category.is_active ? "Deactivate" : "Activate"}
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
                    className={`p-2 ${tw.rounded} transition-colors`}
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category)}
                    className={`p-2 ${tw.rounded} transition-colors`}
                    title="Delete"
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

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-600">
                  {(() => {
                    // Use campaign_count from backend (already calculated correctly)
                    const count = category.campaign_count || 0;
                    return (
                      <>
                        {count} campaign
                        {count !== 1 ? "s" : ""}
                      </>
                    );
                  })()}
                </span>
                <PermissionGate permission="campaign-catalog-view.read">
                  <button
                    onClick={() => handleViewCampaigns(category)}
                    className="text-sm font-medium text-gray-700 hover:underline transition-colors"
                    title="View & Assign Campaigns"
                  >
                    View Campaigns
                  </button>
                </PermissionGate>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedCategories.map((category) => (
            <div
              key={category.id}
              className={`border border-gray-200 ${tw.rounded} p-4 hover:shadow-md transition-all`}
              style={{ backgroundColor: color.surface.cards }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-1">
                    <h3 className={`${tw.tableFirstColumn} text-gray-900 truncate`}>
                      {category.name}
                    </h3>
                    <p className={`${tw.cardSubHeading} text-gray-600 mt-0.5`}>
                      {(() => {
                        // Use campaign_count from backend (already calculated correctly)
                        const count = category.campaign_count || 0;
                        return (
                          <>
                            {count} campaign
                            {count !== 1 ? "s" : ""}
                          </>
                        );
                      })()}
                    </p>
                  </div>
                  <PermissionGate permission="campaign-catalog-view.read">
                    <button
                      onClick={() => handleViewCampaigns(category)}
                      className="text-sm font-medium text-gray-700 hover:underline transition-colors"
                      title="View & Assign Campaigns"
                    >
                      View Campaigns
                    </button>
                  </PermissionGate>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                <PermissionGate permission="campaign-catalog.update">
                  <button
                    onClick={() => handleToggleActive(category)}
                    disabled={togglingCategoryId === category.id}
                    className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={category.is_active ? "Deactivate" : "Activate"}
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
                  title="Edit"
                >
                  <Edit className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => handleDeleteCategory(category)}
                  className={`p-2 hover:bg-red-50 ${tw.rounded} transition-colors`}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredCampaignCategories.length > 0 && (
        <Pagination
          currentPage={catalogPage}
          pageSize={catalogPageSize}
          totalItems={filteredCampaignCategories.length}
          onPageChange={(newPage) => {
            setCatalogPage(newPage);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}
          </>
        );
      })()}

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(undefined);
        }}
        category={editingCategory}
        onSave={handleCategorySaved}
        isSaving={isSaving}
      />

      {/* Campaigns Modal */}
      <CatalogItemsModal
        isOpen={isCampaignsModalOpen}
        onClose={() => {
          setIsCampaignsModalOpen(false);
          setSelectedCategory(null);
          setCampaigns([]);
        }}
        category={selectedCategory}
        items={campaigns}
        loading={campaignsLoading}
        entityName="campaign"
        entityNamePlural="campaigns"
        assignRoute={`/dashboard/campaign-catalogs/${selectedCategory?.id}/assign`}
        viewRoute={(id) => `/dashboard/campaigns/${id}`}
        onRemove={async (id) => {
          await handleRemoveCampaign(id);
        }}
        removingId={removingId}
        onRefresh={async () => {
          if (selectedCategory) {
            await handleViewCampaigns(selectedCategory);
            // Also refresh the categories list to update counts on cards
            await loadCategories(true);
          }
        }}
        renderStatus={(campaign) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              campaign.status === "active"
                ? "bg-green-100 text-green-800"
                : campaign.status === "draft"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
            }`}
          >
            {campaign.status || "unknown"}
          </span>
        )}
      />

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
              This catalog is the campaign's primary catalog. Update the
              campaign to use a different primary catalog before removing it
              here.
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
                onClick={handleNavigateToCampaignDetails}
                className="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors"
                style={{ backgroundColor: color.primary.action }}
              >
                Change Primary Catalog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
        itemName={categoryToDelete?.name || ""}
        isLoading={isDeleting}
        confirmText="Delete Category"
        cancelText="Cancel"
      />
    </div>
  );
}
