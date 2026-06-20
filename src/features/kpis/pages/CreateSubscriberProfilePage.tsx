import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import KPIForm from "../components/KPIForm";
import { kpiCategoryService } from "../services/kpiCategoryService";
import { notificationTypeService } from "../../../shared/services/notificationTypeService";
import { subscriberProfileService } from "../services/subscriberProfileService";
import {
  FIELD_TYPE_OPTIONS,
  DATA_SOURCE_OPTIONS,
  DATA_LATENCY_OPTIONS,
  VALIDATION_STRATEGY_OPTIONS,
} from "../constants/formOptions";

export default function CreateSubscriberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const mode = id ? "edit" : "create";
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTables, setLoadingTables] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    field_value: "",
    description: "",
    field_type: "text",
    category: "" as string | number,
    operators: [] as number[],
    source_table: "",
    data_source: "DB",
    default_value: "",
    validation_strategy: "none",
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
    if (mode === "edit" && id) {
      loadTablesAndProfile();
    } else {
      loadTables();
    }
  }, [mode, id]);

  const loadCategories = async () => {
    try {
      const categories = await kpiCategoryService.getKpiCategories();
      const subscriberCategories = categories.filter(
        (cat: any) => cat.id === 60 || cat.parent_category_id === 60
      );
      setCategories(subscriberCategories);
    } catch (err) {
      console.error("Failed to load categories:", err);
      setCategories([]);
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

  const loadTablesAndProfile = async () => {
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
      if (id) {
        await loadProfile();
      }
    } catch (err) {
      console.error("Failed to load tables:", err);
      setTables([]);
    } finally {
      setLoadingTables(false);
    }
  };

  const loadProfile = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await subscriberProfileService.getProfileById(Number(id));
      if (data) {
        setFormData({
          name: data.name,
          field_value: data.field_value || "",
          description: data.description,
          field_type: data.field_type,
          category: data.category,
          operators: [...data.operators],
          source_table: data.source_table,
          data_source: data.data_source,
          default_value: data.default_value || "",
          validation_strategy: "none",
          range_min: "",
          range_max: "",
          discrete_values: "",
          extractionLogic: "",
          use_as_dynamic_variable: data.is_dynamic_variable || false,
          tag: data.tag || "kpi",
          display_order: data.display_order || 0,
        });
      }
    } catch (err) {
      showError("Error", extractBackendError(err as any, "Error. Please try again."));
      navigate("/dashboard/kpis/subscriber-profiles");
    } finally {
      setLoading(false);
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
        field_name: formData.name,
        description: formData.description,
        field_type: formData.field_type,
        field_pg_type: formData.field_type,
        field_category_id: formData.category,
        validation_strategy: formData.validation_strategy,
        default_value: String(formData.default_value),
        is_dynamic_variable: formData.use_as_dynamic_variable,
        tag: formData.tag,
      };

      if (mode === "create") {
        payload.field_value = formData.field_value;
        payload.field_source_table = formData.source_table;
        await subscriberProfileService.createProfile(payload);
        success("Success", "Subscriber profile created successfully");
      } else {
        await subscriberProfileService.updateProfile(Number(id), payload);
        success("Success", "Subscriber profile updated successfully");
      }

      navigate("/dashboard/kpis/subscriber-profiles");
    } catch (err) {
      showError("Error", extractBackendError(err as any, "Error. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className="text-gray-500 font-medium mt-4">Loading subscriber profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton showBreadcrumb={true} currentLabel={mode === "create" ? "Create Subscriber Profile" : "Edit Subscriber Profile"} />

      <KPIForm
        mode={mode as "create" | "edit"}
        type="profile"
        formData={formData}
        onFormDataChange={setFormData}
        errors={errors}
        loading={loading}
        saving={saving}
        categories={categories}
        tables={tables}
        loadingCategories={loadingCategories}
        loadingTables={loadingTables}
        fieldTypeOptions={FIELD_TYPE_OPTIONS}
        dataSourceOptions={DATA_SOURCE_OPTIONS}
        dataLatencyOptions={DATA_LATENCY_OPTIONS}
        validationStrategyOptions={VALIDATION_STRATEGY_OPTIONS}
        onCancel={() => navigate("/dashboard/kpis/subscriber-profiles")}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
