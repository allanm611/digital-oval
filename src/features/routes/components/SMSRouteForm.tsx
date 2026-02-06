import { useState, useEffect } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { SMSRoute, CreateSMSRouteRequest, RequestMethod, RequestFormat } from "../types/smsRoute";
import { color, tw, components, button } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";

// Dummy sender IDs data
const SENDER_IDS = [
  { id: "1", name: "Effortel" },
  { id: "3", name: "Equitel" },
  { id: "4", name: "EquitelKE" },
  { id: "5", name: "EquitelAlert" },
  { id: "6", name: "EquitelPromo" },
];

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
    gatewayType: "",
    apiEndpoint: "",
    apiKey: "",
    apiSecret: "",
    senderId: "",
    requestMethod: "POST",
    requestFormat: "JSON",
    priority: 1,
    status: "active",
    description: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (route) {
      setFormData({
        name: route.name,
        gatewayType: route.gatewayType,
        apiEndpoint: route.apiEndpoint,
        apiKey: route.apiKey,
        apiSecret: route.apiSecret,
        senderId: route.senderId,
        requestMethod: route.requestMethod,
        requestFormat: route.requestFormat,
        priority: route.priority,
        status: route.status,
        description: route.description,
      });
    }
  }, [route]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Route name is required";
    }
    if (!formData.gatewayType.trim()) {
      newErrors.gatewayType = "Gateway type is required";
    }
    if (!formData.apiEndpoint.trim()) {
      newErrors.apiEndpoint = "API endpoint is required";
    }
    if (!formData.apiKey.trim()) {
      newErrors.apiKey = "API key is required";
    }
    if (!formData.apiSecret.trim()) {
      newErrors.apiSecret = "API secret is required";
    }
    if (!formData.senderId) {
      newErrors.senderId = "Sender ID is required";
    }
    if (formData.priority < 1 || formData.priority > 999) {
      newErrors.priority = "Priority must be between 1 and 999";
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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: parseInt(value, 10),
      }));
    } else if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const getSenderIdName = (id: string): string => {
    return SENDER_IDS.find((s) => s.id === id)?.name || id;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
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
              : "Configure a new custom SMS gateway route"}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className={`${components.card.surface} p-6`}>
        <div className="space-y-6">
          {/* Row 1: Name and Gateway Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                Route Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Primary SMS Gateway"
                className={`w-full px-4 py-2 border ${tw.rounded} text-sm transition-colors ${
                  errors.name ? "border-red-500" : `border-[${color.border.default}]`
                }`}
                style={{
                  borderColor: errors.name ? "#EF4444" : color.border.default,
                }}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                Gateway Type *
              </label>
              <input
                type="text"
                name="gatewayType"
                value={formData.gatewayType}
                onChange={handleChange}
                placeholder="e.g., Twilio, AWS SNS, Custom"
                className={`w-full px-4 py-2 border ${tw.rounded} text-sm transition-colors ${
                  errors.gatewayType ? "border-red-500" : `border-[${color.border.default}]`
                }`}
                style={{
                  borderColor: errors.gatewayType ? "#EF4444" : color.border.default,
                }}
                disabled={isLoading}
              />
              {errors.gatewayType && (
                <p className="text-red-500 text-sm mt-1">{errors.gatewayType}</p>
              )}
            </div>
          </div>

          {/* Row 2: API Endpoint */}
          <div>
            <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
              API Endpoint *
            </label>
            <input
              type="url"
              name="apiEndpoint"
              value={formData.apiEndpoint}
              onChange={handleChange}
              placeholder="https://api.gateway.com/sms"
              className={`w-full px-4 py-2 border ${tw.rounded} text-sm transition-colors ${
                errors.apiEndpoint ? "border-red-500" : `border-[${color.border.default}]`
              }`}
              style={{
                borderColor: errors.apiEndpoint ? "#EF4444" : color.border.default,
              }}
              disabled={isLoading}
            />
            {errors.apiEndpoint && (
              <p className="text-red-500 text-sm mt-1">{errors.apiEndpoint}</p>
            )}
          </div>

          {/* Row 3: API Key and API Secret */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                API Key *
              </label>
              <input
                type="password"
                name="apiKey"
                value={formData.apiKey}
                onChange={handleChange}
                placeholder="Your API key"
                className={`w-full px-4 py-2 border ${tw.rounded} text-sm transition-colors ${
                  errors.apiKey ? "border-red-500" : `border-[${color.border.default}]`
                }`}
                style={{
                  borderColor: errors.apiKey ? "#EF4444" : color.border.default,
                }}
                disabled={isLoading}
              />
              {errors.apiKey && (
                <p className="text-red-500 text-sm mt-1">{errors.apiKey}</p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                API Secret *
              </label>
              <input
                type="password"
                name="apiSecret"
                value={formData.apiSecret}
                onChange={handleChange}
                placeholder="Your API secret"
                className={`w-full px-4 py-2 border ${tw.rounded} text-sm transition-colors ${
                  errors.apiSecret ? "border-red-500" : `border-[${color.border.default}]`
                }`}
                style={{
                  borderColor: errors.apiSecret ? "#EF4444" : color.border.default,
                }}
                disabled={isLoading}
              />
              {errors.apiSecret && (
                <p className="text-red-500 text-sm mt-1">{errors.apiSecret}</p>
              )}
            </div>
          </div>

          {/* Row 4: Sender ID and Request Method */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                Sender ID *
              </label>
              <select
                name="senderId"
                value={formData.senderId}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${tw.rounded} text-sm transition-colors ${
                  errors.senderId ? "border-red-500" : `border-[${color.border.default}]`
                }`}
                style={{
                  borderColor: errors.senderId ? "#EF4444" : color.border.default,
                }}
                disabled={isLoading}
              >
                <option value="">Select a sender ID</option>
                {SENDER_IDS.map((sender) => (
                  <option key={sender.id} value={sender.id}>
                    {sender.name}
                  </option>
                ))}
              </select>
              {errors.senderId && (
                <p className="text-red-500 text-sm mt-1">{errors.senderId}</p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                Request Method
              </label>
              <select
                name="requestMethod"
                value={formData.requestMethod}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${tw.rounded} text-sm`}
                style={{ borderColor: color.border.default }}
                disabled={isLoading}
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </div>

          {/* Row 5: Request Format and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                Request Format
              </label>
              <select
                name="requestFormat"
                value={formData.requestFormat}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${tw.rounded} text-sm`}
                style={{ borderColor: color.border.default }}
                disabled={isLoading}
              >
                <option value="JSON">JSON</option>
                <option value="XML">XML</option>
                <option value="FORM_DATA">Form Data</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                Priority
              </label>
              <input
                type="number"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                min="1"
                max="999"
                className={`w-full px-4 py-2 border ${tw.rounded} text-sm`}
                style={{ borderColor: color.border.default }}
                disabled={isLoading}
              />
              {errors.priority && (
                <p className="text-red-500 text-sm mt-1">{errors.priority}</p>
              )}
            </div>
          </div>

          {/* Row 6: Status */}
          <div>
            <label className={`block text-sm font-medium ${tw.textPrimary} mb-3`}>
              Status
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={formData.status === "active"}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <span className={`text-sm ${tw.textPrimary}`}>Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={formData.status === "inactive"}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <span className={`text-sm ${tw.textPrimary}`}>Inactive</span>
              </label>
            </div>
          </div>

          {/* Row 7: Description */}
          <div>
            <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add notes about this route..."
              rows={4}
              className={`w-full px-4 py-2 border ${tw.rounded} text-sm`}
              style={{ borderColor: color.border.default }}
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
            className={`inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white ${tw.rounded} transition-colors`}
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
