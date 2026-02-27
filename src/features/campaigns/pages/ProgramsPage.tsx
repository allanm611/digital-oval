import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  ArrowLeft,
  Database,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Filter,
} from "lucide-react";
import CreateButton from "../../../shared/components/ui/CreateButton";
import { color, tw, button } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Pagination from "../../../shared/components/ui/Pagination";
import { programService } from "../services/programService";
import { Program } from "../types/program";
import ProgramModal from "../components/ProgramModal";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import CurrencyFormatter from "../../../shared/components/CurrencyFormatter";

const PAGE_SIZE = 20;

export default function ProgramsPage() {
  
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    inactive: number;
    total_budget: number;
    spent_budget: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<{
    is_active?: boolean | "all";
    program_type?: string;
    created_by?: number;
    end_date_from?: string;
    end_date_to?: string;
  }>({});

  useEffect(() => {
    loadPrograms(true); // Always skip cache to get fresh data
    loadStats();
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filters]);

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const response = await programService.getProgramStats(true);
      if (response && typeof response === "object" && "data" in response) {
        const data = (response as { data: Record<string, unknown> }).data;
        // Parse string values from API response
        const total = parseInt(String(data.total_programs || 0), 10) || 0;
        const active = parseInt(String(data.active_programs || 0), 10) || 0;
        const totalBudget =
          parseFloat(String(data.total_budget_allocated || 0)) || 0;
        const spentBudget =
          parseFloat(String(data.total_budget_spent || 0)) || 0;

        setStats({
          total,
          active,
          inactive: total - active, // Calculate inactive from total - active
          total_budget: totalBudget,
          spent_budget: spentBudget,
        });
      }
    } catch (err) {
      console.error("Failed to load program stats:", err);
      // Fallback: calculate from programs
      const active = programs.filter((p) => p.is_active).length;
      const inactive = programs.filter((p) => !p.is_active).length;
      const totalBudget = programs.reduce(
        (sum, p) => sum + (parseFloat(String(p.budget_total || 0)) || 0),
        0,
      );
      const spentBudget = programs.reduce(
        (sum, p) => sum + (parseFloat(String(p.budget_spent || 0)) || 0),
        0,
      );
      setStats({
        total: programs.length,
        active,
        inactive,
        total_budget: totalBudget,
        spent_budget: spentBudget,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const loadPrograms = async (skipCache = false) => {
    try {
      setLoading(true);
      // Check if we have any filters applied
      const hasFilters =
        Object.keys(filters).length > 0 &&
        Object.values(filters).some(
          (v) => v !== undefined && v !== "" && v !== "all",
        );

      let response;
      if (hasFilters || searchTerm) {
        // Use advanced search if filters or search term exist
        response = await programService.advancedSearchPrograms({
          name: searchTerm || undefined,
          is_active:
            filters.is_active === "all"
              ? undefined
              : (filters.is_active as boolean | undefined),
          program_type: filters.program_type || undefined,
          created_by: filters.created_by || undefined,
          end_date_from: filters.end_date_from || undefined,
          end_date_to: filters.end_date_to || undefined,
          limit: 100,
          offset: 0,
          skipCache: skipCache,
        });
      } else {
        // Use regular getAllPrograms if no filters
        response = await programService.getAllPrograms({
          limit: 100,
          offset: 0,
          skipCache: skipCache,
        });
      }
      setPrograms(response.data || []);
    } catch (err) {
      console.error("Failed to load programs:", err);
      showError("Failed to load programs");
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsClosingModal(true);
    setTimeout(() => {
      setShowAdvancedFilters(false);
      setIsClosingModal(false);
    }, 300);
  };

  const handleFilterChange = (
    key: keyof typeof filters,
    value: boolean | "all" | string | number | undefined,
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm("");
  };

  const handleCreateProgram = () => {
    setEditingProgram(undefined);
    setIsModalOpen(true);
  };

  const handleEditProgram = (program: Program) => {
    setEditingProgram(program);
    setIsModalOpen(true);
  };

  const handleDeleteProgram = (program: Program) => {
    setProgramToDelete(program);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!programToDelete) return;

    setIsDeleting(true);
    try {
      await programService.deleteProgram(Number(programToDelete.id));
      showToast(`Program "${programToDelete.name}" deleted successfully!`);
      setShowDeleteModal(false);
      setProgramToDelete(null);
      await loadPrograms(true);
      await loadStats();
    } catch (err) {
      console.error("Failed to delete program:", err);
      showError("Failed to delete program", "Please try again later.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setProgramToDelete(null);
  };

  const handleProgramSaved = async (programData: {
    name: string;
    code: string;
    description?: string;
    budget_total?: number;
    start_date?: string | null;
    end_date?: string | null;
  }) => {
    try {
      setIsSaving(true);
      // TODO: Get actual user ID from auth context
      const userId = 1;

      if (editingProgram) {
        // Check if dates changed
        const datesChanged =
          (programData.start_date !== undefined &&
            programData.start_date !==
              (editingProgram.start_date
                ? new Date(editingProgram.start_date)
                    .toISOString()
                    .split("T")[0]
                : "")) ||
          (programData.end_date !== undefined &&
            programData.end_date !==
              (editingProgram.end_date
                ? new Date(editingProgram.end_date).toISOString().split("T")[0]
                : ""));

        // Update existing program
        await programService.updateProgram(Number(editingProgram.id), {
          name: programData.name,
          code: programData.code,
          description: programData.description,
          budget_total: programData.budget_total,
        });

        // Update dates separately if they changed
        if (datesChanged) {
          await programService.updateProgramDates(Number(editingProgram.id), {
            start_date: programData.start_date || null,
            end_date: programData.end_date || null,
            updated_by: userId,
          });
        }

        showToast("Program updated successfully!");
      } else {
        // Create new program
        await programService.createProgram({
          name: programData.name,
          code: programData.code,
          description: programData.description,
          budget_total: programData.budget_total,
          start_date: programData.start_date || null,
          end_date: programData.end_date || null,
          created_by: userId,
        });
        showToast("Program created successfully!");
      }
      setIsModalOpen(false);
      setEditingProgram(undefined);
      await loadPrograms(true); // Skip cache to get fresh data
      await loadStats(); // Reload stats after creating/updating
    } catch (err) {
      console.error("Failed to save program:", err);
      const errorMessage = err instanceof Error ? err.message : "Please try again later.";
      showError("Failed to save program", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPrograms = (programs || [])
    .filter(
      (program) =>
        program?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (program?.description &&
          program.description.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    .sort((a, b) => {
      // Sort by created_at in descending order (newest first)
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });

  const paginatedPrograms = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return filteredPrograms.slice(startIndex, endIndex);
  }, [filteredPrograms, currentPage]);

  const programStatsCards = [
    {
      name: t.programs.totalPrograms,
      value: statsLoading ? "..." : (stats?.total || 0).toLocaleString(),
      icon: Database,
      color: color.tertiary.tag1,
    },
    {
      name: t.programs.activePrograms,
      value: statsLoading ? "..." : (stats?.active || 0).toLocaleString(),
      icon: CheckCircle,
      color: color.tertiary.tag4,
    },
    {
      name: t.programs.totalBudget,
      value: statsLoading ? (
        "..."
      ) : (
        <CurrencyFormatter amount={stats?.total_budget || 0} />
      ),
      icon: DollarSign,
      color: color.tertiary.tag2,
    },
    {
      name: t.programs.spentBudget,
      value: statsLoading ? (
        "..."
      ) : (
        <CurrencyFormatter amount={stats?.spent_budget || 0} />
      ),
      icon: TrendingUp,
      color: color.tertiary.tag3,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* <button
            onClick={() => navigate("/dashboard/configuration")}
            className={`p-2 text-gray-600 hover:text-gray-800 ${tw.rounded} transition-colors`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button> */}
          <div>
            <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
              {t.programs.title}
            </h1>
            <p className={`${tw.textSecondary} mt-2 text-sm`}>
              {t.programs.subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CreateButton onClick={handleCreateProgram} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {programStatsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={`stat-${index}`}
              className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
            >
              <div className="flex items-center gap-2">
                <Icon
                  className="h-5 w-5"
                  style={{ color: color.primary.accent }}
                />
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="my-5">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[${color.text.muted}]`}
            />
            <input
              type="text"
              placeholder={t.programs.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 text-sm border border-[${color.border.default}] ${tw.rounded} focus:outline-none`}
            />
          </div>
          <button
            onClick={() => setShowAdvancedFilters(true)}
            className={`flex items-center justify-center gap-2 ${tw.rounded} transition-colors font-medium whitespace-nowrap sm:w-auto w-full`}
            style={{
              backgroundColor: button.secondaryAction.background,
              color: button.secondaryAction.color,
              border: button.secondaryAction.border,
              padding: `${button.secondaryAction.paddingY} ${button.secondaryAction.paddingX}`,
              borderRadius: button.secondaryAction.borderRadius,
              fontSize: button.secondaryAction.fontSize,
            }}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      <div
        className={` ${tw.rounded} border border-[${color.border.default}] overflow-hidden`}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner
              variant="modern"
              size="lg"
              color="primary"
              className="mr-3"
            />
            <span className={`${tw.textSecondary}`}>{t.programs.loading}</span>
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-center py-12">
            <h3 className={`${tw.cardHeading} ${tw.textPrimary} mb-1`}>
              {t.programs.noPrograms}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {searchTerm
                ? "Try adjusting your search terms."
                : "Create your first program to get started."}
            </p>
            {!searchTerm && (
              <CreateButton onClick={handleCreateProgram} className="mx-auto" />
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table
                className="w-full min-w-[720px]"
                style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
              >
                <thead style={{ background: color.surface.tableHeader }}>
                  <tr>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Program
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Description
                    </th>
                    <th
                      className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Status
                    </th>
                    <th
                      className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider"
                      style={{ color: color.surface.tableHeaderText }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPrograms.map((program) => (
                    <tr key={program.id} className="transition-colors">
                      <td
                        className="px-6 py-4"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div
                          className={`${tw.tableFirstColumn} ${tw.textPrimary}`}
                        >
                          {program.name}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div className={`text-sm ${tw.textSecondary}`}>
                          {program.description || "No description"}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 text-center"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <span className={`text-sm ${tw.textPrimary}`}>
                          {program.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-right"
                        style={{ backgroundColor: color.surface.tablebodybg }}
                      >
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditProgram(program)}
                            className={`p-2 ${tw.rounded} transition-colors`}
                            style={{
                              color: color.primary.action,
                              backgroundColor: "transparent",
                            }}
                            onMouseEnter={(e) => {
                              (
                                e.target as HTMLButtonElement
                              ).style.backgroundColor =
                                `${color.primary.action}10`;
                            }}
                            onMouseLeave={(e) => {
                              (
                                e.target as HTMLButtonElement
                              ).style.backgroundColor = "transparent";
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProgram(program)}
                            className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-colors`}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!loading && filteredPrograms.length > 0 && (
              <Pagination
                currentPage={currentPage}
                pageSize={PAGE_SIZE}
                totalItems={filteredPrograms.length}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>

      <ProgramModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProgram(undefined);
        }}
        program={editingProgram}
        onSave={handleProgramSaved}
        isSaving={isSaving}
      />

      {/* Advanced Filters Side Panel */}
      {(showAdvancedFilters || isClosingModal) &&
        createPortal(
          <div
            className={`fixed inset-0 z-[9999] overflow-hidden ${
              isClosingModal
                ? "animate-out fade-out duration-300"
                : "animate-in fade-in duration-300"
            }`}
          >
            <div
              className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
              onClick={handleCloseModal}
            ></div>
            <div
              className={`absolute right-0 top-0 h-full w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
                isClosingModal ? "translate-x-full" : "translate-x-0"
              }`}
            >
              <div className={`p-6 border-b ${tw.borderDefault}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Filter Programs
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className={`p-2 ${tw.textMuted} ${tw.rounded} transition-colors`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
                {/* Status Filter */}
                <div>
                  <label
                    className={`block text-sm font-medium ${tw.textPrimary} mb-3`}
                  >
                    Status
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: "all", label: "All Status" },
                      { value: true, label: "Active" },
                      { value: false, label: "Inactive" },
                    ].map((option) => (
                      <label
                        key={String(option.value)}
                        className="flex items-center"
                      >
                        <input
                          type="radio"
                          name="status"
                          value={String(option.value)}
                          checked={filters.is_active === option.value}
                          onChange={() =>
                            handleFilterChange(
                              "is_active",
                              option.value === "all" ? "all" : option.value,
                            )
                          }
                          className={`mr-3 text-[${color.primary.action}] focus:ring-[${color.primary.action}]`}
                        />
                        <span className={`text-sm ${tw.textSecondary}`}>
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Program Type Filter */}
                <div>
                  <label
                    className={`block text-sm font-medium ${tw.textPrimary} mb-3`}
                  >
                    Program Type
                  </label>
                  <input
                    type="text"
                    value={filters.program_type || ""}
                    onChange={(e) =>
                      handleFilterChange(
                        "program_type",
                        e.target.value || undefined,
                      )
                    }
                    placeholder="Enter program type"
                    className={`w-full px-3 py-2 text-sm border ${tw.borderDefault} ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-[${color.primary.accent}]/20`}
                  />
                </div>

                {/* Creator Filter */}
                <div>
                  <label
                    className={`block text-sm font-medium ${tw.textPrimary} mb-3`}
                  >
                    Created By (User ID)
                  </label>
                  <input
                    type="number"
                    value={filters.created_by || ""}
                    onChange={(e) =>
                      handleFilterChange(
                        "created_by",
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    placeholder="Enter user ID"
                    className={`w-full px-3 py-2 text-sm border ${tw.borderDefault} ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-[${color.primary.accent}]/20`}
                  />
                </div>

                {/* End Date Range */}
                <div>
                  <label
                    className={`block text-sm font-medium ${tw.textPrimary} mb-3`}
                  >
                    End Date Range
                  </label>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={filters.end_date_from || ""}
                      onChange={(e) =>
                        handleFilterChange(
                          "end_date_from",
                          e.target.value || undefined,
                        )
                      }
                      className={`w-full px-3 py-2 text-sm border ${tw.borderDefault} ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-[${color.primary.accent}]/20`}
                    />
                    <input
                      type="date"
                      value={filters.end_date_to || ""}
                      onChange={(e) =>
                        handleFilterChange(
                          "end_date_to",
                          e.target.value || undefined,
                        )
                      }
                      placeholder="To"
                      className={`w-full px-3 py-2 text-sm border ${tw.borderDefault} ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-[${color.primary.accent}]/20`}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleClearFilters}
                    className={`flex-1 px-4 py-2 text-sm border border-gray-300 ${tw.textSecondary} ${tw.rounded} transition-colors`}
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => {
                      loadPrograms(true);
                      handleCloseModal();
                    }}
                    className={`${tw.button} flex-1 px-4 py-2 text-sm`}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Program"
        description="Are you sure you want to delete this program? This action cannot be undone."
        itemName={programToDelete?.name || ""}
        isLoading={isDeleting}
        confirmText="Delete Program"
        cancelText="Cancel"
      />
    </div>
  );
}
