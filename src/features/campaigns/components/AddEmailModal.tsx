import { useState } from "react";
import { X, Search, Mail } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";

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

interface Customer {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
}

// Dummy customer data for demonstration
const DUMMY_CUSTOMERS: Customer[] = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+254712345678",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "+254723456789",
  },
  {
    id: 3,
    name: "Bob Johnson",
    email: "bob.johnson@example.com",
    phone: "+254734567890",
  },
  {
    id: 4,
    name: "Alice Williams",
    email: "alice.williams@example.com",
    phone: "+254745678901",
  },
];

export default function AddEmailModal({
  isOpen,
  onClose,
  onAdd,
}: AddEmailModalProps) {
  const { success: showToast, error: showError } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      showError("Please enter an email or customer name");
      return;
    }

    setIsSearching(true);
    try {
      // TODO: Replace with actual API call
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Filter dummy data based on search term
      const filtered = DUMMY_CUSTOMERS.filter(
        (customer) =>
          customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      setSearchResults(filtered);
      if (filtered.length === 0) {
        showError("No customer found with that email or name");
      }
    } catch (error) {
      showError("Failed to search for customer");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const handleAdd = () => {
    if (!selectedCustomer) {
      showError("Please select a customer");
      return;
    }

    onAdd({
      id: selectedCustomer.id,
      name: selectedCustomer.name,
      email: selectedCustomer.email,
      phone: selectedCustomer.phone,
    });

    // Reset state
    setSearchTerm("");
    setSearchResults([]);
    setSelectedCustomer(null);
  };

  const handleClose = () => {
    setSearchTerm("");
    setSearchResults([]);
    setSelectedCustomer(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ backgroundColor: color.surface.background }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5" style={{ color: color.primary.action }} />
            <h2 className={`text-xl font-semibold ${tw.textPrimary}`}>
              Add Email to DND
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            <div>
              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
              >
                Search by Email or Customer Name
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter email or customer name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#588157] text-sm"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-4 py-2 rounded-md font-semibold text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: color.primary.action }}
                >
                  {isSearching ? "Searching..." : "Search"}
                </button>
              </div>
            </div>

            {/* Search Results */}
            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            )}

            {!isSearching && searchResults.length > 0 && (
              <div className="space-y-2">
                <h3 className={`text-sm font-medium ${tw.textPrimary} mb-2`}>
                  Search Results
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {searchResults.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => handleSelectCustomer(customer)}
                      className={`p-4 border rounded-md cursor-pointer transition-colors ${
                        selectedCustomer?.id === customer.id
                          ? "border-[#588157] bg-[#588157]/10"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`font-medium ${tw.textPrimary} mb-1`}>
                            {customer.name || "Unknown"}
                          </div>
                          <div className={`text-sm ${tw.textSecondary}`}>
                            {customer.email}
                          </div>
                          {customer.phone && (
                            <div className={`text-xs ${tw.textMuted} mt-1`}>
                              {customer.phone}
                            </div>
                          )}
                        </div>
                        {selectedCustomer?.id === customer.id && (
                          <div className="text-[#588157]">✓</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-md font-semibold text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedCustomer}
            className="px-4 py-2 rounded-md font-semibold text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: color.primary.action }}
          >
            Add to DND
          </button>
        </div>
      </div>
    </div>
  );
}
