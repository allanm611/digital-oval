import { useState } from "react";
import {
  Plus,
  Search,
  Trash2,
  Star,
  Users,
  Eye,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import DateFormatter from "../../../shared/components/DateFormatter";

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
  customer_count?: number;
  status: "active" | "inactive";
  created_at: string;
}

// Dummy data - Using Kenyan names from customer data
const DUMMY_VIP_CUSTOMERS: VIPCustomer[] = [
  {
    id: 1,
    customer_id: 201,
    customer_name: "Nelly Mwaura",
    customer_email: "nelly.mwaura@gmail.com",
    customer_phone: "+254763056860",
    vip_list_id: 1,
    vip_list_name: "Premium VIP",
    status: "active",
    added_at: "2025-01-10T09:00:00Z",
    added_by: 1,
    added_by_name: "Admin User",
  },
  {
    id: 2,
    customer_id: 202,
    customer_name: "Wilson Githaiga",
    customer_email: "wilson.githaiga@yahoo.com",
    customer_phone: "+254763056254",
    vip_list_id: 2,
    vip_list_name: "Gold VIP",
    status: "active",
    added_at: "2025-01-12T11:30:00Z",
    added_by: 2,
    added_by_name: "Sales Team",
  },
  {
    id: 3,
    customer_id: 203,
    customer_name: "Grace Wanjiru",
    customer_email: "grace.wanjiru@outlook.com",
    customer_phone: "+254723456789",
    vip_list_id: 1,
    vip_list_name: "Premium VIP",
    status: "active",
    added_at: "2025-01-15T14:20:00Z",
    added_by: 1,
    added_by_name: "Admin User",
  },
  {
    id: 4,
    customer_id: 204,
    customer_name: "Peter Kipchoge",
    customer_email: "peter.kipchoge@gmail.com",
    customer_phone: "+254734567890",
    vip_list_id: 2,
    vip_list_name: "Gold VIP",
    status: "inactive",
    added_at: "2025-01-08T10:15:00Z",
    added_by: 2,
    added_by_name: "Sales Team",
    removed_at: "2025-01-28T16:00:00Z",
    removed_by: 1,
    removed_by_name: "Admin User",
  },
];

const DUMMY_VIP_LISTS: VIPList[] = [
  {
    id: 1,
    name: "Premium VIP",
    description: "Top tier VIP customers with exclusive benefits",
    customer_count: 2,
    status: "active",
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: 2,
    name: "Gold VIP",
    description: "High-value customers with priority support",
    customer_count: 2,
    status: "active",
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: 3,
    name: "Silver VIP",
    description: "Regular VIP customers",
    customer_count: 0,
    status: "active",
    created_at: "2025-01-05T00:00:00Z",
  },
];

interface AddVIPCustomerForm {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  vip_list_id: string;
}

interface FormErrors {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  vip_list_id?: string;
}

