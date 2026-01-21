import { useState, useEffect, useCallback } from "react";
import { Search, Eye, ArrowLeft, AlertCircle } from "lucide-react";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import RegularModal from "../../../shared/components/ui/RegularModal";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import {
  customerSubscriptions,
  searchCustomers as searchCustomersUtil,
} from "../../dashboard/utils/customerDataService";
import type { CustomerSubscriptionRecord } from "../../dashboard/types/customerSubscription";
import {
  getSubscriptionDisplayName,
  formatMsisdn,
} from "../../dashboard/utils/customerSubscriptionHelpers";

interface RemovePhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRemove: (customer: {
    id: number;
    name?: string;
    email?: string;
    phone?: string;
    dndType: string;
  }) => void;
}

const DND_TYPES = [
  { value: "promotional", label: "Promotional" },
  { value: "transactional", label: "Transactional" },
  { value: "marketing", label: "Marketing" },
  { value: "service", label: "Service" },
  { value: "other", label: "Other" },
];

export default function RemovePhoneModal({
  isOpen,
  onClose,
  onRemove,
}: RemovePhoneModalProps) {
  const [step, setStep] = useState<"search" | "selectType">("search");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<
    CustomerSubscriptionRecord[]
  >([]);
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: number;
    name?: string;
    email?: string;
    phone?: string;
  } | null>(null);
  const [selectedDndType, setSelectedDndType] = useState("promotional");

  const searchCustomers = useCallback(
    (term: string, customers: CustomerSubscriptionRecord[]) => {
      return searchCustomersUtil(term, customers);
    },
    [],
  );

  // Debounced search
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setSearchResults([]);
      setStep("search");
      setSelectedCustomer(null);
      setSelectedDndType("promotional");
      return;
    }

    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const debounceTimer = setTimeout(() => {
      const results = searchCustomers(searchTerm, customerSubscriptions);
      // Limit to top 50 results for performance
      setSearchResults(results.slice(0, 50));
      setIsSearching(false);
    }, 400); // 400ms debounce

    return () => {
      clearTimeout(debounceTimer);
      setIsSearching(false);
    };
  }, [searchTerm, isOpen, searchCustomers]);

  const handleSelectCustomer = (customer: CustomerSubscriptionRecord) => {
    const name = getSubscriptionDisplayName(
      customer,
      `Customer ${customer.customerId}`,
    );
    const phone = customer.msisdn ? formatMsisdn(customer.msisdn) : undefined;

    setSelectedCustomer({
      id: customer.customerId,
      name,
      email: customer.email || undefined,
      phone: phone || undefined,
    });
    setStep("selectType");
  };

  const handleConfirmRemove = () => {
    if (selectedCustomer) {
      onRemove({
        ...selectedCustomer,
        dndType: selectedDndType,
      });
      // Reset state
      setSearchTerm("");
      setSearchResults([]);
      setStep("search");
      setSelectedCustomer(null);
      setSelectedDndType("promotional");
      onClose();
    }
  };

  const handleBackToSearch = () => {
    setStep("search");
    setSelectedDndType("promotional");
  };

  const handleClose = () => {
    setSearchTerm("");
    setSearchResults([]);
    setStep("search");
    setSelectedCustomer(null);
    setSelectedDndType("promotional");
    onClose();
  };

  return (
    <RegularModal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        step === "search"
          ? "Remove Phone from DND"
          : "Select DND Type to Remove"
      }
      size="xl"
    >
      <div className="space-y-4">
        {/* STEP 1: SEARCH FOR CUSTOMER */}
        {step === "search" && (
          <>
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter phone number, MSISDN, customer name, ID, or email..."
                className={`w-full ${tw.rounded} border border-gray-300 py-3 pl-10 pr-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[--accent-color]`}
                style={
                  {
                    "--accent-color": `${color.primary.accent}33`,
                  } as React.CSSProperties
                }
                autoFocus
              />
            </div>

            {/* Helper Text */}
            <p className="text-xs text-gray-500">
              Search by phone number, MSISDN, customer name, ID, or email
              address.
            </p>

            {/* Search Results */}
            <div
              className={`max-h-[400px] overflow-y-auto border border-gray-200 ${tw.rounded}`}
            >
              {isSearching ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <LoadingSpinner variant="modern" size="md" />
                  <p className={`${tw.textMuted} mt-3 text-sm`}>
                    Searching customers...
                  </p>
                </div>
              ) : searchTerm.trim() && searchResults.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm text-gray-500">
                    No customers found matching "{searchTerm}"
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Try a different search term or check your spelling
                  </p>
                </div>
              ) : searchTerm.trim() && searchResults.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {searchResults.length > 50 && (
                    <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200">
                      <p className="text-xs text-yellow-800">
                        Showing top 50 results. Use filters to narrow down your
                        search.
                      </p>
                    </div>
                  )}
                  {searchResults.map((customer) => {
                    const name = getSubscriptionDisplayName(
                      customer,
                      `Customer ${customer.customerId}`,
                    );
                    return (
                      <button
                        key={`${customer.customerId}-${customer.subscriptionId}`}
                        onClick={() => handleSelectCustomer(customer)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {name}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                              <span>ID: {customer.customerId}</span>
                              {customer.msisdn && (
                                <span>
                                  MSISDN: {formatMsisdn(customer.msisdn)}
                                </span>
                              )}
                              {customer.email && <span>{customer.email}</span>}
                            </div>
                          </div>
                          <Eye className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-6 py-12 text-center">
                  <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Start typing to search for customers
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    You can search by phone number, MSISDN, name, ID, or email
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* STEP 2: SELECT DND TYPE */}
        {step === "selectType" && selectedCustomer && (
          <>
            {/* Customer Summary */}
            <div
              className={`p-4 ${tw.rounded} border-2`}
              style={{
                backgroundColor: `${color.primary.accent}15`,
                borderColor: color.primary.accent,
              }}
            >
              <p className="text-sm font-semibold text-gray-900">
                {selectedCustomer.name || selectedCustomer.phone}
              </p>
              <div className="mt-2 space-y-1 text-xs text-gray-600">
                {selectedCustomer.phone && (
                  <p>Phone: {selectedCustomer.phone}</p>
                )}
                {selectedCustomer.email && (
                  <p>Email: {selectedCustomer.email}</p>
                )}
              </div>
            </div>

            {/* Warning Alert */}
            <div
              className={`p-3 ${tw.rounded} bg-orange-50 border border-orange-200 flex gap-2`}
            >
              <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-orange-800">
                After removal, this customer will be able to receive{" "}
                {selectedDndType} messages again.
              </p>
            </div>

            {/* DND Type Selector */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Select DND Type to Remove
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Choose which DND restriction to remove for this customer
              </p>
              <HeadlessSelect
                value={selectedDndType}
                onChange={setSelectedDndType}
                options={DND_TYPES.map((type) => ({
                  label: type.label,
                  value: type.value,
                }))}
                placeholder="Select DND type"
                className="w-full"
                zIndex={zIndex.popover}
              />
            </div>

            {/* Type Description */}
            <div className={`p-3 ${tw.rounded} bg-gray-50`}>
              <p className="text-xs text-gray-600">
                {selectedDndType === "promotional" &&
                  "Will allow: Marketing and promotional SMS"}
                {selectedDndType === "transactional" &&
                  "Will allow: Transaction confirmations and receipts"}
                {selectedDndType === "marketing" &&
                  "Will allow: Marketing campaigns"}
                {selectedDndType === "service" &&
                  "Will allow: Service-related messages"}
                {selectedDndType === "other" &&
                  "Will allow: Other types of messages"}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleBackToSearch}
                className={`flex-1 px-4 py-2 ${tw.rounded} border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2`}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleConfirmRemove}
                className={`flex-1 px-4 py-2 ${tw.rounded} text-white font-medium text-sm transition-colors`}
                style={{ backgroundColor: color.primary.action }}
              >
                Remove from DND
              </button>
            </div>
          </>
        )}
      </div>
    </RegularModal>
  );
}
