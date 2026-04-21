import { color, tw } from "../../utils/utils";
import HeadlessSelect from "./HeadlessSelect";

interface PaginationProps {
  currentPage: number; // 1-indexed
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  showPageSizeSelector?: boolean;
}

export default function Pagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = false,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      className={`bg-white ${tw.rounded} border px-4 sm:px-6 py-4 w-full`}
      style={{ borderColor: color.border.default }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 gap-4">
        <div className={`text-sm ${tw.textSecondary} text-center sm:text-left flex-shrink-0`}>
          Showing {startItem} to {endItem} of {totalItems} items
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4 w-full sm:w-auto">
          {showPageSizeSelector && onPageSizeChange && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Per page:
              </label>
              <HeadlessSelect
                value={String(pageSize)}
                onChange={(value) => {
                  onPageSizeChange(Number(value));
                  onPageChange(1);
                }}
                options={[
                  { label: "10", value: "10" },
                  { label: "20", value: "20" },
                  { label: "50", value: "50" },
                  { label: "100", value: "100" },
                ]}
                placeholder="Select page size"
                className="w-auto min-w-[100px]"
              />
            </div>
          )}

          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className={`px-3 py-2 text-sm border ${tw.rounded} hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
              style={{ borderColor: color.border.default }}
            >
              Previous
            </button>
            <span className={`text-sm ${tw.textSecondary} px-2`}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className={`px-3 py-2 text-sm border ${tw.rounded} hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
              style={{ borderColor: color.border.default }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
