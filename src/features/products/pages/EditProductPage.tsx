import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Package } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import { Product, UpdateProductRequest, ProductUnit } from "../types/product";
import { productService } from "../services/productService";
import ProductForm from "../components/ProductForm";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
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
    unit: "",
    unit_value: 0,
    validity_hours: undefined,
    tags: [],
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

      const unitFromBackend = (productData as any).unit_of_measure || (productData as any).unit || "";
      const valueFromBackend = (productData as any).value ?? (productData.metadata?.value as any) ?? 0;

      const comboDataFromMetadata = productData.metadata?.combo_data as
        | { resources: unknown[]; shared_validity?: boolean; shared_validity_hours?: number }
        | undefined;

      let tagsArray: string[] = [];
      if (productData.tags) {
        if (typeof productData.tags === "string") {
          try {
            tagsArray = JSON.parse(productData.tags);
            if (!Array.isArray(tagsArray)) {
              tagsArray = [];
            }
          } catch {
            tagsArray = [];
          }
        } else if (Array.isArray(productData.tags)) {
          tagsArray = productData.tags.map((tag: any) =>
            typeof tag === "string" ? tag : (tag?.name || String(tag))
          );
        }
      }

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
        unit_value: valueFromBackend,
        validity_hours: productData.validity_hours || (productData.validity_days ? productData.validity_days * 24 : undefined),
        combo_data: comboDataFromMetadata,
        tags: tagsArray,
      });

      // Set selected category IDs for MultiCategorySelector
      if (productData.category_id) {
        setSelectedCategoryIds([productData.category_id]);
      }
    } catch (err) {
      const errorMsg = extractBackendError(err, t.products.failedToLoadProduct);
      showError(errorMsg, "", true);
    } finally {
      setIsLoadingProduct(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Note: Form validation is now handled in ProductForm component
    // Form will prevent submission if required fields are empty

    try {
      setIsLoading(true);

      const { unit, unit_value, combo_data, ...baseData } = formData;

      const finalUpdateData: any = { ...baseData };

      if (unit) finalUpdateData.unit_of_measure = unit;
      if (unit_value && unit_value > 0) finalUpdateData.value = unit_value;
      if (formData.validity_hours && formData.validity_hours > 0) finalUpdateData.validity_hours = formData.validity_hours;
      if (combo_data?.resources?.length) {
        finalUpdateData.resources = combo_data.resources.map((resource: any) => ({
          resource_type: resource.resource_type,
          resource_unit: resource.unit?.toLowerCase(),
          resource_value: resource.unit_value,
          ...(resource.validity_hours !== undefined && { validity_hours: resource.validity_hours }),
          ...(resource.price !== undefined && { price: resource.price }),
          ...(resource.daid_account && { daid_account: resource.daid_account }),
        }));
      }

      // CRITICAL: Ensure tags is ALWAYS an array, NEVER a string
      // This is the most important fix - tags MUST be an array for the backend
      if (finalUpdateData.tags) {
        if (typeof finalUpdateData.tags === 'string') {
          // If tags is a string, try to parse it as JSON array
          try {
            const parsed = JSON.parse(finalUpdateData.tags);
            finalUpdateData.tags = Array.isArray(parsed) ? parsed : [];
          } catch {
            // If parsing fails, create empty array
            finalUpdateData.tags = [];
          }
        } else if (!Array.isArray(finalUpdateData.tags)) {
          // If tags is some other type, convert to empty array
          finalUpdateData.tags = [];
        }
      } else {
        // If tags is undefined/null, set to empty array
        finalUpdateData.tags = [];
      }

      // Update product data
      await productService.updateProduct(Number(id), finalUpdateData);
      success(
        t.products.productUpdated,
        t.products.productUpdateSuccess.replace("{name}", formData.name)
      );
      navigateBack();
    } catch (err) {
      console.error("Product update error:", err);
      const errorMsg = extractBackendError(err, t.products.failedToUpdateProduct);
      showError(errorMsg, "", true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof UpdateProductRequest,
    value: string | number | boolean | string[] | undefined | UpdateProductRequest["combo_data"]
  ) => {
    setFormData({ ...formData, [field]: value });
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
      <BackButton
        showBreadcrumb={true}
        currentLabel="Edit Product"
      />

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
