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
import { QuickList } from "../types/quicklist";

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

interface AddCustomersToQuickListModalProps {
  isOpen: boolean;
  onClose: () => void;
  quicklist: QuickList | null;
  onAdd?: (customers: SelectedCustomer[]) => void;
  isLoading?: boolean;
}

export default function AddCustomersToQuickListModal({
  isOpen,
  onClose,
  quicklist,
  onAdd,
  isLoading = false,
}: AddCustomersToQuickListModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<SelectedCustomer[]>(
    [],
  );
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerStatusFilter, setCustomerStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCustomers, setTotalCustomers] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setPage(1);
      loadCustomers();
    }
  }, [isOpen]);

  const loadCustomers = useCallback(async () => {
    setCustomerLoading(true);
    try {
      const response = await customerService.getAllCustomers({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        skipCache: true,
      });
      const data = response?.data || [];
      setCustomers(data);
      const total = (response as any).pagination?.total || data.length || 0;
      setTotalCustomers(total);
    } catch (error) {
      console.error("Failed to load customers:", error);
      setCustomers([]);
      setTotalCustomers(0);
    } finally {
      setCustomerLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const fullName =
        `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
      const matchesSearch =
        fullName.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
        (customer.msisdn?.toLowerCase() || "").includes(
          customerSearchTerm.toLowerCase(),
        ) ||
        (customer.email_address?.toLowerCase() || "").includes(
          customerSearchTerm.toLowerCase(),
        ) ||
        String(customer.customerId || customer.id || "").includes(
          customerSearchTerm,
        );

      if (customerStatusFilter === "all") return matchesSearch;
      const status = customer.status;
      return matchesSearch && status === customerStatusFilter;
    });
  }, [customers, customerSearchTerm, customerStatusFilter]);

  const getCustomerId = (customer: Customer) => {
    return customer.customerId || customer.id;
  };

  const handleToggleCustomer = (customer: Customer) => {
    const customerId = getCustomerId(customer);
    const isSelected = selectedCustomers.some(
      (m) => m.customer_id === Number(customerId),
    );

    if (isSelected) {
      setSelectedCustomers(
        selectedCustomers.filter(
          (m) => m.customer_id !== Number(customerId),
        ),
      );
    } else {
      setSelectedCustomers([
        ...selectedCustomers,
        {
          customer_id: Number(customerId),
          customer_name:
            `${customer.first_name || ""} ${customer.last_name || ""}`.trim() ||
            undefined,
          customer_email: customer.email_address || undefined,
          customer_phone: customer.msisdn || undefined,
        },
      ]);
    }
  };

  const handleSelectAll = () => {
    const allSelected = filteredCustomers.every((customer) =>
      selectedCustomers.some(
        (m) => m.customer_id === Number(getCustomerId(customer)),
      ),
    );

    if (allSelected) {
      const selectedIds = filteredCustomers.map((c) => Number(getCustomerId(c)));
      setSelectedCustomers(
        selectedCustomers.filter(
          (m) => !selectedIds.includes(m.customer_id),
        ),
      );
    } else {
      const newCustomers = filteredCustomers
        .filter(
          (customer) =>
            !selectedCustomers.some(
              (m) => m.customer_id === Number(getCustomerId(customer)),
            ),
        )
        .map((customer) => ({
          customer_id: Number(getCustomerId(customer)),
          customer_name:
            `${customer.first_name || ""} ${customer.last_name || ""}`.trim() ||
            undefined,
          customer_email: customer.email_address || undefined,
          customer_phone: customer.msisdn || undefined,
        }));
      setSelectedCustomers([...selectedCustomers, ...newCustomers]);
    }
  };

  const handleConfirm = () => {
    if (onAdd && selectedCustomers.length > 0) {
      onAdd(selectedCustomers);
    }
    handleClose();
  };

  const handleClose = () => {
    setSelectedCustomers([]);
    setCustomerSearchTerm("");
    setCustomerStatusFilter("all");
    onClose();
  };

  if (!isOpen || !quicklist) return null;

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
              Add Customers to QuickList
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
            <SearchInput
              placeholder="Search by name, email, phone..."
              value={customerSearchTerm}
              onChange={setCustomerSearchTerm}
            />
            <Popover className="relative w-48">
              <Popover.Button
                disabled={isLoading}
                className={`w-full px-4 py-2 border border-gray-300 ${tw.rounded} text-sm font-medium text-black hover:bg-gray-50 transition-colors text-left flex items-center justify-between disabled:opacity-50 disabled:bg-gray-100`}
              >
                {customerStatusFilter === "all"
                  ? "All Statuses"
                  : customerStatusFilter}
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
                      onClick={() => setCustomerStatusFilter(status)}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                        customerStatusFilter === status
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

        {/* Customers List */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {customerLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner variant="modern" size="lg" color="primary" />
              <p className="text-sm text-black mt-4">Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
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
                            filteredCustomers.length &&
                          filteredCustomers.length > 0
                        }
                        onChange={handleSelectAll}
                        disabled={isLoading}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Msisdn
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => {
                    const customerId = getCustomerId(customer);
                    const isSelected = selectedCustomers.some(
                      (m) => m.customer_id === Number(customerId),
                    );

                    return (
                      <tr
                        key={customer.id || customerId}
                        onClick={() =>
                          !isLoading && handleToggleCustomer(customer)
                        }
                        className={`${!isLoading ? "cursor-pointer" : ""} transition-colors hover:bg-gray-50`}
                      >
                        <td
                          className="px-4 py-4 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleToggleCustomer(customer)}
                            disabled={isLoading}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-black">
                            {`${customer.first_name || ""} ${customer.last_name || ""}`.trim() ||
                              "—"}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-black">
                            {customer.msisdn || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-black">
                            {customer.email_address || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-black">
                            {customer.status || "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalCustomers > pageSize && (
          <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
            <Pagination
              currentPage={page}
              pageSize={pageSize}
              totalItems={totalCustomers}
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
                ? `Add (${selectedCustomers.length}) Customers`
                : "Select Customers"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
