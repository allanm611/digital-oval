import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Package } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import { Product, UpdateProductRequest, ProductUnit } from "../types/product";
import { productService } from "../services/productService";
import ProductForm from "../components/ProductForm";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function EditProductPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { success, error: showError } = useToast();
  const { t } = useLanguage();

  // Check if we came from a returnTo state (e.g., from offer details)
  const returnTo = (
    location.state as {
      returnTo?: {
        pathname: string;
        fromModal?: boolean;
      };
    }
  )?.returnTo;

  const navigateBack = () => {
    if (returnTo) {
      navigate(returnTo.pathname, {
        state: returnTo.fromModal ? { fromModal: true } : undefined,
      });
    } else {
      navigate(`/dashboard/products/${id}`);
    }
  };
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [formData, setFormData] = useState<UpdateProductRequest>({
    product_code: "",
    name: "",
    da_id: "",
    description: "",
    category_id: undefined,
    price: 0,
    currency: "KES",
    scope: "segment",
    unit: "data_mb",
    unit_value: 0,
    validity_hours: undefined,
  });

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const loadProduct = async () => {
    try {
      setIsLoadingProduct(true);
      const response = await productService.getProductById(Number(id), true);

      if (!response.data) {
        throw new Error("Product not found");
      }

      const productData = response.data;
      setProduct(productData);

      // Populate form with existing data based on API response structure
      // Map unit_of_measure back to unit if backend returns it
      const unitFromBackend =
        (productData as unknown as { unit_of_measure?: string })
          .unit_of_measure ||
        productData.unit ||
        "data_mb";

      // Extract combo_data from metadata if it exists
      const comboDataFromMetadata = productData.metadata?.combo_data as
        | { resources: unknown[]; shared_validity?: boolean; shared_validity_hours?: number }
        | undefined;

      setFormData({
        product_code: productData.product_code || "",
        name: productData.name || "",
        da_id: productData.da_id || "",
        description: productData.description || "",
        category_id: productData.category_id,
        product_type_id: productData.product_type_id,
        price: productData.price || 0,
        currency: productData.currency || "KES",
        scope: productData.scope || "segment",
        unit: unitFromBackend as ProductUnit,
        unit_value: productData.unit_value ?? 0,
        validity_hours: productData.validity_hours,
        combo_data: comboDataFromMetadata,
        tags: productData.tags,
      });

      // Set selected category IDs for MultiCategorySelector
      if (productData.category_id) {
        setSelectedCategoryIds([productData.category_id]);
      }
    } catch (err) {
      showError(
        t.products.failedToLoadProduct,
        err instanceof Error ? err.message : t.products.failedToLoadProduct
      );
    } finally {
      setIsLoadingProduct(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (
      !formData.name?.trim() ||
      !formData.product_code?.trim() ||
      !formData.da_id?.trim()
    ) {
      showError(
        t.products.validationError,
        t.products.productCodeNameRequired
      );
      return;
    }

    try {
      setIsLoading(true);

      // Map unit to unit_of_measure and exclude backend-unsupported fields
      // Backend doesn't accept: product_type_id, unit, unit_value, combo_data
      const {
        is_active,
        unit,
        unit_value,
        validity_hours,
        combo_data,
        product_type_id,
        ...updateData
      } = formData;

      // Prepare update data with unit_of_measure
      const finalUpdateData: typeof updateData & {
        unit_of_measure?: string;
        validity_hours?: number;
        combo_data?: typeof combo_data;
      } = {
        ...updateData,
      };

      // Map unit to unit_of_measure if unit is provided
      if (unit) {
        finalUpdateData.unit_of_measure = unit;
      }

      // Convert validity_hours to validity_days (backend expects days, not hours)
      // Example: 24 hours = 1 day, 48 hours = 2 days, etc.
      if (validity_hours && validity_hours > 0) {
        finalUpdateData.validity_days = Math.ceil(validity_hours / 24);
      }

      // Include combo_data if provided (for combo products)
      if (combo_data && combo_data.resources.length > 0) {
        finalUpdateData.combo_data = combo_data;
      }

      // Update product data
      await productService.updateProduct(Number(id), finalUpdateData);
      success(
        t.products.productUpdated,
        t.products.productUpdateSuccess.replace("{name}", formData.name)
      );
      navigateBack();
    } catch (err) {
      // Extract detailed error message from backend response
      let errorMessage = t.products.failedToUpdateProduct;

      if (err instanceof Error) {
        // Error from service (already extracted and translated to user-friendly message)
        errorMessage = err.message;
      } else if (err && typeof err === "object") {
        // Fallback for axios-style errors or other error formats
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const error = err as any;
        if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      console.error("Product update error:", err);
      showError(t.products.productUpdated, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof UpdateProductRequest,
    value: string | number | boolean | undefined | UpdateProductRequest["combo_data"]
  ) => {
    setFormData({ ...formData, [field]: value as any });
  };

  const handleCategoryCreated = (categoryId: number) => {
    // Auto-select the newly created category
    setSelectedCategoryIds([categoryId]);
    // Trigger refresh of the MultiCategorySelector
    setRefreshTrigger((prev) => prev + 1);
  };

  if (isLoadingProduct) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner
          variant="modern"
          size="xl"
          color="primary"
          className="mb-4"
        />
        <p className={`${tw.textMuted} font-medium text-sm`}>
          Loading product...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Product not found
          </h3>
          <p className="text-gray-500 mb-6">
            The product you're looking for doesn't exist.
          </p>
          <button
            onClick={() =>
              navigateBackOrFallback(navigate, "/dashboard/products")
            }
            className={`bg-[#3b8169] hover:bg-[#2d5f4e] text-white px-4 py-2 ${tw.rounded} text-base font-semibold transition-all duration-200`}
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <BackButton
            fallbackTo="/dashboard/products"
            onClick={navigateBack}
            style={{ color: color.text.secondary }}
          />
          <div>
            <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
              Edit Product
            </h1>
            <p className={`${tw.textSecondary} mt-1 text-sm`}>
              Update product information
            </p>
          </div>
        </div>
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
        submitButtonText="Update Product"
        loadingText="Updating..."
        onCancel={() => navigate("/dashboard/products")}
      />
    </div>
  );
}
