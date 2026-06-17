import { color, tw } from "../../../shared/utils/utils";
import { QuickList } from "../types/quicklist";
import DateFormatter from "../../../shared/components/DateFormatter";

interface QuickListDetailsExpandedRowProps {
  quicklist: QuickList;
  colSpan: number;
}

export default function QuickListDetailsExpandedRow({
  quicklist,
  colSpan,
}: QuickListDetailsExpandedRowProps) {
  const formatValue = (value: unknown) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    return value;
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return "—";
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb > 1) return `${mb.toFixed(2)} MB`;
    return `${kb.toFixed(2)} KB`;
  };

  return (
    <div style={{ backgroundColor: color.surface.tablebodybg }} className="px-6 py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quicklist.description && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Description
            </label>
            <div className={`text-sm ${tw.textPrimary} break-words`}>
              {formatValue(quicklist.description)}
            </div>
          </div>
        )}

        {quicklist.original_filename && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Original Filename
            </label>
            <div className={`text-sm ${tw.textPrimary} truncate`} title={quicklist.original_filename}>
              {formatValue(quicklist.original_filename)}
            </div>
          </div>
        )}

        {quicklist.file_size_bytes && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              File Size
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              {formatFileSize(quicklist.file_size_bytes)}
            </div>
          </div>
        )}

        {quicklist.rows_imported !== undefined && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Rows Imported
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              {quicklist.rows_imported.toLocaleString()}
            </div>
          </div>
        )}

        {quicklist.rows_failed !== undefined && quicklist.rows_failed > 0 && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Rows Failed
            </label>
            <div className={`text-sm text-red-600`}>
              {quicklist.rows_failed.toLocaleString()}
            </div>
          </div>
        )}

        {quicklist.processing_status && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Processing Status
            </label>
            <div className={`text-sm ${tw.textPrimary} capitalize`}>
              {quicklist.processing_status}
            </div>
          </div>
        )}

        {quicklist.processing_time_ms && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Processing Time
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              {(quicklist.processing_time_ms / 1000).toFixed(2)}s
            </div>
          </div>
        )}

        {quicklist.created_by && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Created By
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              {formatValue(quicklist.created_by)}
            </div>
          </div>
        )}

        {quicklist.created_at && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Created
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              <DateFormatter date={new Date(quicklist.created_at)} useUserTimezone />
            </div>
          </div>
        )}

        {quicklist.updated_at && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Last Updated
            </label>
            <div className={`text-sm ${tw.textPrimary}`}>
              <DateFormatter date={new Date(quicklist.updated_at)} useUserTimezone />
            </div>
          </div>
        )}

        {quicklist.processing_error && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-medium ${tw.textMuted}`}>
              Processing Error
            </label>
            <div className={`text-sm text-red-600 break-words`}>
              {quicklist.processing_error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
