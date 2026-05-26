import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import Input from "../../../shared/components/ui/Input";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { color, tw } from "../../../shared/utils/utils";
import Checkbox from "../../../shared/components/ui/Checkbox";

const KPI_TYPE_OPTIONS = [
  { label: "Subscriber Profile", value: "subscriber" },
  { label: "Revenue Metric", value: "revenue" },
  { label: "Usage Metric", value: "usage" },
  { label: "System Event", value: "system" },
];

const FIELD_TYPE_OPTIONS = [
  { label: "Number", value: "number" },
  { label: "Decimal", value: "decimal" },
  { label: "Text", value: "text" },
  { label: "Money", value: "money" },
];

const DATA_SOURCE_OPTIONS = [
  { label: "Live", value: "Live" },
  { label: "DB", value: "DB" },
];

const FREQUENCY_OPTIONS = [
  { label: "Per Min", value: "Per Min" },
  { label: "D-1", value: "D-1" },
  { label: "Monthly", value: "Monthly" },
];

const CALCULATION_TYPE_OPTIONS = [
  { label: "Value Set", value: "value_set" },
  { label: "Computed", value: "computed" },
  { label: "Static", value: "static" },
];

const OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "greater_than", label: "Greater Than" },
  { value: "less_than", label: "Less Than" },
  { value: "in", label: "In" },
  { value: "not_in", label: "Not In" },
];

