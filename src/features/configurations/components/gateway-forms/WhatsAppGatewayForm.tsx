import { useState } from "react";
import { Save } from "lucide-react";
import { tw, color, button } from "../../../../shared/utils/utils";
import Input from "../../../../shared/components/ui/Input";
import Checkbox from "../../../../shared/components/ui/Checkbox";
import { WhatsAppGatewayConfig, CreateWhatsAppGatewayConfigRequest } from "../../types/whatsappGatewayConfig";
import HeadlessSelect from "../../../../shared/components/ui/HeadlessSelect";

interface WhatsAppGatewayFormProps {
  initialData?: WhatsAppGatewayConfig;
  onSave: (data: CreateWhatsAppGatewayConfigRequest) => Promise<void>;
  isLoading: boolean;
  onCancel: () => void;
  mode?: "create" | "edit";
  selectedChannel?: string;
  onChannelChange?: (channel: string) => void;
  channelOptions?: { value: string; label: string }[];
}

const WHATSAPP_PROVIDERS = [
  { value: "TWILIO", label: "Twilio" },
  { value: "MESSAGEBIRD", label: "MessageBird" },
];

export default function WhatsAppGatewayForm({
  initialData,
  onSave,
  isLoading,
  onCancel,
  mode = "edit",
  selectedChannel,
  onChannelChange,
  channelOptions = [],
}: WhatsAppGatewayFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    provider_type: initialData?.provider_type || "TWILIO",
    is_active: initialData?.is_active ?? true,
    credentials: {
      api_key: initialData?.credentials.api_key || "",
      api_secret: initialData?.credentials.api_secret || "",
      business_account_id: initialData?.credentials.business_account_id || "",
      webhook_url: initialData?.credentials.webhook_url || "",
      webhook_verify_token: initialData?.credentials.webhook_verify_token || "",
      phone_number_id: initialData?.credentials.phone_number_id || "",
      display_name: initialData?.credentials.display_name || "",
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData as CreateWhatsAppGatewayConfigRequest);
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
                WhatsApp Provider *
              </label>
              <HeadlessSelect
                value={formData.provider_type}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, provider_type: value }))
                }
                options={WHATSAPP_PROVIDERS}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Configuration Name *
            </label>
            <Input
              placeholder="e.g., Twilio WhatsApp Business"
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
        <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>WhatsApp API Credentials</h2>
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
              Business Account ID *
            </label>
            <Input
              type="text"
              placeholder="e.g., 102334567890123456"
              value={formData.credentials.business_account_id}
              onChange={(value) => updateCredential("business_account_id", value)}
              variant="medium"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number ID *
            </label>
            <Input
              type="text"
              placeholder="e.g., 1234567890123456"
              value={formData.credentials.phone_number_id}
              onChange={(value) => updateCredential("phone_number_id", value)}
              variant="medium"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Name
            </label>
            <Input
              type="text"
              placeholder="e.g., Company Support"
              value={formData.credentials.display_name}
              onChange={(value) => updateCredential("display_name", value)}
              variant="medium"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook URL
            </label>
            <Input
              type="url"
              placeholder="e.g., https://company.com/webhooks/whatsapp"
              value={formData.credentials.webhook_url}
              onChange={(value) => updateCredential("webhook_url", value)}
              variant="medium"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook Verify Token
            </label>
            <Input
              type="password"
              placeholder="Webhook verification token"
              value={formData.credentials.webhook_verify_token}
              onChange={(value) => updateCredential("webhook_verify_token", value)}
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
          className="text-sm font-medium rounded-md transition-colors disabled:opacity-60"
          style={{
            backgroundColor: button.bordered.background,
            color: button.bordered.color,
            border: button.bordered.border,
            padding: `${button.bordered.paddingY} ${button.bordered.paddingX}`,
          }}
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
