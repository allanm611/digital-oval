import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import KPIForm from "../components/KPIForm";
import { revenueMetricService } from "../services/revenueMetricService";
import { kpiCategoryService } from "../services/kpiCategoryService";
import { notificationTypeService } from "../../../shared/services/notificationTypeService";
import { jobTypeService } from "../../jobs/services/jobTypeService";
import { DATA_SOURCE_OPTIONS, FREQUENCY_OPTIONS, VALIDATION_STRATEGY_OPTIONS, DATA_LATENCY_OPTIONS } from "../constants/formOptions";

const FIELD_TYPE_OPTIONS = [
  { label: "Numeric", value: "numeric" },
  { label: "Decimal", value: "decimal" },
];

interface FormData {
  name: string;
  field_value: string;
  description: string;
  field_type: string;
  category: string | number;
  operators: number[];
  source_table: string;
  data_source: string;
  frequency?: string;
  unit?: string;
  default_value: string | number;
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
}

export default function RevenueMetricFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const mode = id ? "edit" : "create";
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTables, setLoadingTables] = useState(true);
  const [loadingJobTypes, setLoadingJobTypes] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [jobTypes, setJobTypes] = useState<any[]>([]);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    field_value: "",
    description: "",
    field_type: "numeric",
    category: "",
    operators: [],
    source_table: "",
    data_source: "Live",
    frequency: "Per Min",
    default_value: "",
    validation_strategy: "none",
    range_min: "",
    range_max: "",
    discrete_values: "",
    extractionLogic: "",
    use_as_dynamic_variable: false,
    tag: "revenue_metric",
    display_order: 0,
    job_type_id: "",
    schedule_type: "manual",
    cron_expression: "",
    is_computed: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadCategories();
    loadTables();
    loadJobTypes();
    if (mode === "edit" && id) {
      loadMetric();
    }
  }, [mode, id]);

  const loadCategories = async () => {
    try {
      const categories = await kpiCategoryService.getKpiCategories();
      const revenueCategories = categories.filter(
        (cat: any) => cat.id === 54 || cat.parent_category_id === 54
      );
      setCategories(revenueCategories);
    } catch (err) {
      console.error("Failed to load categories:", err);
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

  const loadJobTypes = async () => {
    try {
      const response = await jobTypeService.listJobTypes({ limit: 100 });
      const kpiJobTypes = (response.data || []).filter(
        (job: any) => job.code?.toLowerCase().includes("kpi")
      );
      setJobTypes(kpiJobTypes);
    } catch (err) {
      console.error("Failed to load job types:", err);
      setJobTypes([]);
    } finally {
      setLoadingJobTypes(false);
    }
  };

  const loadMetric = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const metric = await revenueMetricService.getMetricById(Number(id));
      if (metric) {
        setFormData({
          name: metric.name,
          field_value: metric.field_value || "",
          description: metric.description || "",
          field_type: metric.field_type,
          category: metric.category || "",
          operators: metric.operators || [],
          source_table: metric.source_table || "",
          data_source: metric.data_source || "Live",
          frequency: metric.frequency || "Per Min",
          unit: metric.unit || "",
          default_value: metric.default_value || "",
          validation_strategy: "none",
          range_min: "",
          range_max: "",
          discrete_values: "",
          extractionLogic: metric.extraction_logic || "",
          use_as_dynamic_variable: metric.is_dynamic_variable || false,
          tag: metric.tag || "revenue_metric",
          display_order: metric.display_order || 0,
          job_type_id: metric.job_type_id || "",
          schedule_type: "manual",
          cron_expression: "",
        });
      }
    } catch (err) {
      showError("Error", extractBackendError(err as any, "Error loading metric"));
      navigate("/dashboard/kpis/revenue-metrics");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.source_table.trim()) {
      newErrors.source_table = "Source table is required";
    }
    if (formData.is_computed && !formData.extractionLogic.trim()) {
      newErrors.extractionLogic = "Logic Definition is required for computed metrics";
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
        field_name: formData.name,
        description: formData.description,
        field_type: formData.field_type,
        field_pg_type: formData.field_type,
        field_category_id: formData.category,
        field_source_table: formData.source_table,
        validation_strategy: formData.validation_strategy,
        frequency: formData.frequency,
        default_value: String(formData.default_value),
        is_dynamic_variable: formData.use_as_dynamic_variable,
        tag: formData.tag,
        is_computable: formData.is_computed,
        display_order: formData.display_order,
      };

      if (formData.is_computed) {
        payload.extraction_logic = formData.extractionLogic;
      }

      if (mode === "create") {
        payload.field_value = formData.field_value;
        await revenueMetricService.createMetric(payload);
        success("Success", "Revenue metric created successfully");
      } else {
        await revenueMetricService.updateMetric(Number(id), payload);
        success("Success", "Revenue metric updated successfully");
      }

      navigate("/dashboard/kpis/revenue-metrics");
    } catch (err) {
      showError("Error", extractBackendError(err as any, "Error saving metric"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className="text-gray-500 font-medium mt-4">Loading revenue metric...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton showBreadcrumb={true} currentLabel={mode === "create" ? "Create Revenue Metric" : "Edit Revenue Metric"} />

      <KPIForm
        mode={mode}
        type="revenue"
        formData={formData}
        onFormDataChange={setFormData}
        errors={errors}
        saving={saving}
        categories={categories}
        tables={tables}
        jobTypes={jobTypes}
        loadingCategories={loadingCategories}
        loadingTables={loadingTables}
        loadingJobTypes={loadingJobTypes}
        fieldTypeOptions={FIELD_TYPE_OPTIONS}
        dataSourceOptions={DATA_SOURCE_OPTIONS}
        frequencyOptions={FREQUENCY_OPTIONS}
        dataLatencyOptions={DATA_LATENCY_OPTIONS}
        validationStrategyOptions={VALIDATION_STRATEGY_OPTIONS}
        onCancel={() => navigate("/dashboard/kpis/revenue-metrics")}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
