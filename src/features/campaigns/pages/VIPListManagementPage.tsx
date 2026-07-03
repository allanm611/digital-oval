import { useState, useEffect, useCallback } from "react";
import { Plus, Star, Users, Trash2, X, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAuth } from "../../../contexts/AuthContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import SearchInput from "../../../shared/components/ui/SearchInput";
import DateFormatter from "../../../shared/components/DateFormatter";
import CreateVIPListModal from "../components/CreateVIPListModal";
import AddVIPMembersModal from "../components/AddVIPMembersModal";
import { vipListService } from "../../../shared/services/vipListService";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../../shared/components/ui/Pagination";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";
import { ColumnPickerModal } from "../../../shared/components/ColumnPickerModal";

// Types
export interface VIPCustomer {
  id: number;
  customer_id: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  vip_list_id?: number;
  vip_list_name?: string;
  status: "active" | "inactive";
  added_at: string;
  added_by?: number;
  added_by_name?: string;
  removed_at?: string;
  removed_by?: number;
  removed_by_name?: string;
}

export interface VIPList {
  id: number;
  name: string;
  description?: string;
  member_count?: number;
  rows_imported?: number;
  rows_failed?: number;
  processing_status?: "pending" | "processing" | "completed" | "failed";
  status?: string;
  created_at: string;
}

interface VIPCustomerTableRow {
  id: number;
  name: string;
  email: string;
  vipList: string;
  status: string;
  addedDate: string;
  _full?: VIPCustomer;
}

interface VIPListTableRow {
  id: number;
  name: string;
  description: string;
  members: number;
  rowsImported: number;
  rowsFailed: number;
  status: string;
  _full?: VIPList;
}

