import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Brain,
  ChevronRight,
  CircleDot,
  Code2,
  Database,
  Gauge,
  GitBranch,
  Lightbulb,
  MapPin,
  Network,
  SearchX,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import HeadlessMultiSelect from "../../../shared/components/ui/HeadlessMultiSelect";
import SearchInput from "../../../shared/components/ui/SearchInput";
import SegmentedTabs from "../../../shared/components/ui/SegmentedTabs";
import { color, tw } from "../../../shared/utils/utils";
import { INSIGHT_WORKBENCH_CATALOG } from "../constants/insightWorkbenchCatalog";
import InsightWorkbenchInsightsPanel from "../components/InsightWorkbenchInsightsPanel";
import { insightWorkbenchService } from "../services/insightWorkbenchService";
import type {
  InsightWorkbenchSummary,
  WorkbenchCategory,
  WorkbenchLanguage,
  WorkbenchWorkflowStageId,
  WorkbenchWorkflowStatus,
} from "../types/insightWorkbench";
import {
  AI_MODELS_HUB_PATH,
  workbenchCategoryPath,
} from "../utils/aiModelNavigation";

type WorkbenchView = "models" | "insights";
type Icon = ComponentType<{ className?: string; style?: React.CSSProperties }>;
const LANGUAGE_OPTIONS: Array<{
  value: WorkbenchLanguage;
  label: WorkbenchLanguage;
}> = [
  { value: "Python", label: "Python" },
  { value: "R", label: "R" },
  { value: "Scala", label: "Scala" },
];

function readLanguageFilters(value: string | null): WorkbenchLanguage[] {
  if (!value) return [];
  const allowed = new Set<WorkbenchLanguage>(
    LANGUAGE_OPTIONS.map(({ value: language }) => language),
  );
  return Array.from(
    new Set(
      value
        .split(",")
        .filter((language): language is WorkbenchLanguage =>
          allowed.has(language as WorkbenchLanguage),
        ),
    ),
  );
}

const CATEGORY_ICONS: Record<string, Icon> = {
  "behavioral-profiling": Brain,
  forecasting: TrendingUp,
  location: MapPin,
  "custom-models": Boxes,
  "nba-nbo": Target,
  "pre-processing": SlidersHorizontal,
  visualization: BarChart3,
  affinity: Network,
  classification: GitBranch,
  clustering: CircleDot,
  propensity: Gauge,
  "text-analysis": SearchX,
  validation: ShieldCheck,
};

const WORKFLOW = [
  {
    id: "ingestion" as const,
    title: "Data ingestion",
    description: "Bring governed enterprise data into an analysis-ready workspace.",
    actionLabel: "Manage pipelines",
    icon: Database,
  },
  {
    id: "discovery" as const,
    title: "Data discovery",
    description: "Explore variables, quality, distributions, and relationships.",
    actionLabel: "Review data",
    icon: SearchX,
  },
  {
    id: "analytics" as const,
    title: "Data analytics",
    description: "Develop predictive, prescriptive, descriptive, and exploratory models.",
    actionLabel: "Open models",
    icon: Code2,
  },
  {
    id: "collaboration" as const,
    title: "Visualization & collaboration",
    description: "Publish understandable results for teams and decision makers.",
    actionLabel: "View insights",
    icon: Users,
  },
];

function workflowStatusClass(status?: WorkbenchWorkflowStatus): string {
  if (status === "Healthy") return "bg-emerald-50 text-emerald-700";
  if (status === "Attention") return "bg-amber-50 text-amber-700";
  if (status === "Running") return "bg-blue-50 text-blue-700";
  return "bg-gray-100 text-gray-600";
}

function readView(value: string | null): WorkbenchView {
  return value === "insights" ? "insights" : "models";
}

