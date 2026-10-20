import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Download,
  Eye,
  FileCode2,
  Lightbulb,
  RefreshCw,
  SearchX,
  Sparkles,
  Users,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import RegularModal from "../../../shared/components/ui/RegularModal";
import SearchInput from "../../../shared/components/ui/SearchInput";
import { color, tw } from "../../../shared/utils/utils";
import { INSIGHT_WORKBENCH_CATALOG } from "../constants/insightWorkbenchCatalog";
import { insightWorkbenchService } from "../services/insightWorkbenchService";
import type {
  WorkbenchInsight,
  WorkbenchInsightStatus,
} from "../types/insightWorkbench";
import { workbenchModelPath } from "../utils/aiModelNavigation";

type InsightStatusFilter = "all" | WorkbenchInsightStatus;

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function categoryName(slug: string): string {
  return (
    INSIGHT_WORKBENCH_CATALOG.find((category) => category.slug === slug)?.name ||
    slug
  );
}

function statusClass(status: WorkbenchInsightStatus): string {
  if (status === "Published") return "bg-emerald-50 text-emerald-700";
  if (status === "Refreshing") return "bg-blue-50 text-blue-700";
  return "bg-gray-100 text-gray-600";
}

export default function InsightWorkbenchInsightsPanel() {
  const navigate = useNavigate();
  const [insights, setInsights] = useState<WorkbenchInsight[]>([]);
  const [selectedInsight, setSelectedInsight] =
    useState<WorkbenchInsight | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InsightStatusFilter>("all");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError("");
    insightWorkbenchService
      .listInsights(controller.signal)
      .then(setInsights)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "Could not load published insights",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const availableCategories = useMemo(
    () => Array.from(new Set(insights.map(({ categorySlug }) => categorySlug))),
    [insights],
  );

  const filteredInsights = useMemo(() => {
    const term = search.trim().toLowerCase();
    return insights.filter((insight) => {
      const matchesSearch =
        !term ||
        insight.title.toLowerCase().includes(term) ||
        insight.summary.toLowerCase().includes(term) ||
        insight.sourceModelName.toLowerCase().includes(term);
      const matchesStatus = status === "all" || insight.status === status;
      const matchesCategory =
        category === "all" || insight.categorySlug === category;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [category, insights, search, status]);

  const publishedCount = insights.filter(
    ({ status: insightStatus }) => insightStatus === "Published",
  ).length;
  const positiveCount = insights.filter(
    ({ changePercent }) => changePercent > 0,
  ).length;
  const attentionCount = insights.filter(
    ({ changePercent }) => changePercent < 0,
  ).length;

  const exportInsight = (insight: WorkbenchInsight) => {
    const blob = new Blob([JSON.stringify(insight, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${insight.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-6 space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h3 className={`text-lg font-semibold ${tw.textPrimary}`}>
            Published analytical results
          </h3>
          <p className={`mt-1 text-sm leading-6 ${tw.textSecondary}`}>
            Review governed model outputs, understand the supporting evidence,
            and turn findings into measurable business actions.
          </p>
        </div>
        {insightWorkbenchService.isDemoMode() && (
          <span
            className={`${tw.rounded} self-start border px-3 py-1 text-xs font-medium`}
            style={{
              borderColor: color.border.accent,
              backgroundColor: color.primary.background,
              color: color.primary.accent,
            }}
          >
            Demo insights
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Published",
            value: publishedCount,
            icon: CheckCircle2,
            tone: "text-emerald-600",
          },
          {
            label: "Positive trends",
            value: positiveCount,
            icon: ArrowUpRight,
            tone: "text-blue-600",
          },
          {
            label: "Needs attention",
            value: attentionCount,
            icon: AlertCircle,
            tone: "text-amber-600",
          },
          {
            label: "Categories covered",
            value: availableCategories.length,
            icon: BarChart3,
            tone: "text-violet-600",
          },
        ].map((stat) => {
          const StatIcon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`${tw.rounded} border p-4`}
              style={{
                borderColor: color.border.default,
                backgroundColor: color.surface.background,
              }}
            >
              <div className="flex items-center gap-2">
                <StatIcon className={`h-4 w-4 ${stat.tone}`} />
                <p className={`text-xs ${tw.textSecondary}`}>{stat.label}</p>
              </div>
              <p className={`mt-2 text-2xl font-bold ${tw.textPrimary}`}>
                {loading ? "…" : stat.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search insights or source models"
        />
        <HeadlessSelect
          value={category}
          options={[
            { value: "all", label: "All categories" },
            ...availableCategories.map((slug) => ({
              value: slug,
              label: categoryName(slug),
            })),
          ]}
          onChange={(value) => setCategory(String(value))}
        />
        <HeadlessSelect
          value={status}
          options={[
            { value: "all", label: "All statuses" },
            { value: "Published", label: "Published" },
            { value: "Refreshing", label: "Refreshing" },
            { value: "Archived", label: "Archived" },
          ]}
          onChange={(value) => setStatus(value as InsightStatusFilter)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner variant="modern" size="lg" color="primary" />
        </div>
      ) : loadError ? (
        <div className="py-14 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
          <p className="mt-3 text-sm font-medium text-red-700">{loadError}</p>
        </div>
      ) : filteredInsights.length ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredInsights.map((insight) => {
            const isPositive = insight.changePercent >= 0;
            return (
              <article
                key={insight.id}
                className={`${tw.rounded} border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
                style={{
                  borderColor: color.border.default,
                  backgroundColor: color.surface.background,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`${tw.rounded} px-2 py-1 text-xs font-medium ${statusClass(insight.status)}`}>
                      {insight.status}
                    </span>
                    <span className={`text-xs ${tw.textMuted}`}>
                      {categoryName(insight.categorySlug)}
                    </span>
                  </div>
                  {insight.status === "Refreshing" && (
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                  )}
                </div>

                <h4 className={`mt-4 text-base font-semibold ${tw.textPrimary}`}>
                  {insight.title}
                </h4>
                <p className={`mt-2 min-h-12 text-sm leading-6 ${tw.textSecondary}`}>
                  {insight.summary}
                </p>

                <div
                  className="mt-4 grid grid-cols-[1fr_auto] items-end gap-4 border-t pt-4"
                  style={{ borderColor: color.border.muted }}
                >
                  <div>
                    <p className={`text-xs ${tw.textMuted}`}>
                      {insight.metricLabel}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`text-2xl font-bold ${tw.textPrimary}`}>
                        {insight.metricValue}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          isPositive ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        )}
                        {Math.abs(insight.changePercent)}%
                      </span>
                    </div>
                    <p className={`mt-1 text-xs ${tw.textMuted}`}>
                      {insight.audience}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedInsight(insight)}
                    className={`${tw.rounded} inline-flex items-center gap-2 border px-3 py-2 text-sm font-medium ${tw.textPrimary} ${tw.hover}`}
                    style={{ borderColor: color.border.default }}
                  >
                    <Eye className="h-4 w-4" />
                    View insight
                  </button>
                </div>

                <p className={`mt-3 text-xs ${tw.textMuted}`}>
                  Published {formatDate(insight.publishedAt)} by{" "}
                  {insight.publishedBy}
                </p>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="py-14 text-center">
          <SearchX className="mx-auto h-10 w-10 text-gray-300" />
          <h4 className={`mt-3 text-sm font-semibold ${tw.textPrimary}`}>
            No insights found
          </h4>
          <p className={`mt-1 text-sm ${tw.textSecondary}`}>
            Adjust the search or filters to see more published results.
          </p>
        </div>
      )}

      <RegularModal
        isOpen={Boolean(selectedInsight)}
        onClose={() => setSelectedInsight(null)}
        title={selectedInsight?.title || "Insight details"}
        size="2xl"
      >
        {selectedInsight && (
          <div className="space-y-6 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`${tw.rounded} px-2 py-1 text-xs font-medium ${statusClass(selectedInsight.status)}`}>
                    {selectedInsight.status}
                  </span>
                  <span className={`text-xs ${tw.textMuted}`}>
                    {categoryName(selectedInsight.categorySlug)}
                  </span>
                </div>
                <p className={`mt-3 text-sm leading-6 ${tw.textSecondary}`}>
                  {selectedInsight.summary}
                </p>
              </div>
              <button
                type="button"
                onClick={() => exportInsight(selectedInsight)}
                className={`${tw.rounded} inline-flex shrink-0 items-center gap-2 border px-3 py-2 text-sm font-medium ${tw.textPrimary}`}
                style={{ borderColor: color.border.default }}
              >
                <Download className="h-4 w-4" />
                Export JSON
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <DetailMetric
                icon={Activity}
                label={selectedInsight.metricLabel}
                value={selectedInsight.metricValue}
              />
              <DetailMetric
                icon={selectedInsight.changePercent >= 0 ? ArrowUpRight : ArrowDownRight}
                label="Change"
                value={`${selectedInsight.changePercent >= 0 ? "+" : ""}${selectedInsight.changePercent}%`}
              />
              <DetailMetric
                icon={Users}
                label="Audience"
                value={selectedInsight.audience}
              />
            </div>

            <section
              className={`${tw.rounded} border p-4`}
              style={{ borderColor: color.border.default }}
            >
              <h4 className={`text-sm font-semibold ${tw.textPrimary}`}>
                Trend evidence
              </h4>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedInsight.series}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border-muted)" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} width={40} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={color.primary.accent}
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <InsightList
                icon={Lightbulb}
                title="Key findings"
                items={selectedInsight.findings}
              />
              <InsightList
                icon={Sparkles}
                title="Recommended actions"
                items={selectedInsight.recommendations}
              />
            </div>

            <div
              className={`${tw.rounded} flex flex-col gap-3 border p-4 sm:flex-row sm:items-center sm:justify-between`}
              style={{
                borderColor: color.border.default,
                backgroundColor: color.primary.background,
              }}
            >
              <div>
                <p className={`text-xs ${tw.textMuted}`}>Source model</p>
                <p className={`mt-1 text-sm font-semibold ${tw.textPrimary}`}>
                  {selectedInsight.sourceModelName}
                </p>
                <p className={`mt-1 text-xs ${tw.textSecondary}`}>
                  Published {formatDate(selectedInsight.publishedAt)} by{" "}
                  {selectedInsight.publishedBy}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  navigate(workbenchModelPath(selectedInsight.sourceModelId))
                }
                className={`${tw.button} inline-flex items-center justify-center gap-2`}
              >
                <FileCode2 className="h-4 w-4" />
                Open source model
              </button>
            </div>
          </div>
        )}
      </RegularModal>
    </div>
  );
}

function DetailMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <div
      className={`${tw.rounded} border p-4`}
      style={{
        borderColor: color.border.default,
        backgroundColor: color.surface.background,
      }}
    >
      <Icon className="h-4 w-4" style={{ color: color.primary.accent }} />
      <p className={`mt-3 text-xs ${tw.textMuted}`}>{label}</p>
      <p className={`mt-1 text-lg font-bold ${tw.textPrimary}`}>{value}</p>
    </div>
  );
}

function InsightList({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof Lightbulb;
  title: string;
  items: string[];
}) {
  return (
    <section
      className={`${tw.rounded} border p-4`}
      style={{ borderColor: color.border.default }}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color: color.primary.accent }} />
        <h4 className={`text-sm font-semibold ${tw.textPrimary}`}>{title}</h4>
      </div>
      <ul className={`mt-3 space-y-2 text-sm leading-6 ${tw.textSecondary}`}>
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: color.primary.accent }}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
