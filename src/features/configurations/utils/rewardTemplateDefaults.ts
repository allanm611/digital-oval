import { rewardConfigurationService } from "../services/rewardConfigurationService";
import { rewardProviderService } from "../services/rewardProviderService";
import type {
  CreateRewardConfigurationRequest,
  RewardConfiguration,
} from "../types/rewardConfiguration";
import type { RewardProvider } from "../types/rewardProvider";
import {
  buildInitialConfigValues,
  normalizeConfigFields,
} from "../components/reward-forms/rewardSchemaFieldUtils";

/** Canonical name for the system default template created per provider */
export const DEFAULT_REWARD_TEMPLATE_NAME = "Default Template";

/**
 * Virtual (client-side) default template ids: BASE - providerId.
 * Used when the API cannot persist a default yet — still selectable in the UI.
 */
export const VIRTUAL_DEFAULT_TEMPLATE_ID_BASE = -1_000_000_000;

/** In-flight ensure calls keyed by provider id (dedupe concurrent UI loads) */
const ensureInFlight = new Map<number, Promise<RewardConfiguration>>();

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
  config: Pick<RewardConfiguration, "name" | "is_default"> & {
    is_virtual?: boolean;
  },
): boolean {
  if (config.is_virtual === true || config.is_default === true) return true;
  const name = config.name?.trim().toLowerCase() || "";
  return (
    name === DEFAULT_REWARD_TEMPLATE_NAME.toLowerCase() ||
    name === "default configuration" ||
    name === "default reward configuration"
  );
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

/**
 * Build auth/payload maps from every provider schema field + its default value.
 */
export function buildProviderSchemaDefaultConfigs(provider: RewardProvider): {
  auth_config: Record<string, unknown>;
  payload_config: Record<string, unknown>;
} {
  const authFields = provider.auth_schema?.fields || [];
  const payloadFields = provider.payload_schema?.fields || [];
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
      return reactivateIfNeeded(existing);
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
