import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BackButton from "../../../shared/components/ui/BackButton";
import { CreateProductRequest } from "../types/product";
import { productService } from "../services/productService";
import ProductForm from "../components/ProductForm";
import { tw, color } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { X } from "lucide-react";

interface CreateProductPageProps {
  onSuccess?: (productId: number) => void;
  onClose?: () => void;
}

export default function CreateProductPage({
  onSuccess,
  onClose,
}: CreateProductPageProps = {}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { success, error: showError } = useToast();
  const { t } = useLanguage();

  // Get return URL if coming from offer flow
  const returnToOfferFlow = searchParams.get("returnToOfferFlow") === "true";
  const returnUrlParam = searchParams.get("returnUrl");
  const returnUrl = returnUrlParam ? decodeURIComponent(returnUrlParam) : null;

  // Extract the path to return to (with step parameter preserved)
  const getBackButtonFallback = (): string => {
    if (returnUrl) {
      try {
        const url = new URL(returnUrl);
        return url.pathname + url.search;
      } catch (e) {
        return "/dashboard/products";
      }
    }
    return "/dashboard/products";
  };

  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [formData, setFormData] = useState<CreateProductRequest>({
    product_code: "",
    name: "",
    price: 0,
    description: "",
    category_id: undefined,
    currency: "KES",
    da_id: "",
    scope: "segment",
    unit: "data_mb",
    unit_value: 1,
    validity_hours: 24,
  });
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  // Initialize selectedCategoryIds from formData.category_id
  useEffect(() => {
    if (
      formData.category_id &&
      !selectedCategoryIds.includes(formData.category_id)
    ) {
      setSelectedCategoryIds([formData.category_id]);
    } else if (!formData.category_id && selectedCategoryIds.length > 0) {
      setSelectedCategoryIds([]);
    }
  }, [formData.category_id]);

  // Update formData.category_id when selectedCategoryIds changes (use first one)
  useEffect(() => {
    const firstCategoryId =
      selectedCategoryIds.length > 0 ? selectedCategoryIds[0] : undefined;
    if (formData.category_id !== firstCategoryId) {
      setFormData((prev) => ({
        ...prev,
        category_id: firstCategoryId, // Send only first to backend
      }));
    }
  }, [selectedCategoryIds]);

  // Preselect category from URL parameter
  useEffect(() => {
    const categoryIdParam = searchParams.get("categoryId");
    if (categoryIdParam) {
      const categoryId = parseInt(categoryIdParam);
      setSelectedCategoryIds([categoryId]);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (
      !formData.product_code.trim() ||
      !formData.name.trim() ||
      formData.price <= 0 ||
      !formData.da_id.trim()
    ) {
      showError(t.products.validationError, t.products.productCodeNameRequired);
      return;
    }

    try {
      setIsLoading(true);

      // Map unit to unit_of_measure and exclude frontend-only fields
      // Backend doesn't accept: unit, unit_value, validity_hours, combo_data, product_type_id
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {
        unit,
        unit_value,
        validity_hours,
        combo_data,
        product_type_id,
        ...submitData
      } = formData;

      // Prepare submission data with unit_of_measure
      const finalSubmitData: typeof submitData & {
        unit_of_measure?: string;
        validity_hours?: number;
      } = {
        ...submitData,
      };

      // Map unit to unit_of_measure if unit is provided
      if (unit) {
        finalSubmitData.unit_of_measure = unit;
      }

      // Convert validity_hours to validity_days (backend expects days, not hours)
      // Example: 24 hours = 1 day, 48 hours = 2 days, etc.
      if (validity_hours && validity_hours > 0) {
        finalSubmitData.validity_days = Math.ceil(validity_hours / 24);
      }

      // Note: combo_data is kept for frontend only, not sent to backend yet
      // Backend support will be added later

      const result = await productService.createProduct(finalSubmitData);
      success(
        t.products.productCreated,
        t.products.productCreateSuccess.replace("{name}", formData.name),
      );

      // Call onSuccess callback if provided (modal mode)
      const productId = result?.data?.id || result?.id;
      if (productId && onSuccess) {
        onSuccess(productId);
        return;
      }

      // Check if we should return to offer creation flow
      if (returnToOfferFlow && returnUrl) {
        // Store the created product ID in sessionStorage for offer flow tracking
        // Note: The created product will be available in product list immediately since it's active by default
        const offerFlowCreatedProductsStr = sessionStorage.getItem(
          "offerFlowCreatedProducts",
        );
        const offerFlowProductIds: number[] = offerFlowCreatedProductsStr
          ? JSON.parse(offerFlowCreatedProductsStr)
          : [];

        sessionStorage.setItem(
          "offerFlowCreatedProducts",
          JSON.stringify(offerFlowProductIds),
        );

        // Navigate back to offer creation at step 2
        const url = new URL(returnUrl);
        // Ensure we're on step 2
        url.searchParams.set("step", "2");
        url.searchParams.set("returnFromProductCreate", "true");

        navigate(url.pathname + url.search);
      } else {
        navigate("/dashboard/products");
      }
    } catch (err) {
      // Extract detailed error message from backend response
      let errorMessage = t.products.failedToCreateProduct;

      if (err instanceof Error) {
        // Error from service (already extracted and translated to user-friendly message)
        errorMessage = err.message;
      } else if (err && typeof err === "object") {
        // Fallback for axios-style errors or other error formats
        const error = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
        if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      console.error("Product creation error:", err);
      showError(t.products.failedToCreateProduct, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof CreateProductRequest,
    value:
      | string
      | number
      | boolean
      | undefined
      | CreateProductRequest["combo_data"],
  ) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleCategoryCreated = (categoryId: number) => {
    // Auto-select the newly created category
    setSelectedCategoryIds([categoryId]);
    // Trigger refresh of the MultiCategorySelector
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button, Title, and Close Button */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <BackButton fallbackTo={getBackButtonFallback()} />
          <div>
            <h1 className={`text-xl font-bold ${tw.textPrimary}`}>
              {t.products.createNewProduct}
            </h1>
            <p className={`${tw.textSecondary} text-sm`}>
              {t.products.addNewProduct}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors flex-shrink-0`}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Form */}
      <ProductForm
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        selectedCategoryIds={selectedCategoryIds}
        onCategoryIdsChange={setSelectedCategoryIds}
        showCreateModal={showCreateModal}
        onShowCreateModal={setShowCreateModal}
        refreshTrigger={refreshTrigger}
        onCategoryCreated={handleCategoryCreated}
        submitButtonText="Create Product"
        loadingText="Creating..."
        onCancel={() => navigate("/dashboard/products")}
      />
    </div>
  );
}
