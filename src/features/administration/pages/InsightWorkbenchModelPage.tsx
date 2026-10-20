import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronsDown,
  ChevronsUp,
  Clock3,
  Copy,
  Database,
  FileCode2,
  Files,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Save,
  Send,
  Server,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useTheme } from "../../../contexts/ThemeContext";
import { useToast } from "../../../contexts/ToastContext";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import RegularModal from "../../../shared/components/ui/RegularModal";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import {
  darkSyntaxHighlight,
  darkTheme,
} from "../../../shared/utils/codemirrorThemes";
import { INSIGHT_WORKBENCH_CATALOG } from "../constants/insightWorkbenchCatalog";
import { insightWorkbenchService } from "../services/insightWorkbenchService";
import type {
  WorkbenchLanguage,
  WorkbenchModel,
  WorkbenchNotebookCell,
  WorkbenchTemplate,
} from "../types/insightWorkbench";
import {
  INSIGHT_WORKBENCH_PATH,
  workbenchCategoryPath,
} from "../utils/aiModelNavigation";

const CELL_MENU_ITEM_CLASS =
  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm data-[focus]:bg-[var(--c-interactive-hover)] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40";

function starterCells(
  language: WorkbenchLanguage,
  template?: WorkbenchTemplate,
): WorkbenchNotebookCell[] {
  return [
    {
      id: "new-cell-1",
      title: "Initialize the analytics runtime",
      language,
      code:
        language === "Python"
          ? `from sentra_sparklib import SparkLib

spark_lib = SparkLib()`
          : language === "R"
            ? `library(SentraSpark)

spark_lib <- SparkLib$new()`
            : `import com.sentra.analytics.SparkLib

val sparkLib = new SparkLib()`,
    },
    {
      id: "new-cell-2",
      title: template?.name || "Explore your data",
      language,
      code:
        language === "Python"
          ? `# Load an approved data asset and begin your analysis
data = spark_lib.getDataFrameWithName("customer_daily_activity")
data.show(5)`
          : "# Add your analysis here",
    },
  ];
}

function createDraftModel(
  categorySlug: string,
  template?: WorkbenchTemplate,
): WorkbenchModel {
  const language = template?.language ?? "Python";
  return {
    id: "new",
    name: template ? `${template.name} copy` : "Untitled analytical model",
    description:
      template?.description ||
      "Describe the business objective and expected output for this model.",
    categorySlug,
    language,
    status: "Draft",
    lastModifiedAt: new Date().toISOString(),
    lastModifiedBy: "Current user",
    runtime: `${language} runtime`,
    engine: "Apache Spark 3.5",
    cells: starterCells(language, template),
  };
}

