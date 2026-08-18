import { useState } from "react";
import { Send } from "lucide-react";
import RegularModal from "./ui/RegularModal";
import ModalFooter from "./ui/ModalFooter";
import Input from "./ui/Input";
import { color, tw } from "../utils/utils";
import { useToast } from "../../contexts/ToastContext";
import { extractBackendError } from "../utils/errorHandler";;;

interface SendTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: string;
  title?: string;
  textBody?: string;
  htmlBody?: string;
}

export default function SendTestModal({
  isOpen,
  onClose,
  channel,
  title,
  textBody,
  htmlBody,
}: SendTestModalProps) {
  const { success, error: showError } = useToast();
  const [recipient, setRecipient] = useState("");
  const [isSending, setIsSending] = useState(false);

  const getRecipientLabel = () => {
    const channelUpper = channel?.toUpperCase();
    if (channelUpper === "EMAIL") return "Email Address";
    if (channelUpper?.includes("SMS") || channelUpper === "USSD" || channelUpper === "WHATSAPP") return "Phone Number (MSISDN)";
    if (channelUpper === "PUSH NOTIFICATION") return "App ID";
    return "Recipient Contact";
  };

  const getRecipientPlaceholder = () => {
    const channelUpper = channel?.toUpperCase();
    if (channelUpper === "EMAIL") return "Enter email address";
    if (channelUpper?.includes("SMS") || channelUpper === "USSD" || channelUpper === "WHATSAPP") return "Enter phone number";
    if (channelUpper === "PUSH NOTIFICATION") return "Enter App ID";
    return "Enter recipient contact";
  };

  const validateRecipient = () => {
    if (!recipient.trim()) {
      showError("Validation", "Please enter a recipient");
      return false;
    }

    const channelUpper = channel?.toUpperCase();
    if (channelUpper === "EMAIL") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipient)) {
        showError("Validation", "Please enter a valid email address");
        return false;
      }
    }

    return true;
  };

  const handleSendTest = async () => {
    if (!validateRecipient()) return;

    try {
      setIsSending(true);
      // Mock API call - in production, this would call an actual endpoint
      await new Promise((resolve) => setTimeout(resolve, 1000));

      success("Success", `Test message sent to ${recipient}`);
      setRecipient("");
      onClose();
    } catch (err) {
      showError("Error", extractBackendError(err, "Error. Please try again."));
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setRecipient("");
    onClose();
  };

  return (
    <RegularModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Send Test Message"
      size="lg"
    >
      <div className="space-y-6">
        {/* Channel & Content Preview */}
        <div className="space-y-4">
          <Input
            label="Channel"
            value={channel}
            onChange={() => {}}
            disabled
          />

          {title && (
            <Input
              label="Title / Subject"
              value={title}
              onChange={() => {}}
              disabled
            />
          )}

          {textBody && (
            <textarea
              value={textBody}
              disabled
              className="w-full px-3 pt-3 pb-2 text-sm border rounded-lg resize-none max-h-32 overflow-y-auto relative"
              style={{
                paddingTop: '24px',
                backgroundColor: 'var(--c-surface-cards)',
                borderColor: 'var(--c-border-default)',
                color: 'var(--c-text-secondary)',
              }}
              readOnly
            />
          )}
        </div>

        {/* Recipient Input */}
        <Input
          label={getRecipientLabel() + " *"}
          placeholder={getRecipientPlaceholder()}
          value={recipient}
          onChange={(value) => setRecipient(value)}
        />

        {/* Footer */}
        <ModalFooter
          onCancel={handleClose}
          onConfirm={handleSendTest}
          cancelText="Cancel"
          confirmText={
            isSending ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Send Test
              </span>
            )
          }
          isLoading={isSending}
          confirmClassName={`px-4 py-2 text-white ${tw.rounded} transition-colors disabled:opacity-50 flex items-center gap-2`}
          confirmStyle={{ backgroundColor: color.primary.action }}
        />
      </div>
    </RegularModal>
  );
}
