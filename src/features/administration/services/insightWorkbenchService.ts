import {
  API_CONFIG,
  buildApiUrl,
  getAuthHeaders,
} from "../../../shared/services/api";
import type {
  InsightWorkbenchSummary,
  WorkbenchCategory,
  WorkbenchInsight,
  WorkbenchInsightSeriesPoint,
  WorkbenchInsightStatus,
  WorkbenchLanguage,
  WorkbenchModel,
  WorkbenchModelStatus,
  WorkbenchModelSummary,
  WorkbenchNotebookCell,
  WorkbenchTemplate,
  WorkbenchWorkflowStage,
  WorkbenchWorkflowStageId,
  WorkbenchWorkflowStatus,
} from "../types/insightWorkbench";
import {
  DUMMY_WORKBENCH_MODELS,
  DUMMY_WORKBENCH_TEMPLATES,
  getDummyWorkbenchModel,
  getDummyWorkbenchSummary,
} from "../data/insightWorkbenchDummyData";
import { DUMMY_WORKBENCH_INSIGHTS } from "../data/insightWorkbenchDummyInsights";

const API_BASE = buildApiUrl(API_CONFIG.ENDPOINTS.INSIGHT_WORKBENCH);
const LANGUAGES: WorkbenchLanguage[] = ["Python", "R", "Scala"];
const STATUSES: WorkbenchModelStatus[] = ["Draft", "Ready", "Running", "Failed"];
const INSIGHT_STATUSES: WorkbenchInsightStatus[] = [
  "Published",
  "Refreshing",
  "Archived",
];
const WORKFLOW_STAGE_IDS: WorkbenchWorkflowStageId[] = [
  "ingestion",
  "discovery",
  "analytics",
  "collaboration",
];
const WORKFLOW_STATUSES: WorkbenchWorkflowStatus[] = [
  "Healthy",
  "Attention",
  "Running",
  "Not configured",
];
const USE_DEMO_DATA =
  import.meta.env.VITE_INSIGHT_WORKBENCH_DATA_SOURCE !== "api";

function waitForDemoData(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, 220);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Request aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

function asCount(value: unknown): number | null {
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? count : null;
}

function asLanguages(value: unknown): WorkbenchLanguage[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (language): language is WorkbenchLanguage =>
      typeof language === "string" &&
      LANGUAGES.includes(language as WorkbenchLanguage),
  );
}

function normalizeCategory(raw: unknown): WorkbenchCategory | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const name = String(value.name || "").trim();
  const slug = String(value.slug || value.id || "")
    .trim()
    .toLowerCase();

  if (!name || !slug) return null;

  return {
    id: String(value.id || slug),
    slug,
    name,
    description: String(value.description || "").trim(),
    modelCount: asCount(value.model_count ?? value.modelCount),
    templateCount: asCount(value.template_count ?? value.templateCount),
    languages: asLanguages(value.languages),
  };
}

function unwrapSummary(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") return {};
  const value = payload as Record<string, unknown>;
  if (value.data && typeof value.data === "object" && !Array.isArray(value.data)) {
    return value.data as Record<string, unknown>;
  }
  return value;
}

function unwrapList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const value = unwrapSummary(payload);
  return Array.isArray(value.items)
    ? value.items
    : Array.isArray(value.results)
      ? value.results
      : [];
}

function normalizeStatus(value: unknown): WorkbenchModelStatus {
  const status = String(value || "");
  return STATUSES.includes(status as WorkbenchModelStatus)
    ? (status as WorkbenchModelStatus)
    : "Draft";
}

function normalizeModel(raw: unknown): WorkbenchModelSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const id = String(value.id || "").trim();
  const name = String(value.name || "").trim();
  const language = String(value.language || "Python");
  if (!id || !name || !LANGUAGES.includes(language as WorkbenchLanguage)) {
    return null;
  }

  return {
    id,
    name,
    description: String(value.description || ""),
    categorySlug: String(value.category_slug || value.categorySlug || ""),
    language: language as WorkbenchLanguage,
    status: normalizeStatus(value.status),
    lastModifiedAt: String(
      value.last_modified_at || value.lastModifiedAt || new Date().toISOString(),
    ),
    lastModifiedBy: String(
      value.last_modified_by || value.lastModifiedBy || "Unknown",
    ),
    lastRunAt: value.last_run_at
      ? String(value.last_run_at)
      : value.lastRunAt
        ? String(value.lastRunAt)
        : undefined,
    nextRunAt: value.next_run_at
      ? String(value.next_run_at)
      : value.nextRunAt
        ? String(value.nextRunAt)
        : undefined,
  };
}

