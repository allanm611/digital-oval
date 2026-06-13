import { useState, useEffect } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { SMSRoute, CreateSMSRouteRequest } from "../types/smsRoute";
import { NOTIFICATION_CHANNEL_OPTIONS, SMS_GATEWAY_OPTIONS } from "../constants/smsRouteEnums";
import { color, tw, components } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";

interface SMSRouteFormProps {
  route?: SMSRoute | null;
  onSubmit: (data: CreateSMSRouteRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function SMSRouteForm({
  route,
  onSubmit,
  onCancel,
  isLoading = false,
}: SMSRouteFormProps) {
  const { success, error } = useToast();
  const [formData, setFormData] = useState<CreateSMSRouteRequest>({
    name: "",
    gateway_provider: undefined,
    communication_channel: undefined,
    is_active: true,
    description: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (route) {
      setFormData({
        name: route.name,
        gateway_provider: route.gateway_provider,
        communication_channel: route.communication_channel,
        is_active: route.is_active,
        description: route.description,
      });
    }
  }, [route]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Route name is required";
    }
    if (!formData.gateway_provider) {
      newErrors.gateway_provider = "Gateway provider is required";
    }
    if (!formData.communication_channel) {
      newErrors.communication_channel = "Communication channel is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      error("Validation Error", "Please fill in all required fields");
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      error("Error", err instanceof Error ? err.message : "Failed to save route");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (fieldName: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value || undefined,
    }));

    // Clear error for this field
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className={`p-2 hover:${tw.surfaceSecondary} ${tw.rounded} transition-colors`}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: color.primary.accent }} />
        </button>
        <div>
          <h2 className={`text-2xl font-semibold ${tw.textPrimary}`}>
            {route ? "Edit SMS Route" : "Create New SMS Route"}
          </h2>
          <p className={`text-sm ${tw.textSecondary} mt-1`}>
            {route
              ? "Update the SMS route configuration"
              : "Configure a new SMS communication route"}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className={`${components.card.surface} p-6`}>
        <div className="space-y-6">
          {/* Row 1: Name */}
          <div>
            <Input
              label="Route Name"
              placeholder="e.g., Primary SMS Gateway"
              value={formData.name}
              onChange={(value) => handleInputChange({ target: { name: "name", value } } as any)}
              hasError={!!errors.name}
             
              disabled={isLoading}
              required
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Row 2: Communication Channel and Gateway Provider */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <HeadlessSelect
                label="Communication Channel"
                options={NOTIFICATION_CHANNEL_OPTIONS.map(opt => ({
                  value: opt.value,
                  label: opt.label
                }))}
                value={formData.communication_channel || ""}
                onChange={(value) => handleSelectChange("communication_channel", value)}
                placeholder="Select communication channel"
                disabled={isLoading}
                error={!!errors.communication_channel}
              />
              {errors.communication_channel && (
                <p className="text-red-500 text-sm mt-1">{errors.communication_channel}</p>
              )}
            </div>

            <div>
              <HeadlessSelect
                label="Gateway Provider"
                options={SMS_GATEWAY_OPTIONS.map(opt => ({
                  value: opt.value,
                  label: opt.label
                }))}
                value={formData.gateway_provider || ""}
                onChange={(value) => handleSelectChange("gateway_provider", value)}
                placeholder="Select gateway provider"
                disabled={isLoading}
                error={!!errors.gateway_provider}
              />
              {errors.gateway_provider && (
                <p className="text-red-500 text-sm mt-1">{errors.gateway_provider}</p>
              )}
            </div>
          </div>

          {/* Row 3: Status */}
          <div>
            <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
              Status
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active || false}
                  onChange={(value) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                  disabled={isLoading}
                  className="w-4 h-4"
                />
                <span className={`text-sm ${tw.textPrimary}`}>Active</span>
              </label>
            </div>
          </div>

          {/* Row 4: Description */}
          <div>
            <Textarea
              label="Description"
              value={formData.description || ""}
              onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
              placeholder="Add notes about this route..."
              rows={4}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderColor: color.border.default }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className={`px-6 py-2 text-sm font-medium border ${tw.rounded} transition-colors`}
            style={{
              borderColor: color.border.default,
              color: tw.textPrimary,
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className={`inline-flex items-center gap-2 px-6 py-2 text-sm font-medium ${tw.textAction} ${tw.rounded} transition-colors`}
            style={{
              backgroundColor: color.primary.action,
              opacity: isLoading ? 0.6 : 1,
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            <Save className="w-4 h-4" />
            {isLoading ? "Saving..." : "Save Route"}
          </button>
        </div>
      </form>
    </div>
  );
}
