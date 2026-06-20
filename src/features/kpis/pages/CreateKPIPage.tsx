import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import KPIForm from "../components/KPIForm";
import { kpiService } from "../services/kpiService";
import { kpiCategoryService } from "../services/kpiCategoryService";
import { notificationTypeService } from "../../../shared/services/notificationTypeService";
import { revenueMetricService } from "../services/revenueMetricService";
import { usageMetricService } from "../services/usageMetricService";
import { subscriberProfileService } from "../services/subscriberProfileService";
import { jobTypeService } from "../../jobs/services/jobTypeService";
import { DATA_SOURCE_OPTIONS, DATA_LATENCY_OPTIONS, FREQUENCY_OPTIONS, VALIDATION_STRATEGY_OPTIONS } from "../constants/formOptions";

const FIELD_TYPE_OPTIONS = [
  { label: "Number", value: "number" },
  { label: "Numeric", value: "numeric" },
  { label: "Big Int", value: "bigint" },
  { label: "Decimal", value: "decimal" },
  { label: "Text", value: "text" },
  { label: "Money", value: "money" },
  { label: "Boolean", value: "boolean" },
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
  data_latency?: string;
  is_computed?: boolean;
  calculationType?: "value_set" | "computed" | "static";
}

export default function CreateKPIPage() {
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
    field_type: "number",
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
    tag: "kpi",
    display_order: 0,
    job_type_id: "",
    schedule_type: "manual",
    cron_expression: "",
    data_latency: "daily",
    calculationType: "value_set",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadCategories();
    loadTables();
    loadJobTypes();
    if (mode === "edit" && id) {
      loadKPI();
    }
  }, [mode, id]);

  const loadCategories = async () => {
    try {
      const categories = await kpiCategoryService.getKpiCategories();
      setCategories(categories);
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

  const loadKPI = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const kpi = await kpiService.getKPIById(Number(id));
      if (kpi) {
        if (!kpi) return;

        const kpiData = kpi.data || kpi;
        console.log("📋 Loaded KPI Data:", kpiData);

        const newFormData = {
          name: kpiData.field_name || kpiData.name || "",
          field_value: kpiData.field_value || "",
          description: kpiData.description || "",
          field_type: kpiData.field_type || "number",
          category: kpiData.field_category_id || "",
          operators: kpiData.operators || [],
          source_table: kpiData.field_source_table || "",
          data_source: "DB",
          frequency: "Per Min",
          default_value: kpiData.default_value || "",
          validation_strategy: kpiData.validation_strategy || "none",
          range_min: kpiData.field_allowed_range_min?.toString() || "",
          range_max: kpiData.field_allowed_range_max?.toString() || "",
          discrete_values: kpiData.field_allowed_distinct_values?.join(", ") || "",
          extractionLogic: kpiData.extraction_logic || "",
          use_as_dynamic_variable: kpiData.is_dynamic_variable || false,
          tag: kpiData.tag || null,
          display_order: kpiData.display_order || 0,
          job_type_id: "",
          schedule_type: "manual",
          cron_expression: "",
          data_latency: kpiData.data_latency || "daily",
          calculationType: kpiData.is_computable ? "computed" : "value_set",
        };

        console.log("✅ Form Data to Set:", newFormData);
        setFormData(newFormData);
      }
    } catch (err) {
      showError("Error", extractBackendError(err as any, "Error loading KPI"));
      navigate("/dashboard/kpis");
    } finally {
      setLoading(false);
    }
  };

  const getKPIType = (): "kpi" | "revenue" | "usage" | "profile" => {
    if (!formData.category) return "kpi";
    const category = categories.find((cat) => cat.id?.toString() === formData.category?.toString());
    if (!category) return "kpi";
    if (category.parent_category_id === 54) return "revenue";
    if (category.parent_category_id === 55) return "usage";
    if (category.parent_category_id === 60) return "profile";
    return "kpi";
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    const type = getKPIType();

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.source_table.trim()) {
      newErrors.source_table = "Source table is required";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      console.error("❌ KPI Validation Errors:", newErrors);
      console.log("📋 Form Data:", {
        name: formData.name,
        source_table: formData.source_table,
        calculationType: formData.calculationType,
        extractionLogic: formData.extractionLogic,
        kpiType: type,
      });
    }

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
      const type = getKPIType();

      const payload: any = {
        field_name: formData.name,
        description: formData.description,
        field_type: formData.field_type,
        field_pg_type: formData.field_type,
        field_category_id: formData.category,
        validation_strategy: formData.validation_strategy,
        default_value: String(formData.default_value),
        is_dynamic_variable: formData.use_as_dynamic_variable,
        tag: formData.tag,
        display_order: formData.display_order,
      };

      if (mode === "create") {
        payload.field_value = formData.field_value;
        payload.field_source_table = formData.source_table;
      }

      // Handle different types
      if (type === "revenue") {
        payload.frequency = formData.frequency;
        payload.is_computable = formData.is_computed;
        if (formData.is_computed) {
          payload.extraction_logic = formData.extractionLogic;
        }
        if (mode === "create") {
          await revenueMetricService.createMetric(payload);
          success("Success", "Revenue metric created successfully");
          navigate("/dashboard/kpis");
        } else {
          await revenueMetricService.updateMetric(Number(id), payload);
          success("Success", "Revenue metric updated successfully");
          navigate("/dashboard/kpis");
        }
      } else if (type === "usage") {
        payload.frequency = formData.frequency;
        payload.is_computable = formData.is_computed;
        if (formData.is_computed) {
          payload.extraction_logic = formData.extractionLogic;
        }
        if (mode === "create") {
          await usageMetricService.createMetric(payload);
          success("Success", "Usage metric created successfully");
          navigate("/dashboard/kpis");
        } else {
          await usageMetricService.updateMetric(Number(id), payload);
          success("Success", "Usage metric updated successfully");
          navigate("/dashboard/kpis");
        }
      } else if (type === "profile") {
        payload.data_latency = formData.data_latency;
        if (mode === "create") {
          payload.field_value = formData.field_value;
          await subscriberProfileService.createProfile(payload);
          success("Success", "Profile created successfully");
          navigate("/dashboard/kpis");
        } else {
          await subscriberProfileService.updateProfile(Number(id), payload);
          success("Success", "Profile updated successfully");
          navigate("/dashboard/kpis");
        }
      } else {
        // KPI type
        payload.data_latency = formData.data_latency;
        payload.is_computable = formData.calculationType === "computed";
        if (formData.calculationType === "computed") {
          payload.extraction_logic = formData.extractionLogic;
        }
        if (mode === "create") {
          payload.field_value = formData.field_value;
          await kpiService.createKPI(payload);
          success("Success", "KPI created successfully");
          navigate("/dashboard/kpis");
        } else {
          await kpiService.updateKPI(Number(id), payload);
          success("Success", "KPI updated successfully");
          navigate("/dashboard/kpis");
        }
      }
    } catch (err) {
      showError("Error", extractBackendError(err as any, "Error saving KPI"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className="text-gray-500 font-medium mt-4">Loading KPI...</p>
      </div>
    );
  }

  const kpiType = getKPIType();

  return (
    <div className="space-y-6">
      <BackButton showBreadcrumb={true} currentLabel={mode === "create" ? "Create KPI" : "Edit KPI"} />

      <KPIForm
        mode={mode}
        type={kpiType}
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
        onCancel={() => {
          if (kpiType === "revenue") navigate("/dashboard/kpis/revenue-metrics");
          else if (kpiType === "usage") navigate("/dashboard/kpis/usage-metrics");
          else if (kpiType === "profile") navigate("/dashboard/kpis/subscriber-profiles");
          else navigate("/dashboard/kpis");
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
