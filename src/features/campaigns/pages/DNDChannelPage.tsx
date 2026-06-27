import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Plus,
  Trash2,
  UserX,
  UserCheck,
  Eye,
} from "lucide-react";
import { createPortal } from "react-dom";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useLanguage } from "../../../contexts/LanguageContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import BackButton from "../../../shared/components/ui/BackButton";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import DateFormatter from "../../../shared/components/DateFormatter";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../../shared/components/ui/Pagination";
import { communicationChannelService, CommunicationChannel as ChannelData } from "../../../shared/services/communicationChannelService";
import { dndService, DNDSubscription, DNDType } from "../services/dndService";
import AddDNDMembersModal from "../components/AddDNDMembersModal";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";

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
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);
  const [isAddingCustomers, setIsAddingCustomers] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

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
      showError("Error", extractBackendError(error, "Error. Please try again."));
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

  // Table columns definition
  const defaultColumns: TableColumn<DNDSubscription>[] = [
    {
      id: "customer_name",
      label: "Customer",
      visible: true,
    },
    {
      id: "customer_phone",
      label: "Phone",
      visible: true,
    },
    {
      id: "customer_email",
      label: "Email",
      visible: true,
    },
    {
      id: "dnd_type_name",
      label: "DND Type",
      visible: true,
    },
    {
      id: "status",
      label: "Status",
      visible: true,
    },
    {
      id: "actions",
      label: "Actions",
      visible: true,
      sortable: false,
      render: (value, subscription) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => navigate(`/dashboard/dnd-management/${channelInfo?.id}/${subscription.id}`)}
            className={`p-2 ${tw.textSecondary} hover:bg-gray-100 ${tw.rounded} transition-colors`}
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {subscription.status === "active" && (
            <button
              onClick={() => handleRemoveCustomer(subscription)}
              className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isRemoving}
              title="Remove from DND"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const {
    columns,
    currentPage: tableCurrentPage,
    pageSize: tablePageSize,
    handlePageChange: tableHandlePageChange,
    handlePageSizeChange: tableHandlePageSizeChange,
    sortConfigs,
    handleSort,
    toggleColumn,
  } = useTable({
    tableId: "dnd-channel-table",
    defaultColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  // Handle pagination slicing
  const paginatedSubscriptions = filteredSubscriptions.slice(
    (tableCurrentPage - 1) * tablePageSize,
    tableCurrentPage * tablePageSize
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    tableHandlePageChange(1);
  }, [searchTerm, filterType, filterStatus, tableHandlePageChange]);

  const handleAddCustomers = async (
    members: Array<{
      customer_id: number;
      customer_name?: string;
      customer_email?: string;
      customer_phone?: string;
    }>,
    dndTypeId: number
  ) => {
    try {
      setIsAddingCustomers(true);
      await Promise.all(
        members.map((member) =>
          dndService.addDNDSubscription({
            customer_phone: member.customer_phone || "",
            channel: channelInfo?.code.toUpperCase() as "SMS" | "EMAIL" | "USSD" | "APP",
            dnd_type_id: dndTypeId,
            customer_name: member.customer_name,
            customer_email: member.customer_email,
          })
        )
      );

      const dndType = dndTypes.find((t) => t.id === dndTypeId);
      showToast(
        `success`,
        `${members.length} customer${members.length !== 1 ? "s" : ""} added to ${dndType?.name || "DND"} for ${channelInfo?.name || "channel"}`,
        "Customers have been added successfully"
      );
      setShowAddModal(false);
      await loadDNDData();
    } catch (err) {
      showError("Error", extractBackendError(error, "Error. Please try again."));
    } finally {
      setIsAddingCustomers(false);
    }
  };

  const handleRemoveCustomer = (subscription: DNDSubscription) => {
    setDeleteConfirmId(subscription.id);
    setDeleteConfirmName(subscription.customer_name || "Unknown");
  };

  const handleConfirmRemove = async () => {
    if (!deleteConfirmId) return;

    const oldSubscriptions = dndSubscriptions;

    try {
      setIsRemoving(true);
      setDndSubscriptions(dndSubscriptions.filter((s) => s.id !== deleteConfirmId));

      await dndService.removeDNDSubscription(deleteConfirmId);

      const subscription = oldSubscriptions.find((s) => s.id === deleteConfirmId);
      const dndType = dndTypes.find((t) => t.id === subscription?.dnd_type_id);

      showToast(
        `success`,
        `${subscription?.customer_name || "Customer"} removed from ${dndType?.name || "DND"} for ${channelInfo?.name || "channel"}`,
        "The customer has been removed successfully"
      );
      setDeleteConfirmId(null);
      setDeleteConfirmName("");
    } catch (err) {
      setDndSubscriptions(oldSubscriptions);
      showError("Error", extractBackendError(error, "Error. Please try again."));
    } finally {
      setIsRemoving(false);
    }
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
      {/* Breadcrumb and Add Button */}
      <div className="flex items-center justify-between gap-4">
        <BackButton showBreadcrumb={true} currentLabel={channelInfo?.name || "Channel"} />
        <button
          onClick={() => setShowAddModal(true)}
          className={`inline-flex items-center gap-2 px-4 py-2 ${tw.rounded} font-semibold text-sm text-white`}
          style={{ backgroundColor: color.primary.action }}
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* Description */}
      <div>
        <p className={`text-sm ${tw.textSecondary}`}>
          Manage Do Not Disturb lists for {channelInfo?.name || 'this channel'}. Add or remove customers who should not receive messages on this channel.
        </p>
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
      <div className={`${tw.rounded} overflow-hidden`}>
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
          <>
            {/* Table */}
            <Table<DNDSubscription>
              columns={columns}
              data={paginatedSubscriptions}
              totalItems={filteredSubscriptions.length}
              currentPage={tableCurrentPage}
              pageSize={tablePageSize}
              isLoading={loadingDNDData}
              onPageChange={tableHandlePageChange}
                onPageSizeChange={tableHandlePageSizeChange}
              onSort={handleSort}
              sortConfigs={sortConfigs}
              onHideColumn={toggleColumn}
              onManageColumnsClick={() => setShowColumnPicker(true)}
              style={{
                headerBackground: color.surface.tableHeader,
                headerTextColor: color.surface.tableHeaderText,
                rowBackground: color.surface.tablebodybg,
                rowSpacing: "0 8px",
              }}
            />

            {/* Pagination */}
            {!loadingDNDData && paginatedSubscriptions.length > 0 && filteredSubscriptions.length > 0 && (
              <Pagination
                currentPage={tableCurrentPage}
                pageSize={tablePageSize}
                totalItems={filteredSubscriptions.length}
                onPageChange={tableHandlePageChange}
                onPageSizeChange={tableHandlePageSizeChange}
              />
            )}
          </>
        )}
      </div>

      {/* Add DND Members Modal - Works for all channels */}
      <AddDNDMembersModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        dndTypes={dndTypes}
        channel={channelInfo?.code?.toUpperCase() || "CHANNEL"}
        onAdd={handleAddCustomers}
        isLoading={isAddingCustomers}
      />

      {/* Remove Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleConfirmRemove}
        title="Remove Customer from DND"
        description="Are you sure you want to remove this customer from the DND list? They will be able to receive messages again."
        itemName={deleteConfirmName}
        isLoading={isRemoving}
        confirmText="Remove"
      />
    </div>
  );
}
