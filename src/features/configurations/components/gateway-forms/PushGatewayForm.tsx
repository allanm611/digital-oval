import { useState } from "react";
import { Save } from "lucide-react";
import { tw, color, button } from "../../../../shared/utils/utils";
import Input from "../../../../shared/components/ui/Input";
import Checkbox from "../../../../shared/components/ui/Checkbox";
import { PushGatewayConfig, CreatePushGatewayConfigRequest } from "../../types/pushGatewayConfig";
import HeadlessSelect from "../../../../shared/components/ui/HeadlessSelect";

interface PushGatewayFormProps {
  initialData?: PushGatewayConfig;
  onSave: (data: CreatePushGatewayConfigRequest) => Promise<void>;
  isLoading: boolean;
  onCancel: () => void;
  mode?: "create" | "edit";
  selectedChannel?: string;
  onChannelChange?: (channel: string) => void;
  channelOptions?: { value: string; label: string }[];
}

const PUSH_PROVIDERS = [
  { value: "FIREBASE", label: "Firebase (Google)" },
  { value: "APNS", label: "Apple APNS" },
];

export default function PushGatewayForm({
  initialData,
  onSave,
  isLoading,
  onCancel,
  mode = "edit",
  selectedChannel,
  onChannelChange,
  channelOptions = [],
}: PushGatewayFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    provider_type: initialData?.provider_type || "FIREBASE",
    is_active: initialData?.is_active ?? true,
    credentials: {
      server_key: initialData?.credentials.server_key || "",
      sender_id: initialData?.credentials.sender_id || "",
      project_id: initialData?.credentials.project_id || "",
      private_key: initialData?.credentials.private_key || "",
      client_email: initialData?.credentials.client_email || "",
      certificate_path: initialData?.credentials.certificate_path || "",
      certificate_password: initialData?.credentials.certificate_password || "",
      team_id: initialData?.credentials.team_id || "",
      key_id: initialData?.credentials.key_id || "",
      bundle_id: initialData?.credentials.bundle_id || "",
    },
  });

  const [provider, setProvider] = useState(formData.provider_type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData as CreatePushGatewayConfigRequest);
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
                Push Notification Provider *
              </label>
              <HeadlessSelect
                value={provider}
                onChange={(value) => {
                  setProvider(value);
                  setFormData((prev) => ({ ...prev, provider_type: value }));
                }}
                options={PUSH_PROVIDERS}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Configuration Name *
            </label>
            <Input
              placeholder="e.g., Firebase Production"
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

      {provider === "FIREBASE" && (
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Firebase Credentials</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Server Key *
                </label>
                <Input
                  type="password"
                  placeholder="Enter Firebase server key"
                  value={formData.credentials.server_key}
                  onChange={(value) => updateCredential("server_key", value)}
                  variant="medium"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sender ID *
                </label>
                <Input
                  type="text"
                  placeholder="e.g., 123456789012"
                  value={formData.credentials.sender_id}
                  onChange={(value) => updateCredential("sender_id", value)}
                  variant="medium"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project ID *
              </label>
              <Input
                type="text"
                placeholder="e.g., company-firebase-project"
                value={formData.credentials.project_id}
                onChange={(value) => updateCredential("project_id", value)}
                variant="medium"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Private Key *
              </label>
              <textarea
                value={formData.credentials.private_key}
                onChange={(e) => updateCredential("private_key", e.target.value)}
                placeholder="Paste Firebase private key JSON"
                rows={4}
                className={`w-full px-3 py-2 text-sm font-mono border border-gray-300 ${tw.rounded} focus:outline-none`}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Email *
              </label>
              <Input
                type="email"
                placeholder="e.g., firebase-adminsdk@project.iam.gserviceaccount.com"
                value={formData.credentials.client_email}
                onChange={(value) => updateCredential("client_email", value)}
                variant="medium"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      )}

      {provider === "APNS" && (
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Apple APNS Credentials</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certificate Path *
              </label>
              <Input
                type="text"
                placeholder="e.g., /certs/apns_production.p8"
                value={formData.credentials.certificate_path}
                onChange={(value) => updateCredential("certificate_path", value)}
                variant="medium"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certificate Password
              </label>
              <Input
                type="password"
                placeholder="Certificate password (if encrypted)"
                value={formData.credentials.certificate_password}
                onChange={(value) => updateCredential("certificate_password", value)}
                variant="medium"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team ID *
              </label>
              <Input
                type="text"
                placeholder="e.g., ABCD123456"
                value={formData.credentials.team_id}
                onChange={(value) => updateCredential("team_id", value)}
                variant="medium"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key ID *
              </label>
              <Input
                type="text"
                placeholder="e.g., XYZKEY1234"
                value={formData.credentials.key_id}
                onChange={(value) => updateCredential("key_id", value)}
                variant="medium"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bundle ID *
              </label>
              <Input
                type="text"
                placeholder="e.g., com.company.app"
                value={formData.credentials.bundle_id}
                onChange={(value) => updateCredential("bundle_id", value)}
                variant="medium"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      )}

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
