import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Edit, Trash2, Plus, Loader2 } from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import BackButton from "../../../shared/components/ui/BackButton";
import { color, tw, button } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Pagination from "../../../shared/components/ui/Pagination";
import { useToast } from "../../../contexts/ToastContext";
import { useConfirm } from "../../../contexts/ConfirmContext";
import { comboTypeService, ComboType } from "../services/comboTypeService";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function ComboTypesPage() {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  const { confirm } = useConfirm();
  const { t } = useLanguage();

  const [comboTypes, setComboTypes] = useState<ComboType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [deleting, setDeleting] = useState<number | null>(null);

  const loadComboTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await comboTypeService.getAllComboTypes();
      setComboTypes(response.data || []);
    } catch (error) {
      showError("Failed to load combo types");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadComboTypes();
  }, [loadComboTypes]);

  const handleDelete = async (combo: ComboType) => {
    const confirmed = await confirm({
      title: "Delete Combo Type",
      message: `Are you sure you want to delete "${combo.name}"? This action cannot be undone.`,
      type: "danger",
      confirmText: t.genericConfig.delete,
      cancelText: t.genericConfig.cancel,
    });

    if (!confirmed) return;

    setDeleting(combo.id);
    try {
      await comboTypeService.deleteComboType(combo.id);
      setComboTypes((prev) => prev.filter((c) => c.id !== combo.id));
      showSuccess("Combo type deleted successfully");
    } catch (error) {
      showError("Failed to delete combo type", error instanceof Error ? error.message : "");
    } finally {
      setDeleting(null);
    }
  };

  const filteredComboTypes = comboTypes.filter(
    (combo) =>
      combo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (combo.description && combo.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedComboTypes = filteredComboTypes.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-6">
      <BackButton
        fallbackTo="/dashboard/configuration"
        showBreadcrumb={true}
        currentLabel="Combo Types"
      />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold ${tw.textPrimary}`}>
            Combo Types
          </h1>
          <p className={`text-sm ${tw.textSecondary} mt-1`}>
            Define and manage different types of product combinations
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard/combo-types/create")}
          className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors hover:opacity-90`}
          style={{ backgroundColor: color.primary.action }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create
        </button>
      </div>

      <div className="my-5">
        <SearchInput
          placeholder="Search combo types by name or description..."
          value={searchTerm}
          onChange={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
        />
      </div>

      <div
        className={`${tw.rounded} border overflow-hidden`}
        style={{ borderColor: color.border.default }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner variant="modern" size="lg" color="primary" className="mr-3" />
            <span className={`${tw.textSecondary}`}>Loading combo types...</span>
          </div>
        ) : filteredComboTypes.length === 0 ? (
          <div className="text-center py-12">
            <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
              {searchTerm ? "No combo types found" : "No combo types yet"}
            </h3>
            <p className={`${tw.textMuted} mb-6`}>
              {searchTerm ? "Try adjusting your search terms" : "Create your first combo type"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate("/dashboard/combo-types/create")}
                className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors hover:opacity-90 mx-auto`}
                style={{ backgroundColor: color.primary.action }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Combo Type
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full min-w-[720px]"
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
                    Description
                  </th>
                  <th
                    className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Resources
                  </th>
                  <th
                    className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider"
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
                {paginatedComboTypes.map((combo) => (
                  <tr key={combo.id} className="transition-colors">
                    <td
                      className="px-6 py-4"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopLeftRadius: "0.375rem",
                        borderBottomLeftRadius: "0.375rem",
                      }}
                    >
                      <div className={`text-sm ${tw.textPrimary}`}>
                        {combo.name}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary} max-w-md`}>
                        {combo.description || "-"}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 text-center"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className={`text-sm ${tw.textSecondary}`}>
                        {combo.combo_resources?.length || 0}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 text-center"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className={`text-sm ${tw.textSecondary}`}>
                        {combo.is_active ? "Active" : "Inactive"}
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
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => navigate(`/dashboard/combo-types/${combo.id}`)}
                          className={`p-2 ${tw.rounded} transition-colors`}
                          style={{
                            color: color.primary.action,
                            backgroundColor: "transparent",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = `${color.primary.action}10`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/dashboard/combo-types/${combo.id}/edit`)}
                          className={`p-2 ${tw.rounded} transition-colors`}
                          style={{
                            color: color.primary.action,
                            backgroundColor: "transparent",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = `${color.primary.action}10`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(combo)}
                          disabled={deleting === combo.id}
                          className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                          title="Delete"
                        >
                          {deleting === combo.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-red-600" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!isLoading && filteredComboTypes.length > 0 && (
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredComboTypes.length}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

