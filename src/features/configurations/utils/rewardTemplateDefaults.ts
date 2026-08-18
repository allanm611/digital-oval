import { rewardConfigurationService } from "../services/rewardConfigurationService";
import { rewardProviderService } from "../services/rewardProviderService";
import type {
  CreateRewardConfigurationRequest,
  RewardConfiguration,
} from "../types/rewardConfiguration";
import type {
  RewardProvider,
  RewardProviderSchemaField,
} from "../types/rewardProvider";
import {
  buildInitialConfigValues,
  normalizeConfigFields,
  resolveSchemaConfigValues,
} from "../components/reward-forms/rewardSchemaFieldUtils";

/** Canonical name for the system default template created per provider */
export const DEFAULT_REWARD_TEMPLATE_NAME = "Default Template";

/**
 * Virtual (client-side) default template ids: BASE - providerId.
 * Used when the API cannot persist a default yet — still selectable in the UI.
 */
export const VIRTUAL_DEFAULT_TEMPLATE_ID_BASE = -1_000_000_000;

export type SyncDefaultTemplateResult = {
  template: RewardConfiguration | null;
  /** True when a persisted default was created or updated */
  synced: boolean;
  /** True when stored configs already matched the provider */
  skipped: boolean;
  error?: string;
};

/** In-flight ensure calls keyed by provider id (dedupe concurrent UI loads) */
const ensureInFlight = new Map<number, Promise<RewardConfiguration>>();

/** In-flight default-template syncs keyed by provider id */
const syncInFlight = new Map<number, Promise<SyncDefaultTemplateResult>>();

export function toVirtualDefaultTemplateId(providerId: number): number {
  return VIRTUAL_DEFAULT_TEMPLATE_ID_BASE - providerId;
}

export function isVirtualDefaultTemplateId(
  id: number | string | null | undefined,
): boolean {
  const n = Number(id);
  return Number.isFinite(n) && n <= VIRTUAL_DEFAULT_TEMPLATE_ID_BASE;
}

export function providerIdFromVirtualTemplateId(
  id: number | string,
): number | null {
  const n = Number(id);
  if (!isVirtualDefaultTemplateId(n)) return null;
  return VIRTUAL_DEFAULT_TEMPLATE_ID_BASE - n;
}

export function isDefaultRewardTemplate(
  config: Pick<RewardConfiguration, "name" | "is_default" | "is_default_template"> & {
    is_virtual?: boolean;
  },
): boolean {
  if (
    config.is_virtual === true ||
    config.is_default === true ||
    config.is_default_template === true
  ) {
    return true;
  }
  const name = config.name?.trim().toLowerCase() || "";
  return (
    name === DEFAULT_REWARD_TEMPLATE_NAME.toLowerCase() ||
    name === "default configuration" ||
    name === "default reward configuration"
  );
}

/**
 * Duplicate is allowed for persisted, active templates — including the
 * protected default (the copy is never marked default).
 */
export function canDuplicateRewardTemplate(
  config: Pick<RewardConfiguration, "id" | "is_active"> & {
    is_virtual?: boolean;
  },
): { allowed: boolean; reason?: string } {
  if (config.is_virtual === true || isVirtualDefaultTemplateId(config.id)) {
    return {
      allowed: false,
      reason: "Save this template before duplicating it.",
    };
  }
  if (!config.id || config.id <= 0) {
    return { allowed: false, reason: "This template cannot be duplicated." };
  }
  if (config.is_active === false) {
    return {
      allowed: false,
      reason: "Activate the template before duplicating it.",
    };
  }
  return { allowed: true };
}

export function formatRewardTemplateOptionLabel(
  config: Pick<RewardConfiguration, "id" | "name" | "is_default"> & {
    is_virtual?: boolean;
  },
): string {
  const name = config.name?.trim() || `Template #${config.id}`;
  if (!isDefaultRewardTemplate(config)) return name;
  if (/default\s*(template|configuration)/i.test(name)) return name;
  return `${name} (default)`;
}

