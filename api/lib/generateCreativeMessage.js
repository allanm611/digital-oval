/**
 * Server-side Gemini creative generation.
 * The API key must never be sent to the browser.
 */

const ALLOWED_TONES = new Set([
  "professional",
  "friendly",
  "urgent",
  "promotional",
  "empathetic",
  "formal",
  "playful",
  "concise",
]);

const ALLOWED_LENGTHS = new Set(["channel_optimized", "short", "medium"]);
const ALLOWED_DRAFT_ACTIONS = new Set(["generate_new", "improve_existing"]);
const MAX_TEXT = 2000;
const MAX_DRAFT = 4000;
const MAX_VARIANTS = 3;

const CHANNEL_LIMITS = {
  SMS: { title: 60, body: 320, preferredBody: 160 },
  Email: { title: 80, body: 4000, preferredBody: 900 },
  WhatsApp: { title: 100, body: 1024, preferredBody: 400 },
  Push: { title: 65, body: 150, preferredBody: 120 },
  USSD: { title: 50, body: 160, preferredBody: 120 },
  InApp: { title: 80, body: 500, preferredBody: 240 },
  Web: { title: 80, body: 500, preferredBody: 240 },
  IVR: { title: 50, body: 300, preferredBody: 180 },
};

function clip(value, max) {
  return String(value || "")
    .replace(/\0/g, "")
    .trim()
    .slice(0, max);
}

function normalizeChannel(channel) {
  const raw = String(channel || "SMS");
  const known = Object.keys(CHANNEL_LIMITS).find((name) =>
    raw.toUpperCase().includes(name.toUpperCase()),
  );
  return known || "SMS";
}

function getLimits(channel, length) {
  const limits = CHANNEL_LIMITS[normalizeChannel(channel)];
  if (length === "short") {
    return { ...limits, targetBody: Math.min(limits.preferredBody, 160) };
  }
  if (length === "medium") {
    return { ...limits, targetBody: limits.body };
  }
  return { ...limits, targetBody: limits.preferredBody };
}

export function validateGenerateRequest(body) {
  if (!body || typeof body !== "object") {
    return { error: "Request body is required.", code: "INVALID_REQUEST" };
  }

  const tone = String(body.tone || "").toLowerCase();
  if (!ALLOWED_TONES.has(tone)) {
    return { error: "Select a valid tone.", code: "INVALID_TONE" };
  }

  const objective = clip(body.objective, MAX_TEXT);
  if (objective.length < 8) {
    return {
      error: "Describe the objective in a bit more detail.",
      code: "INVALID_OBJECTIVE",
    };
  }

  const length = String(body.length || "channel_optimized");
  if (!ALLOWED_LENGTHS.has(length)) {
    return { error: "Select a valid length.", code: "INVALID_LENGTH" };
  }

  const draftAction = String(body.draftAction || "generate_new");
  if (!ALLOWED_DRAFT_ACTIONS.has(draftAction)) {
    return { error: "Select a valid draft action.", code: "INVALID_DRAFT_ACTION" };
  }

  const availableVariables = Array.isArray(body.availableVariables)
    ? body.availableVariables
        .map((item) => clip(item, 120))
        .filter(Boolean)
        .slice(0, 30)
    : [];

  return {
    value: {
      channel: normalizeChannel(body.channel),
      locale: clip(body.locale || "en", 16) || "en",
      brandName: clip(body.brandName, 80),
      tone,
      objective,
      callToAction: clip(body.callToAction, 240),
      keyFacts: clip(body.keyFacts, MAX_TEXT),
      audience: clip(body.audience, 240),
      length,
      draftAction,
      mustInclude: clip(body.mustInclude, 500),
      mustAvoid: clip(body.mustAvoid, 500),
      existingTitle: clip(body.existingTitle, 200),
      existingBody: clip(body.existingBody, MAX_DRAFT),
      availableVariables,
      variantCount: Math.min(
        Math.max(Number(body.variantCount) || 3, 1),
        MAX_VARIANTS,
      ),
    },
  };
}

