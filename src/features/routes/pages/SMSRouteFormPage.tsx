import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { SMSRoute, CreateSMSRouteRequest } from "../types/smsRoute";
import { smsRouteService } from "../services/smsRouteService";
import { useToast } from "../../../contexts/ToastContext";
import { color, tw } from "../../../shared/utils/utils";

// Sender IDs options
const SENDER_ID_OPTIONS = [
  { label: "Effortel", value: "1" },
  { label: "Equitel", value: "3" },
  { label: "EquitelKE", value: "4" },
  { label: "EquitelAlert", value: "5" },
  { label: "EquitelPromo", value: "6" },
];

const REQUEST_METHOD_OPTIONS = [
  { label: "POST", value: "POST" },
  { label: "GET", value: "GET" },
  { label: "PUT", value: "PUT" },
  { label: "PATCH", value: "PATCH" },
  { label: "DELETE", value: "DELETE" },
];

const REQUEST_FORMAT_OPTIONS = [
  { label: "JSON", value: "JSON" },
  { label: "XML", value: "XML" },
  { label: "Form Data", value: "FORM_DATA" },
];

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
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
    gatewayType: "",
    apiEndpoint: "",
    apiKey: "",
    apiSecret: "",
    senderId: "",
    requestMethod: "POST",
    requestFormat: "JSON",
    priority: 1,
    status: "active",
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
          gatewayType: data.gatewayType,
          apiEndpoint: data.apiEndpoint,
          apiKey: data.apiKey,
          apiSecret: data.apiSecret,
          senderId: data.senderId,
          requestMethod: data.requestMethod,
          requestFormat: data.requestFormat,
          priority: data.priority,
          status: data.status,
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
    if (!formData.gatewayType.trim()) {
      newErrors.gatewayType = "Gateway type is required";
    }
    if (!formData.apiEndpoint.trim()) {
      newErrors.apiEndpoint = "API endpoint is required";
    }
    if (!formData.apiKey.trim()) {
      newErrors.apiKey = "API key is required";
    }
    if (!formData.apiSecret.trim()) {
      newErrors.apiSecret = "API secret is required";
    }
    if (!formData.senderId) {
      newErrors.senderId = "Sender ID is required";
    }
    if (formData.priority < 1 || formData.priority > 999) {
      newErrors.priority = "Priority must be between 1 and 999";
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
        await smsRouteService.updateRoute({
          ...formData,
          id: Number(id),
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: parseInt(value, 10),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (name: string, value: string | number | undefined) => {
    setFormData((prev) => ({
      ...prev,
      [name]: String(value),
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
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
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Primary SMS Gateway"
                  className={`w-full px-3 py-2 text-sm border ${tw.rounded} focus:outline-none ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={saving}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gateway Type *
                </label>
                <input
                  type="text"
                  name="gatewayType"
                  value={formData.gatewayType}
                  onChange={handleChange}
                  placeholder="e.g., Twilio, AWS SNS, Custom"
                  className={`w-full px-3 py-2 text-sm border ${tw.rounded} focus:outline-none ${
                    errors.gatewayType ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={saving}
                />
                {errors.gatewayType && (
                  <p className="text-red-500 text-xs mt-1">{errors.gatewayType}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add notes about this route..."
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none`}
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <HeadlessSelect
                options={STATUS_OPTIONS}
                value={formData.status || "active"}
                onChange={(value) => handleSelectChange("status", value || "active")}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {/* API Configuration Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>API Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Endpoint *
              </label>
              <input
                type="url"
                name="apiEndpoint"
                value={formData.apiEndpoint}
                onChange={handleChange}
                placeholder="https://api.gateway.com/sms"
                className={`w-full px-3 py-2 text-sm border ${tw.rounded} focus:outline-none ${
                  errors.apiEndpoint ? "border-red-500" : "border-gray-300"
                }`}
                disabled={saving}
              />
              {errors.apiEndpoint && (
                <p className="text-red-500 text-xs mt-1">{errors.apiEndpoint}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key *
                </label>
                <input
                  type="password"
                  name="apiKey"
                  value={formData.apiKey}
                  onChange={handleChange}
                  placeholder="Your API key"
                  className={`w-full px-3 py-2 text-sm border ${tw.rounded} focus:outline-none ${
                    errors.apiKey ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={saving}
                />
                {errors.apiKey && <p className="text-red-500 text-xs mt-1">{errors.apiKey}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Secret *
                </label>
                <input
                  type="password"
                  name="apiSecret"
                  value={formData.apiSecret}
                  onChange={handleChange}
                  placeholder="Your API secret"
                  className={`w-full px-3 py-2 text-sm border ${tw.rounded} focus:outline-none ${
                    errors.apiSecret ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={saving}
                />
                {errors.apiSecret && (
                  <p className="text-red-500 text-xs mt-1">{errors.apiSecret}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Configuration Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Delivery Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sender ID *
              </label>
              <HeadlessSelect
                options={SENDER_ID_OPTIONS}
                value={formData.senderId || ""}
                onChange={(value) => handleSelectChange("senderId", value || "")}
                disabled={saving}
              />
              {errors.senderId && <p className="text-red-500 text-xs mt-1">{errors.senderId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Request Method
              </label>
              <HeadlessSelect
                options={REQUEST_METHOD_OPTIONS}
                value={formData.requestMethod || "POST"}
                onChange={(value) => handleSelectChange("requestMethod", value || "POST")}
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Request Format
              </label>
              <HeadlessSelect
                options={REQUEST_FORMAT_OPTIONS}
                value={formData.requestFormat || "JSON"}
                onChange={(value) => handleSelectChange("requestFormat", value || "JSON")}
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <input
                type="number"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                min="1"
                max="999"
                className={`w-full px-4 py-3 text-sm border ${tw.rounded} focus:outline-none border-gray-300`}
                disabled={saving}
              />
              {errors.priority && <p className="text-red-500 text-xs mt-1">{errors.priority}</p>}
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
