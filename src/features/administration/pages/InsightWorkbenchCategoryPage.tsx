import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  AlertCircle,
  ArrowUpRight,
  CalendarClock,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  FileCode2,
  Files,
  FlaskConical,
  MoreVertical,
  Play,
  Plus,
  SearchX,
  Send,
  Trash2,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import BackButton from "../../../shared/components/ui/BackButton";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import RegularModal from "../../../shared/components/ui/RegularModal";
import SearchInput from "../../../shared/components/ui/SearchInput";
import SegmentedTabs from "../../../shared/components/ui/SegmentedTabs";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import { INSIGHT_WORKBENCH_CATALOG } from "../constants/insightWorkbenchCatalog";
import { insightWorkbenchService } from "../services/insightWorkbenchService";
import type {
  WorkbenchModelStatus,
  WorkbenchModelSummary,
  WorkbenchTemplate,
} from "../types/insightWorkbench";
import {
  INSIGHT_WORKBENCH_PATH,
  newWorkbenchModelPath,
  workbenchModelPath,
} from "../utils/aiModelNavigation";

type CategoryView = "models" | "templates";
const MENU_ITEM_CLASS =
  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm data-[focus]:bg-[var(--c-interactive-hover)] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value?: string): string {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function statusClasses(status: WorkbenchModelStatus): string {
  if (status === "Ready") return "bg-emerald-50 text-emerald-700";
  if (status === "Running") return "bg-blue-50 text-blue-700";
  if (status === "Failed") return "bg-red-50 text-red-700";
  return "bg-amber-50 text-amber-700";
}

function toDateTimeInput(value?: string): string {
  const date = value ? new Date(value) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function InsightWorkbenchCategoryPage() {
  const { categorySlug = "" } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [models, setModels] = useState<WorkbenchModelSummary[]>([]);
  const [templates, setTemplates] = useState<WorkbenchTemplate[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busyModelId, setBusyModelId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] =
    useState<WorkbenchModelSummary | null>(null);
  const [pendingSchedule, setPendingSchedule] =
    useState<WorkbenchModelSummary | null>(null);
  const [scheduleValue, setScheduleValue] = useState("");
  const category = INSIGHT_WORKBENCH_CATALOG.find(
    ({ slug }) => slug === categorySlug,
  );
  const view: CategoryView =
    searchParams.get("view") === "templates" ? "templates" : "models";

  useEffect(() => {
    if (!category) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setLoadError("");
    Promise.all([
      insightWorkbenchService.listModels(category.slug, controller.signal),
      insightWorkbenchService.listTemplates(category.slug, controller.signal),
    ])
      .then(([nextModels, nextTemplates]) => {
        setModels(nextModels);
        setTemplates(nextTemplates);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "Could not load this workbench category",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [category]);

  const filteredModels = useMemo(() => {
    const term = search.trim().toLowerCase();
    return models.filter(
      (model) =>
        !term ||
        model.name.toLowerCase().includes(term) ||
        model.description.toLowerCase().includes(term) ||
        model.lastModifiedBy.toLowerCase().includes(term),
    );
  }, [models, search]);

  const filteredTemplates = useMemo(() => {
    const term = search.trim().toLowerCase();
    return templates.filter(
      (template) =>
        !term ||
        template.name.toLowerCase().includes(term) ||
        template.description.toLowerCase().includes(term),
    );
  }, [search, templates]);

  const setView = (nextView: CategoryView) => {
    const next = new URLSearchParams(searchParams);
    if (nextView === "models") next.delete("view");
    else next.set("view", nextView);
    setSearchParams(next, { replace: true });
    setSearch("");
  };

  const handleRun = async (model: WorkbenchModelSummary) => {
    setBusyModelId(model.id);
    setModels((current) =>
      current.map((item) =>
        item.id === model.id ? { ...item, status: "Running" } : item,
      ),
    );
    try {
      await insightWorkbenchService.runModel(model.id);
      const completedAt = new Date().toISOString();
      setModels((current) =>
        current.map((item) =>
          item.id === model.id
            ? { ...item, status: "Ready", lastRunAt: completedAt }
            : item,
        ),
      );
      success("Run completed", `${model.name} completed successfully`);
    } catch (error: unknown) {
      setModels((current) =>
        current.map((item) => (item.id === model.id ? model : item)),
      );
      showError(
        "Run failed",
        error instanceof Error ? error.message : "The model could not be run",
      );
    } finally {
      setBusyModelId(null);
    }
  };

  const handleDuplicate = async (model: WorkbenchModelSummary) => {
    setBusyModelId(model.id);
    try {
      const duplicate = await insightWorkbenchService.duplicateModel(model);
      setModels((current) => [duplicate, ...current]);
      success("Model duplicated", `${duplicate.name} was created as a draft`);
    } catch (error: unknown) {
      showError(
        "Duplicate failed",
        error instanceof Error
          ? error.message
          : "The model could not be duplicated",
      );
    } finally {
      setBusyModelId(null);
    }
  };

  const handlePublish = async (model: WorkbenchModelSummary) => {
    setBusyModelId(model.id);
    try {
      await insightWorkbenchService.publishModel(model.id);
      success(
        "Insight published",
        `${model.name} is now available in AI Powered Insights`,
      );
    } catch (error: unknown) {
      showError(
        "Publish failed",
        error instanceof Error
          ? error.message
          : "The insight could not be published",
      );
    } finally {
      setBusyModelId(null);
    }
  };

  const handleSchedule = async () => {
    if (!pendingSchedule) return;
    const runAt = new Date(scheduleValue);
    if (!scheduleValue || Number.isNaN(runAt.getTime())) {
      showError("Invalid schedule", "Choose a valid date and time");
      return;
    }
    setBusyModelId(pendingSchedule.id);
    try {
      const nextRunAt = runAt.toISOString();
      await insightWorkbenchService.scheduleModel(
        pendingSchedule.id,
        nextRunAt,
      );
      setModels((current) =>
        current.map((item) =>
          item.id === pendingSchedule.id ? { ...item, nextRunAt } : item,
        ),
      );
      success("Schedule updated", `${pendingSchedule.name} will run as scheduled`);
      setPendingSchedule(null);
    } catch (error: unknown) {
      showError(
        "Schedule failed",
        error instanceof Error
          ? error.message
          : "The schedule could not be updated",
      );
    } finally {
      setBusyModelId(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setBusyModelId(pendingDelete.id);
    try {
      await insightWorkbenchService.deleteModel(pendingDelete.id);
      setModels((current) =>
        current.filter(({ id }) => id !== pendingDelete.id),
      );
      success("Model deleted", `${pendingDelete.name} was removed`);
      setPendingDelete(null);
    } catch (error: unknown) {
      showError(
        "Delete failed",
        error instanceof Error ? error.message : "The model could not be deleted",
      );
    } finally {
      setBusyModelId(null);
    }
  };

  const exportModel = (model: WorkbenchModelSummary) => {
    const blob = new Blob([JSON.stringify(model, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${model.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    success("Definition exported", `${model.name} was downloaded as JSON`);
  };

  const copyModelId = async (model: WorkbenchModelSummary) => {
    try {
      await navigator.clipboard.writeText(model.id);
      success("Model ID copied", model.id);
    } catch {
      showError("Copy failed", "Clipboard access is unavailable");
    }
  };

  if (!category) {
    return (
      <div className="space-y-6">
        <BackButton
          showBreadcrumb
          currentLabel="Category not found"
          parentLabel="Insight Workbench"
          parentTo={INSIGHT_WORKBENCH_PATH}
        />
        <div className={`${tw.rounded} border p-10 text-center ${tw.surfaceCards}`}>
          <AlertCircle className="mx-auto h-10 w-10 text-amber-500" />
          <h1 className={`mt-3 text-lg font-semibold ${tw.textPrimary}`}>
            Workbench category not found
          </h1>
          <p className={`mt-1 text-sm ${tw.textSecondary}`}>
            The category may have been removed or the link is invalid.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <BackButton
          showBreadcrumb
          currentLabel={category.name}
          parentLabel="Insight Workbench"
          parentTo={INSIGHT_WORKBENCH_PATH}
        />
        <button
          type="button"
          onClick={() => navigate(newWorkbenchModelPath(category.slug))}
          className={`${tw.button} inline-flex items-center justify-center gap-2`}
        >
          <Plus className="h-4 w-4" />
          Create new model
        </button>
      </div>

      <section
        className={`${tw.rounded} border p-5`}
        style={{
          borderColor: color.border.default,
          backgroundColor: color.surface.cards,
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <FlaskConical
                className="h-5 w-5"
                style={{ color: color.primary.accent }}
              />
              <span className={`text-xs font-semibold uppercase tracking-wide ${tw.textMuted}`}>
                Analytics category
              </span>
            </div>
            <h1 className={`mt-2 text-2xl font-bold ${tw.textPrimary}`}>
              {category.name}
            </h1>
            <p className={`mt-2 text-sm leading-6 ${tw.textSecondary}`}>
              {category.description}
            </p>
          </div>
          {insightWorkbenchService.isDemoMode() && (
            <span
              className={`${tw.rounded} border px-3 py-1 text-xs font-medium`}
              style={{
                borderColor: color.border.accent,
                color: color.primary.accent,
                backgroundColor: color.primary.background,
              }}
            >
              Demo data
            </span>
          )}
        </div>
      </section>

      <section
        className={`${tw.rounded} overflow-hidden border`}
        style={{
          borderColor: color.border.default,
          backgroundColor: color.surface.cards,
        }}
      >
        <div className="flex flex-col gap-4 border-b p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <SegmentedTabs
            items={[
              { id: "models", label: `Models (${models.length})` },
              { id: "templates", label: `Templates (${templates.length})` },
            ]}
            value={view}
            onChange={setView}
            ariaLabel={`${category.name} content`}
          />
          <div className="w-full lg:w-80">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={`Search ${view}`}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner variant="modern" size="lg" color="primary" />
          </div>
        ) : loadError ? (
          <div className="px-6 py-14 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
            <p className="mt-3 text-sm font-medium text-red-700">{loadError}</p>
          </div>
        ) : view === "models" ? (
          filteredModels.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-[920px] w-full text-left">
                <thead style={{ backgroundColor: color.surface.tableHeader }}>
                  <tr className={`text-xs ${tw.textSecondary}`}>
                    {[
                      "Name",
                      "Status",
                      "Language",
                      "Last modified",
                      "Modified by",
                      "Last run",
                      "Next run",
                      "",
                    ].map((heading) => (
                      <th key={heading} className="px-4 py-3 font-medium">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredModels.map((model) => (
                    <tr
                      key={model.id}
                      className="border-t"
                      style={{ borderColor: color.border.muted }}
                    >
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => navigate(workbenchModelPath(model.id))}
                          className={`font-semibold hover:underline ${tw.link}`}
                        >
                          {model.name}
                        </button>
                        <p className={`mt-1 max-w-xs truncate text-xs ${tw.textSecondary}`}>
                          {model.description}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`${tw.rounded} px-2 py-1 text-xs font-medium ${statusClasses(model.status)}`}>
                          {model.status}
                        </span>
                      </td>
                      <td className={`px-4 py-4 text-sm ${tw.textPrimary}`}>
                        {model.language}
                      </td>
                      <td className={`px-4 py-4 text-xs ${tw.textSecondary}`}>
                        {formatDate(model.lastModifiedAt)}
                      </td>
                      <td className={`px-4 py-4 text-xs ${tw.textSecondary}`}>
                        {model.lastModifiedBy}
                      </td>
                      <td className={`px-4 py-4 text-xs ${tw.textSecondary}`}>
                        {formatDate(model.lastRunAt)}
                      </td>
                      <td className={`px-4 py-4 text-xs ${tw.textSecondary}`}>
                        {formatDate(model.nextRunAt)}
                      </td>
                      <td className="px-4 py-4">
                        <Menu as="div" className="relative">
                          <MenuButton
                            aria-label={`Actions for ${model.name}`}
                            disabled={busyModelId === model.id}
                            className={`${tw.rounded} p-1.5 ${tw.hover} disabled:cursor-wait disabled:opacity-50`}
                          >
                            {busyModelId === model.id ? (
                              <LoadingSpinner
                                variant="modern"
                                size="sm"
                                color="primary"
                              />
                            ) : (
                              <MoreVertical
                                className={`h-4 w-4 ${tw.textSecondary}`}
                              />
                            )}
                          </MenuButton>
                          <MenuItems
                            anchor="bottom end"
                            className={`${tw.rounded} mt-1 w-56 origin-top-right border py-1 shadow-lg focus:outline-none`}
                            style={{
                              zIndex: zIndex.dropdownOpen,
                              borderColor: color.border.default,
                              backgroundColor: color.surface.background,
                              color: color.text.primary,
                            }}
                          >
                            <MenuItem>
                              <button
                                type="button"
                                className={MENU_ITEM_CLASS}
                                onClick={() =>
                                  navigate(workbenchModelPath(model.id))
                                }
                              >
                                <ExternalLink className="h-4 w-4" />
                                Open model
                              </button>
                            </MenuItem>
                            <MenuItem disabled={model.status === "Running"}>
                              <button
                                type="button"
                                className={MENU_ITEM_CLASS}
                                onClick={() => void handleRun(model)}
                              >
                                <Play className="h-4 w-4" />
                                Run now
                              </button>
                            </MenuItem>
                            <MenuItem>
                              <button
                                type="button"
                                className={MENU_ITEM_CLASS}
                                onClick={() => void handleDuplicate(model)}
                              >
                                <Files className="h-4 w-4" />
                                Duplicate
                              </button>
                            </MenuItem>
                            <MenuItem>
                              <button
                                type="button"
                                className={MENU_ITEM_CLASS}
                                onClick={() => {
                                  setPendingSchedule(model);
                                  setScheduleValue(
                                    toDateTimeInput(model.nextRunAt),
                                  );
                                }}
                              >
                                <CalendarClock className="h-4 w-4" />
                                Manage schedule
                              </button>
                            </MenuItem>
                            <MenuItem disabled={model.status !== "Ready"}>
                              <button
                                type="button"
                                className={MENU_ITEM_CLASS}
                                onClick={() => void handlePublish(model)}
                              >
                                <Send className="h-4 w-4" />
                                Publish insight
                              </button>
                            </MenuItem>
                            <div
                              className="my-1 border-t"
                              style={{ borderColor: color.border.muted }}
                            />
                            <MenuItem>
                              <button
                                type="button"
                                className={MENU_ITEM_CLASS}
                                onClick={() => exportModel(model)}
                              >
                                <Download className="h-4 w-4" />
                                Export definition
                              </button>
                            </MenuItem>
                            <MenuItem>
                              <button
                                type="button"
                                className={MENU_ITEM_CLASS}
                                onClick={() => void copyModelId(model)}
                              >
                                <Copy className="h-4 w-4" />
                                Copy model ID
                              </button>
                            </MenuItem>
                            <div
                              className="my-1 border-t"
                              style={{ borderColor: color.border.muted }}
                            />
                            <MenuItem>
                              <button
                                type="button"
                                className={`${MENU_ITEM_CLASS} text-red-600 data-[focus]:bg-red-50`}
                                onClick={() => setPendingDelete(model)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete model
                              </button>
                            </MenuItem>
                          </MenuItems>
                        </Menu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No models found"
              message={models.length ? "Try a different search." : "Create a model or start from a template."}
            />
          )
        ) : filteredTemplates.length ? (
          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredTemplates.map((template) => (
              <article
                key={template.id}
                className={`${tw.rounded} border p-5`}
                style={{
                  borderColor: color.border.default,
                  backgroundColor: color.surface.background,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`${tw.rounded} flex h-10 w-10 items-center justify-center`}
                    style={{ backgroundColor: color.primary.background }}
                  >
                    <FileCode2
                      className="h-5 w-5"
                      style={{ color: color.primary.accent }}
                    />
                  </div>
                  <span className={`text-xs ${tw.textMuted}`}>
                    {template.language}
                  </span>
                </div>
                <h2 className={`mt-4 font-semibold ${tw.textPrimary}`}>
                  {template.name}
                </h2>
                <p className={`mt-2 min-h-12 text-sm leading-5 ${tw.textSecondary}`}>
                  {template.description}
                </p>
                <div className={`mt-4 flex items-center gap-2 text-xs ${tw.textMuted}`}>
                  <Clock3 className="h-3.5 w-3.5" />
                  {template.cellCount} cells · Updated {formatDate(template.updatedAt)}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigate(newWorkbenchModelPath(category.slug, template.id))
                  }
                  className={`mt-5 inline-flex items-center gap-2 text-sm font-semibold ${tw.link}`}
                >
                  Use template
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No templates found"
            message={templates.length ? "Try a different search." : "No templates are available in this category yet."}
          />
        )}
      </section>

      <RegularModal
        isOpen={Boolean(pendingSchedule)}
        onClose={() => {
          if (!busyModelId) setPendingSchedule(null);
        }}
        title={`Schedule ${pendingSchedule?.name || "model"}`}
        size="sm"
      >
        <div className="space-y-5 p-5">
          <div>
            <label
              htmlFor="workbench-next-run"
              className={`mb-2 block text-sm font-medium ${tw.textPrimary}`}
            >
              Next run
            </label>
            <input
              id="workbench-next-run"
              type="datetime-local"
              value={scheduleValue}
              min={toDateTimeInput(new Date().toISOString())}
              onChange={(event) => setScheduleValue(event.target.value)}
              className={`${tw.rounded} w-full border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--c-interactive-focus)] ${tw.textPrimary}`}
              style={{
                borderColor: color.border.default,
                backgroundColor: color.surface.background,
              }}
            />
            <p className={`mt-2 text-xs leading-5 ${tw.textSecondary}`}>
              Production schedules should be stored in UTC with the user’s
              timezone and audit details preserved separately.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPendingSchedule(null)}
              disabled={Boolean(busyModelId)}
              className={`${tw.rounded} border px-4 py-2 text-sm font-medium ${tw.textPrimary}`}
              style={{ borderColor: color.border.default }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSchedule()}
              disabled={Boolean(busyModelId)}
              className={`${tw.button} inline-flex items-center gap-2 disabled:opacity-60`}
            >
              {busyModelId ? (
                <LoadingSpinner variant="modern" size="sm" color="white" />
              ) : (
                <CalendarClock className="h-4 w-4" />
              )}
              Save schedule
            </button>
          </div>
        </div>
      </RegularModal>

      <DeleteConfirmModal
        isOpen={Boolean(pendingDelete)}
        onClose={() => {
          if (!busyModelId) setPendingDelete(null);
        }}
        onConfirm={() => void handleDelete()}
        title="Delete analytical model"
        description="This removes the model definition and its schedule. Published insights and execution history should be retained according to your data-retention policy."
        itemName={pendingDelete?.name}
        isLoading={Boolean(busyModelId)}
      />
    </div>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="px-6 py-16 text-center">
      <SearchX className="mx-auto h-10 w-10 text-gray-300" />
      <h2 className={`mt-3 text-sm font-semibold ${tw.textPrimary}`}>{title}</h2>
      <p className={`mt-1 text-sm ${tw.textSecondary}`}>{message}</p>
    </div>
  );
}
