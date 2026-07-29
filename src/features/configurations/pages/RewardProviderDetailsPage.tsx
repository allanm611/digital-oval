import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit, Trash2, Gift } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { color, tw } from "../../../shared/utils/utils";
import {
  rewardProviderService,
  RewardProvider,
} from "../services/rewardProviderService";
import { rewardConfigurationService } from "../services/rewardConfigurationService";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DateFormatter from "../../../shared/components/DateFormatter";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";

function SchemaTable({
  fields,
}: {
  fields: RewardProvider["auth_schema"]["fields"];
}) {
  if (!fields?.length) {
    return <p className={`text-sm ${tw.textMuted}`}>No fields defined.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left">
            <th className={`py-2 pr-4 font-medium ${tw.textMuted}`}>Key</th>
            <th className={`py-2 pr-4 font-medium ${tw.textMuted}`}>Label</th>
            <th className={`py-2 pr-4 font-medium ${tw.textMuted}`}>Type</th>
            <th className={`py-2 pr-4 font-medium ${tw.textMuted}`}>Required</th>
            <th className={`py-2 font-medium ${tw.textMuted}`}>Default</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => (
            <tr key={field.name} className="border-b border-gray-100 last:border-0">
              <td className={`py-3 pr-4 font-mono ${tw.textPrimary}`}>
                {field.name}
              </td>
              <td className={`py-3 pr-4 ${tw.textPrimary}`}>{field.label}</td>
              <td className={`py-3 pr-4 ${tw.textPrimary}`}>{field.type}</td>
              <td className={`py-3 pr-4 ${tw.textPrimary}`}>
                {field.required ? "Yes" : "No"}
              </td>
              <td className={`py-3 ${tw.textSecondary}`}>
                {field.default != null && field.default !== ""
                  ? String(field.default)
                  : field.type === "select"
                    ? (field.options || []).join(", ")
                    : field.placeholder || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RewardProviderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<RewardProvider | null>(null);
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
      const found = await rewardProviderService.getById(Number(id));
      setProvider(found);

      try {
        const configs = await rewardConfigurationService.getAll({
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
      navigate("/dashboard/reward-providers");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!provider) return;
    const newActive = !(provider.is_active !== false);
    setToggling(true);

    if (!newActive) {
      try {
        await rewardProviderService.delete(provider.id);
        showSuccess("Deactivated", `${provider.name} has been deactivated`);
        navigate("/dashboard/reward-providers");
      } catch (err) {
        showError(
          extractBackendError(err, "Failed to deactivate reward provider"),
        );
      } finally {
        setToggling(false);
      }
      return;
    }

    try {
      const updated = await rewardProviderService.update(provider.id, {
        is_active: true,
      });
      setProvider({ ...provider, ...updated, is_active: true });
      showSuccess("Activated", `${provider.name} has been activated`);
    } catch (err) {
      showError(
        extractBackendError(err, "Failed to activate reward provider"),
      );
    } finally {
      setToggling(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!provider) return;
    try {
      setDeleting(true);
      await rewardProviderService.delete(provider.id);
      showSuccess(`"${provider.name}" has been deactivated.`);
      navigate("/dashboard/reward-providers");
    } catch (err) {
      showError(
        extractBackendError(
          err,
          "Failed to deactivate reward provider. Please try again.",
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
              navigate(`/dashboard/reward-providers/${provider.id}/edit`)
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
            Deactivate
          </button>
        </div>
      </div>

      <div className={`${tw.rounded} border border-gray-200 bg-white p-6`}>
        <div className="flex items-start gap-4 mb-6">
          <div
            className="w-14 h-14 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: color.primary.action }}
          >
            <Gift className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className={`text-xl font-semibold ${tw.textPrimary}`}>
              {provider.name}
            </h1>
            <p className={`text-sm ${tw.textSecondary} mt-1`}>
              {provider.http_method} {provider.api_path}
              {configCount > 0
                ? ` · ${configCount} configuration${configCount === 1 ? "" : "s"}`
                : " · No configurations yet"}
            </p>
            {provider.description && (
              <p className={`text-sm ${tw.textMuted} mt-2`}>
                {provider.description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() =>
              navigate(
                `/dashboard/reward-configurations?provider_id=${provider.id}`,
              )
            }
            className={`text-sm font-medium underline ${tw.textPrimary}`}
          >
            {configCount > 0
              ? `View ${configCount} configuration${configCount === 1 ? "" : "s"}`
              : "View reward configurations"}
          </button>
          <button
            type="button"
            onClick={() =>
              navigate(
                `/dashboard/reward-configurations/create?provider_id=${provider.id}`,
              )
            }
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white rounded-md"
            style={{ backgroundColor: color.primary.action }}
          >
            Add configuration
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <p className={`text-xs uppercase ${tw.textMuted}`}>Reward Type</p>
            <p className={`text-sm font-mono ${tw.textPrimary} mt-1`}>
              {provider.reward_type}
            </p>
          </div>
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
            <p className={`text-xs uppercase ${tw.textMuted}`}>Created</p>
            <p className={`text-sm ${tw.textPrimary} mt-1`}>
              {provider.created_at ? (
                <DateFormatter date={provider.created_at} />
              ) : (
                "—"
              )}
            </p>
          </div>
        </div>
      </div>

      <div className={`${tw.rounded} border border-gray-200 bg-white p-6`}>
        <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
          Auth Schema
        </h2>
        <SchemaTable fields={provider.auth_schema?.fields || []} />
      </div>

      <div className={`${tw.rounded} border border-gray-200 bg-white p-6`}>
        <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
          Payload Schema
        </h2>
        <SchemaTable fields={provider.payload_schema?.fields || []} />
      </div>

      <div className={`${tw.rounded} border border-gray-200 bg-white p-6`}>
        <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
          Request Template
        </h2>
        <pre
          className={`text-xs font-mono overflow-x-auto p-4 ${tw.rounded} bg-gray-50 border border-gray-200`}
        >
          {JSON.stringify(provider.request_template || {}, null, 2)}
        </pre>
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Deactivate Reward Provider"
        description="This soft-deactivates the provider. Reward configurations using it may fail until a new configuration is assigned."
        itemName={provider.name}
        isLoading={deleting}
      />
    </div>
  );
}
