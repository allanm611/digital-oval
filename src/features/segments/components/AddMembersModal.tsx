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
  segmentName: string;
  onAdd?: (customers: Customer[]) => void;
}

export default function AddMembersModal({
  isOpen,
  onClose,
  segmentName,
  onAdd,
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

  const handleToggleCustomer = (customer: Customer) => {
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

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div
        className={`${tw.rounded} w-full max-w-4xl max-h-[90vh] flex flex-col`}
        style={{ backgroundColor: 'var(--c-surface-cards)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--c-border-default)' }}
        >
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--c-text-primary)' }}>Add Members to Segment</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--c-text-secondary)' }}>
              Select customers to add to "{segmentName}"
            </p>
          </div>
          <button
            onClick={handleClose}
            className={`p-2 transition-colors`}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--c-text-muted)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
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
                className={`w-full px-4 py-2 ${tw.rounded} text-sm font-medium transition-colors text-left flex items-center justify-between`}
                style={{
                  border: '1px solid var(--c-border-default)',
                  color: 'var(--c-text-primary)',
                  backgroundColor: 'var(--c-surface-cards)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--c-surface-cards)';
                }}
              >
                {customerStatusFilter === "all" ? "All Statuses" : customerStatusFilter}
                <ChevronUpDownIcon className="w-4 h-4" style={{ color: 'var(--c-text-secondary)' }} />
              </Popover.Button>
              <Popover.Panel
                className={`absolute right-0 mt-2 w-48 ${tw.rounded} shadow-lg`}
                style={{
                  zIndex: zIndex.modal,
                  border: '1px solid var(--c-border-default)',
                  backgroundColor: 'var(--c-surface-cards)',
                }}
              >
                <div className="py-1">
                  {["all", "active", "inactive", "suspended"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setCustomerStatusFilter(status)}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors`}
                      style={{
                        backgroundColor:
                          customerStatusFilter === status
                            ? 'rgba(59, 130, 246, 0.1)'
                            : 'transparent',
                        color:
                          customerStatusFilter === status
                            ? 'var(--c-primary-action)'
                            : 'var(--c-text-primary)',
                        fontWeight: customerStatusFilter === status ? '500' : '400',
                      }}
                      onMouseEnter={(e) => {
                        if (customerStatusFilter !== status) {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (customerStatusFilter === status) {
                          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                        } else {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
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
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner variant="modern" size="lg" color="primary" />
              <p className="text-sm mt-4" style={{ color: 'var(--c-text-primary)' }}>Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--c-text-primary)' }}>
                No customers found
              </h3>
              <p className="text-sm" style={{ color: 'var(--c-text-secondary)' }}>
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead
                  className="sticky top-0 z-10"
                  style={{ backgroundColor: 'var(--c-surface-background)' }}
                >
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-12"
                      style={{ color: 'var(--c-text-secondary)' }}
                    >
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
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--c-text-secondary)' }}
                    >
                      Name
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--c-text-secondary)' }}
                    >
                      Msisdn
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--c-text-secondary)' }}
                    >
                      Email
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-24"
                      style={{ color: 'var(--c-text-secondary)' }}
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody
                  className="divide-y"
                  style={{
                    backgroundColor: 'var(--c-surface-cards)',
                    borderColor: 'var(--c-border-default)',
                  }}
                >
                  {filteredCustomers.map((customer) => {
                    const customerId = getCustomerId(customer);
                    const isSelected = selectedCustomers.some(
                      (c) => getCustomerId(c) === customerId
                    );

                    return (
                      <tr
                        key={customerId}
                        onClick={() => handleToggleCustomer(customer)}
                        className="cursor-pointer transition-colors"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleCustomer(customer);
                            }}
                          >
                            <Checkbox
                              id={`customer-${customer.customerId}`}
                              checked={isSelected}
                              onChange={() => handleToggleCustomer(customer)}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium" style={{ color: 'var(--c-text-primary)' }}>
                            {`${customer.first_name || ""} ${customer.last_name || ""}`.trim() || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm" style={{ color: 'var(--c-text-primary)' }}>
                            {customer.msisdn || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm" style={{ color: 'var(--c-text-primary)' }}>
                            {customer.email || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm" style={{ color: 'var(--c-text-primary)' }}>
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
          <div
            className="px-6 py-4 flex-shrink-0"
            style={{ borderTop: '1px solid var(--c-border-default)' }}
          >
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
        <div
          className="flex items-center justify-between p-6 flex-shrink-0"
          style={{ borderTop: '1px solid var(--c-border-default)' }}
        >
          <div className="text-sm" style={{ color: 'var(--c-text-primary)' }}>
            {selectedCustomers.length} of {filteredCustomers.length} customers
            selected
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className={`px-4 py-2 text-sm font-medium ${tw.rounded} transition-colors`}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--c-text-primary)',
                border: '1px solid var(--c-text-primary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedCustomers.length === 0}
              className={`px-5 py-2 ${tw.rounded} text-sm font-medium transition-opacity ${
                selectedCustomers.length === 0 ? "cursor-not-allowed opacity-50" : ""
              }`}
              style={{
                backgroundColor:
                  selectedCustomers.length > 0
                    ? 'var(--c-primary-action)'
                    : 'var(--c-text-muted)',
                color: "white",
              }}
            >
              Add {selectedCustomers.length > 0 ? `(${selectedCustomers.length})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
