/**
 * Browser tab hover cards (Chrome and Edge) render `document.title` as the
 * card heading, then add the hostname and memory usage themselves.
 * A static title such as "Sentra CVM Platform" tells the reader nothing about
 * the open task. Titles here lead with the task, then the record, then the
 * step — the same shape Gmail and GitHub use.
 *
 * The browser still owns the card chrome, the memory line, and the background
 * tab screenshot. This module only describes the work the page is doing.
 */

export const DOCUMENT_TITLE_BRAND = "Sentra CVM";

export interface PageTask {
  /** What the user is doing. Shown first. Example: "Edit Campaign". */
  task: string;
  /** The record this task is about. Example: "Block Friday Sale 2024". */
  subject?: string;
  /** Wizard step or in-page section. Example: "Definition". */
  step?: string;
  /** Short lifecycle label. Example: "Draft". */
  status?: string;
}

const ACRONYM_SLUGS = new Set([
  "sms",
  "ussd",
  "kpi",
  "kpis",
  "etl",
  "api",
  "ui",
  "dnd",
  "vip",
  "ai",
]);

const ACRONYM_LABELS: Record<string, string> = {
  sms: "SMS",
  ussd: "USSD",
  kpi: "KPI",
  kpis: "KPIs",
  etl: "ETL",
  api: "API",
  ui: "UI",
  dnd: "DND",
  vip: "VIP",
  ai: "AI",
};

