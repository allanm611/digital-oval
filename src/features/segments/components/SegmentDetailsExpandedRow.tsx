import { color, tw } from "../../../shared/utils/utils";
import { Segment } from "../types/segment";
import DateFormatter from "../../../shared/components/DateFormatter";

interface SegmentDetailsExpandedRowProps {
  segment: Segment;
  colSpan: number;
}

export default function SegmentDetailsExpandedRow({
  segment,
  colSpan,
}: SegmentDetailsExpandedRowProps) {
  const formatValue = (value: unknown) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    return value;
  };

  return (
    <div style={{ backgroundColor: color.surface.tablebodybg }} className="px-6 py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {segment.description && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Description
            </label>
            <div className={`text-sm ${tw.textPrimary} break-words`}>
              {formatValue(segment.description)}
            </div>
          </div>
        )}

        {segment.category && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Category
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              {formatValue(segment.category)}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className={`text-xs font-medium ${tw.textMuted}`}>
            Status
          </label>
          <div className={`text-sm ${tw.textPrimary}`}>
            {segment.is_active ? "Active" : "Inactive"}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className={`text-xs font-medium ${tw.textMuted}`}>
            Visibility
          </label>
          <div className={`text-sm ${tw.textPrimary}`}>
            {segment.visibility === "public" ? "Public" : "Private"}
          </div>
        </div>

        {segment.tags && segment.tags.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Tags
            </label>
            <div className="flex flex-wrap gap-1">
              {segment.tags.map((tag) => (
                <span
                  key={tag}
                  className={`inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {segment.created_at && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Created
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              <DateFormatter date={new Date(segment.created_at)} useUserTimezone />
            </div>
          </div>
        )}

        {segment.updated_at && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Last Updated
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              <DateFormatter date={new Date(segment.updated_at)} useUserTimezone />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
