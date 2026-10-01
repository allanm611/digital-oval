import type {
  WorkbenchCategory,
  WorkbenchLanguage,
} from "../types/insightWorkbench";

type CatalogCategory = Omit<WorkbenchCategory, "modelCount" | "templateCount">;

const ALL_LANGUAGES: WorkbenchLanguage[] = ["Python", "R", "Scala"];

export const INSIGHT_WORKBENCH_CATALOG: CatalogCategory[] = [
  {
    id: "behavioral-profiling",
    slug: "behavioral-profiling",
    name: "Behavioral Profiling",
    description: "Identify audience behaviors, patterns, and meaningful cohorts.",
    languages: ALL_LANGUAGES,
  },
  {
    id: "forecasting",
    slug: "forecasting",
    name: "Forecasting",
    description: "Predict future demand, trends, and business outcomes.",
    languages: ["Python", "R"],
  },
  {
    id: "location",
    slug: "location",
    name: "Location",
    description: "Explore geographic relationships and location-based signals.",
    languages: ["Python", "R"],
  },
  {
    id: "custom-models",
    slug: "custom-models",
    name: "Custom Models",
    description: "Build and manage organization-specific analytical models.",
    languages: ALL_LANGUAGES,
  },
  {
    id: "nba-nbo",
    slug: "nba-nbo",
    name: "NBA & NBO",
    description: "Determine the next best action and next best offer.",
    languages: ["Python", "R"],
  },
  {
    id: "pre-processing",
    slug: "pre-processing",
    name: "Pre-processing",
    description: "Clean, transform, and prepare data for reliable analysis.",
    languages: ALL_LANGUAGES,
  },
  {
    id: "visualization",
    slug: "visualization",
    name: "Visualization",
    description: "Turn model results into clear, shareable visual stories.",
    languages: ["Python", "R"],
  },
  {
    id: "affinity",
    slug: "affinity",
    name: "Affinity",
    description: "Discover relationships between products, events, and audiences.",
    languages: ["Python", "R"],
  },
  {
    id: "classification",
    slug: "classification",
    name: "Classification",
    description: "Assign observations to meaningful predictive classes.",
    languages: ALL_LANGUAGES,
  },
  {
    id: "clustering",
    slug: "clustering",
    name: "Clustering",
    description: "Find naturally occurring groups in large datasets.",
    languages: ALL_LANGUAGES,
  },
  {
    id: "propensity",
    slug: "propensity",
    name: "Propensity",
    description: "Score the likelihood of customer actions and outcomes.",
    languages: ["Python", "R"],
  },
  {
    id: "text-analysis",
    slug: "text-analysis",
    name: "Text Analysis",
    description: "Extract sentiment, topics, and entities from unstructured text.",
    languages: ["Python", "R"],
  },
  {
    id: "validation",
    slug: "validation",
    name: "Validation Techniques",
    description: "Evaluate model quality, stability, and generalization.",
    languages: ALL_LANGUAGES,
  },
];
