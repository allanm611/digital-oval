import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Plus,
  Trash2,
  UserX,
  UserCheck,
  Mail,
  Minus,
} from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import BackButton from "../../../shared/components/ui/BackButton";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import DateFormatter from "../../../shared/components/DateFormatter";
import { communicationChannelService, CommunicationChannel as ChannelData } from "../../../shared/services/communicationChannelService";
import { dndService, DNDSubscription, DNDType } from "../services/dndService";
import AddPhoneModal from "../components/AddPhoneModal";
import AddEmailModal from "../components/AddEmailModal";

export default function DNDChannelPage() {
  const navigate = useNavigate();
  const { channel } = useParams<{ channel: string }>();
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();
  const [dndSubscriptions, setDndSubscriptions] = useState<DNDSubscription[]>([]);
  const [dndTypes, setDndTypes] = useState<DNDType[]>([]);
  const [loadingChannel, setLoadingChannel] = useState(true);
  const [loadingDNDData, setLoadingDNDData] = useState(false);
  const [channelInfo, setChannelInfo] = useState<ChannelData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  useEffect(() => {
    if (channel) {
      loadChannelInfo();
    }
  }, [channel]);

  useEffect(() => {
    if (channelInfo) {
      loadDNDData();
    }
  }, [channelInfo, filterStatus]);

  const loadChannelInfo = async () => {
    try {
      setLoadingChannel(true);
      const channels = await communicationChannelService.getAll();
      const channelIdNum = Number(channel);
      const foundChannel = channels.find((ch) => ch.id === channelIdNum);

      if (foundChannel) {
        setChannelInfo(foundChannel);
      } else {
        setChannelInfo(null);
      }
    } catch (err) {
      showError("Error", "Failed to load channel information");
      setChannelInfo(null);
    } finally {
      setLoadingChannel(false);
    }
  };

  const loadDNDData = async () => {
    try {
      setLoadingDNDData(true);
      const [types, subscriptions] = await Promise.all([
        dndService.getDNDTypes(true),
        dndService.getDNDSubscriptions({
          channel: channelInfo?.code.toUpperCase(),
          status: filterStatus === "all" ? undefined : filterStatus,
          search: searchTerm || undefined,
        }),
      ]);
      setDndTypes(types);
      setDndSubscriptions(subscriptions);
    } catch (err) {
      showError("Error", "Failed to load DND data");
    } finally {
      setLoadingDNDData(false);
    }
  }

  const filteredSubscriptions = dndSubscriptions.filter((sub) => {
    const matchesSearch =
      sub.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.customer_phone?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || sub.dnd_type_id === Number(filterType);

    return matchesSearch && matchesType;
  });

  const handleAddCustomer = async (customer: {
    id: number;
    name?: string;
    email?: string;
    phone?: string;
    dndTypeId: number;
  }) => {
    try {
      await dndService.addDNDSubscription({
        customer_phone: customer.phone || "",
        channel: channelInfo?.code.toUpperCase() as "SMS" | "EMAIL" | "USSD" | "APP",
        dnd_type_id: customer.dndTypeId,
        customer_name: customer.name,
        customer_email: customer.email,
      });

      const dndType = dndTypes.find((t) => t.id === customer.dndTypeId);
      showToast(
        `success`,
        `Customer added to ${dndType?.name || "DND"} list`,
        "The customer has been added successfully"
      );
      setShowAddModal(false);
      await loadDNDData();
    } catch (err) {
      showError("Error", "Failed to add customer to DND list");
    }
  };

  const handleRemoveCustomer = async (subscription: DNDSubscription) => {
    try {
      await dndService.removeDNDSubscription(subscription.id);

      const dndType = dndTypes.find((t) => t.id === subscription.dnd_type_id);
      showToast(
        `success`,
        `Customer removed from ${dndType?.name || "DND"} list`,
        "The customer has been removed successfully"
      );
      setShowRemoveModal(false);
      await loadDNDData();
    } catch (err) {
      showError("Error", "Failed to remove customer from DND list");
    }
  };

  const handleDeleteDNDRecord = (id: number, name: string) => {
    // TODO: Implement delete functionality
    showToast(
      `success`,
      t.dnd.recordDeleted,
      t("dnd.recordDeletedDesc", { name }),
    );
  };

  if (loadingChannel) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner variant="modern" size="md" color="primary" />
      </div>
    );
  }

  if (!channelInfo) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
            Invalid channel
          </h3>
          <button
            onClick={() =>
              navigateBackOrFallback(navigate, "/dashboard/dnd-management")
            }
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
      {/* Breadcrumb */}
      <BackButton fallbackTo="/dashboard/dnd-management" showBreadcrumb={true} currentLabel={channelInfo?.name || "Channel"} />

      {/* Description and Actions */}
      <div className="flex items-start justify-between gap-4">
        <p className={`text-sm ${tw.textSecondary}`}>
          Manage Do Not Disturb lists for {channelInfo?.name || 'this channel'}. Add or remove customers who should not receive messages on this channel.
        </p>
        <div className="flex flex-wrap items-center gap-2 w-auto">
          {channelInfo?.code.toUpperCase() === "SMS" && (
            <>
              <button
                onClick={() => setShowAddModal(true)}
                className={`inline-flex items-center gap-2 px-4 py-2 ${tw.rounded} font-semibold text-sm text-white w-auto`}
                style={{ backgroundColor: color.primary.action }}
              >
                <Plus className="w-4 h-4" />
                Add Phone
              </button>
              <button
                onClick={() => setShowRemoveModal(true)}
                className={`inline-flex items-center gap-2 px-4 py-2 ${tw.rounded} font-semibold text-sm text-white w-auto`}
                style={{ backgroundColor: color.primary.action }}
              >
                <Minus className="w-4 h-4" />
                Remove Phone
              </button>
            </>
          )}
          {channelInfo?.code.toUpperCase() === "EMAIL" && (
            <button
              onClick={() => setShowAddModal(true)}
              className={`inline-flex items-center gap-2 px-4 py-2 ${tw.rounded} font-semibold text-sm text-white w-auto`}
              style={{ backgroundColor: color.primary.action }}
            >
              <Mail className="w-4 h-4" />
              Add Email
            </button>
          )}
          {(channelInfo?.code.toUpperCase() === "USSD" || channelInfo?.code.toUpperCase() === "APP") && (
            <button
              onClick={() => setShowAddModal(true)}
              className={`inline-flex items-center gap-2 px-4 py-2 ${tw.rounded} font-semibold text-sm text-white w-auto`}
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
          <div className="flex-[0.8]">
            <SearchInput
              placeholder={
                channelInfo?.code.toUpperCase() === "SMS"
                  ? "Search by name, email, or phone number..."
                  : channelInfo?.code.toUpperCase() === "EMAIL"
                    ? "Search by name or email..."
                    : "Search by name..."
              }
              value={searchTerm}
              onChange={(value) => setSearchTerm(value)}
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
                  ...dndTypes.map((type) => ({
                    value: String(type.id),
                    label: type.name,
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
      <div className={`${tw.rounded} border border-gray-200 overflow-hidden`}>
        {loadingDNDData ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="text-center py-12">
            <UserX className="w-10 h-10 text-gray-400 mx-auto mb-4" />
            <h3 className={`text-sm ${tw.textPrimary} mb-2`}>
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
                    Phone
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Email
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
                      <div className={`${tw.tableFirstColumn} ${tw.textPrimary}`}>
                        {subscription.customer_name || "Unknown"}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className="text-sm text-black">
                        {subscription.customer_phone || "—"}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className="text-sm text-black">
                        {subscription.customer_email || "—"}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className="text-sm text-black capitalize">
                        {subscription.dnd_type_name || "Unknown"}
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
                      {subscription.status === "active" && (
                        <button
                          onClick={() => handleRemoveCustomer(subscription)}
                          className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-colors`}
                          title="Remove from DND"
                        >
                          <UserCheck className="w-4 h-4" />
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
      {channelInfo?.code.toUpperCase() === "SMS" && (
        <AddPhoneModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          dndTypes={dndTypes}
          onAdd={handleAddCustomer}
        />
      )}

      {/* Add Email Modal for EMAIL */}
      {channelInfo?.code.toUpperCase() === "EMAIL" && (
        <AddEmailModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          dndTypes={dndTypes}
          onAdd={handleAddCustomer}
        />
      )}
    </div>
  );
}
