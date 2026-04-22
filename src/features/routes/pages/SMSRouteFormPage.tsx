import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import Input from "../../../shared/components/ui/Input";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { SMSRoute, CreateSMSRouteRequest } from "../types/smsRoute";
import { smsRouteService } from "../services/smsRouteService";
import { NOTIFICATION_CHANNEL_OPTIONS, SMS_GATEWAY_OPTIONS } from "../constants/smsRouteEnums";
import { useToast } from "../../../contexts/ToastContext";
import { color, tw } from "../../../shared/utils/utils";

const STATUS_OPTIONS = [
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

interface SMSRouteFormPageProps {
  mode: "create" | "edit";
}

export default function SMSRouteFormPage({ mode }: SMSRouteFormPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [route, setRoute] = useState<SMSRoute | null>(null);

  const [formData, setFormData] = useState<CreateSMSRouteRequest>({
    name: "",
    gateway_provider: undefined,
    communication_channel: undefined,
    is_active: true,
    description: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Load route if editing
  useEffect(() => {
    if (mode === "edit" && id) {
      loadRoute();
    }
  }, [mode, id]);

  const loadRoute = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await smsRouteService.getRouteById(Number(id));
      if (data) {
        setRoute(data);
        setFormData({
          name: data.name,
          gateway_provider: data.gateway_provider,
          communication_channel: data.communication_channel,
          is_active: data.is_active,
          description: data.description,
        });
      }
    } catch (err) {
      showError("Error", "Failed to load SMS route");
      navigate("/dashboard/sms-routes");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Route name is required";
    }
    if (!formData.gateway_provider) {
      newErrors.gateway_provider = "Gateway provider is required";
    }
    if (!formData.communication_channel) {
      newErrors.communication_channel = "Communication channel is required";
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
        await smsRouteService.updateRoute(Number(id), {
          ...formData,
        });
        success("Success", "SMS route updated successfully");
      } else {
        await smsRouteService.createRoute(formData);
        success("Success", "SMS route created successfully");
      }

      navigate("/dashboard/sms-routes");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save route";
      showError("Error", errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (fieldName: keyof CreateSMSRouteRequest) => (value: string | number) => {
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
        [fieldName]: value,
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
        <p className={`${tw.textMuted} font-medium mt-4`}>Loading SMS route...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <BackButton fallbackTo="/dashboard/sms-routes" showBreadcrumb={true} currentLabel={mode === "create" ? "Create SMS Route" : "Edit SMS Route"} />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Basic Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Route Name *
                </label>
                <Input
                  placeholder="e.g., Primary SMS Gateway"
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
                  Status
                </label>
                <HeadlessSelect
                  options={STATUS_OPTIONS}
                  value={formData.is_active ? "true" : "false"}
                  onChange={(value) => handleSelectChange("is_active", value)}
                  disabled={saving}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description || ""}
                onChange={handleTextareaChange}
                placeholder="Add notes about this route..."
                rows={3}
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none`}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {/* Communication Configuration Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Communication Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Communication Channel *
              </label>
              <HeadlessSelect
                options={NOTIFICATION_CHANNEL_OPTIONS.map(opt => ({
                  value: opt.value,
                  label: opt.label
                }))}
                value={formData.communication_channel || ""}
                onChange={(value) => handleSelectChange("communication_channel", value)}
                placeholder="Select communication channel"
                disabled={saving}
                error={!!errors.communication_channel}
              />
              {errors.communication_channel && (
                <p className="text-red-500 text-xs mt-1">{errors.communication_channel}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gateway Provider *
              </label>
              <HeadlessSelect
                options={SMS_GATEWAY_OPTIONS.map(opt => ({
                  value: opt.value,
                  label: opt.label
                }))}
                value={formData.gateway_provider || ""}
                onChange={(value) => handleSelectChange("gateway_provider", value)}
                placeholder="Select gateway provider"
                disabled={saving}
                error={!!errors.gateway_provider}
              />
              {errors.gateway_provider && (
                <p className="text-red-500 text-xs mt-1">{errors.gateway_provider}</p>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate("/dashboard/sms-routes")}
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