/** List and standalone pages whose label should not be guessed from the URL. */
const EXACT_TASKS: Record<string, string> = {
  "/": "Sentra",
  "/login": "Sign in",
  "/request-account": "Request an account",
  "/reset-password": "Reset password",
  "/onboard": "Welcome",
  "/landingpage": "Home",
  "/documentation": "Documentation",
  "/documentation/edit": "Edit documentation",
  "/documentation/add": "Add documentation",
  "/documentation/manage-sidebar": "Manage documentation sidebar",
  "/health-check": "Health Check",
  "/health-check/create": "Create health check module",
  "/health-check/insights": "Health check insights",
  "/health-check/notifications": "Health check notifications",
  "/health-check/api-tests": "API tests",
  "/health-check/ui-tests": "UI flow tests",
  "/health-check/generate": "Generate tests",
  "/dashboard": "Dashboard",
  "/dashboard/administration": "Administration",
  "/dashboard/ai-models": "AI models",
  "/dashboard/ai-models/insight-workbench": "Insight Workbench",
  "/dashboard/ai-models/configuration": "AI model configuration",
  "/dashboard/monitoring": "Monitoring",
  "/dashboard/campaigns": "All Campaigns",
  "/dashboard/campaigns/analytics": "Campaign analytics",
  "/dashboard/campaigns/create": "Create Campaign",
  "/dashboard/campaign-catalogs": "Campaign Catalogs",
  "/dashboard/campaign-types": "Campaign Types",
  "/dashboard/campaign-objectives": "Campaign Objective",
  "/dashboard/access-control": "Access Control",
  "/dashboard/departments": "Departments",
  "/dashboard/line-of-business": "Line of Business",
  "/dashboard/policy-types": "Policy Types",
  "/dashboard/programs": "Programs",
  "/dashboard/campaign-broadcasts": "Campaign Broadcasts",
  "/dashboard/campaign-communication-policy": "Communication Policy",
  "/dashboard/offers": "All Offers",
  "/dashboard/offers/create": "Create Offer",
  "/dashboard/offer-creatives": "Offer Creatives",
  "/dashboard/products": "All Products",
  "/dashboard/products/create": "Create Product",
  "/dashboard/products/catalogs": "Product Catalogs",
  "/dashboard/product-types": "Product Types",
  "/dashboard/resource-types": "Resource Types",
  "/dashboard/utilities": "Utilities",
  "/dashboard/combo-types": "Combo Types",
  "/dashboard/combo-types/create": "Create Combo Type",
  "/dashboard/notification-types": "Notification Types",
  "/dashboard/notification-categories": "Notification Categories",
  "/dashboard/offer-types": "Offer Types",
  "/dashboard/offer-catalogs": "Offer Catalogs",
  "/dashboard/user-management": "User Management",
  "/dashboard/user-management/analytics": "User analytics",
  "/dashboard/profile": "My Profile",
  "/dashboard/segments": "All Segments",
  "/dashboard/segments/analytics": "Segment analytics",
  "/dashboard/segment-catalogs": "Segment Catalogs",
  "/dashboard/segment-list": "Segment List",
  "/dashboard/segment-types": "Segment Types",
  "/dashboard/control-groups": "Control Groups",
  "/dashboard/control-groups/create": "Create Control Group",
  "/dashboard/manual-broadcasts": "Manual Broadcasts",
  "/dashboard/manual-communications": "Manual Communications",
  "/dashboard/manual-communications/create": "Create Manual Communication",
  "/dashboard/manual-rewards": "Manual Rewards",
  "/dashboard/manual-rewards/create": "Create Manual Reward",
  "/dashboard/quick-lists": "QuickLists",
  "/dashboard/communications/analytics": "Communication analytics",
  "/dashboard/customers": "Customers",
  "/dashboard/loyalty-programs": "Loyalty Programs",
  "/dashboard/loyalty-programs/create": "Create Loyalty Program",
  "/dashboard/configuration": "Configurations",
  "/dashboard/offer-tracking-sources": "Offer Tracking Sources",
  "/dashboard/creative-templates": "Creative Templates",
  "/dashboard/creative-templates/create": "Create Creative Template",
  "/dashboard/reward-types": "Reward Types",
  "/dashboard/sender-ids": "Sender IDs",
  "/dashboard/languages": "Languages",
  "/dashboard/character-sets": "Character Sets",
  "/dashboard/character-sets/create": "Create Character Set",
  "/dashboard/dynamic-message-variables": "Dynamic Message Variables",
  "/dashboard/communication-channels": "Communication Channels",
  "/dashboard/dnd-types": "DND Types",
  "/dashboard/timezones": "Timezones",
  "/dashboard/timezones/create": "Create Timezone",
  "/dashboard/roles": "Roles",
  "/dashboard/sms-test": "SMS Test",
  "/dashboard/manual-rewards-test": "Manual Rewards Test",
  "/dashboard/customer-identity": "Customer Identity",
  "/dashboard/search": "Search",
  "/dashboard/reports/overview": "Overall Dashboard Performance",
  "/dashboard/reports/customer-profiles": "Customer Profile Reports",
  "/dashboard/reports/customer-profiles/search": "Customer profile search",
  "/dashboard/reports/campaigns": "Campaign Reports",
  "/dashboard/reports/offers": "Offer Reports",
  "/dashboard/reports/segments": "Segment Reports",
  "/dashboard/reports/delivery": "Delivery & SMS Reports",
  "/dashboard/reports/email-delivery": "Delivery & Email Reports",
  "/dashboard/analytics/analyse": "Analyse",
  "/dashboard/analytics/analyse/new": "Create analysis",
  "/dashboard/settings": "Settings",
  "/dashboard/servers": "Servers",
  "/dashboard/servers/new": "Create Server",
  "/dashboard/connection-profiles": "Connection Profiles",
  "/dashboard/connection-profiles/new": "Create Connection Profile",
  "/dashboard/connection-profiles/analytics": "Connection profile analytics",
  "/dashboard/connection-profile-pipelines": "Connection Profile Pipelines",
  "/dashboard/connection-profile-pipelines/new": "Create Connection Profile Pipeline",
  "/dashboard/data-connectors": "Data Connectors",
  "/dashboard/kpis": "KPIs",
  "/dashboard/jobs": "Scheduled Jobs",
  "/dashboard/scheduled-jobs": "Scheduled Jobs",
  "/dashboard/scheduled-jobs/create": "Create Scheduled Job",
  "/dashboard/scheduled-jobs/analytics": "Scheduled job analytics",
  "/dashboard/job-types": "Job Types",
  "/dashboard/job-dependencies": "Job Dependencies",
  "/dashboard/job-dependencies/analytics": "Job dependency analytics",
  "/dashboard/job-workflow-steps": "Job Workflow Steps",
  "/dashboard/job-workflow-steps/create": "Create Job Workflow Step",
  "/dashboard/job-workflow-steps/analytics": "Job workflow step analytics",
  "/dashboard/workflows": "Job Workflows",
  "/dashboard/workflows/create": "Create Workflow",
  "/dashboard/workflows/analytics": "Workflow analytics",
  "/dashboard/job-executions": "Job Executions",
  "/dashboard/job-executions/analytics": "Job execution analytics",
  "/dashboard/step-executions": "Step Executions",
  "/dashboard/step-executions/analytics": "Step execution analytics",
  "/dashboard/notifications": "Notifications",
  "/dashboard/notification-settings": "Notification Settings",
  "/dashboard/dnd-management": "DND Management",
  "/dashboard/dnd-management/bulk": "DND bulk management",
  "/dashboard/vip-list-management": "VIP List",
  "/dashboard/seed-list-management": "Seed List",
  "/dashboard/etl": "ETL File Registry",
  "/dashboard/etl/fetch": "ETL fetch",
  "/dashboard/etl/analytics": "ETL analytics",
};

