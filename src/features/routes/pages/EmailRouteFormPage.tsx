import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { EmailRoute, CreateEmailRouteRequest } from "../types/emailRoute";
import { emailRouteService } from "../services/emailRouteService";
import { emailGatewayConfigService } from "../../configurations/services/emailGatewayConfigService";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { color, tw } from "../../../shared/utils/utils";

interface EmailRouteFormPageProps {
  mode: "create" | "edit";
}

export default function EmailRouteFormPage({ mode }: EmailRouteFormPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [route, setRoute] = useState<EmailRoute | null>(null);
  const [gatewayConfigs, setGatewayConfigs] = useState<any[]>([]);

  const [formData, setFormData] = useState<CreateEmailRouteRequest>({
    name: "",
    gateway_config_id: 0,
    is_active: true,
    description: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadGatewayConfigs();

    if (mode === "edit" && id) {
      loadRoute();
    } else {
      setLoading(false);
    }
  }, [mode, id]);

  const loadGatewayConfigs = async () => {
    try {
      const configs = await emailGatewayConfigService.getAllConfigs();
      setGatewayConfigs(configs);
    } catch (err) {
      showError("Error", "Failed to load gateway configurations");
    }
  };

  const loadRoute = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await emailRouteService.getRouteById(Number(id));
      if (data) {
        setRoute(data);
        setFormData({
          name: data.name,
          gateway_config_id: data.gateway_config_id,
          is_active: data.is_active,
          description: data.description,
        });
      }
    } catch (err) {
      showError("Error", extractBackendError(error, "Error. Please try again."));
      navigate("/dashboard/email-routes");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Route name is required";
    }
    // gateway_config_id is no longer required

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

      // Remove gateway_config_id from payload
      const { gateway_config_id, ...payloadData } = formData;

      if (mode === "edit" && id) {
        await emailRouteService.updateRoute(Number(id), payloadData);
        success("Success", "Email route updated successfully");
      } else {
        await emailRouteService.createRoute(payloadData);
        success("Success", "Email route created successfully");
      }

      navigate("/dashboard/email-routes");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save route";
      showError("Error", extractBackendError(error, "Error. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (fieldName: keyof CreateEmailRouteRequest) => (value: string | number) => {
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

  const handleSelectChange = (fieldName: string, value: string | number | undefined) => {
    if (fieldName === "is_active") {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: value === "true",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: value ? Number(value) : 0,
      }));
    }

    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className={`${tw.textMuted} font-medium mt-4`}>Loading email route...</p>
      </div>
    );
  }

  const gatewayConfigOptions = gatewayConfigs.map((config) => ({
    value: String(config.id),
    label: config.name,
  }));

  return (
    <div className="space-y-6">
      <BackButton
       
        showBreadcrumb={true}
        currentLabel={mode === "create" ? "Create Email Route" : "Edit Email Route"}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Basic Information</h2>
          <div className="space-y-4">
            <div>
              <Input
                label="Route Name"
                placeholder="e.g., Primary Email Route"
                value={formData.name}
                onChange={handleInputChange('name')}
                hasError={!!errors.name}
               
                disabled={saving}
                required
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <Textarea
                label="Description"
                value={formData.description || ""}
                onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
                placeholder="Add notes about this route..."
                rows={3}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Gateway Configuration</h2>
          <div className="space-y-4">
            <div>
              <HeadlessSelect
                label="Email Gateway Configuration"
                options={gatewayConfigOptions}
                value={String(formData.gateway_config_id || "")}
                onChange={(value) => handleSelectChange("gateway_config_id", value)}
                placeholder="Select gateway configuration"
                disabled={saving}
                error={!!errors.gateway_config_id}
              />
              {errors.gateway_config_id && (
                <p className="text-red-500 text-xs mt-1">{errors.gateway_config_id}</p>
              )}
            </div>
          </div>
        </div>

        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Status</h2>
          <div className="space-y-4">
            <div>
              <HeadlessSelect
                label="Route Status"
                options={[
                  { value: "true", label: "Active" },
                  { value: "false", label: "Inactive" },
                ]}
                value={formData.is_active ? "true" : "false"}
                onChange={(value) => handleSelectChange("is_active", value)}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate("/dashboard/email-routes")}
            disabled={saving}
            className="px-6 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-60"
            style={{ backgroundColor: color.primary.action }}
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Route"}
          </button>
        </div>
      </form>
    </div>
  );
}
