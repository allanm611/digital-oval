import { INSIGHT_WORKBENCH_CATALOG } from "../constants/insightWorkbenchCatalog";
import type {
  InsightWorkbenchSummary,
  WorkbenchModel,
  WorkbenchModelSummary,
  WorkbenchTemplate,
} from "../types/insightWorkbench";

export const DUMMY_WORKBENCH_MODELS: WorkbenchModelSummary[] = [
  {
    id: "customer-behavior-profile",
    name: "Customer behavior profile",
    description: "Builds reusable behavioral features from recent customer activity.",
    categorySlug: "behavioral-profiling",
    language: "Python",
    status: "Ready",
    lastModifiedAt: "2026-09-28T09:42:00Z",
    lastModifiedBy: "Amina Yusuf",
    lastRunAt: "2026-09-30T06:15:00Z",
    nextRunAt: "2026-10-01T06:00:00Z",
  },
  {
    id: "churn-signal-explorer",
    name: "Churn signal explorer",
    description: "Explores behavioral changes that commonly precede churn.",
    categorySlug: "behavioral-profiling",
    language: "R",
    status: "Draft",
    lastModifiedAt: "2026-09-29T13:08:00Z",
    lastModifiedBy: "David Kimani",
  },
  {
    id: "weekly-demand-forecast",
    name: "Weekly demand forecast",
    description: "Forecasts weekly product demand with seasonality adjustments.",
    categorySlug: "forecasting",
    language: "Python",
    status: "Ready",
    lastModifiedAt: "2026-09-27T16:20:00Z",
    lastModifiedBy: "Priya Shah",
    lastRunAt: "2026-09-30T05:00:00Z",
    nextRunAt: "2026-10-07T05:00:00Z",
  },
  {
    id: "regional-opportunity-map",
    name: "Regional opportunity map",
    description: "Scores commercial opportunity by geography and service coverage.",
    categorySlug: "location",
    language: "Python",
    status: "Ready",
    lastModifiedAt: "2026-09-24T11:35:00Z",
    lastModifiedBy: "John Mwangi",
    lastRunAt: "2026-09-29T08:30:00Z",
  },
  {
    id: "next-best-offer",
    name: "Next best offer",
    description: "Ranks eligible offers for each customer using behavioral context.",
    categorySlug: "nba-nbo",
    language: "Scala",
    status: "Running",
    lastModifiedAt: "2026-09-30T07:02:00Z",
    lastModifiedBy: "Amina Yusuf",
    lastRunAt: "2026-09-30T07:05:00Z",
  },
  {
    id: "customer-value-clusters",
    name: "Customer value clusters",
    description: "Groups customers by value, engagement, and purchase frequency.",
    categorySlug: "clustering",
    language: "Python",
    status: "Ready",
    lastModifiedAt: "2026-09-25T10:10:00Z",
    lastModifiedBy: "Grace Otieno",
    lastRunAt: "2026-09-29T22:00:00Z",
  },
  {
    id: "campaign-response-propensity",
    name: "Campaign response propensity",
    description: "Scores the likelihood that a customer responds to a campaign.",
    categorySlug: "propensity",
    language: "R",
    status: "Failed",
    lastModifiedAt: "2026-09-30T08:12:00Z",
    lastModifiedBy: "David Kimani",
    lastRunAt: "2026-09-30T08:15:00Z",
  },
  {
    id: "support-sentiment",
    name: "Support sentiment",
    description: "Extracts sentiment and themes from customer support conversations.",
    categorySlug: "text-analysis",
    language: "Python",
    status: "Ready",
    lastModifiedAt: "2026-09-23T14:44:00Z",
    lastModifiedBy: "Priya Shah",
    lastRunAt: "2026-09-30T04:00:00Z",
  },
];

export const DUMMY_WORKBENCH_TEMPLATES: WorkbenchTemplate[] = [
  {
    id: "behavior-profile-starter",
    name: "Behavior profile starter",
    description: "Load event data, derive recency and frequency features, and register a profile.",
    categorySlug: "behavioral-profiling",
    language: "Python",
    cellCount: 4,
    updatedAt: "2026-09-18T10:00:00Z",
  },
  {
    id: "churn-exploration-r",
    name: "Churn exploration",
    description: "Explore churn indicators with descriptive statistics and correlation plots.",
    categorySlug: "behavioral-profiling",
    language: "R",
    cellCount: 5,
    updatedAt: "2026-09-12T09:30:00Z",
  },
  {
    id: "time-series-forecast",
    name: "Time-series forecast",
    description: "Prepare a time series, evaluate seasonality, and produce a forecast.",
    categorySlug: "forecasting",
    language: "Python",
    cellCount: 6,
    updatedAt: "2026-09-20T15:45:00Z",
  },
  {
    id: "geo-segmentation",
    name: "Geographic segmentation",
    description: "Create location features and cluster customers by geographic behavior.",
    categorySlug: "location",
    language: "Python",
    cellCount: 5,
    updatedAt: "2026-09-08T08:10:00Z",
  },
  {
    id: "next-best-action-starter",
    name: "Next best action starter",
    description: "Rank customer actions using eligibility and propensity signals.",
    categorySlug: "nba-nbo",
    language: "Scala",
    cellCount: 7,
    updatedAt: "2026-09-21T12:15:00Z",
  },
  {
    id: "data-quality-checks",
    name: "Data quality checks",
    description: "Profile missing values, duplicates, distributions, and schema drift.",
    categorySlug: "pre-processing",
    language: "Python",
    cellCount: 5,
    updatedAt: "2026-09-22T11:00:00Z",
  },
  {
    id: "customer-clustering",
    name: "Customer clustering",
    description: "Scale customer features, select cluster count, and evaluate cohesion.",
    categorySlug: "clustering",
    language: "Python",
    cellCount: 6,
    updatedAt: "2026-09-25T16:20:00Z",
  },
  {
    id: "binary-propensity",
    name: "Binary propensity model",
    description: "Train and validate a binary response propensity model.",
    categorySlug: "propensity",
    language: "R",
    cellCount: 6,
    updatedAt: "2026-09-19T13:40:00Z",
  },
  {
    id: "sentiment-analysis",
    name: "Sentiment analysis",
    description: "Clean text, score sentiment, and summarize dominant themes.",
    categorySlug: "text-analysis",
    language: "Python",
    cellCount: 5,
    updatedAt: "2026-09-26T07:50:00Z",
  },
  {
    id: "cross-validation",
    name: "Cross-validation",
    description: "Compare candidate models with repeatable cross-validation.",
    categorySlug: "validation",
    language: "Python",
    cellCount: 4,
    updatedAt: "2026-09-14T10:30:00Z",
  },
];

