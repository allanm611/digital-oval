import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { sql as sqlLanguage } from "@codemirror/lang-sql";
import BackButton from "../../../shared/components/ui/BackButton";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { color, tw, button, getButtonStyles } from "../../../shared/utils/utils";
import Checkbox from "../../../shared/components/ui/Checkbox";
import MultiCategorySelector from "../../../shared/components/MultiCategorySelector";
import { kpiService } from "../services/kpiService";
import { kpiCategoryService } from "../services/kpiCategoryService";
import { notificationTypeService } from "../../../shared/services/notificationTypeService";
import { OPERATORS as OPERATORS_MAP, getOperatorsForFieldType } from "../../../shared/utils/operatorMapper";

const FIELD_TYPE_OPTIONS = [
  { label: "Number", value: "number" },
  { label: "Numeric", value: "numeric" },
  { label: "Big Int", value: "bigint" },
  { label: "Decimal", value: "decimal" },
  { label: "Text", value: "text" },
  { label: "Money", value: "money" },
  { label: "Boolean", value: "boolean" },
];

const DATA_SOURCE_OPTIONS = [
  { label: "Live", value: "Live" },
  { label: "DB", value: "DB" },
];


const CALCULATION_TYPE_OPTIONS = [
  { label: "Value Set", value: "value_set" },
  { label: "Computed", value: "computed" },
  { label: "Static", value: "static" },
];

