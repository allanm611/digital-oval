import { useState, useEffect } from "react";
import { Eye, Search, ArrowLeft } from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import RegularModal from "../../../shared/components/ui/RegularModal";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import { customerService } from "../../customers360/services/customerServices";
import type { Subscriber } from "../../customers360/types/customer";
import { DNDType } from "../services/dndService";

interface AddEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  dndTypes: DNDType[];
  onAdd: (customer: {
    id: number;
    name?: string;
    email?: string;
    phone?: string;
    dndTypeId: number;
  }) => void;
}

export default function AddEmailModal({
  isOpen,
  onClose,
  dndTypes,
  onAdd,
}: AddEmailModalProps) {
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
  const [selectedDndTypeId, setSelectedDndTypeId] = useState<number | null>(null);

  // Debounced search
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setSearchResults([]);
      setStep("search");
      setSelectedCustomer(null);
      setSelectedDndTypeId(dndTypes.length > 0 ? dndTypes[0].id : null);
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
          msisdn: searchTerm,
          limit: 50,
        });
        setSearchResults(response.data || []);
      } catch (error) {
        console.error("Failed to search customers:", error);
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 400);

    return () => {
      clearTimeout(debounceTimer);
      setIsSearching(false);
    };
  }, [searchTerm, isOpen, dndTypes]);

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
    if (selectedCustomer && selectedDndTypeId !== null) {
      onAdd({
        ...selectedCustomer,
        dndTypeId: selectedDndTypeId,
      });
      // Reset state
      setSearchTerm("");
      setSearchResults([]);
      setStep("search");
      setSelectedCustomer(null);
      setSelectedDndTypeId(dndTypes.length > 0 ? dndTypes[0].id : null);
      onClose();
    }
  };

  const handleBackToSearch = () => {
    setStep("search");
    setSelectedDndTypeId(dndTypes.length > 0 ? dndTypes[0].id : null);
  };

  const handleClose = () => {
    setSearchTerm("");
    setSearchResults([]);
    setStep("search");
    setSelectedCustomer(null);
    setSelectedDndTypeId(dndTypes.length > 0 ? dndTypes[0].id : null);
    onClose();
  };

  return (
    <RegularModal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === "search" ? "Add Email to DND" : "Select DND Type"}
      size="xl"
    >
      <div className="space-y-4">
        {/* STEP 1: SEARCH FOR CUSTOMER */}
        {step === "search" && (
          <>
            {/* Search Input */}
            <SearchInput
              placeholder="Enter email, customer name, ID, phone number, or MSISDN..."
              value={searchTerm}
              onChange={(value) => setSearchTerm(value)}
            />

            {/* Helper Text */}
            <p className="text-xs text-gray-500">
              Search by email address, customer name, ID, phone number, or MSISDN.
            </p>

            {/* Search Results */}
            <div className={`max-h-[400px] overflow-y-auto border border-gray-200 ${tw.rounded}`}>
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
                              {customer.email && <span>{customer.email}</span>}
                              {customer.msisdn && (
                                <span>MSISDN: {formatMsisdn(customer.msisdn)}</span>
                              )}
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
                    You can search by email, name, ID, phone number, or MSISDN
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
                {selectedCustomer.name || selectedCustomer.email}
              </p>
              <div className="mt-2 space-y-1 text-xs text-gray-600">
                {selectedCustomer.email && (
                  <p>Email: {selectedCustomer.email}</p>
                )}
                {selectedCustomer.phone && (
                  <p>Phone: {selectedCustomer.phone}</p>
                )}
              </div>
            </div>

            {/* DND Type Selector */}
            <div>
              <HeadlessSelect
                label="Select DND Type"
                value={String(selectedDndTypeId)}
                onChange={(value) => setSelectedDndTypeId(Number(value))}
                options={dndTypes.map((type) => ({
                  label: type.name,
                  value: String(type.id),
                }))}
                placeholder="Select DND type"
                className="w-full"
                zIndex={zIndex.popover}
              />
              <p className="text-xs text-gray-500 mt-2">
                Choose which type of messages this customer should NOT receive
              </p>
            </div>

            {/* Type Description */}
            {selectedDndTypeId !== null && (
              <div className={`p-3 ${tw.rounded} bg-gray-50`}>
                <p className="text-xs text-gray-600">
                  {dndTypes.find((t) => t.id === selectedDndTypeId)?.description ||
                    "Customer will NOT receive these types of messages"}
                </p>
              </div>
            )}

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

function getSubscriptionDisplayName(customer: Subscriber, fallback: string): string {
  if (customer.first_name || customer.last_name) {
    return `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
  }
  if (customer.email) return customer.email;
  if (customer.msisdn) return customer.msisdn;
  return fallback;
}

function formatMsisdn(msisdn: string): string {
  if (!msisdn) return "";
  return msisdn.replace(/^(\+?\d{3})(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3 $4");
}
