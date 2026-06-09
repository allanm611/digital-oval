import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { CreateSMSRouteRequest, SMSRoute } from "../types/smsRoute";
import { NOTIFICATION_CHANNEL_OPTIONS, SMS_GATEWAY_OPTIONS } from "../constants/smsRouteEnums";
import { smsRouteService } from "../services/smsRouteService";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { color, tw } from "../../../shared/utils/utils";

interface SMSRouteCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRoute?: SMSRoute | null;
  onSuccess?: (route: SMSRoute) => void;
}

export default function SMSRouteCreateModal({
  isOpen,
  onClose,
  editingRoute,
  onSuccess,
}: SMSRouteCreateModalProps) {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<CreateSMSRouteRequest>({
    name: "",
    description: "",
    gateway_provider: undefined,
    communication_channel: undefined,
    is_active: true,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const isEditMode = !!editingRoute;

  useEffect(() => {
    if (!isOpen) return;

    if (editingRoute) {
      setFormData({
        name: editingRoute.name || "",
        description: editingRoute.description || "",
        gateway_provider: editingRoute.gateway_provider,
        communication_channel: editingRoute.communication_channel,
        is_active: editingRoute.is_active,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        gateway_provider: undefined,
        communication_channel: undefined,
        is_active: true,
      });
    }

    setErrors({});
  }, [editingRoute, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Route name is required";
    }
    if (!formData.gateway_provider) {
      newErrors.gateway_provider = "Gateway provider is required";
    }
    // if (!formData.communication_channel) {
    //   newErrors.communication_channel = "Communication channel is required";
    // }

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
      setLoading(true);
      const route =
        isEditMode && editingRoute
          ? await smsRouteService.updateRoute(editingRoute.id, formData)
          : await smsRouteService.createRoute(formData);

      success(
        "Success",
        `SMS route "${formData.name}" ${isEditMode ? "updated" : "created"} successfully`,
      );

      if (onSuccess) {
        onSuccess(route);
      }

      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : `Failed to ${isEditMode ? "update" : "create"} route`;
      showError("Error", extractBackendError(error, "Error. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error
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

    // Clear error
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className={`text-lg font-bold ${tw.textPrimary}`}>
            {isEditMode ? "Edit SMS Route" : "Create SMS Route"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Route Name */}
          <div>
            <Input
              label="Route Name"
              placeholder=""
              value={formData.name}
              onChange={(value) => handleInputChange({ target: { name: "name", value } } as any)}
              hasError={!!errors.name}
             
              disabled={loading}
              required
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Communication Channel */}
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Communication Channel *
            </label>
            <HeadlessSelect
              options={NOTIFICATION_CHANNEL_OPTIONS.map(opt => ({
                value: opt.value,
                label: opt.label
              }))}
              value={formData.communication_channel || ""}
              onChange={(value) => handleSelectChange("communication_channel", value)}
              placeholder="Select communication channel"
              disabled={loading}
              error={!!errors.communication_channel}
            />
            {errors.communication_channel && (
              <p className="text-red-500 text-xs mt-1">{errors.communication_channel}</p>
            )}
          </div> */}

          {/* Gateway Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gateway Provider *
            </label>
            <HeadlessSelect
              options={SMS_GATEWAY_OPTIONS.map(opt => ({
                value: opt.value,
                label: opt.label
              }))}
              value={formData.gateway_provider || ""}
              onChange={(value) => handleSelectChange("gateway_provider", value)}
              placeholder="Select gateway provider"
              disabled={loading}
              error={!!errors.gateway_provider}
            />
            {errors.gateway_provider && (
              <p className="text-red-500 text-xs mt-1">{errors.gateway_provider}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Textarea
              label="Description"
              value={formData.description || ""}
              onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-sm text-white ${tw.rounded} font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ backgroundColor: color.primary.action }}
            >
              {loading
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                  ? "Update"
                  : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
