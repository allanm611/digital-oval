import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Download,
  FileText,
  Database,
  Calendar,
  User,
  Send,
} from "lucide-react";
import { tw, zIndex } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { QuickList, QuickListData } from "../types/quicklist";
import { quicklistService } from "../services/quicklistService";

interface QuickListDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quicklist: QuickList;
  onExport: (quicklist: QuickList, format: "csv" | "json") => void;
  onCommunicate?: (quicklist: QuickList) => void;
}

export default function QuickListDetailsModal({
  isOpen,
  onClose,
  quicklist,
  onExport,
  onCommunicate,
}: QuickListDetailsModalProps) {
  const [data, setData] = useState<QuickListData[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [currentQuickList, setCurrentQuickList] =
    useState<QuickList>(quicklist);

  // Update local state when quicklist prop changes
  useEffect(() => {
    setCurrentQuickList(quicklist);
  }, [quicklist]);

  // Reload full QuickList details when modal opens
  useEffect(() => {
    if (isOpen) {
      loadQuickListDetails();
    }
  }, [isOpen, quicklist.id]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, quicklist.id]);

  const loadQuickListDetails = async () => {
    try {
      const response = await quicklistService.getQuickListById(
        quicklist.id,
        true
      );
      console.log("QuickList details from API:", response.data);
      setCurrentQuickList(response.data);
    } catch (err) {
      console.error("Failed to load quicklist details:", err);
      // Fall back to the provided quicklist
      setCurrentQuickList(quicklist);
    }
  };

  const loadData = async () => {
    try {
      setLoadingData(true);
      const response = await quicklistService.getQuickListData(quicklist.id, {
        limit: 50,
      });
      console.log("QuickList data received:", response);
      setData(response.data || []);

      // Extract columns from data and update metadata
      if (response.data && response.data.length > 0) {
        const firstRow = response.data[0];
        console.log("First row:", firstRow);
        console.log("First row keys:", Object.keys(firstRow));

        // Get all keys except metadata fields
        const extractedColumns = Object.keys(firstRow).filter(
          (key) =>
            !["id", "quicklist_id", "created_at", "row_number"].includes(key)
        );

        console.log("Extracted columns:", extractedColumns);

        // Update currentQuickList with extracted columns and row count from pagination
        setCurrentQuickList((prev) => {
          const updated = {
            ...prev,
            columns: extractedColumns,
            column_count: extractedColumns.length,
            row_count: response.pagination?.total || response.data.length,
          };
          console.log("Updated currentQuickList:", updated);
          return updated;
        });
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: zIndex.modal }}>
      <div className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">
              {currentQuickList.name}
            </h2>
            {currentQuickList.description && (
              <p className="text-sm text-gray-500 mt-1">
                {currentQuickList.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors ml-4`}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50 border-b">
          <div className="flex items-start space-x-3">
            <div className={`p-2 bg-blue-100 ${tw.rounded}`}>
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Upload Type</p>
              <p className="text-sm font-semibold text-gray-900">
                {currentQuickList.upload_type}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className={`p-2 bg-green-100 ${tw.rounded}`}>
              <Database className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Rows</p>
              <p className="text-sm font-semibold text-gray-900">
                {currentQuickList.row_count != null
                  ? currentQuickList.row_count.toLocaleString()
                  : "N/A"}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className={`p-2 bg-purple-100 ${tw.rounded}`}>
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Created</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatDate(currentQuickList.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className={`p-2 bg-orange-100 ${tw.rounded}`}>
              <User className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Created By</p>
              <p className="text-sm font-semibold text-gray-900">
                {currentQuickList.created_by}
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">File Name:</span>{" "}
              <span className="font-medium text-gray-900">
                {currentQuickList.file_name || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">File Size:</span>{" "}
              <span className="font-medium text-gray-900">
                {currentQuickList.file_size != null
                  ? formatFileSize(currentQuickList.file_size)
                  : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Columns:</span>{" "}
              <span className="font-medium text-gray-900">
                {currentQuickList.column_count ?? "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Data Preview */}
        <div className="flex-1 overflow-auto p-6">
          <div>
            {loadingData ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner variant="modern" size="md" color="primary" />
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-12">
                <Database className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No data available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800 border-b border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase">
                        Row
                      </th>
                      {(currentQuickList.columns || [])
                        .slice(0, 10)
                        .map((column) => (
                          <th
                            key={column}
                            className="px-4 py-3 text-left text-xs font-semibold text-white uppercase"
                          >
                            {column.replace(/_/g, " ")}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {data.map((row, index) => (
                      <tr
                        key={row.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        <td className="px-4 py-3 text-gray-900 font-medium">
                          {index + 1}
                        </td>
                        {(currentQuickList.columns || [])
                          .slice(0, 10)
                          .map((column) => (
                            <td
                              key={column}
                              className="px-4 py-3 text-gray-600"
                            >
                              {(row as Record<string, unknown>)[column] !==
                                undefined &&
                              (row as Record<string, unknown>)[column] !== null
                                ? String(
                                    (row as Record<string, unknown>)[column]
                                  )
                                : "-"}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(currentQuickList.columns?.length || 0) > 10 && (
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    Showing first 10 columns of{" "}
                    {currentQuickList.columns?.length || 0} total columns
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={() => onExport(currentQuickList, "csv")}
            className={`px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 ${tw.rounded} hover:bg-gray-50 transition-colors flex items-center space-x-2`}
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => onExport(currentQuickList, "json")}
            className={`px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 ${tw.rounded} hover:bg-gray-50 transition-colors flex items-center space-x-2`}
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm font-medium text-white bg-gray-800 ${tw.rounded} hover:bg-gray-900 transition-colors`}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
