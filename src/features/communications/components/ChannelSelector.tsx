import { Mail, MessageSquare, Phone, Bell } from "lucide-react";
import { CommunicationChannel } from "../types/communication";
import { tw, color } from "../../../shared/utils/utils";

interface ChannelSelectorProps {
  selectedChannel: CommunicationChannel;
  onChannelChange: (channel: CommunicationChannel) => void;
}

export default function ChannelSelector({
  selectedChannel,
  onChannelChange,
}: ChannelSelectorProps) {
  const channels: {
    value: CommunicationChannel;
    label: string;
    icon: React.ElementType;
    color: string;
  }[] = [
    { value: "SMS", label: "SMS", icon: MessageSquare, color: "#10B981" },
    { value: "EMAIL", label: "Email", icon: Mail, color: "#3B82F6" },
    { value: "WHATSAPP", label: "WhatsApp", icon: Phone, color: "#25D366" },
    { value: "PUSH", label: "Push Notification", icon: Bell, color: "#F59E0B" },
  ];

  return (
    <div className="space-y-3">
      <label className={`${tw.label}`}>Communication Channel</label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {channels.map(({ value, label, icon: Icon, color: channelColor }) => {
          const isSelected = selectedChannel === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChannelChange(value)}
              className={`
                relative p-4 ${tw.rounded} border-2 transition-all duration-200
                ${
                  isSelected
                    ? "shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }
              `}
              style={
                isSelected
                  ? {
                      borderColor: color.primary.accent,
                      backgroundColor: `${color.primary.accent}15`,
                    }
                  : {}
              }
            >
              <div className="flex flex-col items-center space-y-2">
                <div
                  className={`
                    p-3 ${tw.rounded} transition-colors
                    ${isSelected ? "bg-white" : "bg-gray-50"}
                  `}
                  style={{ color: isSelected ? channelColor : "#9CA3AF" }}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span
                  className={`
                    text-sm font-medium transition-colors
                    ${isSelected ? "text-gray-900" : "text-gray-700"}
                  `}
                >
                  {label}
                </span>
              </div>
              {isSelected && (
                <div
                  className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: color.primary.accent }}
                >
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
