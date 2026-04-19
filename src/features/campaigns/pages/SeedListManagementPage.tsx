import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Mail, Trash2, Eye, X } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import SearchInput from "../../../shared/components/ui/SearchInput";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { getLineOfBusinessConfig } from "../../configurations/configs/configurationPageConfigs";
import { userService } from "../../users/services/userService";
import { seedListService } from "../../../shared/services/seedListService";
import CreateTestListModal from "../components/CreateTestListModal";

// Types
export interface SeedListRecipient {
  id: number;
  customer_id: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  department_id?: number;
  department_name?: string;
  line_of_business_id?: number;
  line_of_business_name?: string;
  seed_list_id?: number;
  list_id?: string;
  list_name?: string;
  status: "active" | "inactive";
  added_at: string;
  added_by?: number;
  added_by_name?: string;
  removed_at?: string;
  removed_by?: number;
  removed_by_name?: string;
  created_at?: string;
}

// Dummy data
export const DUMMY_RECIPIENTS: SeedListRecipient[] = [
  {
    id: 1,
    customer_id: 301,
    customer_name: "Marketing Staff 1",
    customer_email: "marketing.staff1@effortel.com",
    customer_phone: "+254712345678",
    department_id: 1,
    department_name: "Marketing",
    line_of_business_id: 1,
    line_of_business_name: "Retail Banking",
    list_id: "list_1",
    list_name: "Marketing Team",
    status: "active",
    added_at: "2025-01-10T09:00:00Z",
    added_by: 1,
    added_by_name: "Admin User",
  },
  {
    id: 2,
    customer_id: 302,
    customer_name: "Sales Staff 1",
    customer_email: "sales.staff1@effortel.com",
    customer_phone: "+254723456789",
    department_id: 2,
    department_name: "Sales",
    line_of_business_id: 2,
    line_of_business_name: "Corporate Banking",
    list_id: "list_2",
    list_name: "Sales Staff",
    status: "active",
    added_at: "2025-01-12T11:30:00Z",
    added_by: 2,
    added_by_name: "Sales Manager",
  },
  {
    id: 3,
    customer_id: 303,
    customer_name: "Support Staff 1",
    customer_email: "support.staff1@effortel.com",
    customer_phone: "+254734567890",
    department_id: 3,
    department_name: "Customer Support",
    line_of_business_id: 1,
    line_of_business_name: "Retail Banking",
    list_id: "list_3",
    list_name: "Support Team",
    status: "active",
    added_at: "2025-01-15T14:20:00Z",
    added_by: 3,
    added_by_name: "Support Manager",
  },
  {
    id: 4,
    customer_id: 304,
    customer_name: "Marketing Staff 2",
    customer_email: "marketing.staff2@effortel.com",
    customer_phone: "+254745678901",
    department_id: 1,
    department_name: "Marketing",
    line_of_business_id: 2,
    line_of_business_name: "Corporate Banking",
    list_id: "list_1",
    list_name: "Marketing Team",
    status: "inactive",
    added_at: "2025-01-08T10:15:00Z",
    added_by: 1,
    added_by_name: "Admin User",
    removed_at: "2025-01-28T16:00:00Z",
    removed_by: 1,
    removed_by_name: "Admin User",
  },
  {
    id: 5,
    customer_id: 305,
    customer_name: "Executive Staff 1",
    customer_email: "exec.staff1@effortel.com",
    customer_phone: "+254756789012",
    department_id: 4,
    department_name: "Executive Office",
    line_of_business_id: 1,
    line_of_business_name: "Retail Banking",
    list_id: "list_5",
    list_name: "Executive Team",
    status: "active",
    added_at: "2025-01-20T08:45:00Z",
    added_by: 1,
    added_by_name: "Admin User",
  },
];

interface AddRecipientForm {
  mode: "existing_user" | "external_recipient";
  user_id: string;
  phone_number: string;
  line_of_business_id: string;
  list_id: string;
  external_name?: string;
  external_email?: string;
  external_phone?: string;
}

interface FormErrors {
  user_id?: string;
  phone_number?: string;
  line_of_business_id?: string;
  list_id?: string;
  external_name?: string;
  external_email?: string;
  external_phone?: string;
}

