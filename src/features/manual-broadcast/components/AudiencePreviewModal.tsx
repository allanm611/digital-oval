import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { quicklistService } from "../../quicklists/services/quicklistService";
import DateFormatter from "../../../shared/components/DateFormatter";

interface AudiencePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quicklistId: number | undefined;
  quicklistName: string | undefined;
}

export default function AudiencePreviewModal({
  isOpen,
  onClose,
  quicklistId,
  quicklistName,
}: AudiencePreviewModalProps) {
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && quicklistId) {
      loadQuicklistData();
    }
  }, [isOpen, quicklistId]);

  const loadQuicklistData = async () => {
    if (!quicklistId) return;
    try {
      setIsLoading(true);
      setError("");

      // Fetch metadata
      const metaResponse = await quicklistService.getQuickListById(quicklistId);
      console.log("Metadata response:", metaResponse);
      if (metaResponse.success) {
        setMetadata(metaResponse.data);
      }

      // Fetch data rows
      const dataResponse = await quicklistService.getQuickListData(quicklistId, {
        limit: 10,
      });
      console.log("Data response:", dataResponse);
      if (dataResponse.success && Array.isArray(dataResponse.data)) {
        setPreviewData(dataResponse.data);
      }
    } catch (err) {
      console.error("Failed to load quicklist preview:", err);
      setError("Failed to load preview data");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-[#2a2f31] rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              QuickList Preview
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {quicklistName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description */}
          {metadata?.description && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
                Description
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {metadata.description}
              </p>
            </div>
          )}

          {/* Data Preview */}
          <div>
            {previewData.length > 0 && !isLoading && !error && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Showing first {previewData.length} rows of {metadata?.rows_imported?.toLocaleString() || "many"} total
              </p>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-sm">
                {error}
              </div>
            ) : previewData.length === 0 ? (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-sm">
                No data available
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      {previewData.length > 0
                        ? Object.keys(
                            previewData[0]?.row_data ||
                              previewData[0] ||
                              {}
                          )
                            .filter(
                              (key) =>
                                ![
                                  "id",
                                  "quicklist_id",
                                  "added_at",
                                  "added_by",
                                  "removed_at",
                                  "removed_by",
                                  "created_at",
                                ].includes(key)
                            )
                            .map((key) => (
                              <th
                                key={key}
                                className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white"
                              >
                                {key}
                              </th>
                            ))
                        : null}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, idx) => {
                      const displayData = row?.row_data || row;
                      return (
                        <tr
                          key={idx}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          {Object.entries(displayData)
                            .filter(
                              ([key]) =>
                                ![
                                  "id",
                                  "quicklist_id",
                                  "added_at",
                                  "added_by",
                                  "removed_at",
                                  "removed_by",
                                  "created_at",
                                ].includes(key)
                            )
                            .map(([key, value]) => (
                              <td
                                key={`${idx}-${key}`}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 truncate"
                                title={String(value)}
                              >
                                {String(value)}
                              </td>
                            ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
