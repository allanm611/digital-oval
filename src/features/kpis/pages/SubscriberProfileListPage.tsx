import { useState, useMemo, useEffect } from "react";
import { Eye, Trash2 } from "lucide-react";
import Input from "../../../shared/components/ui/Input";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../../shared/components/ui/Pagination";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import { color, tw } from "../../../shared/utils/utils";
import BackButton from "../../../shared/components/ui/BackButton";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useToast } from "../../../contexts/ToastContext";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import FeatureActionButton from "../../../shared/components/FeatureActionButton";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";
import { ColumnPickerModal } from "../../../shared/components/ColumnPickerModal";
import { subscriberProfileService } from "../services/subscriberProfileService";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import KPIDetailsExpandedRow from "../components/KPIDetailsExpandedRow";

interface Profile {
  id: number;
  name: string;
  description?: string;
  dataSource: string;
  is_active?: boolean;
  default_value?: string;
}

export default function SubscriberProfileListPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<{ id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [clearFiltersKey, setClearFiltersKey] = useState(0);

  const tableColumns: TableColumn<Profile>[] = [

    {
      id: "name",
      label: t.kpis.fieldName,
      visible: true,
      filterConfig: { type: "text" },
      render: (_, row) => row.name,
    },
    {
      id: "dataSource",
      label: t.common.category,
      visible: true,
      filterConfig: { type: "text" },
      render: (_, row) => row.dataSource,
    },
    {
      id: "is_active",
      label: t.common.status,
      visible: true,
      filterConfig: { type: "select", options: [t.common.active, t.common.inactive] },
      render: (_, row) => row.is_active ? t.common.active : t.common.inactive,
    },
    {
      id: "default_value",
      label: t.kpis.defaultValue,
      visible: true,
      filterConfig: { type: "text" },
      render: (_, row) => row.default_value,
    },
    {
      id: "actions",
      label: t.common.actions,
      visible: true,
      sortable: false,
      isActionColumn: true,
      render: (_, row) => (
        <div className="flex gap-1 justify-center items-center">
          <ActivateDeactivateButton
            isActive={row.is_active ?? true}
            onToggle={() => handleToggleActive(row)}
            disabled={toggling === row.id || isDeleting}
            isLoading={toggling === row.id}
          />
          <button
            onClick={() => handleViewDetails(row)}
            className={`p-0 icon-edit rounded transition-colors`}
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <FeatureActionButton
            featureId="subscriber-profiles"
            action="edit"
            itemId={row.id}
            variant="icon"
            navigationState={{ parentLabel: "Subscriber Profiles" }}
          />
          <button
            onClick={() => handleDeleteClick(row)}
            className={`p-0 icon-delete ${tw.rounded} disabled:opacity-60`}
            title={t.common.delete}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const {
    columns,
    currentPage: tableCurrentPage,
    pageSize: tablePageSize,
    handlePageChange: tableHandlePageChange,
    handlePageSizeChange: tableHandlePageSizeChange,
    sortConfigs,
    handleSort,
    toggleColumn,
    reorderColumns,
    resetToDefaults,
  } = useTable({
    tableId: "subscriber-profiles-table",
    defaultColumns: tableColumns,
    persistToLocalStorage: true,
  });

  // Reset to page 1 when search changes
  useEffect(() => {
    tableHandlePageChange(1);
  }, [searchTerm, tableHandlePageChange]);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setIsLoading(true);
    try {
      const profiles = await subscriberProfileService.getAllProfiles();
      const mappedProfiles: Profile[] = profiles.map((profile) => ({
        id: profile.id,
        name: profile.name,
        description: profile.description || "",
        dataSource: profile.data_source || "DB",
        is_active: profile.is_active ?? true,
        default_value: profile.default_value || "-",
      }));
      setProfiles(mappedProfiles);
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

  const handleViewDetails = (profile: Profile) => {
    navigate(`/dashboard/kpis/subscriber-profiles/${profile.id}`, { state: { parentLabel: "Subscriber Profiles" } });
  };

  const handleFilteredCountChange = (count: number) => {
    // Updates when filters applied in the Table component
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

  const handleToggleActive = async (profile: Profile) => {
    try {
      setToggling(profile.id);
      const newStatus = !(profile.is_active ?? true);

      // Optimistic update
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profile.id ? { ...p, is_active: newStatus } : p
        )
      );

      // Call API
      await subscriberProfileService.toggleProfileStatus(profile.id, newStatus);

      showToast(
        "success",
        `"${profile.name}" has been ${newStatus ? t.common.activated : t.common.deactivated} successfully`
      );
    } catch (err) {
      console.error("Failed to toggle profile status:", err);
      showToast("error", "Failed to update profile status. Please try again.");

      // Revert optimistic update on error
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profile.id ? { ...p, is_active: !(profile.is_active ?? true) } : p
        )
      );
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <BackButton />
        <FeatureActionButton featureId="subscriber-profiles" action="create" />
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
            tableHandlePageChange(1);
          }}
          className="flex-1 min-w-[250px]"
        />
      </div>

      {/* Table */}
      <div className={`${tw.rounded} overflow-hidden`}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner
              variant="modern"
              size="lg"
              color="primary"
              className="mr-3"
            />
            <span className={`${tw.textSecondary}`}>Loading profile fields...</span>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-12">
            <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
              No profile fields found
            </h3>
            <p className={`${tw.textMuted} mb-6`}>
              Try adjusting your search criteria
            </p>
          </div>
        ) : (
          <Table<Profile>
            columns={columns}
            data={filteredProfiles}
            totalItems={filteredProfiles.length}
            currentPage={tableCurrentPage}
            pageSize={tablePageSize}
            isLoading={isLoading}
            onPageChange={tableHandlePageChange}
                onPageSizeChange={tableHandlePageSizeChange}
            onSort={handleSort}
            sortConfigs={sortConfigs}
            expandedRowId={expandedRowId}
            onExpandChange={setExpandedRowId}
            expandedContent={(row) => (
              <KPIDetailsExpandedRow kpi={row} colSpan={columns.filter((c) => c.visible).length} />
            )}
            onFilteredCountChange={handleFilteredCountChange}
            clearFiltersKey={clearFiltersKey}
            onHideColumn={toggleColumn}
            onManageColumnsClick={() => setShowColumnPicker(true)}
            style={{
              headerBackground: color.surface.tableHeader,
              headerTextColor: color.surface.tableHeaderText,
              rowBackground: color.surface.tablebodybg,
              rowSpacing: "0 8px",
            }}
          />
        )}
      </div>

      {/* Pagination */}
      {!isLoading && filteredProfiles.length > 0 && (
        <Pagination
          currentPage={tableCurrentPage}
          pageSize={tablePageSize}
          totalItems={filteredProfiles.length}
          onPageChange={tableHandlePageChange}
                onPageSizeChange={tableHandlePageSizeChange}
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

      {/* Column Picker Modal */}
      <ColumnPickerModal
        isOpen={showColumnPicker}
        columns={columns}
        onClose={() => setShowColumnPicker(false)}
        onToggleColumn={toggleColumn}
        onReorderColumns={reorderColumns}
        onResetToDefaults={resetToDefaults}
      />
    </div>
  );
}
