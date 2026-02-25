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
} from "lucide-react";
import { Product } from "../types/product";
import { ProductCategory } from "../types/productCategory";
import { productService } from "../services/productService";
import { productCategoryService } from "../services/productCategoryService";
import { color, tw, button } from "../../../shared/utils/utils";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import CurrencyFormatter from "../../../shared/components/CurrencyFormatter";
import DateFormatter from "../../../shared/components/DateFormatter";
import { PermissionGate } from "../../auth/components/PermissionGate";

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
  const [showStatusModal, setShowStatusModal] = useState(false);
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

  const handleToggleStatus = () => {
    if (!product) return;
    setShowStatusModal(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!product) return;

    setIsTogglingStatus(true);
    try {
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
      loadProduct(); // Reload to get updated status
    } catch (err) {
      console.error("Failed to toggle product status:", err);
      showError("Failed to update product status", "Please try again later.");
    } finally {
      setIsTogglingStatus(false);
      setShowStatusModal(false);
    }
  };

  const handleCancelStatusChange = () => {
    setShowStatusModal(false);
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
      showError("Cannot Delete Product", errorMessage, true);
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
            className={`px-4 py-2 ${tw.rounded} font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 mx-auto text-base text-white`}
            style={{ backgroundColor: color.primary.action }}
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
        <div className="flex items-center space-x-2 sm:space-x-4">
          <BackButton fallbackTo="/dashboard/products" onClick={navigateBack} />
          <div>
            <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
              {t.pages.productDetails}
            </h1>
            <p className={`${tw.textSecondary} mt-2 text-sm`}>
              View and manage product information
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row xl:flex-row lg:flex-col gap-3">
          <button
            onClick={handleToggleStatus}
            className={`px-4 py-2 ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-sm w-fit`}
            style={{
              backgroundColor: button.secondaryAction.background,
              color: "black",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.opacity = "1";
            }}
          >
            {product.is_active ? (
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
          <PermissionGate permission="products.update">
            <button
              onClick={() =>
                navigate(`/dashboard/products/${id}/edit`, {
                  state: {
                    returnTo: returnTo || {
                      pathname: `/dashboard/products/${id}`,
                    },
                  },
                })
              }
              className={`px-4 py-2 text-white ${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-sm w-fit`}
              style={{ backgroundColor: button.action.background }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.opacity = "1";
              }}
            >
              <Edit className="w-4 h-4" />
              Edit Product
            </button>
          </PermissionGate>
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
          {/* Product Overview */}
          <div
            className={`bg-white ${tw.rounded} border border-[${tw.borderDefault}] p-6`}
          >
            <div className="flex items-start space-x-4 mb-6">
              <div
                className={`h-14 w-14 ${tw.rounded} flex items-center justify-center flex-shrink-0`}
                style={{ backgroundColor: color.primary.accent }}
              >
                <Package className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className={`${tw.tableFirstColumn} ${tw.textPrimary} mb-2`}>
                  {product.name}
                </h2>
                <p className={`${tw.textSecondary} text-base leading-relaxed`}>
                  {product.description || "No description available"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200">
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                  product.is_active
                    ? `bg-[${color.status.success}]/10 text-[${color.status.success}]`
                    : `bg-[${color.surface.cards}] text-[${color.text.primary}]`
                }`}
              >
                {product.is_active ? (
                  <>
                    <Eye className="w-4 h-4 mr-1.5" />
                    Active
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4 mr-1.5" />
                    Inactive
                  </>
                )}
              </span>
              {category && (
                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-[${color.primary.accent}]/10 text-[${color.primary.accent}]`}
                >
                  <Tag className="w-4 h-4 mr-1.5" />
                  {category.name}
                </span>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div
            className={`bg-white ${tw.rounded} border border-[${tw.borderDefault}] p-6`}
          >
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label
                  className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                >
                  Product Code
                </label>
                <p
                  className={`text-base ${tw.textPrimary} font-mono font-semibold`}
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
                  className={`text-base ${tw.textPrimary} font-mono font-semibold`}
                >
                  {product.da_id || "N/A"}
                </p>
              </div>
              <div className="space-y-1">
                <label
                  className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                >
                  Category
                </label>
                <p className={`text-base ${tw.textPrimary}`}>
                  {category?.name || "No category assigned"}
                </p>
              </div>
              <div className="space-y-1">
                <label
                  className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                >
                  Requires Inventory
                </label>
                <p className={`text-base ${tw.textPrimary}`}>
                  {product.requires_inventory ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div
            className={`bg-white ${tw.rounded} border border-[${tw.borderDefault}] p-6`}
          >
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
              Pricing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label
                  className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                >
                  Price
                </label>
                <p className={`text-2xl font-bold ${tw.textPrimary}`}>
                  <CurrencyFormatter amount={product.price} />
                </p>
              </div>
              {product.cost && (
                <div className="space-y-1">
                  <label
                    className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                  >
                    Cost
                  </label>
                  <p className={`text-xl font-semibold ${tw.textPrimary}`}>
                    <CurrencyFormatter amount={product.cost} />
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Validity Information */}
          {(product.validity_days ||
            product.validity_hours ||
            product.effective_from ||
            product.effective_to) && (
            <div
              className={`bg-white ${tw.rounded} border border-[${tw.borderDefault}] p-6`}
            >
              <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
                Validity Period
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {product.validity_days && (
                  <div className="space-y-1">
                    <label
                      className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                    >
                      Validity Days
                    </label>
                    <p className={`text-base ${tw.textPrimary} font-semibold`}>
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
                    <p className={`text-base ${tw.textPrimary} font-semibold`}>
                      {product.validity_hours}{" "}
                      {product.validity_hours === 1 ? "hour" : "hours"}
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
                    <p className={`text-base ${tw.textPrimary}`}>
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
                    <p className={`text-base ${tw.textPrimary}`}>
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
          )}
        </div>

        {/* Sidebar - Timeline & Metadata */}
        <div className="space-y-6">
          {/* Timeline */}
          <div
            className={`bg-white ${tw.rounded} border border-[${tw.borderDefault}] p-6`}
          >
            <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
              Timeline
            </h3>
            <div className="space-y-5">
              <div className="relative pl-6 border-l-2 border-gray-200">
                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-gray-300"></div>
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
                <div className="relative pl-6 border-l-2 border-gray-200">
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

          {/* Additional Info */}
          {(product.available_quantity !== null || product.metadata) && (
            <div
              className={`bg-white ${tw.rounded} border border-[${tw.borderDefault}] p-6`}
            >
              <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-6`}>
                Additional Information
              </h3>
              <div className="space-y-4">
                {product.available_quantity !== null && (
                  <div className="space-y-1">
                    <label
                      className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                    >
                      Available Quantity
                    </label>
                    <p className={`text-base ${tw.textPrimary} font-semibold`}>
                      {product.available_quantity}
                    </p>
                  </div>
                )}
                {product.metadata && (
                  <div className="space-y-1">
                    <label
                      className={`text-xs font-medium ${tw.textMuted} uppercase tracking-wide`}
                    >
                      Metadata
                    </label>
                    <pre
                      className={`text-xs ${tw.textPrimary} bg-gray-50 p-3 ${tw.rounded} overflow-x-auto`}
                    >
                      {JSON.stringify(product.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Change Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showStatusModal}
        onClose={handleCancelStatusChange}
        onConfirm={handleConfirmStatusChange}
        title={product?.is_active ? "Deactivate Product" : "Activate Product"}
        description={`Are you sure you want to ${
          product?.is_active ? "deactivate" : "activate"
        } this product? This action can be reversed at any time.`}
        itemName={product?.name || ""}
        isLoading={isTogglingStatus}
        confirmText={product?.is_active ? "Deactivate" : "Activate"}
        cancelText="Cancel"
      />

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