export default function VIPListManagementPage() {
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vipCustomers, setVipCustomers] = useState<VIPCustomer[]>([]);
  const [vipLists, setVipLists] = useState<VIPList[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermLists, setSearchTermLists] = useState("");
  const [filterList, setFilterList] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterStatusLists, setFilterStatusLists] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"customers" | "lists">(
    "lists",
  );
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);
  const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [debouncedSearchTermLists, setDebouncedSearchTermLists] = useState("");
  const [editingList, setEditingList] = useState<VIPList | null>(null);
  const [listToDelete, setListToDelete] = useState<VIPList | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<VIPCustomer | null>(
    null,
  );
  const [isDeletingList, setIsDeletingList] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [isListMembersModalOpen, setIsListMembersModalOpen] = useState(false);
  const [selectedListForMembers, setSelectedListForMembers] =
    useState<VIPList | null>(null);
  const [listMembers, setListMembers] = useState<VIPCustomer[]>([]);
  const [isLoadingListMembers, setIsLoadingListMembers] = useState(false);
  const [showColumnPicker, setShowColumnPicker] = useState<"customers" | "lists" | null>(null);

  const vipCustomerTableColumns: TableColumn<VIPCustomerTableRow>[] = [
    {
      id: "name",
      label: "Name",
      visible: true,
      sortable: true,
      filterConfig: { type: 'text' },
    },
    {
      id: "email",
      label: "Email",
      visible: true,
      filterConfig: { type: 'text' },
    },
    {
      id: "vipList",
      label: "VIP List",
      visible: true,
      filterConfig: { type: 'text' },
    },
    {
      id: "status",
      label: "Status",
      visible: true,
      filterConfig: { type: 'select', options: ['active', 'inactive'] },
    },
    {
      id: "addedDate",
      label: "Added Date",
      visible: true,
      filterConfig: { type: 'date' },
    },
    {
      id: "actions",
      label: "Actions",
      visible: true,
      sortable: false,
      isActionColumn: true,
      render: (_, row) => {
        if (!row._full) return null;
        return (
          <div className="flex items-center justify-center">
            <button
              onClick={() => setMemberToRemove(row._full)}
              className={`p-0 icon-delete ${tw.rounded} transition-colors`}
              title="Remove from VIP List"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  const vipListTableColumns: TableColumn<VIPListTableRow>[] = [
    {
      id: "name",
      label: "List Name",
      visible: true,
      sortable: true,
      filterConfig: { type: 'text' },
      render: (_, row) => (
        <button
          onClick={() => navigate(`/dashboard/vip-list-management/${row.id}`)}
          className={`${tw.tableFirstColumn} ${tw.textPrimary} text-sm hover:underline font-medium`}
        >
          {row.name}
        </button>
      ),
    },
    {
      id: "description",
      label: "Description",
      visible: true,
      filterConfig: { type: 'text' },
      render: (_, row) => (
        <div className={`text-sm ${tw.textSecondary} max-w-md`}>
          {row.description || "No description"}
        </div>
      ),
    },
    {
      id: "members",
      label: "Customers",
      visible: true,
      filterConfig: { type: 'number' },
      render: (_, row) => {
        if (!row._full) return <span>{row.members}</span>;
        return (
          <button
            onClick={() => {
              setSelectedListForMembers(row._full);
              setIsListMembersModalOpen(true);
              loadListMembers(row._full.id);
            }}
            className="text-sm font-medium transition-colors hover:underline"
            style={{ color: color.primary.accent, background: "none", border: "none", padding: "0", cursor: "pointer" }}
          >
            {row.members}
          </button>
        );
      },
    },
    {
      id: "rowsImported",
      label: "Rows Imported",
      visible: true,
      filterConfig: { type: 'number' },
      render: (_, row) => (
        <span className="text-sm text-black">{row.rowsImported}</span>
      ),
    },
    {
      id: "rowsFailed",
      label: "Rows Failed",
      visible: true,
      filterConfig: { type: 'number' },
      render: (_, row) => (
        <span className="text-sm text-black">{row.rowsFailed}</span>
      ),
    },
    {
      id: "status",
      label: "Status",
      visible: true,
      filterConfig: { type: 'text' },
      render: (_, row) => (
        <span className="text-sm text-black">{row.status}</span>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      visible: true,
      sortable: false,
      isActionColumn: true,
      render: (_, row) => {
        if (!row._full) return null;
        return (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => navigate(`/dashboard/vip-list-management/${row.id}`)}
              className={`p-0 icon-edit ${tw.rounded} transition-colors`}
              title="View details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteVIPList(row._full)}
              className={`p-0 icon-delete ${tw.rounded} transition-colors`}
              title="Delete VIP List"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  const {
    columns: customerColumns,
    currentPage: customerCurrentPage,
    pageSize: customerPageSize,
    handlePageChange: customerHandlePageChange,
    sortConfigs: customerSortConfigs,
    handleSort: customerHandleSort,
    toggleColumn: toggleCustomerColumn,
    reorderColumns: reorderCustomerColumns,
    resetToDefaults: resetCustomerDefaults,
  } = useTable({
    tableId: "vip-customers-table",
    defaultColumns: vipCustomerTableColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  const {
    columns: vipListColumns,
    currentPage: vipListCurrentPage,
    pageSize: vipListPageSize,
    handlePageChange: vipListHandlePageChange,
    sortConfigs: vipListSortConfigs,
    handleSort: vipListHandleSort,
    toggleColumn: toggleVipListColumn,
    reorderColumns: reorderVipListColumns,
    resetToDefaults: resetVipListDefaults,
  } = useTable({
    tableId: "vip-lists-table",
    defaultColumns: vipListTableColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  // Fetch VIP lists on mount
  useEffect(() => {
    loadVIPLists();
  }, []);

  const loadVIPLists = async () => {
    setLoading(true);
    try {
      const response = await vipListService.getAll();
      if (Array.isArray(response)) {
        setVipLists(response);
      } else {
        setVipLists([]);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch VIP lists:", error);
      showError(extractBackendError(err, "Failed to fetch VIP lists. Please try again."));
      setVipLists([]);
      setLoading(false);
    }
  };

  const loadAllMembers = useCallback(async () => {
    if (vipLists.length === 0) {
      setVipCustomers([]);
      return;
    }

    setLoading(true);
    try {
      const allMembers: VIPCustomer[] = [];
      for (const list of vipLists) {
        const members = await vipListService.getMembers(list.id);
        if (Array.isArray(members)) {
          allMembers.push(...members);
        }
      }
      setVipCustomers(allMembers);
    } catch (error) {
      console.error("Failed to fetch VIP members:", error);
      showError(extractBackendError(error, "Failed to fetch VIP members. Please try again."));
      setVipCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [vipLists, showError]);

  const loadListMembers = useCallback(async (listId: number) => {
    setIsLoadingListMembers(true);
    try {
      const members = await vipListService.getMembers(listId);
      if (Array.isArray(members)) {
        setListMembers(members);
      }
    } catch (error) {
      console.error("Failed to fetch list members:", error);
      showError(extractBackendError(error, "Failed to fetch list members. Please try again."));
      setListMembers([]);
    } finally {
      setIsLoadingListMembers(false);
    }
  }, [showError]);

  useEffect(() => {
    if (activeTab === "customers" && vipLists.length > 0) {
      loadAllMembers();
    }
  }, [activeTab, vipLists, loadAllMembers]);

  // Debounce search for customers
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Debounce search for lists
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTermLists(searchTermLists);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTermLists]);

  const filteredCustomers = vipCustomers.filter((customer) => {
    const matchesSearch =
      customer.customer_name
        ?.toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase()) ||
      customer.customer_email
        ?.toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase()) ||
      customer.customer_phone
        ?.toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase());

    const matchesList =
      filterList === "all" || customer.vip_list_id?.toString() === filterList;
    const matchesStatus =
      filterStatus === "all" || customer.status === filterStatus;

    return matchesSearch && matchesList && matchesStatus;
  });

  const filteredLists = vipLists.filter((list) => {
    const matchesSearch =
      list.name
        ?.toLowerCase()
        .includes(debouncedSearchTermLists.toLowerCase()) ||
      list.description
        ?.toLowerCase()
        .includes(debouncedSearchTermLists.toLowerCase());

    const listStatus = (
      list.processing_status ||
      list.status ||
      ""
    ).toLowerCase();
    const matchesStatus =
      filterStatusLists === "all" || listStatus === filterStatusLists;

    return matchesSearch && matchesStatus;
  });

  const handleRemoveCustomer = (customer: VIPCustomer) => {
    setMemberToRemove(customer);
  };

  const handleSaveVIPList = async (data: any) => {
    setIsCreatingList(true);
    try {
      if (editingList) {
        const response = await vipListService.update(editingList.id, data);
        if (response) {
          showToast("VIP list updated successfully");
        }
      } else {
        const response = await vipListService.create(data);
        if (response) {
          showToast("VIP list created successfully");
        }
      }

      await loadVIPLists();
    } catch (error) {
      showError(
        editingList ? "Failed to update VIP list" : "Failed to create VIP list",
      );
      throw error;
    } finally {
      setIsCreatingList(false);
      setEditingList(null);
    }
  };

  const handleDeleteVIPList = (list: VIPList) => {
    setListToDelete(list);
  };

  const confirmDeleteVIPList = async () => {
    if (!listToDelete) {
      return;
    }

    setIsDeletingList(true);
    try {
      await vipListService.delete(listToDelete.id);
      showToast("VIP list deleted successfully");

      setVipLists((prev) => prev.filter((list) => list.id !== listToDelete.id));
      setVipCustomers((prev) =>
        prev.filter((customer) => customer.vip_list_id !== listToDelete.id),
      );
    } catch {
      showError("Failed to delete VIP list");
    } finally {
      setIsDeletingList(false);
      setListToDelete(null);
    }
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) {
      return;
    }

    setIsRemovingMember(true);
    try {
      await vipListService.removeMember(memberToRemove.vip_list_id, memberToRemove.id, user?.user_id);
      showToast("Customer removed from VIP list successfully");

      setVipCustomers((prev) =>
        prev.filter((customer) => customer.id !== memberToRemove.id)
      );
    } catch {
      showError("Failed to remove customer from VIP list");
    } finally {
      setIsRemovingMember(false);
      setMemberToRemove(null);
    }
  };

  const handleAddMembers = async (members: any[]) => {
    setIsAddingMembers(true);
    try {
      for (const member of members) {
        await vipListService.addMember(member);
      }
      showToast(
        `${members.length} member${members.length !== 1 ? "s" : ""} added successfully`,
      );
      await loadAllMembers();
    } catch (error) {
      showError(extractBackendError(err, "Failed to add members. Please try again."));
      throw error;
    } finally {
      setIsAddingMembers(false);
    }
  };

  const handleViewListMembers = async (list: VIPList) => {
    setSelectedListForMembers(list);
    setIsLoadingListMembers(true);
    try {
      const members = await vipListService.getMembers(list.id);
      setListMembers(Array.isArray(members) ? members : []);
      setIsListMembersModalOpen(true);
    } catch (error) {
      showError(extractBackendError(err, "Failed to fetch list members. Please try again."));
      console.error("Error fetching members:", error);
    } finally {
      setIsLoadingListMembers(false);
    }
  };

  const handleViewCustomerDetail = (customer: VIPCustomer) => {
    navigate(`/dashboard/customers/details/${customer.customer_id}`, {
      state: {
        customer: {
          id: customer.customer_id.toString(),
          name: customer.customer_name || `Customer ${customer.customer_id}`,
          segment: "VIP",
          lifetimeValue: 0,
          clv: 0,
          orders: 0,
          aov: 0,
          lastPurchase: "—",
          lastInteractionDate: new Date().toISOString().split("T")[0],
          engagementScore: 70,
          churnRisk: 10,
          preferredChannel: "SMS",
          location: "Nairobi, KE",
          email: customer.customer_email,
          phone: customer.customer_phone,
        },
        subscription: {
          customerId: customer.customer_id,
          firstName: customer.customer_name?.split(" ")[0] || "Unknown",
          lastName:
            customer.customer_name?.split(" ").slice(1).join(" ") || "Customer",
          msisdn: customer.customer_phone,
          email: customer.customer_email,
          status: customer.status,
        },
        source: "vip-list-management",
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Buttons */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>VIP List Management</h1>
          {/* Tab-specific buttons */}
          <div className="flex items-center gap-3 w-auto flex-shrink-0">
            {activeTab === "customers" && (
              <button
                onClick={() => setIsAddMembersModalOpen(true)}
                className={`inline-flex items-center gap-2 px-4 py-2 ${tw.rounded} font-semibold text-sm text-white`}
                style={{ backgroundColor: color.primary.action }}
              >
                <Plus className="w-4 h-4" />
                Add Members
              </button>
            )}
            {activeTab === "lists" && (
              <button
                onClick={() => setIsCreateListModalOpen(true)}
                className={`inline-flex items-center gap-2 px-4 py-2 ${tw.rounded} font-semibold text-sm text-white`}
                style={{ backgroundColor: color.primary.action }}
              >
                <Plus className="w-4 h-4" />
                Create
              </button>
            )}
          </div>
        </div>
        <p className={`${tw.textSecondary} text-sm`}>
          {t.vipListManagement.subtitle}
        </p>
      </div>

      {/* Tabs */}
      <style>{`
        @media (max-width: 640px) {
          .vip-list-tabs::-webkit-scrollbar {
            display: none;
          }
          .vip-list-tabs {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        }
      `}</style>
      <div className="vip-list-tabs flex gap-1 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab("lists")}
          className={`px-3 sm:px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2 relative flex-shrink-0 ${
            activeTab === "lists"
              ? "text-black"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Star className="w-4 h-4 flex-shrink-0" />
          <span className="whitespace-nowrap">VIP Lists</span>
          <span
            className="px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
            style={{
              backgroundColor:
                activeTab === "lists"
                  ? `${color.primary.accent}15`
                  : `${color.text.muted}15`,
              color:
                activeTab === "lists" ? color.primary.accent : color.text.muted,
            }}
          >
            {vipLists.length}
          </span>
          {activeTab === "lists" && (
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ backgroundColor: color.primary.accent }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("customers")}
          className={`px-3 sm:px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2 relative flex-shrink-0 ${
            activeTab === "customers"
              ? "text-black"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Users className="w-4 h-4 flex-shrink-0" />
          <span className="whitespace-nowrap">VIP Customers</span>
          <span
            className="px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
            style={{
              backgroundColor:
                activeTab === "customers"
                  ? `${color.primary.accent}15`
                  : `${color.text.muted}15`,
              color:
                activeTab === "customers"
                  ? color.primary.accent
                  : color.text.muted,
            }}
          >
            {vipCustomers.length}
          </span>
          {activeTab === "customers" && (
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ backgroundColor: color.primary.accent }}
            />
          )}
        </button>
      </div>

      {/* Filters - Customers tab */}
      {activeTab === "customers" && (
        <div className="my-5">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search */}
            <div className="flex-1 min-w-0">
              <SearchInput
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
            </div>

            {/* VIP List Filter */}
            <div className="w-full sm:w-48 flex-shrink-0">
              <HeadlessSelect
                value={filterList}
                onChange={setFilterList}
                options={[
                  { value: "all", label: "All VIP Lists" },
                  ...vipLists.map((list) => ({
                    value: list.id.toString(),
                    label: list.name,
                  })),
                ]}
                placeholder="Filter by VIP List"
              />
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-40 flex-shrink-0">
              <HeadlessSelect
                value={filterStatus}
                onChange={setFilterStatus}
                options={[
                  { value: "all", label: "All Status" },
                  { value: "pending", label: "Pending" },
                  { value: "processing", label: "Processing" },
                  { value: "completed", label: "Completed" },
                  { value: "failed", label: "Failed" },
                ]}
                placeholder="Filter by Status"
              />
            </div>
          </div>
        </div>
      )}

      {/* Filters - VIP Lists tab */}
      {activeTab === "lists" && (
        <div className="my-5">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search */}
            <div className="flex-1 min-w-0">
              <SearchInput
                placeholder="Search by list name or description..."
                value={searchTermLists}
                onChange={setSearchTermLists}
              />
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-40 flex-shrink-0">
              <HeadlessSelect
                value={filterStatusLists}
                onChange={setFilterStatusLists}
                options={[
                  { value: "all", label: "All Status" },
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
                placeholder="Filter by Status"
              />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`${tw.rounded} overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : activeTab === "customers" ? (
          /* Customers Table */
          filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className={`text-base font-medium ${tw.textPrimary} mb-0`}>
                {vipLists.length === 0
                  ? "No VIP lists available. Create a VIP list first to add members"
                  : searchTerm
                    ? "No VIP members match your search"
                    : "No VIP members available"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table<VIPCustomerTableRow>
                columns={customerColumns}
                data={filteredCustomers.map((customer) => ({
                  id: customer.id,
                  name: customer.customer_name || "Unknown",
                  email: customer.customer_email || "-",
                  vipList: customer.vip_list_name || "Default",
                  status: customer.status,
                  addedDate: customer.added_at,
                  _full: customer,
                }))}
                totalItems={filteredCustomers.length}
                currentPage={customerCurrentPage}
                pageSize={customerPageSize}
                isLoading={loading}
                onPageChange={customerHandlePageChange}
                onSort={customerHandleSort}
                sortConfigs={customerSortConfigs}
                onHideColumn={toggleCustomerColumn}
                onManageColumnsClick={() => setShowColumnPicker("customers")}
                style={{
                  headerBackground: color.surface.tableHeader,
                  headerTextColor: color.surface.tableHeaderText,
                  rowBackground: color.surface.tablebodybg,
                  rowSpacing: "0 8px",
                }}
              />
            </div>
          )
        ) : /* VIP Lists Table */
        filteredLists.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className={`text-base font-medium ${tw.textPrimary} mb-0`}>
              {searchTermLists
                ? "No VIP lists match your search"
                : "No VIP lists available"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table<VIPListTableRow>
              columns={vipListColumns}
              data={filteredLists.map((list) => ({
                id: list.id,
                name: list.name,
                description: list.description || "No description",
                members: list.member_count ?? 0,
                rowsImported: list.rows_imported ?? 0,
                rowsFailed: list.rows_failed ?? 0,
                status: list.processing_status || list.status || "-",
                _full: list,
              }))}
              totalItems={filteredLists.length}
              currentPage={vipListCurrentPage}
              pageSize={vipListPageSize}
              isLoading={loading}
              onPageChange={vipListHandlePageChange}
              onSort={vipListHandleSort}
              sortConfigs={vipListSortConfigs}
              onHideColumn={toggleVipListColumn}
              onManageColumnsClick={() => setShowColumnPicker("lists")}
              style={{
                headerBackground: color.surface.tableHeader,
                headerTextColor: color.surface.tableHeaderText,
                rowBackground: color.surface.tablebodybg,
                rowSpacing: "0 8px",
              }}
            />
          </div>
        )}
      </div>

      {/* Create VIP List Modal */}
      <CreateVIPListModal
        isOpen={isCreateListModalOpen}
        onClose={() => {
          setIsCreateListModalOpen(false);
          setEditingList(null);
        }}
        onSubmit={handleSaveVIPList}
        isLoading={isCreatingList}
        mode={editingList ? "edit" : "create"}
        initialData={
          editingList
            ? {
                name: editingList.name,
                description: editingList.description,
              }
            : null
        }
      />

      {/* Add VIP Members Modal */}
      <AddVIPMembersModal
        isOpen={isAddMembersModalOpen}
        onClose={() => setIsAddMembersModalOpen(false)}
        vipLists={vipLists}
        onAdd={handleAddMembers}
        isLoading={isAddingMembers}
      />

      <DeleteConfirmModal
        isOpen={!!listToDelete}
        onClose={() => setListToDelete(null)}
        onConfirm={confirmDeleteVIPList}
        title="Delete VIP List"
        description="Are you sure you want to delete this VIP list? This action cannot be undone."
        itemName={listToDelete?.name || ""}
        isLoading={isDeletingList}
        confirmText="Delete List"
        cancelText="Cancel"
      />

      <DeleteConfirmModal
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={confirmRemoveMember}
        title="Remove VIP Member"
        description="Are you sure you want to remove this customer from the VIP list? The member will be marked inactive."
        itemName={memberToRemove?.customer_name || "Selected customer"}
        isLoading={isRemovingMember}
        confirmText="Remove Member"
        cancelText="Cancel"
      />

      {/* VIP List Members Modal */}
      {isListMembersModalOpen && selectedListForMembers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div>
                <h2 className={`text-xl font-bold ${tw.textPrimary}`}>
                  {selectedListForMembers.name}
                </h2>
                <p className={`text-sm ${tw.textSecondary} mt-1`}>
                  {listMembers.length} member
                  {listMembers.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsListMembersModalOpen(false);
                  setSelectedListForMembers(null);
                  setListMembers([]);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {isLoadingListMembers ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : listMembers.length === 0 ? (
                <div className="text-center py-8">
                  <p className={tw.textSecondary}>No customers in this list</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-3 text-left">
                          <span
                            className={`text-sm font-semibold ${tw.textPrimary}`}
                          >
                            Name
                          </span>
                        </th>
                        <th className="px-6 py-3 text-left">
                          <span
                            className={`text-sm font-semibold ${tw.textPrimary}`}
                          >
                            Email
                          </span>
                        </th>
                        <th className="px-6 py-3 text-left">
                          <span
                            className={`text-sm font-semibold ${tw.textPrimary}`}
                          >
                            Phone
                          </span>
                        </th>
                        <th className="px-6 py-3 text-left">
                          <span
                            className={`text-sm font-semibold ${tw.textPrimary}`}
                          >
                            Status
                          </span>
                        </th>
                        <th className="px-6 py-3 text-center">
                          <span
                            className={`text-sm font-semibold ${tw.textPrimary}`}
                          >
                            Action
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {listMembers.map((customer) => (
                        <tr
                          key={customer.id}
                          className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-900">
                              {customer.customer_name || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-700">
                              {customer.customer_email || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-700">
                              {customer.customer_phone || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className="text-sm font-medium"
                              style={{ color: color.text.primary }}
                            >
                              {customer.status === "active"
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewCustomerDetail(customer)}
                                className={`p-0 icon-edit ${tw.rounded} inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 transition-colors  hover:text-gray-700`}
                                title="View customer details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setMemberToRemove(customer)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-red-50 transition-colors text-red-600 hover:text-red-700"
                                title="Remove from VIP list"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showColumnPicker === "customers" && (
        <ColumnPickerModal
          isOpen={true}
          columns={customerColumns.map((col) => ({ id: col.id, label: col.label, visible: col.visible }))}
          onClose={() => setShowColumnPicker(null)}
          onToggleColumn={toggleCustomerColumn}
          onReorderColumns={(reorderedCols) => {
            const updatedColumns = customerColumns.map((col) => {
              const reordered = reorderedCols.find((c) => c.id === col.id);
              return reordered ? { ...col, visible: reordered.visible } : col;
            });
            reorderCustomerColumns(updatedColumns);
          }}
          onResetToDefaults={resetCustomerDefaults}
        />
      )}

      {showColumnPicker === "lists" && (
        <ColumnPickerModal
          isOpen={true}
          columns={vipListColumns.map((col) => ({ id: col.id, label: col.label, visible: col.visible }))}
          onClose={() => setShowColumnPicker(null)}
          onToggleColumn={toggleVipListColumn}
          onReorderColumns={(reorderedCols) => {
            const updatedColumns = vipListColumns.map((col) => {
              const reordered = reorderedCols.find((c) => c.id === col.id);
              return reordered ? { ...col, visible: reordered.visible } : col;
            });
            reorderVipListColumns(updatedColumns);
          }}
          onResetToDefaults={resetVipListDefaults}
        />
      )}
    </div>
  );
}
