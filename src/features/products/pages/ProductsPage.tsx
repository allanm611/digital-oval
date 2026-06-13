import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Edit,
  Eye,
  Trash2,
  Play,
  Pause,
  Package,
  TrendingUp,
  BarChart3,
  DollarSign,
  XCircle,
  Download,
} from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { Product } from "../types/product";
import CreateButton from "../../../shared/components/ui/CreateButton";
import { ProductCategory } from "../types/productCategory";
import { productService } from "../services/productService";
import { productCategoryService } from "../services/productCategoryService";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useLanguage } from "../../../contexts/LanguageContext";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import Pagination from "../../../shared/components/ui/Pagination";
import CurrencyFormatter from "../../../shared/components/CurrencyFormatter";
import DateFormatter from "../../../shared/components/DateFormatter";
import { PermissionGate } from "../../auth/components/PermissionGate";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";
import { ColumnPickerModal } from "../../../shared/components/ColumnPickerModal";
import { button } from "../../../shared/utils/utils";

interface ProductTableRow {
  id: string;
  name: string;
  productId: string;
  daId: string;
  category: string;
  status: string;
  created: string;
  is_active?: boolean;
  product?: Product;
}

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
  const [productToDelete, setProductToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  let defaultColumns: TableColumn<ProductTableRow>[] = [
    {
      id: "name",
      label: "Product",
      width: "200px",
      visible: true,
      sortable: true,
      filterConfig: { type: "text" },
      render: (_, row) => (
        <div className={`${tw.tableFirstColumn} ${tw.textPrimary} truncate`} title={row.name}>
          {row.name}
        </div>
      ),
    },
    {
      id: "productId",
      label: "Product ID",
      width: "150px",
      visible: true,
      sortable: true,
      filterConfig: { type: "text" },
    },
    {
      id: "daId",
      label: "DA ID",
      width: "140px",
      visible: true,
      sortable: true,
      filterConfig: { type: "text" },
    },
    {
      id: "category",
      label: "Category",
      width: "150px",
      visible: true,
      sortable: true,
      filterConfig: {
        type: "select",
        options: categories.map(c => c.name)
      },
      render: (value: string) => (
        <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-[${color.primary.accent}]/10 text-black`}>
          {value}
        </span>
      ),
    },
    {
      id: "status",
      label: "Status",
      width: "120px",
      visible: true,
      sortable: true,
      filterConfig: { type: "select", options: ["Active", "Inactive"] },
      render: (value: string) => {
        const isActive = value === "Active";
        const statusBadge = isActive
          ? `bg-[${color.status.success}] text-[${color.status.success}]`
          : `bg-[${color.surface.cards}] text-[${color.text.primary}]`;
        return (
          <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${statusBadge}`}>
            {value}
          </span>
        );
      },
    },
    {
      id: "created",
      label: "Created",
      width: "150px",
      visible: true,
      sortable: true,
      filterConfig: { type: "date" },
      render: (value: string) => <DateFormatter date={value} />,
    },
    {
      id: "actions",
      label: "Actions",
      width: "180px",
      visible: true,
      sortable: false,
      render: (_, row) => {
        const isActive = row.is_active ?? false;
        return (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => navigate(`/dashboard/products/${row.id}`)}
              className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${tw.rounded} transition-all duration-200`}
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <PermissionGate permission="products.update">
              <button
                onClick={() =>
                  navigate(`/dashboard/products/${row.id}/edit`, {
                    state: { returnTo: { pathname: "/dashboard/products" } },
                  })
                }
                className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${tw.rounded} transition-all duration-200`}
                title="Edit Product"
              >
                <Edit className="w-4 h-4" />
              </button>
            </PermissionGate>
            <button
              onClick={() => row.product && handleToggleStatus(row.product)}
              disabled={loadingProductId === row.id || !row.product}
              className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${tw.rounded} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isActive ? "Deactivate" : "Activate"}
            >
              {loadingProductId === row.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              ) : isActive ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
            <PermissionGate permission="products.delete">
              <button
                onClick={() => handleDelete(row.id)}
                className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-all duration-200`}
                title="Delete Product"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </PermissionGate>
          </div>
        );
      },
    },
  ];

  const {
    columns,
    toggleColumn,
    reorderColumns,
    resetToDefaults,
    expandedRowId,
    setExpandedRowId,
  } = useTable({
    tableId: "products-table-v2",
    defaultColumns,
    persistToLocalStorage: true,
  });

  const { deleteConfirm, isDeleting, openDeleteConfirm, closeDeleteConfirm, handleDelete: confirmDeleteProduct } = useDeleteConfirm({
    onDelete: async (id) => {
      const strId = typeof id === "string" ? id : id.toString();
      setProducts((prev) => prev.filter((p) => p.id !== strId));
      await productService.deleteProduct(strId);
    },
    itemLabel: "Product",
  });

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

        // Always use superSearch to get all products (including inactive when filter is "All Status")
        const response = await productService.superSearch({
          ...(filters.search && { name: filters.search }),
          ...(filters.categoryId && { category_id: filters.categoryId }),
          ...(filters.isActive !== undefined && {
            is_active: filters.isActive,
          }),
          limit,
          offset,
          skipCache: skipCache,
        });
        const productsList: Product[] = response.data || [];

        // Sort based on selected sort option
        const sortedProducts = [...productsList].sort((a, b) => {
          let compareResult = 0;

          if (filters.sortBy === "created_at") {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            compareResult = dateA - dateB;
          } else if (filters.sortBy === "name") {
            compareResult = (a.name || "").localeCompare(b.name || "");
          } else if (filters.sortBy === "product_id") {
            compareResult = (a.product_code || "").localeCompare(
              b.product_code || "",
            );
          }

          return filters.sortDirection === "DESC"
            ? -compareResult
            : compareResult;
        });

        setProducts(sortedProducts);
        const totalCount = response.pagination?.total || 0;
        setTotal(totalCount);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load products";
        showError("Failed to load products", message);
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [filters, showError],
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
    setLoadingProductId(product.id);
    try {
      // Optimistic update - update UI immediately
      const updatedProduct = { ...product, is_active: !product.is_active };
      setProducts(
        products.map((p) => (p.id === product.id ? updatedProduct : p)),
      );

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
    } catch (err) {
      console.error("Failed to update product status:", err);
      showError("Failed to update product status", extractBackendError(error, "Failed to update product status. Please try again."));
      // Revert optimistic update on error
      setProducts(
        products.map((p) =>
          p.id === product.id ? { ...p, is_active: !product.is_active } : p,
        ),
      );
    } finally {
      setLoadingProductId(null);
    }
  };

  const handleDelete = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    const productName = product?.name || `Product #${productId}`;
    setProductToDelete({ id: productId, name: productName });
    openDeleteConfirm(productId, productName);
  };

  // Populate defaultColumns after functions are defined
  defaultColumns = [
    {
      id: "name",
      label: "Product",
      width: "200px",
      visible: true,
      sortable: true,
      filterConfig: { type: "text" },
      render: (_, row) => (
        <div className={`${tw.tableFirstColumn} ${tw.textPrimary} truncate`} title={row.name}>
          {row.name}
        </div>
      ),
    },
    {
      id: "productId",
      label: "Product ID",
      width: "150px",
      visible: true,
      sortable: true,
      filterConfig: { type: "text" },
    },
    {
      id: "daId",
      label: "DA ID",
      width: "140px",
      visible: true,
      sortable: true,
      filterConfig: { type: "text" },
    },
    {
      id: "category",
      label: "Category",
      width: "150px",
      visible: true,
      sortable: true,
      filterConfig: {
        type: "select",
        options: categories.map(c => c.name)
      },
      render: (value: string) => (
        <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-[${color.primary.accent}]/10 text-black`}>
          {value}
        </span>
      ),
    },
    {
      id: "status",
      label: "Status",
      width: "120px",
      visible: true,
      sortable: true,
      filterConfig: { type: "select", options: ["Active", "Inactive"] },
      render: (value: string) => {
        const isActive = value === "Active";
        const statusBadge = isActive
          ? `bg-[${color.status.success}] text-[${color.status.success}]`
          : `bg-[${color.surface.cards}] text-[${color.text.primary}]`;
        return (
          <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${statusBadge}`}>
            {value}
          </span>
        );
      },
    },
    {
      id: "created",
      label: "Created",
      width: "150px",
      visible: true,
      sortable: true,
      filterConfig: { type: "date" },
      render: (value: string) => <DateFormatter date={value} />,
    },
    {
      id: "actions",
      label: "Actions",
      width: "180px",
      visible: true,
      sortable: false,
      render: (_, row) => {
        const isActive = row.is_active ?? false;
        return (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => navigate(`/dashboard/products/${row.id}`)}
              className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${tw.rounded} transition-all duration-200`}
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <PermissionGate permission="products.update">
              <button
                onClick={() =>
                  navigate(`/dashboard/products/${row.id}/edit`, {
                    state: { returnTo: { pathname: "/dashboard/products" } },
                  })
                }
                className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${tw.rounded} transition-all duration-200`}
                title="Edit Product"
              >
                <Edit className="w-4 h-4" />
              </button>
            </PermissionGate>
            <button
              onClick={() => row.product && handleToggleStatus(row.product)}
              disabled={loadingProductId === row.id || !row.product}
              className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${tw.rounded} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isActive ? "Deactivate" : "Activate"}
            >
              {loadingProductId === row.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              ) : isActive ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
            <PermissionGate permission="products.delete">
              <button
                onClick={() => handleDelete(row.id)}
                className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-all duration-200`}
                title="Delete Product"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </PermissionGate>
          </div>
        );
      },
    },
  ];

  const handleExportCSV = () => {
    if (products.length === 0) {
      showError("No products to export", "There are no products to export");
      return;
    }

    const headers = ["ID", "Product Name", "Product ID", "DA ID", "Category", "Status", "Created"];
    const rows = products.map((product) => {
      const categoryName =
        categories.find((cat) => cat.id === parseInt(product.category_id))?.name ||
        "Uncategorized";
      const status = product.is_active ? "Active" : "Inactive";
      return [
        product.id || "",
        product.name || "",
        product.product_id || product.id || "N/A",
        product.da_id || "N/A",
        categoryName,
        status,
        product.created_at || "",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `products_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <div className="flex flex-col md:flex-row gap-3 items-end">
          {/* Search */}
          <div className="flex-1">
            <SearchInput
              placeholder="Search products..."
              value={filters.search || ""}
              onChange={(value) => handleSearch(value)}
            />
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-40">
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
              className="text-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-32">
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
              className="text-sm"
            />
          </div>

          {/* Sort */}
          <div className="w-full md:w-40">
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
              className="text-sm"
            />
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className={`flex items-center gap-2 ${tw.rounded} transition-colors font-medium whitespace-nowrap`}
            style={{
              backgroundColor: button.action.background,
              color: button.action.color,
              border: button.action.border,
              padding: `${button.action.paddingY} ${button.action.paddingX}`,
              borderRadius: button.action.borderRadius,
              fontSize: button.action.fontSize,
            }}
            title="Download as CSV"
          >
            <Download className="h-4 w-4" />
            <span>Download CSV</span>
          </button>
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
      <div className={`${tw.rounded} overflow-hidden`}>
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
          <>
            <div className="overflow-x-auto">
              <Table<ProductTableRow>
                columns={columns}
                data={products.map((product) => {
                  const categoryName =
                    categories.find((cat) => cat.id === parseInt(product.category_id))?.name ||
                    "Uncategorized";
                  const status = product.is_active ? "Active" : "Inactive";
                  return {
                    id: product.id,
                    name: product.name,
                    productId: product.product_id || product.id || "N/A",
                    daId: product.da_id || "N/A",
                    category: categoryName,
                    status: status,
                    created: product.created_at,
                    is_active: product.is_active,
                    product: product,
                  };
                })}
                rowSpacing="0 8px"
                totalItems={total}
                currentPage={filters.page || 1}
                pageSize={filters.pageSize || 10}
                onHideColumn={toggleColumn}
                onManageColumnsClick={() => setShowColumnPicker(true)}
                expandedRowId={expandedRowId}
                onExpandChange={setExpandedRowId}
                expandedContent={(row) => {
                  const product = products.find(p => p.id === row.id);
                  return product ? (
                    <div className="p-4 bg-gray-50 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-600">Product Name</p>
                          <p className="text-sm text-gray-900">{product.name}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600">Category</p>
                          <p className="text-sm text-gray-900">{categories.find(cat => cat.id === parseInt(product.category_id))?.name || "Uncategorized"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600">Price</p>
                          <p className="text-sm text-gray-900">{product.price ? <CurrencyFormatter amount={Number(product.price)} /> : "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600">Created Date</p>
                          <p className="text-sm text-gray-900">{product.created_at ? <DateFormatter date={product.created_at} useLocale year="numeric" month="short" day="numeric" /> : "—"}</p>
                        </div>
                      </div>
                    </div>
                  ) : null;
                }}
              />
            </div>
          </>
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

      {/* Column Picker Modal */}
      <ColumnPickerModal
        isOpen={showColumnPicker}
        columns={columns}
        onClose={() => setShowColumnPicker(false)}
        onToggleColumn={toggleColumn}
        onReorderColumns={reorderColumns}
        onResetToDefaults={resetToDefaults}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirm.id !== null}
        onClose={() => {
          closeDeleteConfirm();
          setProductToDelete(null);
        }}
        onConfirm={confirmDeleteProduct}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        itemName={deleteConfirm.itemName}
        isLoading={isDeleting}
        confirmText="Delete Product"
        cancelText="Cancel"
      />
    </div>
  );
}
