import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Grid,
  List,
  Filter,
  XCircle,
  X,
  FolderOpen,
  CheckCircle,
  Archive,
  Star,
  Power,
  PowerOff,
} from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import CatalogItemsModal from "../../../shared/components/CatalogItemsModal";
import BackButton from "../../../shared/components/ui/BackButton";
import {
  CategoryStats,
  ProductCategory,
  ProductCountByCategory,
} from "../types/productCategory";
import { Product, CategoryPerformance } from "../types/product";
import { productCategoryService } from "../services/productCategoryService";
import { productService } from "../services/productService";
import { color, tw, button, zIndex } from "../../../shared/utils/utils";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import CurrencyFormatter from "../../../shared/components/CurrencyFormatter";
import {
  buildCatalogTag,
  parseCatalogTag,
} from "../../../shared/utils/catalogTags";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useRemoveFromCatalog } from "../../../shared/hooks/useRemoveFromCatalog";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import CreateCategoryModal from "../../../shared/components/CreateCategoryModal";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import CreateButton from "../../../shared/components/ui/CreateButton";
import Pagination from "../../../shared/components/ui/Pagination";
import { PermissionGate } from "../../auth/components/PermissionGate";
import Radio from "../../../shared/components/ui/Radio";

interface ProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: ProductCategory | null;
  onRefreshCategories: () => void | Promise<void>;
  onRefreshProductCounts: () => Promise<void> | void;
  allProducts: Product[];
  refreshAllProducts: () => Promise<Product[]>;
  categories: ProductCategory[];
  refreshCategoryProductCounts: (
    categoriesOverride?: ProductCategory[],
    productsSnapshotOverride?: Product[],
  ) => Promise<CategoryCountMap>;
}

type CategoryCountMap = Record<
  string,
  {
    total_products: number;
    active_products: number;
    inactive_products: number;
  }
>;