type TaskPattern = {
  match: RegExp;
  task: string | ((match: RegExpMatchArray) => string);
};

/** Routes whose URL shape would otherwise describe the wrong task. */
const PATTERN_TASKS: TaskPattern[] = [
  {
    match: /^\/dashboard\/analytics\/analyse\/[^/]+\/results$/,
    task: "Analysis results",
  },
  {
    match: /^\/dashboard\/analytics\/analyse\/[^/]+$/,
    task: "Analysis",
  },
  {
    match: /^\/dashboard\/campaigns\/[^/]+\/flows\/[^/]+$/,
    task: "Campaign flow",
  },
  {
    match: /^\/dashboard\/campaigns\/[^/]+\/report$/,
    task: "Campaign report",
  },
  {
    match: /^\/dashboard\/reports\/offers\/[^/]+$/,
    task: "Offer report",
  },
  {
    match: /^\/dashboard\/customers\/details\/[^/]+$/,
    task: "Customer 360",
  },
  {
    match: /^\/dashboard\/ai-models\/insight-workbench\/categories\/[^/]+$/,
    task: "Insight Workbench",
  },
  {
    match: /^\/dashboard\/ai-models\/insight-workbench\/models\/[^/]+$/,
    task: "Insight model",
  },
  {
    match: /^\/dashboard\/ai-models\/configuration\/[^/]+\/edit$/,
    task: "Edit AI model configuration",
  },
  {
    match: /^\/dashboard\/ai-models\/configuration\/[^/]+$/,
    task: "AI model configuration",
  },
  {
    match: /^\/dashboard\/monitoring\/[^/]+$/,
    task: "Execution details",
  },
  {
    match: /^\/dashboard\/dnd-management\/[^/]+\/[^/]+$/,
    task: "DND subscription",
  },
  {
    match: /^\/dashboard\/dnd-management\/([^/]+)$/,
    task: (match) => `DND ${titleCaseSlug(match[1] || "channel")}`,
  },
  {
    match: /^\/documentation\/.+/,
    task: "Documentation",
  },
];

const TRAILING_ACTIONS: Record<
  string,
  (entity: string, entityPlural: string) => string
> = {
  create: (entity) => `Create ${entity}`,
  new: (entity) => `Create ${entity}`,
  edit: (entity) => `Edit ${entity}`,
  add: (entity) => `Add ${entity}`,
  details: (entity) => `${entity} Details`,
  analytics: (_entity, plural) => `${plural} Analytics`,
  report: (entity) => `${entity} Report`,
  logs: (entity) => `${entity} Logs`,
  schedule: (entity) => `${entity} Schedule`,
  bulk: (_entity, plural) => `${plural} Bulk`,
  fetch: (entity) => `${entity} Fetch`,
  search: (entity) => `${entity} Search`,
  "approval-history": (entity) => `${entity} Approval History`,
  "lifecycle-history": (entity) => `${entity} Lifecycle History`,
};

function clean(value?: string | null): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizePath(pathname: string): string {
  if (!pathname) return "/";
  const withSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (withSlash.length > 1 && withSlash.endsWith("/")) {
    return withSlash.slice(0, -1);
  }
  return withSlash;
}

function isIdSegment(segment: string): boolean {
  return (
    /^\d+$/.test(segment) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      segment,
    ) ||
    /^[0-9a-f]{16,}$/i.test(segment)
  );
}

