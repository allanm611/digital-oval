import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Edit,
  Trash2,
  Users,
  Grid,
  List,
  FolderOpen,
  CheckCircle,
  XCircle,
  X,
  Archive,
  Star,
} from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import CategoryModal from "../../../shared/components/CategoryModal";
import CatalogItemsModal from "../../../shared/components/CatalogItemsModal";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import NumberFormatter from "../../../shared/components/NumberFormatter";
import { color, tw, button } from "../../../shared/utils/utils";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useRemoveFromCatalog } from "../../../shared/hooks/useRemoveFromCatalog";
import { segmentService } from "../services/segmentService";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import {
  SegmentCategory,
  CreateSegmentCategoryRequest,
  UpdateSegmentCategoryRequest,
} from "../types/segment";
import { Segment } from "../types/segment";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import FeatureActionButton from "../../../shared/components/FeatureActionButton";
import Pagination from "../../../shared/components/ui/Pagination";
import { PermissionGate } from "../../auth/components/PermissionGate";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";

const SEGMENT_CATALOG_TAG_PREFIX = "catalog:";

const buildSegmentCatalogTag = (categoryId: number | string) =>
  `${SEGMENT_CATALOG_TAG_PREFIX}${categoryId}`;

const parseSegmentCatalogTag = (tag?: string): number | null => {
  if (!tag || !tag.startsWith(SEGMENT_CATALOG_TAG_PREFIX)) {
    return null;
  }
  const value = tag.slice(SEGMENT_CATALOG_TAG_PREFIX.length);
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

interface SegmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: SegmentCategory | null;
  onRefreshCategories: () => Promise<void> | void;
}

function SegmentsModal({
  isOpen,
  onClose,
  category,
  onRefreshCategories,
}: SegmentsModalProps) {
  const { removeFromCatalog, removingId } = useRemoveFromCatalog();
  const { success: showToast, error: showError } = useToast();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadCategorySegments = useCallback(async () => {
    setIsLoading(true);
    try {
      const categoryId =
        typeof category.id === "string"
          ? parseInt(category.id, 10)
          : category.id;

      // Fetch segments for this category using the dedicated endpoint
      // Backend handles both primary category and tag-based assignments
      let allSegments: Segment[] = [];
      let offset = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const response = await segmentService.getSegmentsByCategory(categoryId, {
          limit: limit,
          offset: offset,
          skipCache: true,
        });

        const segments = (response as { data?: Segment[] }).data || [];
        allSegments = [...allSegments, ...segments];

        const total = (response as { pagination?: { total: number } })
          .pagination?.total || 0;
        hasMore = allSegments.length < total && segments.length === limit;
        offset += limit;
      }

      setSegments(allSegments);
    } catch (err) {
      // Failed to load segments
      setSegments([]);
    } finally {
      setIsLoading(false);
    }
  }, [category?.id]);

  useEffect(() => {
    if (isOpen && category) {
      loadCategorySegments();
    }
  }, [isOpen, category, loadCategorySegments]);

  // Get assigned segment IDs (segments in this category)
  const assignedSegmentIds = segments
    .map((segment) => segment.id)
    .filter((id): id is number | string => id !== undefined);

  // Handle assignment
  const handleAssignSegments = async (
    segmentIds: (number | string)[],
  ): Promise<{ success: number; failed: number; errors?: string[] }> => {
    if (!category) {
      return { success: 0, failed: 0 };
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    // Assign each segment individually
    for (const segmentId of segmentIds) {
      try {
        await segmentService.updateSegment(Number(segmentId), {
          category: category.id,
        });
        success++;
      } catch (err) {
        failed++;
        const errorMsg =
          err instanceof Error
            ? err.message
            : `Failed to assign segment ${segmentId}`;
        errors.push(errorMsg);
      }
    }

    // Refresh segments list and counts
    loadCategorySegments();
    onRefreshCategories();

    return { success, failed, errors };
  };

  const handleRemoveSegment = async (segmentId: number | string) => {
    if (!category) return;

    await removeFromCatalog({
      entityType: "segment",
      entityId: segmentId,
      categoryId: category.id,
      categoryName: category.name,
      onRefresh: loadCategorySegments,
      onRefreshCategories: onRefreshCategories,
      getEntityById: async (id) =>
        await segmentService.getSegmentById(id, true),
      updateEntity: async (id, updates) =>
        await segmentService.updateSegment(id, updates),
      buildCatalogTagFn: buildSegmentCatalogTag,
    });
  };

  return (
    <CatalogItemsModal<Segment>
      isOpen={isOpen}
      onClose={onClose}
      category={category}
      items={segments}
      loading={isLoading}
      entityName="segment"
      entityNamePlural="segments"
      assignRoute={`/dashboard/segment-catalogs/${category?.id}/assign`}
      viewRoute={(id) => `/dashboard/segments/${id}`}
      onRemove={handleRemoveSegment}
      removingId={removingId}
      onRefresh={async () => {
        await loadCategorySegments();
        await onRefreshCategories();
      }}
      renderItem={(segment) => (
        <div>
          <h3 className="font-medium text-gray-900">{segment.name}</h3>
          {segment.description && (
            <p className="text-sm text-gray-500 mt-1">{segment.description}</p>
          )}
          {segment.customer_count !== undefined && (
            <p className="text-xs text-gray-400 mt-1">
              {segment.customer_count.toLocaleString()} customers
            </p>
          )}
        </div>
      )}
    />
  );
}