/**
 * Prefer a single canonical default when duplicates exist (race / double-seed).
 * Order: persisted over virtual → is_default flag → lowest positive id.
 */
export function preferDefaultRewardTemplate(
  candidates: RewardConfiguration[],
): RewardConfiguration | undefined {
  if (candidates.length === 0) return undefined;
  return [...candidates].sort((a, b) => {
    const aVirtual = a.is_virtual === true || isVirtualDefaultTemplateId(a.id) ? 1 : 0;
    const bVirtual = b.is_virtual === true || isVirtualDefaultTemplateId(b.id) ? 1 : 0;
    if (aVirtual !== bVirtual) return aVirtual - bVirtual;
    const aFlag = a.is_default === true ? 0 : 1;
    const bFlag = b.is_default === true ? 0 : 1;
    if (aFlag !== bFlag) return aFlag - bFlag;
    return a.id - b.id;
  })[0];
}

/**
 * Deduplicate by id and keep at most one default template per provider list.
 * Prevents "Default Template" appearing twice in Reward Template dropdowns.
 */
export function dedupeRewardTemplates(
  configs: RewardConfiguration[],
): RewardConfiguration[] {
  const byId = new Map<number, RewardConfiguration>();
  for (const config of configs) {
    const prev = byId.get(config.id);
    if (!prev) {
      byId.set(config.id, config);
      continue;
    }
    // Prefer the richer / flagged record when the same id appears twice.
    byId.set(config.id, {
      ...prev,
      ...config,
      name: config.name?.trim() || prev.name,
      is_default: config.is_default ?? prev.is_default,
      is_virtual: config.is_virtual ?? prev.is_virtual,
    });
  }

  const unique = [...byId.values()];
  const defaults = unique.filter(isDefaultRewardTemplate);
  if (defaults.length <= 1) return unique;

  const keep = preferDefaultRewardTemplate(defaults);
  if (!keep) return unique;
  return unique.filter(
    (c) => !isDefaultRewardTemplate(c) || c.id === keep.id,
  );
}

/** Default templates first, then alphabetical by name */
export function sortRewardTemplates(
  configs: RewardConfiguration[],
): RewardConfiguration[] {
  return dedupeRewardTemplates(configs).sort((a, b) => {
    const aDefault = isDefaultRewardTemplate(a) ? 0 : 1;
    const bDefault = isDefaultRewardTemplate(b) ? 0 : 1;
    if (aDefault !== bDefault) return aDefault - bDefault;
    return (a.name || "").localeCompare(b.name || "", undefined, {
      sensitivity: "base",
    });
  });
}

function schemaFieldsOf(
  schema: RewardProvider["auth_schema"] | RewardProvider["payload_schema"] | undefined,
): RewardProviderSchemaField[] {
  return schema?.fields || [];
}

function storedConfigOnSchema(
  fields: RewardProviderSchemaField[],
  stored?: Record<string, unknown>,
): Record<string, unknown> {
  return normalizeConfigFields(fields, buildInitialConfigValues(fields, stored));
}

function stableConfigKey(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function configMapsEqual(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): boolean {
  const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)])).sort();
  return keys.every((key) => stableConfigKey(a[key]) === stableConfigKey(b[key]));
}

/**
 * Build auth/payload maps from every provider schema field + its default value.
 */
export function buildProviderSchemaDefaultConfigs(provider: RewardProvider): {
  auth_config: Record<string, unknown>;
  payload_config: Record<string, unknown>;
} {
  const authFields = schemaFieldsOf(provider.auth_schema);
  const payloadFields = schemaFieldsOf(provider.payload_schema);
  return {
    auth_config: normalizeConfigFields(
      authFields,
      buildInitialConfigValues(authFields),
    ),
    payload_config: normalizeConfigFields(
      payloadFields,
      buildInitialConfigValues(payloadFields),
    ),
  };
}

/**
 * Default template configs that mirror the current provider schema.
 * Preserves stored secrets when the schema default is empty or masked.
 */
