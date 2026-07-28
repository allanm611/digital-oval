import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { tw } from "../../../shared/utils/utils";
import {
  rewardProviderService,
  RewardProvider,
  CreateRewardProviderRequest,
  UpdateRewardProviderRequest,
} from "../services/rewardProviderService";
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
  const [editingProvider, setEditingProvider] =
    useState<RewardProvider | null>(null);

  useEffect(() => {
    loadInitial();
  }, [mode, id]);

  const loadInitial = async () => {
    try {
      setIsLoading(true);
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
        await rewardProviderService.create(
          payload as CreateRewardProviderRequest,
        );
        success("Reward provider created successfully");
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
        initialData={editingProvider}
        onCancel={() => navigate("/dashboard/reward-providers")}
        onSave={handleSave}
      />
    </div>
  );
}
