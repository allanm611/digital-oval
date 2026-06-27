import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { color, tw } from "../../../shared/utils/utils";
import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { emailGatewayConfigService } from "../services/emailGatewayConfigService";
import { smsGatewayConfigService } from "../services/smsGatewayConfigService";
import { whatsappGatewayConfigService } from "../services/whatsappGatewayConfigService";
import { pushGatewayConfigService } from "../services/pushGatewayConfigService";
import { ussdGatewayConfigService } from "../services/ussdGatewayConfigService";
import { genericGatewayConfigService } from "../services/genericGatewayConfigService";
import EmailGatewayForm from "../components/gateway-forms/EmailGatewayForm";
import SMSGatewayForm from "../components/gateway-forms/SMSGatewayForm";
import WhatsAppGatewayForm from "../components/gateway-forms/WhatsAppGatewayForm";
import PushGatewayForm from "../components/gateway-forms/PushGatewayForm";
import USSDGatewayForm from "../components/gateway-forms/USSDGatewayForm";
import GenericGatewayForm from "../components/gateway-forms/GenericGatewayForm";

type ChannelType = "EMAIL" | "SMS" | "WHATSAPP" | "PUSH" | "USSD" | string;


interface GatewayConfigFormPageProps {
  mode: "create" | "edit";
}

