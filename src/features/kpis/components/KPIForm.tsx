import CodeMirror from "@uiw/react-codemirror";
import { sql as sqlLanguage } from "@codemirror/lang-sql";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../shared/components/ui/Checkbox";
import MultiCategorySelector from "../../../shared/components/MultiCategorySelector";
import { color, tw, button, getButtonStyles } from "../../../shared/utils/utils";
import { getOperatorsForFieldType } from "../../../shared/utils/operatorMapper";
import { useTheme } from "../../../contexts/ThemeContext";
import { darkTheme, darkSyntaxHighlight } from "../../../shared/utils/codemirrorThemes";
import { JobType } from "../../jobs/types/job";

const SCHEDULE_TYPE_OPTIONS = [
  { label: "Manual", value: "manual" },
  { label: "Cron", value: "cron" },
];

const CALCULATION_TYPE_OPTIONS = [
  { label: "Value Set", value: "value_set" },
  { label: "Computed", value: "computed" },
  { label: "Static", value: "static" },
];

interface KPIFormData {
  name: string;
  field_value?: string;
  description: string;
  field_type: string;
  category: string | number;
  operators: number[];
  source_table: string;
  data_source: string;
  frequency?: string;
  default_value: string;
  validation_strategy: string;
  range_min: string;
  range_max: string;
  discrete_values: string;
  extractionLogic: string;
  use_as_dynamic_variable: boolean;
  tag: string | null;
  display_order: number;
  job_type_id?: string | number;
  schedule_type?: string;
  cron_expression?: string;
  data_latency?: string;
  is_computed?: boolean;
  calculationType?: "value_set" | "computed" | "static";
}

interface KPIFormProps {
  mode: "create" | "edit";
  type: "kpi" | "revenue" | "usage" | "profile";
  formData: KPIFormData;
  onFormDataChange: (data: KPIFormData) => void;
  errors: { [key: string]: string };
  saving: boolean;
  categories: any[];
  tables: any[];
  jobTypes?: JobType[];
  loadingCategories?: boolean;
  loadingTables?: boolean;
  loadingJobTypes?: boolean;
  fieldTypeOptions: Array<{ label: string; value: string }>;
  dataSourceOptions: Array<{ label: string; value: string }>;
  frequencyOptions?: Array<{ label: string; value: string }>;
  dataLatencyOptions?: Array<{ label: string; value: string }>;
  validationStrategyOptions: Array<{ label: string; value: string }>;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

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

export default function KPIForm({
  mode,
  type,
  formData,
  onFormDataChange,
  errors,
  saving,
  categories,
  tables,
  jobTypes = [],
  loadingCategories = false,
  loadingTables = false,
  loadingJobTypes = false,
  fieldTypeOptions,
  dataSourceOptions,
  frequencyOptions = [],
  dataLatencyOptions = [],
  validationStrategyOptions,
  onCancel,
  onSubmit,
}: KPIFormProps) {
  const { isDark } = useTheme();
  const handleInputChange = (fieldName: keyof KPIFormData) => (value: string | number | boolean) => {
    onFormDataChange({ ...formData, [fieldName]: value });
  };

  const handleSelectChange = (name: string, value: string | undefined) => {
    if (!value) return;
    onFormDataChange({ ...formData, [name]: value });
  };

  const showScheduling = type !== "profile";
  const showFrequency = type === "revenue" || type === "usage";
  const showDataLatency = type === "kpi" || type === "profile";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Basic Information Section */}
      <div className={`${tw.rounded} bg-white p-6 shadow-sm`}>
        <h2 className={`${tw.cardHeading} text-gray-900 mb-6`}>Basic Information</h2>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Name *"
                placeholder="e.g., Revenue Metric"
                value={formData.name}
                onChange={handleInputChange("name")}
                hasError={!!errors.name}
                disabled={saving}
                required
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <Input
                label="Field Value (Slug) *"
                placeholder="e.g., p_revenue"
                value={formData.field_value || ""}
                onChange={handleInputChange("field_value")}
                disabled={mode === "edit" || saving}
                required
              />
            </div>
          </div>

