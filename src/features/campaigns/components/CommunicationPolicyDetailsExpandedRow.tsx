import { color, tw } from "../../../shared/utils/utils";
import type { CommunicationPolicyConfiguration } from "../types/communicationPolicyConfig";
import DateFormatter from "../../../shared/components/DateFormatter";

interface CommunicationPolicyDetailsExpandedRowProps {
  policy: CommunicationPolicyConfiguration;
  colSpan: number;
}

export default function CommunicationPolicyDetailsExpandedRow({
  policy,
  colSpan,
}: CommunicationPolicyDetailsExpandedRowProps) {
  const formatValue = (value: unknown) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    return value;
  };

  const getTypeLabel = (typeCode: string) => {
    const labels: Record<string, string> = {
      EMAIL: "Email",
      SMS: "SMS",
      PUSH: "Push",
      INAPP: "In-App",
    };
    return labels[typeCode] || typeCode;
  };

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? "Active" : "Inactive";
  };

  const getChannelsDisplay = (channels: string[] | undefined) => {
    if (!channels || channels.length === 0) return "—";
    return channels.join(", ");
  };

  return (
    <div style={{ backgroundColor: color.surface.tablebodybg }} className="px-6 py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {policy.description && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Description
            </label>
            <div className={`text-sm ${tw.textPrimary} break-words`}>
              {formatValue(policy.description)}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className={`text-xs font-medium ${tw.textMuted}`}>
            Channels
          </label>
          <div className={`text-sm ${tw.textPrimary}`}>
            {getChannelsDisplay(policy.channels as any)}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className={`text-xs font-medium ${tw.textMuted}`}>
            Type
          </label>
          <div className={`text-sm ${tw.textPrimary}`}>
            {getTypeLabel((policy as any).type_code || "")}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className={`text-xs font-medium ${tw.textMuted}`}>
            Status
          </label>
          <div className={`text-sm ${tw.textPrimary}`}>
            {getStatusLabel(policy.is_active)}
          </div>
        </div>

        {policy.created_at && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Created
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              <DateFormatter date={new Date(policy.created_at)} useUserTimezone />
            </div>
          </div>
        )}

        {policy.updated_at && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Updated
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              <DateFormatter date={new Date(policy.updated_at)} useUserTimezone />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
