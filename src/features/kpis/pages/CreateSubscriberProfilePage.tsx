import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { sql as sqlLanguage } from "@codemirror/lang-sql";
import BackButton from "../../../shared/components/ui/BackButton";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { color, tw, button, getButtonStyles } from "../../../shared/utils/utils";
import Checkbox from "../../../shared/components/ui/Checkbox";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import MultiCategorySelector from "../../../shared/components/MultiCategorySelector";
import { OPERATORS as OPERATORS_MAP, getOperatorsForFieldType } from "../../../shared/utils/operatorMapper";
import { kpiCategoryService } from "../services/kpiCategoryService";
import { notificationTypeService } from "../../../shared/services/notificationTypeService";

const DATA_SOURCE_OPTIONS = [
  { label: "DB", value: "DB" },
  { label: "Live", value: "Live" },
  { label: "DB & Live", value: "DB & Live" },
];

const FREQUENCY_OPTIONS = [
  { label: "Per Min", value: "Per Min" },
  { label: "D-1", value: "D-1" },
  { label: "Monthly", value: "Monthly" },
];

const FIELD_TYPE_OPTIONS = [
  { label: "Text", value: "text" },
  { label: "Numeric", value: "numeric" },
  { label: "Decimal", value: "decimal" },
  { label: "Boolean", value: "boolean" },
];

const VALIDATION_STRATEGY_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Range", value: "range" },
  { label: "Discrete", value: "discrete" },
  { label: "Pattern", value: "pattern" },
];

const getOperatorData = (fieldType: string) => {
  const filteredOperators = getOperatorsForFieldType(fieldType);
  return filteredOperators.map((op) => ({
    id: op.id,
    name: op.label,
    is_active: true,
    created_at: "",
    updated_at: "",
  }));
};