export default function CreateKPIPage() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    kpiType: "subscriber" as "subscriber" | "revenue" | "usage" | "system",
    name: "",
    description: "",
    field_type: "number" as "number" | "decimal" | "text" | "money",
    calculationType: "value_set" as "value_set" | "computed" | "static",
    data_source: "Live" as "Live" | "DB",
    source_table: "",
    frequency: "Per Min" as "Per Min" | "D-1" | "Monthly",
    unit: "",
    operators: [] as string[],
    extractionLogic: "",
    default_value: "" as string | number,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "KPI name is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!formData.source_table.trim()) {
      newErrors.source_table = "Source table is required";
    }
    if (formData.operators.length === 0) {
      newErrors.operators = "At least one operator must be selected";
    }
    if (!formData.extractionLogic.trim()) {
      newErrors.extractionLogic = "Extraction logic is required";
    }
    if (formData.default_value === "" || formData.default_value === null) {
      newErrors.default_value = "Default value is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showError("Validation Error", "Please fill in all required fields");
      return;
    }

    try {
      setSaving(true);

      success("Success", `${formData.kpiType} KPI created successfully`);
      navigate("/dashboard/kpis");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create KPI";
      showError("Error", extractBackendError(error, "Error. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (fieldName: keyof typeof formData) => (value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (name: string, value: string | undefined) => {
    if (!value) return;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleOperatorChange = (operator: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      operators: checked
        ? [...prev.operators, operator]
        : prev.operators.filter((o) => o !== operator),
    }));

    if (errors.operators) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.operators;
        return newErrors;
      });
    }
  };

  return (
    <div className="space-y-6">
      <BackButton fallbackTo="/dashboard/kpis" showBreadcrumb={true} currentLabel="Create KPI" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Basic Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  KPI Type *
                </label>
                <HeadlessSelect
                  options={KPI_TYPE_OPTIONS}
                  value={formData.kpiType}
                  onChange={(value) => handleSelectChange("kpiType", value)}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field Type *
                </label>
                <HeadlessSelect
                  options={FIELD_TYPE_OPTIONS}
                  value={formData.field_type}
                  onChange={(value) => handleSelectChange("field_type", value)}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  KPI Name *
                </label>
                <Input
                  placeholder="e.g., Data 2G Revenue"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  hasError={!!errors.name}
                  variant="medium"
                  disabled={saving}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Value *
                </label>
                <Input
                  type={formData.field_type === "text" ? "text" : "number"}
                  placeholder={
                    formData.field_type === "text" ? "e.g., Default text" :
                    formData.field_type === "decimal" ? "e.g., 100.50" :
                    formData.field_type === "money" ? "e.g., 1000.00" :
                    "e.g., 100"
                  }
                  value={formData.default_value}
                  onChange={handleInputChange('default_value')}
                  hasError={!!errors.default_value}
                  variant="medium"
                  disabled={saving}
                  step={formData.field_type === "decimal" || formData.field_type === "money" ? "0.01" : undefined}
                />
                {errors.default_value && <p className="text-red-500 text-xs mt-1">{errors.default_value}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleTextareaChange}
                placeholder="Describe this KPI..."
                rows={3}
                className={`w-full px-3 py-2 text-sm border ${tw.rounded} focus:outline-none ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
                disabled={saving}
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>
          </div>
        </div>

        {/* Data Source Configuration Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Data Source Configuration</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Source *
                </label>
                <HeadlessSelect
                  options={DATA_SOURCE_OPTIONS}
                  value={formData.data_source}
                  onChange={(value) => handleSelectChange("data_source", value)}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency *
                </label>
                <HeadlessSelect
                  options={FREQUENCY_OPTIONS}
                  value={formData.frequency}
                  onChange={(value) => handleSelectChange("frequency", value)}
                  disabled={saving}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Table *
              </label>
              <Input
                placeholder="e.g., OCS_DATA"
                value={formData.source_table}
                onChange={handleInputChange('source_table')}
                hasError={!!errors.source_table}
                variant="medium"
                disabled={saving}
              />
              {errors.source_table && <p className="text-red-500 text-xs mt-1">{errors.source_table}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit (optional)
              </label>
              <Input
                value={formData.unit}
                onChange={handleInputChange('unit')}
                placeholder="e.g., Million PKR, MB"
                variant="medium"
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {/* Operators Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Operators</h2>
          <p className="text-sm text-gray-600 mb-4">Select all operators that apply to this KPI</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {OPERATORS.map((op) => (
              <div
                key={op.value}
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => handleOperatorChange(op.value, !formData.operators.includes(op.value))}
              >
                <Checkbox
                  id={`operator-${op.value}`}
                  checked={formData.operators.includes(op.value)}
                  onChange={() => handleOperatorChange(op.value, !formData.operators.includes(op.value))}
                  disabled={saving}
                  style={{ accentColor: color.primary.accent }}
                />
                <span className="text-sm text-gray-700">{op.label}</span>
              </div>
            ))}
          </div>
          {errors.operators && <p className="text-red-500 text-xs mt-3">{errors.operators}</p>}
        </div>

        {/* Calculation Type Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Calculation Type</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How is this KPI calculated? *
            </label>
            <HeadlessSelect
              options={CALCULATION_TYPE_OPTIONS}
              value={formData.calculationType}
              onChange={(value) => handleSelectChange("calculationType", value)}
              disabled={saving}
            />
            <p className="text-xs text-gray-500 mt-2">
              {formData.calculationType === "value_set" && "Reference a field directly from your data source"}
              {formData.calculationType === "computed" && "Define a formula to compute the value (e.g., current - previous)"}
              {formData.calculationType === "static" && "Set a fixed value that never changes"}
            </p>
          </div>
        </div>

        {/* Extraction Logic Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Extraction Logic</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logic Definition *
            </label>
            <textarea
              name="extractionLogic"
              value={formData.extractionLogic}
              onChange={handleTextareaChange}
              placeholder={
                formData.calculationType === "value_set"
                  ? "e.g., field_name (reference the field from your table)"
                  : formData.calculationType === "computed"
                  ? "e.g., current_revenue - previous_revenue (define your calculation)"
                  : "e.g., 100 (enter the static value)"
              }
              rows={4}
              className={`w-full px-3 py-2 text-sm border ${tw.rounded} focus:outline-none font-mono ${
                errors.extractionLogic ? "border-red-500" : "border-gray-300"
              }`}
              disabled={saving}
            />
            {errors.extractionLogic && <p className="text-red-500 text-xs mt-1">{errors.extractionLogic}</p>}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white rounded-md disabled:opacity-60"
            style={{ backgroundColor: color.primary.action }}
          >
            <Save className="w-4 h-4" />
            {saving ? "Creating..." : "Create KPI"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/dashboard/kpis")}
            disabled={saving}
            className="px-6 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
