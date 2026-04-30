import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, Plus } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import Input from "../../../shared/components/ui/Input";
import Checkbox from "../../../shared/components/ui/Checkbox";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { SMSRoute, CreateSMSRouteRequest } from "../types/smsRoute";
import { smsRouteService } from "../services/smsRouteService";
import { useToast } from "../../../contexts/ToastContext";
import { color, tw } from "../../../shared/utils/utils";
import { senderIdService } from "../../configurations/services/senderIdService";
import ConfigurationModal from "../../configurations/components/ConfigurationManager/ConfigurationModal";
import { getSenderIdsApiConfig } from "../../configurations/configs/configurationPageConfigs";
import { useLanguage } from "../../../contexts/LanguageContext";
import { GATEWAY_KEY_OPTIONS } from "../../configurations/configs/ts/gatewayKeyEnum";

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
  const { t } = useLanguage();

  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [route, setRoute] = useState<SMSRoute | null>(null);
  const [allRoutes, setAllRoutes] = useState<SMSRoute[]>([]);
  const [senderIds, setSenderIds] = useState<any[]>([]);
  const [showCreateSenderId, setShowCreateSenderId] = useState(false);

  const [formData, setFormData] = useState<CreateSMSRouteRequest>({
    name: "",
    gateway_provider: undefined,
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
    senderId: "",
    requestMethod: "POST",
    requestFormat: "JSON",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Load route if editing and load all routes for backup selection
  useEffect(() => {
    const loadAllRoutes = async () => {
      try {
        const routes = await smsRouteService.getRoutes();
        setAllRoutes(routes);
      } catch (err) {
        // Silent fail - routes dropdown will be empty
      }
    };

    const loadSenderIds = async () => {
      try {
        const response = await senderIdService.getSenderIds();
        const ids = Array.isArray(response) ? response : response?.data || [];
        setSenderIds(ids);
      } catch (err) {
        // Silent fail
      }
    };

    loadAllRoutes();
    loadSenderIds();

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
          is_active: data.is_active,
          description: data.description,
          backup_route_id: data.backup_route_id,
          use_backup_on_failure: data.use_backup_on_failure,
          retry_attempts: data.retry_attempts,
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

  const handleExtendedFieldChange = (fieldName: string, value: string) => {
    setExtendedFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSaveSenderId = async (formData: Record<string, any>) => {
    try {
      setSaving(true);
      const response = await senderIdService.createSenderId({
        name: formData.name,
        description: formData.description || undefined,
        gateway_key: formData.gateway_key,
        is_active: true,
      });

      const createdId = response.data?.id || response?.id;
      const createdData = response.data || response;

      setSenderIds((prev) => [...prev, createdData]);
      setExtendedFormData((prev) => ({
        ...prev,
        senderId: String(createdId),
      }));

      setShowCreateSenderId(false);
    } finally {
      setSaving(false);
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
              options={GATEWAY_KEY_OPTIONS}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Endpoint
              </label>
              <Input
                placeholder="e.g., https://api.example.com/sms/send"
                value={extendedFormData.apiEndpoint}
                onChange={(value) => handleExtendedFieldChange("apiEndpoint", value)}
                variant="medium"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <Input
                type="password"
                placeholder="••••••••••••••••••••••"
                value={extendedFormData.apiKey}
                onChange={(value) => handleExtendedFieldChange("apiKey", value)}
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
        </div>

        {/* Delivery Configuration Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Delivery Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sender ID
              </label>
              <div className="flex">
                <div className="flex-1" style={{ borderTopRightRadius: "0", borderBottomRightRadius: "0", overflow: "hidden" }}>
                  <HeadlessSelect
                    options={[
                      { value: "", label: "Select Sender ID" },
                      ...(senderIds.map((sender) => ({
                        value: String(sender.id),
                        label: sender.name,
                      })) || []),
                    ]}
                    value={extendedFormData.senderId}
                    onChange={(value) => handleExtendedFieldChange("senderId", value as string)}
                    disabled={saving}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateSenderId(true)}
                  disabled={saving}
                  className="px-3 py-2 text-white rounded-r-md flex items-center justify-center text-sm border-l-0 transition-opacity disabled:opacity-50"
                  style={{
                    backgroundColor: color.primary.action,
                    borderColor: color.primary.action,
                    border: "1px solid",
                  }}
                  title="Create new Sender ID"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Request Method
              </label>
              <HeadlessSelect
                options={[
                  { value: "POST", label: "POST" },
                  { value: "GET", label: "GET" },
                  { value: "PUT", label: "PUT" },
                  { value: "PATCH", label: "PATCH" },
                ]}
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
                options={[
                  { value: "JSON", label: "JSON" },
                  { value: "XML", label: "XML" },
                  { value: "FORM_DATA", label: "Form Data" },
                ]}
                value={extendedFormData.requestFormat}
                onChange={(value) => handleExtendedFieldChange("requestFormat", value as string)}
                disabled={saving}
              />
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
              <div className="space-y-4 mt-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Retry Attempts Before Failover
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
                    disabled={saving}
                  />
                  <p className={`text-xs ${tw.textSecondary} mt-2`}>
                    Number of times to retry this route before using the backup route
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Sender ID Modal */}
        <ConfigurationModal
          isOpen={showCreateSenderId}
          onClose={() => setShowCreateSenderId(false)}
          onSave={handleSaveSenderId}
          isSaving={saving}
          config={getSenderIdsApiConfig(t)}
        />

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
