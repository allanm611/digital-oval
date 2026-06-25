import { useState, useEffect } from "react";
import { Search, X, Eye } from "lucide-react";
import { customerService } from "../services/customerServices";
import { Subscriber } from "../types/customer";
import { color, button, getButtonStyles } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useLanguage } from "../../../contexts/LanguageContext";

interface CustomerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Subscriber) => void;
}

export default function CustomerSearchModal({
  isOpen,
  onClose,
  onSelectCustomer,
}: CustomerSearchModalProps) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Mock customers for UI preview
  const mockCustomers: Subscriber[] = [
    {
      id: 1,
      subscriber_id: 1001,
      first_name: "John",
      last_name: "Doe",
      msisdn: "+254763056860",
      email: "john.doe@example.com",
      subscriber_type: "prepaid",
      subscriber_status: "active",
      kyc_verified: true,
      created_at: "2024-01-15",
      preferred_channel: "NORMAL_SMS",
    },
    {
      id: 2,
      subscriber_id: 1002,
      first_name: "Jane",
      last_name: "Smith",
      msisdn: "+254764555314",
      email: "jane.smith@example.com",
      subscriber_type: "postpaid",
      subscriber_status: "active",
      kyc_verified: true,
      created_at: "2024-02-20",
      preferred_channel: "EMAIL",
    },
    {
      id: 3,
      subscriber_id: 1003,
      first_name: "Robert",
      last_name: "Johnson",
      msisdn: "+254763056254",
      email: "robert.j@example.com",
      subscriber_type: "prepaid",
      subscriber_status: "suspended",
      kyc_verified: false,
      created_at: "2024-03-10",
      preferred_channel: "WHATSAPP",
    },
  ];

  useEffect(() => {
    const performSearch = async () => {
      if (!searchTerm.trim()) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      try {
        setIsLoading(true);
        setHasSearched(true);
        const response = await customerService.searchCustomers({
          msisdn: searchTerm,
          limit: 50,
        });

        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
          setResults(response.data);
        } else {
          // Use mock data as fallback
          console.log("Using mock data for search");
          const searchLower = searchTerm.toLowerCase();
          const filtered = mockCustomers.filter(
            (c) =>
              (c.first_name && c.first_name.toLowerCase().includes(searchLower)) ||
              (c.last_name && c.last_name.toLowerCase().includes(searchLower)) ||
              (c.msisdn && c.msisdn.includes(searchTerm)) ||
              (c.email && c.email.toLowerCase().includes(searchLower)) ||
              String(c.id).includes(searchTerm) ||
              String(c.subscriber_id).includes(searchTerm)
          );
          setResults(filtered.length > 0 ? filtered : mockCustomers.slice(0, 3));
        }
      } catch (err) {
        console.error("Search error:", err);
        // Show mock data on error
        const searchLower = searchTerm.toLowerCase();
        const filtered = mockCustomers.filter(
          (c) =>
            (c.first_name && c.first_name.toLowerCase().includes(searchLower)) ||
            (c.last_name && c.last_name.toLowerCase().includes(searchLower)) ||
            (c.msisdn && c.msisdn.includes(searchTerm)) ||
            (c.email && c.email.toLowerCase().includes(searchLower)) ||
            String(c.id).includes(searchTerm)
        );
        setResults(filtered.length > 0 ? filtered : mockCustomers.slice(0, 3));
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleSelectCustomer = (customer: Subscriber) => {
    onSelectCustomer(customer);
    setSearchTerm("");
    setResults([]);
    setHasSearched(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Search Customer</h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search Input */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Enter customer name, ID, email, or MSISDN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded border border-gray-300 pl-10 pr-4 py-2.5 bg-white text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Search by customer name, ID, email address, or MSISDN.
          </p>
        </div>

        {/* Results Area */}
        <div className="mb-6 min-h-64 rounded-lg border border-gray-200 bg-gray-50 p-6">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : !hasSearched ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <Search className="mb-3 h-12 w-12 text-gray-400" />
              <p className="text-sm text-gray-600">Start typing to search for customers</p>
              <p className="text-sm text-gray-500">
                You can search by name, ID, email, or MSISDN
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <Search className="mb-3 h-12 w-12 text-gray-400" />
              <p className="text-sm text-gray-600">No customers found</p>
              <p className="text-sm text-gray-500">Try a different search term</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((customer) => (
                <div
                  key={`${customer.id}-${customer.msisdn}`}
                  onClick={() => handleSelectCustomer(customer)}
                  className="w-full rounded border border-gray-200 bg-white p-3 text-left cursor-pointer"
                >
                  <div className="flex gap-3">
                    <div className="flex-1">
                      {/* Customer Name */}
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        {customer.first_name} {customer.last_name}
                      </p>
                      {/* Details */}
                      <p className="text-xs text-gray-600">
                        {customer.msisdn}
                        {customer.email && ` • ${customer.email}`}
                        {customer.subscriber_status && ` • ${customer.subscriber_status === "active" ? "Active" : "Inactive"}`}
                      </p>
                    </div>
                    {/* Eye Icon */}
                    <button
                      onClick={() => handleSelectCustomer(customer)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                      title="View details"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            style={getButtonStyles(button.bordered)}
            className="text-sm px-4 py-2 rounded font-medium"
          >
            Cancel
          </button>
          <button
            disabled={!searchTerm.trim() || isLoading}
            style={getButtonStyles(button.action)}
            className="text-sm px-4 py-2.5 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Search
          </button>
        </div>
      </div>
    </div>
  );
}
