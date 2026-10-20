export type WorkbenchLanguage = "Python" | "R" | "Scala";
export type WorkbenchDataSource = "api" | "demo";
export type WorkbenchModelStatus =
  | "Draft"
  | "Ready"
  | "Running"
  | "Failed";
export type WorkbenchInsightStatus = "Published" | "Refreshing" | "Archived";
export type WorkbenchWorkflowStageId =
  | "ingestion"
  | "discovery"
  | "analytics"
  | "collaboration";
export type WorkbenchWorkflowStatus =
  | "Healthy"
  | "Attention"
  | "Running"
  | "Not configured";

export interface WorkbenchWorkflowStage {
  id: WorkbenchWorkflowStageId;
  status: WorkbenchWorkflowStatus;
  metricValue: number | null;
  metricLabel: string;
  detail?: string;
}

export interface WorkbenchCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  modelCount: number | null;
  templateCount: number | null;
  languages: WorkbenchLanguage[];
}

export interface InsightWorkbenchSummary {
  categories: WorkbenchCategory[];
  publishedInsightCount: number;
  activeModelCount: number;
  lastUpdatedAt?: string;
  source: WorkbenchDataSource;
  workflowStages: WorkbenchWorkflowStage[];
}

export interface WorkbenchModelSummary {
  id: string;
  name: string;
  description: string;
  categorySlug: string;
  language: WorkbenchLanguage;
  status: WorkbenchModelStatus;
  lastModifiedAt: string;
  lastModifiedBy: string;
  lastRunAt?: string;
  nextRunAt?: string;
}

export interface WorkbenchTemplate {
  id: string;
  name: string;
  description: string;
  categorySlug: string;
  language: WorkbenchLanguage;
  cellCount: number;
  updatedAt: string;
}

export interface WorkbenchNotebookCell {
  id: string;
  title: string;
  language: WorkbenchLanguage;
  code: string;
  output?: string;
}

export interface WorkbenchModel extends WorkbenchModelSummary {
  runtime: string;
  engine: string;
  cells: WorkbenchNotebookCell[];
}

export interface WorkbenchInsightSeriesPoint {
  label: string;
  value: number;
}

export interface WorkbenchInsight {
  id: string;
  title: string;
  summary: string;
  categorySlug: string;
  sourceModelId: string;
  sourceModelName: string;
  status: WorkbenchInsightStatus;
  publishedAt: string;
  publishedBy: string;
  metricLabel: string;
  metricValue: string;
  changePercent: number;
  audience: string;
  series: WorkbenchInsightSeriesPoint[];
  findings: string[];
  recommendations: string[];
}
