import { useState } from "react";
import { Save } from "lucide-react";
import { tw, color, button } from "../../../../shared/utils/utils";
import Input from "../../../../shared/components/ui/Input";
import Checkbox from "../../../../shared/components/ui/Checkbox";
import { EmailGatewayConfig, CreateEmailGatewayConfigRequest } from "../../types/emailGatewayConfig";
import { EMAIL_GATEWAY_OPTIONS } from "../../../routes/constants/emailRouteEnums";
import HeadlessSelect from "../../../../shared/components/ui/HeadlessSelect";

interface EmailGatewayFormProps {
  initialData?: EmailGatewayConfig;
  onSave: (data: CreateEmailGatewayConfigRequest) => Promise<void>;
  isLoading: boolean;
  onCancel: () => void;
  mode?: "create" | "edit";
  selectedChannel?: string;
  onChannelChange?: (channel: string) => void;
  channelOptions?: { value: string; label: string }[];
}

export default function EmailGatewayForm({
  initialData,
  onSave,
  isLoading,
  onCancel,
  mode = "edit",
  selectedChannel,
  onChannelChange,
  channelOptions = [],
}: EmailGatewayFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    provider_type: initialData?.provider_type || "SENDGRID",
    is_active: initialData?.is_active ?? true,
    credentials: {
      smtp_host: initialData?.credentials.smtp_host || "",
      smtp_port: initialData?.credentials.smtp_port || 587,
      smtp_username: initialData?.credentials.smtp_username || "",
      smtp_password: initialData?.credentials.smtp_password || "",
      from_address: initialData?.credentials.from_address || "",
      tls_enabled: initialData?.credentials.tls_enabled ?? true,
      reply_to_address: initialData?.credentials.reply_to_address || "",
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData as CreateEmailGatewayConfigRequest);
  };

  const updateCredential = (key: string, value: any) => {
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
                Email Provider *
              </label>
              <HeadlessSelect
                value={formData.provider_type}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, provider_type: value }))
                }
                options={EMAIL_GATEWAY_OPTIONS}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Configuration Name *
            </label>
            <Input
              placeholder="e.g., SendGrid Production"
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
        <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>SMTP Credentials</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Host *
              </label>
              <Input
                type="text"
                placeholder="e.g., smtp.sendgrid.net"
                value={formData.credentials.smtp_host}
                onChange={(value) => updateCredential("smtp_host", value)}
                variant="medium"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Port *
              </label>
              <Input
                type="number"
                value={String(formData.credentials.smtp_port)}
                onChange={(value) => updateCredential("smtp_port", parseInt(value))}
                variant="medium"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Username *
              </label>
              <Input
                type="text"
                placeholder="e.g., apikey"
                value={formData.credentials.smtp_username}
                onChange={(value) => updateCredential("smtp_username", value)}
                variant="medium"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Password *
              </label>
              <Input
                type="password"
                placeholder="Enter SMTP password"
                value={formData.credentials.smtp_password}
                onChange={(value) => updateCredential("smtp_password", value)}
                variant="medium"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Address *
              </label>
              <Input
                type="email"
                placeholder="e.g., noreply@company.com"
                value={formData.credentials.from_address}
                onChange={(value) => updateCredential("from_address", value)}
                variant="medium"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reply-To Address
              </label>
              <Input
                type="email"
                placeholder="e.g., support@company.com"
                value={formData.credentials.reply_to_address}
                onChange={(value) => updateCredential("reply_to_address", value)}
                variant="medium"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <Checkbox
              checked={formData.credentials.tls_enabled}
              onChange={(e) => updateCredential("tls_enabled", e.target.checked)}
              id="tls-enabled"
            />
            <label htmlFor="tls-enabled" className="text-sm text-gray-700">
              Enable TLS
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-60"
          style={{ backgroundColor: color.primary.action }}
        >
          {isLoading ? (mode === "create" ? "Creating..." : "Updating...") : (mode === "create" ? "Create" : "Update")}
        </button>

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
      </div>
    </form>
  );
}
