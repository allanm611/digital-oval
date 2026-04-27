import { useState, useMemo, useEffect } from "react";
import { Eye, Edit, Trash2 } from "lucide-react";
import Input from "../../../shared/components/ui/Input";
import Pagination from "../../../shared/components/ui/Pagination";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import BackButton from "../../../shared/components/ui/BackButton";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../contexts/ToastContext";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import CreateButton from "../../../shared/components/ui/CreateButton";
import { segmentService } from "../../segments/services/segmentService";

const ITEMS_PER_PAGE = 10;

interface Profile {
  id: number;
  name: string;
  description?: string;
  dataSource: string;
  status: string;
}

export default function SubscriberProfileListPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<{ id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setIsLoading(true);
    try {
      const response = await segmentService.getSegmentationFields(true);
      if (response && response.success && response.data && response.data.length > 0) {
        const config = response.data[0]?.field_selector_config || [];

        // Find Customer 360 category and extract fields from sub-categories
        const customer360Category = config.find(
          (cat: any) => cat.value === "customer_360" || cat.value === "customer_identity"
        );

        if (customer360Category) {
          const loadedProfiles: Profile[] = [];

          // Extract fields from sub-categories
          if (customer360Category.sub_categories && Array.isArray(customer360Category.sub_categories)) {
            customer360Category.sub_categories.forEach((subCat: any) => {
              if (subCat.fields && Array.isArray(subCat.fields)) {
                subCat.fields.forEach((field: any, index: number) => {
                  loadedProfiles.push({
                    id: field.id || index,
                    name: field.field_name || field.name || "",
                    description: field.field_description || field.description || "",
                    dataSource: subCat.display_name || subCat.name || "Customer 360",
                    status: "Active",
                  });
                });
              }
            });
          }

          setProfiles(loadedProfiles);
        } else {
          setProfiles([]);
        }
      }
    } catch (err) {
      console.error("Failed to load subscriber profiles:", err);
      showToast("error", "Failed to load subscriber profiles");
      setProfiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const matchesSearch =
        profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (profile.description && profile.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
  }, [searchTerm, profiles]);

  const totalPages = Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProfiles = filteredProfiles.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const handleViewDetails = (profile: Profile) => {
    navigate(`/dashboard/kpis/subscriber-profiles/${profile.id}`, { state: { parentLabel: "Subscriber Profiles" } });
  };

  const handleEdit = (profile: Profile) => {
    navigate(`/dashboard/kpis/subscriber-profiles/${profile.id}/edit`, { state: { parentLabel: "Subscriber Profiles" } });
  };

  const handleDeleteClick = (profile: Profile) => {
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
        {isLoading ? (
          <div className="p-8 md:p-16 text-center">
            <div className="flex flex-col items-center justify-center gap-4">
              <LoadingSpinner
                size="xl"
                color="primary"
              />
              <p className={`${tw.textMuted} font-medium text-sm`}>
                Loading profile fields...
              </p>
            </div>
          </div>
        ) : filteredProfiles.length === 0 ? (
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
                      Category
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Status
                    </th>
                    <th
                      className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider"
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
                      <td className="px-6 py-4 text-sm text-gray-900">{profile.status}</td>
                      <td className="px-3 py-4">
                        <div className="flex gap-1 justify-center">
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
                      <p className="text-xs text-gray-500 mt-1">{profile.dataSource}</p>
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
