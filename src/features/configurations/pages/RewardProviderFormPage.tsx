import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Eye } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { color, tw } from "../../../shared/utils/utils";
import { rewardTypeService } from "../../offers/services/rewardTypeService";
import {
  rewardProviderService,
  RewardProvider,
  CreateRewardProviderRequest,
  UpdateRewardProviderRequest,
} from "../services/rewardProviderService";
import {
  ensureProviderDefaultTemplateDetailed,
  syncProviderDefaultTemplate,
} from "../utils/rewardTemplateDefaults";
import RewardProviderForm from "../components/reward-forms/RewardProviderForm";
import {
  REWARD_PROVIDERS_PATH,
  readRewardNavState,
  rewardProviderDetailsPath,
} from "../utils/rewardNavigation";

interface RewardProviderFormPageProps {
  mode: "create" | "edit";
}

export default function RewardProviderFormPage({
  mode,
}: RewardProviderFormPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error: showError, warning } = useToast();
  const navState = readRewardNavState(location.state);

  const leaveToParent = (createdId?: number) => {
    if (mode === "create" && createdId != null && createdId > 0) {
      navigate(rewardProviderDetailsPath(createdId), { replace: true });
      return;
    }
    if (mode === "edit" && id && navState?.from === "details") {
      navigate(rewardProviderDetailsPath(id), { replace: true });
      return;
    }
    navigate(REWARD_PROVIDERS_PATH);
  };

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [rewardTypeOptions, setRewardTypeOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [editingProvider, setEditingProvider] =
    useState<RewardProvider | null>(null);

  useEffect(() => {
    loadInitial();
  }, [mode, id]);

  const loadInitial = async () => {
    try {
      setIsLoading(true);

      try {
        const rewardTypesResponse = await rewardTypeService.getAllRewardTypes();
        const activeTypes = (rewardTypesResponse.data || []).filter(
          (rt) => rt.is_active !== false,
        );
        setRewardTypeOptions(
          activeTypes.map((rt) => ({
            value: rt.reward_key,
            label: rt.name || rt.reward_key,
          })),
        );
      } catch {
        setRewardTypeOptions([
          { value: "bonus_units", label: "Bonus Units" },
          { value: "airtime", label: "Airtime" },
          { value: "bundle", label: "Bundle" },
          { value: "points", label: "Points" },
          { value: "discount", label: "Discount" },
          { value: "cashback", label: "Cashback" },
        ]);
      }

      if (mode === "edit" && id) {
        const provider = await rewardProviderService.getById(Number(id));
        setEditingProvider(provider);
      }
    } catch (err) {
      showError(
        extractBackendError(err, "Failed to load reward provider form data"),
      );
      if (mode === "edit") {
        navigate(REWARD_PROVIDERS_PATH);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (
    payload: CreateRewardProviderRequest | UpdateRewardProviderRequest,
  ) => {
    try {
      setIsSaving(true);
      if (mode === "edit" && id) {
        const updated = await rewardProviderService.update(
          Number(id),
          payload as UpdateRewardProviderRequest,
        );
        const providerToSync: RewardProvider =
          updated?.id && updated.auth_schema
            ? updated
            : ({
                ...(editingProvider || {}),
                ...(payload as UpdateRewardProviderRequest),
                id: Number(id),
              } as RewardProvider);

        const syncResult = await syncProviderDefaultTemplate(providerToSync);
        if (syncResult.error) {
          warning(
            "Provider updated",
            "The default reward template could not be refreshed. Open it from this provider to retry, or edit the provider again.",
          );
        } else if (syncResult.synced) {
          success(
            "Reward provider updated. Default template credentials (including username) were refreshed.",
          );
        } else {
          success("Reward provider updated successfully");
        }
        leaveToParent();
      } else {
        const created = await rewardProviderService.create(
          payload as CreateRewardProviderRequest,
        );
        try {
          const seeded = await ensureProviderDefaultTemplateDetailed(
            created.id,
            created,
          );
          if (seeded.isVirtual) {
            success(
              "Reward provider created. Default template will use provider field defaults until it can be saved under Reward Templates.",
            );
          } else {
            success(
              "Reward provider created successfully with a default reward template",
            );
          }
        } catch {
          success(
            "Reward provider created successfully. Default template will be available from provider defaults on first use.",
          );
        }
        leaveToParent(created.id);
      }
    } catch (err) {
      showError(extractBackendError(err, "Failed to save reward provider"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className={`${tw.textMuted} font-medium mt-4`}>
          Loading provider...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <BackButton
          showBreadcrumb={true}
          parentLabel={
            navState?.parentLabel ||
            (mode === "edit" && editingProvider?.name
              ? editingProvider.name
              : "Reward Providers")
          }
          parentTo={
            mode === "edit" && id && navState?.from === "details"
              ? rewardProviderDetailsPath(id)
              : REWARD_PROVIDERS_PATH
          }
          currentLabel={
            mode === "create"
              ? "Create Reward Provider"
              : "Edit Reward Provider"
          }
        />
        {mode === "edit" && id ? (
          <button
            type="button"
            onClick={() => navigate(rewardProviderDetailsPath(id))}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-200 bg-white hover:bg-gray-50"
            style={{ color: color.primary.action }}
          >
            <Eye className="w-4 h-4" />
            View details
          </button>
        ) : null}
      </div>

      <RewardProviderForm
        mode={mode}
        isLoading={isSaving}
        rewardTypeOptions={rewardTypeOptions}
        initialData={editingProvider}
        onCancel={leaveToParent}
        onSave={handleSave}
      />
    </div>
  );
}
