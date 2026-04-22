import { useState, useMemo } from "react";
import { Eye, Edit, Trash2 } from "lucide-react";
import Input from "../../../shared/components/ui/Input";
import Pagination from "../../../shared/components/ui/Pagination";
import { color, tw } from "../../../shared/utils/utils";
import BackButton from "../../../shared/components/ui/BackButton";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../contexts/ToastContext";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import CreateButton from "../../../shared/components/ui/CreateButton";

const DUMMY_PROFILE_FIELDS = [
  {
    id: 1,
    name: "Account Type",
    description: "",
    dataSource: "DB",
    frequency: "D-1",
    status: "Available",
    extractionLogic: "",
  },
  {
    id: 2,
    name: "Activation Date",
    description: "",
    dataSource: "DB",
    frequency: "D-1",
    status: "Available",
    extractionLogic: "BIB_ADM.FLYTXT_DX_DAILY_KPI.ACTIVATION_DATE",
  },
  {
    id: 3,
    name: "CELL_ID",
    description: "",
    dataSource: "DB",
    frequency: "D-1",
    status: "Available",
    extractionLogic: "BIB_ADM.FLYTXT_DX_DAILY_KPI.CELL_ID",
  },
  {
    id: 4,
    name: "Consumer Address",
    description: "(Site Id)",
    dataSource: "DB",
    frequency: "D-1",
    status: "Available",
    extractionLogic: "",
  },
  {
    id: 5,
    name: "Date of last activity",
    description: "",
    dataSource: "DB",
    frequency: "D-1",
    status: "Available",
    extractionLogic: "BIB_ADM.FLYTXT_DX_DAILY_KPI.LAST_ACTIVITY_DATE",
  },
  {
    id: 6,
    name: "Device Category",
    description: "",
    dataSource: "DB",
    frequency: "D-1",
    status: "Available",
    extractionLogic: "BIB_ADM.FLYTXT_DX_DAILY_KPI.DEVICE_CATEGORY",
  },
  {
    id: 7,
    name: "Device Type (4G/3G/2G)",
    description: "",
    dataSource: "DB",
    frequency: "D-1",
    status: "Available",
    extractionLogic: "BIB_ADM.FLYTXT_DX_DAILY_KPI.DEVICE_TYPE",
  },
  {
    id: 8,
    name: "EOD_Balance",
    description: "",
    dataSource: "DB",
    frequency: "D-1",
    status: "Available",
    extractionLogic: "BIB_ADM.FLYTXT_DX_DAILY_KPI.EOD_BALANCE",
  },
  {
    id: 9,
    name: "First Name",
    description: "",
    dataSource: "DB",
    frequency: "D-1",
    status: "Available",
    extractionLogic: "BIB_ADM.FLYTXT_DX_DAILY_KPI.FIRST_NAME",
  },
  {
    id: 10,
    name: "Last Name",
    description: "",
    dataSource: "DB",
    frequency: "D-1",
    status: "Available",
    extractionLogic: "BIB_ADM.FLYTXT_DX_DAILY_KPI.LAST_NAME",
  },
  {
    id: 11,
    name: "Last Recharge Date",
    description: "",
    dataSource: "Live",
    frequency: "Per Min",
    status: "Available",
    extractionLogic: "OCS_VOU.TRADETIME",
  },
  {
    id: 12,
    name: "Last Recharge Value",
    description: "",
    dataSource: "Live",
    frequency: "Per Min",
    status: "Available",
    extractionLogic: "OCS_VOU.CARDVALUEADDED/1000000",
  },
  {
    id: 13,
    name: "Phone Brand",
    description: "",
    dataSource: "DB",
    frequency: "D-1",
    status: "Available",
    extractionLogic: "BIB_ADM.FLYTXT_DX_DAILY_KPI.PHONE_BRAND",
  },
  {
    id: 14,
    name: "preferred Language",
    description: "",
    dataSource: "DB",
    frequency: "D-1",
    status: "Available",
    extractionLogic: "",
  },
  {
    id: 15,
    name: "Province",
    description: "",
    dataSource: "DB",
    frequency: "D-1",
    status: "Available",
    extractionLogic: "BIB_ADM.FLYTXT_DX_DAILY_KPI.PROVINCE",
  },
  {
    id: 16,
    name: "RGS status",
    description: "",
    dataSource: "DB",
    frequency: "D-1",
    status: "Available",
    extractionLogic: "BIB_ADM.FLYTXT_DX_DAILY_KPI.RGS_STATUS",
  },
  {
    id: 17,
    name: "Service_Class",
    description: "",
    dataSource: "DB",
    frequency: "D-1",
    status: "Available",
    extractionLogic: "BIB_ADM.FLYTXT_DX_DAILY_KPI.SERVICE_CLASS",
  },
  {
    id: 18,
    name: "SIM Support",
    description: "",
    dataSource: "DB",
    frequency: "D-1",
    status: "Available",
    extractionLogic: "BIB_ADM.FLYTXT_DX_DAILY_KPI.SIM_SUPPORT",
  },
  {
    id: 19,
    name: "SIM Type (4G USIM /3G SIM/Normal)",
    description: "",
    dataSource: "DB",
    frequency: "D-1",
    status: "Available",
    extractionLogic: "BIB_ADM.FLYTXT_DX_DAILY_KPI.SIM_TYPE",
  },
  {
    id: 20,
    name: "Smartphone",
    description: "",
    dataSource: "DB",
    frequency: "D-1",
    status: "Available",
    extractionLogic: "BIB_ADM.FLYTXT_DX_DAILY_KPI.SMARTPHONE",
  },
];

