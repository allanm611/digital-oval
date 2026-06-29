import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, UserX, Search, X } from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useLanguage } from "../../../contexts/LanguageContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { color, tw } from "../../../shared/utils/utils";
import BackButton from "../../../shared/components/ui/BackButton";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../shared/components/ui/Checkbox";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../../shared/components/ui/Pagination";
import {
  communicationChannelService,
  CommunicationChannel,
} from "../../../shared/services/communicationChannelService";
import { dndService, DNDSubscription, DNDType } from "../services/dndService";
import AddDNDBulkModal from "../components/AddDNDBulkModal";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";

export default function DNDBulkManagementPage() {
  const navigate = useNavigate();
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();

  const [dndSubscriptions, setDndSubscriptions] = useState<DNDSubscription[]>(
    []
  );
  const [dndTypes, setDndTypes] = useState<DNDType[]>([]);
  const [channels, setChannels] = useState<CommunicationChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterChannel, setFilterChannel] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [filterChannel, filterType]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [types, allChannels, subscriptions] = await Promise.all([
        dndService.getDNDTypes(true),
        communicationChannelService.getAll(),
        dndService.getDNDSubscriptions({
          dnd_type_id:
            filterType !== "all" ? Number(filterType) : undefined,
          channel:
            filterChannel !== "all" ? filterChannel.toUpperCase() : undefined,
        }),
      ]);

      setDndTypes(types);
      setChannels(allChannels.filter((ch) => ch.is_active));
      setDndSubscriptions(subscriptions);
      setSelectedRows(new Set());
    } catch (err) {
      showError("Error", extractBackendError(err, "Error. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscriptions = useMemo(() => {
    return dndSubscriptions.filter((sub) => {
      const matchesSearch =
        sub.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.customer_phone?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [dndSubscriptions, searchTerm]);

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
      id: "channel",
      label: "Channel",
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
      isActionColumn: true,
      render: (value, subscription) => (
        <div className="flex items-center justify-center">
          {subscription.status === "active" && (
            <button
              onClick={() => handleRemoveCustomer(subscription)}
              className={`p-0 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-colors`}
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
    tableId: "dnd-bulk-management-table",
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
  }, [searchTerm, filterType, filterChannel, tableHandlePageChange]);

  const handleSelectAll = () => {
    if (selectedRows.size === filteredSubscriptions.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredSubscriptions.map((sub) => sub.id)));
    }
  };

  const handleSelectRow = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleBatchRemove = () => {
    setShowBatchDeleteModal(true);
  };

  const handleConfirmBatchRemove = async () => {
    const subscriptionIds = Array.from(selectedRows);
    setIsBatchProcessing(true);

    try {
      await Promise.all(
        subscriptionIds.map((id) => dndService.removeDNDSubscription(id))
      );

      showToast(
        "success",
        `${subscriptionIds.length} customer(s) removed from DND`,
        "Bulk removal completed successfully"
      );
      setSelectedRows(new Set());
      setIsSelectionMode(false);
      setShowBatchDeleteModal(false);
      await loadData();
    } catch (err) {
      showError("Error", extractBackendError(err, "Error. Please try again."));
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleAddCustomers = async (
    memberIds: number[],
    dndTypeId: number,
    selectedChannels: string[]
  ) => {
    try {
      const membersToAdd = dndSubscriptions.filter((sub) =>
        memberIds.includes(sub.customer_id || -1)
      );

      for (const channel of selectedChannels) {
        await Promise.all(
          membersToAdd.map((member) =>
            dndService.addDNDSubscription({
              customer_phone: member.customer_phone || "",
              channel: channel as "SMS" | "EMAIL" | "USSD" | "APP",
              dnd_type_id: dndTypeId,
              customer_name: member.customer_name,
              customer_email: member.customer_email,
            })
          )
        );
      }

      const dndType = dndTypes.find((t) => t.id === dndTypeId);
      showToast(
        "success",
        `Customers added to ${dndType?.name || "DND"} for ${selectedChannels.length} channel${selectedChannels.length !== 1 ? "s" : ""}`,
        "Bulk addition completed successfully"
      );
      setShowAddModal(false);
      await loadData();
    } catch (err) {
      showError("Error", extractBackendError(err, "Error. Please try again."));
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
        "success",
        `${subscription?.customer_name || "Customer"} removed from ${dndType?.name || "DND"} for ${subscription?.channel || "channel"}`,
        "The customer has been removed successfully"
      );
      setDeleteConfirmId(null);
      setDeleteConfirmName("");
    } catch (err) {
      setDndSubscriptions(oldSubscriptions);
      showError("Error", extractBackendError(err, "Error. Please try again."));
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <BackButton
       
        showBreadcrumb={true}
        currentLabel="Bulk Management"
      />

      {/* Description and Action Buttons */}
      <div className="flex items-center justify-between gap-4">
        <p className={`text-sm ${tw.textSecondary} flex-1`}>
          Manage DND subscriptions across channels
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className={`inline-flex items-center gap-2 px-4 py-2 ${tw.rounded} font-semibold text-sm text-white whitespace-nowrap`}
            style={{ backgroundColor: color.primary.action }}
          >
            <Plus className="w-4 h-4" />
            Add Customers
          </button>
          <button
            onClick={() => {
              if (!isSelectionMode) {
                setIsSelectionMode(true);
                setSelectedRows(new Set(filteredSubscriptions.map((sub) => sub.id)));
              } else {
                setIsSelectionMode(false);
                setSelectedRows(new Set());
              }
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 ${tw.rounded} text-sm font-medium whitespace-nowrap`}
            style={{
              backgroundColor: isSelectionMode ? color.primary.action : "transparent",
              color: isSelectionMode ? "white" : "var(--c-bordered-button-color)",
              borderColor: "var(--c-bordered-button-color)",
                  borderWidth: "1px",
                  borderStyle: "solid",
            }}
          >
            {isSelectionMode ? "Exit Selection" : "Select Customers"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="my-5">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search - 50% width */}
          <div className="flex-1">
            <SearchInput
              placeholder="Search by name, email, or phone number..."
              value={searchTerm}
              onChange={(value) => setSearchTerm(value)}
            />
          </div>

          {/* Filters - 50% width */}
          <div className="flex flex-col md:flex-row gap-4 flex-1">
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

            {/* Channel Filter */}
            <div className="flex-1 min-w-[180px]">
              <HeadlessSelect
                value={filterChannel}
                onChange={setFilterChannel}
                options={[
                  { value: "all", label: "All Channels" },
                  ...channels.map((channel) => ({
                    value: channel.code.toUpperCase(),
                    label: channel.name,
                  })),
                ]}
                placeholder="Filter by Channel"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Batch Actions Toolbar */}
      {isSelectionMode && selectedRows.size > 0 && (
        <div
          className={`flex items-center justify-between ${tw.rounded} border border-gray-200 bg-white px-4 py-3`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {selectedRows.size} customer(s) selected
            </span>
            <button
              onClick={() => setSelectedRows(new Set())}
              className="text-sm text-gray-500 hover:text-gray-700"
              title="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={handleBatchRemove}
            disabled={isBatchProcessing}
            className={`inline-flex items-center gap-0 ${tw.rounded} border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isBatchProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Remove Selected
              </>
            )}
          </button>
        </div>
      )}

      {/* Table */}
      <div className={`${tw.rounded} overflow-hidden`}>
        {loading ? (
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
              isLoading={loading}
              onPageChange={tableHandlePageChange}
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
            {!loading && paginatedSubscriptions.length > 0 && filteredSubscriptions.length > 0 && (
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

      {/* Add DND Bulk Modal */}
      <AddDNDBulkModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        dndTypes={dndTypes}
        channels={channels}
        onAdd={handleAddCustomers}
        isLoading={false}
      />

      {/* Remove Confirmation Modal - Individual */}
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

      {/* Remove Confirmation Modal - Batch */}
      <DeleteConfirmModal
        isOpen={showBatchDeleteModal}
        onClose={() => setShowBatchDeleteModal(false)}
        onConfirm={handleConfirmBatchRemove}
        title="Remove Customers from DND"
        description="Are you sure you want to remove these customers from DND? This action cannot be undone."
        itemName={`${selectedRows.size} customer${selectedRows.size !== 1 ? "s" : ""}`}
        isLoading={isBatchProcessing}
        confirmText="Remove"
      />
    </div>
  );
}