function mergeCatalog(
  summary: InsightWorkbenchSummary | null,
): WorkbenchCategory[] {
  const remoteBySlug = new Map(
    summary?.categories.map((category) => [category.slug, category]) ?? [],
  );
  const knownSlugs = new Set(INSIGHT_WORKBENCH_CATALOG.map(({ slug }) => slug));

  const knownCategories = INSIGHT_WORKBENCH_CATALOG.map((category) => {
    const remote = remoteBySlug.get(category.slug);
    return {
      ...category,
      id: remote?.id ?? category.id,
      description: remote?.description || category.description,
      languages: remote?.languages.length
        ? remote.languages
        : category.languages,
      modelCount: remote?.modelCount ?? null,
      templateCount: remote?.templateCount ?? null,
    };
  });

  const additionalCategories =
    summary?.categories.filter(({ slug }) => !knownSlugs.has(slug)) ?? [];
  return [...knownCategories, ...additionalCategories];
}

function CountLabel({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <span className={`text-xs ${tw.textSecondary}`}>
      <strong className={tw.textPrimary}>{value ?? "—"}</strong> {label}
    </span>
  );
}

export default function InsightWorkbenchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState<InsightWorkbenchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [catalogOnly, setCatalogOnly] = useState(false);
  const view = readView(searchParams.get("view"));
  const selectedLanguages = useMemo(
    () => readLanguageFilters(searchParams.get("languages")),
    [searchParams],
  );

  useEffect(() => {
    const controller = new AbortController();

    insightWorkbenchService
      .getSummary(controller.signal)
      .then((result) => {
        setSummary(result);
        setCatalogOnly(false);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSummary(null);
        setCatalogOnly(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const categories = useMemo(() => mergeCatalog(summary), [summary]);
  const filteredCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return categories.filter((category) => {
      const matchesSearch =
        !normalizedSearch ||
        category.name.toLowerCase().includes(normalizedSearch) ||
        category.description.toLowerCase().includes(normalizedSearch);
      const matchesLanguage =
        selectedLanguages.length === 0 ||
        selectedLanguages.every((language) =>
          category.languages.includes(language),
        );
      return matchesSearch && matchesLanguage;
    });
  }, [categories, search, selectedLanguages]);

  const setView = (nextView: WorkbenchView) => {
    const next = new URLSearchParams(searchParams);
    if (nextView === "models") next.delete("view");
    else next.set("view", nextView);
    setSearchParams(next, { replace: true });
  };

  const setLanguageFilters = (values: Array<string | number>) => {
    const selected = values
      .map(String)
      .filter((language): language is WorkbenchLanguage =>
        LANGUAGE_OPTIONS.some(({ value }) => value === language),
      );
    const next = new URLSearchParams(searchParams);
    if (
      selected.length === 0 ||
      selected.length === LANGUAGE_OPTIONS.length
    ) {
      next.delete("languages");
    } else {
      next.set("languages", selected.join(","));
    }
    setSearchParams(next, { replace: true });
  };

  const openWorkflowStage = (stageId: WorkbenchWorkflowStageId) => {
    if (stageId === "ingestion") {
      navigate("/dashboard/connection-profile-pipelines");
      return;
    }
    if (stageId === "discovery") {
      navigate(workbenchCategoryPath("pre-processing"));
      return;
    }
    setView(stageId === "collaboration" ? "insights" : "models");
    window.requestAnimationFrame(() => {
      document
        .getElementById("workbench-modules")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="space-y-6">
      <BackButton
        showBreadcrumb
        currentLabel="Insight Workbench"
        parentLabel="AI Models"
        parentTo={AI_MODELS_HUB_PATH}
      />

      <section
        className={`${tw.rounded} overflow-hidden border p-6 lg:p-8`}
        style={{
          borderColor: color.border.default,
          background:
            "linear-gradient(135deg, var(--c-surface-cards) 0%, var(--c-primary-background) 100%)",
        }}
      >
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles
                className="h-5 w-5"
                style={{ color: color.primary.accent }}
              />
              <span className={`text-xs font-semibold uppercase tracking-wider ${tw.textSecondary}`}>
                Web-based analytics workspace
              </span>
            </div>
            <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
              Insight Workbench
            </h1>
            <p className={`mt-3 text-sm leading-6 ${tw.textSecondary}`}>
              Explore large datasets, apply statistical techniques, and develop
              machine-learning models in Python, R, or Scala. Turn analytical
              work into governed insights that teams can reuse.
            </p>
          </div>

          <div className="grid min-w-full grid-cols-2 gap-3 sm:min-w-[360px]">
            <div
              className={`${tw.rounded} border p-4`}
              style={{
                borderColor: color.border.default,
                backgroundColor: color.surface.background,
              }}
            >
              <p className={`text-xs ${tw.textSecondary}`}>Active models</p>
              <p className={`mt-1 text-2xl font-bold ${tw.textPrimary}`}>
                {loading ? "…" : summary?.activeModelCount ?? "—"}
              </p>
            </div>
            <div
              className={`${tw.rounded} border p-4`}
              style={{
                borderColor: color.border.default,
                backgroundColor: color.surface.background,
              }}
            >
              <p className={`text-xs ${tw.textSecondary}`}>Published insights</p>
              <p className={`mt-1 text-2xl font-bold ${tw.textPrimary}`}>
                {loading ? "…" : summary?.publishedInsightCount ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="workflow-heading">
        <div className="mb-3">
          <h2 id="workflow-heading" className={`text-base font-semibold ${tw.textPrimary}`}>
            From enterprise data to actionable insight
          </h2>
          <p className={`mt-1 text-sm ${tw.textSecondary}`}>
            A guided workflow for discovery, analysis, and collaboration.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {WORKFLOW.map((step, index) => {
            const StepIcon = step.icon;
            const stage = summary?.workflowStages.find(
              ({ id }) => id === step.id,
            );
            return (
              <button
                key={step.title}
                type="button"
                onClick={() => openWorkflowStage(step.id)}
                className={`${tw.rounded} group flex h-full flex-col border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-interactive-focus)]`}
                style={{
                  borderColor: color.border.default,
                  backgroundColor: color.surface.cards,
                }}
              >
                <div className="flex w-full items-start gap-3">
                  <div
                    className={`${tw.rounded} flex h-9 w-9 shrink-0 items-center justify-center`}
                    style={{ backgroundColor: color.primary.background }}
                  >
                    <StepIcon
                      className="h-4 w-4"
                      style={{ color: color.primary.accent }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-medium ${tw.textMuted}`}>
                        0{index + 1}
                      </p>
                      <ArrowRight
                        className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${tw.textMuted}`}
                      />
                    </div>
                    <h3 className={`mt-0.5 text-sm font-semibold ${tw.textPrimary}`}>
                      {step.title}
                    </h3>
                    <p className={`mt-1 text-xs leading-5 ${tw.textSecondary}`}>
                      {step.description}
                    </p>
                  </div>
                </div>

                <div
                  className="mt-4 w-full border-t pt-3"
                  style={{ borderColor: color.border.muted }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`${tw.rounded} px-2 py-1 text-[11px] font-medium ${workflowStatusClass(stage?.status)}`}
                    >
                      {loading ? "Loading" : stage?.status || "Not configured"}
                    </span>
                    <span className={`text-xs font-semibold ${tw.textPrimary}`}>
                      {loading
                        ? "…"
                        : stage?.metricValue == null
                          ? "—"
                          : stage.metricValue}{" "}
                      <span className={`font-normal ${tw.textMuted}`}>
                        {stage?.metricLabel}
                      </span>
                    </span>
                  </div>
                  <p className={`mt-2 min-h-8 text-xs leading-4 ${tw.textMuted}`}>
                    {loading
                      ? "Loading operational status…"
                      : stage?.detail ||
                        "Connect this stage to its operational summary endpoint."}
                  </p>
                  <span className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${tw.link}`}>
                    {step.actionLabel}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section
        id="workbench-modules"
        className={`${tw.rounded} border p-4 sm:p-6`}
        style={{
          borderColor: color.border.default,
          backgroundColor: color.surface.cards,
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className={`text-base font-semibold ${tw.textPrimary}`}>
              Workbench modules
            </h2>
            <p className={`mt-1 text-sm ${tw.textSecondary}`}>
              Build reusable models or review the results they publish.
            </p>
          </div>
          <SegmentedTabs
            items={[
              { id: "models", label: "Models" },
              { id: "insights", label: "AI Powered Insights" },
            ]}
            value={view}
            onChange={setView}
            ariaLabel="Insight Workbench modules"
          />
        </div>

        {view === "models" ? (
          <div className="mt-6 space-y-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search model categories"
              />
              <HeadlessMultiSelect
                value={selectedLanguages}
                options={LANGUAGE_OPTIONS}
                onChange={setLanguageFilters}
                placeholder="All languages"
                ariaLabel="Filter model categories by languages"
                clearSelectionLabel="Show all languages"
                showCheckboxes
                hideSelectedChips
                maxDisplayed={1}
              />
            </div>

            <p
              className={`text-xs ${tw.textSecondary}`}
              role="status"
              aria-live="polite"
            >
              {selectedLanguages.length === 0
                ? `Showing all ${filteredCategories.length} model categories.`
                : `Showing ${filteredCategories.length} ${
                    filteredCategories.length === 1 ? "category" : "categories"
                  } supporting all selected languages: ${selectedLanguages.join(
                    " and ",
                  )}.`}
            </p>

            {(catalogOnly || summary?.source === "demo") && (
              <div
                className={`${tw.rounded} flex items-start gap-3 border px-4 py-3`}
                style={{
                  borderColor: color.border.default,
                  backgroundColor: color.primary.background,
                }}
              >
                <Lightbulb
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: color.primary.accent }}
                />
                <p className={`text-sm ${tw.textSecondary}`}>
                  {summary?.source === "demo"
                    ? "Demo data is active. Open any category to explore realistic model, template, and notebook workflows."
                    : "Showing the built-in analytics catalog. Live model and template totals will appear when the Insight Workbench service is connected."}
                </p>
              </div>
            )}

            {filteredCategories.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredCategories.map((category) => {
                  const CategoryIcon = CATEGORY_ICONS[category.slug] ?? Brain;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => navigate(workbenchCategoryPath(category.slug))}
                      className={`${tw.rounded} group border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-interactive-focus)]`}
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
                          <CategoryIcon
                            className="h-5 w-5"
                            style={{ color: color.primary.accent }}
                          />
                        </div>
                        <div className="flex flex-wrap justify-end gap-1">
                          {category.languages.map((item) => (
                            <span
                              key={item}
                              className={`${tw.rounded} border px-2 py-0.5 text-[11px] ${tw.textSecondary}`}
                              style={{ borderColor: color.border.muted }}
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                      <h3 className={`mt-4 font-semibold ${tw.textPrimary}`}>
                        {category.name}
                      </h3>
                      <p className={`mt-1 min-h-10 text-sm leading-5 ${tw.textSecondary}`}>
                        {category.description}
                      </p>
                      <div
                        className="mt-4 flex items-center gap-4 border-t pt-3"
                        style={{ borderColor: color.border.muted }}
                      >
                        <CountLabel label="models" value={category.modelCount} />
                        <CountLabel
                          label="templates"
                          value={category.templateCount}
                        />
                        <ChevronRight
                          className={`ml-auto h-4 w-4 transition-transform group-hover:translate-x-1 ${tw.textMuted}`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center">
                <SearchX className="mx-auto h-10 w-10 text-gray-300" />
                <h3 className={`mt-3 text-sm font-semibold ${tw.textPrimary}`}>
                  No categories found
                </h3>
                <p className={`mt-1 text-sm ${tw.textSecondary}`}>
                  {selectedLanguages.length > 1
                    ? "No category supports every selected language. Remove one or more language filters."
                    : "Try a different search term or language."}
                </p>
              </div>
            )}
          </div>
        ) : (
          <InsightWorkbenchInsightsPanel />
        )}
      </section>
    </div>
  );
}
