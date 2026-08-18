import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { tw } from "../../../shared/utils/utils";
import { communicationChannelService } from "../../../shared/services/communicationChannelService";
import {
  gatewayProviderService,
  GatewayProvider,
} from "../services/gatewayProviderService";
import { gatewayConfigurationService } from "../services/gatewayConfigurationService";
import {
  CreateGatewayConfigurationRequest,
  GatewayConfiguration,
  UpdateGatewayConfigurationRequest,
} from "../types/gatewayConfiguration";
import GatewayConfigurationForm from "../components/gateway-forms/GatewayConfigurationForm";

interface GatewayConfigFormPageProps {
  mode: "create" | "edit";
}

export default function GatewayConfigFormPage({
  mode,
}: GatewayConfigFormPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { t } = useLanguage();

  const [channelOptions, setChannelOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [providers, setProviders] = useState<GatewayProvider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [editingConfig, setEditingConfig] =
    useState<GatewayConfiguration | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(mode === "edit" && !!id);

  useEffect(() => {
    loadChannels();
  }, []);

  useEffect(() => {
    if (mode === "edit" && id) {
      loadConfig(Number(id));
    }
  }, [mode, id]);

  useEffect(() => {
    if (!selectedChannelId) {
      setProviders([]);
      return;
    }
    loadProviders(Number(selectedChannelId));
  }, [selectedChannelId]);

  const loadChannels = async () => {
    try {
      const data = await communicationChannelService.getAll();
      const options = (data || [])
        .filter((ch) => ch.is_active !== false)
        .map((ch) => ({
          value: String(ch.id),
          label: ch.name || ch.code,
        }));
      setChannelOptions(options);
      if (mode === "create" && options.length > 0 && !selectedChannelId) {
        setSelectedChannelId(options[0].value);
      }
    } catch (err) {
      showError(
        extractBackendError(
          err,
          "Failed to load communication channels. Please try again.",
        ),
      );
    }
  };

  const loadProviders = async (channelId: number) => {
    try {
      setProvidersLoading(true);
      const data = await gatewayProviderService.getAll({
        channel_id: channelId,
      });
      setProviders(data);
    } catch (err) {
      showError(
        extractBackendError(
          err,
          "Failed to load gateway providers. Please try again.",
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
      const config = await gatewayConfigurationService.getById(configId);
      setEditingConfig(config);
      if (config.channel_id) {
        setSelectedChannelId(String(config.channel_id));
      }
    } catch (err) {
      showError(
        extractBackendError(
          err,
          "Failed to load configuration. Please try again.",
        ),
      );
      navigate("/dashboard/gateway-configurations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (
    payload:
      | CreateGatewayConfigurationRequest
      | UpdateGatewayConfigurationRequest,
  ) => {
    try {
      setIsSaving(true);
      if (mode === "edit" && id) {
        await gatewayConfigurationService.update(
          Number(id),
          payload as UpdateGatewayConfigurationRequest,
        );
      } else {
        await gatewayConfigurationService.create(
          payload as CreateGatewayConfigurationRequest,
        );
      }
      success(
        t.common.save,
        `Gateway configuration ${mode === "edit" ? "updated" : "created"} successfully`,
      );
      navigate("/dashboard/gateway-configurations");
    } catch (err) {
      showError(
        "Error",
        extractBackendError(err, "Failed to save gateway configuration."),
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
          Loading configuration...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton
        showBreadcrumb={true}
        currentLabel={
          mode === "create"
            ? t.configurations.createGatewayConfiguration ||
              "Create Gateway Configuration"
            : t.configurations.editGatewayConfiguration ||
              "Edit Gateway Configuration"
        }
      />

      <GatewayConfigurationForm
        mode={mode}
        isLoading={isSaving}
        channels={channelOptions}
        providers={providers}
        providersLoading={providersLoading}
        initialData={editingConfig}
        selectedChannelId={selectedChannelId}
        onChannelChange={setSelectedChannelId}
        onCancel={() => navigate("/dashboard/gateway-configurations")}
        onSave={handleSave}
      />
    </div>
  );
}