export function resolveDefaultTemplateConfigs(
  provider: RewardProvider,
  stored?: Pick<RewardConfiguration, "auth_config" | "payload_config"> | null,
): {
  auth_config: Record<string, unknown>;
  payload_config: Record<string, unknown>;
} {
  const authFields = schemaFieldsOf(provider.auth_schema);
  const payloadFields = schemaFieldsOf(provider.payload_schema);
  return {
    auth_config: normalizeConfigFields(
      authFields,
      resolveSchemaConfigValues(authFields, stored?.auth_config, "default_template"),
    ),
    payload_config: normalizeConfigFields(
      payloadFields,
      resolveSchemaConfigValues(
        payloadFields,
        stored?.payload_config,
        "default_template",
      ),
    ),
  };
}

/**
 * Overlay current provider defaults onto a template for display / grant use.
 * Default templates inherit every field; custom templates inherit locked fields.
 */
export function applyProviderDefaultsToTemplate(
  template: RewardConfiguration,
  provider: RewardProvider,
): RewardConfiguration {
  const mode = isDefaultRewardTemplate(template)
    ? "default_template"
    : "custom_template";
  const authFields = schemaFieldsOf(provider.auth_schema);
  const payloadFields = schemaFieldsOf(provider.payload_schema);
  return {
    ...template,
    auth_config: resolveSchemaConfigValues(
      authFields,
      template.auth_config,
      mode,
    ),
    payload_config: resolveSchemaConfigValues(
      payloadFields,
      template.payload_config,
      mode,
    ),
    provider_name: template.provider_name || provider.name,
    reward_type: template.reward_type || provider.reward_type,
    api_path: template.api_path || provider.api_path,
  };
}

function defaultTemplateHasDrift(
  provider: RewardProvider,
  stored: RewardConfiguration,
  desired: {
    auth_config: Record<string, unknown>;
    payload_config: Record<string, unknown>;
  },
): boolean {
  const currentAuth = storedConfigOnSchema(
    schemaFieldsOf(provider.auth_schema),
    stored.auth_config,
  );
  const currentPayload = storedConfigOnSchema(
    schemaFieldsOf(provider.payload_schema),
    stored.payload_config,
  );
  return (
    !configMapsEqual(desired.auth_config, currentAuth) ||
    !configMapsEqual(desired.payload_config, currentPayload)
  );
}

/**
 * Persist the provider's current schema defaults onto its system default
 * template. Idempotent: no write when values already match.
 *
 * Custom (duplicated) templates are left unchanged except for locked fields
 * that inherit at read/grant time.
 */
export async function syncProviderDefaultTemplate(
  provider: RewardProvider,
  existing?: RewardConfiguration | null,
): Promise<SyncDefaultTemplateResult> {
  if (!provider?.id || provider.id <= 0) {
    return {
      template: null,
      synced: false,
      skipped: true,
      error: "Invalid reward provider id",
    };
  }

  const inFlight = syncInFlight.get(provider.id);
  if (inFlight) return inFlight;

  const run = (async (): Promise<SyncDefaultTemplateResult> => {
    try {
      const current =
        existing &&
        !isVirtualDefaultTemplateId(existing.id) &&
        existing.provider_id === provider.id &&
        isDefaultRewardTemplate(existing)
          ? existing
          : findDefaultInList(await listProviderTemplates(provider.id));

      if (!current || isVirtualDefaultTemplateId(current.id)) {
        const created = await tryCreateDefaultTemplate(provider);
        return { template: created, synced: true, skipped: false };
      }

      const desired = resolveDefaultTemplateConfigs(provider, current);
      if (!defaultTemplateHasDrift(provider, current, desired)) {
        return { template: current, synced: false, skipped: true };
      }

      let updated: RewardConfiguration;
      try {
        updated = await rewardConfigurationService.update(current.id, {
          auth_config: desired.auth_config,
          payload_config: desired.payload_config,
          is_default: true,
          is_active: true,
        });
      } catch {
        updated = await rewardConfigurationService.update(current.id, {
          auth_config: desired.auth_config,
          payload_config: desired.payload_config,
        });
      }

      return {
        template: {
          ...updated,
          is_default: true,
          auth_config: desired.auth_config,
          payload_config: desired.payload_config,
        },
        synced: true,
        skipped: false,
      };
    } catch (err) {
      return {
        template: existing ?? null,
        synced: false,
        skipped: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to sync default reward template",
      };
    }
  })();

  syncInFlight.set(provider.id, run);
  try {
    return await run;
  } finally {
    syncInFlight.delete(provider.id);
  }
}

