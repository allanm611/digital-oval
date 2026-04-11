import { useState, useEffect, useMemo } from "react";
import { Search, ArrowLeft, AlertCircle, Check, X } from "lucide-react";
import { createPortal } from "react-dom";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { color, tw, zIndex } from "../../../shared/utils/utils";

interface DNDSubscription {
  id: number;
  customer_id: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  dnd_type: "promotional" | "transactional" | "marketing" | "service" | "other";
  status: "active" | "removed";
}

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
  dndSubscriptions: DNDSubscription[];
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
  dndSubscriptions,
}: RemovePhoneModalProps) {
  const [step, setStep] = useState<"search" | "selectType">("search");
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredCustomerId, setHoveredCustomerId] = useState<number | null>(
    null,
  );
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: number;
    name?: string;
    email?: string;
    phone?: string;
  } | null>(null);
  const [selectedDndType, setSelectedDndType] = useState("promotional");

  // Get active DND customers from subscription data
  const activeDndCustomers = useMemo(() => {
    // TODO: Enhance with backend API call to fetch full customer details if needed
    // For now, use customer data from dndSubscriptions prop which should include customer details
    return dndSubscriptions.filter((sub) => sub.status === "active");
  }, [dndSubscriptions]);

  // Filter customers based on search term
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) {
      return activeDndCustomers;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    return activeDndCustomers.filter((sub) => {
      const name = sub.customer_name || `Customer ${sub.customer_id}`;
      const phone = sub.customer_phone || "";
      const email = sub.customer_email || "";

      return (
        name.toLowerCase().includes(lowerSearchTerm) ||
        phone.toLowerCase().includes(lowerSearchTerm) ||
        email.toLowerCase().includes(lowerSearchTerm) ||
        sub.customer_id.toString().includes(lowerSearchTerm)
      );
    });
  }, [searchTerm, activeDndCustomers]);

  const handleSelectCustomer = (sub: DNDSubscription) => {
    const name = sub.customer_name || `Customer ${sub.customer_id}`;
    const phone = sub.customer_phone || undefined;

    setSelectedCustomer({
      id: sub.customer_id,
      name,
      email: sub.customer_email || undefined,
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
    setStep("search");
    setSelectedCustomer(null);
    setSelectedDndType("promotional");
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        style={{
          zIndex: zIndex.modal,
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
        }}
        onClick={onClose}
      >
        <div
          className={`bg-white ${tw.rounded} w-full max-w-4xl max-h-[90vh] flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* STEP 1: SELECT CUSTOMER FROM DND LIST */}
          {step === "search" && (
            <>
              {/* Header */}
              <div
                className="flex items-center justify-between p-6 border-b flex-shrink-0"
                style={{ borderColor: color.border.default }}
              >
                <div>
                  <h2 className={`text-xl font-semibold ${tw.textPrimary}`}>
                    Remove Phone from DND
                  </h2>
                  <p className={`text-sm ${tw.textSecondary} mt-1`}>
                    Select a customer to remove from DND restrictions
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 transition-colors"
                  style={{ color: color.text.secondary }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      color.interactive.hover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="px-6 pt-6 pb-4 flex-shrink-0">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                    style={{ color: color.text.muted }}
                  />
                  <input
                    type="text"
                    placeholder="Search by name, phone, email, or customer ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 border ${tw.rounded} focus:outline-none focus:ring-2 text-sm`}
                    style={{
                      borderColor: color.border.default,
                      color: color.text.primary,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = color.primary.accent;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = color.border.default;
                    }}
                    autoFocus
                  />
                </div>
              </div>

              {/* Customers Table */}
              <div className="flex-1 overflow-y-auto px-6">
                {filteredCustomers.length === 0 ? (
                  <div className="text-center py-12">
                    <Search
                      className="w-12 h-12 text-gray-300 mx-auto mb-4"
                      style={{ color: color.text.muted }}
                    />
                    <h3
                      className={`text-lg font-medium ${tw.textPrimary} mb-2`}
                    >
                      {searchTerm.trim()
                        ? "No customers found"
                        : "No DND customers"}
                    </h3>
                    <p className={tw.textSecondary}>
                      {searchTerm.trim()
                        ? "Try adjusting your search criteria"
                        : "No customers are currently in DND"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead
                        className="sticky top-0 z-10"
                        style={{ backgroundColor: color.surface.tableHeader }}
                      >
                        <tr>
                          <th
                            className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-20"
                            style={{ color: color.text.secondary }}
                          >
                            Select
                          </th>
                          <th
                            className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                            style={{ color: color.text.secondary }}
                          >
                            Customer Name
                          </th>
                          <th
                            className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-40"
                            style={{ color: color.text.secondary }}
                          >
                            Phone
                          </th>
                          <th
                            className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider flex-1"
                            style={{ color: color.text.secondary }}
                          >
                            Email
                          </th>
                        </tr>
                      </thead>
                      <tbody
                        className="divide-y"
                        style={{ borderColor: color.border.muted }}
                      >
                        {filteredCustomers.map((sub) => {
                          const name =
                            sub.customer_name || `Customer ${sub.customer_id}`;
                          const phone = sub.customer_phone || "-";
                          const email = sub.customer_email || "-";
                          const isHovered =
                            hoveredCustomerId === sub.customer_id;

                          return (
                            <tr
                              key={`${sub.customer_id}-${sub.id}`}
                              onClick={() => handleSelectCustomer(sub)}
                              onMouseEnter={() =>
                                setHoveredCustomerId(sub.customer_id)
                              }
                              onMouseLeave={() => setHoveredCustomerId(null)}
                              className="cursor-pointer transition-colors"
                              style={{
                                backgroundColor: isHovered
                                  ? color.interactive.hover
                                  : "white",
                              }}
                            >
                              <td className="px-4 py-4">
                                <div className="flex items-center justify-center">
                                  <div
                                    className="w-5 h-5 rounded border-2"
                                    style={{
                                      borderColor: color.border.default,
                                    }}
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div
                                  className={`text-sm font-medium ${tw.textPrimary}`}
                                >
                                  {name}
                                </div>
                                <div
                                  className={`text-xs ${tw.textSecondary} mt-0.5`}
                                >
                                  ID: {sub.customer_id}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className={`text-sm ${tw.textPrimary}`}>
                                  {phone}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`text-sm ${tw.textSecondary}`}>
                                  {email}
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
              <div
                className="flex items-center justify-end p-6 border-t flex-shrink-0"
                style={{ borderColor: color.border.default }}
              >
                <button
                  onClick={handleClose}
                  className={`px-4 py-2 border ${tw.rounded} text-sm font-medium transition-colors`}
                  style={{
                    borderColor: color.border.default,
                    color: color.text.primary,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      color.interactive.hover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {/* STEP 2: SELECT DND TYPE */}
          {step === "selectType" && selectedCustomer && (
            <>
              {/* Header */}
              <div
                className="flex items-center justify-between p-6 border-b flex-shrink-0"
                style={{ borderColor: color.border.default }}
              >
                <div>
                  <h2 className={`text-xl font-semibold ${tw.textPrimary}`}>
                    Select DND Type to Remove
                  </h2>
                  <p className={`text-sm ${tw.textSecondary} mt-1`}>
                    Choose which DND restriction to remove for this customer
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 transition-colors"
                  style={{ color: color.text.secondary }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      color.interactive.hover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                {/* Customer Summary */}
                <div
                  className={`p-4 ${tw.rounded} border-2`}
                  style={{
                    backgroundColor: `${color.primary.accent}15`,
                    borderColor: color.primary.accent,
                  }}
                >
                  <p
                    className="text-sm font-semibold"
                    style={{ color: color.text.primary }}
                  >
                    {selectedCustomer.name || selectedCustomer.phone}
                  </p>
                  <div
                    className="mt-2 space-y-1 text-xs"
                    style={{ color: color.text.secondary }}
                  >
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
                  <label
                    className="block text-sm font-medium"
                    style={{ color: color.text.primary }}
                  >
                    Select DND Type to Remove
                  </label>
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
                  <p
                    className="text-xs"
                    style={{ color: color.text.secondary }}
                  >
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
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-end gap-3 p-6 border-t flex-shrink-0"
                style={{ borderColor: color.border.default }}
              >
                <button
                  onClick={handleBackToSearch}
                  className={`px-4 py-2 border ${tw.rounded} font-medium text-sm transition-colors flex items-center gap-2`}
                  style={{
                    borderColor: color.border.default,
                    color: color.text.primary,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      color.interactive.hover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={handleConfirmRemove}
                  className={`px-6 py-2 ${tw.rounded} text-white font-medium text-sm transition-colors`}
                  style={{ backgroundColor: color.primary.action }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  Remove from DND
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