function normalizeTemplate(raw: unknown): WorkbenchTemplate | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const id = String(value.id || "").trim();
  const name = String(value.name || "").trim();
  const language = String(value.language || "Python");
  if (!id || !name || !LANGUAGES.includes(language as WorkbenchLanguage)) {
    return null;
  }
  return {
    id,
    name,
    description: String(value.description || ""),
    categorySlug: String(value.category_slug || value.categorySlug || ""),
    language: language as WorkbenchLanguage,
    cellCount: asCount(value.cell_count ?? value.cellCount) ?? 0,
    updatedAt: String(value.updated_at || value.updatedAt || new Date().toISOString()),
  };
}

function normalizeNotebookCell(raw: unknown, index: number): WorkbenchNotebookCell | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const language = String(value.language || "Python");
  if (!LANGUAGES.includes(language as WorkbenchLanguage)) return null;
  return {
    id: String(value.id || `cell-${index + 1}`),
    title: String(value.title || `Code cell ${index + 1}`),
    language: language as WorkbenchLanguage,
    code: String(value.code || ""),
    output: value.output == null ? undefined : String(value.output),
  };
}

function asStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeInsightSeries(value: unknown): WorkbenchInsightSeriesPoint[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const point = item as Record<string, unknown>;
      const numericValue = Number(point.value);
      if (!Number.isFinite(numericValue)) return null;
      return {
        label: String(point.label || ""),
        value: numericValue,
      };
    })
    .filter((point): point is WorkbenchInsightSeriesPoint => Boolean(point));
}

function normalizeInsight(raw: unknown): WorkbenchInsight | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const id = String(value.id || "").trim();
  const title = String(value.title || "").trim();
  if (!id || !title) return null;
  const rawStatus = String(value.status || "Published");
  const status = INSIGHT_STATUSES.includes(
    rawStatus as WorkbenchInsightStatus,
  )
    ? (rawStatus as WorkbenchInsightStatus)
    : "Published";

  return {
    id,
    title,
    summary: String(value.summary || ""),
    categorySlug: String(value.category_slug || value.categorySlug || ""),
    sourceModelId: String(value.source_model_id || value.sourceModelId || ""),
    sourceModelName: String(
      value.source_model_name || value.sourceModelName || "",
    ),
    status,
    publishedAt: String(
      value.published_at || value.publishedAt || new Date().toISOString(),
    ),
    publishedBy: String(value.published_by || value.publishedBy || "Unknown"),
    metricLabel: String(value.metric_label || value.metricLabel || "Metric"),
    metricValue: String(value.metric_value || value.metricValue || "—"),
    changePercent:
      Number(value.change_percent ?? value.changePercent) || 0,
    audience: String(value.audience || ""),
    series: normalizeInsightSeries(value.series),
    findings: asStrings(value.findings),
    recommendations: asStrings(value.recommendations),
  };
}

function normalizeWorkflowStage(raw: unknown): WorkbenchWorkflowStage | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const id = String(value.id || "");
  if (!WORKFLOW_STAGE_IDS.includes(id as WorkbenchWorkflowStageId)) return null;
  const rawStatus = String(value.status || "Not configured");
  const status = WORKFLOW_STATUSES.includes(
    rawStatus as WorkbenchWorkflowStatus,
  )
    ? (rawStatus as WorkbenchWorkflowStatus)
    : "Not configured";
  return {
    id: id as WorkbenchWorkflowStageId,
    status,
    metricValue: asCount(value.metric_value ?? value.metricValue),
    metricLabel: String(value.metric_label || value.metricLabel || ""),
    detail: value.detail ? String(value.detail) : undefined,
  };
}

class InsightWorkbenchService {
  isDemoMode(): boolean {
    return USE_DEMO_DATA;
  }