/**
 * Build create payload for a provider's default template using schema field defaults.
 */
export function buildDefaultRewardTemplatePayload(
  provider: RewardProvider,
  options?: { includeIsDefaultFlag?: boolean },
): CreateRewardConfigurationRequest {
  const { auth_config, payload_config } =
    buildProviderSchemaDefaultConfigs(provider);
  const payload: CreateRewardConfigurationRequest = {
    name: DEFAULT_REWARD_TEMPLATE_NAME,
    provider_id: provider.id,
    auth_config,
    payload_config,
    is_active: true,
  };
  if (options?.includeIsDefaultFlag !== false) {
    payload.is_default = true;
  }
  return payload;
}

/**
 * Client-side default template that mirrors the provider schema defaults.
 * Acts as the associated configuration when none has been persisted yet.
 */
export function buildVirtualDefaultRewardTemplate(
  provider: RewardProvider,
): RewardConfiguration {
  const { auth_config, payload_config } =
    buildProviderSchemaDefaultConfigs(provider);
  return {
    id: toVirtualDefaultTemplateId(provider.id),
    name: DEFAULT_REWARD_TEMPLATE_NAME,
    provider_id: provider.id,
    auth_config,
    payload_config,
    is_active: true,
    is_default: true,
    is_virtual: true,
    provider_name: provider.name,
    reward_type: provider.reward_type,
    api_path: provider.api_path,
    request_template: provider.request_template,
  };
}

async function listProviderTemplates(
  providerId: number,
): Promise<RewardConfiguration[]> {
  try {
    return await rewardConfigurationService.getAll({
      provider_id: providerId,
      include_inactive: true,
    });
  } catch {
    // Some backends reject include_inactive — fall back to active-only list.
    return rewardConfigurationService.getAll({ provider_id: providerId });
  }
}

function findDefaultInList(
  list: RewardConfiguration[],
): RewardConfiguration | undefined {
  return preferDefaultRewardTemplate(list.filter(isDefaultRewardTemplate));
}

