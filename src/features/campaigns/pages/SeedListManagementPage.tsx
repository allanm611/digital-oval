import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Search, Trash2, Mail } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import DateFormatter from "../../../shared/components/DateFormatter";

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

export interface Department {
  id: number;
  name: string;
}

export interface LineOfBusiness {
  id: number;
  name: string;
}

// Dummy data
const DUMMY_RECIPIENTS: SeedListRecipient[] = [
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

const DUMMY_DEPARTMENTS: Department[] = [
  { id: 1, name: "Marketing" },
  { id: 2, name: "Sales" },
  { id: 3, name: "Customer Support" },
  { id: 4, name: "Product" },
];

const DUMMY_LINES_OF_BUSINESS: LineOfBusiness[] = [
  { id: 1, name: "Retail Banking" },
  { id: 2, name: "Corporate Banking" },
  { id: 3, name: "Investment Banking" },
  { id: 4, name: "Wealth Management" },
];

export default function SeedListManagementPage() {
  const navigate = useNavigate();
  const { success: showToast } = useToast();
  const [recipients] = useState<SeedListRecipient[]>(DUMMY_RECIPIENTS);
  const [departments] = useState<Department[]>(DUMMY_DEPARTMENTS);
  const [linesOfBusiness] = useState<LineOfBusiness[]>(DUMMY_LINES_OF_BUSINESS);
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterLoB, setFilterLoB] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() =>
              navigateBackOrFallback(navigate, "/dashboard/configuration")
            }
            className={`p-2 text-gray-600 hover:text-gray-800 ${tw.rounded} transition-colors`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-xl sm:text-2xl font-bold ${tw.textPrimary}`}>
              Seed List Management
            </h1>
            <p className={`${tw.textSecondary} mt-2 text-sm`}>
              Manage test recipients (staff) who receive campaign copies based
              on department and line of business
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-auto">
          <button
            onClick={() =>
              showToast("Add test recipient functionality will be implemented")
            }
            className={`inline-flex items-center gap-2 px-4 py-2 ${tw.rounded} font-semibold text-sm text-white w-auto`}
            style={{ backgroundColor: color.primary.action }}
          >
            <Plus className="w-4 h-4" />
            Add Test Recipient
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
                placeholder="Search by name, email, or phone..."
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
                  { value: "all", label: "All Departments" },
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
                  { value: "all", label: "All Lines of Business" },
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
                  { value: "all", label: "All Departments" },
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
                  { value: "all", label: "All Lines of Business" },
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
                    Recipient
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
                      <div>
                        <div
                          className={`text-base font-semibold ${tw.textPrimary}`}
                        >
                          {recipient.customer_name || "Unknown"}
                        </div>
                        <div className={`text-sm ${tw.textMuted}`}>
                          {recipient.customer_email ||
                            recipient.customer_phone ||
                            "No contact info"}
                        </div>
                      </div>
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
    </div>
  );
}