export default function GatewayConfigFormPage({ mode }: GatewayConfigFormPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { t } = useLanguage();

  const [selectedChannel, setSelectedChannel] = useState<ChannelType>(mode === "edit" ? "EMAIL" : "");
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(mode === "edit" && !!id);
  const [channelOptions, setChannelOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    loadChannels();
    if (mode === "edit" && id) {
      loadConfig();
    }
  }, [mode, id]);

  const getBaseChannelType = (channelName: string): string => {
    if (!channelName) return "EMAIL";
    const name = channelName.toLowerCase();
    if (name.includes("sms")) return "SMS";
    if (name.includes("email")) return "EMAIL";
    if (name.includes("whatsapp")) return "WHATSAPP";
    if (name.includes("push") || name.includes("firebase")) return "PUSH";
    if (name.includes("ussd")) return "USSD";
    return channelName;
  };

  const loadChannels = async () => {
    try {
      const url = buildApiUrl("/communication-channels");
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch channels: ${response.statusText}`);
      }

      const data = await response.json();
      const options = data.data.map((channel: any) => ({
        value: channel.name,
        label: channel.name,
      }));
      setChannelOptions(options);
    } catch (err) {
      showError(extractBackendError(error, "Failed to load communication channels. Please try again."));
    }
  };

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const emailConfigs = await emailGatewayConfigService.getAllConfigs();
      const emailConfig = emailConfigs.find((c) => c.id === Number(id));
      if (emailConfig) {
        setEditingConfig(emailConfig);
        setSelectedChannel("EMAIL");
        return;
      }

      const smsConfigs = await smsGatewayConfigService.getAllConfigs();
      const smsConfig = smsConfigs.find((c) => c.id === Number(id));
      if (smsConfig) {
        setEditingConfig(smsConfig);
        setSelectedChannel("SMS");
        return;
      }

      const whatsappConfigs = await whatsappGatewayConfigService.getAllConfigs();
      const whatsappConfig = whatsappConfigs.find((c) => c.id === Number(id));
      if (whatsappConfig) {
        setEditingConfig(whatsappConfig);
        setSelectedChannel("WHATSAPP");
        return;
      }

      const pushConfigs = await pushGatewayConfigService.getAllConfigs();
      const pushConfig = pushConfigs.find((c) => c.id === Number(id));
      if (pushConfig) {
        setEditingConfig(pushConfig);
        setSelectedChannel("PUSH");
        return;
      }

      const ussdConfigs = await ussdGatewayConfigService.getAllConfigs();
      const ussdConfig = ussdConfigs.find((c) => c.id === Number(id));
      if (ussdConfig) {
        setEditingConfig(ussdConfig);
        setSelectedChannel("USSD");
        return;
      }

      showError("Configuration not found");
      navigate("/dashboard/gateway-configurations");
    } catch (err) {
      showError(extractBackendError(error, "Failed to load configuration. Please try again."));
      navigate("/dashboard/gateway-configurations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    try {
      setIsSaving(true);
      const baseChannelType = getBaseChannelType(selectedChannel);

      if (baseChannelType === "EMAIL") {
        if (mode === "edit" && id) {
          await emailGatewayConfigService.updateConfig(Number(id), data);
        } else {
          await emailGatewayConfigService.createConfig(data);
        }
      } else if (baseChannelType === "SMS") {
        if (mode === "edit" && id) {
          await smsGatewayConfigService.updateConfig(Number(id), data);
        } else {
          await smsGatewayConfigService.createConfig(data);
        }
      } else if (baseChannelType === "WHATSAPP") {
        if (mode === "edit" && id) {
          await whatsappGatewayConfigService.updateConfig(Number(id), data);
        } else {
          await whatsappGatewayConfigService.createConfig(data);
        }
      } else if (baseChannelType === "PUSH") {
        if (mode === "edit" && id) {
          await pushGatewayConfigService.updateConfig(Number(id), data);
        } else {
          await pushGatewayConfigService.createConfig(data);
        }
      } else if (baseChannelType === "USSD") {
        if (mode === "edit" && id) {
          await ussdGatewayConfigService.updateConfig(Number(id), data);
        } else {
          await ussdGatewayConfigService.createConfig(data);
        }
      } else {
        if (mode === "edit" && id) {
          await genericGatewayConfigService.updateConfig(Number(id), data);
        } else {
          await genericGatewayConfigService.createConfig(data);
        }
      }

      success(
        t.common.save,
        `Gateway configuration ${mode === "edit" ? t.common.update : t.common.create}d successfully`
      );
      navigate("/dashboard/gateway-configurations");
    } catch (err) {
      showError("Error", extractBackendError(error, "Error. Please try again."));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className={`${tw.textMuted} font-medium mt-4`}>Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton

        showBreadcrumb={true}
        currentLabel={mode === "create" ? (t.configurations.createGatewayConfiguration || "Create Gateway Configuration") : (t.configurations.editGatewayConfiguration || "Edit Gateway Configuration")}
      />

      <div className="space-y-6">

        {getBaseChannelType(selectedChannel) === "EMAIL" && (
          <EmailGatewayForm
            onSave={handleSave}
            initialData={editingConfig}
            isLoading={isSaving}
            onCancel={() => navigate("/dashboard/gateway-configurations")}
            mode={mode}
            selectedChannel={selectedChannel}
            onChannelChange={(value) => setSelectedChannel(value as ChannelType)}
            channelOptions={channelOptions}
          />
        )}

        {getBaseChannelType(selectedChannel) === "SMS" && (
          <SMSGatewayForm
            onSave={handleSave}
            initialData={editingConfig}
            isLoading={isSaving}
            onCancel={() => navigate("/dashboard/gateway-configurations")}
            mode={mode}
            selectedChannel={selectedChannel}
            onChannelChange={(value) => setSelectedChannel(value as ChannelType)}
            channelOptions={channelOptions}
          />
        )}

        {getBaseChannelType(selectedChannel) === "WHATSAPP" && (
          <WhatsAppGatewayForm
            onSave={handleSave}
            initialData={editingConfig}
            isLoading={isSaving}
            onCancel={() => navigate("/dashboard/gateway-configurations")}
            mode={mode}
            selectedChannel={selectedChannel}
            onChannelChange={(value) => setSelectedChannel(value as ChannelType)}
            channelOptions={channelOptions}
          />
        )}

        {getBaseChannelType(selectedChannel) === "PUSH" && (
          <PushGatewayForm
            onSave={handleSave}
            initialData={editingConfig}
            isLoading={isSaving}
            onCancel={() => navigate("/dashboard/gateway-configurations")}
            mode={mode}
            selectedChannel={selectedChannel}
            onChannelChange={(value) => setSelectedChannel(value as ChannelType)}
            channelOptions={channelOptions}
          />
        )}

        {getBaseChannelType(selectedChannel) === "USSD" && (
          <USSDGatewayForm
            onSave={handleSave}
            initialData={editingConfig}
            isLoading={isSaving}
            onCancel={() => navigate("/dashboard/gateway-configurations")}
            mode={mode}
          />
        )}

        {!["EMAIL", "SMS", "WHATSAPP", "PUSH", "USSD"].includes(getBaseChannelType(selectedChannel)) && (
          <GenericGatewayForm
            onSave={handleSave}
            initialData={editingConfig}
            isLoading={isSaving}
            onCancel={() => navigate("/dashboard/gateway-configurations")}
            mode={mode}
            selectedChannel={selectedChannel}
            onChannelChange={(value) => setSelectedChannel(value as ChannelType)}
            channelOptions={channelOptions}
          />
        )}
      </div>
    </div>
  );
}