          <div>
            {loadingCategories ? (
              <div className="p-2 text-sm text-gray-500">Loading categories...</div>
            ) : (
              <HeadlessSelect
                label="Category *"
                options={categories.map((cat) => ({ label: cat.name, value: cat.id?.toString() || "" }))}
                value={formData.category?.toString() || ""}
                onChange={(value) => handleSelectChange("category", value)}
                disabled={saving || loadingCategories}
                searchable
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <HeadlessSelect
                label="Field Type *"
                options={fieldTypeOptions}
                value={formData.field_type}
                onChange={(value) => handleSelectChange("field_type", value)}
                disabled={saving}
              />
            </div>

            <div>
              <HeadlessSelect
                label="Tag"
                options={[
                  { label: "KPI", value: "kpi" },
                  { label: "Revenue Metric", value: "revenue_metric" },
                  { label: "Usage Metric", value: "usage_metric" },
                ]}
                value={formData.tag || ""}
                onChange={(value) => onFormDataChange({ ...formData, tag: value || null })}
                placeholder="Select tag type"
                disabled={saving}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Input
                label="Default Value *"
                placeholder="e.g., 100"
                value={formData.default_value}
                onChange={handleInputChange("default_value")}
                hasError={!!errors.default_value}
                disabled={saving}
              />
              {errors.default_value && <p className="text-red-500 text-xs mt-1">{errors.default_value}</p>}
            </div>

            <div>
              <Input
                label="Display Order"
                type="number"
                placeholder="e.g., 0"
                value={formData.display_order}
                onChange={handleInputChange("display_order")}
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <Textarea
              label="Description"
              value={formData.description || ""}
              onChange={(value) => onFormDataChange({ ...formData, description: value })}
              placeholder="Describe this metric..."
              rows={3}
              disabled={saving}
            />
          </div>

          <div>
            <MultiCategorySelector
              label="Operators"
              value={formData.operators}
              onChange={(operatorIds) => onFormDataChange({ ...formData, operators: operatorIds })}
              data={getOperatorData(formData.field_type)}
              placeholder="Select operators..."
              disabled={saving}
              hasError={!!errors.operators}
            />
            {errors.operators && <p className="text-red-500 text-xs mt-2">{errors.operators}</p>}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={Boolean(formData.use_as_dynamic_variable)}
              onChange={(e) => onFormDataChange({ ...formData, use_as_dynamic_variable: e.target.checked })}
              disabled={saving}
              style={{ accentColor: color.primary.accent }}
            />
            <span className="text-sm font-medium text-gray-700">Use as dynamic variable</span>
          </label>
        </div>
      </div>

      {/* Validation Configuration Section */}
      <div className={`${tw.rounded} bg-white p-6 shadow-sm`}>
        <h2 className={`${tw.cardHeading} text-gray-900 mb-6`}>Validation Configuration</h2>
        <div className="space-y-6">
          <div>
            <HeadlessSelect
              label="Validation Strategy *"
              options={validationStrategyOptions}
              value={formData.validation_strategy}
              onChange={(value) => handleSelectChange("validation_strategy", value)}
              disabled={saving}
            />
          </div>

          {formData.validation_strategy === "range" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="Min Value *"
                  type="number"
                  placeholder="e.g., 0"
                  value={formData.range_min}
                  onChange={handleInputChange("range_min")}
                  hasError={!!errors.range_min}
                  disabled={saving}
                />
                {errors.range_min && <p className="text-red-500 text-xs mt-1">{errors.range_min}</p>}
              </div>
              <div>
                <Input
                  label="Max Value *"
                  type="number"
                  placeholder="e.g., 100"
                  value={formData.range_max}
                  onChange={handleInputChange("range_max")}
                  hasError={!!errors.range_max}
                  disabled={saving}
                />
                {errors.range_max && <p className="text-red-500 text-xs mt-1">{errors.range_max}</p>}
              </div>
            </div>
          )}

          {formData.validation_strategy === "discrete" && (
            <div>
              <Input
                label="Allowed Values *"
                placeholder="e.g., active, inactive, pending (comma-separated)"
                value={formData.discrete_values}
                onChange={handleInputChange("discrete_values")}
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
        <h2 className={`${tw.cardHeading} text-gray-900 mb-6`}>Data Source Configuration</h2>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <HeadlessSelect
                label="Data Source *"
                options={dataSourceOptions}
                value={formData.data_source}
                onChange={(value) => handleSelectChange("data_source", value)}
                disabled={saving}
              />
            </div>

            {showDataLatency && (
              <div>
                <HeadlessSelect
                  label="Data Latency *"
                  options={dataLatencyOptions}
                  value={formData.data_latency || ""}
                  onChange={(value) => handleSelectChange("data_latency", value)}
                  disabled={saving}
                />
              </div>
            )}

            {showFrequency && (
              <div>
                <HeadlessSelect
                  label="Frequency"
                  options={frequencyOptions}
                  value={formData.frequency || ""}
                  onChange={(value) => handleSelectChange("frequency", value)}
                  placeholder="Select frequency"
                  disabled={saving}
                />
              </div>
            )}
          </div>

          <div>
            {loadingTables ? (
              <div className="p-2 text-sm text-gray-500">Loading tables...</div>
            ) : (
              <HeadlessSelect
                label="Source Table *"
                options={tables}
                value={formData.source_table}
                onChange={(value) => handleSelectChange("source_table", value)}
                placeholder={loadingTables ? "Loading tables..." : "Select a table"}
                disabled={saving || loadingTables}
                searchable
              />
            )}
            {errors.source_table && <p className="text-red-500 text-xs mt-1">{errors.source_table}</p>}
          </div>

          {type === "kpi" && (
            <div>
              <HeadlessSelect
                label="How is this KPI calculated? *"
                options={CALCULATION_TYPE_OPTIONS}
                value={formData.calculationType || ""}
                onChange={(value) => handleSelectChange("calculationType", value)}
                disabled={saving}
              />
            </div>
          )}

          {showFrequency && (
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={Boolean(formData.is_computed)}
                onChange={(e) => onFormDataChange({ ...formData, is_computed: e.target.checked })}
                disabled={saving}
                style={{ accentColor: color.primary.accent }}
              />
              <span className="text-sm font-medium text-gray-700">Is Computed</span>
            </label>
          )}
        </div>
      </div>

      {/* Extraction Logic Section (show when computed) */}
      {(((type === "revenue" || type === "usage") && formData.is_computed) || (type === "kpi" && formData.calculationType === "computed")) && (
        <div className={`${tw.rounded} bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-6`}>Extraction Logic</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logic Definition *</label>
              <CodeMirror
                value={formData.extractionLogic}
                extensions={[
                  sqlLanguage(),
                  ...(isDark ? [darkSyntaxHighlight] : []),
                ]}
                onChange={(value) => onFormDataChange({ ...formData, extractionLogic: value })}
                height="200px"
                className={`border ${errors.extractionLogic ? "border-red-500" : tw.borderDefault} ${tw.rounded}`}
                theme={isDark ? darkTheme : "light"}
                style={{
                  borderColor: errors.extractionLogic ? "#ef4444" : "inherit",
                }}
              />
              {errors.extractionLogic && <p className="text-red-500 text-xs mt-2">{errors.extractionLogic}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Configuration Section (only for non-profile types) */}
      {showScheduling && (
        <div className={`${tw.rounded} bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-6`}>Schedule Configuration</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <HeadlessSelect
                  label="Schedule Type"
                  options={SCHEDULE_TYPE_OPTIONS}
                  value={formData.schedule_type || "manual"}
                  onChange={(value) => onFormDataChange({ ...formData, schedule_type: value })}
                  placeholder="Select schedule type"
                  disabled={saving || loadingJobTypes}
                />
              </div>

              <div>
                <HeadlessSelect
                  label="Job Type"
                  options={jobTypes.map((job) => ({ label: job.name, value: job.id?.toString() || "" }))}
                  value={formData.job_type_id?.toString() || ""}
                  onChange={(value) => onFormDataChange({ ...formData, job_type_id: value })}
                  placeholder="Select job type"
                  disabled={saving || loadingJobTypes}
                />
              </div>
            </div>

            {formData.schedule_type === "cron" && (
              <div>
                <Input
                  label="Cron Expression"
                  placeholder="e.g., 0 0 * * *"
                  value={formData.cron_expression || ""}
                  onChange={(value) => onFormDataChange({ ...formData, cron_expression: String(value) })}
                  disabled={saving}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="transition-colors disabled:opacity-60"
          style={getButtonStyles(button.bordered)}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className={`text-white ${tw.rounded} transition-all duration-200 font-medium text-sm px-6 py-2 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed`}
          style={{ backgroundColor: color.primary.action }}
        >
          {saving ? (mode === "edit" ? "Updating..." : "Creating...") : (mode === "edit" ? "Update" : "Create")}
        </button>
      </div>
    </form>
  );
}
