import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle } from "lucide-react";
import { customerService } from "../../customers360/services/customerServices";
import Pagination from "../../../shared/components/ui/Pagination";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { tw, zIndex, color } from "../../../shared/utils/utils";
import { DNDType, dndService, DNDSubscription } from "../services/dndService";
import { CommunicationChannel } from "../../../shared/services/communicationChannelService";
import MultiCategorySelector from "../../../shared/components/MultiCategorySelector";
import Checkbox from "../../../shared/components/ui/Checkbox";

interface Customer {
  id: string | number;
  customerId?: string | number;
  first_name?: string;
  last_name?: string;
  msisdn?: string;
  email?: string;
  subscriber_status?: string;
}

interface SelectedMember {
  customer_id: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}

interface AddDNDBulkModalProps {
  isOpen: boolean;
  onClose: () => void;
  dndTypes: DNDType[];
  channels: CommunicationChannel[];
  onAdd?: (
    memberIds: number[],
    dndTypeId: number,
    selectedChannels: string[]
  ) => void;
  isLoading?: boolean;
}

export default function AddDNDBulkModal({
  isOpen,
  onClose,
  dndTypes,
  channels,
  onAdd,
  isLoading = false,
}: AddDNDBulkModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [selectedDNDTypeId, setSelectedDNDTypeId] = useState<string>("");
  const [selectedChannelIds, setSelectedChannelIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [existingSubscriptions, setExistingSubscriptions] = useState<
    DNDSubscription[]
  >([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);

  const loadExistingSubscriptions = useCallback(async () => {
    try {
      setLoadingSubscriptions(true);
      const subscriptions = await dndService.getDNDSubscriptions({
        status: "active",
      });
      setExistingSubscriptions(subscriptions);
    } catch (error) {
      console.error("Failed to load existing subscriptions:", error);
      setExistingSubscriptions([]);
    } finally {
      setLoadingSubscriptions(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && dndTypes.length > 0) {
      setPage(1);
      setSelectedDNDTypeId(String(dndTypes[0].id));
      setSelectedChannelIds([]);
      loadCustomers();
      loadExistingSubscriptions();
    }
  }, [isOpen, dndTypes, loadExistingSubscriptions]);

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
      const fullName = `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
      const searchTerm = customerSearchTerm.toLowerCase();
      return (
        fullName.toLowerCase().includes(searchTerm) ||
        customer.msisdn?.toLowerCase().includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm)
      );
    });
  }, [customers, customerSearchTerm]);

  const isCustomerInDND = (customerId: number): boolean => {
    return existingSubscriptions.some((sub) => sub.customer_id === customerId);
  };

  const handleCustomerSelect = (customer: Customer) => {
    const customerId =
      typeof customer.customerId === "string"
        ? parseInt(customer.customerId, 10)
        : customer.customerId ||
          (typeof customer.id === "string"
            ? parseInt(customer.id, 10)
            : customer.id);

    if (isCustomerInDND(customerId)) return;

    const fullName = `${customer.first_name || ""} ${customer.last_name || ""}`.trim();

    const isMemberSelected = selectedMembers.some(
      (m) => m.customer_id === customerId
    );

    if (isMemberSelected) {
      setSelectedMembers(selectedMembers.filter((m) => m.customer_id !== customerId));
    } else {
      setSelectedMembers([
        ...selectedMembers,
        {
          customer_id: customerId,
          customer_name: fullName || customer.msisdn,
          customer_email: customer.email,
          customer_phone: customer.msisdn,
        },
      ]);
    }
  };


  const handleAddMembers = () => {
    const selectedChannelCodes = channels
      .filter((ch) => selectedChannelIds.includes(ch.id))
      .map((ch) => ch.code.toUpperCase());

    if (
      selectedMembers.length > 0 &&
      selectedDNDTypeId &&
      selectedChannelCodes.length > 0
    ) {
      onAdd?.(
        selectedMembers.map((m) => m.customer_id),
        Number(selectedDNDTypeId),
        selectedChannelCodes
      );
    }
  };

  const handleClose = () => {
    setSelectedMembers([]);
    setCustomerSearchTerm("");
    setSelectedDNDTypeId(dndTypes.length > 0 ? String(dndTypes[0].id) : "");
    setSelectedChannelIds([]);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: zIndex.modal }}
    >
      <div
        className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            Add Members to DND Lists
          </h2>
          <button
            onClick={handleClose}
            className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Top row - DND Type and Select Channels */}
          <div className="grid grid-cols-2 gap-6">
            {/* DND Type Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DND Type *
              </label>
              <HeadlessSelect
                value={selectedDNDTypeId}
                onChange={setSelectedDNDTypeId}
                options={dndTypes.map((type) => ({
                  value: String(type.id),
                  label: type.name,
                }))}
                placeholder="Select DND type"
              />
            </div>

            {/* Select Channels */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Channels *
              </label>
              <MultiCategorySelector
                value={selectedChannelIds}
                onChange={setSelectedChannelIds}
                placeholder="Select channels..."
                entityType="channel"
                className="w-full"
              />
            </div>
          </div>

          {/* Customers section - Full width */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Select Customers</h3>

            {/* Search Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Customers
              </label>
              <SearchInput
                placeholder="Search by name, phone, or email..."
                value={customerSearchTerm}
                onChange={setCustomerSearchTerm}
              />
            </div>

            {/* Selected Members Count */}
            {selectedMembers.length > 0 && (
              <div
                className={`p-3 ${tw.rounded} border-2 mb-4`}
                style={{
                  borderColor: color.primary.accent,
                  backgroundColor: "white",
                }}
              >
                <p className="text-sm font-medium" style={{ color: "black" }}>
                  {selectedMembers.length} customer
                  {selectedMembers.length !== 1 ? "s" : ""} selected
                </p>
              </div>
            )}

            {/* Customers List */}
            <div className="border border-gray-200 rounded-md overflow-hidden max-h-64 overflow-y-auto">
              {customerLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner variant="modern" size="md" />
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-sm text-gray-500">No customers found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => {
                    const customerId =
                      typeof customer.customerId === "string"
                        ? parseInt(customer.customerId, 10)
                        : customer.customerId ||
                          (typeof customer.id === "string"
                            ? parseInt(customer.id, 10)
                            : customer.id);
                    const fullName =
                      `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
                    const isSelected = selectedMembers.some(
                      (m) => m.customer_id === customerId
                    );
                    const alreadyInDND = isCustomerInDND(customerId);

                    return (
                      <div
                        key={customerId}
                        className={`px-4 py-3 flex items-center gap-3 ${
                          alreadyInDND
                            ? "bg-gray-50 cursor-not-allowed"
                            : "hover:bg-gray-50 cursor-pointer"
                        }`}
                        onClick={() =>
                          !alreadyInDND && handleCustomerSelect(customer)
                        }
                      >
                        {alreadyInDND ? (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <Checkbox
                            id={`customer-${customerId}`}
                            checked={isSelected}
                            onChange={() => handleCustomerSelect(customer)}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium ${
                              alreadyInDND
                                ? "text-gray-500"
                                : "text-gray-900"
                            }`}
                          >
                            {fullName || customer.msisdn || "Unknown"}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                            {customer.msisdn && <span>{customer.msisdn}</span>}
                            {customer.email && <span>{customer.email}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination */}
            {!customerLoading && totalCustomers > pageSize && (
              <Pagination
                currentPage={page}
                pageSize={pageSize}
                totalItems={totalCustomers}
                onPageChange={setPage}
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 justify-end">
            <button
              onClick={handleClose}
              className={`px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 ${tw.rounded} hover:bg-gray-50 transition-colors disabled:opacity-50`}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleAddMembers}
              className={`px-6 py-2 text-sm font-medium text-white ${tw.rounded} transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
              style={{ backgroundColor: color.primary.action }}
              disabled={
                isLoading ||
                selectedMembers.length === 0 ||
                !selectedDNDTypeId ||
                selectedChannelIds.length === 0
              }
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                "Add to DND"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
