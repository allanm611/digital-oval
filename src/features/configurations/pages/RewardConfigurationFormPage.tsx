import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { tw } from "../../../shared/utils/utils";
import {
  rewardProviderService,
  RewardProvider,
} from "../services/rewardProviderService";
import { rewardConfigurationService } from "../services/rewardConfigurationService";
import {
  CreateRewardConfigurationRequest,
  RewardConfiguration,
  UpdateRewardConfigurationRequest,
} from "../types/rewardConfiguration";
import RewardConfigurationForm from "../components/reward-forms/RewardConfigurationForm";

interface RewardConfigurationFormPageProps {
  mode: "create" | "edit";
}

export default function RewardConfigurationFormPage({
  mode,
}: RewardConfigurationFormPageProps) {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const providerIdFromUrl = searchParams.get("provider_id");
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [providers, setProviders] = useState<RewardProvider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [editingConfig, setEditingConfig] =
    useState<RewardConfiguration | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<RewardProvider | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(mode === "edit" && !!id);

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    if (mode === "edit" && id) {
      loadConfig(Number(id));
    }
  }, [mode, id]);

  useEffect(() => {
    if (mode !== "create" || !providerIdFromUrl) {
      return;
    }
    let cancelled = false;
    const id = Number(providerIdFromUrl);
    if (!Number.isFinite(id)) return;

    (async () => {
      try {
        const provider = await rewardProviderService.getById(id);
        if (!cancelled) setSelectedProvider(provider);
      } catch {
        if (cancelled || providers.length === 0) return;
        const provider = providers.find((p) => String(p.id) === providerIdFromUrl);
        if (provider) setSelectedProvider(provider);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, providerIdFromUrl, providers]);

  const loadProviders = async () => {
    try {
      setProvidersLoading(true);
      const data = await rewardProviderService.getAll();
      setProviders(data);
    } catch (err) {
      showError(
        extractBackendError(
          err,
          "Failed to load reward providers. Please try again.",
        ),
      );
      setProviders([]);
    } finally {
      setProvidersLoading(false);
    }
  };

  const loadConfig = async (configId: number) => {
    try {
      setIsLoading(true);
      const config = await rewardConfigurationService.getById(configId);
      setEditingConfig(config);

      try {
        const provider = await rewardProviderService.getById(
          config.provider_id,
        );
        setSelectedProvider(provider);
      } catch {
        setSelectedProvider(null);
      }
    } catch (err) {
      showError(
        extractBackendError(
          err,
          "Failed to load configuration. Please try again.",
        ),
      );
      navigate("/dashboard/reward-configurations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (
    payload:
      | CreateRewardConfigurationRequest
      | UpdateRewardConfigurationRequest,
  ) => {
    try {
      setIsSaving(true);
      if (mode === "edit" && id) {
        await rewardConfigurationService.update(
          Number(id),
          payload as UpdateRewardConfigurationRequest,
        );
      } else {
        await rewardConfigurationService.create(
          payload as CreateRewardConfigurationRequest,
        );
      }
      success(
        "Saved",
        `Reward template ${mode === "edit" ? "updated" : "created"} successfully`,
      );
      navigate("/dashboard/reward-configurations");
    } catch (err) {
      showError(
        "Error",
        extractBackendError(err, "Failed to save reward template."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className={`${tw.textMuted} font-medium mt-4`}>
          Loading template...
        </p>
      </div>
    );
  }

  const initialDataForCreate =
    mode === "create" && providerIdFromUrl
      ? ({
          provider_id: Number(providerIdFromUrl),
        } as RewardConfiguration)
      : null;

  return (
    <div className="space-y-6">
      <BackButton
        showBreadcrumb={true}
        currentLabel={
          mode === "create"
            ? "Create Reward Template"
            : "Edit Reward Template"
        }
      />

      <RewardConfigurationForm
        mode={mode}
        isLoading={isSaving}
        providers={providers}
        providersLoading={providersLoading}
        initialData={editingConfig || initialDataForCreate}
        initialProvider={selectedProvider}
        onCancel={() => navigate("/dashboard/reward-configurations")}
        onSave={handleSave}
      />
    </div>
  );
}
