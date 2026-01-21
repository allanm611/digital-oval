import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, Plus, Check, Package, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Product } from "../types/product";
import { ProductCategory } from "../types/productCategory";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { productService } from "../services/productService";
import { productCategoryService } from "../services/productCategoryService";
import { color, tw } from "../../../shared/utils/utils";
import CurrencyFormatter from "../../../shared/components/CurrencyFormatter";

interface ProductSelectorProps {
  selectedProducts: Product[];
  onProductsChange: (products: Product[]) => void;
  multiSelect?: boolean;
  showAddButtonInline?: boolean;
  autoOpenModal?: boolean; // Auto-open modal on mount (skip empty state)
}

export default function ProductSelector({
  selectedProducts,
  onProductsChange,
  multiSelect = true,
  showAddButtonInline = false,
  autoOpenModal = false,
}: ProductSelectorProps) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(autoOpenModal); // Auto-open if prop is true

  // Handle Create Product button - navigate to product creation with returnUrl
  const handleCreateProduct = useCallback(() => {
    const currentUrl = window.location.href;
    const url = new URL(currentUrl);
    url.searchParams.set("step", "2");
    url.searchParams.set("returnFromProductCreate", "true");
    navigate(
      `/dashboard/products/create?returnToOfferFlow=true&returnUrl=${encodeURIComponent(url.toString())}`,
    );
  }, [navigate]);

  const loadCategories = useCallback(async () => {
    try {
      // Only show active product categories
      const response = await productCategoryService.getActiveCategories({
        limit: 100,
        skipCache: true,
      });
      const categoryOptions = [
        { value: "all", label: "All Catalogs" },
        ...(response.data || []).map((category: any) => ({
          value: category.id.toString(),
          label: category.name,
        })),
      ];
      setCategories(categoryOptions);
    } catch (error) {
      console.error("Error loading categories:", error);
      // Set empty categories if API fails
      setCategories([{ value: "all", label: "All Categories" }]);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);

      let response;

      // Use search if searchTerm is provided, otherwise use active products
      if (searchTerm.trim()) {
        response = await productService.searchProducts({
          q: searchTerm,
          limit: 100,
          skipCache: true,
        });
      } else {
        response = await productService.getActiveProducts({
          limit: 100,
          skipCache: true,
        });
      }

      let filteredProducts = response.data || [];

      // Apply category filter if not 'all'
      if (selectedCategory !== "all") {
        filteredProducts = filteredProducts.filter(
          (product: Product) =>
            product.category_id?.toString() === selectedCategory,
        );
      }

      setProducts(filteredProducts);
    } catch (error) {
      console.error("Error loading products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchTerm]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Detect return from product creation and auto-open modal
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const returnFromProductCreate = searchParams.get("returnFromProductCreate");

    if (returnFromProductCreate === "true") {
      // Auto-open the modal to show newly created products
      setIsModalOpen(true);

      // Clean up the flag from URL
      const url = new URL(window.location);
      url.searchParams.delete("returnFromProductCreate");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const handleProductToggle = (product: Product) => {
    if (multiSelect) {
      const isSelected = selectedProducts.some((p) => p.id === product.id);
      if (isSelected) {
        onProductsChange(selectedProducts.filter((p) => p.id !== product.id));
      } else {
        onProductsChange([...selectedProducts, product]);
      }
    } else {
      onProductsChange([product]);
      setIsModalOpen(false);
    }
  };

  const handleRemoveProduct = (productId: string) => {
    onProductsChange(selectedProducts.filter((p) => p.id !== productId));
  };

  const getCategoryIcon = () => {
    return (
      <Package className="w-6 h-6" style={{ color: color.primary.accent }} />
    );
  };

  const getCategoryName = (categoryId?: number): string => {
    if (!categoryId) return "-";
    const category = categories.find(
      (cat) => cat.value === categoryId.toString(),
    );
    return category?.label || "-";
  };

  return (
    <div className="space-y-4">
      {selectedProducts.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700">
              Selected Products ({selectedProducts.length})
            </h4>
            {showAddButtonInline && (
              <button
                onClick={() => setIsModalOpen(true)}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium ${tw.rounded} text-white transition-all duration-200`}
                style={{ backgroundColor: color.primary.action }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor =
                    color.primary.action;
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor =
                    color.primary.action;
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Products
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3">
            {selectedProducts.map((product) => (
              <div
                key={product.id}
                className={`flex items-center justify-between p-4 bg-gray-50 border border-gray-200 ${tw.rounded}`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-12 h-12 ${tw.rounded} flex items-center justify-center`}
                  >
                    {getCategoryIcon()}
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">
                      {product.name}
                    </h5>
                    <p className="text-sm text-gray-600">
                      {product.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span
                        className="text-xs px-2 py-1 text-white rounded-full"
                        style={{ backgroundColor: color.primary.action }}
                      >
                        {getCategoryName(product.category_id)}
                      </span>
                      {product.price && (
                        <span className="text-sm font-medium text-gray-700">
                          <CurrencyFormatter amount={product.price} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveProduct(product.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} border border-red-200 hover:border-red-300 transition-colors duration-200`}
                  title="Remove product"
                >
                  <X className="w-4 h-4" />
                  <span>Remove</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          className={`bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 ${tw.rounded} p-12`}
        >
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Products Selected
            </h3>
            <p className="text-sm text-gray-600 mb-6 max-w-md text-center">
              Start building your offer by selecting products. You can choose
              from various product categories and configure their details.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className={`inline-flex items-center px-5 py-2.5 text-white ${tw.rounded} text-sm font-medium transition-all`}
              style={{ backgroundColor: color.primary.action }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor =
                  color.primary.hover;
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor =
                  color.primary.action;
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Select Products
            </button>
          </div>
        </div>
      )}

      {/* Add More Products Button (only show when products are selected and not inline) */}
      {selectedProducts.length > 0 && !showAddButtonInline && (
        <div className="flex justify-center">
          <button
            onClick={() => setIsModalOpen(true)}
            className={`px-4 py-2 bg-white border border-gray-200 ${tw.rounded} hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2 text-gray-700 hover:text-gray-900 text-sm`}
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add More Products</span>
          </button>
        </div>
      )}

      {/* Product Selection Modal */}
      {isModalOpen &&
        createPortal(
          <div
            className="fixed bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
            style={{
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
            }}
          >
            <div
              className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col`}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Select Products
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Choose products to include in your offer
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCreateProduct}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium text-white ${tw.rounded} hover:opacity-90 transition-all`}
                    style={{ backgroundColor: color.primary.action }}
                    title="Create a new product"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Create Product
                  </button>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="px-6 pt-4 space-y-4 flex-shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 border border-gray-300 ${tw.rounded}`}
                    />
                  </div>
                  <div className="w-48">
                    <div className="[&_button]:py-2 [&_li]:py-1.5">
                      <HeadlessSelect
                        options={categories}
                        value={selectedCategory}
                        onChange={(value: string | number) =>
                          setSelectedCategory(String(value))
                        }
                        placeholder="Filter by catalog"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Selection Summary */}
              {selectedProducts.length > 0 && (
                <div className="px-6 flex-shrink-0 my-3">
                  <div
                    className={`${tw.rounded} p-4 border text-sm`}
                    style={{
                      backgroundColor: `${color.primary.accent}15`,
                      borderColor: `${color.primary.accent}40`,
                      color: color.primary.accent,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span>
                        {selectedProducts.length} product
                        {selectedProducts.length !== 1 ? "s" : ""} selected
                      </span>
                      <button
                        onClick={() => onProductsChange([])}
                        className="font-medium hover:opacity-80 transition-opacity"
                        style={{ color: color.primary.accent }}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Products List */}
              <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading products...</p>
                    </div>
                  </div>
                ) : products.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">No products found</p>
                      <p className="text-sm text-gray-500">
                        {searchTerm
                          ? "Try adjusting your search terms."
                          : "No products available at the moment."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`border ${tw.rounded} overflow-hidden`}
                    style={{ borderColor: color.border.default }}
                  >
                    <table
                      className="min-w-full divide-y"
                      style={{ borderColor: color.border.default }}
                    >
                      <thead style={{ backgroundColor: color.surface.cards }}>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                            Select
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                            Category
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                            Code
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                            Price
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody
                        className="bg-white divide-y"
                        style={{ borderColor: color.border.default }}
                      >
                        {products.map((product) => {
                          const isSelected = selectedProducts.some(
                            (p) => p.id === product.id,
                          );
                          return (
                            <tr
                              key={product.id}
                              onClick={() => handleProductToggle(product)}
                              className="cursor-pointer transition-colors hover:bg-gray-50"
                            >
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleProductToggle(product)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-4 h-4 border-gray-400 rounded"
                                  style={{ accentColor: "#111827" }}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {product.name}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {product.description || "No description"}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-gray-600">
                                  {getCategoryName(product.category_id)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm font-mono text-gray-600">
                                  {product.product_code}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {product.price ? (
                                  <CurrencyFormatter
                                    amount={product.price}
                                    className="text-sm font-medium text-gray-900"
                                  />
                                ) : (
                                  <span className="text-sm text-gray-400">
                                    -
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-block text-xs px-2 py-1 rounded-full ${
                                    product.is_active
                                      ? "bg-green-100 text-green-700"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {product.is_active ? "Active" : "Inactive"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 flex-shrink-0">
                <div className="text-sm text-gray-500">
                  {selectedProducts.length} of {products.length} products
                  selected
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className={`px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-colors`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    disabled={selectedProducts.length === 0}
                    className={`px-5 py-2 ${tw.rounded} text-sm font-medium ${
                      selectedProducts.length === 0 ? "cursor-not-allowed" : ""
                    }`}
                    style={{
                      backgroundColor:
                        selectedProducts.length > 0
                          ? color.primary.action
                          : color.interactive.disabled,
                      color:
                        selectedProducts.length === 0
                          ? color.text.muted
                          : "white",
                    }}
                  >
                    Confirm Selection
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
