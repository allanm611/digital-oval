import type {
  CommunicationPolicyType,
  DNDConfig,
  FrequencyCappingPeriod,
  MaximumCommunicationConfig,
  TimeWindowConfig,
  VIPList,
  VIPListConfig,
  VIPListRule,
} from "../types/communicationPolicyConfig";

export interface FrequencyPeriodDraft {
  id: string;
  type: FrequencyCappingPeriod["type"];
  maxCount: number;
}

export interface VipRuleDraft {
  id: string;
  vipListId: string;
  vipListName?: string;
  action: "include" | "exclude";
  priority: number;
}

export interface VipListCatalogItem {
  id: number | string;
  name?: string;
  description?: string;
}

const PERIOD_TYPES = ["daily", "weekly", "monthly"] as const;

const EDITOR_BY_CODE: Record<string, CommunicationPolicyType> = {
  timewindow: "timeWindow",
  maximumcommunication: "maximumCommunication",
  frequencycapping: "maximumCommunication",
  frequencycap: "maximumCommunication",
  dnd: "dnd",
  donotdisturb: "dnd",
  viplist: "vipList",
  viplistrules: "vipList",
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function normalizeCode(code: string): string {
  return code.trim().toLowerCase().replace(/[\s_-]/g, "");
}

function readNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readPeriodType(value: unknown): FrequencyCappingPeriod["type"] | null {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return PERIOD_TYPES.find((type) => type === normalized) ?? null;
}

function readAction(value: unknown): "include" | "exclude" {
  return String(value ?? "").trim().toLowerCase() === "exclude"
    ? "exclude"
    : "include";
}

export function parsePolicyConfig(
  config: unknown,
): Record<string, unknown> | null {
  let value = config;
  for (let attempt = 0; attempt < 2 && typeof value === "string"; attempt += 1) {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  return asRecord(value);
}

export function parsePolicyChannels(channels: unknown): string[] {
  if (Array.isArray(channels)) {
    return channels.map((channel) => String(channel)).filter(Boolean);
  }
  if (typeof channels === "string" && channels.trim()) {
    try {
      const parsed = JSON.parse(channels);
      if (Array.isArray(parsed)) {
        return parsed.map((channel) => String(channel)).filter(Boolean);
      }
    } catch {
      return [channels];
    }
  }
  return [];
}

export function isPolicyActive(policy: {
  is_active?: boolean | string | number | null;
  isActive?: boolean | string | number | null;
}): boolean {
  const flag = policy.is_active ?? policy.isActive;
  return flag !== false && flag !== "false" && flag !== 0 && flag !== "0";
}

export function resolvePolicyEditor(
  code: string | null | undefined,
): CommunicationPolicyType | null {
  if (!code) return null;
  return EDITOR_BY_CODE[normalizeCode(code)] ?? null;
}

export function readTimeWindowConfig(config: unknown): TimeWindowConfig {
  const parsed = parsePolicyConfig(config) ?? {};
  return {
    startTime: typeof parsed.startTime === "string" ? parsed.startTime : "09:00",
    endTime: typeof parsed.endTime === "string" ? parsed.endTime : "18:00",
    timezone: typeof parsed.timezone === "string" ? parsed.timezone : "UTC",
    days: Array.isArray(parsed.days)
      ? parsed.days.map((day) => String(day)).filter(Boolean)
      : [],
  };
}

export function readDndConfig(config: unknown): DNDConfig {
  const parsed = parsePolicyConfig(config);
  const categories = parsed && Array.isArray(parsed.categories) ? parsed.categories : [];
  return {
    categories: categories
      .map((category, index) => {
        const row = asRecord(category);
        if (!row) return null;
        const value = row.value === "not allowed" ? "not allowed" : "allowed";
        return {
          id: String(row.id ?? `dnd-${index}`),
          name: typeof row.name === "string" ? row.name : "",
          description:
            typeof row.description === "string" ? row.description : undefined,
          status: row.status === "start" ? "start" as const : "stop" as const,
          type: String(row.type ?? ""),
          value,
        };
      })
      .filter((category): category is DNDConfig["categories"][number] =>
        Boolean(category),
      ),
  };
}

export function hydrateFrequencyPeriods(config: unknown): FrequencyPeriodDraft[] {
  const parsed = parsePolicyConfig(config);
  if (!parsed) return [];

  const source = Array.isArray(parsed.periods) ? parsed.periods : [];
  const fromPeriods = source
    .map((period, index) => {
      const row = asRecord(period);
      if (!row) return null;
      const type = readPeriodType(row.type ?? row.period);
      const maxCount = readNumber(row.maxCount ?? row.max_count, NaN);
      if (!type || !Number.isFinite(maxCount) || maxCount < 1) return null;
      return {
        id: `period-${type}-${index}`,
        type,
        maxCount,
      };
    })
    .filter((period): period is FrequencyPeriodDraft => Boolean(period));

  if (fromPeriods.length > 0) {
    return dedupePeriods(fromPeriods);
  }

  const legacyType = readPeriodType(parsed.type);
  const legacyCount = readNumber(parsed.maxCount ?? parsed.max_count, NaN);
  if (!legacyType || !Number.isFinite(legacyCount) || legacyCount < 1) return [];

  return [
    {
      id: `period-${legacyType}-0`,
      type: legacyType,
      maxCount: legacyCount,
    },
  ];
}

export function hydrateVipRules(config: unknown): VipRuleDraft[] {
  const parsed = parsePolicyConfig(config);
  if (!parsed) return [];

  if (Array.isArray(parsed.rules) && parsed.rules.length > 0) {
    return parsed.rules
      .map((rule, index) => toVipRuleDraft(rule, index, readAction(parsed.action), readNumber(parsed.priority, 1)))
      .filter((rule): rule is VipRuleDraft => Boolean(rule));
  }

  const lists = Array.isArray(parsed.vipLists) ? parsed.vipLists : [];
  const action = readAction(parsed.action);
  const priority = Math.max(1, readNumber(parsed.priority, 1));
  return lists
    .map((list, index) => toVipRuleDraft(list, index, action, priority))
    .filter((rule): rule is VipRuleDraft => Boolean(rule));
}

function toVipRuleDraft(
  value: unknown,
  index: number,
  fallbackAction: "include" | "exclude",
  fallbackPriority: number,
): VipRuleDraft | null {
  const row = asRecord(value);
  if (!row) return null;
  const vipListId = String(
    row.vipListId ?? row.vip_list_id ?? row.id ?? "",
  ).trim();
  if (!vipListId) return null;
  const name = row.vipListName ?? row.vip_list_name ?? row.name;
  const priority = Math.max(1, readNumber(row.priority, fallbackPriority));
  return {
    id: `vip-${vipListId}-${index}`,
    vipListId,
    vipListName: typeof name === "string" && name.trim() ? name : undefined,
    action: row.action ? readAction(row.action) : fallbackAction,
    priority,
  };
}

function dedupePeriods(periods: FrequencyPeriodDraft[]): FrequencyPeriodDraft[] {
  const seen = new Set<string>();
  return periods.filter((period) => {
    if (seen.has(period.type)) return false;
    seen.add(period.type);
    return true;
  });
}

/**
 * Writes every period, and also the single type/maxCount pair the broadcast
 * poller reads today. Daily is preferred so a "3 per day and 10 per week"
 * policy still enforces the daily cap until the engine checks every period.
 */
export function buildFrequencyCappingConfig(
  periods: FrequencyPeriodDraft[],
): MaximumCommunicationConfig {
  const cleaned = dedupePeriods(periods).filter(
    (period) => readPeriodType(period.type) && period.maxCount >= 1,
  );
  if (cleaned.length === 0) {
    throw new Error("Add at least one frequency period.");
  }

  const primary =
    cleaned.find((period) => period.type === "daily") ?? cleaned[0];

  return {
    type: primary.type,
    maxCount: primary.maxCount,
    periods: cleaned.map((period) => ({
      type: period.type,
      maxCount: period.maxCount,
    })),
  };
}

/**
 * Writes per-list rules, and a legacy vipLists payload the exclusion service
 * can apply. That service only excludes lists marked active, so exclude rules
 * are projected into vipLists with status "active". Include rules stay on
 * `rules` until the engine supports them.
 */
export function buildVipListConfig(
  rows: VipRuleDraft[],
  catalog: VipListCatalogItem[] = [],
): VIPListConfig {
  const seen = new Set<string>();
  const rules: VIPListRule[] = [];

  rows.forEach((row) => {
    const vipListId = row.vipListId.trim();
    if (!vipListId || seen.has(vipListId)) return;
    seen.add(vipListId);
    const match = catalog.find((item) => String(item.id) === vipListId);
    rules.push({
      vipListId,
      vipListName: match?.name || row.vipListName || undefined,
      action: row.action === "exclude" ? "exclude" : "include",
      priority: Math.max(1, readNumber(row.priority, 1)),
    });
  });

  if (rules.length === 0) {
    throw new Error("Add at least one VIP list rule.");
  }

  const excludeRules = rules.filter((rule) => rule.action === "exclude");
  const projected = excludeRules.length > 0 ? excludeRules : rules;
  const vipLists: VIPList[] = projected.map((rule) => {
    const match = catalog.find((item) => String(item.id) === rule.vipListId);
    return {
      id: rule.vipListId,
      name: rule.vipListName || match?.name || `VIP list ${rule.vipListId}`,
      description: match?.description,
      status: "active",
    };
  });

  return {
    action: excludeRules.length > 0 ? "exclude" : "include",
    priority: Math.min(...projected.map((rule) => rule.priority)),
    vipLists,
    rules,
  };
}

const PERIOD_LABELS: Record<FrequencyCappingPeriod["type"], string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export const POLICY_EDITOR_ORDER: CommunicationPolicyType[] = [
  "timeWindow",
  "maximumCommunication",
  "dnd",
  "vipList",
];

export const POLICY_EDITOR_LABELS: Record<CommunicationPolicyType, string> = {
  timeWindow: "Time Window",
  maximumCommunication: "Frequency Capping",
  dnd: "Do Not Disturb (DND)",
  vipList: "VIP List Rules",
};

const SLICE_KEYS: Record<CommunicationPolicyType, string[]> = {
  timeWindow: ["timeWindow", "time_window"],
  maximumCommunication: [
    "maximumCommunication",
    "frequency",
    "frequency_capping",
    "frequencyCapping",
  ],
  dnd: ["dnd", "doNotDisturb"],
  vipList: ["vipList", "vip_list", "vipListRules"],
};

function isConfigObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function firstObject(
  record: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> | null {
  for (const key of keys) {
    const value = record[key];
    if (isConfigObject(value)) return value;
  }
  return null;
}

function hasNestedConfiguration(config: Record<string, unknown>): boolean {
  return POLICY_EDITOR_ORDER.some((editor) =>
    Boolean(firstObject(config, SLICE_KEYS[editor])),
  );
}

function rootSlice(
  config: Record<string, unknown>,
  editor: CommunicationPolicyType,
): Record<string, unknown> | null {
  if (
    editor === "timeWindow" &&
    (typeof config.startTime === "string" || typeof config.endTime === "string")
  ) {
    return {
      startTime: config.startTime,
      endTime: config.endTime,
      timezone: config.timezone,
      days: config.days,
    };
  }
  if (
    editor === "maximumCommunication" &&
    (Array.isArray(config.periods) || readPeriodType(config.type))
  ) {
    return {
      type: config.type,
      maxCount: config.maxCount ?? config.max_count,
      periods: config.periods,
      resetTime: config.resetTime,
      resetDay: config.resetDay,
    };
  }
  if (editor === "dnd" && Array.isArray(config.categories)) {
    return { categories: config.categories };
  }
  if (
    editor === "vipList" &&
    (Array.isArray(config.rules) ||
      Array.isArray(config.vipLists) ||
      config.action === "include" ||
      config.action === "exclude")
  ) {
    return {
      action: config.action,
      vipLists: config.vipLists,
      rules: config.rules,
      priority: config.priority,
    };
  }
  return null;
}

export function readEditorSlice(
  policy: { type_code?: string | null; config?: unknown } | null | undefined,
  editor: CommunicationPolicyType,
): unknown {
  const config = parsePolicyConfig(policy?.config);
  if (!config) return null;

  const direct = firstObject(config, SLICE_KEYS[editor]);
  if (direct) return direct;

  const wrapped = asRecord(config.configurations);
  if (wrapped) {
    const nested = firstObject(wrapped, SLICE_KEYS[editor]);
    if (nested) return nested;
  }

  if (hasNestedConfiguration(config)) return null;

  const legacyEditor = resolvePolicyEditor(policy?.type_code);
  if (legacyEditor === editor) return config;
  if (!legacyEditor) return rootSlice(config, editor);
  return null;
}

export function listConfiguredEditors(
  policy: {
    type_code?: string | null;
    type_codes?: unknown;
    config?: unknown;
  } | null | undefined,
): CommunicationPolicyType[] {
  if (!policy) return [];
  return POLICY_EDITOR_ORDER.filter((editor) =>
    Boolean(readEditorSlice(policy, editor)),
  );
}

export function buildMultiPolicyConfig(selection: {
  timeWindow?: TimeWindowConfig | null;
  maximumCommunication?: MaximumCommunicationConfig | null;
  dnd?: DNDConfig | null;
  vipList?: VIPListConfig | null;
}): {
  type_code: string;
  type_codes: CommunicationPolicyType[];
  config: {
    timeWindow?: TimeWindowConfig;
    maximumCommunication?: MaximumCommunicationConfig;
    dnd?: DNDConfig;
    vipList?: VIPListConfig;
  };
} {
  const config: {
    timeWindow?: TimeWindowConfig;
    maximumCommunication?: MaximumCommunicationConfig;
    dnd?: DNDConfig;
    vipList?: VIPListConfig;
  } = {};

  if (selection.timeWindow) config.timeWindow = selection.timeWindow;
  if (selection.maximumCommunication) {
    config.maximumCommunication = selection.maximumCommunication;
  }
  if (selection.dnd) config.dnd = selection.dnd;
  if (selection.vipList) config.vipList = selection.vipList;

  const type_codes = POLICY_EDITOR_ORDER.filter((editor) => Boolean(config[editor]));
  return {
    type_code: type_codes.length === 1 ? type_codes[0] : "composite",
    type_codes,
    config,
  };
}

function summarizeEditor(
  editor: CommunicationPolicyType,
  config: unknown,
): string {
  if (editor === "maximumCommunication") {
    const periods = hydrateFrequencyPeriods(config);
    if (periods.length === 0) return "No frequency limits saved";
    return periods
      .map((period) => `${PERIOD_LABELS[period.type]}: ${period.maxCount}`)
      .join(" · ");
  }

  if (editor === "vipList") {
    const rules = hydrateVipRules(config);
    if (rules.length === 0) return "No VIP list rules saved";
    return rules
      .map((rule) => {
        const name = rule.vipListName || `List ${rule.vipListId}`;
        const action = rule.action === "exclude" ? "Exclude" : "Include";
        return `${name} (${action}, priority ${rule.priority})`;
      })
      .join(" · ");
  }

  if (editor === "timeWindow") {
    const timeWindow = readTimeWindowConfig(config);
    const days =
      timeWindow.days && timeWindow.days.length > 0
        ? timeWindow.days
            .map((day) => day.charAt(0).toUpperCase() + day.slice(1))
            .join(", ")
        : "All days";
    return `${timeWindow.startTime}–${timeWindow.endTime} · ${days}`;
  }

  const dnd = readDndConfig(config);
  if (dnd.categories.length === 0) return "No DND categories saved";
  return dnd.categories
    .map((category) => {
      const label = category.type || category.name || "Category";
      return `${label}: ${category.value === "not allowed" ? "Not allowed" : "Allowed"}`;
    })
    .join(" · ");
}

export function summarizePolicyConfig(
  typeCode: string | null | undefined,
  config: unknown,
  typeCodes?: unknown,
): string {
  const editors = listConfiguredEditors({
    type_code: typeCode,
    type_codes: typeCodes,
    config,
  });

  if (editors.length === 0) {
    const editor = resolvePolicyEditor(typeCode);
    if (!editor) return "No configuration saved";
    return summarizeEditor(editor, config);
  }

  return editors
    .map((editor) => {
      const slice = readEditorSlice({ type_code: typeCode, config }, editor);
      return `${POLICY_EDITOR_LABELS[editor]}: ${summarizeEditor(editor, slice)}`;
    })
    .join(" | ");
}
