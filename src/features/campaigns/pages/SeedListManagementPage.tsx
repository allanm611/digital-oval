import { useState, useEffect, useCallback } from "react";
import { Plus, Mail, Trash2, Eye, X } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import SearchInput from "../../../shared/components/ui/SearchInput";
import DateFormatter from "../../../shared/components/DateFormatter";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { getDepartmentsConfig, getLineOfBusinessConfig } from "../../configurations/configs/configurationPageConfigs";
import { userService } from "../../users/services/userService";
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
  list_id?: string;
  list_name?: string;
  status: "active" | "inactive";
  added_at: string;
  added_by?: number;
  added_by_name?: string;
  removed_at?: string;
  removed_by?: number;
  removed_by_name?: string;
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
  user_id: string;
  line_of_business_id: string;
  list_id: string;
}

interface FormErrors {
  user_id?: string;
  line_of_business_id?: string;
  list_id?: string;
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
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();
  const [recipients, setRecipients] = useState<SeedListRecipient[]>(DUMMY_RECIPIENTS);
  const departments = getDepartmentsConfig(t).initialData;
  const linesOfBusiness = getLineOfBusinessConfig(t).initialData;
  
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterLoB, setFilterLoB] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"recipients" | "lists">("recipients");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<AddRecipientForm>({
    user_id: "",
    line_of_business_id: "",
    list_id: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Delete confirmation state
  const [recipientToRemove, setRecipientToRemove] = useState<SeedListRecipient | null>(null);
  const [isRemovingRecipient, setIsRemovingRecipient] = useState(false);
  
  // Test list modal state
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);
  const [testLists, setTestLists] = useState<Array<{ id: string; name: string; description: string }>>([
    {
      id: "list_1",
      name: "Marketing Team",
      description: "All marketing team members for testing campaign content",
    },
    {
      id: "list_2",
      name: "Sales Staff",
      description: "Sales department staff members for testing promotional content",
    },
    {
      id: "list_3",
      name: "Support Team",
      description: "Customer support team for testing communication templates",
    },
    {
      id: "list_4",
      name: "Management Group",
      description: "Management and leadership team for senior communications testing",
    },
    {
      id: "list_5",
      name: "Executive Team",
      description: "Executive and C-level staff for testing high-priority communications",
    },
  ]);

  // Load system users on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await userService.getUsers({ limit: 100, offset: 0 });
        const users = response.data || [];
        setSystemUsers(Array.isArray(users) ? users : []);
      } catch (error) {
        console.error("Failed to load system users:", error);
        setSystemUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    loadUsers();
  }, []);

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

    const matchesDepartment =
      filterDepartment === "all" ||
      recipient.department_id?.toString() === filterDepartment;
    const matchesLoB =
      filterLoB === "all" ||
      recipient.line_of_business_id?.toString() === filterLoB;
    const matchesStatus =
      filterStatus === "all" || recipient.status === filterStatus;

    return matchesSearch && matchesDepartment && matchesLoB && matchesStatus;
  });

  const handleRemoveRecipient = (recipient: SeedListRecipient) => {
    setRecipientToRemove(recipient);
  };

  const handleConfirmRemove = useCallback(async () => {
    if (!recipientToRemove) return;

    setIsRemovingRecipient(true);
    try {
      // TODO: Call API to remove recipient when backend is ready
      // await seedListService.removeRecipient(recipientToRemove.id);
      
      setRecipients(recipients.filter((r) => r.id !== recipientToRemove.id));
      showToast("Recipient removed successfully");
    } catch {
      showError("Failed to remove recipient");
    } finally {
      setIsRemovingRecipient(false);
      setRecipientToRemove(null);
    }
  }, [recipientToRemove, recipients, showToast, showError]);

  const handleCancelRemove = () => {
    setRecipientToRemove(null);
  };

  const handleSaveTestList = async (data: { name: string; description?: string }) => {
    try {
      // Mock: Add test list to state
      const newList = {
        id: `list_${Date.now()}`,
        name: data.name,
        description: data.description || "",
      };
      setTestLists([...testLists, newList]);
      showToast("Test list created successfully");
      setIsCreateListModalOpen(false);
    } catch {
      showError("Failed to create test list");
    }
  };

  const handleOpenModal = () => {
    setFormData({
      user_id: "",
      line_of_business_id: "",
      list_id: "",
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      user_id: "",
      line_of_business_id: "",
      list_id: "",
    });
    setErrors({});
  };

  const handleAddRecipient = () => {
    const newErrors: FormErrors = {};

    if (!formData.user_id) {
      newErrors.user_id = "User is required";
    }
    if (!formData.line_of_business_id) {
      newErrors.line_of_business_id = "Line of Business is required";
    }
    if (!formData.list_id) {
      newErrors.list_id = "Test List is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedUser = systemUsers.find(u => u.id.toString() === formData.user_id);
    const selectedList = testLists.find(l => l.id === formData.list_id);
    if (!selectedUser || !selectedList) return;

    const newRecipient: SeedListRecipient = {
      id: Math.max(...recipients.map(r => r.id), 0) + 1,
      customer_id: selectedUser.id,
      customer_name: `${selectedUser.first_name} ${selectedUser.last_name}`.trim(),
      customer_email: selectedUser.email_address,
      customer_phone: selectedUser.phone_number,
      department_id: undefined,
      department_name: selectedUser.department,
      line_of_business_id: parseInt(formData.line_of_business_id),
      line_of_business_name: linesOfBusiness.find(l => l.id.toString() === formData.line_of_business_id)?.name,
      list_id: selectedList.id,
      list_name: selectedList.name,
      status: "active",
      added_at: new Date().toISOString(),
      added_by: 1,
      added_by_name: "Current User",
    };

    setRecipients([...recipients, newRecipient]);
    showToast("Recipient added successfully");
    handleCloseModal();
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
            {activeTab === "recipients" ? "Add Recipient" : "Create List"}
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
          <span className="whitespace-nowrap">Test Recipients</span>
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
          <span className="whitespace-nowrap">Test Lists</span>
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
            {testLists.length}
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
        {/* Mobile: Stack everything vertically */}
        {/* md/lg: Search + Department on row 1, others on row 2 */}
        {/* xl+: All on one row */}
        <div className="flex flex-col gap-4">
          {/* First Row: Search + Department on md/lg, all filters on xl+ */}
          <div className="flex flex-col md:flex-row xl:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 xl:flex-[0.6]">
              <SearchInput
                placeholder={t.seedListManagement.searchPlaceholder}
                value={searchTerm}
                onChange={setSearchTerm}
              />
            </div>

            {/* Department Filter - on first row for md/lg, on same row for xl+ */}
            <div className="hidden md:block xl:flex-[0.15]">
              <HeadlessSelect
                value={filterDepartment}
                onChange={(value) => setFilterDepartment(value.toString())}
                options={[
                  { value: "all", label: t.seedListManagement.allDepartments },
                  ...departments.map((dept) => ({
                    value: dept.id.toString(),
                    label: dept.name,
                  })),
                ]}
                placeholder="Filter by Department"
              />
            </div>

            {/* Line of Business - show on xl+ on same row */}
            <div className="hidden xl:block xl:flex-[0.15]">
              <HeadlessSelect
                value={filterLoB}
                onChange={(value) => setFilterLoB(value.toString())}
                options={[
                  {
                    value: "all",
                    label: t.seedListManagement.allLinesOfBusiness,
                  },
                  ...linesOfBusiness.map((lob) => ({
                    value: lob.id.toString(),
                    label: lob.name,
                  })),
                ]}
                placeholder="Filter by Line of Business"
              />
            </div>

            {/* Status - show on xl+ on same row */}
            <div className="hidden xl:block xl:flex-[0.1]">
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

          {/* Second Row: Line of Business + Status (md/lg only), hidden on xl+ */}
          <div className="flex flex-col md:flex-row xl:hidden gap-4">
            {/* Department Filter - show on mobile only */}
            <div className="md:hidden">
              <HeadlessSelect
                value={filterDepartment}
                onChange={(value) => setFilterDepartment(value.toString())}
                options={[
                  { value: "all", label: t.seedListManagement.allDepartments },
                  ...departments.map((dept) => ({
                    value: dept.id.toString(),
                    label: dept.name,
                  })),
                ]}
                placeholder="Filter by Department"
              />
            </div>

            {/* Line of Business Filter - md/lg only */}
            <div className="flex-1 min-w-0">
              <HeadlessSelect
                value={filterLoB}
                onChange={(value) => setFilterLoB(value.toString())}
                options={[
                  {
                    value: "all",
                    label: t.seedListManagement.allLinesOfBusiness,
                  },
                  ...linesOfBusiness.map((lob) => ({
                    value: lob.id.toString(),
                    label: lob.name,
                  })),
                ]}
                placeholder="Filter by Line of Business"
              />
            </div>

            {/* Status Filter - md/lg only */}
            <div className="flex-1 min-w-0">
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
              No test recipients found
            </h3>
            <p className={`text-sm ${tw.textMuted} mb-6`}>
              {searchTerm
                ? "Try adjusting your search terms"
                : "No test recipients available"}
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
                    Test List
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
                {filteredRecipients.map((recipient) => (
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
                        {recipient.list_name || "-"}
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
                ))}
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
          {testLists.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
                No test lists created yet
              </h3>
              <p className={`text-sm ${tw.textMuted} mb-6`}>
                Click "Create List" to organize test recipients into groups
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
                  {testLists.map((list) => {
                    const recipientCount = recipients.filter(
                      (r) => r.list_id === list.id
                    ).length;
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
                          className="px-6 py-4"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className="text-sm text-black font-medium">
                            {recipientCount}
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
                            onClick={() => {
                              setTestLists(
                                testLists.filter((l) => l.id !== list.id)
                              );
                              showToast("Test list deleted successfully");
                            }}
                            className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-colors`}
                            title="Delete test list"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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
                Add Test Recipient
              </h2>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* User Selection */}
                <div>
                  <label className={`block text-sm font-medium ${tw.textPrimary} mb-1`}>
                    Select User *
                  </label>
                  <div className={errors.user_id ? "border border-red-500 rounded" : ""}>
                    <HeadlessSelect
                      value={formData.user_id}
                      onChange={(value) => {
                        setFormData({ ...formData, user_id: value });
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

                {/* Line of Business */}
                <div>
                  <label className={`block text-sm font-medium ${tw.textPrimary} mb-1`}>
                    Line of Business *
                  </label>
                  <div className={errors.line_of_business_id ? "border border-red-500 rounded" : ""}>
                    <HeadlessSelect
                      value={formData.line_of_business_id}
                      onChange={(value) => {
                        setFormData({ ...formData, line_of_business_id: value });
                        if (errors.line_of_business_id) {
                          setErrors({ ...errors, line_of_business_id: undefined });
                        }
                      }}
                      options={[
                        { value: "", label: "Select Line of Business" },
                        ...linesOfBusiness.map((lob) => ({
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

                {/* Test List Selection */}
                <div>
                  <label className={`block text-sm font-medium ${tw.textPrimary} mb-1`}>
                    Select Test List *
                  </label>
                  <div className={errors.list_id ? "border border-red-500 rounded" : ""}>
                    <HeadlessSelect
                      value={formData.list_id}
                      onChange={(value) => {
                        setFormData({ ...formData, list_id: value });
                        if (errors.list_id) {
                          setErrors({ ...errors, list_id: undefined });
                        }
                      }}
                      options={[
                        { value: "", label: "Select a test list" },
                        ...testLists.map((list) => ({
                          value: list.id,
                          label: list.name,
                        })),
                      ]}
                      placeholder="Select test list..."
                      zIndex={zIndex.popover}
                    />
                  </div>
                  {errors.list_id && (
                    <p className="text-xs text-red-500 mt-1">{errors.list_id}</p>
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
                  className={`px-4 py-2 text-white font-medium ${tw.rounded}`}
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
          title="Remove Test Recipient"
          description="Are you sure you want to remove this recipient from the seed list? This action cannot be undone."
          itemName={recipientToRemove.customer_name || "this recipient"}
          onConfirm={handleConfirmRemove}
          onClose={handleCancelRemove}
          isLoading={isRemovingRecipient}
          confirmText="Remove"
          cancelText="Cancel"
        />
      )}

      {/* Create Test List Modal */}
      <CreateTestListModal
        isOpen={isCreateListModalOpen}
        onClose={() => setIsCreateListModalOpen(false)}
        onSubmit={handleSaveTestList}
        isLoading={false}
        mode="create"
      />
    </div>
  );
}
