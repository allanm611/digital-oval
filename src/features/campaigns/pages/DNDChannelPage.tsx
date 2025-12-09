import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Search,
  Trash2,
  UserX,
  UserCheck,
  Phone,
  Mail,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import DateFormatter from "../../../shared/components/DateFormatter";
import {
  COMMUNICATION_CHANNELS,
  CommunicationChannel,
} from "../types/communicationPolicyConfig";
import AddPhoneModal from "../components/AddPhoneModal";
import AddEmailModal from "../components/AddEmailModal";

// Types
export interface DNDSubscription {
  id: number;
  customer_id: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  dnd_type: "promotional" | "transactional" | "marketing" | "service" | "other";
  status: "active" | "removed";
  added_at: string;
  added_by?: number;
  added_by_name?: string;
  removed_at?: string;
  removed_by?: number;
  removed_by_name?: string;
}

const DND_TYPES = [
  { value: "promotional", label: "Promotional" },
  { value: "transactional", label: "Transactional" },
  { value: "marketing", label: "Marketing" },
  { value: "service", label: "Service" },
  { value: "other", label: "Other" },
] as const;

// Dummy data - Using Kenyan names from customer data
const DUMMY_DND_SUBSCRIPTIONS: DNDSubscription[] = [
  {
    id: 1,
    customer_id: 101,
    customer_name: "Nelly Mwaura",
    customer_email: "nelly.mwaura@gmail.com",
    customer_phone: "+254763056860",
    dnd_type: "promotional",
    status: "active",
    added_at: "2025-01-15T10:30:00Z",
    added_by: 1,
    added_by_name: "Admin User",
  },
  {
    id: 2,
    customer_id: 102,
    customer_name: "Wilson Githaiga",
    customer_email: "wilson.githaiga@yahoo.com",
    customer_phone: "+254763056254",
    dnd_type: "transactional",
    status: "active",
    added_at: "2025-01-20T14:20:00Z",
    added_by: 2,
    added_by_name: "Marketing Team",
  },
  {
    id: 3,
    customer_id: 103,
    customer_name: "Grace Wanjiru",
    customer_email: "grace.wanjiru@outlook.com",
    customer_phone: "+254723456789",
    dnd_type: "marketing",
    status: "removed",
    added_at: "2025-01-10T09:15:00Z",
    added_by: 1,
    added_by_name: "Admin User",
    removed_at: "2025-01-25T16:45:00Z",
    removed_by: 1,
    removed_by_name: "Admin User",
  },
  {
    id: 4,
    customer_id: 104,
    customer_name: "Peter Kipchoge",
    customer_email: "peter.kipchoge@gmail.com",
    customer_phone: "+254734567890",
    dnd_type: "service",
    status: "active",
    added_at: "2025-01-18T11:00:00Z",
    added_by: 3,
    added_by_name: "Support Team",
  },
  {
    id: 5,
    customer_id: 105,
    customer_name: "Mary Njeri",
    customer_email: "mary.njeri@gmail.com",
    customer_phone: "+254745678901",
    dnd_type: "promotional",
    status: "active",
    added_at: "2025-01-22T13:30:00Z",
    added_by: 2,
    added_by_name: "Marketing Team",
  },
];

