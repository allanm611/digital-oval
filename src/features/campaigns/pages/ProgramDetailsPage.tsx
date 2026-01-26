import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Power,
  PowerOff,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Calendar,
  Database,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { color, tw, button } from "../../../shared/utils/utils";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { programService } from "../services/programService";
import { Program } from "../types/program";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import ProgramModal from "../components/ProgramModal";
import CurrencyFormatter from "../../../shared/components/CurrencyFormatter";
import DateFormatter from "../../../shared/components/DateFormatter";

interface Campaign {
  id: number;
  name: string;
  code?: string;
  description?: string;
  status?: string;
  budget_allocated?: string | number;
  budget_spent?: string | number;
}

interface PerformanceData {
  program?: {
    id: number;
    name: string;
    code: string;
  };
  budget?: {
    total: string | number;
    spent: string | number;
    remaining: number;
    utilization_percentage: number;
  };
  campaigns?: {
    total?: number;
    total_campaigns?: string;
    active?: number;
    total_allocated?: string;
    total_spent?: string;
  };
}

export default function ProgramDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [program, setProgram] = useState<Program | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [budgetUtilization, setBudgetUtilization] = useState<{
    budget_total: number;
    budget_spent: number;
    budget_remaining: number;
    utilization_percentage: number;
  } | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [activeCampaignCount, setActiveCampaignCount] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (id) {
      loadProgramDetails();
      loadPerformance(); // Load performance first (includes budget and campaigns data)
      loadCampaigns(); // Also load full campaigns list for display
      loadActiveCampaignCount(); // Load active campaign count
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Load budget utilization after performance is loaded
  useEffect(() => {
    if (performance?.budget) {
      setBudgetUtilization({
        budget_total: parseFloat(String(performance.budget.total || 0)) || 0,
        budget_spent: parseFloat(String(performance.budget.spent || 0)) || 0,
        budget_remaining: Number(performance.budget.remaining || 0),
        utilization_percentage: Number(
          performance.budget.utilization_percentage || 0
        ),
      });
    } else if (program) {
      // Fallback: calculate from program data
      const total = parseFloat(String(program.budget_total || 0)) || 0;
      const spent = parseFloat(String(program.budget_spent || 0)) || 0;
      setBudgetUtilization({
        budget_total: total,
        budget_spent: spent,
        budget_remaining: total - spent,
        utilization_percentage: total > 0 ? (spent / total) * 100 : 0,
      });
    }
  }, [performance, program]);

  const loadProgramDetails = async () => {
    try {
      setIsLoading(true);
      const response = await programService.getProgramById(Number(id), true);
      if (response.success && response.data) {
        setProgram(response.data);
      } else {
        setProgram(response as unknown as Program);
      }
    } catch (error) {
      console.error("Failed to load program:", error);
      showToast("error", t("programs.loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  const loadCampaigns = async () => {
    if (!id) return;
    try {
      setCampaignsLoading(true);
      const response = await programService.getProgramCampaigns(Number(id), {
        limit: 50,
        offset: 0,
        skipCache: true,
      });
      if (response && typeof response === "object" && "data" in response) {
        const data = (response as { data: Campaign[] }).data;
        setCampaigns(data || []);
      }
    } catch (error) {
      console.error("Failed to load program campaigns:", error);
    } finally {
      setCampaignsLoading(false);
    }
  };

  const loadActiveCampaignCount = async () => {
    if (!id) return;
    try {
      const response = await programService.getProgramActiveCampaignCount(
        Number(id),
        true
      );
      if (response && typeof response === "object" && "data" in response) {
        const data = response.data as { active_count?: number; count?: number };
        setActiveCampaignCount(data.active_count ?? data.count ?? null);
      }
    } catch (error) {
      console.error("Failed to load active campaign count:", error);
    }
  };

  const handleRecalculateBudget = async () => {
    if (!id) return;
    try {
      setIsActionLoading(true);
      // TODO: Get actual user ID from auth context
      const userId = 1;
      await programService.recalculateProgramBudget(Number(id), userId);
      showToast("success", t("programs.budgetRecalculateSuccess"));
      await loadProgramDetails();
      await loadPerformance();
    } catch (error) {
      console.error("Failed to recalculate budget:", error);
      showToast("error", t("programs.budgetRecalculateError"));
    } finally {
      setIsActionLoading(false);
    }
  };

  const loadPerformance = async () => {
    if (!id) return;
    try {
      setPerformanceLoading(true);
      const response = await programService.getProgramPerformance(
        Number(id),
        true
      );
      if (response && typeof response === "object" && "data" in response) {
        const data = (response as { data: PerformanceData }).data;
        // Performance endpoint returns: { program, budget, campaigns }
        setPerformance(data);
      }
    } catch (error) {
      console.error("Failed to load program performance:", error);
    } finally {
      setPerformanceLoading(false);
    }
  };

  const handleEdit = () => {
    setIsModalOpen(true);
  };

  const handleProgramSaved = async (programData: {
    name: string;
    code: string;
    description?: string;
    budget_total?: number;
    start_date?: string | null;
    end_date?: string | null;
  }) => {
    if (!id) return;

    try {
      setIsSaving(true);
      // TODO: Get actual user ID from auth context
      const userId = 1;

      // Check if dates changed
      const datesChanged =
        (programData.start_date !== undefined &&
          programData.start_date !==
            (program?.start_date
              ? new Date(program.start_date).toISOString().split("T")[0]
              : "")) ||
        (programData.end_date !== undefined &&
          programData.end_date !==
            (program?.end_date
              ? new Date(program.end_date).toISOString().split("T")[0]
              : ""));

      // Update program details
      await programService.updateProgram(Number(id), {
        name: programData.name,
        code: programData.code,
        description: programData.description,
        budget_total: programData.budget_total,
        updated_by: userId,
      });

      // Update dates separately if they changed
      if (datesChanged) {
        await programService.updateProgramDates(Number(id), {
          start_date: programData.start_date || null,
          end_date: programData.end_date || null,
          updated_by: userId,
        });
      }

      showToast("success", t("programs.updateSuccess"));
      setIsModalOpen(false);
      await loadProgramDetails();
      await loadPerformance(); // Reload performance data
    } catch (error) {
      console.error("Failed to update program:", error);
      showToast("error", t("programs.updateError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleBack = () => {
    navigateBackOrFallback(navigate, "/dashboard/programs");
  };

  const handleConfirmDelete = async () => {
    if (!id || !program) return;

    try {
      setIsActionLoading(true);
      await programService.deleteProgram(Number(id));
      showToast("success", t("programs.deleteSuccess", { name: program.name }));
      navigate("/dashboard/programs");
    } catch (error) {
      console.error("Failed to delete program:", error);
      showToast("error", t("programs.deleteError"));
    } finally {
      setIsActionLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleToggleActive = async () => {
    if (!id || !program) return;

    try {
      setIsActionLoading(true);
      const userId = 1; // TODO: Get from auth context

      if (program.is_active) {
        await programService.deactivateProgram(Number(id), userId);
        showToast("success", t("programs.deactivateSuccess"));
      } else {
        await programService.activateProgram(Number(id), userId);
        showToast("success", t("programs.activateSuccess"));
      }

      await loadProgramDetails();
    } catch (error) {
      console.error("Failed to toggle program status:", error);
      showToast("error", t("programs.statusError"));
    } finally {
      setIsActionLoading(false);
    }
  };

  // Use DateFormatter component instead of local formatDate function

  // formatCurrency is now handled by CurrencyFormatter component

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner variant="modern" size="xl" color="primary" />
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: color.primary.action }}
          />
          <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
            Program Not Found
          </h3>
          <p className={`${tw.textMuted} mb-6`}>
            The program you are looking for does not exist.
          </p>
          <button
            onClick={handleBack}
            className={`px-4 py-2 ${tw.rounded} font-semibold flex items-center gap-2 mx-auto text-base text-white`}
            style={{ backgroundColor: color.primary.action }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Programs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <BackButton fallbackTo="/dashboard/programs" onClick={handleBack} />
          <div>
            <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
              {program.name}
            </h1>
            <p className={`${tw.textSecondary} mt-2 text-sm`}>
              {program.description || "Program details and information"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleEdit}
            disabled={isActionLoading}
            className={`${tw.rounded} font-semibold flex items-center gap-2 text-sm disabled:opacity-50 transition-colors`}
            style={{
              backgroundColor: button.action.background,
              color: button.action.color,
              paddingTop: button.action.paddingY,
              paddingBottom: button.action.paddingY,
              paddingLeft: button.action.paddingX,
              paddingRight: button.action.paddingX,
              borderRadius: button.action.borderRadius,
              fontSize: button.action.fontSize,
            }}
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={handleToggleActive}
            disabled={isActionLoading}
            className={`px-4 py-2 ${tw.rounded} font-semibold flex items-center gap-2 text-sm disabled:opacity-50 transition-colors bg-white border border-gray-300 text-gray-700`}
          >
            {program.is_active ? (
              <PowerOff className="w-4 h-4" />
            ) : (
              <Power className="w-4 h-4" />
            )}
            {program.is_active ? "Deactivate" : "Activate"}
          </button>
          <button
            onClick={handleDelete}
            disabled={isActionLoading}
            className={`px-4 py-2 ${tw.rounded} font-semibold flex items-center gap-2 text-sm disabled:opacity-50 bg-white text-red-600 border border-red-200`}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-full flex items-center justify-center"
              style={{ backgroundColor: color.tertiary.tag1 }}
            >
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-black">
                <CurrencyFormatter
                  amount={
                    budgetUtilization?.budget_total || program.budget_total
                  }
                />
              </p>
              <p className={`${tw.cardSubHeading} ${tw.textSecondary}`}>
                Total Budget
              </p>
            </div>
          </div>
        </div>
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-full flex items-center justify-center"
              style={{ backgroundColor: color.tertiary.tag2 }}
            >
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-black">
                <CurrencyFormatter
                  amount={
                    budgetUtilization?.budget_spent || program.budget_spent
                  }
                />
              </p>
              <p className={`${tw.cardSubHeading} ${tw.textSecondary}`}>
                Budget Spent
              </p>
            </div>
          </div>
        </div>
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-full flex items-center justify-center"
              style={{ backgroundColor: color.tertiary.tag3 }}
            >
              <Database className="h-5 w-5 text-white" />
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-black">
                {campaignsLoading || performanceLoading
                  ? "..."
                  : (activeCampaignCount !== null
                      ? activeCampaignCount
                      : performance?.campaigns?.total ||
                        performance?.campaigns?.total_campaigns ||
                        campaigns.length
                    ).toLocaleString()}
              </p>
              <p className={`${tw.cardSubHeading} ${tw.textSecondary}`}>
                Campaigns
                {activeCampaignCount !== null && (
                  <span className="text-xs ml-1">
                    ({activeCampaignCount} active)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-full flex items-center justify-center"
              style={{ backgroundColor: color.tertiary.tag4 }}
            >
              {program.is_active ? (
                <CheckCircle className="h-5 w-5 text-white" />
              ) : (
                <XCircle className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-black">
                {program.is_active ? "Active" : "Inactive"}
              </p>
              <p className={`${tw.cardSubHeading} ${tw.textSecondary}`}>
                Status
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Program Information */}
      <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
        <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
          Program Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              className={`text-sm font-medium ${tw.textSecondary} block mb-1`}
            >
              Program Name
            </label>
            <p className={`text-base ${tw.textPrimary}`}>{program.name}</p>
          </div>
          <div>
            <label
              className={`text-sm font-medium ${tw.textSecondary} block mb-1`}
            >
              Program Code
            </label>
            <p className={`text-base ${tw.textPrimary}`}>{program.code}</p>
          </div>
          {program.description && (
            <div className="md:col-span-2">
              <label
                className={`text-sm font-medium ${tw.textSecondary} block mb-1`}
              >
                Description
              </label>
              <p className={`text-base ${tw.textPrimary}`}>
                {program.description}
              </p>
            </div>
          )}
          <div>
            <label
              className={`text-sm font-medium ${tw.textSecondary} block mb-1`}
            >
              Start Date
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <p className={`text-base ${tw.textPrimary}`}>
                {program.start_date ? (
                  <DateFormatter
                    date={program.start_date}
                    useLocale
                    year="numeric"
                    month="long"
                    day="numeric"
                  />
                ) : (
                  "N/A"
                )}
              </p>
            </div>
          </div>
          <div>
            <label
              className={`text-sm font-medium ${tw.textSecondary} block mb-1`}
            >
              End Date
            </label>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <p className={`text-base ${tw.textPrimary}`}>
                {program.end_date ? (
                  <DateFormatter
                    date={program.end_date}
                    useLocale
                    year="numeric"
                    month="long"
                    day="numeric"
                  />
                ) : (
                  "N/A"
                )}
              </p>
            </div>
          </div>
          {program.program_type && (
            <div>
              <label
                className={`text-sm font-medium ${tw.textSecondary} block mb-1`}
              >
                Program Type
              </label>
              <p className={`text-base ${tw.textPrimary}`}>
                {program.program_type}
              </p>
            </div>
          )}
          <div>
            <label
              className={`text-sm font-medium ${tw.textSecondary} block mb-1`}
            >
              Created At
            </label>
            <p className={`text-base ${tw.textPrimary}`}>
              {program.created_at ? (
                <DateFormatter
                  date={program.created_at}
                  useLocale
                  year="numeric"
                  month="long"
                  day="numeric"
                />
              ) : (
                "N/A"
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Budget Utilization */}
      {budgetUtilization && (
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${tw.textPrimary}`}>
              Budget Utilization
            </h2>
            <button
              onClick={handleRecalculateBudget}
              disabled={isActionLoading}
              className={`px-3 py-1.5 ${tw.rounded} font-medium flex items-center gap-2 text-sm disabled:opacity-50 bg-white border border-gray-300 text-gray-700`}
            >
              <RefreshCw className="w-4 h-4" />
              Recalculate Budget
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className={`text-sm ${tw.textSecondary}`}>
                  Utilization:{" "}
                  {budgetUtilization.utilization_percentage.toFixed(1)}%
                </span>
                <span className={`text-sm ${tw.textSecondary}`}>
                  <CurrencyFormatter amount={budgetUtilization.budget_spent} />{" "}
                  /{" "}
                  <CurrencyFormatter amount={budgetUtilization.budget_total} />
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      budgetUtilization.utilization_percentage,
                      100
                    )}%`,
                    backgroundColor: color.primary.accent,
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <p className={`text-sm ${tw.textSecondary} mb-1`}>
                  Total Budget
                </p>
                <p className={`text-lg font-semibold ${tw.textPrimary}`}>
                  <CurrencyFormatter amount={budgetUtilization.budget_total} />
                </p>
              </div>
              <div>
                <p className={`text-sm ${tw.textSecondary} mb-1`}>Spent</p>
                <p className={`text-lg font-semibold ${tw.textPrimary}`}>
                  <CurrencyFormatter amount={budgetUtilization.budget_spent} />
                </p>
              </div>
              <div>
                <p className={`text-sm ${tw.textSecondary} mb-1`}>Remaining</p>
                <p className={`text-lg font-semibold ${tw.textPrimary}`}>
                  <CurrencyFormatter
                    amount={budgetUtilization.budget_remaining}
                  />
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns */}
      <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
        <h2 className={`text-lg font-semibold ${tw.textPrimary} mb-4`}>
          Campaigns (
          {activeCampaignCount !== null
            ? `${activeCampaignCount} active / ${
                performance?.campaigns?.total ||
                performance?.campaigns?.total_campaigns ||
                campaigns.length
              } total`
            : performance?.campaigns?.total ||
              performance?.campaigns?.total_campaigns ||
              campaigns.length}
          )
        </h2>
        {campaignsLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner variant="modern" size="md" color="primary" />
          </div>
        ) : campaigns.length === 0 ? (
          <p className={`text-center py-8 ${tw.textMuted}`}>
            No campaigns in this program
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table
              className={`w-full border border-gray-200 ${tw.rounded} overflow-hidden`}
            >
              <thead
                className={`border-b ${tw.borderDefault}`}
                style={{ background: color.surface.tableHeader }}
              >
                <tr>
                  <th
                    className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider`}
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Campaign
                  </th>
                  <th
                    className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider`}
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Code
                  </th>
                  <th
                    className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider`}
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Budget
                  </th>
                  <th
                    className={`px-6 py-4 text-center text-xs font-medium uppercase tracking-wider`}
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Status
                  </th>
                  <th
                    className={`px-6 py-4 text-right text-xs font-medium uppercase tracking-wider`}
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="hover:bg-gray-50/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div>
                          <button
                            onClick={() =>
                              navigate(`/dashboard/campaigns/${campaign.id}`)
                            }
                            className={`text-base font-semibold ${tw.textPrimary} hover:underline`}
                          >
                            {campaign.name}
                          </button>
                          {campaign.description && (
                            <div className={`text-sm ${tw.textMuted} mt-1`}>
                              {campaign.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm ${tw.textSecondary}`}>
                        {campaign.code || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm ${tw.textPrimary}`}>
                        {campaign.budget_allocated ? (
                          <CurrencyFormatter
                            amount={campaign.budget_allocated}
                          />
                        ) : (
                          "-"
                        )}
                      </div>
                      {campaign.budget_spent && (
                        <div className={`text-xs ${tw.textMuted}`}>
                          Spent:{" "}
                          <CurrencyFormatter amount={campaign.budget_spent} />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className="inline-flex px-2 py-1 text-xs font-medium rounded-full text-white"
                        style={{
                          backgroundColor: color.primary.accent,
                        }}
                      >
                        {campaign.status || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() =>
                            navigate(`/dashboard/campaigns/${campaign.id}`)
                          }
                          className={`p-2 ${tw.rounded} transition-colors`}
                          style={{
                            color: color.primary.action,
                            backgroundColor: "transparent",
                          }}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
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

      <ProgramModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        program={program || undefined}
        onSave={handleProgramSaved}
        isSaving={isSaving}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Program"
        description="This action cannot be undone."
        itemName={program.name}
        isLoading={isActionLoading}
      />
    </div>
  );
}
