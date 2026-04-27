import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import Input from "../../../shared/components/ui/Input";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { WhatsAppRoute, CreateWhatsAppRouteRequest } from "../types/whatsappRoute";
import { whatsappRouteService } from "../services/whatsappRouteService";
import { WHATSAPP_GATEWAY_OPTIONS, MESSAGE_TEMPLATE_OPTIONS } from "../constants/whatsappRouteEnums";
import { useToast } from "../../../contexts/ToastContext";
import { color, tw } from "../../../shared/utils/utils";

const STATUS_OPTIONS = [
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

interface WhatsAppRouteFormPageProps {
  mode: "create" | "edit";
}

export default function WhatsAppRouteFormPage({ mode }: WhatsAppRouteFormPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [route, setRoute] = useState<WhatsAppRoute | null>(null);

  const [formData, setFormData] = useState<CreateWhatsAppRouteRequest>({
    name: "",
    gateway_provider: undefined,
    is_active: true,
    description: "",
  });

  const [extendedFormData, setExtendedFormData] = useState({
    apiEndpoint: "",
    accessToken: "",
    apiSecret: "",
    businessAccountId: "",
    businessPhoneNumber: "",
    webhookUrl: "",
    templateSupport: "false",
    qualityThreshold: "50",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (mode === "edit" && id) {
      loadRoute();
    }
  }, [mode, id]);

  const loadRoute = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await whatsappRouteService.getRouteById(Number(id));
      if (data) {
        setRoute(data);
        setFormData({
          name: data.name,
          gateway_provider: data.gateway_provider,
          is_active: data.is_active,
          description: data.description,
        });
      }
    } catch (err) {
      showError("Error", "Failed to load WhatsApp route");
      navigate("/dashboard/whatsapp-routes");
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
        await whatsappRouteService.updateRoute(Number(id), {
          ...formData,
        });
        success("Success", "WhatsApp route updated successfully");
      } else {
        await whatsappRouteService.createRoute(formData);
        success("Success", "WhatsApp route created successfully");
      }

      navigate("/dashboard/whatsapp-routes");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save route";
      showError("Error", errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (fieldName: keyof CreateWhatsAppRouteRequest) => (value: string | number) => {
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

  const handleExtendedFieldChange = (fieldName: string, value: string) => {
    setExtendedFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className={`${tw.textMuted} font-medium mt-4`}>Loading WhatsApp route...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <BackButton fallbackTo="/dashboard/whatsapp-routes" showBreadcrumb={true} currentLabel={mode === "create" ? "Create WhatsApp Route" : "Edit WhatsApp Route"} />

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
                  placeholder="e.g., Meta WhatsApp Business"
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

        {/* Gateway Configuration Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Gateway Configuration</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gateway Provider *
            </label>
            <HeadlessSelect
              options={WHATSAPP_GATEWAY_OPTIONS.map(opt => ({
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

        {/* API Configuration Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>API Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Endpoint
              </label>
              <Input
                placeholder="e.g., https://graph.instagram.com/v18.0"
                value={extendedFormData.apiEndpoint}
                onChange={(value) => handleExtendedFieldChange("apiEndpoint", value)}
                variant="medium"
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Token
                </label>
                <Input
                  type="password"
                  placeholder="••••••••••••••••••••••"
                  value={extendedFormData.accessToken}
                  onChange={(value) => handleExtendedFieldChange("accessToken", value)}
                  variant="medium"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Secret
                </label>
                <Input
                  type="password"
                  placeholder="Your API secret"
                  value={extendedFormData.apiSecret}
                  onChange={(value) => handleExtendedFieldChange("apiSecret", value)}
                  variant="medium"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Account ID
                </label>
                <Input
                  placeholder="e.g., 123456789"
                  value={extendedFormData.businessAccountId}
                  onChange={(value) => handleExtendedFieldChange("businessAccountId", value)}
                  variant="medium"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Phone Number
                </label>
                <Input
                  placeholder="e.g., +1234567890"
                  value={extendedFormData.businessPhoneNumber}
                  onChange={(value) => handleExtendedFieldChange("businessPhoneNumber", value)}
                  variant="medium"
                  disabled={saving}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Webhook URL
              </label>
              <Input
                placeholder="e.g., https://api.example.com/webhooks/whatsapp"
                value={extendedFormData.webhookUrl}
                onChange={(value) => handleExtendedFieldChange("webhookUrl", value)}
                variant="medium"
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {/* Delivery Configuration Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Delivery Configuration</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Template Support
                </label>
                <HeadlessSelect
                  options={MESSAGE_TEMPLATE_OPTIONS.map(opt => ({
                    value: opt.value,
                    label: opt.label
                  }))}
                  value={extendedFormData.templateSupport}
                  onChange={(value) => handleExtendedFieldChange("templateSupport", value as string)}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality Threshold (%)
                </label>
                <Input
                  type="number"
                  placeholder="50"
                  value={extendedFormData.qualityThreshold}
                  onChange={(value) => handleExtendedFieldChange("qualityThreshold", value)}
                  variant="medium"
                  min="0"
                  max="100"
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate("/dashboard/whatsapp-routes")}
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