function buildPrompt(input) {
  const limits = getLimits(input.channel, input.length);
  const variables =
    input.availableVariables.length > 0
      ? input.availableVariables.join(", ")
      : "{{customer_identity.first_name}}";

  return `You are a senior CVM copywriter for telecom and financial services offers.
Write ${input.variantCount} alternative message bodies for an offer creative.

Channel: ${input.channel}
Language/locale: ${input.locale}
Brand / sender: ${input.brandName || "the brand already implied by the facts"}
Tone: ${input.tone}
Objective: ${input.objective}
Call to action: ${input.callToAction || "none specified"}
Audience: ${input.audience || "existing customers"}
Key offer facts (treat as source of truth): ${input.keyFacts || "none specified"}
Must include: ${input.mustInclude || "none"}
Must avoid: ${input.mustAvoid || "none"}
Draft action: ${input.draftAction}
Existing title: ${input.existingTitle || "none"}
Existing body: ${input.existingBody || "none"}
Available merge variables (use exactly as written if useful): ${variables}

Hard constraints:
- Target body length: ${limits.targetBody} characters. Never exceed ${limits.body}.
- Title/subject max: ${limits.title} characters.
- Do not invent prices, dates, percentages, legal terms, network names, or rewards that are not in the facts.
- Preserve merge variables exactly, including the {{ and }} characters. Never invent new variable names.
- Do not wrap the result in markdown.
- ${input.channel === "SMS" ? "Prefer GSM-7 characters. Avoid emoji unless the user asked for them." : "Keep formatting simple."}
- ${input.channel === "Email" ? "Body may use simple tags only: p, br, strong, em, a. No scripts or styles." : "Plain text only. No HTML."}
- ${input.channel === "IVR" ? "Write as spoken language, with natural pauses." : ""}
- If improving an existing draft, keep the original intent and any existing variables.

Return JSON only in this shape:
{
  "title": "optional subject or notification title",
  "variants": [
    { "body": "message body", "rationale": "one short reason this variant works" }
  ]
}`;
}

function extractJson(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function sanitizeBody(body, channel) {
  let text = String(body || "").trim();
  text = text.replace(/^```(?:json|html|text)?\s*/i, "").replace(/```$/i, "");
  if (channel !== "Email") {
    text = text.replace(/<[^>]+>/g, " ").replace(/\s+\n/g, "\n").replace(/[ \t]{2,}/g, " ");
  }
  return text.trim();
}

export async function generateCreativeMessage({ apiKey, model, body, fetchImpl }) {
  const parsed = validateGenerateRequest(body);
  if (parsed.error) {
    return { ok: false, status: 400, payload: parsed };
  }

  if (!apiKey) {
    return {
      ok: false,
      status: 503,
      payload: {
        error: "AI generation is not configured. Set GEMINI_API_KEY on the server.",
        code: "NOT_CONFIGURED",
      },
    };
  }

  const input = parsed.value;
  const limits = getLimits(input.channel, input.length);
  const usedModel = model || "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    usedModel,
  )}:generateContent`;

  const geminiBody = {
    systemInstruction: {
      parts: [
        {
          text: "You generate compliant marketing creative. Follow the user constraints exactly. Return valid JSON only.",
        },
      ],
    },
    contents: [{ role: "user", parts: [{ text: buildPrompt(input) }] }],
    generationConfig: {
      temperature: input.channel === "SMS" || input.channel === "USSD" ? 0.5 : 0.7,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    ],
  };

  const doFetch = fetchImpl || fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await doFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(geminiBody),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        payload?.error?.message ||
        payload?.message ||
        "Gemini could not generate the message.";
      const status = response.status === 429 ? 429 : 502;
      return {
        ok: false,
        status,
        payload: {
          error: message,
          code: response.status === 429 ? "RATE_LIMITED" : "GEMINI_ERROR",
        },
      };
    }

    const text =
      payload?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("\n") || "";
    const parsedJson = extractJson(text);
    if (!parsedJson) {
      return {
        ok: false,
        status: 502,
        payload: {
          error: "AI returned an unreadable response. Please try again.",
          code: "INVALID_MODEL_OUTPUT",
        },
      };
    }

    const variants = (Array.isArray(parsedJson.variants) ? parsedJson.variants : [])
      .map((variant) => ({
        body: sanitizeBody(variant?.body, input.channel).slice(0, limits.body),
        rationale: clip(variant?.rationale, 240),
      }))
      .filter((variant) => variant.body);

    if (variants.length === 0 && parsedJson.body) {
      const bodyText = sanitizeBody(parsedJson.body, input.channel).slice(0, limits.body);
      if (bodyText) variants.push({ body: bodyText });
    }

    if (variants.length === 0) {
      return {
        ok: false,
        status: 502,
        payload: {
          error: "AI returned no usable message variants. Please try again.",
          code: "EMPTY_VARIANTS",
        },
      };
    }

    return {
      ok: true,
      status: 200,
      payload: {
        success: true,
        title: clip(parsedJson.title, limits.title) || undefined,
        variants,
        model: usedModel,
        channelLimit: limits.targetBody,
      },
    };
  } catch (error) {
    const aborted = error?.name === "AbortError";
    return {
      ok: false,
      status: aborted ? 504 : 502,
      payload: {
        error: aborted
          ? "AI generation timed out. Please try again."
          : "Could not reach the AI service. Please try again.",
        code: aborted ? "TIMEOUT" : "NETWORK_ERROR",
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}