async function tryCreateDefaultTemplate(
  provider: RewardProvider,
): Promise<RewardConfiguration> {
  const attempts: CreateRewardConfigurationRequest[] = [
    buildDefaultRewardTemplatePayload(provider, { includeIsDefaultFlag: true }),
    buildDefaultRewardTemplatePayload(provider, {
      includeIsDefaultFlag: false,
    }),
    {
      name: DEFAULT_REWARD_TEMPLATE_NAME,
      provider_id: provider.id,
      auth_config: {},
      payload_config: {},
      is_active: true,
    },
  ];

  let lastError: unknown;
  for (const payload of attempts) {
    try {
      const created = await rewardConfigurationService.create(payload);
      return {
        ...created,
        is_default: created.is_default ?? true,
        provider_name: created.provider_name || provider.name,
        reward_type: created.reward_type || provider.reward_type,
        api_path: created.api_path || provider.api_path,
      };
    } catch (err) {
      lastError = err;
      // Another client may have created it concurrently.
      const raced = findDefaultInList(await listProviderTemplates(provider.id));
      if (raced) return raced;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to create default reward template");
}

async function reactivateIfNeeded(
  existing: RewardConfiguration,
): Promise<RewardConfiguration> {
  if (existing.is_active !== false) {
    if (existing.is_default === true) return existing;
    try {
      return await rewardConfigurationService.update(existing.id, {
        is_default: true,
      });
    } catch {
      return { ...existing, is_default: true };
    }
  }

  try {
    return await rewardConfigurationService.update(existing.id, {
      is_active: true,
      is_default: true,
    });
  } catch {
    try {
      return await rewardConfigurationService.update(existing.id, {
        is_active: true,
      });
    } catch {
      return { ...existing, is_active: true, is_default: true };
    }
  }
}

export type EnsureDefaultTemplateResult = {
  template: RewardConfiguration;
  /** True when the template exists only in the client (API create failed / unsupported) */
  isVirtual: boolean;
  /** Set when persistence failed and a virtual fallback is returned */
  persistenceError?: string;
};

/**
 * Ensures a provider has a default reward template.
 *
 * - Persists via API when possible (with create retries)
 * - Falls back to a virtual template built from provider schema defaults so the
 *   Reward Template dropdown is never empty for a valid provider
 */
export async function ensureProviderDefaultTemplate(
  providerId: number,
  provider?: RewardProvider | null,
): Promise<RewardConfiguration> {
  const result = await ensureProviderDefaultTemplateDetailed(
    providerId,
    provider,
  );
  return result.template;
}

export async function ensureProviderDefaultTemplateDetailed(
  providerId: number,
  provider?: RewardProvider | null,
): Promise<EnsureDefaultTemplateResult> {
  if (!Number.isFinite(providerId) || providerId <= 0) {
    throw new Error("Invalid reward provider id");
  }

  const existingFlight = ensureInFlight.get(providerId) as
    | Promise<RewardConfiguration>
    | undefined;

  // Reuse in-flight ensure, then wrap as detailed result.
  if (existingFlight) {
    const template = await existingFlight;
    return {
      template,
      isVirtual: template.is_virtual === true,
      persistenceError: template._persistenceError,
    };
  }

  const run = (async (): Promise<RewardConfiguration> => {
    const list = await listProviderTemplates(providerId);
    const existing = findDefaultInList(list);
    if (existing) {
      const reactivated = await reactivateIfNeeded(existing);
      if (provider && provider.id === providerId) {
        const synced = await syncProviderDefaultTemplate(
          provider,
          reactivated,
        );
        return synced.template || reactivated;
      }
      return reactivated;
    }

    const resolvedProvider =
      provider && provider.id === providerId
        ? provider
        : await rewardProviderService.getById(providerId);

    try {
      const created = await tryCreateDefaultTemplate(resolvedProvider);
      // Concurrent provider-create + dropdown-open can insert two defaults —
      // always re-list and return a single preferred default.
      const afterCreate = await listProviderTemplates(providerId);
      const defaults = afterCreate.filter(isDefaultRewardTemplate);
      if (defaults.length > 0) {
        return preferDefaultRewardTemplate(defaults) || created;
      }
      return created;
    } catch (err) {
      // Robust fallback: provider schema defaults act as the associated template.
      const virtual = buildVirtualDefaultRewardTemplate(resolvedProvider);
      virtual._persistenceError =
        err instanceof Error
          ? err.message
          : "Could not persist default reward template";
      return virtual;
    }
  })();

  ensureInFlight.set(providerId, run);
  try {
    const template = await run;
    return {
      template,
      isVirtual: template.is_virtual === true,
      persistenceError: template._persistenceError,
    };
  } finally {
    ensureInFlight.delete(providerId);
  }
}

/**
 * Materialize a virtual default into a persisted reward configuration.
 * No-op when the id already refers to a real configuration.
 */
export async function materializeRewardTemplateId(
  templateId: string | number | null | undefined,
  providerId: number,
  provider?: RewardProvider | null,
): Promise<RewardConfiguration> {
  if (templateId == null || templateId === "") {
    throw new Error("Reward template is required");
  }

  if (!isVirtualDefaultTemplateId(templateId)) {
    const id = Number(templateId);
    if (!Number.isFinite(id)) {
      throw new Error("Invalid reward template");
    }
    return rewardConfigurationService.getById(id);
  }

  const result = await ensureProviderDefaultTemplateDetailed(
    providerId,
    provider,
  );
  if (result.isVirtual || isVirtualDefaultTemplateId(result.template.id)) {
    throw new Error(
      result.persistenceError ||
        "Could not save the default reward template. Check permissions under Configurations → Reward Templates, then try again.",
    );
  }
  return result.template;
}