const ITEMS_PER_PAGE = 10;

export default function SubscriberProfileListPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<{ id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredProfiles = useMemo(() => {
    return DUMMY_PROFILE_FIELDS.filter((profile) => {
      const matchesSearch =
        profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (profile.description && profile.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProfiles = filteredProfiles.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const handleViewDetails = (profile: typeof DUMMY_PROFILE_FIELDS[0]) => {
    navigate(`/dashboard/kpis/subscriber-profiles/${profile.id}`);
  };

  const handleEdit = (profile: typeof DUMMY_PROFILE_FIELDS[0]) => {
    navigate(`/dashboard/kpis/subscriber-profiles/${profile.id}/edit`);
  };

  const handleDeleteClick = (profile: typeof DUMMY_PROFILE_FIELDS[0]) => {
    setProfileToDelete({ id: profile.id, name: profile.name });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!profileToDelete) return;
    try {
      setIsDeleting(true);
      showToast("info", `Delete functionality for "${profileToDelete.name}" will be implemented soon`);
      setShowDeleteModal(false);
      setProfileToDelete(null);
    } catch (error) {
      console.error("Failed to delete profile:", error);
      showToast("error", "Failed to delete profile");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setProfileToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <BackButton fallbackTo="/dashboard/kpis" />
        <CreateButton route="/dashboard/kpis/subscriber-profiles/create" />
      </div>

      <p className={`text-sm ${tw.textSecondary} mb-4`}>
        Manage and configure customer profile fields and attributes
      </p>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Search profile fields..."
          value={searchTerm}
          onChange={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
          className="flex-1 min-w-[250px]"
        />
      </div>

      {/* Table */}
      <div
        className={`${tw.rounded} border overflow-hidden`}
        style={{ borderColor: color.border.default }}
      >
        {filteredProfiles.length === 0 ? (
          <div className="p-8 md:p-16 text-center">
            <div className={`bg-gradient-to-br from-[${color.primary.accent}]/5 to-[${color.primary.accent}]/10 ${tw.rounded} p-6 md:p-12`}>
              <h3 className={`${tw.cardHeading} ${tw.textPrimary} mb-1`}>No profile fields found</h3>
              <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
                No profile fields match your search criteria.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}>
                <thead style={{ background: color.surface.tableHeader }}>
                  <tr>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Field Name
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Data Source
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Frequency
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Status
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProfiles.map((profile) => (
                    <tr
                      key={profile.id}
                      className="hover:bg-gray-50 transition-colors"
                      style={{ background: color.surface.background }}
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{profile.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{profile.dataSource}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{profile.frequency}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{profile.status}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => handleViewDetails(profile)}
                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" style={{ color: color.primary.action }} />
                          </button>
                          <button
                            onClick={() => handleEdit(profile)}
                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" style={{ color: color.primary.action }} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(profile)}
                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden">
              {paginatedProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="p-4 border-b border-gray-200 last:border-b-0"
                  style={{ background: color.surface.background }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">{profile.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{profile.dataSource} • {profile.frequency}</p>
                    </div>
                    <span className="text-sm text-gray-900">{profile.status}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(profile)}
                      className="flex-1 p-2 hover:bg-gray-100 rounded transition-colors text-xs"
                    >
                      <Eye className="w-4 h-4 mx-auto" style={{ color: color.primary.action }} />
                    </button>
                    <button
                      onClick={() => handleEdit(profile)}
                      className="flex-1 p-2 hover:bg-gray-100 rounded transition-colors text-xs"
                    >
                      <Edit className="w-4 h-4 mx-auto" style={{ color: color.primary.action }} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(profile)}
                      className="flex-1 p-2 hover:bg-gray-100 rounded transition-colors text-xs"
                    >
                      <Trash2 className="w-4 h-4 mx-auto text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          pageSize={ITEMS_PER_PAGE}
          totalItems={filteredProfiles.length}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        title="Delete Profile Field"
        message={`Are you sure you want to delete "${profileToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
