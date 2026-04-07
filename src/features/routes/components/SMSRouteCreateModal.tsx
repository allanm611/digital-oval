import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { CreateSMSRouteRequest, SMSRoute } from "../types/smsRoute";
import { smsRouteService } from "../services/smsRouteService";
import { useToast } from "../../../contexts/ToastContext";
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
    gateway_provider: "",
    communication_channel_id: undefined,
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
        gateway_provider: editingRoute.gateway_provider || "",
        communication_channel_id: editingRoute.communication_channel_id,
        is_active: editingRoute.is_active,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        gateway_provider: "",
        communication_channel_id: undefined,
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
      showError("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;

    if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: value ? parseInt(value, 10) : undefined,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Route Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${tw.rounded} text-sm focus:outline-none ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              disabled={loading}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} text-sm focus:outline-none`}
              disabled={loading}
            />
          </div>

          {/* Gateway Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gateway Provider
            </label>
            <input
              type="text"
              name="gateway_provider"
              value={formData.gateway_provider}
              onChange={handleChange}
              className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} text-sm focus:outline-none`}
              disabled={loading}
            />
          </div>

          {/* Communication Channel ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Communication Channel ID
            </label>
            <input
              type="number"
              name="communication_channel_id"
              value={formData.communication_channel_id || ""}
              onChange={handleChange}
              className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} text-sm focus:outline-none`}
              disabled={loading}
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-2 text-sm text-white ${tw.rounded} font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ backgroundColor: color.primary.action }}
            >
              {loading
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                  ? "Save"
                  : "Create"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