  private async request(
    endpoint: string,
    signal?: AbortSignal,
    options: RequestInit = {},
  ): Promise<unknown> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
      signal,
    });
    if (!response.ok) {
      throw new Error(`Insight Workbench service returned HTTP ${response.status}`);
    }
    return response.status === 204 ? {} : response.json();
  }

  async getSummary(signal?: AbortSignal): Promise<InsightWorkbenchSummary> {
    if (USE_DEMO_DATA) {
      await waitForDemoData(signal);
      return getDummyWorkbenchSummary();
    }

    const value = unwrapSummary(await this.request("/summary", signal));
    const rawCategories = Array.isArray(value.categories) ? value.categories : [];
    const categories = rawCategories
      .map(normalizeCategory)
      .filter((category): category is WorkbenchCategory => Boolean(category));
    const rawWorkflowStages = Array.isArray(value.workflow_stages)
      ? value.workflow_stages
      : Array.isArray(value.workflowStages)
        ? value.workflowStages
        : [];

    return {
      source: "api",
      categories,
      workflowStages: rawWorkflowStages
        .map(normalizeWorkflowStage)
        .filter((stage): stage is WorkbenchWorkflowStage => Boolean(stage)),
      activeModelCount: asCount(
        value.active_model_count ?? value.activeModelCount,
      ) ?? 0,
      publishedInsightCount: asCount(
        value.published_insight_count ?? value.publishedInsightCount,
      ) ?? 0,
      lastUpdatedAt: value.last_updated_at
        ? String(value.last_updated_at)
        : value.lastUpdatedAt
          ? String(value.lastUpdatedAt)
          : undefined,
    };
  }

  async listModels(
    categorySlug: string,
    signal?: AbortSignal,
  ): Promise<WorkbenchModelSummary[]> {
    if (USE_DEMO_DATA) {
      await waitForDemoData(signal);
      return DUMMY_WORKBENCH_MODELS.filter(
        (model) => model.categorySlug === categorySlug,
      );
    }
    const payload = await this.request(
      `/models?category=${encodeURIComponent(categorySlug)}`,
      signal,
    );
    return unwrapList(payload)
      .map(normalizeModel)
      .filter((model): model is WorkbenchModelSummary => Boolean(model));
  }

  async listTemplates(
    categorySlug: string,
    signal?: AbortSignal,
  ): Promise<WorkbenchTemplate[]> {
    if (USE_DEMO_DATA) {
      await waitForDemoData(signal);
      return DUMMY_WORKBENCH_TEMPLATES.filter(
        (template) => template.categorySlug === categorySlug,
      );
    }
    const payload = await this.request(
      `/templates?category=${encodeURIComponent(categorySlug)}`,
      signal,
    );
    return unwrapList(payload)
      .map(normalizeTemplate)
      .filter((template): template is WorkbenchTemplate => Boolean(template));
  }

  async getModel(
    modelId: string,
    signal?: AbortSignal,
  ): Promise<WorkbenchModel | null> {
    if (USE_DEMO_DATA) {
      await waitForDemoData(signal);
      return getDummyWorkbenchModel(modelId);
    }

    const value = unwrapSummary(
      await this.request(`/models/${encodeURIComponent(modelId)}`, signal),
    );
    const summary = normalizeModel(value);
    if (!summary) return null;
    const rawCells = Array.isArray(value.cells) ? value.cells : [];
    return {
      ...summary,
      runtime: String(value.runtime || `${summary.language} runtime`),
      engine: String(value.engine || "Apache Spark"),
      cells: rawCells
        .map(normalizeNotebookCell)
        .filter((cell): cell is WorkbenchNotebookCell => Boolean(cell)),
    };
  }

  async runModel(modelId: string): Promise<void> {
    if (USE_DEMO_DATA) {
      await waitForDemoData();
      return;
    }
    await this.request(`/models/${encodeURIComponent(modelId)}/runs`, undefined, {
      method: "POST",
      body: JSON.stringify({ trigger: "manual" }),
    });
  }

  async duplicateModel(
    model: WorkbenchModelSummary,
  ): Promise<WorkbenchModelSummary> {
    if (USE_DEMO_DATA) {
      await waitForDemoData();
      return {
        ...model,
        id: `${model.id}-copy-${Date.now()}`,
        name: `${model.name} copy`,
        status: "Draft",
        lastModifiedAt: new Date().toISOString(),
        lastModifiedBy: "Current user",
        lastRunAt: undefined,
        nextRunAt: undefined,
      };
    }
    const payload = await this.request(
      `/models/${encodeURIComponent(model.id)}/duplicate`,
      undefined,
      { method: "POST" },
    );
    const duplicate = normalizeModel(unwrapSummary(payload));
    if (!duplicate) throw new Error("The duplicated model response was invalid");
    return duplicate;
  }

  async publishModel(modelId: string): Promise<void> {
    if (USE_DEMO_DATA) {
      await waitForDemoData();
      return;
    }
    await this.request(
      `/models/${encodeURIComponent(modelId)}/publish`,
      undefined,
      { method: "POST" },
    );
  }

  async scheduleModel(modelId: string, nextRunAt: string): Promise<void> {
    if (USE_DEMO_DATA) {
      await waitForDemoData();
      return;
    }
    await this.request(
      `/models/${encodeURIComponent(modelId)}/schedule`,
      undefined,
      {
        method: "PUT",
        body: JSON.stringify({ next_run_at: nextRunAt }),
      },
    );
  }

  async deleteModel(modelId: string): Promise<void> {
    if (USE_DEMO_DATA) {
      await waitForDemoData();
      return;
    }
    await this.request(`/models/${encodeURIComponent(modelId)}`, undefined, {
      method: "DELETE",
    });
  }

  async listInsights(signal?: AbortSignal): Promise<WorkbenchInsight[]> {
    if (USE_DEMO_DATA) {
      await waitForDemoData(signal);
      return structuredClone(DUMMY_WORKBENCH_INSIGHTS);
    }
    const payload = await this.request("/insights", signal);
    return unwrapList(payload)
      .map(normalizeInsight)
      .filter((insight): insight is WorkbenchInsight => Boolean(insight));
  }
}

export const insightWorkbenchService = new InsightWorkbenchService();
