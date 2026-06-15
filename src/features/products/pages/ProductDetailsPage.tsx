import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  Tag,
  Power,
  PowerOff,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { Product } from "../types/product";
import { ProductCategory } from "../types/productCategory";
import { productService } from "../services/productService";
import { productCategoryService } from "../services/productCategoryService";
import { color, tw, button } from "../../../shared/utils/utils";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useLanguage } from "../../../contexts/LanguageContext";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import CurrencyFormatter from "../../../shared/components/CurrencyFormatter";
import DateFormatter from "../../../shared/components/DateFormatter";
import { PermissionGate } from "../../auth/components/PermissionGate";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import { FeatureActionButton } from "../../../shared/components/FeatureActionButton";

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error: showError } = useToast();
  const { t } = useLanguage();

  const returnTo = (
    location.state as { returnTo?: { pathname: string; section?: string } }
  )?.returnTo;

  const navigateBack = () => {
    if (returnTo) {
      navigate(returnTo.pathname, {
        replace: true,
        state: { focusSection: returnTo.section },
      });
      return;
    }

    navigateBackOrFallback(navigate, "/dashboard/products");
  };

  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const loadProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [productResponse, categoriesResponse] = await Promise.all([
        productService.getProductById(Number(id), true),
        productCategoryService.getAllCategories({
          limit: 100,
          skipCache: true,
        }),
      ]);

      if (!productResponse.success || !productResponse.data) {
        throw new Error("Product not found");
      }

      const productData = productResponse.data;
      setProduct(productData);

      // Find the category for this product
      const productCategory = (categoriesResponse.data || []).find(
        (cat) => cat.id === productData.category_id,
      );
      setCategory(productCategory || null);
    } catch (err) {
      console.error("Failed to load product:", err);
      showError("Failed to load product", "Please try again later.");
      setError(""); // Clear error state
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id, loadProduct]);

  const handleToggleStatus = async () => {
    if (!product) return;

    setIsTogglingStatus(true);
    try {
      // Optimistic UI update - update state immediately
      setProduct((prev) =>
        prev ? { ...prev, is_active: !prev.is_active } : null
      );

      if (product.is_active) {
        await productService.deactivateProduct(Number(id));
        success(
          "Product Deactivated",
          `"${product.name}" has been deactivated successfully.`,
        );
      } else {
        await productService.activateProduct(Number(id));
        success(
          "Product Activated",
          `"${product.name}" has been activated successfully.`,
        );
      }
    } catch (err) {
      console.error("Failed to toggle product status:", err);
      showError("Failed to update product status", extractBackendError(error, "Failed to update product status. Please try again."));
      // Revert optimistic update on error
      setProduct((prev) =>
        prev ? { ...prev, is_active: !prev.is_active } : null
      );
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleDelete = () => {
    if (!product) return;
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!product) return;

    setIsDeleting(true);
    try {
      await productService.deleteProduct(Number(id));
      success(
        "Product Deleted",
        `"${product.name}" has been deleted successfully.`,
      );
      setShowDeleteModal(false);
      navigate("/dashboard/products");
    } catch (err) {
      console.error("Failed to delete product:", err);
      // Extract backend error message
      const errorMessage =
        (err instanceof Error ? err.message : null) ||
        (typeof err === "object" && err !== null && "error" in err
          ? String((err as Record<string, unknown>).error)
          : null) ||
        "Failed to delete product. Please try again.";
      // Bypass silent mode for delete operations to always show error
      showError("Cannot Delete Product", extractBackendError(error, "Cannot Delete Product. Please try again."));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner
          variant="modern"
          size="xl"
          color="primary"
          className="mb-4"
        />
        <p className={`${tw.textMuted} font-medium text-sm`}>
          Loading product details...
        </p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Package
            className={`w-16 h-16 text-[${color.primary.accent}] mx-auto mb-4`}
          />
          <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
            {error ? "Error Loading Product" : "Product Not Found"}
          </h3>
          <p className={`${tw.textMuted} mb-6`}>
            {error
              ? "Please try again later."
              : "The product you are looking for does not exist."}
          </p>
          <button
            onClick={navigateBack}
            className={`px-4 py-2 text-white ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 mx-auto text-sm`}
            style={{ backgroundColor: button.action.background }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <BackButton showBreadcrumb={true} currentLabel="Product Details" />
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleToggleStatus}
            disabled={isTogglingStatus}
            className={`px-4 py-2 ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-sm w-fit disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{
              backgroundColor: button.secondaryAction.background,
              color: "black",
            }}
            onMouseEnter={(e) => {
              if (!isTogglingStatus) {
                (e.target as HTMLButtonElement).style.opacity = "0.9";
              }
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.opacity = "1";
            }}
          >
            {isTogglingStatus ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                {product.is_active ? "Deactivating..." : "Activating..."}
              </>
            ) : product.is_active ? (
              <>
                <PowerOff className="w-4 h-4" />
                Deactivate
              </>
            ) : (
              <>
                <Power className="w-4 h-4" />
                Activate
              </>
            )}
          </button>
          <FeatureActionButton
            featureId="products"
            action="edit"
            itemId={id}
            variant="primary"
            label="Edit Product"
            navigationState={{
              returnTo: returnTo || {
                pathname: `/dashboard/products/${id}`,
              },
            }}
          />
          <PermissionGate permission="products.delete">
            <button
              onClick={handleDelete}
              className={`${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-sm w-fit`}
              style={{
                backgroundColor: button.delete.background,
                color: button.delete.color,
                border: button.delete.border,
                padding: `${button.delete.paddingY} ${button.delete.paddingX}`,
                borderRadius: button.delete.borderRadius,
                fontSize: button.delete.fontSize,
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.opacity = "1";
              }}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Product Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Product Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Overview & Basic Information */}
          <div
            className={`${tw.rounded} p-6`}
            style={{ backgroundColor: 'var(--c-surface-cards)' }}
          >
            <div className="flex items-start space-x-4 mb-3">
              <div
                className={`h-14 w-14 ${tw.rounded} flex items-center justify-center flex-shrink-0`}
                style={{ backgroundColor: color.primary.accent }}
              >
                <Package className={`w-7 h-7 text-white`} />
              </div>
              <div className="flex-1">
                <h2 className={`${tw.tableFirstColumn} ${tw.textPrimary} mb-2`}>
                  {product.name}
                </h2>
                <p className={`${tw.textSecondary} text-sm leading-relaxed`}>
                  {product.description || "No description available"}
                </p>
              </div>
            </div>

            {/* Basic Information Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              <div className="space-y-1">
                <label
                  className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                >
                  Product Code
                </label>
                <p
                  className={`text-sm ${tw.textPrimary}`}
                >
                  {product.product_code || product.id || "N/A"}
                </p>
              </div>
              <div className="space-y-1">
                <label
                  className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                >
                  DA ID
                </label>
                <p
                  className={`text-sm ${tw.textPrimary}`}
                >
                  {product.da_id || "N/A"}
                </p>
              </div>
              <div className="space-y-1">
                <label
                  className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                >
                  Status
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {product.is_active ? "Active" : "Inactive"}
                </p>
              </div>
              <div className="space-y-1">
                <label
                  className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                >
                  Category
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {category?.name || "No category assigned"}
                </p>
              </div>
              <div className="space-y-1">
                <label
                  className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                >
                  Requires Inventory
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {product.requires_inventory ? "Yes" : "No"}
                </p>
              </div>
              {product.product_type_label && (
                <div className="space-y-1">
                  <label
                    className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                  >
                    Product Type
                  </label>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    {product.product_type_label}
                  </p>
                </div>
              )}
              {product.product_uuid && (
                <div className="space-y-1">
                  <label
                    className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                  >
                    Product UUID
                  </label>
                  <p className={`text-sm ${tw.textPrimary} text-xs font-mono break-all`}>
                    {product.product_uuid}
                  </p>
                </div>
              )}
              {product.scope && (
                <div className="space-y-1">
                  <label
                    className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                  >
                    Scope
                  </label>
                  <p className={`text-sm ${tw.textPrimary} capitalize`}>
                    {product.scope}
                  </p>
                </div>
              )}
            </div>

            {/* Tags - Inline in Basic Information Card */}
            {product.tags && product.tags.length > 0 && (
              <div className="pt-6">
                <label
                  className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide block mb-3`}
                >
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm font-medium rounded-full text-white"
                      style={{
                        backgroundColor: color.primary.accent,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pricing & Validity Information */}
          <div
            className={`${tw.rounded} p-6`}
            style={{ backgroundColor: 'var(--c-surface-cards)' }}
          >
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
              Pricing & Validity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {product.product_type_label !== "Combo" && (
                <div className="space-y-1">
                  <label
                    className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                  >
                    Price
                  </label>
                  <p className={`text-sm ${tw.textPrimary} font-semibold`}>
                    <CurrencyFormatter amount={product.price} />
                  </p>
                </div>
              )}
              {product.cost && (
                <div className="space-y-1">
                  <label
                    className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                  >
                    Cost
                  </label>
                  <p className={`text-sm ${tw.textPrimary} font-semibold`}>
                    <CurrencyFormatter amount={product.cost} />
                  </p>
                </div>
              )}
              {product.currency && (
                <div className="space-y-1">
                  <label
                    className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                  >
                    Currency
                  </label>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    {product.currency}
                  </p>
                </div>
              )}
              {product.available_quantity && (
                <div className="space-y-1">
                  <label
                    className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                  >
                    Available Quantity
                  </label>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    {product.available_quantity}
                  </p>
                </div>
              )}
              {product.validity_days && (
                <div className="space-y-1">
                  <label
                    className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                  >
                    Validity Days
                  </label>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    {product.validity_days}{" "}
                    {product.validity_days === 1 ? "day" : "days"}
                  </p>
                </div>
              )}
              {product.validity_hours && (
                <div className="space-y-1">
                  <label
                    className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                  >
                    Validity Hours
                  </label>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    {product.validity_hours}{" "}
                    {product.validity_hours === 1 ? "hour" : "hours"}
                  </p>
                </div>
              )}
              {product.unit_of_measure && (
                <div className="space-y-1">
                  <label
                    className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                  >
                    Unit of Measure
                  </label>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    {product.unit_of_measure}
                  </p>
                </div>
              )}
              {product.effective_from && (
                <div className="space-y-1">
                  <label
                    className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                  >
                    Effective From
                  </label>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    <DateFormatter
                      date={product.effective_from}
                      useLocale
                      year="numeric"
                      month="long"
                      day="numeric"
                    />
                  </p>
                </div>
              )}
              {product.effective_to && (
                <div className="space-y-1">
                  <label
                    className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                  >
                    Effective To
                  </label>
                  <p className={`text-sm ${tw.textPrimary}`}>
                    <DateFormatter
                      date={product.effective_to}
                      useLocale
                      year="numeric"
                      month="long"
                      day="numeric"
                    />
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Resources for Combo Products */}
          {product.resources && product.resources.length > 0 && (
            <div
              className={`${tw.rounded} p-6`}
            style={{ backgroundColor: 'var(--c-surface-cards)' }}
            >
              <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
                Resources
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className={`text-left py-3 px-4 font-semibold ${tw.textMuted} uppercase text-xs`}>
                        Resource Type
                      </th>
                      <th className={`text-left py-3 px-4 font-semibold ${tw.textMuted} uppercase text-xs`}>
                        Value
                      </th>
                      <th className={`text-left py-3 px-4 font-semibold ${tw.textMuted} uppercase text-xs`}>
                        Unit
                      </th>
                      <th className={`text-left py-3 px-4 font-semibold ${tw.textMuted} uppercase text-xs`}>
                        Validity (Days)
                      </th>
                      <th className={`text-left py-3 px-4 font-semibold ${tw.textMuted} uppercase text-xs`}>
                        Validity (Hours)
                      </th>
                      <th className={`text-left py-3 px-4 font-semibold ${tw.textMuted} uppercase text-xs`}>
                        UOM
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.resources.map((resource: any, index: number) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100 transition-colors cursor-pointer"
                        style={{ borderColor: 'var(--c-border-default)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <td className={`py-3 px-4 ${tw.textPrimary}`}>
                          {resource.resource_type || "-"}
                        </td>
                        <td className={`py-3 px-4 ${tw.textPrimary} font-semibold`}>
                          {resource.resource_value || "-"}
                        </td>
                        <td className={`py-3 px-4 ${tw.textPrimary}`}>
                          {resource.resource_unit || "-"}
                        </td>
                        <td className={`py-3 px-4 ${tw.textPrimary}`}>
                          {resource.validity_days || "-"}
                        </td>
                        <td className={`py-3 px-4 ${tw.textPrimary}`}>
                          {resource.validity_hours || "-"}
                        </td>
                        <td className={`py-3 px-4 ${tw.textPrimary}`}>
                          {resource.unit_of_measure || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Sidebar - Timeline & Audit Trail */}
        <div className="space-y-6">
          {/* Timeline */}
          <div
            className={`${tw.rounded} p-6`}
            style={{ backgroundColor: 'var(--c-surface-cards)' }}
          >
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
              Timeline
            </h3>
            <div className="space-y-5">
              <div className="relative pl-6" style={{ borderLeft: '2px solid var(--c-border-default)' }}>
                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full" style={{ backgroundColor: 'var(--c-text-muted)' }}></div>
                <div className="space-y-1">
                  <p
                    className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                  >
                    Created
                  </p>
                  <p className={`text-sm ${tw.textPrimary} font-semibold`}>
                    <DateFormatter
                      date={product.created_at}
                      useLocale
                      year="numeric"
                      month="short"
                      day="numeric"
                    />
                  </p>
                  <p className={`text-xs ${tw.textMuted}`}>
                    <DateFormatter date={product.created_at} includeTime />
                  </p>
                </div>
              </div>
              {product.updated_at && (
                <div className="relative pl-6" style={{ borderLeft: '2px solid var(--c-border-default)' }}>
                  <div
                    className="absolute -left-2 top-0 w-4 h-4 rounded-full"
                    style={{ backgroundColor: color.primary.accent }}
                  ></div>
                  <div className="space-y-1">
                    <p
                      className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                    >
                      Last Updated
                    </p>
                    <p className={`text-sm ${tw.textPrimary} font-semibold`}>
                      <DateFormatter
                        date={product.updated_at}
                        useLocale
                        year="numeric"
                        month="short"
                        day="numeric"
                      />
                    </p>
                    <p className={`text-xs ${tw.textMuted}`}>
                      <DateFormatter date={product.updated_at} includeTime />
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Audit Trail */}
          <div
            className={`${tw.rounded} p-6`}
            style={{ backgroundColor: 'var(--c-surface-cards)' }}
          >
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
              Audit Trail
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label
                  className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                >
                  Created By
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {product.created_by || "-"}
                </p>
              </div>
              <div className="space-y-1">
                <label
                  className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                >
                  Updated By
                </label>
                <p className={`text-sm ${tw.textPrimary}`}>
                  {product.updated_by || "-"}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        itemName={product?.name || ""}
        isLoading={isDeleting}
        confirmText="Delete Product"
        cancelText="Cancel"
      />
    </div>
  );
}
