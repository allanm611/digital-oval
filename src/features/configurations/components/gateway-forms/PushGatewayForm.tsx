import { useState } from "react";
import { Save } from "lucide-react";
import { tw, color, button, getButtonStyles } from "../../../../shared/utils/utils";
import Input from "../../../../shared/components/ui/Input";
import Textarea from "../../../../shared/components/ui/Textarea";
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
            <Input
              label="Configuration Name *"
              placeholder="e.g., Firebase Production"
              value={formData.name}
              onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}

              disabled={isLoading}
            />
          </div>

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, description: value }))
            }
            placeholder="Add notes about this configuration..."
            rows={3}
            disabled={isLoading}
          />
        </div>
      </div>

      {provider === "FIREBASE" && (
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Firebase Credentials</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  label="Server Key *"
                  type="password"
                  placeholder="Enter Firebase server key"
                  value={formData.credentials.server_key}
                  onChange={(value) => updateCredential("server_key", value)}

                  disabled={isLoading}
                />
              </div>

              <div>
                <Input
                  label="Sender ID *"
                  type="text"
                  placeholder="e.g., 123456789012"
                  value={formData.credentials.sender_id}
                  onChange={(value) => updateCredential("sender_id", value)}

                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <Input
                label="Project ID *"
                type="text"
                placeholder="e.g., company-firebase-project"
                value={formData.credentials.project_id}
                onChange={(value) => updateCredential("project_id", value)}

                disabled={isLoading}
              />
            </div>

            <Textarea
              label="Private Key *"
              value={formData.credentials.private_key}
              onChange={(value) => updateCredential("private_key", value)}
              placeholder="Paste Firebase private key JSON"
              rows={4}
              className="font-mono"
              disabled={isLoading}
            />

            <div>
              <Input
                label="Client Email *"
                type="email"
                placeholder="e.g., firebase-adminsdk@project.iam.gserviceaccount.com"
                value={formData.credentials.client_email}
                onChange={(value) => updateCredential("client_email", value)}

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
              <Input
                label="Certificate Path *"
                type="text"
                placeholder="e.g., /certs/apns_production.p8"
                value={formData.credentials.certificate_path}
                onChange={(value) => updateCredential("certificate_path", value)}

                disabled={isLoading}
              />
            </div>

            <div>
              <Input
                label="Certificate Password"
                type="password"
                placeholder="Certificate password (if encrypted)"
                value={formData.credentials.certificate_password}
                onChange={(value) => updateCredential("certificate_password", value)}

                disabled={isLoading}
              />
            </div>

            <div>
              <Input
                label="Team ID *"
                type="text"
                placeholder="e.g., ABCD123456"
                value={formData.credentials.team_id}
                onChange={(value) => updateCredential("team_id", value)}

                disabled={isLoading}
              />
            </div>

            <div>
              <Input
                label="Key ID *"
                type="text"
                placeholder="e.g., XYZKEY1234"
                value={formData.credentials.key_id}
                onChange={(value) => updateCredential("key_id", value)}

                disabled={isLoading}
              />
            </div>

            <div>
              <Input
                label="Bundle ID *"
                type="text"
                placeholder="e.g., com.company.app"
                value={formData.credentials.bundle_id}
                onChange={(value) => updateCredential("bundle_id", value)}

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
