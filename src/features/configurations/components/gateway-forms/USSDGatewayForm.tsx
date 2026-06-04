import { useState } from "react";
import { Save } from "lucide-react";
import { tw, color, button, getButtonStyles } from "../../../../shared/utils/utils";
import Input from "../../../../shared/components/ui/Input";
import { USSDGatewayConfig, CreateUSSDGatewayConfigRequest } from "../../types/ussdGatewayConfig";
import HeadlessSelect from "../../../../shared/components/ui/HeadlessSelect";

interface USSDGatewayFormProps {
  initialData?: USSDGatewayConfig;
  onSave: (data: CreateUSSDGatewayConfigRequest) => Promise<void>;
  isLoading: boolean;
  onCancel: () => void;
  mode?: "create" | "edit";
}

const USSD_PROVIDERS = [
  { value: "INFOBIP", label: "Infobip" },
  { value: "TWILIO", label: "Twilio" },
  { value: "JAMBAZ", label: "Jambaz" },
  { value: "LIQUID_INTELLIGENT", label: "Liquid Intelligent" },
  { value: "AFRICASTALKING", label: "AfricasTalking" },
  { value: "INTERNAL", label: "Internal Gateway" },
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

export default function USSDGatewayForm({
  initialData,
  onSave,
  isLoading,
  onCancel,
  mode = "edit",
}: USSDGatewayFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    provider_type: initialData?.provider_type || "INFOBIP",
    is_active: initialData?.is_active ?? true,
    credentials: {
      api_endpoint: initialData?.credentials.api_endpoint || "",
      api_key: initialData?.credentials.api_key || "",
      api_secret: initialData?.credentials.api_secret || "",
      request_method: initialData?.credentials.request_method || "POST",
      request_format: initialData?.credentials.request_format || "JSON",
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData as CreateUSSDGatewayConfigRequest);
  };

  const updateCredential = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      credentials: {
        ...prev.credentials,
        [key]: value,
      },
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
        <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Basic Information</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                USSD Provider *
              </label>
              <HeadlessSelect
                value={formData.provider_type}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, provider_type: value }))
                }
                options={USSD_PROVIDERS}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Configuration Name *
              </label>
              <Input
                placeholder="e.g., Infobip Production"
                value={formData.name}
                onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
                variant="medium"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Add notes about this configuration..."
              rows={3}
              className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none`}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
        <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>API Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Endpoint *
            </label>
            <Input
              type="text"
              placeholder="e.g., https://api.infobip.com/ussd/1/send"
              value={formData.credentials.api_endpoint}
              onChange={(value) => updateCredential("api_endpoint", value)}
              variant="medium"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key *
              </label>
              <Input
                type="password"
                placeholder="••••••••••••••••••••••"
                value={formData.credentials.api_key}
                onChange={(value) => updateCredential("api_key", value)}
                variant="medium"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Secret (Optional)
              </label>
              <Input
                type="password"
                placeholder="••••••••••••••••••••••"
                value={formData.credentials.api_secret}
                onChange={(value) => updateCredential("api_secret", value)}
                variant="medium"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Request Method
              </label>
              <HeadlessSelect
                options={REQUEST_METHOD_OPTIONS}
                value={formData.credentials.request_method || "POST"}
                onChange={(value) => updateCredential("request_method", value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Request Format
              </label>
              <HeadlessSelect
                options={REQUEST_FORMAT_OPTIONS}
                value={formData.credentials.request_format || "JSON"}
                onChange={(value) => updateCredential("request_format", value)}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="transition-colors disabled:opacity-60"
          style={getButtonStyles(button.bordered)}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-60"
          style={{ backgroundColor: color.primary.action }}
        >
          {isLoading ? (mode === "create" ? "Creating..." : "Updating...") : (mode === "create" ? "Create" : "Update")}
        </button>
      </div>
    </form>
  );
}
