/**
 * Simple Text Preview Component
 * Shows plain text preview with title and body
 * Used in the right panel of OfferCreativeStep
 */

import { Eye } from "lucide-react";
import { tw, color } from "../../../shared/utils/utils";

interface SimpleTextPreviewProps {
  channel?: string;
  title: string;
  body: string;
}

export default function SimpleTextPreview({
  channel,
  title,
  body,
}: SimpleTextPreviewProps) {
  // Normalize channel name for display
  const getChannelLabel = (ch?: string): string => {
    if (!ch) return "Message";
    const upper = ch.toUpperCase();
    if (upper.includes("SMS")) return "SMS Message";
    if (upper.includes("EMAIL")) return "Email";
    if (upper.includes("WHATSAPP")) return "WhatsApp Message";
    if (upper.includes("PUSH")) return "Push Notification";
    if (upper.includes("USSD")) return "USSD Menu";
    return ch;
  };

  const channelLabel = getChannelLabel(channel);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-4 h-4 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-700">Message Preview</h3>
      </div>

      <div className={`bg-green-50 border border-green-200 ${tw.rounded} p-3 mb-4`}>
        <p className="text-sm font-medium text-green-800">{channelLabel}</p>
      </div>

      <div className="space-y-3">
        {title && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">
              Subject
            </label>
            <div className={`bg-white border border-gray-200 ${tw.rounded} p-3`}>
              <p className="text-sm text-gray-900 break-words font-medium">{title}</p>
            </div>
          </div>
        )}

        {body && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">
              Message
            </label>
            <div className={`bg-white border border-gray-200 ${tw.rounded} p-3`}>
              <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                {body}
              </p>
            </div>
          </div>
        )}

        {!title && !body && (
          <div className="text-center py-6 text-gray-500">
            <p className="text-sm">Preview with sample data: No sample data</p>
          </div>
        )}
      </div>
    </div>
  );
}
