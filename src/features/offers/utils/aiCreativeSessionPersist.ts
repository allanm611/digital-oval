import {
  AI_LENGTHS,
  AI_TONES,
  EMPTY_AI_PROMPT_FORM,
  type AiCreativePromptForm,
  type AiCreativeSession,
  type AiLengthPreset,
  type AiTone,
  type GeneratedCreativeVariant,
} from "../types/aiCreativeGeneration";

/** Reserved creative.variables keys — never treat these as merge placeholders. */
export const AI_GENERATED_FLAG_KEY = "sentra_ai_generated";
export const AI_SESSION_VARIABLE_KEY = "sentra_ai_session";

const LOCAL_STORAGE_PREFIX = "sentra.aiCreativeSession.v1";

export interface AiSessionIdentity {
  creativeId?: string | number | null;
  offerId?: string | number | null;
  channel?: string;
  locale?: string;
  body?: string;
}

export function isAiSessionVariableKey(key: string): boolean {
  return key === AI_GENERATED_FLAG_KEY || key === AI_SESSION_VARIABLE_KEY;
}

export function omitAiSessionVariables<T extends Record<string, unknown>>(
  variables: T | undefined | null,
): T {
  if (!variables || typeof variables !== "object") {
    return {} as T;
  }
  const next = { ...variables };
  delete next[AI_GENERATED_FLAG_KEY];
  delete next[AI_SESSION_VARIABLE_KEY];
  return next;
}

function isTone(value: unknown): value is AiTone {
  return typeof value === "string" && (AI_TONES as readonly string[]).includes(value);
}

function isLength(value: unknown): value is AiLengthPreset {
  return typeof value === "string" && (AI_LENGTHS as readonly string[]).includes(value);
}

export function parseAiCreativeSession(value: unknown): AiCreativeSession | null {
  if (!value) return null;

  let raw: unknown = value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      raw = JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  if (!raw || typeof raw !== "object") return null;

  const data = raw as Record<string, unknown>;
  const promptRaw =
    data.prompt && typeof data.prompt === "object"
      ? (data.prompt as Record<string, unknown>)
      : {};

  const prompt: AiCreativePromptForm = {
    ...EMPTY_AI_PROMPT_FORM,
    tone: isTone(promptRaw.tone) ? promptRaw.tone : EMPTY_AI_PROMPT_FORM.tone,
    objective: String(promptRaw.objective ?? ""),
    callToAction: String(promptRaw.callToAction ?? ""),
    keyFacts: String(promptRaw.keyFacts ?? ""),
    audience: String(promptRaw.audience ?? ""),
    length: isLength(promptRaw.length)
      ? promptRaw.length
      : EMPTY_AI_PROMPT_FORM.length,
    mustInclude: String(promptRaw.mustInclude ?? ""),
    mustAvoid: String(promptRaw.mustAvoid ?? ""),
  };

  const variants: GeneratedCreativeVariant[] = Array.isArray(data.variants)
    ? data.variants
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const variant = item as Record<string, unknown>;
          const body = String(variant.body || "").trim();
          if (!body) return null;
          return {
            body,
            rationale: variant.rationale ? String(variant.rationale) : undefined,
          };
        })
        .filter((item): item is GeneratedCreativeVariant => Boolean(item))
    : [];

  const generatedBody = String(data.generatedBody || variants[0]?.body || "").trim();
  if (!generatedBody && variants.length === 0) return null;

  const selectedIndex = Math.min(
    Math.max(Number(data.selectedIndex) || 0, 0),
    Math.max(variants.length - 1, 0),
  );

  return {
    prompt,
    sourceBody: String(data.sourceBody || ""),
    generatedBody,
    variants,
    selectedIndex,
    warnings: Array.isArray(data.warnings)
      ? data.warnings.map((item) => String(item || "")).filter(Boolean)
      : [],
  };
}

export function extractAiSessionFromVariables(
  variables: Record<string, unknown> | undefined | null,
): AiCreativeSession | null {
  if (!variables || typeof variables !== "object") return null;
  return parseAiCreativeSession(variables[AI_SESSION_VARIABLE_KEY]);
}

export function hasPersistedAiMarker(
  variables: Record<string, unknown> | undefined | null,
): boolean {
  if (!variables || typeof variables !== "object") return false;
  if (extractAiSessionFromVariables(variables)) return true;
  const flag = variables[AI_GENERATED_FLAG_KEY];
  return flag === "1" || flag === 1 || flag === true;
}

