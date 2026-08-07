import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { tw } from "../../../shared/utils/utils";
import { rewardTypeService } from "../../offers/services/rewardTypeService";
import {
  rewardProviderService,
  RewardProvider,
  CreateRewardProviderRequest,
  UpdateRewardProviderRequest,
} from "../services/rewardProviderService";
import { ensureProviderDefaultTemplateDetailed } from "../utils/rewardTemplateDefaults";
import RewardProviderForm from "../components/reward-forms/RewardProviderForm";

interface RewardProviderFormPageProps {
  mode: "create" | "edit";
}

export default function RewardProviderFormPage({
  mode,
}: RewardProviderFormPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

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
        navigate("/dashboard/reward-providers");
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
        await rewardProviderService.update(
          Number(id),
          payload as UpdateRewardProviderRequest,
        );
        success("Reward provider updated successfully");
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
              "Reward provider created. Default template will use provider field defaults until it can be saved under Reward Configurations.",
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
      }
      navigate("/dashboard/reward-providers");
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
      <BackButton
        showBreadcrumb={true}
        currentLabel={
          mode === "create" ? "Create Reward Provider" : "Edit Reward Provider"
        }
      />

      <RewardProviderForm
        mode={mode}
        isLoading={isSaving}
        rewardTypeOptions={rewardTypeOptions}
        initialData={editingProvider}
        onCancel={() => navigate("/dashboard/reward-providers")}
        onSave={handleSave}
      />
    </div>
  );
}
