import { useState, useEffect } from "react";
import { Search, Eye } from "lucide-react";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import RegularModal from "../../../shared/components/ui/RegularModal";
import { color, tw } from "../../../shared/utils/utils";
import { customerService } from "../../customers360/services/customerServices";
import type { Subscriber } from "../../customers360/types/customer";

interface AddEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (customer: {
    id: number;
    name?: string;
    email?: string;
    phone?: string;
  }) => void;
}

export default function AddEmailModal({
  isOpen,
  onClose,
  onAdd,
}: AddEmailModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Subscriber[]>([]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
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
    }, 400);

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

    onAdd({
      id:
        typeof customer.id === "string"
          ? parseInt(customer.id, 10)
          : customer.id,
      name,
      email: customer.email || undefined,
      phone: customer.msisdn || undefined,
    });

    // Reset state
    setSearchTerm("");
    setSearchResults([]);
    onClose();
  };

  const handleClose = () => {
    setSearchTerm("");
    setSearchResults([]);
    onClose();
  };

  return (
    <RegularModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Email to DND"
      size="xl"
    >
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter email, customer name, ID, phone number, or MSISDN..."
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
          Search by email address, customer name, ID, phone number, or MSISDN.
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
      </div>
    </RegularModal>
  );
}
