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
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DateFormatter from "../../../shared/components/DateFormatter";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { RULE_REWARD_TYPE_LABELS } from "../../../shared/data/rewardProviders";

export default function RewardProviderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<RewardProvider | null>(null);
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
    try {
      const updated = await rewardProviderService.update(provider.id, {
        is_active: newActive,
      });
      setProvider({ ...provider, ...updated, is_active: newActive });
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
      await rewardProviderService.delete(provider.id);
      showSuccess(`"${provider.name}" has been deleted successfully.`);
      navigate("/dashboard/reward-providers");
    } catch (err) {
      showError(
        extractBackendError(
          err,
          "Failed to delete reward provider. Please try again.",
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

  const allowedTypes = provider.allowed_reward_types || [];

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
            <Gift className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className={`text-xl font-semibold ${tw.textPrimary}`}>
              {provider.name}
            </h1>
            <p className={`text-sm font-mono ${tw.textSecondary} mt-1`}>
              {provider.provider_key}
            </p>
            {provider.description && (
              <p className={`text-sm ${tw.textMuted} mt-2`}>
                {provider.description}
              </p>
            )}
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
      </div>

      <div className={`${tw.rounded} border border-gray-200 bg-white p-6`}>
        <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
          Allowed Reward Types
        </h2>
        {allowedTypes.length === 0 ? (
          <p className={`text-sm ${tw.textMuted}`}>
            No reward types configured for this provider.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allowedTypes.map((type) => (
              <span
                key={type}
                className={`inline-flex px-3 py-1 text-sm font-medium ${tw.rounded}`}
                style={{
                  backgroundColor: `${color.primary.accent}15`,
                  color: color.primary.accent,
                }}
              >
                {RULE_REWARD_TYPE_LABELS[type] || type}
              </span>
            ))}
          </div>
        )}
        <p className={`text-xs ${tw.textSecondary} mt-4`}>
          When this provider is selected in offers or manual rewards, only these
          reward types are available.
        </p>
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Reward Provider"
        description="Offer rules and manual rewards referencing this provider key may fail. Deactivate the provider instead if it is still in use."
        itemName={provider.name}
        isLoading={deleting}
      />
    </div>
  );
}