export default function VIPListManagementPage() {
  const { success: showToast } = useToast();
  const { t } = useLanguage();
  const [vipCustomers, setVipCustomers] = useState<VIPCustomer[]>(DUMMY_VIP_CUSTOMERS);
  const [vipLists] = useState<VIPList[]>(DUMMY_VIP_LISTS);
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermLists, setSearchTermLists] = useState("");
  const [filterList, setFilterList] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterStatusLists, setFilterStatusLists] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"customers" | "lists">(
    "customers"
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<AddVIPCustomerForm>({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    vip_list_id: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const filteredCustomers = vipCustomers.filter((customer) => {
    const matchesSearch =
      customer.customer_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      customer.customer_email
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      customer.customer_phone?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesList =
      filterList === "all" || customer.vip_list_id?.toString() === filterList;
    const matchesStatus =
      filterStatus === "all" || customer.status === filterStatus;

    return matchesSearch && matchesList && matchesStatus;
  });

  const filteredLists = vipLists.filter((list) => {
    const matchesSearch =
      list.name?.toLowerCase().includes(searchTermLists.toLowerCase()) ||
      list.description?.toLowerCase().includes(searchTermLists.toLowerCase());

    const matchesStatus =
      filterStatusLists === "all" || list.status === filterStatusLists;

    return matchesSearch && matchesStatus;
  });

  const handleRemoveCustomer = () => {
    // TODO: Implement remove functionality
    showToast("Remove customer functionality will be implemented");
  };

  const handleOpenModal = () => {
    setFormData({
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      vip_list_id: "",
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      vip_list_id: "",
    });
    setErrors({});
  };

  const handleAddCustomer = () => {
    const newErrors: FormErrors = {};

    if (!formData.customer_name) {
      newErrors.customer_name = "Name is required";
    }
    if (!formData.customer_email) {
      newErrors.customer_email = "Email is required";
    }
    if (!formData.customer_phone) {
      newErrors.customer_phone = "Phone number is required";
    }
    if (!formData.vip_list_id) {
      newErrors.vip_list_id = "VIP List is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newCustomer: VIPCustomer = {
      id: Math.max(...vipCustomers.map(c => c.id), 0) + 1,
      customer_id: Math.max(...vipCustomers.map(c => c.customer_id), 200) + 1,
      customer_name: formData.customer_name,
      customer_email: formData.customer_email,
      customer_phone: formData.customer_phone,
      vip_list_id: parseInt(formData.vip_list_id),
      vip_list_name: vipLists.find(l => l.id.toString() === formData.vip_list_id)?.name,
      status: "active",
      added_at: new Date().toISOString(),
      added_by: 1,
      added_by_name: "Current User",
    };

    setVipCustomers([...vipCustomers, newCustomer]);
    showToast("VIP customer added successfully");
    handleCloseModal();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold ${tw.textPrimary}`}>
            {t.vipListManagement.title}
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            {t.vipListManagement.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-3 w-auto">
          <button
            onClick={handleOpenModal}
            className={`inline-flex items-center gap-2 px-4 py-2 ${tw.rounded} font-semibold text-sm text-white w-auto`}
            style={{ backgroundColor: color.primary.action }}
          >
            <Plus className="w-4 h-4" />
            {t.vipListManagement.addCustomer}
          </button>
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
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search - 80% width */}
            <div className="relative flex-[0.8]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-[#588157] text-sm`}
              />
            </div>

            {/* Filters - 20% width */}
            <div className="flex flex-col md:flex-row gap-4 flex-[0.2]">
              {/* VIP List Filter */}
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

              {/* Status Filter */}
              <HeadlessSelect
                value={filterStatus}
                onChange={setFilterStatus}
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

      {/* Filters - VIP Lists tab */}
      {activeTab === "lists" && (
        <div className="my-5">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search - 85% width */}
            <div className="relative flex-[0.85]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by list name or description..."
                value={searchTermLists}
                onChange={(e) => setSearchTermLists(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-[#588157] text-sm`}
              />
            </div>

            {/* Filters - 15% width */}
            <div className="flex flex-col md:flex-row gap-4 flex-[0.15]">
              {/* Status Filter */}
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
              <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
                No VIP customers found
              </h3>
              <p className={`${tw.textMuted} mb-6`}>
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "No VIP customers available"}
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
                      Customer
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
                        <div>
                          <div
                            className={`${tw.tableFirstColumn} ${tw.textPrimary}`}
                          >
                            {customer.customer_name || "Unknown"}
                          </div>
                          <div className={`text-sm ${tw.textMuted}`}>
                            {customer.customer_email ||
                              customer.customer_phone ||
                              "No contact info"}
                          </div>
                        </div>
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
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div className={`text-sm ${tw.textSecondary}`}>
                          <DateFormatter date={customer.added_at} />
                        </div>
                      </td>
                      <td
                        className="px-6 py-4"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div className={`text-sm ${tw.textSecondary}`}>
                          {customer.added_by_name || "System"}
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
                        <button
                          onClick={() => handleRemoveCustomer(customer)}
                          className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-colors`}
                          title={
                            customer.status === "active"
                              ? "Remove from VIP List"
                              : "Delete from VIP List"
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
          )
        ) : /* VIP Lists Table */
        filteredLists.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
              No VIP lists found
            </h3>
            <p className={`${tw.textMuted} mb-6`}>
              {searchTermLists
                ? "Try adjusting your search terms"
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
                    Status
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Created
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
                        className={`${tw.tableFirstColumn} ${tw.textPrimary}`}
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
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className="text-sm text-black">{list.status}</span>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary}`}>
                        <DateFormatter date={list.created_at} />
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
                      <button
                        onClick={() => {
                          setActiveTab("customers");
                          setFilterList(list.id.toString());
                        }}
                        className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 ${tw.rounded} transition-colors`}
                        title="View customers"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add VIP Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${tw.rounded} bg-white shadow-xl max-w-md w-full mx-4`}>
            <div className="p-6">
              <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
                Add VIP Customer
              </h2>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className={`block text-sm font-medium ${tw.textPrimary} mb-1`}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => {
                      setFormData({ ...formData, customer_name: e.target.value });
                      if (errors.customer_name) {
                        setErrors({ ...errors, customer_name: undefined });
                      }
                    }}
                    placeholder="Enter customer name"
                    className={`w-full px-3 py-2 border text-sm ${errors.customer_name ? "border-red-500" : "border-gray-300"} ${tw.rounded} focus:outline-none focus:ring-2`}
                    style={{ focusRingColor: color.primary.accent }}
                  />
                  {errors.customer_name && (
                    <p className="text-xs text-red-500 mt-1">{errors.customer_name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className={`block text-sm font-medium ${tw.textPrimary} mb-1`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => {
                      setFormData({ ...formData, customer_email: e.target.value });
                      if (errors.customer_email) {
                        setErrors({ ...errors, customer_email: undefined });
                      }
                    }}
                    placeholder="Enter email address"
                    className={`w-full px-3 py-2 border text-sm ${errors.customer_email ? "border-red-500" : "border-gray-300"} ${tw.rounded} focus:outline-none focus:ring-2`}
                    style={{ focusRingColor: color.primary.accent }}
                  />
                  {errors.customer_email && (
                    <p className="text-xs text-red-500 mt-1">{errors.customer_email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className={`block text-sm font-medium ${tw.textPrimary} mb-1`}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) => {
                      setFormData({ ...formData, customer_phone: e.target.value });
                      if (errors.customer_phone) {
                        setErrors({ ...errors, customer_phone: undefined });
                      }
                    }}
                    placeholder="Enter phone number"
                    className={`w-full px-3 py-2 border text-sm ${errors.customer_phone ? "border-red-500" : "border-gray-300"} ${tw.rounded} focus:outline-none focus:ring-2`}
                    style={{ focusRingColor: color.primary.accent }}
                  />
                  {errors.customer_phone && (
                    <p className="text-xs text-red-500 mt-1">{errors.customer_phone}</p>
                  )}
                </div>

                {/* VIP List */}
                <div>
                  <label className={`block text-sm font-medium ${tw.textPrimary} mb-1`}>
                    VIP List
                  </label>
                  <div className={errors.vip_list_id ? "border border-red-500 rounded" : ""}>
                    <HeadlessSelect
                      value={formData.vip_list_id}
                      onChange={(value) => {
                        setFormData({ ...formData, vip_list_id: value });
                        if (errors.vip_list_id) {
                          setErrors({ ...errors, vip_list_id: undefined });
                        }
                      }}
                      options={[
                        { value: "", label: "Select VIP List" },
                        ...vipLists.map((list) => ({
                          value: list.id.toString(),
                          label: list.name,
                        })),
                      ]}
                      placeholder="Select VIP List"
                    />
                  </div>
                  {errors.vip_list_id && (
                    <p className="text-xs text-red-500 mt-1">{errors.vip_list_id}</p>
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
                  onClick={handleAddCustomer}
                  className={`px-4 py-2 text-white font-medium ${tw.rounded}`}
                  style={{ backgroundColor: color.primary.action }}
                >
                  Add Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
