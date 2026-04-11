import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { Popover } from "@headlessui/react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { customerService } from "../../customers360/services/customerServices";
import Pagination from "../../../shared/components/ui/Pagination";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Checkbox from "../../../shared/components/ui/Checkbox";
import { tw, zIndex, color } from "../../../shared/utils/utils";
import { quicklistService } from "../services/quicklistService";
import { QuickList, QuickListData } from "../types/quicklist";

interface Customer {
  id: string | number;
  customerId?: string | number;
  first_name?: string;
  last_name?: string;
  msisdn?: string;
  email_address?: string;
  status?: string;
  createdAt?: string;
  subscriber_status?: string;
}

interface SelectedCustomer {
  customer_id: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}

interface ManageQuickListCustomersModalProps {
  isOpen: boolean;
  onClose: () => void;
  quicklist: QuickList | null;
  mode: "add" | "remove";
  onSubmit?: (customers: SelectedCustomer[]) => void;
  isLoading?: boolean;
}

export default function ManageQuickListCustomersModal({
  isOpen,
  onClose,
  quicklist,
  mode,
  onSubmit,
  isLoading = false,
}: ManageQuickListCustomersModalProps) {
  const [items, setItems] = useState<(Customer | QuickListData)[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<SelectedCustomer[]>(
    [],
  );
  const [itemLoading, setItemLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setPage(1);
      loadItems();
    }
  }, [isOpen, mode]);

  const loadItems = useCallback(async () => {
    if (!quicklist) return;

    setItemLoading(true);
    try {
      if (mode === "add") {
        // Load all customers
        const response = await customerService.getAllCustomers({
          limit: pageSize,
          offset: (page - 1) * pageSize,
          skipCache: true,
        });
        const data = response?.data || [];
        setItems(data);
        const total = (response as any).pagination?.total || data.length || 0;
        setTotalItems(total);
      } else {
        // Load quicklist data for removal
        const response = await quicklistService.getQuickListData(quicklist.id, {
          limit: pageSize,
          offset: (page - 1) * pageSize,
          skipCache: true,
        });
        const data = response?.data || [];
        setItems(data);
        const total = (response as any).pagination?.total || data.length || 0;
        setTotalItems(total);
      }
    } catch (error) {
      console.error("Failed to load items:", error);
      setItems([]);
      setTotalItems(0);
    } finally {
      setItemLoading(false);
    }
  }, [quicklist?.id, mode, page, pageSize]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      let matchesSearch = false;

      if (mode === "add") {
        const customer = item as Customer;
        const fullName =
          `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
        matchesSearch =
          fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (customer.msisdn?.toLowerCase() || "").includes(
            searchTerm.toLowerCase(),
          ) ||
          (customer.email_address?.toLowerCase() || "").includes(
            searchTerm.toLowerCase(),
          ) ||
          String(customer.customerId || customer.id || "").includes(searchTerm);
      } else {
        const data = item as QuickListData;
        matchesSearch = Object.values(data).some(
          (value) =>
            value &&
            String(value).toLowerCase().includes(searchTerm.toLowerCase()),
        );
      }

      if (statusFilter === "all") return matchesSearch;

      if (mode === "add") {
        const customer = item as Customer;
        return matchesSearch && customer.status === statusFilter;
      }
      return matchesSearch;
    });
  }, [items, searchTerm, statusFilter, mode]);

  const getItemId = (item: Customer | QuickListData) => {
    if (mode === "add") {
      const customer = item as Customer;
      return customer.customerId || customer.id;
    }
    const data = item as QuickListData;
    return data.id || data.customer_id;
  };

  const handleToggleItem = (item: Customer | QuickListData) => {
    const itemId = String(getItemId(item));
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
      if (mode === "add") {
        const customer = item as Customer;
        setSelectedCustomers([
          ...selectedCustomers,
          {
            customer_id: Number(itemId),
            customer_name:
              `${customer.first_name || ""} ${customer.last_name || ""}`.trim() ||
              undefined,
            customer_email: customer.email_address || undefined,
            customer_phone: customer.msisdn || undefined,
          },
        ]);
      } else {
        const data = item as QuickListData;
        setSelectedCustomers([
          ...selectedCustomers,
          {
            customer_id: Number(itemId),
            customer_name: data.customer_name || data.name || undefined,
            customer_email: data.email || data.customer_email || undefined,
            customer_phone: data.phone || data.msisdn || undefined,
          },
        ]);
      }
    }
  };

  const handleSelectAll = () => {
    const allSelected = filteredItems.every((item) =>
      selectedCustomers.some(
        (m) => String(m.customer_id) === String(getItemId(item)),
      ),
    );

    if (allSelected) {
      const selectedIds = filteredItems.map((item) =>
        String(getItemId(item)),
      );
      setSelectedCustomers(
        selectedCustomers.filter(
          (m) => !selectedIds.includes(String(m.customer_id)),
        ),
      );
    } else {
      const newItems = filteredItems
        .filter(
          (item) =>
            !selectedCustomers.some(
              (m) => String(m.customer_id) === String(getItemId(item)),
            ),
        )
        .map((item) => {
          const itemId = String(getItemId(item));
          if (mode === "add") {
            const customer = item as Customer;
            return {
              customer_id: Number(itemId),
              customer_name:
                `${customer.first_name || ""} ${customer.last_name || ""}`.trim() ||
                undefined,
              customer_email: customer.email_address || undefined,
              customer_phone: customer.msisdn || undefined,
            };
          }
          const data = item as QuickListData;
          return {
            customer_id: Number(itemId),
            customer_name: data.customer_name || data.name || undefined,
            customer_email: data.email || data.customer_email || undefined,
            customer_phone: data.phone || data.msisdn || undefined,
          };
        });
      setSelectedCustomers([...selectedCustomers, ...newItems]);
    }
  };

  const handleConfirm = () => {
    if (onSubmit && selectedCustomers.length > 0) {
      onSubmit(selectedCustomers);
    }
    handleClose();
  };

  const handleClose = () => {
    setSelectedCustomers([]);
    setSearchTerm("");
    setStatusFilter("all");
    onClose();
  };

  const getTableColumns = () => {
    if (mode === "add") return ["Name", "Msisdn", "Email", "Status"];
    if (items.length > 0) {
      return Object.keys(items[0] as QuickListData)
        .filter(
          (key) =>
            !key.startsWith("_") &&
            key !== "id" &&
            !["id", "quicklist_id"].includes(key),
        )
        .slice(0, 4);
    }
    return [];
  };

  const getCellValue = (item: Customer | QuickListData, column: string) => {
    if (mode === "add") {
      const customer = item as Customer;
      switch (column) {
        case "Name":
          return `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || "—";
        case "Msisdn":
          return customer.msisdn || "—";
        case "Email":
          return customer.email_address || "—";
        case "Status":
          return customer.status || "—";
        default:
          return "—";
      }
    }
    const data = item as QuickListData;
    return String(data[column as keyof QuickListData] || "—");
  };

  if (!isOpen || !quicklist) return null;

  const isAdd = mode === "add";
  const title = isAdd ? "Add Customers to QuickList" : "Remove Customers from QuickList";
  const buttonText = isAdd ? "Add" : "Remove";
  const tableColumns = getTableColumns();

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
            <h2 className="text-sm font-semibold text-black">{title}</h2>
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
            <SearchInput
              placeholder="Search by name, email, phone..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
            {isAdd && (
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
            )}
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

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {itemLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner variant="modern" size="lg" color="primary" />
              <p className="text-sm text-black mt-4">
                Loading {isAdd ? "customers" : "quicklist data"}...
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-black mb-2">
                No items found
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
                            filteredItems.length &&
                          filteredItems.length > 0
                        }
                        onChange={handleSelectAll}
                        disabled={isLoading}
                      />
                    </th>
                    {tableColumns.map((col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        {typeof col === "string"
                          ? col
                          : String(col).replace(/_/g, " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item) => {
                    const itemId = String(getItemId(item));
                    const isSelected = selectedCustomers.some(
                      (m) => String(m.customer_id) === itemId,
                    );

                    return (
                      <tr
                        key={itemId}
                        onClick={() =>
                          !isLoading && handleToggleItem(item)
                        }
                        className={`${!isLoading ? "cursor-pointer" : ""} transition-colors hover:bg-gray-50`}
                      >
                        <td
                          className="px-4 py-4 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleToggleItem(item)}
                            disabled={isLoading}
                          />
                        </td>
                        {tableColumns.map((col) => (
                          <td
                            key={col}
                            className="px-4 py-4 whitespace-nowrap"
                          >
                            <span className="text-sm text-black">
                              {getCellValue(item, col)}
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
        {totalItems > pageSize && (
          <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
            <Pagination
              currentPage={page}
              pageSize={pageSize}
              totalItems={totalItems}
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
                ? `${buttonText} (${selectedCustomers.length}) Customers`
                : `Select Customers to ${buttonText}`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
