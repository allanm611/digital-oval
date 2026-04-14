import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { Popover } from "@headlessui/react";
import { customerService } from "../../customers360/services/customerServices";
import Pagination from "../../../shared/components/ui/Pagination";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { tw, zIndex, color } from "../../../shared/utils/utils";
import Checkbox from "../../../shared/components/ui/Checkbox";

interface Customer {
  id: string | number;
  customerId?: string | number;
  first_name?: string;
  last_name?: string;
  msisdn?: string;
  email?: string;
  status?: string;
  createdAt?: string;
  subscriber_status?: string;
}

interface AddMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  onAdd?: (customers: Customer[]) => Promise<void>;
  existingMemberIds?: (string | number)[];
  isAdding?: boolean;
}

export default function AddMembersModal({
  isOpen,
  onClose,
  groupName,
  onAdd,
  existingMemberIds = [],
  isAdding = false,
}: AddMembersModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
    setIsLoading(true);
    try {
      const response = await customerService.getAllCustomers({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        skipCache: true,
      });
      setCustomers(response.data || []);
      // Set total from pagination response
      const total = (response as any).pagination?.total || response.data?.length || 0;
      setTotalCustomers(total);
    } catch (error) {
      console.error("Failed to load customers:", error);
      setCustomers([]);
      setTotalCustomers(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize]);

  // Load customers when page changes
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const fullName = `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
      const matchesSearch =
        fullName.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
        (customer.msisdn?.toLowerCase() || "").includes(
          customerSearchTerm.toLowerCase()
        ) ||
        (customer.email?.toLowerCase() || "").includes(
          customerSearchTerm.toLowerCase()
        ) ||
        String(customer.customerId || customer.id || "").includes(customerSearchTerm);

      if (customerStatusFilter === "all") return matchesSearch;
      const status = customer.subscriber_status || customer.status;
      return matchesSearch && status === customerStatusFilter;
    });
  }, [customers, customerSearchTerm, customerStatusFilter]);

  const getCustomerId = (customer: Customer) => {
    return customer.customerId || customer.id;
  };

  const isExistingMember = (customer: Customer) => {
    const customerId = getCustomerId(customer);
    return existingMemberIds.some((id) => {
      const existingId = typeof id === "string" ? parseInt(id, 10) : id;
      const customerId_num = typeof customerId === "string" ? parseInt(customerId, 10) : customerId;
      return existingId === customerId_num;
    });
  };

  const handleToggleCustomer = (customer: Customer) => {
    if (isExistingMember(customer)) return; // Prevent toggling existing members

    const customerId = getCustomerId(customer);
    const isSelected = selectedCustomers.some(
      (c) => getCustomerId(c) === customerId
    );
    if (isSelected) {
      setSelectedCustomers(
        selectedCustomers.filter((c) => getCustomerId(c) !== customerId)
      );
    } else {
      setSelectedCustomers([...selectedCustomers, customer]);
    }
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers);
    }
  };

  const handleConfirm = async () => {
    if (onAdd && selectedCustomers.length > 0) {
      try {
        await onAdd(selectedCustomers);
        handleClose();
      } catch (error) {
        // Error handling is done by parent component
        console.error(error);
      }
    }
  };

  const handleClose = () => {
    setSelectedCustomers([]);
    setCustomerSearchTerm("");
    setCustomerStatusFilter("all");
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className={`bg-white ${tw.rounded} w-full max-w-4xl max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-black">Add Members to Control Group</h2>
            <p className="text-sm text-black mt-1">
              Select customers to add to "{groupName}"
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
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
              <Popover.Button className={`w-full px-4 py-2 border border-gray-300 ${tw.rounded} text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left flex items-center justify-between`}>
                {customerStatusFilter === "all" ? "All Statuses" : customerStatusFilter}
                <ChevronUpDownIcon className="w-4 h-4 text-gray-400" />
              </Popover.Button>
              <Popover.Panel className={`absolute right-0 mt-2 w-48 ${tw.rounded} border border-gray-200 bg-white shadow-lg`} style={{ zIndex: zIndex.modal }}>
                <div className="py-1">
                  {["all", "active", "inactive", "suspended"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setCustomerStatusFilter(status)}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                        customerStatusFilter === status
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
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
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner variant="modern" size="lg" color="primary" />
              <p className="text-sm text-black mt-4">Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-black mb-2">
                No customers found
              </h3>
              <p className="text-sm text-black">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">
                      <div className="flex items-center gap-2 cursor-pointer" onClick={handleSelectAll}>
                        <Checkbox
                          id="select-all-customers"
                          checked={
                            selectedCustomers.length === filteredCustomers.length &&
                            filteredCustomers.length > 0
                          }
                          onChange={handleSelectAll}
                        />
                      </div>
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
                      (c) => getCustomerId(c) === customerId
                    );
                    const isAlreadyMember = isExistingMember(customer);

                    return (
                      <tr
                        key={`${customerId}`}
                        onClick={() => !isAlreadyMember && handleToggleCustomer(customer)}
                        className={`transition-colors ${
                          isAlreadyMember
                            ? "bg-gray-50 opacity-60"
                            : "cursor-pointer hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              !isAlreadyMember && handleToggleCustomer(customer);
                            }}
                          >
                            <Checkbox
                              id={`customer-${customer.customerId}`}
                              checked={isSelected || isAlreadyMember}
                              onChange={() => !isAlreadyMember && handleToggleCustomer(customer)}
                              disabled={isAlreadyMember}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-black">
                              {`${customer.first_name || ""} ${customer.last_name || ""}`.trim() || "—"}
                            </span>
                            {isAlreadyMember && (
                              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                Already member
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-black">
                            {customer.msisdn || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-black">
                            {customer.email || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-black">
                            {customer.subscriber_status || customer.status || "—"}
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
                setSelectedCustomers([]); // Clear selection when changing page
              }}
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 flex-shrink-0">
          <div className="text-sm text-black">
            {selectedCustomers.length} of {filteredCustomers.length} customers
            selected
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              disabled={isAdding}
              className={`px-4 py-2 border border-gray-300 text-black ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedCustomers.length === 0 || isAdding}
              className={`px-5 py-2 ${tw.rounded} text-sm font-medium transition-opacity inline-flex items-center gap-2 ${
                selectedCustomers.length === 0 || isAdding ? "cursor-not-allowed opacity-50" : ""
              }`}
              style={{
                backgroundColor:
                  selectedCustomers.length > 0 && !isAdding
                    ? color.primary.action
                    : color.text.muted,
                color: "white",
              }}
            >
              {isAdding && <span>Adding...</span>}
              {!isAdding && (
                <>
                  Add {selectedCustomers.length > 0 ? `(${selectedCustomers.length})` : ""}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