interface SystemUser {
  id: number;
  first_name: string;
  last_name: string;
  email_address: string;
  phone_number?: string;
  department?: string;
  display_name?: string;
}

export default function SeedListManagementPage() {
  const navigate = useNavigate();
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();
  const [recipients, setRecipients] = useState<SeedListRecipient[]>([]);
  const [seedLists, setSeedLists] = useState<Array<{ id: string | number; name: string; description?: string; customer_count?: number }>>([]);
  const linesOfBusiness = getLineOfBusinessConfig(() => "").initialData;

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterSeedList, setFilterSeedList] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"recipients" | "lists">("recipients");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<AddRecipientForm>({
    mode: "existing_user",
    user_id: "",
    phone_number: "",
    line_of_business_id: "",
    list_id: "",
    external_name: "",
    external_email: "",
    external_phone: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Delete confirmation state
  const [recipientToRemove, setRecipientToRemove] = useState<SeedListRecipient | null>(null);
  const [isRemovingRecipient, setIsRemovingRecipient] = useState(false);

  // List deletion state
  const [listToDelete, setListToDelete] = useState<{ id: string | number; name: string } | null>(null);
  const [isDeletingList, setIsDeletingList] = useState(false);

  // Test list modal state
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);
  const [isCreatingList, setIsCreatingList] = useState(false);

  // Members modal state
  const [selectedListForMembers, setSelectedListForMembers] = useState<{ id: string | number; name: string } | null>(null);
  const [listMembers, setListMembers] = useState<SeedListRecipient[]>([]);
  const [isLoadingListMembers, setIsLoadingListMembers] = useState(false);
  const [memberToRemoveFromList, setMemberToRemoveFromList] = useState<SeedListRecipient | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  // Load system users and seed lists on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        await Promise.all([loadUsers(), loadSeedLists()]);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const loadMembers = async (lists: typeof seedLists) => {
    try {
      const allMembers: SeedListRecipient[] = [];

      if (!lists || !Array.isArray(lists)) {
        setRecipients([]);
        return;
      }

      for (const list of lists) {
        if (!list || !list.id) {
          continue;
        }

        try {
          const numericId = typeof list.id === "string" ? parseInt(list.id) : list.id;
          if (isNaN(numericId)) {
            console.error(`Invalid list ID format for list:`, list);
            continue;
          }

          const members = await seedListService.getMembers(numericId);
          if (Array.isArray(members)) {
            allMembers.push(...members);
          }
        } catch (error) {
          console.error(`Failed to load members for list ${list.id}:`, error);
        }
      }

      setRecipients(allMembers);
    } catch (error) {
      console.error("Failed to load members:", error);
      showError("Failed to load members");
    }
  };

  // Load members when seed lists are available
  useEffect(() => {
    if (seedLists.length > 0) {
      loadMembers(seedLists);
    } else {
      setRecipients([]);
    }
  }, [seedLists]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await userService.getUsers({ limit: 100, offset: 0 });
      const users = response.data || [];
      const mappedUsers = Array.isArray(users)
        ? users.map((user: any) => ({
            id: user.id,
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            email_address: user.email_address || "",
            phone_number: user.phone_number || undefined,
            department: user.department || undefined,
            display_name: user.display_name,
          }))
        : [];
      setSystemUsers(mappedUsers);
    } catch (error) {
      console.error("Failed to load system users:", error);
      setSystemUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadSeedLists = async () => {
    try {
      setLoading(true);
      const lists = await seedListService.getAll();
      setSeedLists(
        Array.isArray(lists)
          ? lists.map((list) => ({
              id: list.id,
              name: list.name,
              description: list.description,
              customer_count: (list as any).customer_count || 0,
            }))
          : [],
      );
    } catch (error) {
      console.error("Failed to load seed lists:", error);
      showError("Failed to load seed lists");
      setSeedLists([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredRecipients = recipients.filter((recipient) => {
    const matchesSearch =
      recipient.customer_name
        ?.toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase()) ||
      recipient.customer_email
        ?.toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase()) ||
      recipient.customer_phone
        ?.toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase());

    const matchesList =
      filterSeedList === "all" ||
      recipient.seed_list_id?.toString() === filterSeedList;
    const matchesStatus =
      filterStatus === "all" || recipient.status === filterStatus;

    return matchesSearch && matchesList && matchesStatus;
  });

  const handleRemoveRecipient = (recipient: SeedListRecipient) => {
    setRecipientToRemove(recipient);
  };

  const handleConfirmRemove = useCallback(async () => {
    if (!recipientToRemove) return;

    setIsRemovingRecipient(true);
    try {
      const listId = recipientToRemove.seed_list_id || 0;
      if (!listId) {
        showError("Invalid seed list ID");
        return;
      }

      await seedListService.removeMember(listId, recipientToRemove.id);

      setRecipients(recipients.filter((r) => r.id !== recipientToRemove.id));
      showToast("Recipient removed successfully");
    } catch (error) {
      console.error("Failed to remove recipient:", error);
      showError("Failed to remove recipient");
    } finally {
      setIsRemovingRecipient(false);
      setRecipientToRemove(null);
    }
  }, [recipientToRemove, recipients, showToast, showError]);

  const handleCancelRemove = () => {
    setRecipientToRemove(null);
  };

  const loadListMembers = async (listId: string | number) => {
    if (!listId) {
      showError("Invalid list ID");
      return;
    }

    try {
      setIsLoadingListMembers(true);
      const numericId = typeof listId === "string" ? parseInt(listId) : listId;

      if (isNaN(numericId)) {
        showError("Invalid list ID format");
        setListMembers([]);
        return;
      }

      const members = await seedListService.getMembers(numericId);
      if (Array.isArray(members)) {
        setListMembers(members);
      } else {
        setListMembers([]);
      }
    } catch (error) {
      console.error("Failed to load list members:", error);
      showError("Failed to load list members");
      setListMembers([]);
    } finally {
      setIsLoadingListMembers(false);
    }
  };

  const handleOpenListMembersModal = async (list: { id: string | number; name: string }) => {
    setSelectedListForMembers(list);
    await loadListMembers(list.id);
  };

  const handleCloseListMembersModal = () => {
    setSelectedListForMembers(null);
    setListMembers([]);
    setMemberToRemoveFromList(null);
  };

  const handleRemoveMemberFromList = (member: SeedListRecipient) => {
    setMemberToRemoveFromList(member);
  };

  const handleConfirmRemoveMemberFromList = useCallback(async () => {
    if (!memberToRemoveFromList) return;
    if (!selectedListForMembers) return;
    if (!memberToRemoveFromList.id) {
      showError("Invalid member ID");
      return;
    }
    if (!selectedListForMembers.id) {
      showError("Invalid list ID");
      return;
    }

    setIsRemovingMember(true);
    try {
      const listId = typeof selectedListForMembers.id === "string"
        ? parseInt(selectedListForMembers.id)
        : selectedListForMembers.id;

      if (isNaN(listId)) {
        showError("Invalid list ID");
        return;
      }

      await seedListService.removeMember(listId, memberToRemoveFromList.id);

      setListMembers(listMembers.filter((m) => m && m.id !== memberToRemoveFromList.id));
      showToast("Member removed successfully");
    } catch (error) {
      console.error("Failed to remove member:", error);
      showError("Failed to remove member");
    } finally {
      setIsRemovingMember(false);
      setMemberToRemoveFromList(null);
    }
  }, [memberToRemoveFromList, selectedListForMembers, listMembers, showToast, showError]);

  const handleSaveTestList = async (data: { name: string; description?: string }) => {
    setIsCreatingList(true);
    try {
      const newList = await seedListService.create({
        name: data.name,
        description: data.description,
      });
      setSeedLists([
        ...seedLists,
        {
          id: newList.id,
          name: newList.name,
          description: newList.description,
        },
      ]);
      showToast("Test list created successfully");
      setIsCreateListModalOpen(false);
    } catch (error) {
      console.error("Failed to create test list:", error);
      showError("Failed to create test list");
    } finally {
      setIsCreatingList(false);
    }
  };

  const handleDeleteList = (list: { id: string | number; name: string }) => {
    setListToDelete(list);
  };

  const confirmDeleteList = async () => {
    if (!listToDelete) return;
    if (!listToDelete.id) {
      showError("Invalid list ID");
      return;
    }

    setIsDeletingList(true);
    try {
      const numericId = typeof listToDelete.id === "string" ? parseInt(listToDelete.id) : listToDelete.id;

      if (isNaN(numericId)) {
        showError("Invalid list ID format");
        return;
      }

      await seedListService.delete(numericId);

      if (seedLists && Array.isArray(seedLists)) {
        setSeedLists(seedLists.filter((l) => l && l.id !== listToDelete.id));
      }

      if (recipients && Array.isArray(recipients)) {
        setRecipients(recipients.filter((r) => r && r.seed_list_id !== numericId));
      }

      showToast("Seed list deleted successfully");
    } catch (error) {
      console.error("Failed to delete seed list:", error);
      showError("Failed to delete seed list");
    } finally {
      setIsDeletingList(false);
      setListToDelete(null);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      mode: "existing_user",
      user_id: "",
      phone_number: "",
      line_of_business_id: "",
      list_id: "",
      external_name: "",
      external_email: "",
      external_phone: "",
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      mode: "existing_user",
      user_id: "",
      phone_number: "",
      line_of_business_id: "",
      list_id: "",
      external_name: "",
      external_email: "",
      external_phone: "",
    });
    setErrors({});
  };

  const handleAddRecipient = async () => {
    const newErrors: FormErrors = {};

    if (!formData.line_of_business_id) {
      newErrors.line_of_business_id = "Line of Business is required";
    }
    if (!formData.list_id) {
      newErrors.list_id = "Test List is required";
    }

    if (formData.mode === "existing_user") {
      if (!formData.user_id) {
        newErrors.user_id = "User is required";
      }
      if (!formData.phone_number) {
        newErrors.phone_number = "Phone is required";
      }
    } else {
      if (!formData.external_name) {
        newErrors.external_name = "Name is required";
      }
      if (!formData.external_email) {
        newErrors.external_email = "Email is required";
      }
      if (!formData.external_phone) {
        newErrors.external_phone = "Phone is required";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedList = seedLists.find((l) => l && l.id && l.id.toString() === formData.list_id);
    if (!selectedList) {
      showError("Invalid seed list selected");
      return;
    }

    try {
      setLoading(true);
      if (!selectedList.id) {
        showError("Invalid list ID");
        return;
      }

      const listId = typeof selectedList.id === "string" ? parseInt(selectedList.id) : selectedList.id;

      if (isNaN(listId)) {
        showError("Invalid list ID format");
        return;
      }

      let memberData: any;

      if (formData.mode === "existing_user") {
        const selectedUser = systemUsers.find((u) => u && u.id && u.id.toString() === formData.user_id);
        if (!selectedUser) {
          showError("Invalid user selected");
          return;
        }

        if (!selectedUser.id || !selectedUser.email_address) {
          showError("Invalid user data");
          return;
        }

        const firstName = selectedUser.first_name || "";
        const lastName = selectedUser.last_name || "";

        memberData = {
          seed_list_id: listId,
          customer_id: selectedUser.id,
          customer_name: `${firstName} ${lastName}`.trim(),
          customer_email: selectedUser.email_address,
          customer_phone: formData.phone_number,
          line_of_business_id: parseInt(formData.line_of_business_id),
        };
      } else {
        memberData = {
          seed_list_id: listId,
          customer_id: 0,
          customer_name: formData.external_name,
          customer_email: formData.external_email,
          customer_phone: formData.external_phone,
          line_of_business_id: parseInt(formData.line_of_business_id),
        };
      }

      const response = await seedListService.addMember(memberData);

      if (!response) {
        showError("Failed to process response");
        return;
      }

      let recipientId = response.data?.id;
      if (!recipientId) {
        const maxId = recipients && Array.isArray(recipients) && recipients.length > 0
          ? Math.max(...recipients.map((r) => r?.id || 0))
          : 0;
        recipientId = maxId + 1;
      }

      const lineOfBusiness = linesOfBusiness && Array.isArray(linesOfBusiness)
        ? linesOfBusiness.find(
            (l) => l && l.id && l.id.toString() === formData.line_of_business_id
          )
        : undefined;

      const newRecipient: SeedListRecipient = {
        id: recipientId || 0,
        seed_list_id: listId,
        customer_id: memberData.customer_id || 0,
        customer_name: memberData.customer_name || "",
        customer_email: memberData.customer_email || "",
        customer_phone: memberData.customer_phone || "",
        department_id: undefined,
        department_name: undefined,
        line_of_business_id: parseInt(formData.line_of_business_id) || 0,
        line_of_business_name: lineOfBusiness?.name,
        status: "active",
        added_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      setRecipients([...recipients, newRecipient]);
      showToast("Recipient added successfully");
      handleCloseModal();
    } catch (error) {
      console.error("Failed to add recipient:", error);
      showError("Failed to add recipient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold ${tw.textPrimary}`}>
            {t.seedListManagement.title}
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            {t.seedListManagement.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-3 w-auto">
          <button
            onClick={() => {
              if (activeTab === "recipients") {
                handleOpenModal();
              } else {
                setIsCreateListModalOpen(true);
              }
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 ${tw.rounded} font-semibold text-sm text-white w-auto`}
            style={{ backgroundColor: color.primary.action }}
          >
            <Plus className="w-4 h-4" />
            {activeTab === "recipients" ? "Add Recipient" : "Create Seed List"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <style>{`
        @media (max-width: 640px) {
          .seed-list-tabs::-webkit-scrollbar {
            display: none;
          }
          .seed-list-tabs {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        }
      `}</style>
      <div className="seed-list-tabs flex gap-1 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab("recipients")}
          className={`px-3 sm:px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2 relative flex-shrink-0 ${
            activeTab === "recipients"
              ? "text-black"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Mail className="w-4 h-4 flex-shrink-0" />
          <span className="whitespace-nowrap">Seed List Recipients</span>
          <span
            className="px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
            style={{
              backgroundColor:
                activeTab === "recipients"
                  ? `${color.primary.accent}15`
                  : `${color.text.muted}15`,
              color:
                activeTab === "recipients"
                  ? color.primary.accent
                  : color.text.muted,
            }}
          >
            {recipients.length}
          </span>
          {activeTab === "recipients" && (
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
          <Mail className="w-4 h-4 flex-shrink-0" />
          <span className="whitespace-nowrap">Seed Lists</span>
          <span
            className="px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
            style={{
              backgroundColor:
                activeTab === "lists"
                  ? `${color.primary.accent}15`
                  : `${color.text.muted}15`,
              color: activeTab === "lists" ? color.primary.accent : color.text.muted,
            }}
          >
            {seedLists.length}
          </span>
          {activeTab === "lists" && (
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ backgroundColor: color.primary.accent }}
            />
          )}
        </button>
      </div>

      {/* Recipients Tab Content */}
      {activeTab === "recipients" && (
        <>
      <div className="my-5">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Search */}
          <div className="flex-1 min-w-0">
            <SearchInput
              placeholder={t.seedListManagement.searchPlaceholder}
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>

          {/* Seed List Filter */}
          <div className="w-full sm:w-48 flex-shrink-0">
            <HeadlessSelect
              value={filterSeedList}
              onChange={(value) => setFilterSeedList(value.toString())}
              options={[
                { value: "all", label: "All Seed Lists" },
                ...seedLists.map((list) => ({
                  value: list.id.toString(),
                  label: list.name,
                })),
              ]}
              placeholder="Filter by Seed List"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-40 flex-shrink-0">
            <HeadlessSelect
              value={filterStatus}
              onChange={(value) => setFilterStatus(value.toString())}
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

      {/* Table */}
      <div className={`${tw.rounded} border border-gray-200 overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredRecipients.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
              No seed list recipients found
            </h3>
            <p className={`text-sm ${tw.textMuted} mb-6`}>
              {searchTerm
                ? "Try adjusting your search terms"
                : "No seed list recipients available"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full min-w-[1400px]"
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
                    Seed List
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
                {filteredRecipients && Array.isArray(filteredRecipients) ? (
                  filteredRecipients.map((recipient) => {
                    if (!recipient || !recipient.id) return null;

                    return (
                  <tr key={recipient.id} className="transition-colors">
                    <td
                      className="px-6 py-4"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopLeftRadius: "0.375rem",
                        borderBottomLeftRadius: "0.375rem",
                      }}
                    >
                      <div className={`${tw.tableFirstColumn} ${tw.textPrimary} text-sm`}>
                        {recipient.customer_name || "Unknown"}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className="text-sm text-black">
                        {recipient.customer_email || "-"}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className="text-sm text-black">
                        {recipient.list_name || (
                          seedLists && Array.isArray(seedLists)
                            ? seedLists.find((l) => l && l.id && l.id === recipient.seed_list_id)?.name
                            : undefined
                        ) || "-"}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className="text-sm text-black">
                        {recipient.status}
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
                      <button
                        onClick={() => handleRemoveRecipient(recipient)}
                        className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-colors`}
                        title={
                          recipient.status === "active"
                            ? "Remove from Seed List"
                            : "Delete from Seed List"
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                    );
                  })
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}

      {/* Test Lists Tab Content */}
      {activeTab === "lists" && (
        <div className={`${tw.rounded} border border-gray-200 overflow-hidden`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : seedLists.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
                No seed lists created yet
              </h3>
              <p className={`text-sm ${tw.textMuted} mb-6`}>
                Click "Create Seed List" to organize recipients into groups
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
                      Recipients
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
                  {seedLists && Array.isArray(seedLists) ? (
                    seedLists.map((list) => {
                      if (!list || !list.id) return null;

                      const recipientCount = recipients && Array.isArray(recipients)
                        ? recipients.filter((r) => r && r.seed_list_id === list.id).length
                        : 0;
                    return (
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
                          className="px-6 py-4 cursor-pointer"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                          onClick={() => handleOpenListMembersModal({ id: list.id, name: list.name })}
                        >
                          <button
                            className="text-sm font-medium hover:underline"
                            style={{ color: color.primary.accent }}
                          >
                            {list.customer_count ?? recipientCount}
                          </button>
                        </td>
                        <td
                          className="px-6 py-4 text-center"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                            borderTopRightRadius: "0.375rem",
                            borderBottomRightRadius: "0.375rem",
                          }}
                        >
                          <button
                            onClick={() =>
                              handleDeleteList({
                                id: list.id,
                                name: list.name,
                              })
                            }
                            className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-colors`}
                            title="Delete test list"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                    })
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Recipient/List Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${tw.rounded} bg-white shadow-xl max-w-md w-full mx-4`}>
            <div className="p-6">
              <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
                Add Seed List Recipient
              </h2>

              {/* Mode Toggle */}
              <div className="flex gap-1 mb-6">
                <button
                  onClick={() => {
                    setFormData({ ...formData, mode: "existing_user" });
                    setErrors({});
                  }}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                    formData.mode === "existing_user"
                      ? "text-black"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Existing User
                  {formData.mode === "existing_user" && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ backgroundColor: color.primary.accent }}
                    />
                  )}
                </button>
                <button
                  onClick={() => {
                    setFormData({ ...formData, mode: "external_recipient" });
                    setErrors({});
                  }}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                    formData.mode === "external_recipient"
                      ? "text-black"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  External Recipient
                  {formData.mode === "external_recipient" && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ backgroundColor: color.primary.accent }}
                    />
                  )}
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Existing User Mode */}
                {formData.mode === "existing_user" && (
                  <>
                    {/* User Selection */}
                    <div>
                      <label className={`block text-sm font-medium ${tw.textPrimary} mb-1`}>
                        Select User *
                      </label>
                      <div className={errors.user_id ? "border border-red-500 rounded" : ""}>
                        <HeadlessSelect
                          value={formData.user_id}
                          onChange={(value) => {
                            setFormData({ ...formData, user_id: value.toString() });
                            if (errors.user_id) {
                              setErrors({ ...errors, user_id: undefined });
                            }
                          }}
                          options={[
                            { value: "", label: "Select a user" },
                            ...systemUsers.map((user) => ({
                              value: user.id.toString(),
                              label: `${user.first_name} ${user.last_name}${user.department ? ` (${user.department})` : ""}`,
                            })),
                          ]}
                          placeholder="Select user..."
                          disabled={loadingUsers}
                        />
                      </div>
                      {errors.user_id && (
                        <p className="text-xs text-red-500 mt-1">{errors.user_id}</p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className={`block text-sm font-medium ${tw.textPrimary} mb-1`}>
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone_number}
                        onChange={(e) => {
                          setFormData({ ...formData, phone_number: e.target.value });
                          if (errors.phone_number) {
                            setErrors({ ...errors, phone_number: undefined });
                          }
                        }}
                        placeholder="Phone number"
                        className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.phone_number ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.phone_number && (
                        <p className="text-xs text-red-500 mt-1">{errors.phone_number}</p>
                      )}
                    </div>
                  </>
                )}

                {/* External Recipient Mode */}
                {formData.mode === "external_recipient" && (
                  <>
                    {/* Name */}
                    <div>
                      <label className={`block text-sm font-medium ${tw.textPrimary} mb-1`}>
                        Name *
                      </label>
                      <input
                        type="text"
                        value={formData.external_name}
                        onChange={(e) => {
                          setFormData({ ...formData, external_name: e.target.value });
                          if (errors.external_name) {
                            setErrors({ ...errors, external_name: undefined });
                          }
                        }}
                        placeholder="Full name"
                        className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.external_name ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.external_name && (
                        <p className="text-xs text-red-500 mt-1">{errors.external_name}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className={`block text-sm font-medium ${tw.textPrimary} mb-1`}>
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.external_email}
                        onChange={(e) => {
                          setFormData({ ...formData, external_email: e.target.value });
                          if (errors.external_email) {
                            setErrors({ ...errors, external_email: undefined });
                          }
                        }}
                        placeholder="Email address"
                        className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.external_email ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.external_email && (
                        <p className="text-xs text-red-500 mt-1">{errors.external_email}</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className={`block text-sm font-medium ${tw.textPrimary} mb-1`}>
                        Phone *
                      </label>
                      <input
                        type="tel"
                        value={formData.external_phone}
                        onChange={(e) => {
                          setFormData({ ...formData, external_phone: e.target.value });
                          if (errors.external_phone) {
                            setErrors({ ...errors, external_phone: undefined });
                          }
                        }}
                        placeholder="Phone number"
                        className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.external_phone ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.external_phone && (
                        <p className="text-xs text-red-500 mt-1">{errors.external_phone}</p>
                      )}
                    </div>
                  </>
                )}

                {/* Test List Selection */}
                <div>
                  <label className={`block text-sm font-medium ${tw.textPrimary} mb-1`}>
                    Select Seed List *
                  </label>
                  <div className={errors.list_id ? "border border-red-500 rounded" : ""}>
                    <HeadlessSelect
                      value={formData.list_id}
                      onChange={(value) => {
                        setFormData({ ...formData, list_id: value.toString() });
                        if (errors.list_id) {
                          setErrors({ ...errors, list_id: undefined });
                        }
                      }}
                      options={[
                        { value: "", label: "Select a seed list" },
                        ...seedLists.map((list) => ({
                          value: list.id.toString(),
                          label: list.name,
                        })),
                      ]}
                      placeholder="Select seed list..."
                      zIndex={zIndex.popover}
                    />
                  </div>
                  {errors.list_id && (
                    <p className="text-xs text-red-500 mt-1">{errors.list_id}</p>
                  )}
                </div>

                {/* Line of Business */}
                <div>
                  <label className={`block text-sm font-medium ${tw.textPrimary} mb-1`}>
                    Line of Business *
                  </label>
                  <div className={errors.line_of_business_id ? "border border-red-500 rounded" : ""}>
                    <HeadlessSelect
                      value={formData.line_of_business_id}
                      onChange={(value) => {
                        setFormData({ ...formData, line_of_business_id: value.toString() });
                        if (errors.line_of_business_id) {
                          setErrors({ ...errors, line_of_business_id: undefined });
                        }
                      }}
                      options={[
                        { value: "", label: "Select Line of Business" },
                        ...linesOfBusiness.map((lob: any) => ({
                          value: lob.id.toString(),
                          label: lob.name,
                        })),
                      ]}
                      placeholder="Select Line of Business"
                      zIndex={zIndex.popover}
                    />
                  </div>
                  {errors.line_of_business_id && (
                    <p className="text-xs text-red-500 mt-1">{errors.line_of_business_id}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={handleCloseModal}
                  className={`px-4 py-2 border border-gray-300 text-gray-700 font-medium ${tw.rounded} transition-colors`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRecipient}
                  disabled={
                    (formData.mode === "existing_user"
                      ? !formData.user_id || !formData.phone_number || !formData.line_of_business_id || !formData.list_id
                      : !formData.external_name || !formData.external_email || !formData.external_phone || !formData.line_of_business_id || !formData.list_id)
                  }
                  className={`px-4 py-2 text-white font-medium ${tw.rounded} transition-colors ${
                    (formData.mode === "existing_user"
                      ? !formData.user_id || !formData.phone_number || !formData.line_of_business_id || !formData.list_id
                      : !formData.external_name || !formData.external_email || !formData.external_phone || !formData.line_of_business_id || !formData.list_id)
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:opacity-90"
                  }`}
                  style={{ backgroundColor: color.primary.action }}
                >
                  Add Recipient
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {recipientToRemove && (
        <DeleteConfirmModal
          isOpen={!!recipientToRemove}
          title="Remove Seed List Recipient"
          description="Are you sure you want to remove this recipient from the seed list? This action cannot be undone."
          itemName={recipientToRemove.customer_name || "this recipient"}
          onConfirm={handleConfirmRemove}
          onClose={handleCancelRemove}
          isLoading={isRemovingRecipient}
          confirmText="Remove"
          cancelText="Cancel"
        />
      )}

      {/* Delete List Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!listToDelete}
        title="Delete Seed List"
        description="Are you sure you want to delete this seed list and all its recipients? This action cannot be undone."
        itemName={listToDelete?.name || "this list"}
        onConfirm={confirmDeleteList}
        onClose={() => setListToDelete(null)}
        isLoading={isDeletingList}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Create Test List Modal */}
      <CreateTestListModal
        isOpen={isCreateListModalOpen}
        onClose={() => setIsCreateListModalOpen(false)}
        onSubmit={handleSaveTestList}
        isLoading={isCreatingList}
        mode="create"
      />

      {/* List Members Modal */}
      {selectedListForMembers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${tw.rounded} bg-white shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col`}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-semibold ${tw.textPrimary}`}>
                  {selectedListForMembers.name} - Members
                </h2>
                <button
                  onClick={handleCloseListMembersModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingListMembers ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : listMembers.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className={`text-sm ${tw.textMuted}`}>No members in this list</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          Phone
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {listMembers && Array.isArray(listMembers) ? (
                        listMembers.map((member) => {
                          if (!member || !member.id) return null;

                          return (
                            <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {member.customer_name || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {member.customer_email || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {member.customer_phone || "-"}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      navigate(`/dashboard/customers/details/${member.customer_id}`);
                                    }}
                                    className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                    title="View customer details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveMemberFromList(member)}
                                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                    title="Remove member"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : null}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Remove Member from List Confirmation Modal */}
      {memberToRemoveFromList && (
        <DeleteConfirmModal
          isOpen={!!memberToRemoveFromList}
          title="Remove Member"
          description="Are you sure you want to remove this member from the seed list?"
          itemName={memberToRemoveFromList.customer_name || "this member"}
          onConfirm={handleConfirmRemoveMemberFromList}
          onClose={() => setMemberToRemoveFromList(null)}
          isLoading={isRemovingMember}
          confirmText="Remove"
          cancelText="Cancel"
        />
      )}
    </div>
  );
}
