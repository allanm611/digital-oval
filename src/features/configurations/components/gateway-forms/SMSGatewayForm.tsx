import { useState } from "react";
import { Save } from "lucide-react";
import { tw, color, button, getButtonStyles } from "../../../../shared/utils/utils";
import Input from "../../../../shared/components/ui/Input";
import Checkbox from "../../../../shared/components/ui/Checkbox";
import { SMSGatewayConfig, CreateSMSGatewayConfigRequest } from "../../types/smsGatewayConfig";
import { SMS_GATEWAY_OPTIONS } from "../../../routes/constants/smsRouteEnums";
import HeadlessSelect from "../../../../shared/components/ui/HeadlessSelect";

interface SMSGatewayFormProps {
  initialData?: SMSGatewayConfig;
  onSave: (data: CreateSMSGatewayConfigRequest) => Promise<void>;
  isLoading: boolean;
  onCancel: () => void;
  mode?: "create" | "edit";
  selectedChannel?: string;
  onChannelChange?: (channel: string) => void;
  channelOptions?: { value: string; label: string }[];
}

export default function SMSGatewayForm({
  initialData,
  onSave,
  isLoading,
  onCancel,
  mode = "edit",
  selectedChannel,
  onChannelChange,
  channelOptions = [],
}: SMSGatewayFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    provider_type: initialData?.provider_type || "EXTERNAL_PROVIDER_A",
    is_active: initialData?.is_active ?? true,
    credentials: {
      api_key: initialData?.credentials.api_key || "",
      api_secret: initialData?.credentials.api_secret || "",
      account_sid: initialData?.credentials.account_sid || "",
      phone_number: initialData?.credentials.phone_number || "",
      gateway_url: initialData?.credentials.gateway_url || "",
      messaging_service_id: initialData?.credentials.messaging_service_id || "",
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData as CreateSMSGatewayConfigRequest);
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
          <div className={`grid ${mode === "create" ? "grid-cols-2" : "grid-cols-1"} gap-4`}>
            {mode === "create" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Communication Channel *
                </label>
                <HeadlessSelect
                  options={channelOptions}
                  value={selectedChannel || ""}
                  onChange={(value) => onChannelChange?.(value as string)}
                  disabled={isLoading}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMS Provider *
              </label>
              <HeadlessSelect
                value={formData.provider_type}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, provider_type: value }))
                }
                options={SMS_GATEWAY_OPTIONS}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Configuration Name *
            </label>
            <Input
              placeholder="e.g., Twilio Primary SMS"
              value={formData.name}
              onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
              variant="medium"
              disabled={isLoading}
            />
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
        <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>API Credentials</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key *
              </label>
              <Input
                type="password"
                placeholder="Enter API key"
                value={formData.credentials.api_key}
                onChange={(value) => updateCredential("api_key", value)}
                variant="medium"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Secret
              </label>
              <Input
                type="password"
                placeholder="Enter API secret (if required)"
                value={formData.credentials.api_secret}
                onChange={(value) => updateCredential("api_secret", value)}
                variant="medium"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account SID / Account ID
            </label>
            <Input
              type="text"
              placeholder="e.g., AC1234567890abcdef"
              value={formData.credentials.account_sid}
              onChange={(value) => updateCredential("account_sid", value)}
              variant="medium"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number / Sender ID
            </label>
            <Input
              type="text"
              placeholder="e.g., +1234567890 or Company Name"
              value={formData.credentials.phone_number}
              onChange={(value) => updateCredential("phone_number", value)}
              variant="medium"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gateway URL
            </label>
            <Input
              type="url"
              placeholder="e.g., https://api.gateway.com/sms"
              value={formData.credentials.gateway_url}
              onChange={(value) => updateCredential("gateway_url", value)}
              variant="medium"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Messaging Service ID
            </label>
            <Input
              type="text"
              placeholder="e.g., MG1234567890abcdef (Twilio)"
              value={formData.credentials.messaging_service_id}
              onChange={(value) => updateCredential("messaging_service_id", value)}
              variant="medium"
              disabled={isLoading}
            />
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
