import { createPortal } from "react-dom";
import { Check, X, Search } from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { color, tw, zIndex } from "../../../shared/utils/utils";

export interface UnifiedPickerItem<T = unknown> {
  id: string | number;
  title: string;
  description?: string;
  meta?: string;
  raw: T;
}

interface UnifiedPickerModalProps<T = unknown> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  searchPlaceholder: string;
  items: UnifiedPickerItem<T>[];
  onSelect: (item: UnifiedPickerItem<T>) => void;
  selectedId?: string | number;
  loading?: boolean;
  loadingText?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  filterOptions?: Array<{ value: string; label: string }>;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  headerAction?: React.ReactNode;
}

export default function UnifiedPickerModal<T = unknown>({
  isOpen,
  onClose,
  title,
  subtitle,
  searchTerm,
  onSearchTermChange,
  searchPlaceholder,
  items,
  onSelect,
  selectedId,
  loading = false,
  loadingText = "Loading...",
  emptyTitle = "No items found",
  emptyDescription = "Try adjusting your search or filters",
  filterOptions,
  filterValue,
  onFilterChange,
  headerAction,
}: UnifiedPickerModalProps<T>) {
  if (!isOpen) return null;

  const hasFilter =
    Array.isArray(filterOptions) &&
    filterOptions.length > 0 &&
    typeof filterValue === "string" &&
    typeof onFilterChange === "function";

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: zIndex.modal }}
      onClick={onClose}
    >
      <div
        className={`bg-white ${tw.rounded} shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className={`text-lg font-semibold ${tw.textPrimary}`}>
              {title}
            </h2>
            <p className={`text-sm ${tw.textSecondary} mt-1`}>{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {headerAction}
            <button
              onClick={onClose}
              className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="px-6 py-3 space-y-3">
          <div className="flex gap-3">
            <SearchInput
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={onSearchTermChange}
            />

            {hasFilter && (
              <div className="min-w-[180px]">
                <HeadlessSelect
                  options={filterOptions}
                  value={filterValue}
                  onChange={(value) => onFilterChange(value as string)}
                  placeholder="Filter by..."
                  className="text-sm"
                  zIndex={zIndex.popover}
                />
              </div>
            )}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4">
          {loading ? (
            <div className="text-center py-8">
              <p className={tw.textSecondary}>{loadingText}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <p className={`text-sm font-medium ${tw.textPrimary}`}>
                {emptyTitle}
              </p>
              <p className={`text-sm ${tw.textSecondary} mt-1`}>
                {emptyDescription}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const isSelected =
                  selectedId !== undefined && item.id === selectedId;

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item)}
                    className={`w-full p-3 ${tw.rounded} border transition-all text-left hover:border-gray-400`}
                    style={{
                      backgroundColor: color.surface.background,
                      borderColor: isSelected
                        ? color.primary.accent
                        : color.border.default,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className={`text-sm font-medium ${tw.textPrimary}`}>
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className={`text-xs ${tw.textSecondary} mt-1.5`}>
                            {item.description}
                          </p>
                        )}
                        {item.meta && (
                          <p className={`text-xs ${tw.textSecondary} mt-1`}>
                            {item.meta}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: color.primary.action }}
                        >
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm ${tw.rounded} border font-medium transition-all`}
            style={{
              borderColor: color.border.default,
              color: color.text.primary,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
