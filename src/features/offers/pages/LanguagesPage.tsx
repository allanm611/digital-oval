import { useState, useEffect, useCallback } from "react";
import { Edit, Trash2, Plus, Loader2, Power, PowerOff } from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import BackButton from "../../../shared/components/ui/BackButton";
import { color, tw } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Pagination from "../../../shared/components/ui/Pagination";
import { useToast } from "../../../contexts/ToastContext";
import { useConfirm } from "../../../contexts/ConfirmContext";
import { languageService, Language } from "../../configurations/services/languageService";
import { useLanguage } from "../../../contexts/LanguageContext";
import LanguageModal from "../../configurations/components/LanguageModal";

export default function LanguagesPage() {
  const { success: showSuccess, error: showError } = useToast();
  const { confirm } = useConfirm();
  const { t } = useLanguage();

  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);

  const loadLanguages = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await languageService.getLanguages();
      setLanguages(data || []);
    } catch (error) {
      showError("Failed to load languages");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadLanguages();
  }, [loadLanguages]);

  const handleToggleActive = async (language: Language) => {
    setToggling(language.id);
    try {
      await languageService.updateLanguage(language.id, {
        is_active: !language.is_active,
      });
      setLanguages((prev) =>
        prev.map((l) =>
          l.id === language.id ? { ...l, is_active: !l.is_active } : l
        )
      );
      showSuccess(
        `Language ${!language.is_active ? "activated" : "deactivated"} successfully`
      );
    } catch (error) {
      showError(
        "Failed to update language",
        error instanceof Error ? error.message : ""
      );
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (language: Language) => {
    const confirmed = await confirm({
      title: "Delete Language",
      message: `Are you sure you want to delete "${language.name}"? This may affect existing creatives using this language.`,
      type: "danger",
      confirmText: t.genericConfig.delete,
      cancelText: t.genericConfig.cancel,
    });

    if (!confirmed) return;

    setDeleting(language.id);
    try {
      await languageService.deleteLanguage(language.id);
      setLanguages((prev) => prev.filter((l) => l.id !== language.id));
      showSuccess("Language deleted successfully");
    } catch (error) {
      showError("Failed to delete language", error instanceof Error ? error.message : "");
    } finally {
      setDeleting(null);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingLanguage(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (language: Language) => {
    setEditingLanguage(language);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingLanguage(null);
  };

  const handleModalSubmit = async () => {
    await loadLanguages();
    handleModalClose();
  };

  const filteredLanguages = languages.filter(
    (language) =>
      language.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (language.description && language.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (language.language_code && language.language_code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLanguages = filteredLanguages.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-6">
      <BackButton
        fallbackTo="/dashboard/configuration"
        showBreadcrumb={true}
        currentLabel="Languages"
      />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold ${tw.textPrimary}`}>
            Languages
          </h1>
          <p className={`text-sm ${tw.textSecondary} mt-1`}>
            Manage available languages and locales for offer creatives
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors hover:opacity-90`}
          style={{ backgroundColor: color.primary.action }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create
        </button>
      </div>

      <div className="my-5">
        <SearchInput
          placeholder="Search languages by name, code, or description..."
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
            <span className={`${tw.textSecondary}`}>Loading languages...</span>
          </div>
        ) : filteredLanguages.length === 0 ? (
          <div className="text-center py-12">
            <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
              {searchTerm ? "No languages found" : "No languages yet"}
            </h3>
            <p className={`${tw.textMuted} mb-6`}>
              {searchTerm ? "Try adjusting your search terms" : "Create your first language"}
            </p>
            {!searchTerm && (
              <button
                onClick={handleOpenCreateModal}
                className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors hover:opacity-90 mx-auto`}
                style={{ backgroundColor: color.primary.action }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Language
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
                    Code
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    Country
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
                      borderTopRightRadius: "0.375rem",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedLanguages.map((language) => (
                  <tr key={language.id} className="transition-colors">
                    <td
                      className="px-6 py-4"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopLeftRadius: "0.375rem",
                        borderBottomLeftRadius: "0.375rem",
                      }}
                    >
                      <div className={`text-sm ${tw.textPrimary}`}>
                        {language.name}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary} font-mono`}>
                        {language.language_code || "-"}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary}`}>
                        {language.country || "-"}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary}`}>
                        {language.is_active ? "Active" : "Inactive"}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary} max-w-md`}>
                        {language.description || "-"}
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
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(language)}
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
                          onClick={() => handleToggleActive(language)}
                          disabled={toggling === language.id}
                          className={`p-2 ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                          style={{
                            color: language.is_active ? color.primary.action : "inherit",
                            backgroundColor: "transparent",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = `${color.primary.action}10`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                          title={language.is_active ? "Deactivate" : "Activate"}
                        >
                          {toggling === language.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : language.is_active ? (
                            <Power className="w-4 h-4" />
                          ) : (
                            <PowerOff className="w-4 h-4 text-red-600" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(language)}
                          disabled={deleting === language.id}
                          className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                          title="Delete"
                        >
                          {deleting === language.id ? (
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

      {!isLoading && filteredLanguages.length > 0 && (
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredLanguages.length}
          onPageChange={setCurrentPage}
        />
      )}

      <LanguageModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        editingLanguage={editingLanguage}
      />
    </div>
  );
}
