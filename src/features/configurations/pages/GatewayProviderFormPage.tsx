import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { tw } from "../../../shared/utils/utils";
import { communicationChannelService } from "../../../shared/services/communicationChannelService";
import {
  gatewayProviderService,
  GatewayProvider,
  CreateGatewayProviderRequest,
  UpdateGatewayProviderRequest,
} from "../services/gatewayProviderService";
import GatewayProviderForm from "../components/gateway-forms/GatewayProviderForm";

interface GatewayProviderFormPageProps {
  mode: "create" | "edit";
}

export default function GatewayProviderFormPage({
  mode,
}: GatewayProviderFormPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [channels, setChannels] = useState<
    { value: string; label: string }[]
  >([]);
  const [editingProvider, setEditingProvider] =
    useState<GatewayProvider | null>(null);

  useEffect(() => {
    loadInitial();
  }, [mode, id]);

  const loadInitial = async () => {
    try {
      setIsLoading(true);
      const channelData = await communicationChannelService.getAll();
      const channelOptions = (channelData || [])
        .filter((ch) => ch.is_active !== false)
        .map((ch) => ({
          value: String(ch.id),
          label: ch.name || ch.code,
        }));
      setChannels(channelOptions);

      if (mode === "edit" && id) {
        const provider = await gatewayProviderService.getById(Number(id));
        setEditingProvider(provider);
      }
    } catch (err) {
      showError(
        extractBackendError(err, "Failed to load gateway provider form data"),
      );
      if (mode === "edit") {
        navigate("/dashboard/gateway-providers");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (
    payload: CreateGatewayProviderRequest | UpdateGatewayProviderRequest,
  ) => {
    try {
      setIsSaving(true);
      if (mode === "edit" && id) {
        await gatewayProviderService.update(
          Number(id),
          payload as UpdateGatewayProviderRequest,
        );
        success("Gateway provider updated successfully");
      } else {
        await gatewayProviderService.create(
          payload as CreateGatewayProviderRequest,
        );
        success("Gateway provider created successfully");
      }
      navigate("/dashboard/gateway-providers");
    } catch (err) {
      showError(
        extractBackendError(err, "Failed to save gateway provider"),
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
          mode === "create"
            ? "Create Gateway Provider"
            : "Edit Gateway Provider"
        }
      />

      <GatewayProviderForm
        mode={mode}
        isLoading={isSaving}
        channels={channels}
        initialData={editingProvider}
        onCancel={() => navigate("/dashboard/gateway-providers")}
        onSave={handleSave}
      />
    </div>
  );
}
