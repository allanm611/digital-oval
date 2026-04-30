import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BackButton from "../../../shared/components/ui/BackButton";
import Input from "../../../shared/components/ui/Input";
import Checkbox from "../../../shared/components/ui/Checkbox";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { hardcodedEmailRoutes } from "../../configurations/configs/configurationPageConfigs";

interface EmailRoute {
  id: number | string;
  name: string;
  description?: string;
  gateway_provider: string;
  smtp_host: string;
  smtp_port: string | number;
  smtp_username: string;
  smtp_password: string;
  from_address: string;
  isActive: boolean;
  backup_route_id?: number | string;
  retry_attempts?: number;
  use_backup_on_failure?: boolean;
}

const GATEWAY_PROVIDERS = [
  { value: "SENDGRID", label: "SendGrid" },
  { value: "AWS_SES", label: "AWS SES" },
  { value: "MAILGUN", label: "Mailgun" },
  { value: "POSTMARK", label: "Postmark" },
  { value: "INTERNAL_SMTP", label: "Internal SMTP" },
  { value: "GMAIL", label: "Gmail" },
];

export default function EmailRoutesFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();

  const [formData, setFormData] = useState<EmailRoute>({
    id: "",
    name: "",
    description: "",
    gateway_provider: "SENDGRID",
    smtp_host: "",
    smtp_port: 587,
    smtp_username: "",
    smtp_password: "",
    from_address: "",
    isActive: true,
    backup_route_id: undefined,
    retry_attempts: 3,
    use_backup_on_failure: false,
  });

  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode) {
      const route = hardcodedEmailRoutes.find((r) => r.id === parseInt(id!));
      if (route) {
        setFormData(route as EmailRoute);
      }
    }
  }, [id, isEditMode]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | { target: { name: string; value: any } }
  ) => {
    const { name, value, type } = e.target as any;
    const finalValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleInputValueChange = (name: string) => (value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.name.trim()) {
      setError("Route name is required");
      return;
    }
    if (!formData.smtp_host.trim()) {
      setError("SMTP host is required");
      return;
    }
    if (!formData.smtp_username.trim()) {
      setError("SMTP username is required");
      return;
    }
    if (!formData.smtp_password.trim()) {
      setError("SMTP password is required");
      return;
    }
    if (!formData.from_address.trim()) {
      setError("From address is required");
      return;
    }

    setIsSaving(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      showToast(
        isEditMode ? "Email Route Updated" : "Email Route Created",
        `${formData.name} has been ${isEditMode ? "updated" : "created"} successfully`
      );

      navigate("/dashboard/email-routes");
    } catch (err) {
      showError(t.genericConfig.error, "Failed to save email route");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <BackButton
        fallbackTo="/dashboard/email-routes"
        showBreadcrumb={true}
        currentLabel={isEditMode ? "Edit Email Route" : "Create Email Route"}
      />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`text-lg font-semibold text-gray-900 mb-4`}>
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Route Name *
              </label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputValueChange("name")}
                placeholder="e.g., SendGrid Primary Route"
                variant="medium"
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe this route (optional)"
                rows={3}
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed`}
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        {/* SMTP Settings Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`text-lg font-semibold text-gray-900 mb-4`}>
            SMTP Settings
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gateway Provider *
              </label>
              <HeadlessSelect
                options={GATEWAY_PROVIDERS}
                value={formData.gateway_provider}
                onChange={(value) =>
                  handleInputChange({
                    target: { name: "gateway_provider", value },
                  } as any)
                }
                disabled={isSaving}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Host *
                </label>
                <Input
                  type="text"
                  name="smtp_host"
                  value={formData.smtp_host}
                  onChange={handleInputValueChange("smtp_host")}
                  placeholder="smtp.sendgrid.net"
                  variant="medium"
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Port *
                </label>
                <Input
                  type="text"
                  name="smtp_port"
                  value={formData.smtp_port}
                  onChange={handleInputValueChange("smtp_port")}
                  placeholder="587"
                  variant="medium"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Username *
                </label>
                <Input
                  type="text"
                  name="smtp_username"
                  value={formData.smtp_username}
                  onChange={handleInputValueChange("smtp_username")}
                  placeholder="apikey"
                  variant="medium"
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Password *
                </label>
                <Input
                  type="password"
                  name="smtp_password"
                  value={formData.smtp_password}
                  onChange={handleInputValueChange("smtp_password")}
                  placeholder="••••••••••••••••"
                  variant="medium"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Email Address *
              </label>
              <Input
                type="email"
                name="from_address"
                value={formData.from_address}
                onChange={handleInputValueChange("from_address")}
                placeholder="noreply@sentra.com"
                variant="medium"
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        {/* Failover Configuration Section */}
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`text-lg font-semibold text-gray-900 mb-4`}>
            Failover Configuration
          </h2>

          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                id="use_backup_on_failure"
                checked={formData.use_backup_on_failure}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({
                    ...prev,
                    use_backup_on_failure: e.target.checked,
                  }))
                }
                disabled={isSaving}
              />
              <div className="flex-1">
                <span className="block text-sm font-medium text-gray-700">
                  Use backup route if this route fails
                </span>
                <p className={`text-xs ${tw.textSecondary} mt-1`}>
                  Enable automatic failover to a backup route when delivery fails
                </p>
              </div>
            </label>

            {formData.use_backup_on_failure && (
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Backup Route
                  </label>
                  <HeadlessSelect
                    options={[
                      { value: "", label: "Select a backup route" },
                      ...(hardcodedEmailRoutes as EmailRoute[])
                        .filter((r) => r.id !== formData.id)
                        .map((route) => ({
                          value: String(route.id),
                          label: route.name,
                        })),
                    ]}
                    value={String(formData.backup_route_id || "")}
                    onChange={(value) =>
                      handleInputChange({
                        target: { name: "backup_route_id", value },
                      } as any)
                    }
                    disabled={isSaving}
                  />
                  <p className={`text-xs ${tw.textSecondary} mt-2`}>
                    This route will be used if the primary route fails
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Retry Attempts Before Failover
                  </label>
                  <Input
                    type="number"
                    name="retry_attempts"
                    value={String(formData.retry_attempts)}
                    onChange={handleInputValueChange("retry_attempts")}
                    variant="medium"
                    disabled={isSaving}
                  />
                  <p className={`text-xs ${tw.textSecondary} mt-2`}>
                    Number of times to retry this route before using the backup route
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate("/dashboard/email-routes")}
            className={`px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 ${tw.rounded} transition-colors`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={`px-4 py-2 text-white ${tw.rounded} transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
            style={{ backgroundColor: color.primary.action }}
          >
            {isSaving && <LoadingSpinner variant="modern" size="sm" color="inherit" />}
            {isEditMode ? "Update Route" : "Create Route"}
          </button>
        </div>
      </form>
    </div>
  );
}
