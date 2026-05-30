import { useState } from "react";
import { Plus, Trash2, Save, X } from "lucide-react";
import Input from "../../../../shared/components/ui/Input";
import { color, tw } from "../../../../shared/utils/utils";
import HeadlessSelect from "../../../../shared/components/ui/HeadlessSelect";

interface GenericGatewayFormProps {
  onSave: (data: any) => void;
  initialData?: any;
  isLoading: boolean;
  onCancel: () => void;
  mode: "create" | "edit";
  selectedChannel: string;
  onChannelChange: (value: string) => void;
  channelOptions: { value: string; label: string }[];
}

export default function GenericGatewayForm({
  onSave,
  initialData,
  isLoading,
  onCancel,
  mode,
  selectedChannel,
  onChannelChange,
  channelOptions,
}: GenericGatewayFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    provider_type: initialData?.provider_type || "",
    is_active: initialData?.is_active !== false,
    credentials: initialData?.credentials || {},
  });

  const [credentials, setCredentials] = useState<{ key: string; value: string }[]>(
    Object.entries(formData.credentials || {}).map(([key, value]) => ({
      key,
      value: String(value),
    }))
  );

  const [newCredential, setNewCredential] = useState({ key: "", value: "" });

  const addCredential = () => {
    if (newCredential.key.trim()) {
      setCredentials([...credentials, { ...newCredential }]);
      setNewCredential({ key: "", value: "" });
    }
  };

  const removeCredential = (index: number) => {
    setCredentials(credentials.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const credentialsObj = credentials.reduce(
      (acc, cred) => {
        acc[cred.key] = cred.value;
        return acc;
      },
      {} as Record<string, string>
    );

    const data = {
      name: formData.name,
      description: formData.description,
      provider_type: formData.provider_type,
      is_active: formData.is_active,
      credentials: credentialsObj,
      channel_type: selectedChannel,
    };

    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div
        className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
      >
        <h2 className={`text-sm font-semibold ${tw.textPrimary} mb-6`}>
          Basic Information
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`text-sm font-medium ${tw.textMuted} mb-2 block`}>
                Communication Channel
              </label>
              <HeadlessSelect
                value={selectedChannel}
                onChange={onChannelChange}
                options={channelOptions}
                placeholder="Select channel"
              />
            </div>
            <div>
              <label className={`text-sm font-medium ${tw.textMuted} mb-2 block`}>
                Provider
              </label>
              <Input
                value={formData.provider_type}
                onChange={(value) =>
                  setFormData({ ...formData, provider_type: value })
                }
                placeholder="Provider name"
              />
            </div>
          </div>

          <div>
            <label className={`text-sm font-medium ${tw.textMuted} mb-2 block`}>
              Configuration Name
            </label>
            <Input
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              placeholder="e.g., SendGrid Production"
              required
            />
          </div>

          <div>
            <label className={`text-sm font-medium ${tw.textMuted} mb-2 block`}>
              Description
            </label>
            <Input
              value={formData.description}
              onChange={(value) =>
                setFormData({ ...formData, description: value })
              }
              placeholder="Optional description"
            />
          </div>
        </div>
      </div>

      {/* Credentials */}
      <div
        className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
      >
        <h2 className={`text-sm font-semibold ${tw.textPrimary} mb-6`}>
          Credentials
        </h2>

        <div className="space-y-4">
          {credentials.length > 0 && (
            <div className="space-y-3">
              {credentials.map((cred, index) => (
                <div
                  key={index}
                  className="flex items-end gap-3 p-3 border border-gray-200 rounded bg-gray-50"
                >
                  <div className="flex-1">
                    <p className={`text-xs font-medium ${tw.textMuted} mb-1`}>
                      Key
                    </p>
                    <p className={`text-sm ${tw.textPrimary} font-mono`}>
                      {cred.key}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-medium ${tw.textMuted} mb-1`}>
                      Value
                    </p>
                    <p className={`text-sm ${tw.textPrimary} break-words`}>
                      {cred.value.length > 30
                        ? cred.value.substring(0, 27) + "..."
                        : cred.value}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCredential(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                    title="Remove credential"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 p-4 border border-dashed border-gray-300 rounded bg-gray-50">
            <div className="grid grid-cols-2 gap-3">
              <Input
                value={newCredential.key}
                onChange={(value) =>
                  setNewCredential({ ...newCredential, key: value })
                }
                placeholder="Credential key"
              />
              <Input
                value={newCredential.value}
                onChange={(value) =>
                  setNewCredential({ ...newCredential, value: value })
                }
                placeholder="Credential value"
              />
            </div>
            <button
              type="button"
              onClick={addCredential}
              disabled={!newCredential.key || !newCredential.value || isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-white rounded transition"
              style={{
                backgroundColor: !newCredential.key || !newCredential.value ? "#ccc" : color.primary.action,
                opacity: !newCredential.key || !newCredential.value ? 0.6 : 1,
              }}
            >
              <Plus size={16} />
              Add Credential
            </button>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-6 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !formData.name}
          className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-60"
          style={{ backgroundColor: color.primary.action }}
        >
          {isLoading ? "Saving..." : mode === "edit" ? "Update Configuration" : "Save Configuration"}
        </button>
      </div>
    </form>
  );
}
