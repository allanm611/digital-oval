import { useState } from "react";
import { Plus, Search, Trash2, Mail } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import DateFormatter from "../../../shared/components/DateFormatter";
import { getDepartmentsConfig, getLineOfBusinessConfig } from "../../../shared/configs/configurationPageConfigs";

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
    status: "inactive",
    added_at: "2025-01-08T10:15:00Z",
    added_by: 1,
    added_by_name: "Admin User",
    removed_at: "2025-01-28T16:00:00Z",
    removed_by: 1,
    removed_by_name: "Admin User",
  },
];

interface AddRecipientForm {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  department_id: string;
  line_of_business_id: string;
}

interface FormErrors {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  department_id?: string;
  line_of_business_id?: string;
}

export default function SeedListManagementPage() {
  const { success: showToast } = useToast();
  const { t } = useLanguage();
  const [recipients, setRecipients] = useState<SeedListRecipient[]>(DUMMY_RECIPIENTS);
  const departments = getDepartmentsConfig(t).initialData;
  const linesOfBusiness = getLineOfBusinessConfig(t).initialData;
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterLoB, setFilterLoB] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<AddRecipientForm>({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    department_id: "",
    line_of_business_id: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const filteredRecipients = recipients.filter((recipient) => {
    const matchesSearch =
      recipient.customer_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      recipient.customer_email
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      recipient.customer_phone
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

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
    // TODO: Implement remove functionality
    void recipient; // Parameter will be used in future implementation
    showToast("Remove recipient functionality will be implemented");
  };

  const handleOpenModal = () => {
    setFormData({
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      department_id: "",
      line_of_business_id: "",
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
      department_id: "",
      line_of_business_id: "",
    });
    setErrors({});
  };

  const handleAddRecipient = () => {
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
    if (!formData.department_id) {
      newErrors.department_id = "Department is required";
    }
    if (!formData.line_of_business_id) {
      newErrors.line_of_business_id = "Line of Business is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newRecipient: SeedListRecipient = {
      id: Math.max(...recipients.map(r => r.id), 0) + 1,
      customer_id: Math.max(...recipients.map(r => r.customer_id), 300) + 1,
      customer_name: formData.customer_name,
      customer_email: formData.customer_email,
      customer_phone: formData.customer_phone,
      department_id: parseInt(formData.department_id),
      department_name: departments.find(d => d.id.toString() === formData.department_id)?.name,
      line_of_business_id: parseInt(formData.line_of_business_id),
      line_of_business_name: linesOfBusiness.find(l => l.id.toString() === formData.line_of_business_id)?.name,
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
      {/* Header */}
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
            onClick={handleOpenModal}
            className={`inline-flex items-center gap-2 px-4 py-2 ${tw.rounded} font-semibold text-sm text-white w-auto`}
            style={{ backgroundColor: color.primary.action }}
          >
            <Plus className="w-4 h-4" />
            {t.seedListManagement.addRecipient}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="my-5">
        {/* Mobile: Stack everything vertically */}
        {/* md/lg: Search + Department on row 1, others on row 2 */}
        {/* xl+: All on one row */}
        <div className="flex flex-col gap-4">
          {/* First Row: Search + Department on md/lg, all filters on xl+ */}
          <div className="flex flex-col md:flex-row xl:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1 xl:flex-[0.6]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t.seedListManagement.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-[#588157] text-sm`}
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
            <p className={`${tw.textMuted} mb-6`}>
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
                    Participants
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Department
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Line of Business
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
                      <div className={`${tw.tableFirstColumn} ${tw.textPrimary}`}>
                        {recipient.customer_name || "Unknown"}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className={`text-sm ${tw.textSecondary}`}>
                        {recipient.customer_email || "-"}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className={`text-sm ${tw.textSecondary}`}>
                        {recipient.customer_phone?.replace(/^\+/, "") || "-"}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className={`text-sm ${tw.textSecondary}`}>
                        {recipient.department_name || "-"}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className={`text-sm ${tw.textSecondary}`}>
                        {recipient.line_of_business_name || "-"}
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
                      className="px-6 py-4 whitespace-nowrap"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary}`}>
                        <DateFormatter date={recipient.added_at} />
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary}`}>
                        {recipient.added_by_name || "System"}
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

      {/* Add Recipient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${tw.rounded} bg-white shadow-xl max-w-md w-full mx-4`}>
            <div className="p-6">
              <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
                Add Test Recipient
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
                    placeholder="Enter recipient name"
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

                {/* Department */}
                <div>
                  <label className={`block text-sm font-medium ${tw.textPrimary} mb-1`}>
                    Department
                  </label>
                  <div className={errors.department_id ? "border border-red-500 rounded" : ""}>
                    <HeadlessSelect
                      value={formData.department_id}
                      onChange={(value) => {
                        setFormData({ ...formData, department_id: value });
                        if (errors.department_id) {
                          setErrors({ ...errors, department_id: undefined });
                        }
                      }}
                      options={[
                        { value: "", label: "Select Department" },
                        ...departments.map((dept) => ({
                          value: dept.id.toString(),
                          label: dept.name,
                        })),
                      ]}
                      placeholder="Select Department"
                    />
                  </div>
                  {errors.department_id && (
                    <p className="text-xs text-red-500 mt-1">{errors.department_id}</p>
                  )}
                </div>

                {/* Line of Business */}
                <div>
                  <label className={`block text-sm font-medium ${tw.textPrimary} mb-1`}>
                    Line of Business
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
    </div>
  );
}
