import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Star, Users, Trash2 } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import DateFormatter from "../../../shared/components/DateFormatter";
import CreateVIPListModal from "../components/CreateVIPListModal";
import AddVIPMembersModal from "../components/AddVIPMembersModal";
import { vipListService } from "../../../shared/services/vipListService";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";

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
  customer_count?: number | string;
  rows_imported?: number;
  rows_failed?: number;
  processing_status?: "pending" | "processing" | "completed" | "failed";
  status?: string;
  created_at: string;
}

export default function VIPListManagementPage() {
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();
  const [vipCustomers, setVipCustomers] = useState<VIPCustomer[]>([]);
  const [vipLists, setVipLists] = useState<VIPList[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermLists, setSearchTermLists] = useState("");
  const [filterList, setFilterList] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterStatusLists, setFilterStatusLists] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"customers" | "lists">(
    "customers",
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
    } catch (error) {
      console.error("Failed to fetch VIP lists:", error);
      showError("Failed to fetch VIP lists");
      setVipLists([]);
    } finally {
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
      showError("Failed to fetch VIP members");
      setVipCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [vipLists, showError]);

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
      await vipListService.removeMember(memberToRemove.id);
      showToast("Customer removed from VIP list successfully");

      setVipCustomers((prev) =>
        prev.map((customer) =>
          customer.id === memberToRemove.id
            ? {
                ...customer,
                status: "inactive",
                removed_at: new Date().toISOString(),
              }
            : customer,
        ),
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
      showError("Failed to add members");
      throw error;
    } finally {
      setIsAddingMembers(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold ${tw.textPrimary}`}>
            {t.vipListManagement.title}
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            {t.vipListManagement.subtitle}
          </p>
        </div>
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
              Create List
            </button>
          )}
        </div>
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
      </div>

      {/* Filters - Customers tab */}
      {activeTab === "customers" && (
        <div className="my-5">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-[#588157] text-sm`}
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
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by list name or description..."
                value={searchTermLists}
                onChange={(e) => setSearchTermLists(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-[#588157] text-sm`}
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
      <div className={`${tw.rounded} border border-gray-200 overflow-hidden`}>
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
              <table
                className="w-full min-w-[1000px]"
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
                      Name
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
                      VIP List
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
                        borderTopRightRadius: "0.375rem",
                      }}
                    >
                      Added Date
                    </th>
                    {/* Actions column intentionally hidden until member remove endpoint is finalized */}
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="transition-colors">
                      <td
                        className="px-6 py-4"
                        style={{
                          backgroundColor: color.surface.tablebodybg,
                          borderTopLeftRadius: "0.375rem",
                          borderBottomLeftRadius: "0.375rem",
                        }}
                      >
                        <div
                          className={`${tw.tableFirstColumn} ${tw.textPrimary} text-sm`}
                        >
                          {customer.customer_name || "Unknown"}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span className="text-sm text-black">
                          {customer.customer_email || "-"}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span className="text-sm text-black">
                          {customer.vip_list_name || "Default"}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span className="text-sm text-black">
                          {customer.status}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap"
                        style={{
                          backgroundColor: color.surface.tablebodybg,
                          borderTopRightRadius: "0.375rem",
                          borderBottomRightRadius: "0.375rem",
                        }}
                      >
                        <div className={`text-sm ${tw.textSecondary}`}>
                          <DateFormatter date={customer.added_at} />
                        </div>
                      </td>
                      {/* Actions cell intentionally hidden until member remove endpoint is finalized */}
                    </tr>
                  ))}
                </tbody>
              </table>
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
            <table
              className="w-full min-w-[800px]"
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
                    List Name
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Description
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Customers
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Rows Imported
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Rows Failed
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
                {filteredLists.map((list) => (
                  <tr key={list.id} className="transition-colors">
                    <td
                      className="px-6 py-4"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopLeftRadius: "0.375rem",
                        borderBottomLeftRadius: "0.375rem",
                      }}
                    >
                      <div
                        className={`${tw.tableFirstColumn} ${tw.textPrimary} text-sm`}
                      >
                        {list.name}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary} max-w-md`}>
                        {list.description || "No description"}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className="text-sm text-black">
                        {list.customer_count || 0} customers
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className="text-sm text-black">
                        {list.rows_imported ?? 0}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className="text-sm text-black">
                        {list.rows_failed ?? 0}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className="text-sm text-black">
                        {list.processing_status || list.status || "-"}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 text-center"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopRightRadius: "0.375rem",
                        borderBottomRightRadius: "0.375rem",
                      }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleDeleteVIPList(list)}
                          className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-colors`}
                          title="Delete VIP List"
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
    </div>
  );
}
