import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Search } from "lucide-react";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { Popover } from "@headlessui/react";
import Pagination from "../../../shared/components/ui/Pagination";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Checkbox from "../../../shared/components/ui/Checkbox";
import { tw, zIndex, color } from "../../../shared/utils/utils";
import { quicklistService } from "../services/quicklistService";
import { QuickList, QuickListData } from "../types/quicklist";

interface SelectedCustomer {
  customer_id: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}

interface RemoveCustomersFromQuickListModalProps {
  isOpen: boolean;
  onClose: () => void;
  quicklist: QuickList | null;
  onRemove?: (customers: SelectedCustomer[]) => void;
  isLoading?: boolean;
}

export default function RemoveCustomersFromQuickListModal({
  isOpen,
  onClose,
  quicklist,
  onRemove,
  isLoading = false,
}: RemoveCustomersFromQuickListModalProps) {
  const [quicklistData, setQuicklistData] = useState<QuickListData[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<SelectedCustomer[]>(
    [],
  );
  const [dataLoading, setDataLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalData, setTotalData] = useState(0);

  useEffect(() => {
    if (isOpen && quicklist) {
      setPage(1);
      loadQuickListData();
    }
  }, [isOpen, quicklist?.id]);

  const loadQuickListData = useCallback(async () => {
    if (!quicklist) return;

    setDataLoading(true);
    try {
      const response = await quicklistService.getQuickListData(quicklist.id, {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        skipCache: true,
      });

      const data = response?.data || [];
      setQuicklistData(data);
      const total = (response as any).pagination?.total || data.length || 0;
      setTotalData(total);
    } catch (error) {
      console.error("Failed to load quicklist data:", error);
      setQuicklistData([]);
      setTotalData(0);
    } finally {
      setDataLoading(false);
    }
  }, [quicklist?.id, page, pageSize]);

  useEffect(() => {
    loadQuickListData();
  }, [loadQuickListData]);

  const filteredData = useMemo(() => {
    return quicklistData.filter((item) => {
      const matchesSearch =
        Object.values(item).some(
          (value) =>
            value &&
            String(value)
              .toLowerCase()
              .includes(searchTerm.toLowerCase()),
        );

      if (statusFilter === "all") return matchesSearch;
      return matchesSearch && item.status === statusFilter;
    });
  }, [quicklistData, searchTerm, statusFilter]);

  const handleToggleCustomer = (item: QuickListData) => {
    const itemId = String(item.id || item.customer_id);
    const isSelected = selectedCustomers.some(
      (m) => String(m.customer_id) === itemId,
    );

    if (isSelected) {
      setSelectedCustomers(
        selectedCustomers.filter(
          (m) => String(m.customer_id) !== itemId,
        ),
      );
    } else {
      setSelectedCustomers([
        ...selectedCustomers,
        {
          customer_id: Number(itemId),
          customer_name: item.customer_name || item.name || undefined,
          customer_email: item.email || item.customer_email || undefined,
          customer_phone: item.phone || item.msisdn || undefined,
        },
      ]);
    }
  };

  const handleSelectAll = () => {
    const allSelected = filteredData.every((item) =>
      selectedCustomers.some(
        (m) => String(m.customer_id) === String(item.id || item.customer_id),
      ),
    );

    if (allSelected) {
      const selectedIds = filteredData.map((item) =>
        String(item.id || item.customer_id),
      );
      setSelectedCustomers(
        selectedCustomers.filter(
          (m) => !selectedIds.includes(String(m.customer_id)),
        ),
      );
    } else {
      const newCustomers = filteredData
        .filter(
          (item) =>
            !selectedCustomers.some(
              (m) => String(m.customer_id) === String(item.id || item.customer_id),
            ),
        )
        .map((item) => ({
          customer_id: Number(item.id || item.customer_id),
          customer_name: item.customer_name || item.name || undefined,
          customer_email: item.email || item.customer_email || undefined,
          customer_phone: item.phone || item.msisdn || undefined,
        }));
      setSelectedCustomers([...selectedCustomers, ...newCustomers]);
    }
  };

  const handleConfirm = () => {
    if (onRemove && selectedCustomers.length > 0) {
      onRemove(selectedCustomers);
    }
    handleClose();
  };

  const handleClose = () => {
    setSelectedCustomers([]);
    setSearchTerm("");
    setStatusFilter("all");
    onClose();
  };

  if (!isOpen || !quicklist) return null;

  // Get column names from first item or use defaults
  const columns = quicklistData.length > 0
    ? Object.keys(quicklistData[0]).filter(
        (key) =>
          !key.startsWith("_") &&
          key !== "id" &&
          !["id", "quicklist_id"].includes(key),
      )
    : [];

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: zIndex.modal }}
    >
      <div
        className={`bg-white ${tw.rounded} w-full max-w-4xl max-h-[90vh] flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-black">
              Remove Customers from QuickList
            </h2>
            <p className="text-sm text-gray-600 mt-1">{quicklist.name}</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
                className={`w-full pl-10 pr-4 py-2 border border-gray-300 ${tw.rounded} text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50 disabled:bg-gray-100`}
              />
            </div>
            <Popover className="relative w-48">
              <Popover.Button
                disabled={isLoading}
                className={`w-full px-4 py-2 border border-gray-300 ${tw.rounded} text-sm font-medium text-black hover:bg-gray-50 transition-colors text-left flex items-center justify-between disabled:opacity-50 disabled:bg-gray-100`}
              >
                {statusFilter === "all" ? "All Statuses" : statusFilter}
                <ChevronUpDownIcon className="w-4 h-4 text-gray-400" />
              </Popover.Button>
              <Popover.Panel
                className={`absolute right-0 mt-2 w-48 ${tw.rounded} border border-gray-200 bg-white shadow-lg`}
                style={{ zIndex: zIndex.popover }}
              >
                <div className="py-1">
                  {["all", "Active", "Inactive", "Suspended"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                        statusFilter === status
                          ? "bg-blue-50 font-medium"
                          : "hover:bg-gray-50"
                      }`}
                      style={{
                        color: "black",
                      }}
                    >
                      {status === "all" ? "All Statuses" : status}
                    </button>
                  ))}
                </div>
              </Popover.Panel>
            </Popover>
          </div>
        </div>

        {/* Selected Count */}
        {selectedCustomers.length > 0 && (
          <div className="px-6 flex-shrink-0 my-3">
            <div
              className="rounded-lg p-4 border bg-white"
              style={{
                borderColor: color.primary.accent,
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-sm"
                  style={{
                    color: color.primary.accent,
                  }}
                >
                  {selectedCustomers.length} customer
                  {selectedCustomers.length !== 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={() => setSelectedCustomers([])}
                  className="text-sm font-medium hover:opacity-80 transition-opacity"
                  style={{
                    color: color.primary.accent,
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Data List */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {dataLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner variant="modern" size="lg" color="primary" />
              <p className="text-sm text-black mt-4">Loading quicklist data...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-black mb-2">
                No customers found
              </h3>
              <p className="text-sm text-gray-600">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">
                      <Checkbox
                        checked={
                          selectedCustomers.length ===
                            filteredData.length &&
                          filteredData.length > 0
                        }
                        onChange={handleSelectAll}
                        disabled={isLoading}
                      />
                    </th>
                    {columns.slice(0, 4).map((col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        {col.replace(/_/g, " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((item) => {
                    const itemId = String(item.id || item.customer_id);
                    const isSelected = selectedCustomers.some(
                      (m) => String(m.customer_id) === itemId,
                    );

                    return (
                      <tr
                        key={itemId}
                        onClick={() =>
                          !isLoading && handleToggleCustomer(item)
                        }
                        className={`${!isLoading ? "cursor-pointer" : ""} transition-colors hover:bg-gray-50`}
                      >
                        <td
                          className="px-4 py-4 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleToggleCustomer(item)}
                            disabled={isLoading}
                          />
                        </td>
                        {columns.slice(0, 4).map((col) => (
                          <td
                            key={col}
                            className="px-4 py-4 whitespace-nowrap"
                          >
                            <span className="text-sm text-black">
                              {String(item[col as keyof QuickListData] || "—")}
                            </span>
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

        {/* Pagination */}
        {totalData > pageSize && (
          <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
            <Pagination
              currentPage={page}
              pageSize={pageSize}
              totalItems={totalData}
              onPageChange={(newPage) => {
                setPage(newPage);
              }}
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 flex-shrink-0">
          <div className="text-sm text-black">
            {selectedCustomers.length} customer
            {selectedCustomers.length !== 1 ? "s" : ""} selected
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className={`px-4 py-2 border border-gray-300 text-black ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedCustomers.length === 0 || isLoading}
              className={`px-5 py-2 ${tw.rounded} text-sm font-medium transition-opacity ${
                selectedCustomers.length === 0 || isLoading
                  ? "cursor-not-allowed opacity-50"
                  : ""
              }`}
              style={{
                backgroundColor:
                  selectedCustomers.length > 0 && !isLoading
                    ? color.primary.action
                    : color.text.muted,
                color: "white",
              }}
            >
              {selectedCustomers.length > 0
                ? `Remove (${selectedCustomers.length}) Customers`
                : "Select Customers"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
