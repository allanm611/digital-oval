import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Edit,
  Eye,
  ChevronLeft,
  ChevronRight,
  Settings,
  Trash2,
  Play,
  Pause,
  XCircle,
  Package,
  TrendingUp,
  BarChart3,
  DollarSign,
} from "lucide-react";
import { Product } from "../types/product";
import CreateButton from "../../../shared/components/ui/CreateButton";
import { ProductCategory } from "../types/productCategory";
import { productService } from "../services/productService";
import { productCategoryService } from "../services/productCategoryService";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import Pagination from "../../../shared/components/ui/Pagination";
import CurrencyFormatter from "../../../shared/components/CurrencyFormatter";
import DateFormatter from "../../../shared/components/DateFormatter";
import { PermissionGate } from "../../auth/components/PermissionGate";

interface ProductFilters {
  search?: string;
  categoryId?: number;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    pageSize: 10,
    sortBy: "created_at",
    sortDirection: "DESC",
  });
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<{
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
    averagePrice: number;
  } | null>(null);
  const [topSelling, setTopSelling] = useState<Product[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const { success: showToast, error: showError } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCategories = async () => {
    try {
      const response = await productCategoryService.getAllCategories({
        limit: 100,
        skipCache: true,
      });
      setCategories(response.data || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const loadProducts = useCallback(
    async (skipCache = true) => {
      try {
        setLoading(true);
        setError(null);

        const limit = filters.pageSize || 10;
        const offset = ((filters.page || 1) - 1) * limit;

        let response;
        let productsList: Product[] = [];

        // Use superSearch if we have filters or need inactive products
        if (
          filters.search ||
          filters.categoryId ||
          filters.isActive !== undefined
        ) {
          response = await productService.superSearch({
            ...(filters.search && { name: filters.search }),
            ...(filters.categoryId && { category_id: filters.categoryId }),
            ...(filters.isActive !== undefined && {
              is_active: filters.isActive,
            }),
            limit,
            offset,
            skipCache: skipCache,
          });
          productsList = response.data || [];
        } else {
          response = await productService.getAllProducts({
            limit,
            offset,
            skipCache: skipCache,
          });
          productsList = response.data || [];
        }

        setProducts(productsList);
        const totalCount = response.pagination?.total || 0;
        setTotal(totalCount);
        setTotalPages(Math.ceil(totalCount / limit) || 1);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load products";
        showError("Failed to load products", message);
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  // Load products and categories when filters change or when navigating back to this page
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, location.key]);

  // Load stats when navigating to this page
  useEffect(() => {
    loadStats();
  }, [location.key]);

  const loadStats = async () => {
    try {
      setStatsLoading(true);

      // Get product stats
      const statsResponse = await productService.getStats(true);
      if (statsResponse.success && statsResponse.data) {
        // Backend returns avg_price as a string, need to parse it
        const avgPrice = statsResponse.data.avg_price
          ? parseFloat(String(statsResponse.data.avg_price))
          : statsResponse.data.average_price || 0;

        setStats({
          totalProducts: Number(statsResponse.data.total_products) || 0,
          activeProducts: Number(statsResponse.data.active_products) || 0,
          inactiveProducts: Number(statsResponse.data.inactive_products) || 0,
          averagePrice: avgPrice,
        });
      }

      // Get top selling products
      const topSellingResponse = await productService.getTopSelling({
        limit: 5,
        skipCache: true,
      });
      if (topSellingResponse.data) {
        setTopSelling(topSellingResponse.data);
      }
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSearch = (searchTerm: string) => {
    setFilters({ ...filters, search: searchTerm, page: 1 });
  };

  const handleFilterChange = (
    key: keyof ProductFilters,
    value: string | number | boolean | undefined,
  ) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      if (product.is_active) {
        await productService.deactivateProduct(Number(product.id));
        showToast(
          "Product Deactivated",
          `"${product.name}" has been deactivated successfully.`,
        );
      } else {
        await productService.activateProduct(Number(product.id));
        showToast(
          "Product Activated",
          `"${product.name}" has been activated successfully.`,
        );
      }
      loadProducts();
    } catch (err) {
      console.error("Failed to update product status:", err);
      showError("Failed to update product status", "Please try again later.");
    }
  };

  const handleDelete = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    const productName = product?.name || "this product";
    setProductToDelete({ id: productId, name: productName });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      await productService.deleteProduct(Number(productToDelete.id));
      showToast(
        "Product Deleted",
        `"${productToDelete.name}" has been deleted successfully.`,
      );
      setShowDeleteModal(false);
      setProductToDelete(null);
      loadProducts(true); // Skip cache when refetching after delete
      loadStats(); // Refresh stats cards
    } catch (err: any) {
      console.error("Failed to delete product:", err);
      // Extract error message from backend response
      const errorMessage =
        err?.message ||
        err?.error ||
        "Failed to delete product. Please try again.";
      showError("Error", errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
            {t.pages.products}
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            {t.pages.productsDescription}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <PermissionGate permission="products.create">
            <CreateButton route="/dashboard/products/create" />
          </PermissionGate>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Products Card */}
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <Package
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Total Products</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {statsLoading ? (
              <span className="text-gray-400">...</span>
            ) : (
              stats?.totalProducts || 0
            )}
          </p>
        </div>

        {/* Active Products Card */}
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Active Products</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {statsLoading ? (
              <span className="text-gray-400">...</span>
            ) : (
              stats?.activeProducts || 0
            )}
          </p>
        </div>

        {/* Inactive Products Card */}
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <XCircle
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">
              Inactive Products
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {statsLoading ? (
              <span className="text-gray-400">...</span>
            ) : (
              stats?.inactiveProducts || 0
            )}
          </p>
        </div>

        {/* Average Price Card */}
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <DollarSign
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Average Price</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {statsLoading ? (
              <span className="text-gray-400">...</span>
            ) : (
              <CurrencyFormatter amount={stats?.averagePrice || 0} />
            )}
          </p>
        </div>

        {/* Top Selling Products Card */}
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <BarChart3
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Top Selling</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {statsLoading ? (
              <span className="text-gray-400">...</span>
            ) : (
              topSelling.length || 0
            )}
          </p>
          {topSelling.length > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              {topSelling[0]?.name || "Products"}
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[${tw.textMuted}]`}
            />
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search || ""}
              onChange={(e) => handleSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 text-sm  border border-[${tw.borderDefault}] ${tw.rounded} focus:outline-none`}
            />
          </div>

          {/* Category Filter */}
          <HeadlessSelect
            options={[
              { value: "", label: "All Categories" },
              ...categories.map((category) => ({
                value: category.id.toString(),
                label: category.name,
              })),
            ]}
            value={filters.categoryId?.toString() || ""}
            onChange={(value) =>
              handleFilterChange(
                "categoryId",
                value ? Number(value) : undefined,
              )
            }
            placeholder="All Categories"
            className="min-w-[160px] text-sm"
          />

          {/* Status Filter */}
          <HeadlessSelect
            options={[
              { value: "", label: "All Status" },
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ]}
            value={
              filters.isActive === undefined ? "" : filters.isActive.toString()
            }
            onChange={(value) =>
              handleFilterChange(
                "isActive",
                value === "" ? undefined : value === "true",
              )
            }
            placeholder="All Status"
            className="min-w-[120px] text-sm"
          />

          {/* Sort */}
          <HeadlessSelect
            options={[
              { value: "created_at-DESC", label: "Newest First" },
              { value: "created_at-ASC", label: "Oldest First" },
              { value: "name-ASC", label: "Name A-Z" },
              { value: "name-DESC", label: "Name Z-A" },
              { value: "product_id-ASC", label: "Product ID A-Z" },
            ]}
            value={`${filters.sortBy}-${filters.sortDirection}`}
            onChange={(value) => {
              const [sortBy, sortDirection] = value.toString().split("-");
              setFilters({
                ...filters,
                sortBy,
                sortDirection: sortDirection as "ASC" | "DESC",
              });
            }}
            placeholder="Sort by"
            className="min-w-[140px] text-sm"
          />
        </div>
      </div>

      {error && (
        <ErrorState
          className="mb-6"
          title="Unable to load products"
          message="Please check your connection or try again."
          onRetry={loadProducts}
        />
      )}

      {/* Products Table */}
      <div
        className={` ${tw.rounded} border border-[${color.border.default}] overflow-hidden`}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <LoadingSpinner
              variant="modern"
              size="xl"
              color="primary"
              className="mb-4"
            />
            <p className={`${tw.textMuted} font-medium text-sm`}>
              Loading products...
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            {/* Icon removed */}
            <h3 className={`${tw.cardHeading} ${tw.textPrimary} mb-1`}>
              No products found
            </h3>
            <p className={`text-sm ${tw.textMuted} mb-6`}>
              Get started by creating your first product.
            </p>
            <div className="mx-auto">
              <PermissionGate permission="products.create">
                <CreateButton route="/dashboard/products/create" />
              </PermissionGate>
            </div>
          </div>
        ) : (
          <div className="hidden lg:block overflow-x-auto">
            <table
              className="w-full"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead style={{ background: color.surface.tableHeader }}>
                <tr>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Product
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider hidden lg:table-cell"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Product ID
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider hidden xl:table-cell"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    DA ID
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Category
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Status
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Created
                  </th>
                  <th
                    className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const categoryName =
                    categories.find(
                      (cat) => cat.id === parseInt(product.category_id),
                    )?.name || "Uncategorized";
                  const status = product.is_active ? "Active" : "Inactive";
                  const statusBadge = product.is_active
                    ? `bg-[${color.status.success}] text-[${color.status.success}]`
                    : `bg-[${color.surface.cards}] text-[${color.text.primary}]`;

                  return (
                    <tr key={product.id} className="transition-colors">
                      <td
                        className="px-6 py-4"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div
                        className={`${tw.tableFirstColumn} ${tw.textPrimary} truncate`}
                        title={product.name}
                      >
                        {product.name}
                      </div>
                    </td>
                      <td
                        className={`px-6 py-4 hidden lg:table-cell text-sm ${tw.textPrimary}`}
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {product.product_id || product.id || "N/A"}
                      </td>
                      <td
                        className={`px-6 py-4 hidden xl:table-cell text-sm ${tw.textPrimary}`}
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        {product.da_id || "N/A"}
                      </td>
                      <td
                        className="px-6 py-4"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span
                          className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-[${color.primary.accent}]/10 text-[${color.primary.accent}]`}
                        >
                          {categoryName}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span
                          className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${statusBadge}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 hidden md:table-cell text-sm ${tw.textMuted}`}
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <DateFormatter date={product.created_at} />
                      </td>
                      <td
                        className="px-6 py-4 text-sm font-medium"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              navigate(`/dashboard/products/${product.id}`)
                            }
                            className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${tw.rounded} transition-all duration-200`}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <PermissionGate permission="products.update">
                            <button
                              onClick={() =>
                                navigate(
                                  `/dashboard/products/${product.id}/edit`,
                                )
                              }
                              className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${tw.rounded} transition-all duration-200`}
                              title="Edit Product"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </PermissionGate>
                          <button
                            onClick={() => handleToggleStatus(product)}
                            className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${tw.rounded} transition-all duration-200`}
                            title={
                              product.is_active ? "Deactivate" : "Activate"
                            }
                          >
                            {product.is_active ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                          <PermissionGate permission="products.delete">
                            <button
                              onClick={() => handleDelete(product.id)}
                              className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-all duration-200`}
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && (products.length > 0 || total > 0) && (
        <Pagination
          currentPage={filters.page || 1}
          pageSize={filters.pageSize || 20}
          totalItems={total}
          onPageChange={(page) => handlePageChange(page)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        itemName={productToDelete?.name || ""}
        isLoading={isDeleting}
        confirmText="Delete Product"
        cancelText="Cancel"
      />
    </div>
  );
}
