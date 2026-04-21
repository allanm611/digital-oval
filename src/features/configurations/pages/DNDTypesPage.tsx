import { useState, useEffect, useMemo } from "react";
import { Plus, Edit, Trash2, Power, PowerOff } from "lucide-react";
import Input from "../../../shared/components/ui/Input";
import SearchInput from "../../../shared/components/ui/SearchInput";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Pagination from "../../../shared/components/ui/Pagination";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import Checkbox from "../../../shared/components/ui/Checkbox";
import { dndService, DNDType } from "../../campaigns/services/dndService";
import { useToast } from "../../../contexts/ToastContext";
import { color, tw } from "../../../shared/utils/utils";

interface CreateEditModalState {
  isOpen: boolean;
  mode: "create" | "edit";
  data?: DNDType;
}

export default function DNDTypesPage() {
  const { success: showSuccess, error: showError } = useToast();

  const [dndTypes, setDndTypes] = useState<DNDType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [modal, setModal] = useState<CreateEditModalState>({ isOpen: false, mode: "create" });
  const [formData, setFormData] = useState({ name: "", description: "", is_active: true });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingTypeId, setTogglingTypeId] = useState<number | null>(null);
  const [deletingTypeId, setDeletingTypeId] = useState<number | null>(null);

  useEffect(() => {
    loadDNDTypes();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterType]);

  const loadDNDTypes = async () => {
    try {
      setLoading(true);
      const data = await dndService.getDNDTypes(false);
      setDndTypes(data);
    } catch (err) {
      showError("Error", "Failed to load DND types");
    } finally {
      setLoading(false);
    }
  };

  const filteredTypes = useMemo(() => {
    return dndTypes.filter((type) => {
      const matchesSearch =
        type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (type.description && type.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && type.is_active) ||
        (filterStatus === "inactive" && !type.is_active);

      const matchesType =
        filterType === "all" || String(type.id) === filterType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [dndTypes, searchTerm, filterStatus, filterType]);

  const paginatedTypes = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredTypes.slice(startIndex, endIndex);
  }, [filteredTypes, currentPage, pageSize]);

  const handleOpenCreateModal = () => {
    setFormData({ name: "", description: "", is_active: true });
    setModal({ isOpen: true, mode: "create" });
  };

  const handleOpenEditModal = (type: DNDType) => {
    setFormData({
      name: type.name,
      description: type.description || "",
      is_active: type.is_active,
    });
    setModal({ isOpen: true, mode: "edit", data: type });
  };

  const handleCloseModal = () => {
    setModal({ isOpen: false, mode: "create" });
    setFormData({ name: "", description: "", is_active: true });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showError("Error", "DND type name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      if (modal.mode === "create") {
        await dndService.createDNDType({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        });
        showSuccess("Success", "DND type created successfully");
      } else if (modal.data) {
        await dndService.updateDNDType(modal.data.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          is_active: formData.is_active,
        });
        showSuccess("Success", "DND type updated successfully");
      }
      await loadDNDTypes();
      handleCloseModal();
    } catch (err) {
      showError("Error", `Failed to ${modal.mode === "create" ? "create" : "update"} DND type`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;

    const oldDndTypes = dndTypes;

    try {
      setDndTypes(dndTypes.filter((t) => t.id !== deleteConfirmId));

      await dndService.deleteDNDType(deleteConfirmId);
      showSuccess("Success", `"${deleteConfirmName}" has been deleted successfully`);
      setDeleteConfirmId(null);
      setDeleteConfirmName("");
      setDeletingTypeId(null);
    } catch (err) {
      setDndTypes(oldDndTypes);
      showError("Error", "Failed to delete DND type");
      setDeletingTypeId(null);
    }
  };

  const handleToggleStatus = async (type: DNDType) => {
    const oldDndTypes = dndTypes;
    const newStatus = !type.is_active;

    try {
      setTogglingTypeId(type.id);
      setDndTypes(
        dndTypes.map((t) => (t.id === type.id ? { ...t, is_active: newStatus } : t))
      );

      await dndService.updateDNDType(type.id, {
        name: type.name,
        description: type.description,
        is_active: newStatus,
      });

      showSuccess("Success", `"${type.name}" is now ${newStatus ? "active" : "inactive"}`);
    } catch (err) {
      setDndTypes(oldDndTypes);
      showError("Error", "Failed to update DND type status");
    } finally {
      setTogglingTypeId(null);
    }
  };

  const handleDeleteClick = (type: DNDType) => {
    setDeletingTypeId(type.id);
    setDeleteConfirmId(type.id);
    setDeleteConfirmName(type.name);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <BackButton fallbackTo="/dashboard/configuration" showBreadcrumb={true} currentLabel="DND Types" />
        <button
          onClick={handleOpenCreateModal}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md whitespace-nowrap disabled:opacity-60"
          style={{ backgroundColor: color.primary.action }}
        >
          <Plus className="w-4 h-4" />
          Create DND Type
        </button>
      </div>

      {/* Description */}
      <p className={`text-sm ${tw.textSecondary}`}>
        Manage Do Not Disturb types that customers can subscribe to for different communication preferences.
      </p>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <SearchInput
            placeholder="Search DND types..."
            value={searchTerm}
            onChange={setSearchTerm}
            disabled={loading}
            className="flex-1 min-w-[250px]"
          />
        </div>

        {/* Type Filter */}
        <div className="w-full md:w-[180px]">
          <HeadlessSelect
            value={filterType}
            onChange={setFilterType}
            options={[
              { value: "all", label: "All Types" },
              ...dndTypes.map((type) => ({
                value: String(type.id),
                label: type.name,
              })),
            ]}
            placeholder="Filter by type"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-[180px]">
          <HeadlessSelect
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: "all", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            placeholder="Filter by status"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center justify-center">
            <LoadingSpinner variant="modern" size="md" color="primary" />
            <p className={`${tw.textMuted} font-medium mt-4`}>Loading DND types...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredTypes.length === 0 && (
        <div className="text-center py-12">
          <p className={`${tw.textSecondary} text-sm`}>No DND types found</p>
        </div>
      )}

      {/* Table - Only shown when data exists */}
      {!loading && filteredTypes.length > 0 && (
        <div className="overflow-x-auto">
          <table
            className="w-full min-w-[720px]"
            style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
          >
            <thead>
              <tr>
                <th
                  className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider rounded-tl-md"
                  style={{
                    color: color.surface.tableHeaderText,
                    backgroundColor: color.surface.tableHeader,
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
                  Description
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
                  className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider rounded-tr-md"
                  style={{
                    color: color.surface.tableHeaderText,
                    backgroundColor: color.surface.tableHeader,
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedTypes.map((type) => (
                <tr key={type.id} style={{ backgroundColor: color.surface.tablebodybg }}>
                  <td className="px-6 py-4 text-sm font-medium text-black">{type.name}</td>
                  <td className="px-6 py-4 text-sm text-black truncate max-w-xs">
                    {type.description || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-black">
                    {type.is_active ? "Active" : "Inactive"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleToggleStatus(type)}
                        disabled={togglingTypeId !== null || deletingTypeId !== null}
                        className={`p-2 ${tw.rounded} transition-colors disabled:opacity-60`}
                        title={type.is_active ? "Deactivate" : "Activate"}
                      >
                        {togglingTypeId === type.id ? (
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        ) : type.is_active ? (
                          <PowerOff className="w-4 h-4 text-orange-600" />
                        ) : (
                          <Power className="w-4 h-4 text-green-600" />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(type)}
                        disabled={togglingTypeId !== null || deletingTypeId !== null}
                        className={`p-2 ${tw.rounded} text-black disabled:opacity-60`}
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(type)}
                        disabled={togglingTypeId !== null || deletingTypeId !== null}
                        className={`p-2 text-red-600 ${tw.rounded} disabled:opacity-60`}
                        title="Delete"
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

      {!loading && paginatedTypes.length > 0 && filteredTypes.length > 0 && (
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredTypes.length}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Create/Edit Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center backdrop-blur-sm z-50">
          <div className={`bg-white ${tw.rounded} shadow-xl w-full max-w-md mx-4 border border-gray-100`}>
            <div className="flex items-center justify-between gap-4 p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {modal.mode === "create" ? "Create DND Type" : "Edit DND Type"}
              </h2>
              <button
                onClick={handleCloseModal}
                className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
              >
                <Plus className="w-5 h-5 text-gray-400 rotate-45" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(value) => setFormData({ ...formData, name: String(value) })}
                  placeholder="e.g., Promotional, Transactional..."
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this DND type..."
                  rows={3}
                  className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} text-sm focus:outline-none`}
                  disabled={isSubmitting}
                />
              </div>

              {modal.mode === "edit" && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    disabled={isSubmitting}
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Active
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSubmitting || !formData.name.trim()}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-60"
                  style={{ backgroundColor: color.primary.action }}
                >
                  {isSubmitting ? "Saving..." : modal.mode === "create" ? "Create" : "Update"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete DND Type"
        description="Are you sure you want to delete this DND type? This action cannot be undone."
        itemName={deleteConfirmName}
        isLoading={deletingTypeId !== null}
      />
    </div>
  );
}
