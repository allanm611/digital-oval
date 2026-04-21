import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Plus, X, Check } from "lucide-react";
import SearchInput from "./ui/SearchInput";
import { ProductCategory } from "../../features/products/types/productCategory";
import { productCategoryService } from "../../features/products/services/productCategoryService";
import { color, tw } from "../utils/utils";

interface MultiCategorySelectorProps {
  value?: number[]; // Array of selected category IDs
  onChange: (categoryIds: number[]) => void;
  placeholder?: string;
  disabled?: boolean;
  allowCreate?: boolean;
  onCreateCategory?: () => void;
  onCategoryCreated?: (categoryId: number) => void;
  className?: string;
  refreshTrigger?: number;
  entityType?: "campaign" | "offer" | "product" | "segment"; // For loading correct categories
}

export default function MultiCategorySelector({
  value = [],
  onChange,
  placeholder = "Select Catalogs",
  disabled = false,
  allowCreate = false,
  onCreateCategory,
  //   onCategoryCreated,
  className = "",
  refreshTrigger,
  entityType = "product",
}: MultiCategorySelectorProps) {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isFocused, setIsFocused] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside both the button AND the portal dropdown
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        portalRef.current &&
        !portalRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update dropdown position on scroll/resize
  useEffect(() => {
    const updatePosition = () => {
      if (dropdownRef.current) {
        const rect = dropdownRef.current.querySelector("button")?.getBoundingClientRect();
        if (rect) {
          setDropdownPosition({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
          });
        }
      }
    };

    if (isOpen) {
      // Calculate position immediately and also after a frame to ensure portal is rendered
      updatePosition();
      requestAnimationFrame(() => {
        updatePosition();
      });
      window.addEventListener("scroll", updatePosition);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load categories based on entity type - only show active ones
      let categoriesData: ProductCategory[] = [];

      if (entityType === "campaign") {
        const { campaignService } = await import(
          "../../features/campaigns/services/campaignService"
        );
        // Use active campaign categories
        const response = await campaignService.getActiveCampaignCategories({
          limit: 100,
          skipCache: true,
        });
        categoriesData = Array.isArray(response)
          ? response
          : (response as { data: ProductCategory[] }).data || [];
      } else if (entityType === "offer") {
        const { offerCategoryService } = await import(
          "../../features/offers/services/offerCategoryService"
        );
        // Use active offer categories
        const response = await offerCategoryService.getActiveCategories({
          limit: 100,
          skipCache: true,
        });
        categoriesData = response.data || [];
      } else if (entityType === "segment") {
        const { segmentService } = await import(
          "../../features/segments/services/segmentService"
        );
        const response = await segmentService.getSegmentCategories();
        // Filter to only active segment categories and convert to ProductCategory format
        categoriesData = (response.data || [])
          .filter(
            (cat: { id: number; name: string; is_active?: boolean }) =>
              cat.is_active !== false // Only include active categories (default to true if not specified)
          )
          .map(
            (cat: {
              id: number;
              name: string;
              description?: string | null;
              is_active?: boolean;
            }) => ({
              id: cat.id,
              name: cat.name,
              description: cat.description || "",
              is_active: cat.is_active !== false,
              created_at: "",
              updated_at: "",
            })
          );
      } else {
        // Default to product categories - only show active ones
        const response = await productCategoryService.getActiveCategories({
          limit: 100,
          skipCache: true,
        });
        categoriesData = response.data || [];
      }

      setCategories(categoriesData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load categories"
      );
      console.error("Failed to load categories:", err);
    } finally {
      setIsLoading(false);
    }
  }, [entityType]);

  useEffect(() => {
    loadCategories();
  }, [refreshTrigger, loadCategories]);

  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description &&
        category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedCategories = categories.filter((cat) => {
    const match = value.includes(cat.id) || value.some(v => String(v) === String(cat.id));
    return match;
  });


  const handleToggle = (categoryId: number | string) => {
    const isIncluded = value.includes(categoryId) || value.some(v => String(v) === String(categoryId));
    const newValue = isIncluded
      ? value.filter((id) => String(id) !== String(categoryId))
      : [...value, categoryId];
    onChange(newValue);
  };

  const handleRemove = (categoryId: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((id) => String(id) !== String(categoryId)));
  };

  const handleCreateNew = () => {
    if (onCreateCategory) {
      onCreateCategory();
    }
    setIsOpen(false);
    setSearchTerm("");
  };

  //   const getDisplayText = () => {
  //     if (selectedCategories.length === 0) {
  //       return placeholder;
  //     }
  //     if (selectedCategories.length === 1) {
  //       return selectedCategories[0].name;
  //     }
  //     return `${selectedCategories.length} catalogs selected`;
  //   };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="flex">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`flex-1 px-4 py-2 text-left border ${tw.rounded} text-sm transition-all ${
            disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"
          } ${
            isFocused
              ? "border-blue-500 ring-2 ring-blue-500/20"
              : "border-gray-300"
          }`}
          style={{
            outline: "none",
            borderTopRightRadius: allowCreate ? "0" : undefined,
            borderBottomRightRadius: allowCreate ? "0" : undefined,
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex-1 min-w-0">
              {selectedCategories.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedCategories.slice(0, 2).map((cat) => (
                    <span
                      key={cat.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 border text-xs font-medium rounded-full"
                      style={{
                        borderColor: color.primary.accent,
                        color: color.primary.accent,
                      }}
                    >
                      {cat.name}
                      <span
                        onClick={(e) => handleRemove(cat.id, e)}
                        className="hover:opacity-70 rounded-full p-0.5 cursor-pointer transition-opacity"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleRemove(
                              cat.id,
                              e as React.KeyboardEvent<HTMLSpanElement>
                            );
                          }
                        }}
                        aria-label={`Remove ${cat.name}`}
                      >
                        <X className="w-3 h-3" />
                      </span>
                    </span>
                  ))}
                  {selectedCategories.length > 2 && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                      +{selectedCategories.length - 2} more
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-sm text-gray-500">{placeholder}</span>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {/* Add Category Button */}
        {allowCreate && (
          <button
            type="button"
            onClick={onCreateCategory ? onCreateCategory : handleCreateNew}
            className="px-3 py-2 text-white rounded-r-md flex items-center justify-center text-sm border-l-0"
            style={{
              backgroundColor: color.primary.action,
              borderColor: color.primary.action,
            }}
            title="Create new catalog"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && createPortal(
        <div
          ref={portalRef}
          style={{
            position: "fixed",
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            zIndex: 9999,
          }}
          className={`bg-white border border-gray-300 ${tw.rounded} shadow-lg max-h-60 overflow-hidden`}
        >
          <div className="p-2">
            <SearchInput
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(value) => setSearchTerm(value)}
            />
          </div>

          <div className="max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                Loading...
              </div>
            ) : error ? (
              <div className="px-4 py-3 text-sm text-red-500 text-center">
                {error}
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                {searchTerm ? "No categories found" : "No categories available"}
              </div>
            ) : (
              <>
                {filteredCategories.map((category) => {
                  const isSelected = value.includes(category.id) || value.some(v => String(v) === String(category.id));
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleToggle(category.id)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                        isSelected
                          ? "bg-gray-50 text-gray-900"
                          : "text-gray-900"
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className={`w-4 h-4 border-2 rounded flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? "border-black bg-black"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{category.name}</div>
                          {category.description && (
                            <div className="text-xs text-gray-500 mt-0.5 truncate">
                              {category.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Create New Category Option */}
                {allowCreate && (
                  <div className="border-t border-gray-200">
                    <button
                      type="button"
                      onClick={
                        onCreateCategory ? onCreateCategory : handleCreateNew
                      }
                      className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create new catalog
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
