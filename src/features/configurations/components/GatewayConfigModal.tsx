import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useToast } from "../../../contexts/ToastContext";
import { color } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { emailGatewayConfigService } from "../services/emailGatewayConfigService";
import { smsGatewayConfigService } from "../services/smsGatewayConfigService";
import { whatsappGatewayConfigService } from "../services/whatsappGatewayConfigService";
import { pushGatewayConfigService } from "../services/pushGatewayConfigService";
import { EMAIL_GATEWAY_OPTIONS } from "../../routes/constants/emailRouteEnums";
import { SMS_GATEWAY_OPTIONS } from "../../routes/constants/smsRouteEnums";
import { WhatsAppGatewayEnum } from "../../routes/constants/whatsappRouteEnums";
import { PushGatewayEnum } from "../../routes/constants/pushNotificationRouteEnums";
import EmailGatewayForm from "./gateway-forms/EmailGatewayForm";
import SMSGatewayForm from "./gateway-forms/SMSGatewayForm";
import WhatsAppGatewayForm from "./gateway-forms/WhatsAppGatewayForm";
import PushGatewayForm from "./gateway-forms/PushGatewayForm";
import {
  EmailGatewayConfig,
  CreateEmailGatewayConfigRequest,
} from "../types/emailGatewayConfig";
import {
  SMSGatewayConfig,
  CreateSMSGatewayConfigRequest,
} from "../types/smsGatewayConfig";
import {
  WhatsAppGatewayConfig,
  CreateWhatsAppGatewayConfigRequest,
} from "../types/whatsappGatewayConfig";
import {
  PushGatewayConfig,
  CreatePushGatewayConfigRequest,
} from "../types/pushGatewayConfig";

interface UnifiedGatewayConfig {
  id: number;
  name: string;
  description?: string;
  channel_type: "EMAIL" | "SMS" | "WHATSAPP" | "PUSH";
  provider_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  originalConfig:
    | EmailGatewayConfig
    | SMSGatewayConfig
    | WhatsAppGatewayConfig
    | PushGatewayConfig;
}

interface GatewayConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingConfig?: UnifiedGatewayConfig | null;
  onSave: () => void;
}

const CHANNEL_OPTIONS = [
  { value: "EMAIL", label: "Email" },
  { value: "SMS", label: "SMS" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "PUSH", label: "Push Notifications" },
];

export default function GatewayConfigModal({
  isOpen,
  onClose,
  editingConfig,
  onSave,
}: GatewayConfigModalProps) {
  const { t } = useLanguage();
  const { success: showSuccess, error: showError } = useToast();
  const [selectedChannel, setSelectedChannel] = useState<string>(
    editingConfig?.channel_type || "EMAIL"
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingConfig) {
      setSelectedChannel(editingConfig.channel_type);
    }
  }, [editingConfig]);

  const handleSave = async (data: any) => {
    try {
      setIsSaving(true);
      const channel = editingConfig?.channel_type || selectedChannel;

      if (channel === "EMAIL") {
        if (editingConfig) {
          await emailGatewayConfigService.updateConfig(editingConfig.id, data);
        } else {
          await emailGatewayConfigService.createConfig(data);
        }
      } else if (channel === "SMS") {
        if (editingConfig) {
          await smsGatewayConfigService.updateConfig(editingConfig.id, data);
        } else {
          await smsGatewayConfigService.createConfig(data);
        }
      } else if (channel === "WHATSAPP") {
        if (editingConfig) {
          await whatsappGatewayConfigService.updateConfig(editingConfig.id, data);
        } else {
          await whatsappGatewayConfigService.createConfig(data);
        }
      } else if (channel === "PUSH") {
        if (editingConfig) {
          await pushGatewayConfigService.updateConfig(editingConfig.id, data);
        } else {
          await pushGatewayConfigService.createConfig(data);
        }
      }

      showSuccess(
        `Gateway configuration ${editingConfig ? "updated" : "created"}`
      );
      onSave();
      onClose();
    } catch (err) {
      showError(
        `Failed to ${editingConfig ? "update" : "create"} gateway configuration`
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const modalChannel = editingConfig?.channel_type || selectedChannel;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h2 className={`text-2xl font-bold ${color.text}`}>
            {editingConfig ? "Edit" : "Create"} Gateway Configuration
          </h2>
          <button
            onClick={onClose}
            className="rounded p-2 hover:bg-gray-100 transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {!editingConfig && (
            <div>
              <label className={`block text-sm font-semibold ${color.text}`}>
                Communication Channel
              </label>
              <HeadlessSelect
                value={selectedChannel}
                onChange={setSelectedChannel}
                options={CHANNEL_OPTIONS}
                className="w-full mt-2"
              />
            </div>
          )}

          {modalChannel === "EMAIL" && (
            <EmailGatewayForm
              initialData={
                editingConfig?.originalConfig as EmailGatewayConfig | undefined
              }
              onSubmit={handleSave}
              isLoading={isSaving}
              onCancel={onClose}
            />
          )}

          {modalChannel === "SMS" && (
            <SMSGatewayForm
              initialData={
                editingConfig?.originalConfig as SMSGatewayConfig | undefined
              }
              onSubmit={handleSave}
              isLoading={isSaving}
              onCancel={onClose}
            />
          )}

          {modalChannel === "WHATSAPP" && (
            <WhatsAppGatewayForm
              initialData={
                editingConfig?.originalConfig as WhatsAppGatewayConfig | undefined
              }
              onSubmit={handleSave}
              isLoading={isSaving}
              onCancel={onClose}
            />
          )}

          {modalChannel === "PUSH" && (
            <PushGatewayForm
              initialData={
                editingConfig?.originalConfig as PushGatewayConfig | undefined
              }
              onSubmit={handleSave}
              isLoading={isSaving}
              onCancel={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
