import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import Input from "../../../shared/components/ui/Input";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../shared/components/ui/Checkbox";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { SMSRoute, CreateSMSRouteRequest } from "../types/smsRoute";
import { ussdRouteService } from "../services/ussdRouteService";
import { useToast } from "../../../contexts/ToastContext";
import { color, tw } from "../../../shared/utils/utils";

const STATUS_OPTIONS = [
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

const USSD_GATEWAY_OPTIONS = [
  { value: "INFOBIP", label: "Infobip" },
  { value: "TWILIO", label: "Twilio" },
  { value: "JAMBAZ", label: "Jambaz" },
  { value: "LIQUID_INTELLIGENT", label: "Liquid Intelligent" },
  { value: "AFRICASTALKING", label: "AfricasTalking" },
  { value: "INTERNAL", label: "Internal Gateway" },
];

const ENCODING_OPTIONS = [
  { value: "UTF-8", label: "UTF-8" },
  { value: "GSM-7", label: "GSM-7" },
  { value: "UCS2", label: "UCS2" },
];

const REQUEST_METHOD_OPTIONS = [
  { value: "POST", label: "POST" },
  { value: "GET", label: "GET" },
];

const REQUEST_FORMAT_OPTIONS = [
  { value: "JSON", label: "JSON" },
  { value: "XML", label: "XML" },
  { value: "FORM_DATA", label: "Form Data" },
];

export default function CreateEditUSSDRoutePage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [route, setRoute] = useState<SMSRoute | null>(null);
  const [allRoutes, setAllRoutes] = useState<SMSRoute[]>([]);

  const [formData, setFormData] = useState<CreateSMSRouteRequest>({
    name: "",
    gateway_provider: undefined,
    communication_channel: "USSD",
    is_active: true,
    description: "",
    backup_route_id: undefined,
    use_backup_on_failure: false,
    retry_attempts: 3,
  });

  const [extendedFormData, setExtendedFormData] = useState({
    apiEndpoint: "",
    apiKey: "",
    apiSecret: "",
    ussdCode: "",
    networkCode: "",
    sessionTimeout: "60",
    encoding: "UTF-8",
    requestMethod: "POST",
    requestFormat: "JSON",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Load route if editing and load all routes for backup selection
  useEffect(() => {
    const loadAllRoutes = async () => {
      try {
        const routes = await ussdRouteService.getAllRoutes();
        setAllRoutes(routes);
      } catch (err) {
        // Silent fail - routes dropdown will be empty
      }
    };

    loadAllRoutes();

    if (id) {
      loadRoute();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadRoute = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await ussdRouteService.getRouteById(Number(id));
      if (data) {
        setRoute(data);
        setFormData({
          name: data.name,
          gateway_provider: data.gateway_provider,
          communication_channel: data.communication_channel || "USSD",
          is_active: data.is_active,
          description: data.description,
          backup_route_id: data.backup_route_id,
          use_backup_on_failure: data.use_backup_on_failure,
          retry_attempts: data.retry_attempts || 3,
        });
      }
    } catch (err) {
      showError("Error", "Failed to load USSD route");
      navigate("/dashboard/ussd-routes");
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
    if (!extendedFormData.apiEndpoint.trim()) {
      newErrors.apiEndpoint = "API endpoint is required";
    }
    if (!extendedFormData.apiKey.trim()) {
      newErrors.apiKey = "API key is required";
    }
    if (!extendedFormData.ussdCode.trim()) {
      newErrors.ussdCode = "USSD code is required";
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

      if (id) {
        await ussdRouteService.updateRoute(Number(id), formData);
        success("Success", "USSD route updated successfully");
      } else {
        await ussdRouteService.createRoute(formData);
        success("Success", "USSD route created successfully");
      }

      navigate("/dashboard/ussd-routes");
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

  const handleExtendedFieldChange = (fieldName: string, value: string) => {
    setExtendedFormData((prev) => ({
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className={`${tw.textMuted} font-medium mt-4`}>Loading USSD route...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <BackButton
        fallbackTo="/dashboard/ussd-routes"
        showBreadcrumb={true}
        currentLabel={id ? "Edit USSD Route" : "Create USSD Route"}
      />

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
                  placeholder="e.g., Primary USSD Gateway"
                  value={formData.name}
                  onChange={handleInputChange("name")}
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
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gateway Provider *
              </label>
              <HeadlessSelect
                options={USSD_GATEWAY_OPTIONS}
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

        {/* API Configuration Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>API Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Endpoint *
              </label>
              <Input
                placeholder="e.g., https://api.example.com/ussd/send"
                value={extendedFormData.apiEndpoint}
                onChange={(value) => handleExtendedFieldChange("apiEndpoint", value)}
                hasError={!!errors.apiEndpoint}
                variant="medium"
                disabled={saving}
              />
              {errors.apiEndpoint && <p className="text-red-500 text-xs mt-1">{errors.apiEndpoint}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key *
                </label>
                <Input
                  type="password"
                  placeholder="••••••••••••••••••••••"
                  value={extendedFormData.apiKey}
                  onChange={(value) => handleExtendedFieldChange("apiKey", value)}
                  hasError={!!errors.apiKey}
                  variant="medium"
                  disabled={saving}
                />
                {errors.apiKey && <p className="text-red-500 text-xs mt-1">{errors.apiKey}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Secret (Optional)
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
                  Request Method
                </label>
                <HeadlessSelect
                  options={REQUEST_METHOD_OPTIONS}
                  value={extendedFormData.requestMethod}
                  onChange={(value) => handleExtendedFieldChange("requestMethod", value as string)}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Format
                </label>
                <HeadlessSelect
                  options={REQUEST_FORMAT_OPTIONS}
                  value={extendedFormData.requestFormat}
                  onChange={(value) => handleExtendedFieldChange("requestFormat", value as string)}
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        </div>

        {/* USSD-Specific Configuration Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>USSD Configuration</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  USSD Code *
                </label>
                <Input
                  placeholder="e.g., *123#"
                  value={extendedFormData.ussdCode}
                  onChange={(value) => handleExtendedFieldChange("ussdCode", value)}
                  hasError={!!errors.ussdCode}
                  variant="medium"
                  disabled={saving}
                />
                {errors.ussdCode && <p className="text-red-500 text-xs mt-1">{errors.ussdCode}</p>}
                <p className={`text-xs ${tw.textSecondary} mt-1`}>
                  The USSD shortcode users dial to access this service
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Network Code (Optional)
                </label>
                <Input
                  placeholder="e.g., MCC/MNC code"
                  value={extendedFormData.networkCode}
                  onChange={(value) => handleExtendedFieldChange("networkCode", value)}
                  variant="medium"
                  disabled={saving}
                />
                <p className={`text-xs ${tw.textSecondary} mt-1`}>
                  Specific network operator code for routing
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Timeout (seconds)
                </label>
                <Input
                  type="number"
                  placeholder="60"
                  value={extendedFormData.sessionTimeout}
                  onChange={(value) => handleExtendedFieldChange("sessionTimeout", value)}
                  variant="medium"
                  min="10"
                  max="300"
                  disabled={saving}
                />
                <p className={`text-xs ${tw.textSecondary} mt-1`}>
                  Time to keep USSD session active (10-300 seconds)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Encoding
                </label>
                <HeadlessSelect
                  options={ENCODING_OPTIONS}
                  value={extendedFormData.encoding}
                  onChange={(value) => handleExtendedFieldChange("encoding", value as string)}
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Configuration Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Delivery Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Retry Attempts
              </label>
              <Input
                type="number"
                placeholder="3"
                value={String(formData.retry_attempts || 3)}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    retry_attempts: value ? Number(value) : 3,
                  }))
                }
                variant="medium"
                min="1"
                max="10"
                disabled={saving}
              />
              <p className={`text-xs ${tw.textSecondary} mt-2`}>
                Number of times to retry failed USSD requests
              </p>
            </div>
          </div>
        </div>

        {/* Failover Configuration Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Failover Configuration</h2>

          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                id="use_backup_on_failure"
                checked={formData.use_backup_on_failure || false}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({
                    ...prev,
                    use_backup_on_failure: e.target.checked,
                  }))
                }
                disabled={saving}
              />
              <div className="flex-1">
                <span className="block text-sm font-medium text-gray-700">
                  Use backup route if this route fails
                </span>
                <p className={`text-xs ${tw.textSecondary} mt-1`}>
                  Enable automatic failover to a backup route when delivery fails
                </p>
              </div>
            </label>

            {formData.use_backup_on_failure && (
              <div className="space-y-4 mt-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Backup Route
                  </label>
                  <HeadlessSelect
                    options={[
                      { value: "", label: "Select a backup route" },
                      ...(allRoutes
                        .filter((r) => r.id !== (route?.id || formData.backup_route_id))
                        .map((route) => ({
                          value: String(route.id),
                          label: route.name,
                        })) || []),
                    ]}
                    value={String(formData.backup_route_id || "")}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        backup_route_id: value ? Number(value) : undefined,
                      }))
                    }
                    disabled={saving}
                  />
                  <p className={`text-xs ${tw.textSecondary} mt-2`}>
                    This route will be used if the primary route fails
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate("/dashboard/ussd-routes")}
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
            {saving ? "Saving..." : id ? "Update Route" : "Create Route"}
          </button>
        </div>
      </form>
    </div>
  );
}
