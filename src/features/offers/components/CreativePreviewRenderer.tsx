/**
 * Reusable Creative Preview Component
 * Handles device-specific previews for all channels
 * Used by both OfferCreativeFormModal and OfferCreativeStep
 */

import { ReactNode } from "react";
import { tw } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";
import {
  SMSSmartphonePreview,
  EmailLaptopPreview,
  WhatsAppPhonePreview,
  PushNotificationPreview,
  USSDMenuPreview,
} from "./CreativePreviewComponents";
import GenericPhonePreview from "./GenericPhonePreview";

interface CreativePreviewRendererProps {
  channel?: string;
  title: string;
  textBody: string;
  htmlBody?: string;
}

// Normalize channel name to base channel (e.g., "SMS Normal" -> "SMS")
const getBaseChannelFromName = (channelName: string): string => {
  if (!channelName) return "";
  const upper = channelName.toUpperCase();

  if (upper.includes("SMS")) return "SMS";
  if (upper.includes("EMAIL")) return "EMAIL";
  if (upper.includes("WHATSAPP")) return "WHATSAPP";
  if (upper.includes("PUSH")) return "PUSH";
  if (upper.includes("USSD")) return "USSD";

  return upper;
};

export default function CreativePreviewRenderer({
  channel,
  title,
  textBody,
  htmlBody,
}: CreativePreviewRendererProps): ReactNode {
  const { t } = useLanguage();
  const baseChannel = getBaseChannelFromName(channel || "");

  if (!baseChannel) {
    return (
      <div className="space-y-4">
        {title && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.offers.preview.renderedTitle}
            </label>
            <div className={`bg-gray-50 border border-gray-200 ${tw.rounded} p-4`}>
              <p className="text-gray-900">{title}</p>
            </div>
          </div>
        )}
        {textBody && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.offers.preview.renderedTextBody}
            </label>
            <div className={`bg-gray-50 border border-gray-200 ${tw.rounded} p-4`}>
              <p className="text-gray-900 whitespace-pre-wrap">{textBody}</p>
            </div>
          </div>
        )}
        {htmlBody && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.offers.preview.renderedHtmlBody}
            </label>
            <div className={`bg-gray-50 border border-gray-200 ${tw.rounded} p-4`}>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlBody }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // SMS Channel - show phone device
  if (baseChannel === "SMS") {
    return (
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          {t.offers.preview.smsPreview}
        </h3>
        <SMSSmartphonePreview
          message={textBody || title || ""}
          title={title}
        />
      </div>
    );
  }

  // Email Channel - show laptop device
  if (baseChannel === "EMAIL") {
    return (
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          {t.offers.preview.emailPreview}
        </h3>
        <EmailLaptopPreview title={title} htmlBody={htmlBody} textBody={textBody} />
      </div>
    );
  }

  // WhatsApp Channel - show phone device
  if (baseChannel === "WHATSAPP") {
    return (
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          WhatsApp Preview
        </h3>
        <WhatsAppPhonePreview message={textBody || title || ""} title={title} />
      </div>
    );
  }

  // Push Notification Channel
  if (baseChannel === "PUSH") {
    return (
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Push Notification Preview
        </h3>
        <PushNotificationPreview message={textBody || title || ""} title={title} />
      </div>
    );
  }

  // USSD Channel
  if (baseChannel === "USSD") {
    return (
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          USSD Menu Preview
        </h3>
        <USSDMenuPreview message={textBody || title || ""} title={title} />
      </div>
    );
  }

  // Fallback for unknown channels - show generic phone preview
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        {channelLabel} Preview
      </h3>
      <GenericPhonePreview
        title={title}
        message={textBody || title || ""}
      />
    </div>
  );
}