function singularSlug(slug: string): string {
  if (slug === "kpis") return "kpi";
  if (ACRONYM_SLUGS.has(slug)) return slug;
  if (slug.endsWith("ies")) return `${slug.slice(0, -3)}y`;
  if (slug.endsWith("s") && !slug.endsWith("ss")) return slug.slice(0, -1);
  return slug;
}

function titleCaseSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => {
      const acronym = ACRONYM_LABELS[word.toLowerCase()];
      if (acronym) return acronym;
      return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
    })
    .join(" ");
}

function entityLabels(slug: string): { singular: string; plural: string } {
  return {
    singular: titleCaseSlug(singularSlug(slug)),
    plural: titleCaseSlug(slug),
  };
}

function findEntitySlug(segments: string[], beforeIndex: number): string | null {
  for (let index = beforeIndex - 1; index >= 0; index -= 1) {
    const segment = segments[index];
    if (
      !segment ||
      segment === "dashboard" ||
      isIdSegment(segment) ||
      TRAILING_ACTIONS[segment]
    ) {
      continue;
    }
    return segment;
  }
  return null;
}

function taskFromAction(segments: string[], actionIndex: number): string | null {
  const action = segments[actionIndex];
  const build = action ? TRAILING_ACTIONS[action] : undefined;
  if (!action || !build) return null;
  const entitySlug = findEntitySlug(segments, actionIndex);
  if (!entitySlug) return titleCaseSlug(action);
  const labels = entityLabels(entitySlug);
  return build(labels.singular, labels.plural);
}

function taskFromPath(pathname: string): string {
  const exact = EXACT_TASKS[pathname];
  if (exact) return exact;

  for (const pattern of PATTERN_TASKS) {
    const match = pathname.match(pattern.match);
    if (!match) continue;
    return typeof pattern.task === "function" ? pattern.task(match) : pattern.task;
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "Sentra";

  const lastIndex = segments.length - 1;
  const last = segments[lastIndex] || "";

  if (isIdSegment(last)) {
    const previous = segments[lastIndex - 1];
    if (previous && TRAILING_ACTIONS[previous]) {
      return taskFromAction(segments, lastIndex - 1) || "Details";
    }
    const entitySlug = findEntitySlug(segments, lastIndex);
    return entitySlug ? `${entityLabels(entitySlug).singular} Details` : "Details";
  }

  const fromAction = taskFromAction(segments, lastIndex);
  if (fromAction) return fromAction;

  return titleCaseSlug(last);
}

export function formatTaskStatus(status?: string | null): string | undefined {
  const value = clean(status);
  if (!value) return undefined;
  return value
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function clip(value: string | undefined, max: number): string | undefined {
  if (!value) return undefined;
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

export function formatDocumentTitle(task: PageTask): string {
  const taskLabel = clip(clean(task.task), 60) || DOCUMENT_TITLE_BRAND;
  const subject = clip(clean(task.subject), 80);
  const step = clip(clean(task.step), 40);
  const status = clip(clean(task.status), 24);
  const head = subject ? `${taskLabel}: ${subject}` : taskLabel;
  const detail = [step, status].filter(Boolean).join(" · ");
  const body = detail ? `${head} · ${detail}` : head;
  if (body === DOCUMENT_TITLE_BRAND) return DOCUMENT_TITLE_BRAND;
  return `${body} - ${DOCUMENT_TITLE_BRAND}`;
}

export function mergePageTask(
  base: PageTask,
  override?: Partial<PageTask> | null,
): PageTask {
  if (!override) return base;
  return {
    task: clean(override.task) ?? base.task,
    subject:
      override.subject !== undefined ? clean(override.subject) : base.subject,
    step: override.step !== undefined ? clean(override.step) : base.step,
    status:
      override.status !== undefined ? clean(override.status) : base.status,
  };
}

export function resolvePageTask(pathname: string, search = ""): PageTask {
  const path = normalizePath(pathname);

  if (path === "/dashboard/search") {
    const params = new URLSearchParams(search);
    const query = clean(params.get("q") || params.get("query"));
    return query ? { task: "Search", subject: query } : { task: "Search" };
  }

  return { task: taskFromPath(path) };
}
