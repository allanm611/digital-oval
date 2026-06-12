import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { sql as sqlLanguage } from "@codemirror/lang-sql";
import BackButton from "../../../shared/components/ui/BackButton";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { RevenueMetric, RevenueMetricOperator } from "../types/revenueMetrics";
import { revenueMetricService } from "../services/revenueMetricService";
import { kpiCategoryService } from "../services/kpiCategoryService";
import { notificationTypeService } from "../../../shared/services/notificationTypeService";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { color, tw, button, getButtonStyles } from "../../../shared/utils/utils";
import Checkbox from "../../../shared/components/ui/Checkbox";
import MultiCategorySelector from "../../../shared/components/MultiCategorySelector";
import { OPERATORS as OPERATORS_MAP, getOperatorsForFieldType } from "../../../shared/utils/operatorMapper";

const FIELD_TYPE_OPTIONS = [
  { label: "Numeric", value: "numeric" },
  { label: "Decimal", value: "decimal" },
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

interface RevenueMetricFormPageProps {
  mode: "create" | "edit";
}

export default function RevenueMetricFormPage({ mode }: RevenueMetricFormPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTables, setLoadingTables] = useState(true);
  const [metric, setMetric] = useState<RevenueMetric | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    field_value: "",
    description: "",
    field_type: "numeric" as "numeric" | "decimal",
    category: "" as string | number,
    operators: [] as number[],
    source_table: "",
    data_source: "Live" as "Live" | "DB",
    frequency: "Per Min" as "Per Min" | "D-1" | "Monthly",
    unit: "",
    default_value: "" as string | number,
    validation_strategy: "none" as "none" | "range" | "discrete" | "pattern",
    range_min: "",
    range_max: "",
    discrete_values: "",
    extractionLogic: "",
    use_as_dynamic_variable: false,
    tag: "revenue_metric",
    display_order: 0,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadCategories();
    if (mode === "edit" && id) {
      loadTablesAndMetric();
    } else {
      loadTables();
    }
  }, [mode, id]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const categories = await kpiCategoryService.getKpiCategories();
      // Filter for Revenue KPIs (parent_category_id = 54) and the parent itself
      const revenueCategories = categories.filter(
        (cat: any) => cat.id === 54 || cat.parent_category_id === 54
      );
      setCategoryOptions(
        revenueCategories.map((cat: any) => ({ label: cat.name, value: cat.id?.toString() || "" }))
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

  const loadTablesAndMetric = async () => {
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
      // Now load the metric after tables are ready
      if (id) {
        await loadMetric();
      }
    } catch (err) {
      console.error("Failed to load tables:", err);
      setTables([]);
    } finally {
      setLoadingTables(false);
    }
  };

  const loadMetric = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await revenueMetricService.getMetricById(Number(id));
      if (data) {
        setMetric(data);
        setFormData({
          name: data.name,
          field_value: data.field_value || "",
          description: data.description,
          field_type: data.field_type,
          category: data.category,
          operators: [...data.operators],
          source_table: data.source_table,
          data_source: data.data_source,
          frequency: data.frequency,
          unit: data.unit || "",
          default_value: data.default_value || "",
          validation_strategy: "none",
          range_min: "",
          range_max: "",
          discrete_values: "",
          extractionLogic: "",
          use_as_dynamic_variable: false,
        });
      }
    } catch (err) {
      showError("Error", extractBackendError(err as any, "Error. Please try again."));
      navigate("/dashboard/kpis/revenue-metrics");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Metric name is required";
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
        unit: formData.unit || undefined,
        default_value: formData.default_value || undefined,
      };

      // Only include field_value for creation
      if (mode === "create") {
        payload.field_value = formData.field_value;
      }

      if (mode === "edit" && id) {
        await revenueMetricService.updateMetric(Number(id), payload);
        success("Success", "Revenue metric updated successfully");
      } else {
        await revenueMetricService.createMetric(payload);
        success("Success", "Revenue metric created successfully");
      }

      navigate("/dashboard/kpis/revenue-metrics");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save metric";
      showError("Error", extractBackendError(err as any, "Error. Please try again."));
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

  const handleOperatorChange = (operator: RevenueMetricOperator, checked: boolean) => {
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className={`${tw.textMuted} font-medium mt-4`}>Loading revenue metric...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton showBreadcrumb={true} currentLabel={mode === "create" ? "Create Revenue Metric" : "Edit Revenue Metric"} />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Section * */}
        <div className={`${tw.rounded} bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Basic Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Name"
                  placeholder="e.g., Data 2G Revenue"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  hasError={!!errors.name}
                 
                  disabled={saving}
                  required
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <Input
                  label="Field Value (Slug)"
                  placeholder="e.g., p_data_2g_revenue"
                  value={formData.field_value}
                  onChange={handleInputChange('field_value')}
                 
                  disabled={saving}
                  required
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
                <Input
                  label="Default Value"
                  type={formData.field_type === "numeric" || formData.field_type === "decimal" ? "number" : "text"}
                  placeholder={formData.field_type === "decimal" ? "e.g., 100.50" : "e.g., 100"}
                  value={formData.default_value}
                  onChange={handleInputChange('default_value')}
                  hasError={!!errors.default_value}
                 
                  disabled={saving}
                  step={formData.field_type === "decimal" ? "0.01" : undefined}
                  required
                />
                {errors.default_value && <p className="text-red-500 text-xs mt-1">{errors.default_value}</p>}
              </div>
            </div>

            <div>
              <Textarea
                label="Description"
                value={formData.description}
                onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
                placeholder="Describe this metric..."
                rows={3}
                hasError={!!errors.description}
                disabled={saving}
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            <div>
              <Input
                label="Display Order"
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
        <div className={`${tw.rounded} bg-white p-6 shadow-sm`}>
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

        {/* Data Source Configuration Section * */}
        <div className={`${tw.rounded} bg-white p-6 shadow-sm`}>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit (optional)
              </label>
              <Input
                type="text"
                placeholder="e.g., Million PKR, MB"
                value={formData.unit}
                onChange={handleInputChange('unit')}
               
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {/* Extraction Logic Section * */}
        <div className={`${tw.rounded} bg-white p-6 shadow-sm`}>
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
                placeholder="e.g., revenue_field (reference a field from your table)"
              />
            </div>
            {errors.extractionLogic && <p className="text-red-500 text-xs mt-2">{errors.extractionLogic}</p>}
          </div>
        </div>


        {/* Submit Button * */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard/kpis/revenue-metrics")}
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
