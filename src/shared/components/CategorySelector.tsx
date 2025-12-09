import { useState, useEffect, useRef } from "react";
import { ChevronDown, Search, Plus } from "lucide-react";
import { ProductCategory } from "../../features/products/types/productCategory";
import { productCategoryService } from "../../features/products/services/productCategoryService";
import { color } from "../utils/utils";

interface CategorySelectorProps {
  value?: number;
  onChange: (categoryId: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  allowCreate?: boolean;
  onCreateCategory?: () => void;
  onCategoryCreated?: (categoryId: number) => void;
  className?: string;
  refreshTrigger?: number;
}

export default function CategorySelector({
  value,
  onChange,
  placeholder = "Select Catalog",
  disabled = false,
  allowCreate = false,
  onCreateCategory,
  onCategoryCreated,
  className = "",
  refreshTrigger,
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCategories();
  }, [refreshTrigger]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Only show active product categories
      const response = await productCategoryService.getActiveCategories({
        limit: 100,
        skipCache: true,
      });
      setCategories(response.data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load categories"
      );
      console.error("Failed to load categories:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description &&
        category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedCategory = categories.find((cat) => cat.id === value);

  const handleSelect = (categoryId: number | undefined) => {
    onChange(categoryId);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleCreateNew = () => {
    if (onCreateCategory) {
      onCreateCategory();
    }
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="flex">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`flex-1 px-4 py-2.5 text-left border rounded-md text-sm transition-all ${
            disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"
          }`}
          style={{
            borderColor: color.border.default,
            outline: "none",
            borderTopRightRadius: allowCreate ? "0" : undefined,
            borderBottomRightRadius: allowCreate ? "0" : undefined,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = color.primary.accent;
            e.target.style.boxShadow = `0 0 0 3px ${color.primary.accent}20`;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = color.border.default;
            e.target.style.boxShadow = "none";
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className={selectedCategory ? "text-gray-900" : "text-gray-500"}
            >
              {selectedCategory ? selectedCategory.name : placeholder}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${
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
            className="px-3 py-2.5 text-white rounded-r-md flex items-center justify-center text-sm border-l-0"
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

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
                {filteredCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleSelect(category.id)}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-[${
                      color.primary.accent
                    }]/10 flex items-center justify-between ${
                      value === category.id
                        ? `bg-[${color.primary.accent}]/10 text-[${color.primary.accent}]`
                        : "text-gray-900"
                    }`}
                  >
                    <div>
                      <div className="font-medium">{category.name}</div>
                      {category.description && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {category.description}
                        </div>
                      )}
                    </div>
                    {category.productCount !== undefined && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {category.productCount}
                      </span>
                    )}
                  </button>
                ))}

                {/* Create New Category Option */}
                {allowCreate && (
                  <div className="border-t border-gray-200">
                    <button
                      onClick={
                        onCreateCategory ? onCreateCategory : handleCreateNew
                      }
                      className="w-full px-4 py-2 text-left text-sm text-[${color.primary.accent}] hover:bg-[${color.primary.accent}]/10 flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create new catalog
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
