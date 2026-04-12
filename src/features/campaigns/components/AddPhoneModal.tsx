import { useState, useEffect } from "react";
import { Eye, ArrowLeft, Search } from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import RegularModal from "../../../shared/components/ui/RegularModal";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import { customerService } from "../../customers360/services/customerServices";
import type { Subscriber } from "../../customers360/types/customer";

interface AddPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (customer: {
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

export default function AddPhoneModal({
  isOpen,
  onClose,
  onAdd,
}: AddPhoneModalProps) {
  const [step, setStep] = useState<"search" | "selectType">("search");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Subscriber[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: number;
    name?: string;
    email?: string;
    phone?: string;
  } | null>(null);
  const [selectedDndType, setSelectedDndType] = useState("promotional");

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
    const debounceTimer = setTimeout(async () => {
      try {
        const response = await customerService.searchCustomers({
          search: searchTerm,
          limit: 50,
        });
        setSearchResults(response.data || []);
      } catch (error) {
        console.error("Failed to search customers:", error);
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 400); // 400ms debounce

    return () => {
      clearTimeout(debounceTimer);
      setIsSearching(false);
    };
  }, [searchTerm, isOpen]);

  const handleSelectCustomer = (customer: Subscriber) => {
    const name =
      customer.first_name || customer.last_name
        ? `${customer.first_name || ""} ${customer.last_name || ""}`.trim()
        : customer.msisdn;

    setSelectedCustomer({
      id:
        typeof customer.id === "string"
          ? parseInt(customer.id, 10)
          : customer.id,
      name,
      email: customer.email || undefined,
      phone: customer.msisdn || undefined,
    });
    setStep("selectType");
  };

  const handleConfirmAdd = () => {
    if (selectedCustomer) {
      onAdd({
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
      title={step === "search" ? "Add Phone to DND" : "Select DND Type"}
      size="xl"
    >
      <div className="space-y-4">
        {/* STEP 1: SEARCH FOR CUSTOMER */}
        {step === "search" && (
          <>
            {/* Search Input */}
            <SearchInput
              placeholder="Enter phone number, MSISDN, customer name, ID, or email..."
              value={searchTerm}
              onChange={(value) => setSearchTerm(value)}
            />

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

            {/* DND Type Selector */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Select DND Type
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Choose which type of messages this customer should NOT receive
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
                  "Promotional: Customer will NOT receive marketing and promotional SMS"}
                {selectedDndType === "transactional" &&
                  "Transactional: Customer will NOT receive transaction confirmations and receipts"}
                {selectedDndType === "marketing" &&
                  "Marketing: Customer will NOT receive marketing campaigns"}
                {selectedDndType === "service" &&
                  "Service: Customer will NOT receive service-related messages"}
                {selectedDndType === "other" &&
                  "Other: Customer will NOT receive other types of messages"}
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
                onClick={handleConfirmAdd}
                className={`flex-1 px-4 py-2 ${tw.rounded} text-white font-medium text-sm transition-colors`}
                style={{ backgroundColor: color.primary.action }}
              >
                Add to DND
              </button>
            </div>
          </>
        )}
      </div>
    </RegularModal>
  );
}