const DATA_LATENCY_OPTIONS = [
  { label: "Real Time", value: "realtime" },
  { label: "Near Real Time", value: "nrt" },
  { label: "Hourly", value: "hourly" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Manual", value: "manual" },
  { label: "One Time", value: "onetime" },
  { label: "Batch", value: "batch" },
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

export default function CreateKPIPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const isEditMode = !!id;
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTables, setLoadingTables] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    field_value: "",
    description: "",
    field_type: "number" as any,
    calculationType: "value_set" as "value_set" | "computed" | "static",
    data_source: "Live" as "Live" | "DB",
    source_table: "",
    data_latency: "daily" as "realtime" | "nrt" | "hourly" | "daily" | "weekly" | "monthly" | "manual" | "onetime" | "batch",
    validation_strategy: "none" as "none" | "range" | "discrete" | "pattern",
    field_category_id: "" as string | number,
    range_min: "",
    range_max: "",
    discrete_values: "",
    operators: [] as number[],
    extractionLogic: "",
    default_value: "" as string | number,
    use_as_dynamic_variable: false,
    tag: "" as string,
    display_order: 0,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadCategories();
    if (isEditMode && id) {
      loadTablesAndKPI();
    } else {
      loadTables();
    }
  }, [id]);

  const loadTablesAndKPI = async () => {
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
      // Now load the KPI after tables are ready
      if (id) {
        await loadKPI();
      }
    } catch (err) {
      console.error("Failed to load tables:", err);
      setTables([]);
    } finally {
      setLoadingTables(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await kpiCategoryService.getKpiCategories();
      setCategories(data || []);
    } catch (err) {
      console.error("Failed to load KPI categories:", err);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadTables = async () => {
    try {
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

  const loadKPI = async () => {
    try {
      setLoading(true);
      const kpi = await kpiService.getKPIById(Number(id));
      if (kpi && kpi.id) {
        // Map KPI data back to form fields
        setFormData({
          name: kpi.field_name,
          field_value: kpi.field_value || "",
          description: kpi.description || "",
          field_type: kpi.field_type?.toLowerCase() === "text" ? "text" : kpi.field_type?.toLowerCase() || "number",
          calculationType: kpi.is_computable ? "computed" : "value_set",
          data_source: "DB",
          source_table: kpi.field_source_table,
          data_latency: (kpi.data_latency || "daily") as any,
          validation_strategy: (kpi.validation_strategy || "none") as any,
          field_category_id: kpi.field_category_id || "",
          range_min: kpi.field_allowed_range_min?.toString() || "",
          range_max: kpi.field_allowed_range_max?.toString() || "",
          discrete_values: kpi.field_allowed_distinct_values?.join(", ") || "",
          unit: "",
          operators: [],
          extractionLogic: kpi.extraction_logic || "",
          default_value: "",
          use_as_dynamic_variable: false,
        });
      }
    } catch (err) {
      showError("Error", "Failed to load KPI details");
      navigate("/dashboard/kpis/all");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "KPI name is required";
    }
    if (!formData.source_table.trim()) {
      newErrors.source_table = "Source table is required";
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

      // Determine field_pg_type based on field_type
      const pgTypeMap: Record<string, string> = {
        number: "numeric",
        numeric: "numeric",
        bigint: "numeric",
        decimal: "numeric",
        text: "text",
        money: "numeric",
        boolean: "boolean",
      };

      const kpiPayload: any = {
        field_name: formData.name,
        field_category_id: Number(formData.field_category_id),
        field_type: formData.field_type,
        field_pg_type: pgTypeMap[formData.field_type] || "numeric",
        field_source_table: formData.source_table,
        description: formData.description,
        extraction_logic: formData.extractionLogic,
        data_latency: formData.data_latency,
        validation_strategy: formData.validation_strategy,
        default_operator_id: formData.operators.length > 0 ? formData.operators[0] : null,
        is_computable: true,
        is_active: true,
        tag: "kpi",
      };

      // Only include field_value for creation (not for updates)
      if (!isEditMode) {
        kpiPayload.field_value = formData.field_value;
      }

      // Add conditional validation fields
      if (formData.validation_strategy === "range") {
        kpiPayload.field_allowed_range_min = Number(formData.range_min);
        kpiPayload.field_allowed_range_max = Number(formData.range_max);
      } else if (formData.validation_strategy === "discrete") {
        kpiPayload.field_allowed_distinct_values = formData.discrete_values
          .split(",")
          .map((v) => v.trim())
          .filter((v) => v);
      }

      if (isEditMode && id) {
        await kpiService.updateKPI(Number(id), kpiPayload);
        success("Success", `${formData.kpiType} KPI updated successfully`);
      } else {
        await kpiService.createKPI(kpiPayload);
        success("Success", `${formData.kpiType} KPI created successfully`);
      }
      navigate("/dashboard/kpis/all");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create KPI";
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className={`${tw.textMuted} font-medium mt-4`}>Loading KPI...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton showBreadcrumb={true} currentLabel={isEditMode ? "Edit KPI" : "Create KPI"} />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Section */}
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
                Field Category <span className="text-red-500">*</span>
              </label>
              {loadingCategories ? (
                <div className="p-2 text-sm text-gray-500">Loading categories...</div>
              ) : (
                <HeadlessSelect
                  options={categories && categories.length > 0 ? categories.map((cat) => ({ label: cat.name, value: cat.id?.toString() || "" })) : []}
                  value={formData.field_category_id ? formData.field_category_id.toString() : ""}
                  onChange={(value) => handleSelectChange("field_category_id", value)}
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
                 
                  disabled={saving}
                  step={formData.field_type === "decimal" || formData.field_type === "money" ? "0.01" : undefined}
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
                placeholder="Describe this KPI..."
                rows={3}
                hasError={!!errors.description}
                disabled={saving}
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tag
                </label>
                <HeadlessSelect
                  options={[
                    { label: "Revenue Metric", value: "revenue_metric" },
                    { label: "Usage Metric", value: "usage_metric" },
                    { label: "KPI", value: "kpi" },
                  ]}
                  value={formData.tag}
                  onChange={(value) => handleSelectChange("tag", value)}
                  placeholder="Select tag type"
                  disabled={saving}
                />
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

        {/* Data Source Configuration Section */}
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
                  Data Latency <span className="text-red-500">*</span>
                </label>
                <HeadlessSelect
                  options={DATA_LATENCY_OPTIONS}
                  value={formData.data_latency}
                  onChange={(value) => handleSelectChange("data_latency", value)}
                  disabled={saving}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Table <span className="text-red-500">*</span>
              </label>
              <HeadlessSelect
                options={tables}
                value={formData.source_table}
                onChange={(value) => handleSelectChange("source_table", value)}
                placeholder={loadingTables ? "Loading tables..." : "Select a table"}
                disabled={saving || loadingTables}
                searchable={true}
              />
              {errors.source_table && <p className="text-red-500 text-xs mt-1">{errors.source_table}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How is this KPI calculated? <span className="text-red-500">*</span>
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
        </div>

        {/* Extraction Logic Section */}
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
                placeholder={
                  formData.calculationType === "value_set"
                    ? "e.g., age  (reference a field from your table)"
                    : formData.calculationType === "computed"
                    ? "e.g., SUM(charges)  (write SQL or formula)"
                    : "e.g., 2010  (enter the static value)"
                }
              />
            </div>
            {errors.extractionLogic && <p className="text-red-500 text-xs mt-2">{errors.extractionLogic}</p>}
            <p className="text-xs text-gray-500 mt-2">
              {formData.calculationType === "value_set" && "Simple field reference - no SQL needed"}
              {formData.calculationType === "computed" && "Write SQL formula/query - e.g., SUM(charges), COUNT(*), current-previous"}
              {formData.calculationType === "static" && "Fixed constant value - no SQL needed"}
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard/kpis/all")}
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
            {saving ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update" : "Create")}
          </button>
        </div>
      </form>
    </div>
  );
}
