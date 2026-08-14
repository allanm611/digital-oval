import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit, Trash2, Plug } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { color, tw } from "../../../shared/utils/utils";
import {
  gatewayProviderService,
  GatewayProvider,
} from "../services/gatewayProviderService";
import { gatewayConfigurationService } from "../services/gatewayConfigurationService";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DateFormatter from "../../../shared/components/DateFormatter";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";

export default function GatewayProviderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<GatewayProvider | null>(null);
  const [configCount, setConfigCount] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadProvider();
  }, [id]);

  const loadProvider = async () => {
    try {
      setLoading(true);
      if (!id) return;
      const found = await gatewayProviderService.getById(Number(id));
      setProvider(found);

      try {
        const configs = await gatewayConfigurationService.getAll({
          provider_id: Number(id),
        });
        setConfigCount(configs.length);
      } catch {
        setConfigCount(0);
      }
    } catch (err) {
      showError(
        extractBackendError(
          err,
          "Failed to load provider. Please try again.",
        ),
      );
      navigate("/dashboard/gateway-providers");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!provider) return;
    const newActive = !(provider.is_active !== false);
    setToggling(true);
    try {
      const updated = await gatewayProviderService.update(provider.id, {
        is_active: newActive,
      });
      setProvider({
        ...provider,
        ...updated,
        channel_label: provider.channel_label,
        channel_value: provider.channel_value,
        is_active: newActive,
      });
      showSuccess(
        newActive ? "Activated" : "Deactivated",
        `${provider.name} has been ${newActive ? "activated" : "deactivated"}`,
      );
    } catch (err) {
      showError(
        extractBackendError(err, "Failed to update provider status"),
      );
    } finally {
      setToggling(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!provider) return;
    try {
      setDeleting(true);
      await gatewayProviderService.delete(provider.id);
      showSuccess(`"${provider.name}" has been deleted successfully.`);
      navigate("/dashboard/gateway-providers");
    } catch (err) {
      showError(
        extractBackendError(
          err,
          "Failed to delete gateway provider. Please try again.",
        ),
      );
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className={`${tw.textMuted} font-medium mt-4`}>
          Loading provider...
        </p>
      </div>
    );
  }

  if (!provider) return null;

  const fields = provider.field_schema?.fields || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <BackButton showBreadcrumb={true} currentLabel={provider.name} />
        <div className="flex items-center gap-2">
          <ActivateDeactivateButton
            isActive={provider.is_active !== false}
            isLoading={toggling}
            onToggle={handleToggleActive}
          />
          <button
            onClick={() =>
              navigate(`/dashboard/gateway-providers/${provider.id}/edit`)
            }
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md"
            style={{ backgroundColor: color.primary.action }}
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className={`${tw.rounded} border border-gray-200 bg-white p-6`}>
        <div className="flex items-start gap-4 mb-6">
          <div
            className="w-14 h-14 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: color.primary.action }}
          >
            <Plug className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className={`text-xl font-semibold ${tw.textPrimary}`}>
              {provider.name}
            </h1>
            <p className={`text-sm ${tw.textSecondary} mt-1`}>
              {provider.channel_label || provider.channel_value || "No channel"}
              {configCount > 0
                ? ` · ${configCount} configuration${configCount === 1 ? "" : "s"}`
                : " · No configurations yet"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className={`text-xs uppercase ${tw.textMuted}`}>Status</p>
            <p className={`text-sm ${tw.textPrimary} mt-1`}>
              {provider.is_active !== false ? "Active" : "Inactive"}
            </p>
          </div>
          <div>
            <p className={`text-xs uppercase ${tw.textMuted}`}>Provider ID</p>
            <p className={`text-sm ${tw.textPrimary} mt-1`}>{provider.id}</p>
          </div>
          <div>
            <p className={`text-xs uppercase ${tw.textMuted}`}>Channel</p>
            <p className={`text-sm ${tw.textPrimary} mt-1`}>
              {provider.channel_label || provider.channel_value || "—"}
              {provider.channel_id != null ? ` (#${provider.channel_id})` : ""}
            </p>
          </div>
          <div>
            <p className={`text-xs uppercase ${tw.textMuted}`}>Created</p>
            <p className={`text-sm ${tw.textPrimary} mt-1`}>
              {provider.created_at ? (
                <DateFormatter date={provider.created_at} />
              ) : (
                "—"
              )}
            </p>
          </div>
          <div>
            <p className={`text-xs uppercase ${tw.textMuted}`}>Updated</p>
            <p className={`text-sm ${tw.textPrimary} mt-1`}>
              {provider.updated_at ? (
                <DateFormatter date={provider.updated_at} />
              ) : (
                "—"
              )}
            </p>
          </div>
        </div>

        {configCount > 0 && (
          <div className="mt-6">
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/dashboard/gateway-configurations?provider_id=${provider.id}`,
                )
              }
              className={`text-sm font-medium underline ${tw.textPrimary}`}
            >
              View related gateway configurations
            </button>
          </div>
        )}
      </div>

      <div className={`${tw.rounded} border border-gray-200 bg-white p-6`}>
        <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
          Field Schema
        </h2>
        {fields.length === 0 ? (
          <p className={`text-sm ${tw.textMuted}`}>
            No configuration fields defined for this provider.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className={`py-2 pr-4 font-medium ${tw.textMuted}`}>
                    Key
                  </th>
                  <th className={`py-2 pr-4 font-medium ${tw.textMuted}`}>
                    Label
                  </th>
                  <th className={`py-2 pr-4 font-medium ${tw.textMuted}`}>
                    Type
                  </th>
                  <th className={`py-2 pr-4 font-medium ${tw.textMuted}`}>
                    Required
                  </th>
                  <th className={`py-2 font-medium ${tw.textMuted}`}>
                    Options / Placeholder
                  </th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field) => (
                  <tr
                    key={field.name}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className={`py-3 pr-4 font-mono ${tw.textPrimary}`}>
                      {field.name}
                    </td>
                    <td className={`py-3 pr-4 ${tw.textPrimary}`}>
                      {field.label}
                    </td>
                    <td className={`py-3 pr-4 ${tw.textPrimary}`}>
                      {field.type}
                    </td>
                    <td className={`py-3 pr-4 ${tw.textPrimary}`}>
                      {field.required ? "Yes" : "No"}
                    </td>
                    <td className={`py-3 ${tw.textSecondary}`}>
                      {field.type === "select"
                        ? (field.options || []).join(", ") || "—"
                        : field.placeholder || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Gateway Provider"
        description={
          configCount > 0
            ? `This provider has ${configCount} configuration(s). Deleting it may break those configurations and related routes.`
            : "This will permanently remove the provider template."
        }
        itemName={provider.name}
        isLoading={deleting}
      />
    </div>
  );
}
