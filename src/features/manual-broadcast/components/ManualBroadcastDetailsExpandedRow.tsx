import { color, tw } from "../../../shared/utils/utils";
import { ManualBroadcast } from "../../communications/types/communication";
import DateFormatter from "../../../shared/components/DateFormatter";

interface ManualBroadcastDetailsExpandedRowProps {
  broadcast: ManualBroadcast;
  colSpan: number;
}

export default function ManualBroadcastDetailsExpandedRow({
  broadcast,
  colSpan,
}: ManualBroadcastDetailsExpandedRowProps) {
  const formatValue = (value: unknown) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    return value;
  };

  return (
    <div style={{ backgroundColor: color.surface.tablebodybg }} className="px-6 py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {broadcast.description && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Description
            </label>
            <div className={`text-sm ${tw.textPrimary} break-words`}>
              {formatValue(broadcast.description)}
            </div>
          </div>
        )}

        {broadcast.channels && broadcast.channels.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Channels
            </label>
            <div className="flex flex-wrap gap-1">
              {broadcast.channels.map((channel) => (
                <span
                  key={channel}
                  className={`inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full`}
                >
                  {channel}
                </span>
              ))}
            </div>
          </div>
        )}

        {broadcast.source_type && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Source Type
            </label>
            <div className={`text-sm ${tw.textPrimary} capitalize`}>
              {formatValue(broadcast.source_type)}
            </div>
          </div>
        )}

        {broadcast.schedule_type && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Schedule Type
            </label>
            <div className={`text-sm ${tw.textPrimary} capitalize`}>
              {formatValue(broadcast.schedule_type)}
            </div>
          </div>
        )}

        {broadcast.total_recipients !== undefined && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Total Recipients
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              {broadcast.total_recipients?.toLocaleString()}
            </div>
          </div>
        )}

        {broadcast.messages_sent !== undefined && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Messages Sent
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              {broadcast.messages_sent?.toLocaleString()}
            </div>
          </div>
        )}

        {broadcast.messages_failed !== undefined && broadcast.messages_failed > 0 && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Messages Failed
            </label>
            <div className={`text-sm text-red-600`}>
              {broadcast.messages_failed?.toLocaleString()}
            </div>
          </div>
        )}

        {broadcast.created_at && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Created
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              <DateFormatter date={new Date(broadcast.created_at)} useUserTimezone />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