export default function DNDChannelPage() {
  const navigate = useNavigate();
  const { channel } = useParams<{ channel: string }>();
  const { success: showToast, error: showError } = useToast();
  const [dndSubscriptions] = useState<DNDSubscription[]>(
    DUMMY_DND_SUBSCRIPTIONS
  );
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const channelValue = channel?.toUpperCase() as CommunicationChannel;
  const channelInfo = COMMUNICATION_CHANNELS.find(
    (ch) => ch.value === channelValue
  );

  const filteredSubscriptions = dndSubscriptions.filter((sub) => {
    const matchesSearch =
      sub.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.customer_phone?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || sub.dnd_type === filterType;
    const matchesStatus = filterStatus === "all" || sub.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleRemoveCustomer = (subscription: DNDSubscription) => {
    // TODO: Implement remove functionality
    showToast("Remove customer functionality will be implemented");
  };

  const handleAddCustomer = (customer: {
    id: number;
    name?: string;
    email?: string;
    phone?: string;
  }) => {
    // TODO: Implement add customer functionality
    showToast(
      `Customer ${
        customer.name || customer.email || customer.phone
      } added to DND list`
    );
    setShowAddModal(false);
  };

  if (!channelInfo) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
            Invalid channel
          </h3>
          <button
            onClick={() => navigate("/dashboard/dnd-management")}
            className="text-[#588157] hover:underline"
          >
            Return to DND Management
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => navigate("/dashboard/dnd-management")}
            className="p-2 text-gray-600 hover:text-gray-800 rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-xl sm:text-2xl font-bold ${tw.textPrimary}`}>
              {channelInfo.label} DND Management
            </h1>
            <p className={`${tw.textSecondary} mt-2 text-sm`}>
              Manage Do Not Disturb subscriptions for{" "}
              {channelInfo.label.toLowerCase()} channel
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-auto">
          {channelValue === "SMS" && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-sm text-white w-auto"
              style={{ backgroundColor: color.primary.action }}
            >
              <Phone className="w-4 h-4" />
              Add Phone
            </button>
          )}
          {channelValue === "EMAIL" && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-sm text-white w-auto"
              style={{ backgroundColor: color.primary.action }}
            >
              <Mail className="w-4 h-4" />
              Add Email
            </button>
          )}
          {(channelValue === "USSD" || channelValue === "APP") && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-sm text-white w-auto"
              style={{ backgroundColor: color.primary.action }}
            >
              <Plus className="w-4 h-4" />
              Add Customer
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="my-5">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search - 80% width */}
          <div className="relative flex-[0.8]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={
                channelValue === "SMS"
                  ? "Search by name, email, or phone number..."
                  : channelValue === "EMAIL"
                  ? "Search by name or email..."
                  : "Search by name..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#588157] text-sm"
            />
          </div>

          {/* Filters - 20% width */}
          <div className="flex flex-col md:flex-row gap-4 flex-[0.2]">
            {/* DND Type Filter */}
            <div className="flex-1 min-w-[180px]">
              <HeadlessSelect
                value={filterType}
                onChange={setFilterType}
                options={[
                  { value: "all", label: "All DND Types" },
                  ...DND_TYPES.map((type) => ({
                    value: type.value,
                    label: type.label,
                  })),
                ]}
                placeholder="Filter by DND Type"
              />
            </div>

            {/* Status Filter */}
            <div className="flex-1 min-w-[180px]">
              <HeadlessSelect
                value={filterStatus}
                onChange={setFilterStatus}
                options={[
                  { value: "all", label: "All Status" },
                  { value: "active", label: "Active" },
                  { value: "removed", label: "Removed" },
                ]}
                placeholder="Filter by Status"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="text-center py-12">
            <UserX className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
              No DND subscriptions found
            </h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full min-w-[1200px]"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead>
                <tr>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                      borderTopLeftRadius: "0.375rem",
                    }}
                  >
                    Customer
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    DND Type
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Status
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Added
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Added By
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Removed
                  </th>
                  <th
                    className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                      borderTopRightRadius: "0.375rem",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.map((subscription) => (
                  <tr key={subscription.id} className="transition-colors">
                    <td
                      className="px-6 py-4"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopLeftRadius: "0.375rem",
                        borderBottomLeftRadius: "0.375rem",
                      }}
                    >
                      <div>
                        <div
                          className={`text-base font-semibold ${tw.textPrimary}`}
                        >
                          {subscription.customer_name || "Unknown"}
                        </div>
                        <div className={`text-sm ${tw.textMuted}`}>
                          {channelValue === "SMS" &&
                            subscription.customer_phone}
                          {channelValue === "EMAIL" &&
                            subscription.customer_email}
                          {channelValue !== "SMS" &&
                            channelValue !== "EMAIL" &&
                            (subscription.customer_email ||
                              subscription.customer_phone ||
                              "No contact info")}
                        </div>
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className="text-sm text-black capitalize">
                        {subscription.dnd_type}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className="text-sm text-black">
                        {subscription.status}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary}`}>
                        <DateFormatter date={subscription.added_at} />
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary}`}>
                        {subscription.added_by_name || "System"}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary}`}>
                        {subscription.removed_at ? (
                          <DateFormatter date={subscription.removed_at} />
                        ) : (
                          "-"
                        )}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 text-center"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopRightRadius: "0.375rem",
                        borderBottomRightRadius: "0.375rem",
                      }}
                    >
                      {subscription.status === "active" ? (
                        <button
                          onClick={() => handleRemoveCustomer(subscription)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                          title="Remove from DND"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRemoveCustomer(subscription)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete from DND list"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Phone Modal for SMS */}
      {channelValue === "SMS" && (
        <AddPhoneModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddCustomer}
        />
      )}

      {/* Add Email Modal for EMAIL */}
      {channelValue === "EMAIL" && (
        <AddEmailModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddCustomer}
        />
      )}
    </div>
  );
}