const CUSTOMER_PROFILE_CELLS = [
  {
    id: "cell-1",
    title: "Create a SparkLib session",
    language: "Python" as const,
    code: `# Create an instance of the analytics Spark library
from sentra_sparklib import SparkLib

spark_lib = SparkLib()`,
    output: "SparkLib session created · Spark 3.5.1 · READY",
  },
  {
    id: "cell-2",
    title: "Load the customer activity frame",
    language: "Python" as const,
    code: `activity = spark_lib.getDataFrameWithName(
    "customer_daily_activity",
    use_cache=True,
)

activity.select(
    "customer_id",
    "event_date",
    "purchase_count",
    "engagement_score",
).show(5)`,
    output: `+-----------+----------+--------------+----------------+
|customer_id|event_date|purchase_count|engagement_score|
+-----------+----------+--------------+----------------+
|C-10491    |2026-09-29|             3|            0.82|
|C-10922    |2026-09-29|             1|            0.61|
|C-11804    |2026-09-29|             7|            0.93|
|C-12017    |2026-09-29|             0|            0.34|
|C-12580    |2026-09-29|             2|            0.76|
+-----------+----------+--------------+----------------+
only showing top 5 rows`,
  },
  {
    id: "cell-3",
    title: "Discover behavioral clusters",
    language: "Python" as const,
    code: `feature_columns = [
    "purchase_count",
    "engagement_score",
    "days_since_last_activity",
]

clusters = spark_lib.registerDiscoveredCluster(
    activity,
    feature_columns,
    num_clusters=5,
    output_column="behavior_cluster",
)`,
    output: "Behavioral clustering completed · 5 clusters discovered · 4.8s",
  },
  {
    id: "cell-4",
    title: "Publish profile attributes",
    language: "Python" as const,
    code: `spark_lib.updateCustomerProfile(
    clusters,
    customer_id_column="customer_id",
    profile_field="behavior_cluster",
    write_mode="merge",
)`,
    output: "Profile update completed · 248,916 customer records updated",
  },
];

export const DUMMY_WORKBENCH_MODELS_BY_ID: Record<string, WorkbenchModel> = {
  "customer-behavior-profile": {
    ...DUMMY_WORKBENCH_MODELS[0],
    runtime: "Python 3.11",
    engine: "Apache Spark 3.5",
    cells: CUSTOMER_PROFILE_CELLS,
  },
};

export function getDummyWorkbenchModel(modelId: string): WorkbenchModel | null {
  const detailed = DUMMY_WORKBENCH_MODELS_BY_ID[modelId];
  if (detailed) return structuredClone(detailed);

  const summary = DUMMY_WORKBENCH_MODELS.find(({ id }) => id === modelId);
  if (!summary) return null;

  return {
    ...summary,
    runtime: `${summary.language} runtime`,
    engine: "Apache Spark 3.5",
    cells: structuredClone(CUSTOMER_PROFILE_CELLS.slice(0, 2)),
  };
}

export function getDummyWorkbenchSummary(): InsightWorkbenchSummary {
  return {
    source: "demo",
    activeModelCount: DUMMY_WORKBENCH_MODELS.filter(
      ({ status }) => status === "Ready" || status === "Running",
    ).length,
    publishedInsightCount: 6,
    lastUpdatedAt: "2026-09-30T08:30:00Z",
    workflowStages: [
      {
        id: "ingestion",
        status: "Healthy",
        metricValue: 8,
        metricLabel: "active pipelines",
        detail: "All scheduled sources are within their freshness targets.",
      },
      {
        id: "discovery",
        status: "Attention",
        metricValue: 12,
        metricLabel: "profiled datasets",
        detail: "2 data-quality findings require review.",
      },
      {
        id: "analytics",
        status: "Running",
        metricValue: DUMMY_WORKBENCH_MODELS.filter(
          ({ status }) => status === "Ready" || status === "Running",
        ).length,
        metricLabel: "active models",
        detail: "1 model execution is currently in progress.",
      },
      {
        id: "collaboration",
        status: "Healthy",
        metricValue: 6,
        metricLabel: "published insights",
        detail: "5 insights are current and 1 is refreshing.",
      },
    ],
    categories: INSIGHT_WORKBENCH_CATALOG.map((category) => ({
      ...category,
      modelCount: DUMMY_WORKBENCH_MODELS.filter(
        ({ categorySlug }) => categorySlug === category.slug,
      ).length,
      templateCount: DUMMY_WORKBENCH_TEMPLATES.filter(
        ({ categorySlug }) => categorySlug === category.slug,
      ).length,
    })),
  };
}