export default function InsightWorkbenchModelPage() {
  const { modelId = "new" } = useParams();
  const [searchParams] = useSearchParams();
  const { isDark } = useTheme();
  const { success, error: showError } = useToast();
  const [model, setModel] = useState<WorkbenchModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [runningCellId, setRunningCellId] = useState<string | null>(null);
  const [runningAll, setRunningAll] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [renamingCell, setRenamingCell] =
    useState<WorkbenchNotebookCell | null>(null);
  const [cellTitle, setCellTitle] = useState("");
  const isNew = modelId === "new";

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        if (isNew) {
          const categorySlug =
            searchParams.get("category") || "custom-models";
          const templateId = searchParams.get("template");
          let template: WorkbenchTemplate | undefined;
          if (templateId) {
            const templates = await insightWorkbenchService.listTemplates(
              categorySlug,
              controller.signal,
            );
            template = templates.find(({ id }) => id === templateId);
          }
          setModel(createDraftModel(categorySlug, template));
        } else {
          const result = await insightWorkbenchService.getModel(
            modelId,
            controller.signal,
          );
          if (!result) throw new Error("The requested model could not be found");
          setModel(result);
        }
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "Could not load this analytical model",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [isNew, modelId, searchParams]);

  const category = useMemo(
    () =>
      INSIGHT_WORKBENCH_CATALOG.find(
        ({ slug }) => slug === model?.categorySlug,
      ),
    [model?.categorySlug],
  );

  const updateCell = (cellId: string, code: string) => {
    setModel((current) =>
      current
        ? {
            ...current,
            cells: current.cells.map((cell) =>
              cell.id === cellId ? { ...cell, code, output: undefined } : cell,
            ),
          }
        : current,
    );
    setIsDirty(true);
  };

  const runCell = (cellId: string) => {
    if (!model || runningCellId || runningAll) return;
    setRunningCellId(cellId);
    window.setTimeout(() => {
      setModel((current) =>
        current
          ? {
              ...current,
              status: "Ready",
              lastRunAt: new Date().toISOString(),
              cells: current.cells.map((cell) =>
                cell.id === cellId
                  ? {
                      ...cell,
                      output:
                        cell.output ||
                        "Execution completed successfully · 1.2s · 0 errors",
                    }
                  : cell,
              ),
            }
          : current,
      );
      setRunningCellId(null);
      success("Cell completed", "The sample execution finished successfully");
    }, 700);
  };

  const runAllCells = () => {
    if (!model || runningCellId || runningAll) return;
    setRunningAll(true);
    setModel((current) =>
      current ? { ...current, status: "Running" } : current,
    );
    window.setTimeout(() => {
      setModel((current) =>
        current
          ? {
              ...current,
              status: "Ready",
              lastRunAt: new Date().toISOString(),
              cells: current.cells.map((cell) => ({
                ...cell,
                output:
                  cell.output ||
                  "Execution completed successfully · sample output generated",
              })),
            }
          : current,
      );
      setRunningAll(false);
      success("Run completed", "All notebook cells completed successfully");
    }, 1100);
  };

  const saveModel = () => {
    if (!model) return;
    const savedId = isNew ? `demo-${Date.now()}` : model.id;
    setModel({
      ...model,
      id: savedId,
      lastModifiedAt: new Date().toISOString(),
    });
    setIsDirty(false);
    success(
      insightWorkbenchService.isDemoMode() ? "Demo model saved" : "Model saved",
      insightWorkbenchService.isDemoMode()
        ? "This change is kept in the current page only."
        : "Your latest model changes are now available.",
    );
  };

  const addCell = () => {
    if (!model) return;
    const nextCell: WorkbenchNotebookCell = {
      id: `cell-${Date.now()}`,
      title: `Code cell ${model.cells.length + 1}`,
      language: model.language,
      code: "# Add the next step of your analysis",
    };
    setModel({ ...model, cells: [...model.cells, nextCell] });
    setIsDirty(true);
  };

  const removeCell = (cellId: string) => {
    if (!model || model.cells.length === 1) {
      showError("Cell required", "A model must contain at least one code cell");
      return;
    }
    setModel({
      ...model,
      cells: model.cells.filter(({ id }) => id !== cellId),
    });
    setIsDirty(true);
  };

  const duplicateCell = (cell: WorkbenchNotebookCell, index: number) => {
    if (!model) return;
    const duplicate: WorkbenchNotebookCell = {
      ...cell,
      id: `cell-${Date.now()}`,
      title: `${cell.title} copy`,
      output: undefined,
    };
    const cells = [...model.cells];
    cells.splice(index + 1, 0, duplicate);
    setModel({ ...model, cells });
    setIsDirty(true);
    success("Cell duplicated", "The copy was inserted below the original cell");
  };

  const moveCell = (index: number, direction: -1 | 1) => {
    if (!model) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= model.cells.length) return;
    const cells = [...model.cells];
    [cells[index], cells[targetIndex]] = [cells[targetIndex], cells[index]];
    setModel({ ...model, cells });
    setIsDirty(true);
  };

  const clearCellOutput = (cellId: string) => {
    if (!model) return;
    setModel({
      ...model,
      cells: model.cells.map((cell) =>
        cell.id === cellId ? { ...cell, output: undefined } : cell,
      ),
    });
    setIsDirty(true);
  };

  const runCellRange = (
    startIndex: number,
    endIndex: number,
    completionMessage: string,
  ) => {
    if (!model || runningCellId || runningAll || startIndex > endIndex) return;
    setRunningAll(true);
    setModel((current) =>
      current ? { ...current, status: "Running" } : current,
    );
    window.setTimeout(() => {
      setModel((current) =>
        current
          ? {
              ...current,
              status: "Ready",
              lastRunAt: new Date().toISOString(),
              cells: current.cells.map((cell, index) =>
                index >= startIndex && index <= endIndex
                  ? {
                      ...cell,
                      output:
                        cell.output ||
                        "Execution completed successfully · sample output generated",
                    }
                  : cell,
              ),
            }
          : current,
      );
      setRunningAll(false);
      success("Run completed", completionMessage);
    }, 900);
  };

  const saveCellTitle = () => {
    const title = cellTitle.trim();
    if (!model || !renamingCell || !title) {
      showError("Title required", "Enter a descriptive title for this cell");
      return;
    }
    setModel({
      ...model,
      cells: model.cells.map((cell) =>
        cell.id === renamingCell.id ? { ...cell, title } : cell,
      ),
    });
    setRenamingCell(null);
    setCellTitle("");
    setIsDirty(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
      </div>
    );
  }

  if (!model || loadError) {
    return (
      <div className="space-y-6">
        <BackButton
          showBreadcrumb
          currentLabel="Model unavailable"
          parentLabel="Insight Workbench"
          parentTo={INSIGHT_WORKBENCH_PATH}
        />
        <div className={`${tw.rounded} border p-12 text-center ${tw.surfaceCards}`}>
          <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
          <p className="mt-3 text-sm font-medium text-red-700">
            {loadError || "This model could not be loaded"}
          </p>
        </div>
      </div>
    );
  }

  const parentPath = category
    ? workbenchCategoryPath(category.slug)
    : INSIGHT_WORKBENCH_PATH;

  return (
    <div className="space-y-5">
      <BackButton
        showBreadcrumb
        currentLabel={isNew ? "Create model" : model.name}
        parentLabel={category?.name || "Insight Workbench"}
        parentTo={parentPath}
      />

      <header
        className={`${tw.rounded} border p-4 sm:p-5`}
        style={{
          borderColor: color.border.default,
          backgroundColor: color.surface.cards,
        }}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={model.name}
                onChange={(event) => {
                  setModel({ ...model, name: event.target.value });
                  setIsDirty(true);
                }}
                aria-label="Model name"
                className={`min-w-0 max-w-2xl flex-1 border-0 bg-transparent p-0 text-2xl font-bold focus:outline-none focus:ring-0 ${tw.textPrimary}`}
              />
              <span
                className={`${tw.rounded} px-2 py-1 text-xs font-medium ${
                  model.status === "Ready"
                    ? "bg-emerald-50 text-emerald-700"
                    : model.status === "Running"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-amber-50 text-amber-700"
                }`}
              >
                {model.status}
              </span>
              {insightWorkbenchService.isDemoMode() && (
                <span className={`${tw.rounded} bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700`}>
                  Demo
                </span>
              )}
            </div>
            <input
              value={model.description}
              onChange={(event) => {
                setModel({ ...model, description: event.target.value });
                setIsDirty(true);
              }}
              aria-label="Model description"
              className={`mt-2 w-full border-0 bg-transparent p-0 text-sm focus:outline-none focus:ring-0 ${tw.textSecondary}`}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveModel}
              className={`${tw.rounded} inline-flex items-center gap-2 border px-3 py-2 text-sm font-medium ${tw.textPrimary}`}
              style={{ borderColor: color.border.default }}
            >
              <Save className="h-4 w-4" />
              Save{isDirty ? " changes" : ""}
            </button>
            <button
              type="button"
              onClick={runAllCells}
              disabled={runningAll || Boolean(runningCellId)}
              className={`${tw.button} inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {runningAll ? (
                <LoadingSpinner variant="modern" size="sm" color="white" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Run all
            </button>
            <button
              type="button"
              onClick={() =>
                success(
                  "Insight published",
                  "A demo insight is now available in AI Powered Insights.",
                )
              }
              disabled={model.status !== "Ready"}
              className={`${tw.rounded} inline-flex items-center gap-2 border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50`}
              style={{
                borderColor: color.border.accent,
                color: color.primary.accent,
              }}
            >
              <Send className="h-4 w-4" />
              Publish insight
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <main className="space-y-4">
          {model.cells.map((cell, index) => (
            <section
              key={cell.id}
              className={`${tw.rounded} overflow-hidden border`}
              style={{
                borderColor:
                  runningCellId === cell.id
                    ? color.border.accent
                    : color.border.default,
                backgroundColor: color.surface.cards,
              }}
            >
              <div
                className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3"
                style={{ borderColor: color.border.muted }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`${tw.rounded} flex h-7 w-7 items-center justify-center text-xs font-semibold`}
                    style={{
                      backgroundColor: color.primary.background,
                      color: color.primary.accent,
                    }}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <h2 className={`text-sm font-semibold ${tw.textPrimary}`}>
                      {cell.title}
                    </h2>
                    <p className={`text-xs ${tw.textMuted}`}>{cell.language}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => runCell(cell.id)}
                    disabled={runningAll || Boolean(runningCellId)}
                    aria-label={`Run ${cell.title}`}
                    className={`${tw.rounded} inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium ${tw.hover} ${tw.textPrimary}`}
                  >
                    {runningCellId === cell.id ? (
                      <LoadingSpinner variant="modern" size="sm" color="primary" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                    Run
                  </button>
                  <button
                    type="button"
                    onClick={() => void navigator.clipboard.writeText(cell.code)}
                    aria-label={`Copy ${cell.title}`}
                    className={`${tw.rounded} p-2 ${tw.hover}`}
                  >
                    <Copy className={`h-3.5 w-3.5 ${tw.textSecondary}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeCell(cell.id)}
                    aria-label={`Delete ${cell.title}`}
                    className={`${tw.rounded} p-2 hover:bg-red-50`}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </button>
                  <Menu as="div" className="relative">
                    <MenuButton
                      aria-label={`More actions for ${cell.title}`}
                      disabled={runningAll || Boolean(runningCellId)}
                      className={`${tw.rounded} p-2 ${tw.hover} disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      <MoreHorizontal
                        className={`h-4 w-4 ${tw.textSecondary}`}
                      />
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
                          className={CELL_MENU_ITEM_CLASS}
                          onClick={() => {
                            setRenamingCell(cell);
                            setCellTitle(cell.title);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          Rename cell
                        </button>
                      </MenuItem>
                      <MenuItem>
                        <button
                          type="button"
                          className={CELL_MENU_ITEM_CLASS}
                          onClick={() => duplicateCell(cell, index)}
                        >
                          <Files className="h-4 w-4" />
                          Duplicate cell
                        </button>
                      </MenuItem>
                      <MenuItem disabled={index === 0}>
                        <button
                          type="button"
                          className={CELL_MENU_ITEM_CLASS}
                          onClick={() => moveCell(index, -1)}
                        >
                          <ArrowUp className="h-4 w-4" />
                          Move up
                        </button>
                      </MenuItem>
                      <MenuItem disabled={index === model.cells.length - 1}>
                        <button
                          type="button"
                          className={CELL_MENU_ITEM_CLASS}
                          onClick={() => moveCell(index, 1)}
                        >
                          <ArrowDown className="h-4 w-4" />
                          Move down
                        </button>
                      </MenuItem>
                      <div
                        className="my-1 border-t"
                        style={{ borderColor: color.border.muted }}
                      />
                      <MenuItem disabled={index === 0}>
                        <button
                          type="button"
                          className={CELL_MENU_ITEM_CLASS}
                          onClick={() =>
                            runCellRange(
                              0,
                              index - 1,
                              `${index} cell${index === 1 ? "" : "s"} above completed`,
                            )
                          }
                        >
                          <ChevronsUp className="h-4 w-4" />
                          Run cells above
                        </button>
                      </MenuItem>
                      <MenuItem>
                        <button
                          type="button"
                          className={CELL_MENU_ITEM_CLASS}
                          onClick={() =>
                            runCellRange(
                              index,
                              model.cells.length - 1,
                              "This cell and all following cells completed",
                            )
                          }
                        >
                          <ChevronsDown className="h-4 w-4" />
                          Run from here
                        </button>
                      </MenuItem>
                      <MenuItem disabled={!cell.output}>
                        <button
                          type="button"
                          className={CELL_MENU_ITEM_CLASS}
                          onClick={() => clearCellOutput(cell.id)}
                        >
                          <RotateCcw className="h-4 w-4" />
                          Clear output
                        </button>
                      </MenuItem>
                      <div
                        className="my-1 border-t"
                        style={{ borderColor: color.border.muted }}
                      />
                      <MenuItem disabled={model.cells.length === 1}>
                        <button
                          type="button"
                          className={`${CELL_MENU_ITEM_CLASS} text-red-600 data-[focus]:bg-red-50`}
                          onClick={() => removeCell(cell.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete cell
                        </button>
                      </MenuItem>
                    </MenuItems>
                  </Menu>
                </div>
              </div>

              <CodeMirror
                value={cell.code}
                minHeight="150px"
                extensions={
                  isDark ? [darkSyntaxHighlight] : []
                }
                onChange={(value) => updateCell(cell.id, value)}
                theme={isDark ? darkTheme : "light"}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  bracketMatching: true,
                  closeBrackets: true,
                  highlightActiveLine: true,
                  highlightSelectionMatches: true,
                }}
              />

              {cell.output && (
                <div
                  className="border-t"
                  style={{
                    borderColor: color.border.muted,
                    backgroundColor: color.surface.background,
                  }}
                >
                  <div className="flex items-center gap-2 px-4 py-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span className={`text-xs font-semibold uppercase tracking-wide ${tw.textMuted}`}>
                      Output
                    </span>
                  </div>
                  <pre
                    className={`max-h-72 overflow-auto whitespace-pre-wrap px-4 pb-4 text-xs leading-5 ${tw.textPrimary}`}
                  >
                    {cell.output}
                  </pre>
                </div>
              )}
            </section>
          ))}

          <button
            type="button"
            onClick={addCell}
            className={`${tw.rounded} flex w-full items-center justify-center gap-2 border border-dashed px-4 py-4 text-sm font-medium ${tw.textSecondary} ${tw.hover}`}
            style={{ borderColor: color.border.default }}
          >
            <Plus className="h-4 w-4" />
            Add code cell
          </button>
        </main>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <InfoPanel title="Runtime">
            <InfoRow icon={FileCode2} label="Language" value={model.runtime} />
            <InfoRow icon={Server} label="Engine" value={model.engine} />
            <InfoRow
              icon={Clock3}
              label="Last run"
              value={
                model.lastRunAt
                  ? new Date(model.lastRunAt).toLocaleString()
                  : "Not run yet"
              }
            />
          </InfoPanel>

          <InfoPanel title="Available data">
            {[
              "customer_daily_activity",
              "customer_profile",
              "campaign_interactions",
            ].map((asset) => (
              <div
                key={asset}
                className="flex items-center gap-2 py-2 text-xs"
              >
                <Database
                  className="h-3.5 w-3.5"
                  style={{ color: color.primary.accent }}
                />
                <span className={`truncate ${tw.textPrimary}`}>{asset}</span>
              </div>
            ))}
          </InfoPanel>

          <div
            className={`${tw.rounded} border p-4`}
            style={{
              borderColor: color.border.default,
              backgroundColor: color.primary.background,
            }}
          >
            <div className="flex items-center gap-2">
              <Sparkles
                className="h-4 w-4"
                style={{ color: color.primary.accent }}
              />
              <p className={`text-sm font-semibold ${tw.textPrimary}`}>
                Production recommendation
              </p>
            </div>
            <p className={`mt-2 text-xs leading-5 ${tw.textSecondary}`}>
              Execute cells as isolated, queued backend jobs. Persist code,
              outputs, logs, runtime versions, and the initiating user for audit.
            </p>
          </div>
        </aside>
      </div>

      <RegularModal
        isOpen={Boolean(renamingCell)}
        onClose={() => {
          setRenamingCell(null);
          setCellTitle("");
        }}
        title="Rename notebook cell"
        size="sm"
      >
        <form
          className="space-y-5 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            saveCellTitle();
          }}
        >
          <div>
            <label
              htmlFor="workbench-cell-title"
              className={`mb-2 block text-sm font-medium ${tw.textPrimary}`}
            >
              Cell title
            </label>
            <input
              id="workbench-cell-title"
              value={cellTitle}
              onChange={(event) => setCellTitle(event.target.value)}
              autoFocus
              maxLength={120}
              className={`${tw.rounded} w-full border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--c-interactive-focus)] ${tw.textPrimary}`}
              style={{
                borderColor: color.border.default,
                backgroundColor: color.surface.background,
              }}
              placeholder="Describe what this cell does"
            />
            <p className={`mt-2 text-xs ${tw.textMuted}`}>
              Use a short action-oriented title so execution logs remain easy to
              understand.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setRenamingCell(null);
                setCellTitle("");
              }}
              className={`${tw.rounded} border px-4 py-2 text-sm font-medium ${tw.textPrimary}`}
              style={{ borderColor: color.border.default }}
            >
              Cancel
            </button>
            <button type="submit" className={tw.button}>
              Rename cell
            </button>
          </div>
        </form>
      </RegularModal>
    </div>
  );
}

function InfoPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`${tw.rounded} border p-4`}
      style={{
        borderColor: color.border.default,
        backgroundColor: color.surface.cards,
      }}
    >
      <h2 className={`text-sm font-semibold ${tw.textPrimary}`}>{title}</h2>
      <div className="mt-3 divide-y" style={{ borderColor: color.border.muted }}>
        {children}
      </div>
    </section>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileCode2;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 py-2">
      <Icon
        className="mt-0.5 h-3.5 w-3.5 shrink-0"
        style={{ color: color.primary.accent }}
      />
      <div className="min-w-0">
        <p className={`text-[11px] ${tw.textMuted}`}>{label}</p>
        <p className={`truncate text-xs font-medium ${tw.textPrimary}`}>{value}</p>
      </div>
    </div>
  );
}