export default function SegmentCategoriesPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] =
    useState<SegmentCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingCategoryId, setTogglingCategoryId] = useState<number | null>(
    null,
  );

  const [categories, setCategories] = useState<SegmentCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<SegmentCategory | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSegmentsModalOpen, setIsSegmentsModalOpen] = useState(false);
  const [segmentCounts, setSegmentCounts] = useState<Record<number, number>>(
    {},
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Pagination states
  const [catalogPage, setCatalogPage] = useState(1);
  const catalogPageSize = 9; // Show 9 items per page (3x3 grid)


  const loadCategories = useCallback(
    async (skipCache = false) => {
      setIsLoading(true);
      try {
        let response;
        // Always skip cache when explicitly requested, otherwise default to true for fresh data
        const shouldSkipCache = skipCache !== false ? true : false;
        // Use getSegmentCategories endpoint instead of super-search
        response = await segmentService.getSegmentCategories(
          debouncedSearchTerm.trim() || undefined,
          shouldSkipCache,
        );
        const categoriesData = response.data || [];

        // Ensure all category IDs are numbers
        const validCategoriesData = categoriesData.map(
          (cat: SegmentCategory & { id: number | string }) => ({
            ...cat,
            id: typeof cat.id === "string" ? parseInt(cat.id, 10) : cat.id,
          }),
        );

        setCategories(validCategoriesData);

        // Load segment counts for each category
        await loadSegmentCounts(validCategoriesData);
      } catch (err) {
        const errorMsg = extractBackendError(err, "Failed to load segment catalogs");
        showError("Error", errorMsg);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    },
    [showError, debouncedSearchTerm],
  );

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories, debouncedSearchTerm]);

  const loadSegmentCounts = async (cats: SegmentCategory[]) => {
    try {
      const response = await segmentService.getSegments({ skipCache: true });
      const segmentsData = ((response as { data?: Segment[] }).data ||
        []) as Segment[];

      const counts: Record<number, number> = {};
      const categoriesIndex = new Map<number, boolean>();
      cats.forEach((cat) => {
        const catId =
          typeof cat.id === "string" ? parseInt(cat.id, 10) : cat.id;
        categoriesIndex.set(catId, true);
        counts[catId] = 0;
      });

      segmentsData.forEach((segment) => {
        const membershipIds = new Set<number>();

        const primaryCategory =
          typeof segment.category === "string"
            ? parseInt(segment.category, 10)
            : segment.category;
        if (
          typeof primaryCategory === "number" &&
          !Number.isNaN(primaryCategory) &&
          categoriesIndex.has(primaryCategory)
        ) {
          membershipIds.add(primaryCategory);
        }

        (segment.tags || []).forEach((tag) => {
          const parsed = parseSegmentCatalogTag(tag);
          if (
            typeof parsed === "number" &&
            !Number.isNaN(parsed) &&
            categoriesIndex.has(parsed)
          ) {
            membershipIds.add(parsed);
          }
        });

        membershipIds.forEach((catId) => {
          counts[catId] = (counts[catId] || 0) + 1;
        });
      });

      setSegmentCounts(counts);
    } catch (err) {
      console.error("Failed to load segment counts:", err);
    }
  };

  const handleCreateCategory = async (categoryData: {
    name: string;
    description?: string;
  }) => {
    try {
      const request: CreateSegmentCategoryRequest = {
        name: categoryData.name,
        description: categoryData.description,
      };

      await segmentService.createSegmentCategory(request);
      success(
        "Catalog created",
        `Segment catalog "${categoryData.name}" has been created successfully`,
      );
      await loadCategories(true); // skipCache = true
    } catch (err) {
      // Re-throw with actual backend error message
      throw err;
    }
  };

  const handleUpdateCategory = async (categoryData: {
    name: string;
    description?: string;
  }) => {
    if (!selectedCategory) return;

    try {
      const request: UpdateSegmentCategoryRequest = {
        name: categoryData.name,
        description: categoryData.description,
      };

      await segmentService.updateSegmentCategory(selectedCategory.id, request);
      success(
        "Catalog updated",
        `Segment catalog "${categoryData.name}" has been updated successfully`,
      );
      await loadCategories(true); // skipCache = true
    } catch (err) {
      // Re-throw with actual backend error message
      throw err;
    }
  };

  const handleDeleteCategory = (category: SegmentCategory) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const handleToggleActive = async (category: SegmentCategory) => {
    try {
      setTogglingCategoryId(category.id);
      const newActiveStatus = !category.is_active;

      // Optimistic update - update local state immediately
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === category.id ? { ...cat, is_active: newActiveStatus } : cat
        )
      );

      // Create a clean request object with only is_active field
      const updateRequest: UpdateSegmentCategoryRequest = {
        is_active: newActiveStatus,
      };

      await segmentService.updateSegmentCategory(category.id, updateRequest);

      success(
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
      showError("Toggle Failed", extractBackendError(error, "Toggle Failed. Please try again."));
    } finally {
      setTogglingCategoryId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    const segmentCount = segmentCounts[categoryToDelete.id] || 0;
    setIsDeleting(true);
    const previousCategories = categories;

    try {
      // Optimistic update: remove category from list immediately
      setCategories((prev) => prev.filter((cat) => cat.id !== categoryToDelete.id));

      await segmentService.deleteSegmentCategory(categoryToDelete.id);
      success(
        "Catalog deleted",
        `Segment catalog "${categoryToDelete.name}" has been deleted successfully`,
      );
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    } catch (err) {
      const errorMsg2 = extractBackendError(err, "Failed to delete segment catalog");
      showError("Error", extractBackendError(error, "Error. Please try again."));
      // Revert optimistic update on error
      setCategories(previousCategories);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setCategoryToDelete(null);
  };

  const filteredCategories = categories
    .filter(
      (category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description &&
          category.description.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    .sort((a, b) => {
      // Sort by created_at (newest first), keeping items in place regardless of active status
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });

  const totalCategories = categories.length;
  const activeCategories = categories.filter((cat) => cat.is_active).length;
  const inactiveCategories = Math.max(0, totalCategories - activeCategories);
  const categoriesWithSegmentsCount = categories.filter(
    (cat) => (segmentCounts[cat.id] || 0) > 0,
  ).length;
  const emptyCategoriesCount = Math.max(
    0,
    totalCategories - categoriesWithSegmentsCount,
  );

  const mostPopularCategoryRaw = categories.reduce<{
    name: string;
    count: number;
  } | null>((acc, category) => {
    const count = segmentCounts[category.id] || 0;
    if (!acc || count > acc.count) {
      return { name: category.name, count };
    }
    return acc;
  }, null);

  const mostPopularCategory =
    mostPopularCategoryRaw && mostPopularCategoryRaw.count > 0
      ? mostPopularCategoryRaw
      : null;

  const totalSegments = Object.values(segmentCounts).reduce(
    (sum, count) => sum + count,
    0,
  );
  const averageSegments =
    totalCategories > 0 ? totalSegments / totalCategories : 0;

  const statsLoading = isLoading && totalCategories === 0;

  const catalogStatsCards = [
    {
      name: "Total Catalogs",
      value: totalCategories,
      icon: FolderOpen,
      color: color.tertiary.tag1,
    },
    {
      name: "Active Catalogs",
      value: activeCategories,
      icon: CheckCircle,
      color: color.tertiary.tag4,
    },
    {
      name: "Inactive Catalogs",
      value: inactiveCategories,
      icon: XCircle,
      color: color.tertiary.tag3,
    },
    {
      name: "Empty Catalogs",
      value: emptyCategoriesCount,
      icon: Archive,
      color: color.tertiary.tag2,
    },
    {
      name: "Most Popular",
      value: mostPopularCategory?.name || "None",
      icon: Star,
      color: color.primary.accent,
      title: mostPopularCategory?.name || undefined,
      valueClass: "text-xl",
      loading: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
          {/* <BackButton /> */}
          <div className="min-w-0 flex-1">
            <h1 className={`${tw.mainHeading} ${tw.textPrimary} truncate`}>
              {t.segmentCatalogs.title}
            </h1>
            <p className={`${tw.textSecondary} mt-2 text-sm`}>
              {t.segmentCatalogs.subtitle}
            </p>
          </div>
        </div>

        <PermissionGate permission="segment-catalog.create">
          <FeatureActionButton
            featureId="segment-categories"
            action="create"
            onClick={() => {
              setSelectedCategory(null);
              setIsCategoryModalOpen(true);
            }}
          />
        </PermissionGate>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {catalogStatsCards.map((stat) => {
          const Icon = stat.icon;
          const valueClass = stat.valueClass ?? "text-3xl";
          const shouldMask = stat.loading ?? true;
          const isNumeric = typeof stat.value === "number";
          const displayValue =
            statsLoading && shouldMask ? "..." : (isNumeric ? <NumberFormatter value={stat.value} /> : (stat.value ?? "..."));

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

      {/* Search and View Toggle */}
      <div className="flex items-center gap-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={t.segmentCatalogs.searchPlaceholder}
        />
        <div className="flex items-center gap-2  p-1">
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
        const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

        return (
          <>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <LoadingSpinner
            variant="modern"
            size="xl"
            color="primary"
            className="mb-4"
          />
          <p className={`${tw.textMuted} font-medium`}>Loading catalogs...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div
          className={`bg-white ${tw.rounded} shadow-sm border border-gray-200 text-center py-16 px-4`}
        >
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className={`${tw.cardHeading} text-gray-900 mb-1`}>
            {searchTerm ? "No catalogs found" : "No catalogs yet"}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {searchTerm
              ? "Try adjusting your search terms"
              : "Create your first segment catalog to organize your segments"}
          </p>
          {!searchTerm && (
            <PermissionGate permission="segment-catalog.create">
              <FeatureActionButton
                featureId="segment-categories"
                action="create"
                onClick={() => {
                  setSelectedCategory(null);
                  setIsCategoryModalOpen(true);
                }}
              />
            </PermissionGate>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedCategories.map((category) => (
            <div
              key={category.id}
              className={`bg-white border border-gray-200 ${tw.rounded} p-6 hover:shadow-md transition-all`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Users className="w-5 h-5 flex-shrink-0" style={{ color: color.primary.accent }} />
                  <h3 className={`${tw.tableFirstColumn} text-gray-900 truncate`}>
                    {category.name}
                  </h3>
                </div>
                <div className="flex items-center space-x-1">
                  <ActivateDeactivateButton
                    isActive={category.is_active}
                    onToggle={() => handleToggleActive(category)}
                    disabled={togglingCategoryId === category.id}
                    isLoading={togglingCategoryId === category.id}
                    title={category.is_active ? "Deactivate" : "Activate"}
                  />
                  <button
                    onClick={() => {
                      setSelectedCategory(category);
                      setIsCategoryModalOpen(true);
                    }}
                    className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category)}
                    className={`p-2 icon-delete ${tw.rounded} transition-colors`}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 " />
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
                  {segmentCounts[category.id] || 0} segment
                  {segmentCounts[category.id] !== 1 ? "s" : ""}
                </span>
                <PermissionGate permission="segment-catalog-view.read">
                  <button
                    onClick={() => {
                      setSelectedCategory(category);
                      setIsSegmentsModalOpen(true);
                    }}
                    className="text-sm font-medium text-gray-700 hover:underline transition-colors"
                    title="View Segments"
                  >
                    View Segments
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
              className={`bg-white border border-gray-200 ${tw.rounded} p-4 hover:shadow-md transition-all`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-1">
                    <h3 className={`${tw.tableFirstColumn} text-gray-900`}>
                      {category.name}
                    </h3>
                    <p className={`${tw.cardSubHeading} text-gray-600 mt-0.5`}>
                      {segmentCounts[category.id] || 0} segment
                      {segmentCounts[category.id] !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <PermissionGate permission="segment-catalog-view.read">
                    <button
                      onClick={() => {
                        setSelectedCategory(category);
                        setIsSegmentsModalOpen(true);
                      }}
                      className="text-sm font-medium text-gray-700 hover:underline transition-colors"
                      title="View Segments"
                    >
                      View Segments
                    </button>
                  </PermissionGate>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                <PermissionGate permission="segment-catalog.update">
                  <ActivateDeactivateButton
                    isActive={category.is_active}
                    onToggle={() => handleToggleActive(category)}
                    disabled={togglingCategoryId === category.id}
                    isLoading={togglingCategoryId === category.id}
                    title={category.is_active ? "Deactivate" : "Activate"}
                  />
                </PermissionGate>
                <button
                  onClick={() => {
                    setSelectedCategory(category);
                    setIsCategoryModalOpen(true);
                  }}
                  className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
                  title="Edit"
                >
                  <Edit className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => handleDeleteCategory(category)}
                  className={`p-2 icon-delete ${tw.rounded} transition-colors`}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 " />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && filteredCategories.length > 0 && (
        <Pagination
          currentPage={catalogPage}
          pageSize={catalogPageSize}
          totalItems={filteredCategories.length}
          onPageChange={(newPage) => {
            setCatalogPage(newPage);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}
          </>
        );
      })()}

      {/* Modals */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory || undefined}
        onCategoryUpdated={async () => {
          setSelectedCategory(null);
          await loadCategories(true);
        }}
        onCategoryCreated={async () => {
          await loadCategories(true);
        }}
        entityType="segment"
      />

      <SegmentsModal
        isOpen={isSegmentsModalOpen}
        onClose={() => {
          setIsSegmentsModalOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onRefreshCategories={async () => {
          await loadCategories(true); // skipCache = true
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Segment Catalog"
        description={
          categoryToDelete && (segmentCounts[categoryToDelete.id] || 0) > 0
            ? `This catalog contains ${
                segmentCounts[categoryToDelete.id]
              } segment(s). Deleting it will unassign all segments. Are you sure you want to continue?`
            : "Are you sure you want to delete this catalog? This action cannot be undone."
        }
        itemName={categoryToDelete?.name || ""}
        isLoading={isDeleting}
        confirmText="Delete Catalog"
        cancelText="Cancel"
      />
    </div>
  );
}