export default function CreateSubscriberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const mode = id ? "edit" : "create";
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTables, setLoadingTables] = useState(true);
  const [categoryOptions, setCategoryOptions] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    field_value: "",
    description: "",
    field_type: "text" as "text" | "numeric" | "decimal" | "boolean",
    category: "" as string | number,
    operators: [] as number[],
    source_table: "",
    data_source: "DB" as "DB" | "Live" | "DB & Live",
    frequency: "D-1" as "Per Min" | "D-1" | "Monthly",
    default_value: "",
    validation_strategy: "none" as "none" | "range" | "discrete" | "pattern",
    range_min: "",
    range_max: "",
    discrete_values: "",
    extractionLogic: "",
    use_as_dynamic_variable: false,
    tag: "kpi",
    display_order: 0,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadCategories();
    loadTables();
  }, []);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const categories = await kpiCategoryService.getKpiCategories();
      // Filter for Customer 360 KPIs (parent_category_id = 60) and the parent itself
      const subscriberCategories = categories.filter(
        (cat: any) => cat.id === 60 || cat.parent_category_id === 60
      );
      setCategoryOptions(
        subscriberCategories.map((cat: any) => ({ label: cat.name, value: cat.id?.toString() || "" }))
      );
    } catch (err) {
      console.error("Failed to load categories:", err);
      setCategoryOptions([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadTables = async () => {
    try {
      setLoadingTables(true);
      const data = await notificationTypeService.getTables();
      const tableList = Array.isArray(data) ? data : [];
      setTables(
        tableList.map((table: any, index: number) => {
          const tableName = typeof table === "string" ? table : table.table_name || table.name || `Table ${index}`;
          return {
            id: index,
            label: tableName,
            value: tableName,
          };
        })
      );
    } catch (err) {
      console.error("Failed to load tables:", err);
      setTables([]);
    } finally {
      setLoadingTables(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Profile field name is required";
    }
    if (!formData.source_table.trim()) {
      newErrors.source_table = "Source table is required";
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

      const payload: any = {
        name: formData.name,
        description: formData.description,
        field_type: formData.field_type,
        category: formData.category,
        default_operator_id: formData.operators.length > 0 ? formData.operators[0] : null,
        source_table: formData.source_table,
        data_source: formData.data_source,
        frequency: formData.frequency,
        default_value: formData.default_value || undefined,
      };

      // TODO: Implement API call for subscriber profile creation/update
      // if (mode === "edit" && id) {
      //   await subscriberProfileService.updateProfile(Number(id), payload);
      // } else {
      //   await subscriberProfileService.createProfile(payload);
      // }

      success("Success", mode === "edit" ? "Profile updated successfully" : "Profile created successfully");
      navigate("/dashboard/kpis/subscriber-profiles");
    } catch (err) {
      showError("Error", "Failed to save profile. Please try again.");
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
      <BackButton showBreadcrumb={true} currentLabel={mode === "create" ? "Create Subscriber Profile" : "Edit Subscriber Profile"} />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Section <span className="text-red-500">*</span>/}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Basic Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g., Account Type"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  hasError={!!errors.name}
                 
                  disabled={saving}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field Value (Slug) <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g., p_account_type"
                  value={formData.field_value}
                  onChange={handleInputChange('field_value')}
                 
                  disabled={saving}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              {loadingCategories ? (
                <div className="p-2 text-sm text-gray-500">Loading categories...</div>
              ) : (
                <HeadlessSelect
                  options={categoryOptions}
                  value={formData.category ? formData.category.toString() : ""}
                  onChange={(value) => handleSelectChange("category", value)}
                  disabled={saving || loadingCategories}
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field Type <span className="text-red-500">*</span>
                </label>
                <HeadlessSelect
                  options={FIELD_TYPE_OPTIONS}
                  value={formData.field_type}
                  onChange={(value) => handleSelectChange("field_type", value)}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Value <span className="text-red-500">*</span>
                </label>
                <Input
                  type={formData.field_type === "numeric" || formData.field_type === "decimal" ? "number" : "text"}
                  placeholder={formData.field_type === "decimal" ? "e.g., 100.50" : formData.field_type === "numeric" ? "e.g., 100" : "e.g., Value"}
                  value={formData.default_value}
                  onChange={handleInputChange('default_value')}
                  hasError={!!errors.default_value}
                 
                  disabled={saving}
                  step={formData.field_type === "decimal" ? "0.01" : undefined}
                />
                {errors.default_value && <p className="text-red-500 text-xs mt-1">{errors.default_value}</p>}
              </div>
            </div>

            <div>
              <Textarea
                label="Description"
                value={formData.description}
                onChange={(value) => handleTextareaChange({ target: { name: "description", value } } as any)}
                placeholder="Describe this profile field..."
                rows={3}
                hasError={!!errors.description}
                disabled={saving}
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Order
              </label>
              <Input
                type="number"
                placeholder="e.g., 0"
                value={formData.display_order}
                onChange={handleInputChange('display_order')}
               
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operators
              </label>
              <MultiCategorySelector
                value={formData.operators}
                onChange={(operatorIds) => setFormData((prev) => ({ ...prev, operators: operatorIds }))}
                data={getOperatorData(formData.field_type)}
                placeholder="Select operators..."
                disabled={saving}
              />
              {errors.operators && <p className="text-red-500 text-xs mt-2">{errors.operators}</p>}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={formData.use_as_dynamic_variable}
                onChange={(e) => handleInputChange('use_as_dynamic_variable')(e.target.checked ? 1 : 0)}
                disabled={saving}
                style={{ accentColor: color.primary.accent }}
              />
              <span className="text-sm font-medium text-gray-700">
                Use as dynamic variable
              </span>
            </label>
          </div>
        </div>

        {/* Validation Configuration Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Validation Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Validation Strategy <span className="text-red-500">*</span>
              </label>
              <HeadlessSelect
                options={VALIDATION_STRATEGY_OPTIONS}
                value={formData.validation_strategy}
                onChange={(value) => handleSelectChange("validation_strategy", value)}
                disabled={saving}
              />
            </div>

            {formData.validation_strategy === "range" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Value <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g., 0"
                    value={formData.range_min}
                    onChange={handleInputChange('range_min')}
                    hasError={!!errors.range_min}
                   
                    disabled={saving}
                  />
                  {errors.range_min && <p className="text-red-500 text-xs mt-1">{errors.range_min}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Value <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g., 100"
                    value={formData.range_max}
                    onChange={handleInputChange('range_max')}
                    hasError={!!errors.range_max}
                   
                    disabled={saving}
                  />
                  {errors.range_max && <p className="text-red-500 text-xs mt-1">{errors.range_max}</p>}
                </div>
              </div>
            )}

            {formData.validation_strategy === "discrete" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allowed Values <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g., active, inactive, pending (comma-separated)"
                  value={formData.discrete_values}
                  onChange={handleInputChange('discrete_values')}
                  hasError={!!errors.discrete_values}
                 
                  disabled={saving}
                />
                {errors.discrete_values && <p className="text-red-500 text-xs mt-1">{errors.discrete_values}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Data Source Configuration Section <span className="text-red-500">*</span>/}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Data Source Configuration</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Source <span className="text-red-500">*</span>
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
                  Frequency <span className="text-red-500">*</span>
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
                Source Table <span className="text-red-500">*</span>
              </label>
              {loadingTables ? (
                <div className="p-2 text-sm text-gray-500">Loading tables...</div>
              ) : (
                <HeadlessSelect
                  options={tables}
                  value={formData.source_table}
                  onChange={(value) => handleSelectChange("source_table", value)}
                  placeholder="Select a table"
                  disabled={saving || loadingTables}
                  searchable={true}
                />
              )}
              {errors.source_table && <p className="text-red-500 text-xs mt-1">{errors.source_table}</p>}
            </div>
          </div>
        </div>

        {/* Extraction Logic Section <span className="text-red-500">*</span>/}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Extraction Logic</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logic Definition <span className="text-red-500">*</span>
            </label>
            <div
              className={`border ${tw.rounded} overflow-hidden`}
              style={{
                borderColor: errors.extractionLogic ? "#ef4444" : tw.borderDefault,
                minHeight: "200px",
              }}
            >
              <CodeMirror
                value={formData.extractionLogic}
                height="200px"
                extensions={[sqlLanguage()]}
                onChange={(value) => handleTextareaChange({ target: { name: "extractionLogic", value } } as any)}
                theme="light"
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLineGutter: true,
                  foldGutter: true,
                  dropCursor: true,
                  indentOnInput: true,
                  bracketMatching: true,
                  closeBrackets: true,
                  autocompletion: true,
                  searchKeymap: true,
                }}
                className="codemirror-editor"
                placeholder="e.g., account_type (reference a field from your table)"
              />
            </div>
            {errors.extractionLogic && <p className="text-red-500 text-xs mt-2">{errors.extractionLogic}</p>}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard/kpis/subscriber-profiles")}
            disabled={saving}
            className="transition-colors disabled:opacity-60"
            style={getButtonStyles(button.bordered)}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 text-sm font-medium text-white rounded-md disabled:opacity-60"
            style={{ backgroundColor: color.primary.action }}
          >
            {saving ? (mode === "edit" ? "Updating..." : "Creating...") : (mode === "edit" ? "Update" : "Create")}
          </button>
        </div>
      </form>
    </div>
  );
}
