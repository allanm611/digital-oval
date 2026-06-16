import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Trash2, Tag } from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import Pagination from "../../../shared/components/ui/Pagination";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import FeatureActionButton from "../../../shared/components/FeatureActionButton";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { kpiCategoryService } from "../services/kpiCategoryService";
import KpiCategoryModal, { KpiCategory } from "./KpiCategoryModal";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";

export default function KpiCategoriesListPage() {
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<KpiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<KpiCategory | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [togglingItemId, setTogglingItemId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<KpiCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const tableColumns: TableColumn<KpiCategory>[] = [
    {
      id: "name",
      label: "Name",
      visible: true,
      render: (_, row) => (
        <div className={`text-sm ${tw.tableFirstColumn} ${tw.textPrimary}`}>
          {row.name}
        </div>
      ),
    },
    {
      id: "description",
      label: "Description",
      visible: true,
      render: (_, row) => (
        <div className={`text-sm ${tw.textSecondary} max-w-md`}>
          {row.description || "-"}
        </div>
      ),
    },
    {
      id: "display_order",
      label: "Order",
      visible: true,
      render: (_, row) => (
        <div className={`text-sm ${tw.textSecondary} text-center`}>
          {row.display_order || "0"}
        </div>
      ),
    },
    {
      id: "is_active",
      label: "Status",
      visible: true,
      render: (_, row) => (
        <span className={`text-sm font-medium ${tw.textSecondary} text-center`}>
          {row.is_active ?? true ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      visible: true,
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center justify-center gap-2">
          <ActivateDeactivateButton
            isActive={row.is_active ?? true}
            onToggle={() => handleToggleActive(row)}
            disabled={
              togglingItemId === row.id ||
              (categoryToDelete?.id === row.id && isDeleting)
            }
            isLoading={togglingItemId === row.id}
            title={
              row.is_active
                ? `Deactivate ${row.name}`
                : `Activate ${row.name}`
            }
          />
          <button
            onClick={() => handleEditCategory(row)}
            disabled={
              togglingItemId === row.id ||
              (categoryToDelete?.id === row.id && isDeleting)
            }
            className={`p-2 ${tw.rounded} transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Edit"
          >
            <Edit className="w-4 h-4" style={{ color: color.primary.action }} />
          </button>
          <button
            onClick={() => handleDeleteCategory(row)}
            disabled={
              togglingItemId === row.id ||
              (categoryToDelete?.id === row.id && isDeleting)
            }
            className={`p-2 ${tw.rounded} transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Delete"
          >
            <Trash2 className="w-4 h-4" style={{ color: "#DC2626" }} />
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
    sortConfigs,
    handleSort,
  } = useTable({
    tableId: "kpi-categories-table",
    defaultColumns: tableColumns,
    persistToLocalStorage: true,
  });

  // Fetch categories
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await kpiCategoryService.getKpiCategories();
      setCategories(data as KpiCategory[]);
    } catch (err) {
      console.error("Failed to load KPI categories:", err);
      showError(
        t.genericConfig.error,
        err instanceof Error ? err.message : "Failed to load categories"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = () => {
    setEditingCategory(undefined);
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: KpiCategory) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDeleteCategory = (category: KpiCategory) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    const previousCategories = categories;

    // Optimistic update
    setCategories((prev) =>
      prev.filter((c) => c.id !== categoryToDelete.id)
    );

    try {
      await kpiCategoryService.deleteKpiCategory(categoryToDelete.id as number);
      showToast(
        "Category Deleted",
        `"${categoryToDelete.name}" has been deleted successfully.`
      );
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    } catch (err) {
      console.error("Failed to delete category:", err);
      showError(
        t.genericConfig.error,
        err instanceof Error ? err.message : "Failed to delete category"
      );
      // Revert optimistic update
      setCategories(previousCategories);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (category: KpiCategory) => {
    const newActive = !(category.is_active ?? true);
    setTogglingItemId(category.id as number);
    const previousCategories = categories;

    // Optimistic update
    setCategories((prev) =>
      prev.map((c) =>
        c.id === category.id ? { ...c, is_active: newActive } : c
      )
    );

    try {
      await kpiCategoryService.updateKpiCategory(category.id as number, {
        is_active: newActive,
      });
      showToast(
        newActive ? "Activated" : "Deactivated",
        `"${category.name}" has been ${newActive ? "activated" : "deactivated"}`
      );
    } catch (err) {
      console.error("Failed to update category:", err);
      showError(
        t.genericConfig.error,
        err instanceof Error ? err.message : "Failed to update category"
      );
      // Revert optimistic update
      setCategories(previousCategories);
    } finally {
      setTogglingItemId(null);
    }
  };

  const handleSaveCategory = async (categoryData: KpiCategory) => {
    try {
      setIsSaving(true);
      if (editingCategory) {
        const updated = await kpiCategoryService.updateKpiCategory(
          editingCategory.id as number,
          categoryData
        );
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? updated : c))
        );
        showToast(
          "Category Updated",
          "KPI category updated successfully"
        );
      } else {
        const created = await kpiCategoryService.createKpiCategory(categoryData);
        setCategories((prev) => [created, ...prev]);
        showToast(
          "Category Created",
          "KPI category created successfully"
        );
      }
      setIsModalOpen(false);
      setEditingCategory(undefined);
    } catch (err) {
      console.error("Failed to save category:", err);
      throw err; // Let modal handle error display
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCategories = useMemo(
    () =>
      categories
        .filter((category) =>
          category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
    [categories, searchTerm]
  );


  // Get parent categories (those without a parent_category_id)
  const parentCategories = categories.filter(
    (cat) => !cat.parent_category_id
  );

  const showBackButton = !window.location.pathname.includes("dashboard");

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      {showBackButton && (
        <div className="flex items-center justify-between">
          <BackButton
            showBreadcrumb={true}
            parentLabel="KPIs"
            currentLabel="KPI Categories"
          />
          <FeatureActionButton featureId="kpi-categories" action="create" onClick={handleCreateCategory} />
        </div>
      )}
      {!showBackButton && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className={`text-xl sm:text-2xl font-bold ${tw.textPrimary}`}>
              KPI Categories
            </h1>
            <p className={`text-sm ${tw.textSecondary} mt-2`}>
              Manage categories used to organize KPIs and profile fields
            </p>
          </div>
          <div className="flex gap-3">
            <FeatureActionButton featureId="kpi-categories" action="create" onClick={handleCreateCategory} />
          </div>
        </div>
      )}

      {/* Search */}
      <div className="my-5">
        <SearchInput
          placeholder="Search KPI categories..."
          value={searchTerm}
          onChange={(value) => setSearchTerm(value)}
        />
      </div>

      {/* Table */}
      <div className={`${tw.rounded} overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner
              variant="modern"
              size="lg"
              color="primary"
              className="mr-3"
            />
            <span className={`${tw.textSecondary}`}>Loading categories...</span>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
              {searchTerm ? "No categories found" : "No categories yet"}
            </h3>
            <p className={`${tw.textMuted} mb-6`}>
              {searchTerm
                ? "Try adjusting your search"
                : "Create your first KPI category"}
            </p>
            {!searchTerm && (
              <FeatureActionButton featureId="kpi-categories" action="create" onClick={handleCreateCategory} className="mx-auto" />
            )}
          </div>
        ) : (
          <Table<KpiCategory>
            columns={columns}
            data={filteredCategories}
            totalItems={filteredCategories.length}
            currentPage={tableCurrentPage}
            pageSize={tablePageSize}
            isLoading={loading}
            onPageChange={tableHandlePageChange}
            onSort={handleSort}
            sortConfigs={sortConfigs}
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
      {!loading && filteredCategories.length > 0 && (
        <Pagination
          currentPage={tableCurrentPage}
          pageSize={tablePageSize}
          totalItems={filteredCategories.length}
          onPageChange={tableHandlePageChange}
        />
      )}


      {/* Modal */}
      <KpiCategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(undefined);
        }}
        onSave={handleSaveCategory}
        category={editingCategory}
        parentCategories={parentCategories}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        title="Delete KPI Category"
        description="This will fail if KPIs are using it."
        itemName={categoryToDelete?.name || ""}
        onConfirm={confirmDeleteCategory}
        onClose={() => {
          setShowDeleteModal(false);
          setCategoryToDelete(null);
        }}
        isLoading={isDeleting}
      />
    </div>
  );
}