export function embedAiSessionInVariables(
  variables: Record<string, string | number | boolean> | undefined | null,
  session: AiCreativeSession | null | undefined,
): Record<string, string | number | boolean> {
  const next = omitAiSessionVariables(variables || {});
  if (!session) return next;
  next[AI_GENERATED_FLAG_KEY] = "1";
  next[AI_SESSION_VARIABLE_KEY] = JSON.stringify(session);
  return next;
}

function normalizeBody(body: string | undefined): string {
  return String(body || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildAiSessionFingerprint(identity: AiSessionIdentity): string | null {
  const channel = String(identity.channel || "").trim();
  const locale = String(identity.locale || "").trim();
  const body = normalizeBody(identity.body);
  if (!channel || !body) return null;
  return `${identity.offerId ?? ""}|${channel}|${locale}|${body.length}|${body.slice(0, 240)}`;
}

function storageKeys(identity: AiSessionIdentity): string[] {
  const keys: string[] = [];
  if (identity.creativeId != null && String(identity.creativeId)) {
    keys.push(`${LOCAL_STORAGE_PREFIX}:id:${identity.creativeId}`);
  }
  const fingerprint = buildAiSessionFingerprint(identity);
  if (fingerprint) {
    keys.push(`${LOCAL_STORAGE_PREFIX}:fp:${fingerprint}`);
  }
  return keys;
}

function readLocal(key: string): AiCreativeSession | null {
  try {
    const raw = window.localStorage.getItem(key);
    return parseAiCreativeSession(raw);
  } catch {
    return null;
  }
}

export function persistAiSessionLocally(
  identity: AiSessionIdentity,
  session: AiCreativeSession | null | undefined,
): void {
  if (typeof window === "undefined") return;
  const keys = storageKeys(identity);
  if (keys.length === 0) return;
  try {
    if (!session) {
      keys.forEach((key) => window.localStorage.removeItem(key));
      return;
    }
    const payload = JSON.stringify(session);
    keys.forEach((key) => window.localStorage.setItem(key, payload));
  } catch {
    // Quota or private mode — in-memory / variables still apply for this visit.
  }
}

export function readAiSessionLocally(
  identity: AiSessionIdentity,
): AiCreativeSession | null {
  if (typeof window === "undefined") return null;
  for (const key of storageKeys(identity)) {
    const session = readLocal(key);
    if (session) return session;
  }
  return null;
}

export function resolveAiCreativeSession(
  creative: {
    id?: string | number;
    offer_id?: string | number;
    channel?: string;
    locale?: string;
    text_body?: string;
    html_body?: string;
    variables?: Record<string, unknown>;
  } | null | undefined,
  extras?: { offerId?: string | number | null },
): AiCreativeSession | null {
  if (!creative) return null;
  const fromVariables = extractAiSessionFromVariables(creative.variables);
  if (fromVariables) return fromVariables;

  return readAiSessionLocally({
    creativeId: creative.id,
    offerId: extras?.offerId ?? creative.offer_id,
    channel: creative.channel,
    locale: creative.locale,
    body: creative.text_body || creative.html_body,
  });
}

export function rememberAiCreativeSession(
  creative: {
    id?: string | number;
    offer_id?: string | number;
    channel?: string;
    locale?: string;
    text_body?: string;
    html_body?: string;
    variables?: Record<string, string | number | boolean>;
  },
  session: AiCreativeSession | null | undefined,
  extras?: { offerId?: string | number | null; body?: string },
): Record<string, string | number | boolean> {
  const body = extras?.body ?? creative.text_body ?? creative.html_body;
  const variables = embedAiSessionInVariables(creative.variables, session);
  persistAiSessionLocally(
    {
      creativeId: creative.id,
      offerId: extras?.offerId ?? creative.offer_id,
      channel: creative.channel,
      locale: creative.locale,
      body,
    },
    session,
  );
  return variables;
}

export function shouldShowAiGeneratedBadge(
  creative: {
    id?: string | number;
    offer_id?: string | number;
    channel?: string;
    locale?: string;
    text_body?: string;
    html_body?: string;
    variables?: Record<string, unknown>;
  } | null | undefined,
  extras?: { offerId?: string | number | null },
): boolean {
  const body = String(creative?.text_body || creative?.html_body || "").trim();
  if (!body) return false;
  if (hasPersistedAiMarker(creative?.variables)) return true;
  return Boolean(resolveAiCreativeSession(creative, extras));
}
