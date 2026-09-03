import {
  API_CONFIG,
  getAuthHeaders,
} from "../../../shared/services/api";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import type {
  GenerateCreativeRequest,
  GenerateCreativeResponse,
} from "../types/aiCreativeGeneration";

const REQUEST_TIMEOUT_MS = 28000;

function getAiGenerateUrl(): string {
  const explicitUrl = import.meta.env.VITE_AI_GENERATE_URL;
  if (explicitUrl) {
    return String(explicitUrl);
  }

  // Real system path: database-service OfferCreativesRouter.
  // Keep VITE_AI_GENERATE_URL=/api/ai/generate-creative only for the local Vite/Vercel bridge.
  return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AI_GENERATE_CREATIVE}`;
}

function normalizeResponse(payload: unknown): GenerateCreativeResponse {
  const data = (payload && typeof payload === "object" ? payload : {}) as Record<
    string,
    unknown
  >;
  const inner =
    data.data && typeof data.data === "object"
      ? (data.data as Record<string, unknown>)
      : data;

  const rawVariants = Array.isArray(inner.variants) ? inner.variants : [];
  const variants = rawVariants
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
    .filter((item): item is { body: string; rationale?: string } => Boolean(item));

  if (variants.length === 0 && typeof inner.body === "string" && inner.body.trim()) {
    variants.push({ body: inner.body.trim() });
  }

  const warnings = Array.isArray(inner.warnings)
    ? inner.warnings
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, 12)
    : [];

  return {
    title: inner.title ? String(inner.title).trim() : undefined,
    variants,
    model: inner.model ? String(inner.model) : undefined,
    channelLimit:
      typeof inner.channelLimit === "number" ? inner.channelLimit : undefined,
    warnings,
  };
}

class AiCreativeGenerationService {
  async generate(
    request: GenerateCreativeRequest,
    options?: { signal?: AbortSignal },
  ): Promise<GenerateCreativeResponse> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort("timeout"), REQUEST_TIMEOUT_MS);

    const onExternalAbort = () => controller.abort("cancelled");
    options?.signal?.addEventListener("abort", onExternalAbort);

    try {
      const response = await fetch(getAiGenerateUrl(), {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          ...request,
          variantCount: request.variantCount ?? 3,
        }),
        signal: controller.signal,
      });

      const contentType = response.headers.get("content-type") || "";
      let payload: unknown = {};
      if (contentType.includes("application/json")) {
        payload = await response.json();
      } else {
        const text = await response.text();
        payload = text ? { error: text } : {};
      }

      if (!response.ok) {
        const errorPayload = payload as {
          error?: string | { message?: string; code?: string };
          message?: string;
          code?: string;
        };
        const nestedError =
          errorPayload.error && typeof errorPayload.error === "object"
            ? errorPayload.error.message
            : errorPayload.error;
        const message =
          nestedError ||
          errorPayload.message ||
          `AI generation failed (${response.status})`;
        const error = new Error(String(message)) as Error & { code?: string };
        error.code =
          (typeof errorPayload.error === "object" && errorPayload.error.code) ||
          errorPayload.code ||
          String(response.status);
        throw error;
      }

      const result = normalizeResponse(payload);
      if (!result.variants.length) {
        throw new Error("AI returned no usable message variants. Please try again.");
      }
      return result;
    } catch (error) {
      if (controller.signal.aborted) {
        const reason = String(controller.signal.reason || "");
        if (reason === "timeout") {
          throw new Error("AI generation timed out. Please try again.");
        }
        throw new Error("AI generation was cancelled.");
      }
      throw new Error(extractBackendError(error, "Failed to generate message content"));
    } finally {
      window.clearTimeout(timeoutId);
      options?.signal?.removeEventListener("abort", onExternalAbort);
    }
  }
}

export const aiCreativeGenerationService = new AiCreativeGenerationService();
