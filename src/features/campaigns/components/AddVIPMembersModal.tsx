import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Search } from "lucide-react";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { Popover } from "@headlessui/react";
import { customerService } from "../../customers360/services/customerServices";
import Pagination from "../../../shared/components/ui/Pagination";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
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

interface VIPList {
  id: number;
  name: string;
}

interface SelectedMember {
  vip_list_id: number;
  customer_id: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}

interface AddVIPMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  vipLists: VIPList[];
  onAdd?: (members: SelectedMember[]) => void;
  isLoading?: boolean;
}

export default function AddVIPMembersModal({
  isOpen,
  onClose,
  vipLists,
  onAdd,
  isLoading = false,
}: AddVIPMembersModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerStatusFilter, setCustomerStatusFilter] = useState("all");
  const [selectedVIPListId, setSelectedVIPListId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCustomers, setTotalCustomers] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setPage(1);
      setSelectedVIPListId("");
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
      // Handle wrapped response {success: true, data: [...], pagination: {...}}
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
      const fullName = `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
      const matchesSearch =
        fullName.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
        (customer.msisdn?.toLowerCase() || "").includes(customerSearchTerm.toLowerCase()) ||
        (customer.email_address?.toLowerCase() || "").includes(customerSearchTerm.toLowerCase()) ||
        String(customer.customer_id || customer.id || "").includes(customerSearchTerm);

      if (customerStatusFilter === "all") return matchesSearch;
      const status = customer.status;
      return matchesSearch && status === customerStatusFilter;
    });
  }, [customers, customerSearchTerm, customerStatusFilter]);

  const getCustomerId = (customer: Customer) => {
    return customer.customerId || customer.id;
  };

  const handleToggleCustomer = (customer: Customer) => {
    if (!selectedVIPListId) return;

    const customerId = getCustomerId(customer);
    const isSelected = selectedMembers.some(
      (m) => m.customer_id === customerId && m.vip_list_id === Number(selectedVIPListId)
    );

    if (isSelected) {
      setSelectedMembers(
        selectedMembers.filter(
          (m) => !(m.customer_id === customerId && m.vip_list_id === Number(selectedVIPListId))
        )
      );
    } else {
      setSelectedMembers([
        ...selectedMembers,
        {
          vip_list_id: Number(selectedVIPListId),
          customer_id: Number(customerId),
          customer_name: `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || undefined,
          customer_email: customer.email_address || undefined,
          customer_phone: customer.msisdn || undefined,
        },
      ]);
    }
  };

  const handleSelectAll = () => {
    if (!selectedVIPListId) return;

    const allSelected = filteredCustomers.every((customer) =>
      selectedMembers.some(
        (m) =>
          m.customer_id === getCustomerId(customer) &&
          m.vip_list_id === Number(selectedVIPListId)
      )
    );

    if (allSelected) {
      const listId = Number(selectedVIPListId);
      setSelectedMembers(
        selectedMembers.filter((m) => m.vip_list_id !== listId)
      );
    } else {
      const newMembers = filteredCustomers
        .filter(
          (customer) =>
            !selectedMembers.some(
              (m) =>
                m.customer_id === getCustomerId(customer) &&
                m.vip_list_id === Number(selectedVIPListId)
            )
        )
        .map((customer) => ({
          vip_list_id: Number(selectedVIPListId),
          customer_id: Number(getCustomerId(customer)),
          customer_name: `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || undefined,
          customer_email: customer.email_address || undefined,
          customer_phone: customer.msisdn || undefined,
        }));
      setSelectedMembers([...selectedMembers, ...newMembers]);
    }
  };

  const handleConfirm = () => {
    if (onAdd && selectedMembersForCurrentList.length > 0) {
      onAdd(selectedMembersForCurrentList);
    }
    handleClose();
  };

  const handleClose = () => {
    setSelectedMembers([]);
    setCustomerSearchTerm("");
    setCustomerStatusFilter("all");
    setSelectedVIPListId("");
    onClose();
  };

  const handleVIPListChange = (value: string) => {
    setSelectedVIPListId(value || "");
    setSelectedMembers([]);
    setPage(1);
  };

  const selectedMembersForCurrentList = selectedMembers.filter(
    (m) => m.vip_list_id === Number(selectedVIPListId)
  );
  const selectedVIPList = vipLists.find(
    (list) => String(list.id) === selectedVIPListId
  );
  const hasSelectedVIPList = Boolean(selectedVIPListId);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: zIndex.modal }}>
      <div className={`bg-white ${tw.rounded} w-full max-w-4xl max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-black">Add Members to VIP List</h2>
            <p className="text-sm text-gray-600 mt-1">
              Select customers to add to VIP list
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Select VIP List */}
        <div className="px-6 pt-6 pb-2 flex-shrink-0">
          <div className="max-w-sm">
            <label className="block text-sm font-medium text-black mb-2">
              Select VIP List <span className="text-red-600">*</span>
            </label>
            <HeadlessSelect
              value={selectedVIPListId}
              onChange={handleVIPListChange}
              options={vipLists.map((list) => ({
                value: String(list.id),
                label: list.name,
              }))}
              placeholder={
                vipLists.length > 0
                  ? "Choose a VIP list"
                  : "No VIP lists available"
              }
              disabled={isLoading || vipLists.length === 0}
              zIndex={zIndex.popover}
            />
          </div>
        </div>

        {/* Step 2: Search and Filter */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                disabled={isLoading || !hasSelectedVIPList}
                className={`w-full pl-10 pr-4 py-2 border border-gray-300 ${tw.rounded} text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50 disabled:bg-gray-100`}
              />
            </div>
            <Popover className="relative w-48">
              <Popover.Button
                disabled={isLoading || !hasSelectedVIPList}
                className={`w-full px-4 py-2 border border-gray-300 ${tw.rounded} text-sm font-medium text-black hover:bg-gray-50 transition-colors text-left flex items-center justify-between disabled:opacity-50 disabled:bg-gray-100`}
              >
                {customerStatusFilter === "all" ? "All Statuses" : customerStatusFilter}
                <ChevronUpDownIcon className="w-4 h-4 text-gray-400" />
              </Popover.Button>
              <Popover.Panel className={`absolute right-0 mt-2 w-48 ${tw.rounded} border border-gray-200 bg-white shadow-lg`} style={{ zIndex: zIndex.popover }}>
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
                        color: "black"
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
        {hasSelectedVIPList && selectedMembersForCurrentList.length > 0 && (
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
                  {selectedMembersForCurrentList.length} customer
                  {selectedMembersForCurrentList.length !== 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={() =>
                    setSelectedMembers(
                      selectedMembers.filter(
                        (m) => m.vip_list_id !== Number(selectedVIPListId)
                      )
                    )
                  }
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
          {!hasSelectedVIPList ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-black mb-2">
                Select a VIP list to continue
              </h3>
              <p className="text-sm text-gray-600">
                Choose the list first, then pick customers to add.
              </p>
            </div>
          ) : customerLoading ? (
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
                          selectedMembersForCurrentList.length === filteredCustomers.length &&
                          filteredCustomers.length > 0
                        }
                        onChange={handleSelectAll}
                        disabled={isLoading}
                        className="w-4 h-4 border-gray-400 rounded"
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
                    const isSelected = selectedMembers.some(
                      (m) =>
                        m.customer_id === customerId &&
                        m.vip_list_id === Number(selectedVIPListId)
                    );

                    return (
                      <tr
                        key={customer.id || customerId}
                        onClick={() => !isLoading && handleToggleCustomer(customer)}
                        className={`${!isLoading ? "cursor-pointer" : ""} transition-colors hover:bg-gray-50`}
                      >
                        <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleToggleCustomer(customer)}
                            disabled={isLoading}
                            className="w-4 h-4 border-gray-400 rounded disabled:opacity-50"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-black">
                            {`${customer.first_name || ""} ${customer.last_name || ""}`.trim() || "—"}
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
        {hasSelectedVIPList && totalCustomers > pageSize && (
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
            {selectedMembersForCurrentList.length} customer
            {selectedMembersForCurrentList.length !== 1 ? "s" : ""} selected
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
              disabled={!hasSelectedVIPList || selectedMembersForCurrentList.length === 0 || isLoading}
              className={`px-5 py-2 ${tw.rounded} text-sm font-medium transition-opacity ${
                !hasSelectedVIPList || selectedMembersForCurrentList.length === 0 || isLoading
                  ? "cursor-not-allowed opacity-50"
                  : ""
              }`}
              style={{
                backgroundColor:
                  hasSelectedVIPList && selectedMembersForCurrentList.length > 0 && !isLoading
                    ? color.primary.action
                    : color.text.muted,
                color: "white",
              }}
            >
              {hasSelectedVIPList
                ? `Add ${selectedMembersForCurrentList.length > 0 ? `(${selectedMembersForCurrentList.length}) ` : ""}Members to ${selectedVIPList?.name || "VIP List"}`
                : "Select VIP List First"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
