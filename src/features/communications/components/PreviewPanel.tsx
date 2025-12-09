import { Eye, Mail, MessageSquare, Phone, Bell } from "lucide-react";
import { CommunicationChannel } from "../types/communication";
import { color , tw} from "../../../shared/utils/utils";

interface PreviewPanelProps {
  channel: CommunicationChannel;
  title?: string;
  body: string;
  sampleData?: Record<string, unknown>;
}

export default function PreviewPanel({
  channel,
  title,
  body,
  sampleData = {},
}: PreviewPanelProps) {
  // Replace variables with sample data
  const replaceVariables = (text: string): string => {
    let result = text;
    Object.keys(sampleData).forEach((key) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      result = result.replace(regex, sampleData[key] || `{{${key}}}`);
    });
    return result;
  };

  const previewTitle = title ? replaceVariables(title) : "";
  const previewBody = replaceVariables(body);

  const getChannelIcon = () => {
    switch (channel) {
      case "EMAIL":
        return <Mail className="w-5 h-5" />;
      case "SMS":
        return <MessageSquare className="w-5 h-5" />;
      case "WHATSAPP":
        return <Phone className="w-5 h-5" />;
      case "PUSH":
        return <Bell className="w-5 h-5" />;
    }
  };

  const getChannelColor = () => {
    switch (channel) {
      case "EMAIL":
        return "border-gray-200";
      case "SMS":
        return "bg-green-50 text-green-700 border-green-200";
      case "WHATSAPP":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "PUSH":
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const getChannelStyle = () => {
    if (channel === "EMAIL") {
      return {
        backgroundColor: `${color.primary.accent}15`,
        color: color.primary.accent,
      };
    }
    return {};
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-gray-700">
        <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
        <h3 className="text-xs sm:text-sm font-semibold">Message Preview</h3>
      </div>

      <div className={`bg-white ${tw.rounded} border border-gray-200 overflow-hidden`}>
        {/* Header */}
        <div
          className={`px-3 sm:px-4 py-2 sm:py-3 border-b flex items-center space-x-2 ${getChannelColor()}`}
          style={getChannelStyle()}
        >
          {getChannelIcon()}
          <span className="text-xs sm:text-sm font-semibold">
            {channel === "EMAIL" ? "Email Message" : `${channel} Message`}
          </span>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 space-y-3">
          {previewTitle && (
            <div>
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium mb-1">
                SUBJECT
              </p>
              <p className="text-sm sm:text-base font-semibold text-gray-900 break-words">
                {previewTitle}
              </p>
            </div>
          )}

          <div>
            {previewTitle && (
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium mb-1">
                MESSAGE
              </p>
            )}
            <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap leading-relaxed break-words">
              {previewBody || (
                <span className="text-gray-400 italic">
                  Your message will appear here...
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 sm:px-4 py-2 bg-gray-50 border-t">
          <p className="text-[10px] sm:text-xs text-gray-500 break-words">
            Preview with sample data:{" "}
            {Object.keys(sampleData).length > 0
              ? Object.keys(sampleData).join(", ")
              : "No sample data"}
          </p>
        </div>
      </div>
    </div>
  );
}
