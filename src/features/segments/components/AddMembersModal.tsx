import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Search } from "lucide-react";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { Popover } from "@headlessui/react";
import { customerService } from "../../customers360/services/customerServices";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { tw, zIndex } from "../../../shared/utils/utils";

interface Customer {
  id: string | number;
  customerId?: string | number;
  name?: string;
  msisdn?: string;
  email?: string;
  status?: string;
  createdAt?: string;
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

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
    }
  }, [isOpen]);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await customerService.getAllCustomers({
        skipCache: true,
      });
      setCustomers(response.data || []);
    } catch (error) {
      console.error("Failed to load customers:", error);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesSearch =
        (customer.name?.toLowerCase() || "").includes(
          customerSearchTerm.toLowerCase()
        ) ||
        (customer.msisdn?.toLowerCase() || "").includes(
          customerSearchTerm.toLowerCase()
        ) ||
        (customer.email?.toLowerCase() || "").includes(
          customerSearchTerm.toLowerCase()
        ) ||
        String(customer.customerId || "").includes(customerSearchTerm);

      if (customerStatusFilter === "all") return matchesSearch;
      return matchesSearch && customer.status === customerStatusFilter;
    });
  }, [customers, customerSearchTerm, customerStatusFilter]);

  const handleToggleCustomer = (customer: Customer) => {
    const isSelected = selectedCustomers.some(
      (c) => c.customerId === customer.customerId
    );
    if (isSelected) {
      setSelectedCustomers(
        selectedCustomers.filter((c) => c.customerId !== customer.customerId)
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
      <div className={`bg-white ${tw.rounded} w-full max-w-4xl max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-black">Add Members to Segment</h2>
            <p className="text-sm text-black mt-1">
              Select customers to add to "{segmentName}"
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
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border border-gray-300 ${tw.rounded} text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50`}
              />
            </div>
            <Popover className="relative w-48">
              <Popover.Button className={`w-full px-4 py-2 border border-gray-300 ${tw.rounded} text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left flex items-center justify-between`}>
                {customerStatusFilter === "all" ? "All Statuses" : customerStatusFilter.charAt(0).toUpperCase() + customerStatusFilter.slice(1)}
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
                      {status === "all" ? "All Statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
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
            <div className="rounded-lg p-4 border border-blue-200 bg-blue-50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">
                  {selectedCustomers.length} customer
                  {selectedCustomers.length !== 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={() => setSelectedCustomers([])}
                  className="text-sm font-medium text-blue-800 hover:opacity-80 transition-opacity"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Customers List */}
        <div className="flex-1 overflow-y-auto px-6">
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
                      <input
                        type="checkbox"
                        checked={
                          selectedCustomers.length === filteredCustomers.length &&
                          filteredCustomers.length > 0
                        }
                        onChange={handleSelectAll}
                        className="w-4 h-4 border-gray-400 rounded"
                        style={{
                          accentColor: "#111827",
                        }}
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
                    const isSelected = selectedCustomers.some(
                      (c) => c.customerId === customer.customerId
                    );

                    return (
                      <tr
                        key={customer.customerId}
                        onClick={() => handleToggleCustomer(customer)}
                        className="cursor-pointer transition-colors hover:bg-gray-50"
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleCustomer(customer)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 border-gray-400 rounded"
                            style={{
                              accentColor: "#111827",
                            }}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-black">
                            {customer.name || "—"}
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

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 flex-shrink-0">
          <div className="text-sm text-black">
            {selectedCustomers.length} of {filteredCustomers.length} customers
            selected
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className={`px-4 py-2 border border-gray-300 text-black ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-colors`}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedCustomers.length === 0}
              className={`px-5 py-2 ${tw.rounded} text-sm font-medium ${
                selectedCustomers.length === 0 ? "cursor-not-allowed" : ""
              }`}
              style={{
                backgroundColor:
                  selectedCustomers.length > 0 ? "#3B82F6" : "#D1D5DB",
                color:
                  selectedCustomers.length === 0 ? "#6B7280" : "white",
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
