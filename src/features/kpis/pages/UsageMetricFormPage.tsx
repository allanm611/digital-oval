import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { UsageMetric, UsageMetricOperator } from "../types/usageMetrics";
import { usageMetricService } from "../services/usageMetricService";
import { useToast } from "../../../contexts/ToastContext";
import { color, tw } from "../../../shared/utils/utils";

const CATEGORY_OPTIONS = [
  { label: "Data Usage", value: "data_usage" },
  { label: "Voice Usage", value: "voice_usage" },
  { label: "SMS Usage", value: "sms_usage" },
  { label: "Bundle Usage", value: "bundle_usage" },
  { label: "DOU Metrics", value: "dou_metrics" },
];

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

const OPERATORS: { value: UsageMetricOperator; label: string }[] = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "greater_than", label: "Greater Than" },
  { value: "less_than", label: "Less Than" },
  { value: "in", label: "In" },
  { value: "not_in", label: "Not In" },
];

interface UsageMetricFormPageProps {
  mode: "create" | "edit";
}

export default function UsageMetricFormPage({ mode }: UsageMetricFormPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [metric, setMetric] = useState<UsageMetric | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    field_type: "numeric" as "numeric" | "decimal",
    category: "data_usage" as const,
    operators: [] as UsageMetricOperator[],
    source_table: "",
    data_source: "Live" as "Live" | "DB",
    frequency: "Per Min" as "Per Min" | "D-1" | "Monthly",
    unit: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Load metric if editing
  useEffect(() => {
    if (mode === "edit" && id) {
      loadMetric();
    }
  }, [mode, id]);

  const loadMetric = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await usageMetricService.getMetricById(Number(id));
      if (data) {
        setMetric(data);
        setFormData({
          name: data.name,
          description: data.description,
          field_type: data.field_type,
          category: data.category,
          operators: [...data.operators],
          source_table: data.source_table,
          data_source: data.data_source,
          frequency: data.frequency,
          unit: data.unit || "",
        });
      }
    } catch (err) {
      showError("Error", "Failed to load usage metric");
      navigate("/dashboard/kpis/usage-metrics");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Metric name is required";
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

      if (mode === "edit" && id) {
        await usageMetricService.updateMetric(Number(id), {
          name: formData.name,
          description: formData.description,
          field_type: formData.field_type,
          category: formData.category,
          operators: formData.operators,
          source_table: formData.source_table,
          data_source: formData.data_source,
          frequency: formData.frequency,
          unit: formData.unit || undefined,
        });
        success("Success", "Usage metric updated successfully");
      } else {
        await usageMetricService.createMetric({
          name: formData.name,
          description: formData.description,
          field_type: formData.field_type,
          category: formData.category,
          operators: formData.operators,
          source_table: formData.source_table,
          data_source: formData.data_source,
          frequency: formData.frequency,
          unit: formData.unit || undefined,
        });
        success("Success", "Usage metric created successfully");
      }

      navigate("/dashboard/kpis/usage-metrics");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save metric";
      showError("Error", errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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

  const handleOperatorChange = (operator: UsageMetricOperator, checked: boolean) => {
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
        <p className={`${tw.textMuted} font-medium mt-4`}>Loading usage metric...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <BackButton fallbackTo="/dashboard/kpis/usage-metrics" />
        <div>
          <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
            {mode === "create" ? "Create Usage Metric" : "Edit Usage Metric"}
          </h1>
          {/* <p className={`${tw.textSecondary} mt-1 text-sm`}>
            {mode === "create"
              ? "Create a new usage performance metric"
              : `Editing: ${metric?.name || ""}`}
          </p> */}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Basic Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metric Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Data 2G Usage"
                  className={`w-full px-3 py-3 text-sm border ${tw.rounded} focus:outline-none ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={saving}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe this metric..."
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
                  Category *
                </label>
                <HeadlessSelect
                  options={CATEGORY_OPTIONS}
                  value={formData.category}
                  onChange={(value) => handleSelectChange("category", value)}
                  disabled={saving}
                />
              </div>

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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Table *
              </label>
              <input
                type="text"
                name="source_table"
                value={formData.source_table}
                onChange={handleChange}
                placeholder="e.g., OCS_DATA"
                className={`w-full px-3 py-2 text-sm border ${tw.rounded} focus:outline-none ${
                  errors.source_table ? "border-red-500" : "border-gray-300"
                }`}
                disabled={saving}
              />
              {errors.source_table && <p className="text-red-500 text-xs mt-1">{errors.source_table}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit (optional)
                </label>
                <input
                  type="text"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  placeholder="e.g., MB, Minutes, Count"
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-md focus:outline-none"
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Operators Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Operators</h2>
          <p className="text-sm text-gray-600 mb-4">Select all operators that apply to this metric</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {OPERATORS.map((op) => (
              <label key={op.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.operators.includes(op.value)}
                  onChange={(e) => handleOperatorChange(op.value, e.target.checked)}
                  disabled={saving}
                  style={{ accentColor: color.primary.accent }}
                />
                <span className="text-sm text-gray-700">{op.label}</span>
              </label>
            ))}
          </div>
          {errors.operators && <p className="text-red-500 text-xs mt-3">{errors.operators}</p>}
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
            {saving ? "Saving..." : "Save Metric"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/dashboard/kpis/usage-metrics")}
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
