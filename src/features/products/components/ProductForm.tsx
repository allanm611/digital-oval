import { Save, HelpCircle } from "lucide-react";
import {
  CreateProductRequest,
  UpdateProductRequest,
  ProductScope,
  ProductUnit,
} from "../types/product";
import MultiCategorySelector from "../../../shared/components/MultiCategorySelector";
import CreateCategoryModal from "../../../shared/components/CreateCategoryModal";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { tw, color } from "../../../shared/utils/utils";

interface ProductFormProps {
  formData: CreateProductRequest | UpdateProductRequest;
  onInputChange: (
    field: keyof (CreateProductRequest | UpdateProductRequest),
    value: string | number | boolean | undefined
  ) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  selectedCategoryIds: number[];
  onCategoryIdsChange: (ids: number[]) => void;
  showCreateModal: boolean;
  onShowCreateModal: (show: boolean) => void;
  refreshTrigger: number;
  onCategoryCreated: (categoryId: number) => void;
  submitButtonText?: string;
  loadingText?: string;
  onCancel?: () => void;
}

export default function ProductForm({
  formData,
  onInputChange,
  onSubmit,
  isLoading,
  selectedCategoryIds,
  onCategoryIdsChange,
  showCreateModal,
  onShowCreateModal,
  refreshTrigger,
  onCategoryCreated,
  submitButtonText = "Save Product",
  loadingText = "Saving...",
  onCancel,
}: ProductFormProps) {
  const scopeOptions: { label: string; value: ProductScope }[] = [
    { label: "Segmented", value: "segment" },
    { label: "Open Market", value: "open_market" },
  ];

  const unitOptions: { label: string; value: ProductUnit }[] = [
    { label: "Data (MB)", value: "data_mb" },
    { label: "SMS Count", value: "sms_count" },
    { label: "Airtime", value: "airtime" },
    { label: "On-net Minutes", value: "onnet_minutes" },
    { label: "Off-net Minutes", value: "offnet_minutes" },
    { label: "All-net Minutes", value: "allnet_minutes" },
    { label: "Utility", value: "utility" },
    { label: "Points", value: "points" },
    { label: "Others", value: "other" },
  ];

  const currentUnitLabel =
    unitOptions.find((option) => option.value === formData.unit)?.label ||
    "Value";

  return (
    <>
      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Product Information Card */}
        <div
          className={`${tw.rounded} border p-6`}
          style={{
            borderColor: color.border.default,
            backgroundColor: color.surface.background,
          }}
        >
          <div className="space-y-5">
            {/* Product Code */}
            <div>
              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
              >
                Product Code{" "}
                <span style={{ color: color.status.danger }}>*</span>
              </label>
              <input
                type="text"
                required
                value={formData.product_code || ""}
                onChange={(e) => onInputChange("product_code", e.target.value)}
                className={`w-full px-4 py-2.5 border ${tw.rounded} text-sm transition-all`}
                style={{
                  borderColor: color.border.default,
                  outline: "none",
                }}
                placeholder="e.g., VOICE_BUNDLE_001"
                onFocus={(e) => {
                  e.target.style.borderColor = color.primary.accent;
                  e.target.style.boxShadow = `0 0 0 3px ${color.primary.accent}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = color.border.default;
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Product Name */}
            <div>
              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
              >
                Product Name{" "}
                <span style={{ color: color.status.danger }}>*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name || ""}
                onChange={(e) => onInputChange("name", e.target.value)}
                className={`w-full px-4 py-2.5 border ${tw.rounded} text-sm transition-all`}
                style={{
                  borderColor: color.border.default,
                  outline: "none",
                }}
                placeholder="e.g., Premium Voice Bundle"
                onFocus={(e) => {
                  e.target.style.borderColor = color.primary.accent;
                  e.target.style.boxShadow = `0 0 0 3px ${color.primary.accent}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = color.border.default;
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
              >
                Description
              </label>
              <textarea
                rows={4}
                value={formData.description || ""}
                onChange={(e) => onInputChange("description", e.target.value)}
                className={`w-full px-4 py-2.5 border ${tw.rounded} text-sm transition-all resize-none`}
                style={{
                  borderColor: color.border.default,
                  outline: "none",
                }}
                placeholder="Describe the product features and benefits..."
                onFocus={(e) => {
                  e.target.style.borderColor = color.primary.accent;
                  e.target.style.boxShadow = `0 0 0 3px ${color.primary.accent}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = color.border.default;
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Price & DA ID */}
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                >
                  Price <span style={{ color: color.status.danger }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.price || 0}
                  onChange={(e) =>
                    onInputChange("price", parseFloat(e.target.value) || 0)
                  }
                  className={`w-full px-4 py-2.5 border ${tw.rounded} text-sm transition-all`}
                  style={{
                    borderColor: color.border.default,
                    outline: "none",
                  }}
                  placeholder="0.00"
                  onFocus={(e) => {
                    e.target.style.borderColor = color.primary.accent;
                    e.target.style.boxShadow = `0 0 0 3px ${color.primary.accent}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = color.border.default;
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                >
                  DA ID <span style={{ color: color.status.danger }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.da_id || ""}
                  onChange={(e) => onInputChange("da_id", e.target.value)}
                  className={`w-full px-4 py-2.5 border ${tw.rounded} text-sm transition-all`}
                  style={{
                    borderColor: color.border.default,
                    outline: "none",
                  }}
                  placeholder="Enter DA ID"
                  onFocus={(e) => {
                    e.target.style.borderColor = color.primary.accent;
                    e.target.style.boxShadow = `0 0 0 3px ${color.primary.accent}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = color.border.default;
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
              >
                Catalog
              </label>
              <MultiCategorySelector
                value={selectedCategoryIds}
                onChange={onCategoryIdsChange}
                placeholder="Select catalog(s)"
                entityType="product"
                refreshTrigger={refreshTrigger}
                className="w-full"
                allowCreate={true}
                onCreateCategory={() => onShowCreateModal(true)}
                onCategoryCreated={onCategoryCreated}
              />
            </div>

            {/* Scope & Unit (Not sent to backend - for future use) */}
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2 flex items-center gap-2 group`}
                >
                  Scope
                  <HelpCircle
                    className="w-4 h-4 text-gray-400 cursor-help opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Scope determines product availability: Segmented = available only to specific customer segments, Open Market = available to all customers"
                  />
                </label>
                <HeadlessSelect
                  options={scopeOptions.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                  value={formData.scope || "segment"}
                  onChange={(value) =>
                    onInputChange("scope", value as ProductScope)
                  }
                  placeholder="Select scope"
                  className="w-full"
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2 flex items-center gap-2 group`}
                >
                  Unit
                  <HelpCircle
                    className="w-4 h-4 text-gray-400 cursor-help opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Unit defines the measurement type for this product (e.g., Data in MB, SMS count, Airtime, Minutes, etc.)"
                  />
                </label>
                <HeadlessSelect
                  options={unitOptions.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                  value={formData.unit || "data_mb"}
                  onChange={(value) =>
                    onInputChange("unit", value as ProductUnit)
                  }
                  placeholder="Select unit"
                  className="w-full"
                />
              </div>
            </div>

            {/* Value & Validity (Not sent to backend - for future use) */}
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                >
                  Value ({currentUnitLabel})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unit_value ?? ""}
                  onChange={(e) =>
                    onInputChange("unit_value", parseFloat(e.target.value) || 0)
                  }
                  className={`w-full px-4 py-2.5 border ${tw.rounded} text-sm transition-all`}
                  style={{ borderColor: color.border.default }}
                  placeholder="Enter unit value"
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2 flex items-center gap-2 group`}
                >
                  Validity (Hours)
                  <HelpCircle
                    className="w-4 h-4 text-gray-400 cursor-help opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Validity period specifies how long the product remains active after purchase (e.g., 24 hours = product expires 24 hours after activation). This should be set together with the Value field."
                  />
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formData.validity_hours ?? ""}
                  onChange={(e) =>
                    onInputChange(
                      "validity_hours",
                      e.target.value ? parseInt(e.target.value, 10) : undefined
                    )
                  }
                  className={`w-full px-4 py-2.5 border ${tw.rounded} text-sm transition-all`}
                  style={{ borderColor: color.border.default }}
                  placeholder="e.g., 72"
                  onFocus={(e) => {
                    e.target.style.borderColor = color.primary.accent;
                    e.target.style.boxShadow = `0 0 0 3px ${color.primary.accent}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = color.border.default;
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-8">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className={`px-6 py-2.5 ${tw.rounded} text-sm font-medium transition-colors`}
                style={{
                  borderWidth: "1px",
                  borderColor: color.border.default,
                  color: color.text.secondary,
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = color.surface.cards;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className={`px-6 py-2.5 ${tw.rounded} text-sm font-medium transition-colors flex items-center gap-2 text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{
                backgroundColor: color.primary.action,
              }}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {loadingText}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {submitButtonText}
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Create Catalog Modal */}
      <CreateCategoryModal
        isOpen={showCreateModal}
        onClose={() => onShowCreateModal(false)}
        onCategoryCreated={onCategoryCreated}
      />
    </>
  );
}
