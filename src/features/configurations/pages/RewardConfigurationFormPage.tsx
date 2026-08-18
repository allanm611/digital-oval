import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Eye } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { color, tw } from "../../../shared/utils/utils";
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
import {
  readRewardNavState,
  rewardProviderDetailsPath,
  rewardTemplateDetailsPath,
  rewardTemplatesListPath,
} from "../utils/rewardNavigation";

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
  const location = useLocation();
  const { success, error: showError } = useToast();
  const navState = readRewardNavState(location.state);

  const templatesListPath = rewardTemplatesListPath(
    navState?.providerId ?? providerIdFromUrl,
  );

  const leaveToParent = (createdId?: number) => {
    if (mode === "create" && createdId != null && createdId > 0) {
      navigate(rewardTemplateDetailsPath(createdId), { replace: true });
      return;
    }
    if (mode === "edit" && id && navState?.from === "details") {
      navigate(rewardTemplateDetailsPath(id), { replace: true });
      return;
    }
    if (navState?.from === "provider" && (navState.providerId || providerIdFromUrl)) {
      const providerId = navState.providerId ?? Number(providerIdFromUrl);
      navigate(rewardProviderDetailsPath(providerId));
      return;
    }
    navigate(templatesListPath);
  };

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
      navigate(templatesListPath);
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
        success("Saved", "Reward template updated successfully");
        leaveToParent();
      } else {
        const created = await rewardConfigurationService.create(
          payload as CreateRewardConfigurationRequest,
        );
        success("Saved", "Reward template created successfully");
        leaveToParent(created.id);
      }
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
      <div className="flex items-center justify-between gap-4">
        <BackButton
          showBreadcrumb={true}
          parentLabel={
            navState?.parentLabel ||
            (navState?.from === "details" && editingConfig?.name
              ? editingConfig.name
              : selectedProvider && navState?.from === "provider"
                ? selectedProvider.name
                : "Reward Templates")
          }
          parentTo={
            mode === "edit" && id && navState?.from === "details"
              ? rewardTemplateDetailsPath(id)
              : navState?.from === "provider" &&
                  (navState.providerId || providerIdFromUrl)
                ? rewardProviderDetailsPath(
                    navState.providerId ?? Number(providerIdFromUrl),
                  )
                : templatesListPath
          }
          currentLabel={
            mode === "create"
              ? "Create Reward Template"
              : "Edit Reward Template"
          }
        />
        {mode === "edit" && id ? (
          <button
            type="button"
            onClick={() => navigate(rewardTemplateDetailsPath(id))}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-200 bg-white hover:bg-gray-50"
            style={{ color: color.primary.action }}
          >
            <Eye className="w-4 h-4" />
            View details
          </button>
        ) : null}
      </div>

      <RewardConfigurationForm
        mode={mode}
        isLoading={isSaving}
        providers={providers}
        providersLoading={providersLoading}
        initialData={editingConfig || initialDataForCreate}
        initialProvider={selectedProvider}
        onCancel={() => leaveToParent()}
        onSave={handleSave}
      />
    </div>
  );
}