const parseCountValue = (value?: number | string | null): number => {
  if (typeof value === "number") {
    return Number.isNaN(value) ? 0 : value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const mergeTagCountsFromSnapshot = (
  baseCounts: CategoryCountMap,
  categoriesList: ProductCategory[],
  productsSnapshot: Product[],
): CategoryCountMap => {
  if (!categoriesList.length || !productsSnapshot.length) {
    return baseCounts;
  }

  const allowedCategoryIds = new Set(
    categoriesList
      .map((category) => Number(category.id))
      .filter((id) => Number.isFinite(id)),
  );

  const updatedCounts: CategoryCountMap = { ...baseCounts };

  productsSnapshot.forEach((product) => {
    const primaryCategoryId = Number(product.category_id);
    const primaryIsAllowed =
      Number.isFinite(primaryCategoryId) &&
      allowedCategoryIds.has(primaryCategoryId);

    if (primaryIsAllowed) {
      const key = String(primaryCategoryId);
      if (!updatedCounts[key]) {
        updatedCounts[key] = {
          total_products: 0,
          active_products: 0,
          inactive_products: 0,
        };
      }
      updatedCounts[key].total_products += 1;
      if (product.is_active) {
        updatedCounts[key].active_products += 1;
      } else {
        updatedCounts[key].inactive_products += 1;
      }
    }

    if (!Array.isArray(product.tags) || product.tags.length === 0) {
      return;
    }

    const uniqueTaggedCatalogs = Array.from(
      new Set(
        product.tags
          .map((tag) => parseCatalogTag(tag))
          .filter(
            (catalogId): catalogId is number =>
              typeof catalogId === "number" &&
              allowedCategoryIds.has(catalogId),
          ),
      ),
    );

    uniqueTaggedCatalogs.forEach((catalogId) => {
      if (primaryIsAllowed && primaryCategoryId === catalogId) {
        return;
      }

      const key = String(catalogId);
      if (!updatedCounts[key]) {
        updatedCounts[key] = {
          total_products: 0,
          active_products: 0,
          inactive_products: 0,
        };
      }

      updatedCounts[key].total_products += 1;
      if (product.is_active) {
        updatedCounts[key].active_products += 1;
      } else {
        updatedCounts[key].inactive_products += 1;
      }
    });
  });

  return updatedCounts;
};

function ProductsModal({
  isOpen,
  onClose,
  category,
  onRefreshCategories,
  onRefreshProductCounts,
  allProducts,
  refreshAllProducts,
  categories,
  refreshCategoryProductCounts,
}: ProductsModalProps) {
  const { removeFromCatalog, removingId } = useRemoveFromCatalog();
  const { success: showToast, error: showError } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && category) {
      loadProducts();
    }
  }, [isOpen, category]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProducts = async (): Promise<Product[] | undefined> => {
    if (!category) return;

    try {
      setLoading(true);
      setError(null);

      // Always fetch fresh data with skipCache (same approach as segments/offers/campaigns)
      // This ensures removed products disappear immediately
      const limit = 100;
      let offset = 0;
      const allProductsList: Product[] = [];
      let hasMore = true;

      while (hasMore) {
        const response = await productService.getAllProducts({
          limit: limit,
          offset: offset,
          skipCache: true, // Always skip cache to get fresh data
        });

        const products = response.data || [];
        allProductsList.push(...products);

        const total = response.pagination?.total || 0;
        hasMore = allProductsList.length < total && products.length === limit;
        offset += limit;
      }

      const snapshot = allProductsList;

      // Update parent's allProducts state with fresh data (skipCache: true)
      // This ensures refreshCategoryProductCounts uses fresh data instead of stale cache
      await refreshAllProducts();

      const categoryId = Number(category.id);
      const catalogTag = buildCatalogTag(category.id);

      // Fetch products by primary category and by tag using endpoints
      const [productsResponse, taggedResponse] = await Promise.all([
        productService.getProductsByCategory(categoryId, {
          limit: 100,
          skipCache: true,
        }),
        productService.getProductsByTag({
          tag: catalogTag,
          limit: 100,
          skipCache: true,
        }),
      ]);

      // Merge both lists (primary category + tagged products)
      const mergedProducts = new Map<number, Product>();
      [
        ...(productsResponse.data || []),
        ...(taggedResponse.data || []),
      ].forEach((product) => {
        if (product && typeof product.id === "number") {
          mergedProducts.set(product.id, product);
        }
      });

      // Set products state (single state update)
      const filteredProducts = Array.from(mergedProducts.values());
      setProducts(filteredProducts);

      // Return snapshot for use in refreshCategoryProductCounts
      return snapshot;
    } catch (err) {
      console.error("Failed to load products:", err);
      const errorMsg1 = extractBackendError(err, "Failed to load products");
      showError("Error", errorMsg1, true);
      setError(""); // Clear error state
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  // const handleCreateProduct = () => {
  //   if (category) {
  //     navigate(`/dashboard/products/create?categoryId=${category.id}`);
  //   }
  // };

  const handleRemoveProduct = async (productId: number | string) => {
    if (!category) return;

    await removeFromCatalog({
      entityType: "product",
      entityId: productId,
      categoryId: category.id,
      categoryName: category.name,
      // Simple function reference like segments/offers - modal stays open during refresh
      onRefresh: loadProducts,
      onRefreshCategories: onRefreshCategories,
      onRefreshCounts: onRefreshProductCounts,
      getEntityById: async (id) =>
        await productService.getProductById(id, true),
      updateEntity: async () => {
        // Products use removeProductTag instead
      },
      removeEntityTag: async (id, tag) =>
        await productService.removeProductTag(id, tag),
    });
  };

  return (
    <CatalogItemsModal<Product>
      isOpen={isOpen}
      onClose={onClose}
      category={category}
      items={products}
      loading={loading}
      error={error}
      entityName="product"
      entityNamePlural="products"
      assignRoute={`/dashboard/products/catalogs/${category?.id}/assign`}
      viewRoute={(id) => `/dashboard/products/${id}`}
      onRemove={handleRemoveProduct}
      removingId={removingId}
      onRefresh={async () => {
        // Refresh the products list (always fetches fresh data)
        const freshProducts = await loadProducts();
        // Refresh counts using the fresh products snapshot to update category cards
        // This ensures counts reflect the newly assigned products
        if (freshProducts) {
          await refreshCategoryProductCounts(categories, freshProducts);
        } else {
          await Promise.resolve(onRefreshProductCounts());
        }
      }}
      renderStatus={(product) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            product.is_active
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {product.is_active ? "Active" : "Inactive"}
        </span>
      )}
    />
  );
}

export default function ProductCatalogsPage() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { t } = useLanguage();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] =
    useState<ProductCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingCategoryId, setTogglingCategoryId] = useState<number | null>(
    null,
  );

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [editingCatalog, setEditingCatalog] = useState<ProductCategory | null>(
    null,
  );
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<ProductCategory | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categoryProductCounts, setCategoryProductCounts] =
    useState<CategoryCountMap>({});
  const [categoryPerformance, setCategoryPerformance] = useState<
    Record<
      number,
      {
        totalValue: number;
        averagePrice: number;
      }
    >
  >({});
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Filter states
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [filterType, setFilterType] = useState<
    "all" | "active" | "inactive" | "with_products" | "empty"
  >("all");

  // Pagination states
  const [catalogPage, setCatalogPage] = useState(1);
  const catalogPageSize = 9; // Show 9 items per page (3x3 grid)

  // Advanced search states
  const [advancedSearch, setAdvancedSearch] = useState({
    exactName: "",
    isActive: null as boolean | null,
    createdAfter: "",
    createdBefore: "",
    productCountMin: "",
    productCountMax: "",
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Check if advanced search has any active filters
  const hasAdvancedFilters = () => {
    return (
      advancedSearch.exactName.trim() !== "" ||
      advancedSearch.isActive !== null ||
      advancedSearch.createdAfter !== "" ||
      advancedSearch.createdBefore !== "" ||
      advancedSearch.productCountMin !== "" ||
      advancedSearch.productCountMax !== ""
    );
  };

  // Clear all advanced search filters
  const clearAdvancedSearch = () => {
    setAdvancedSearch({
      exactName: "",
      isActive: null,
      createdAfter: "",
      createdBefore: "",
      productCountMin: "",
      productCountMax: "",
    });
  };

  const formatNumber = (value?: number | null) =>
    typeof value === "number" && !Number.isNaN(value)
      ? value.toLocaleString()
      : "...";

  const loadCategoryProductCounts = async () => {
    try {
      const response = await productCategoryService.getProductCountByCategory({
        limit: 100,
        skipCache: true,
      });

      const countsMap: CategoryCountMap = {};

      (response.data || []).forEach((item: ProductCountByCategory) => {
        if (item.category_id === undefined || item.category_id === null) {
          return;
        }
        const key = String(item.category_id);
        countsMap[key] = {
          total_products: parseCountValue(item.product_count),
          active_products: 0, // This endpoint doesn't provide active/inactive breakdown
          inactive_products: 0,
        };
      });

      setCategoryProductCounts(countsMap);
      return countsMap;
    } catch (err) {
      console.error("Failed to load category product counts:", err);
      return {};
    }
  };

  const refreshCategoryProductCounts = async (
    categoriesOverride?: ProductCategory[],
    productsSnapshotOverride?: Product[],
  ) => {
    // Force refresh counts with skipCache to get latest data
    // loadCategoryProductCounts already uses skipCache: true
    const baseCounts = await loadCategoryProductCounts();
    const targetCategories = categoriesOverride ?? categories;
    let finalCounts = baseCounts;

    if (targetCategories.length) {
      // Always fetch fresh products with skipCache: true (same as segments)
      // Segments always fetch fresh, so we do the same
      const productsSnapshot =
        productsSnapshotOverride ?? (await loadAllProducts(true));

      finalCounts = mergeTagCountsFromSnapshot(
        baseCounts,
        targetCategories,
        productsSnapshot,
      );
    }

    setCategoryProductCounts(finalCounts);
    return finalCounts;
  };

  const loadStats = async (skipCache = false) => {
    try {
      setStatsLoading(true);
      const response = await productCategoryService.getStats(skipCache);
      const data = response.data as CategoryStats | undefined;

      if (data) {
        // Check if empty_categories exists in the backend response
        const hasEmptyCategoriesField = "empty_categories" in data;

        const parsed: CategoryStats = {
          total_categories: Number(data.total_categories) || 0,
          active_categories: Number(data.active_categories) || 0,
          inactive_categories: Number(data.inactive_categories) || 0,
          root_categories: Number(data.root_categories) || 0,
          max_depth: Number(data.max_depth) || 0,
          categories_with_products: Number(data.categories_with_products) || 0,
          // Only use backend value if the field actually exists, otherwise set to 0
          empty_categories: hasEmptyCategoriesField
            ? Number(data.empty_categories) || 0
            : 0,
          average_products_per_category:
            Number(data.average_products_per_category) || 0,
        };
        setStats(parsed);
      } else {
        setStats(null);
      }
    } catch {
      // Failed to load product catalog stats
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadCategoryPerformance = async () => {
    try {
      const response = await productService.getCategoryPerformance({
        skipCache: true,
      });
      if (response.success && response.data) {
        const performanceMap: Record<
          number,
          {
            totalValue: number;
            averagePrice: number;
          }
        > = {};

        (response.data || []).forEach((item: CategoryPerformance) => {
          const categoryId = item.category_id;
          performanceMap[categoryId] = {
            totalValue: item.total_value || 0,
            averagePrice: item.average_price || 0,
          };
        });

        setCategoryPerformance(performanceMap);
      }
    } catch (err) {
      console.error("Failed to load category performance:", err);
      setCategoryPerformance({});
    }
  };

  const loadCategories = async (
    skipCache = false,
    productsSnapshotOverride?: Product[],
  ) => {
    try {
      setLoading(true);

      // Always load all categories for client-side filtering
      const response = await productCategoryService.getAllCategories({
        limit: 100,
        skipCache: skipCache,
      });

      const categoryList = response.data || [];
      setCategories(categoryList);

      // Load product counts (including tag-based assignments)
      const productsSnapshot =
        productsSnapshotOverride ??
        (allProducts.length > 0 ? allProducts : await loadAllProducts());
      await refreshCategoryProductCounts(categoryList, productsSnapshot);
    } catch {
      console.error("Failed to load categories");
      const errorMsg2 = extractBackendError(err, "Failed to load categories");
      showError("Error", errorMsg2, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await loadStats(true);
      const productsSnapshot = await loadAllProducts();
      await loadCategories(true, productsSnapshot);
      await loadCategoryPerformance();
    };
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAllProducts = async (skipCache = false) => {
    try {
      // Fetch all products with pagination (same approach as campaigns/offers/segments)
      // This ensures we get all products including their tags for client-side filtering
      const limit = 100;
      let offset = 0;
      const allProductsList: Product[] = [];
      let hasMore = true;

      while (hasMore) {
        const response = await productService.getAllProducts({
          limit: limit,
          offset: offset,
          skipCache: skipCache,
        });

        const products = response.data || [];
        allProductsList.push(...products);

        const total = response.pagination?.total || 0;
        hasMore = allProductsList.length < total && products.length === limit;
        offset += limit;
      }

      setAllProducts(allProductsList);
      return allProductsList;
    } catch {
      // Failed to load products for assignment
      setAllProducts([]);
      return [];
    }
  };

  const handleCategoryCreated = () => {
    loadCategories();
    loadStats(true);
  };

  const handleEditCatalog = (category: ProductCategory) => {
    setEditingCatalog(category);
    setEditName(category.name);
    setEditDescription(category.description || "");
  };

  const handleViewProducts = (category: ProductCategory) => {
    setSelectedCategory(category);
    setIsProductsModalOpen(true);
  };

  const handleUpdateCatalog = async () => {
    if (!editingCatalog || !editName.trim()) return;

    try {
      setIsUpdating(true);
      await productCategoryService.updateCategory(editingCatalog.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });

      success(t.productCatalogs.updateSuccess, t.productCatalogs.updateSuccess);
      setEditingCatalog(null);
      setEditName("");
      setEditDescription("");
      await Promise.all([loadCategories(), loadStats(true)]);
    } catch (err) {
      console.error("Failed to update category:", err);
      const errorMsg3 = extractBackendError(err, t.productCatalogs.saveFailed);
      showError("Error", errorMsg3, true);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteCatalog = (category: ProductCategory) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const handleToggleActive = async (category: ProductCategory) => {
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
        await productCategoryService.activateCategory(category.id);
      } else {
        await productCategoryService.deactivateCategory(category.id);
      }

      success(
        newActiveStatus
          ? t.productCatalogs.activateSuccess
          : t.productCatalogs.deactivateSuccess,
        newActiveStatus
          ? t.productCatalogs.activateSuccess
          : t.productCatalogs.deactivateSuccess,
      );
    } catch (err) {
      console.error("Failed to toggle category status:", err);
      // Revert optimistic update on error by reloading
      await Promise.all([loadCategories(true), loadStats(true)]);
      // Display backend error message and bypass silent mode for important errors
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update category";
      showError("Toggle Failed", errorMessage, true);
    } finally {
      setTogglingCategoryId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    try {
      await productCategoryService.deleteCategory(categoryToDelete.id);
      success(t.productCatalogs.deleteSuccess, t.productCatalogs.deleteSuccess);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      // Refresh categories and stats with cache skipped, and reload all products
      await Promise.all([
        loadCategories(true),
        loadStats(true),
        loadAllProducts(true),
      ]);
      // Refresh product counts after products are reloaded
      await refreshCategoryProductCounts();
    } catch (err) {
      console.error("Failed to delete category:", err);

      // Extract actual error message from backend
      let errorMessage = "Please try again later.";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === "object") {
        const error = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
        if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      showError("Failed to delete category", errorMessage, true);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setCategoryToDelete(null);
  };

  // Apply client-side search filter
  const filteredCatalogs = categories.filter((category) => {
    // Apply search term filter
    const matchesSearch =
      debouncedSearchTerm === "" ||
      category.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      (category.description &&
        category.description
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()));

    // Apply advanced search filters
    let matchesAdvancedSearch = true;
    if (advancedSearch.exactName.trim() !== "") {
      matchesAdvancedSearch =
        matchesAdvancedSearch &&
        category.name
          .toLowerCase()
          .includes(advancedSearch.exactName.toLowerCase());
    }
    if (advancedSearch.isActive !== null) {
      matchesAdvancedSearch =
        matchesAdvancedSearch && category.is_active === advancedSearch.isActive;
    }
    if (advancedSearch.createdAfter !== "") {
      const createdDate = new Date(category.created_at);
      const afterDate = new Date(advancedSearch.createdAfter);
      matchesAdvancedSearch = matchesAdvancedSearch && createdDate >= afterDate;
    }
    if (advancedSearch.createdBefore !== "") {
      const createdDate = new Date(category.created_at);
      const beforeDate = new Date(advancedSearch.createdBefore);
      matchesAdvancedSearch =
        matchesAdvancedSearch && createdDate <= beforeDate;
    }

    // Apply product count filters (client-side since API doesn't support it)
    let matchesProductCount = true;
    if (advancedSearch.productCountMin !== "") {
      const minCount = parseInt(advancedSearch.productCountMin);
      const categoryCount =
        categoryProductCounts[String(category.id)]?.total_products || 0;
      matchesProductCount = matchesProductCount && categoryCount >= minCount;
    }
    if (advancedSearch.productCountMax !== "") {
      const maxCount = parseInt(advancedSearch.productCountMax);
      const categoryCount =
        categoryProductCounts[String(category.id)]?.total_products || 0;
      matchesProductCount = matchesProductCount && categoryCount <= maxCount;
    }

    // Apply filter type
    let matchesFilterType = true;
    if (filterType === "active") {
      matchesFilterType = category.is_active === true;
    } else if (filterType === "inactive") {
      matchesFilterType = category.is_active === false;
    } else if (filterType === "with_products") {
      const categoryCount =
        categoryProductCounts[String(category.id)]?.total_products || 0;
      matchesFilterType = categoryCount > 0;
    } else if (filterType === "empty") {
      const categoryCount =
        categoryProductCounts[String(category.id)]?.total_products || 0;
      matchesFilterType = categoryCount === 0;
    }

    return (
      matchesSearch &&
      matchesAdvancedSearch &&
      matchesProductCount &&
      matchesFilterType
    );
  }).sort((a, b) => {
    // Sort by created_at (newest first), keeping items in place regardless of active status
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA;
  });

  const totalCatalogs = stats?.total_categories ?? categories.length;
  const activeCatalogs =
    stats?.active_categories ??
    categories.filter((cat) => cat.is_active).length;
  // Calculate inactive catalogs from actual categories list if backend value seems wrong
  const inactiveFromBackend = stats?.inactive_categories ?? 0;
  const inactiveFromList = categories.filter((cat) => !cat.is_active).length;
  // Use client-side calculation if backend says 0 but we have inactive categories
  const inactiveCatalogs =
    inactiveFromBackend > 0 || inactiveFromList === 0
      ? inactiveFromBackend
      : inactiveFromList;
  const clientSideUnusedCount = categories.filter(
    (cat) => (categoryProductCounts[String(cat.id)]?.total_products || 0) === 0,
  ).length;

  const unusedCatalogs = stats?.empty_categories ?? clientSideUnusedCount;

  const mostPopulatedCategoryRaw = categories.reduce<{
    name: string;
    count: number;
  } | null>((acc, category) => {
    const count =
      categoryProductCounts[String(category.id)]?.total_products || 0;
    if (!acc || count > acc.count) {
      return {
        name: category.name,
        count,
      };
    }
    return acc;
  }, null);

  const mostPopulatedCategory =
    mostPopulatedCategoryRaw && mostPopulatedCategoryRaw.count > 0
      ? mostPopulatedCategoryRaw
      : null;

  const catalogStatsCards = [
    {
      name: t.productCatalogs.totalCatalogs,
      value: formatNumber(totalCatalogs),
      icon: FolderOpen,
      color: color.tertiary.tag1,
    },
    {
      name: t.productCatalogs.activeCatalogs,
      value: formatNumber(activeCatalogs),
      icon: CheckCircle,
      color: color.tertiary.tag4,
    },
    {
      name: t.productCatalogs.inactiveCatalogs,
      value: formatNumber(inactiveCatalogs),
      icon: XCircle,
      color: color.tertiary.tag3,
    },
    {
      name: t.productCatalogs.unusedCatalogs,
      value: formatNumber(unusedCatalogs),
      icon: Archive,
      color: color.tertiary.tag2,
    },
    {
      name: "Most Popular",
      value: mostPopulatedCategory?.name || "None",
      icon: Star,
      color: color.primary.accent,
      description: `${formatNumber(
        mostPopulatedCategory?.count ?? 0,
      )} products`,
      title: mostPopulatedCategory?.name || undefined,
      valueClass: "text-xl",
      loading: false,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" variant="default" color="primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* <BackButton fallbackTo="/dashboard/products" iconSize="w-4 h-4" /> */}
          <div>
            <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
              {t.productCatalogs.title}
            </h1>
            <p className={`${tw.textSecondary} mt-2 text-sm`}>
              {t.productCatalogs.subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <PermissionGate permission="product-catalog.create">
            <CreateButton onClick={() => setShowCreateModal(true)} />
          </PermissionGate>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {catalogStatsCards.map((stat) => {
          const Icon = stat.icon;
          const valueClass = stat.valueClass ?? "text-3xl";
          const shouldMask = stat.loading ?? true;
          const displayValue =
            statsLoading && shouldMask ? "..." : (stat.value ?? "...");

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
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              </div>
              <p
                className={`mt-2 ${valueClass} font-bold text-gray-900`}
                title={stat.title}
              >
                {displayValue}
              </p>
              {stat.description && (
                <p className="mt-1 text-sm text-gray-500">{stat.description}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={t.productCatalogs.searchPlaceholder}
        />

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

      {/* Active Filters - Below Search Bar */}
      {hasAdvancedFilters() && (
        <div className="flex flex-wrap gap-2">
          {advancedSearch.exactName.trim() && (
            <span
              className="inline-flex items-center px-3 py-1.5 text-sm rounded-full border"
              style={{
                color: color.primary.accent,
                borderColor: color.primary.accent,
              }}
            >
              Name: "{advancedSearch.exactName}"
              <button
                onClick={() =>
                  setAdvancedSearch((prev) => ({ ...prev, exactName: "" }))
                }
                className="ml-2 hover:bg-gray-100 rounded-full p-0.5"
              >
                <XCircle className="w-3 h-3" />
              </button>
            </span>
          )}

          {advancedSearch.isActive !== null && (
            <span
              className="inline-flex items-center px-3 py-1.5 text-sm rounded-full border"
              style={{
                color: color.primary.accent,
                borderColor: color.primary.accent,
              }}
            >
              Status: {advancedSearch.isActive ? "Active" : "Inactive"}
              <button
                onClick={() =>
                  setAdvancedSearch((prev) => ({ ...prev, isActive: null }))
                }
                className="ml-2 hover:bg-gray-100 rounded-full p-0.5"
              >
                <XCircle className="w-3 h-3" />
              </button>
            </span>
          )}

          {(advancedSearch.createdAfter || advancedSearch.createdBefore) && (
            <span
              className="inline-flex items-center px-3 py-1.5 text-sm rounded-full border"
              style={{
                color: color.primary.accent,
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
                className="ml-2 hover:bg-gray-100 rounded-full p-0.5"
              >
                <XCircle className="w-3 h-3" />
              </button>
            </span>
          )}

          {(advancedSearch.productCountMin ||
            advancedSearch.productCountMax) && (
            <span
              className="inline-flex items-center px-3 py-1.5 text-sm rounded-full border"
              style={{
                color: color.primary.accent,
                borderColor: color.primary.accent,
              }}
            >
              Products: {advancedSearch.productCountMin || "0"} to{" "}
              {advancedSearch.productCountMax || "∞"}
              <button
                onClick={() =>
                  setAdvancedSearch((prev) => ({
                    ...prev,
                    productCountMin: "",
                    productCountMax: "",
                  }))
                }
                className="ml-2 hover:bg-gray-100 rounded-full p-0.5"
              >
                <XCircle className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            onClick={clearAdvancedSearch}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Error Message */}

      {/* Calculate paginated catalogs */}
      {(() => {
        const startIndex = (catalogPage - 1) * catalogPageSize;
        const endIndex = startIndex + catalogPageSize;
        const paginatedCatalogs = filteredCatalogs.slice(startIndex, endIndex);

        return (
          <>
      {/* Catalogs */}
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
      ) : filteredCatalogs.length === 0 ? (
        <div
          className={`bg-white ${tw.rounded} shadow-sm border border-gray-200 text-center py-16 px-4`}
        >
          <h3 className={`${tw.cardHeading} text-gray-900 mb-1`}>
            {searchTerm ? "No catalogs found" : "No catalogs yet"}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {searchTerm
              ? "Try adjusting your search terms"
              : "Create your first product catalog to organize your products"}
          </p>
          {!searchTerm && (
            <PermissionGate permission="product-catalog.create">
              <CreateButton onClick={() => setShowCreateModal(true)} />
            </PermissionGate>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedCatalogs.map((category) => (
            <div
              key={category.id}
              className={`bg-white border border-gray-200 ${tw.rounded} p-6 hover:shadow-md transition-all`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className={`${tw.tableFirstColumn} text-gray-900 flex-1`}>
                  {category.name}
                </h3>
                <div className="flex items-center space-x-1">
                  <PermissionGate permission="product-catalog.update">
                    <button
                      onClick={() => handleToggleActive(category)}
                      disabled={togglingCategoryId === category.id}
                      className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={
                        category.is_active
                          ? t.productCatalogs.deactivate
                          : t.productCatalogs.activate
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
                  <PermissionGate permission="products.update">
                    <button
                      onClick={() => handleEditCatalog(category)}
                      className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
                      title={t.productCatalogs.edit}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </PermissionGate>
                  <PermissionGate permission="products.delete">
                    <button
                      onClick={() => handleDeleteCatalog(category)}
                      className={`p-2 hover:bg-red-50 ${tw.rounded} transition-colors`}
                      title={t.productCatalogs.delete}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </PermissionGate>
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
                  <div className="text-sm text-gray-600">
                    <div className="font-medium">
                      {categoryProductCounts[String(category.id)]
                        ?.total_products || 0}{" "}
                      products
                    </div>
                  </div>
                  <PermissionGate permission="product-catalog-view.read">
                    <button
                      onClick={() => handleViewProducts(category)}
                      className="text-sm font-medium text-gray-700 hover:underline transition-colors"
                      title={t.productCatalogs.viewProducts}
                    >
                      View Products
                    </button>
                  </PermissionGate>
                </div>
                {(() => {
                  const performance = categoryPerformance[category.id];
                  if (
                    performance &&
                    (performance.totalValue > 0 || performance.averagePrice > 0)
                  ) {
                    return (
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500">Total Value</p>
                          <p className="text-sm font-semibold text-gray-900">
                            <CurrencyFormatter
                              amount={performance.totalValue}
                            />
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Avg Price</p>
                          <p className="text-sm font-semibold text-gray-900">
                            <CurrencyFormatter
                              amount={performance.averagePrice}
                            />
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
          {paginatedCatalogs.map((category) => (
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
                    <div className="text-sm text-gray-600 mt-0.5">
                      <div className="font-medium">
                        {categoryProductCounts[String(category.id)]
                          ?.total_products || 0}{" "}
                        products
                      </div>
                    </div>
                    {(() => {
                      const performance = categoryPerformance[category.id];
                      if (
                        performance &&
                        (performance.totalValue > 0 ||
                          performance.averagePrice > 0)
                      ) {
                        return (
                          <div className="flex items-center gap-4 mt-2">
                            <div>
                              <span className="text-xs text-gray-500">
                                Total Value:{" "}
                              </span>
                              <span className="text-sm font-semibold text-gray-900">
                                <CurrencyFormatter
                                  amount={performance.totalValue}
                                />
                              </span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">
                                Avg Price:{" "}
                              </span>
                              <span className="text-sm font-semibold text-gray-900">
                                <CurrencyFormatter
                                  amount={performance.averagePrice}
                                />
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <PermissionGate permission="product-catalog-view.read">
                    <button
                      onClick={() => handleViewProducts(category)}
                      className={tw.borderedButton}
                      title={t.productCatalogs.viewProducts}
                    >
                      View Products
                    </button>
                  </PermissionGate>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                <PermissionGate permission="product-catalog.update">
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
                <PermissionGate permission="products.update">
                  <button
                    onClick={() => handleEditCatalog(category)}
                    className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </PermissionGate>
                <PermissionGate permission="products.delete">
                  <button
                    onClick={() => handleDeleteCatalog(category)}
                    className={`p-2 hover:bg-red-50 ${tw.rounded} transition-colors`}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </PermissionGate>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredCatalogs.length > catalogPageSize && (
        <div className="flex justify-center mt-6">
          <Pagination
            currentPage={catalogPage}
            pageSize={catalogPageSize}
            totalItems={filteredCatalogs.length}
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

      {/* Create Catalog Modal */}
      <CreateCategoryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCategoryCreated={handleCategoryCreated}
      />

      {/* Edit Catalog Modal */}
      {editingCatalog &&
        createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[9999] backdrop-blur-sm">
            <div
              className={`bg-white ${tw.rounded} shadow-xl w-full max-w-md mx-4 border border-gray-100`}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {t.productCatalogs.editModalTitle}
                </h2>
                <button
                  onClick={() => {
                    setEditingCatalog(null);
                    setEditName("");
                    setEditDescription("");
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {t.common.close}
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.productCatalogs.catalogNameLabel} *
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} text-sm focus:outline-none`}
                    placeholder={t.productCatalogs.catalogNamePlaceholder}
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.productCatalogs.description}
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} text-sm focus:outline-none`}
                    placeholder={t.productCatalogs.descriptionPlaceholder}
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCatalog(null);
                      setEditName("");
                      setEditDescription("");
                    }}
                    className={`px-4 py-2 text-gray-700 bg-gray-100 ${tw.rounded} hover:bg-gray-200 transition-colors text-sm`}
                  >
                    {t.productCatalogs.cancel}
                  </button>
                  <button
                    onClick={handleUpdateCatalog}
                    disabled={!editName.trim() || isUpdating}
                    className={`px-4 py-2 text-white ${tw.rounded} transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2`}
                    style={{ backgroundColor: color.primary.action }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        (e.target as HTMLButtonElement).style.backgroundColor =
                          color.primary.action;
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.backgroundColor =
                        color.primary.action;
                    }}
                  >
                    {isUpdating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {t.productCatalogs.saving}
                      </>
                    ) : (
                      <>{t.productCatalogs.update}</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <ProductsModal
        isOpen={isProductsModalOpen}
        onClose={() => {
          setIsProductsModalOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onRefreshCategories={async () => {
          // Just refresh counts, don't reload all categories (avoids full page reload)
          // This matches the pattern used by segments/offers/campaigns
          await refreshCategoryProductCounts();
        }}
        onRefreshProductCounts={async () => {
          // Just refresh counts using existing allProducts (same pattern as offers)
          // This avoids heavy fetch and parent state update during removal
          // The counts will be updated in the background while modal stays open
          await refreshCategoryProductCounts();
        }}
        allProducts={allProducts}
        refreshAllProducts={loadAllProducts}
        categories={categories}
        refreshCategoryProductCounts={refreshCategoryProductCounts}
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
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => {
                setIsClosingModal(true);
                setTimeout(() => {
                  setShowAdvancedFilters(false);
                  setIsClosingModal(false);
                }, 300);
              }}
            />
            <div
              className={`fixed right-0 top-0 h-full w-96 bg-white shadow-xl transform transition-transform duration-300 ${
                isClosingModal ? "translate-x-full" : "translate-x-0"
              }`}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Filter Catalogs
                </h2>
                <button
                  onClick={() => {
                    setIsClosingModal(true);
                    setTimeout(() => {
                      setShowAdvancedFilters(false);
                      setIsClosingModal(false);
                    }, 300);
                  }}
                  className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Filter Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Filter Type
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: "all", label: "All Categories" },
                      { value: "active", label: "Active Only" },
                      { value: "with_products", label: "With Products" },
                      { value: "empty", label: "Empty Categories" },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center space-x-3 cursor-pointer"
                      >
                        <Radio name="filterType"
                          value={option.value}
                          checked={filterType === option.value}
                          onChange={(e) =>
                            setFilterType(
                              e.target.value as
                                | "all"
                                | "active"
                                | "with_products"
                                | "empty",
                            )
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                        <span className="text-sm text-gray-700">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Advanced Search */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Advanced Filters
                  </h3>

                  {/* Exact Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Exact Name
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
                      className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="Search by exact name..."
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <HeadlessSelect
                      value={
                        advancedSearch.isActive === null
                          ? ""
                          : String(advancedSearch.isActive)
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
                        { label: "Any Status", value: "" },
                        { label: "Active", value: "true" },
                        { label: "Inactive", value: "false" },
                      ]}
                      placeholder="Any Status"
                      className="w-full"
                      zIndex={zIndex.popover}
                    />
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>
                  </div>

                  {/* Product Count Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Min Products
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={advancedSearch.productCountMin}
                        onChange={(e) =>
                          setAdvancedSearch((prev) => ({
                            ...prev,
                            productCountMin: e.target.value,
                          }))
                        }
                        className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Products
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={advancedSearch.productCountMax}
                        onChange={(e) =>
                          setAdvancedSearch((prev) => ({
                            ...prev,
                            productCountMax: e.target.value,
                          }))
                        }
                        className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="∞"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <button
                    onClick={clearAdvancedSearch}
                    className={`px-4 py-2 text-gray-700 bg-gray-100 ${tw.rounded} hover:bg-gray-200 transition-colors text-sm`}
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => {
                      setIsClosingModal(true);
                      setTimeout(() => {
                        setShowAdvancedFilters(false);
                        setIsClosingModal(false);
                      }, 300);
                    }}
                    className={`px-4 py-2 text-white ${tw.rounded} transition-all text-sm`}
                    style={{ backgroundColor: color.primary.action }}
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
        title={t.productCatalogs.deleteConfirmTitle}
        description={t.productCatalogs.deleteConfirmMessage}
        itemName={categoryToDelete?.name || ""}
        isLoading={isDeleting}
        confirmText={t.productCatalogs.delete}
        cancelText={t.productCatalogs.cancel}
      />
    </div>
  );
}
