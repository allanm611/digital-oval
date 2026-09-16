import type {
  AiModelProviderDefinition,
  AiModelProviderId,
} from "../types/aiModelConfiguration";

export const AI_MODEL_PROVIDERS: AiModelProviderDefinition[] = [
  {
    id: "gemini",
    name: "Gemini",
    description: "Google Gemini models for marketing copy generation.",
    docsUrl: "https://ai.google.dev/gemini-api/docs",
    defaultModel: "gemini-2.5-flash",
    models: [
      { value: "gemini-2.5-flash", label: "gemini-2.5-flash (recommended)" },
      { value: "gemini-2.5-pro", label: "gemini-2.5-pro" },
      { value: "gemini-2.5-flash-lite", label: "gemini-2.5-flash-lite" },
      { value: "gemini-2.0-flash", label: "gemini-2.0-flash" },
    ],
    supportsBaseUrl: false,
    supportsOrganization: false,
    supportsApiVersion: false,
    supportsProjectId: true,
    keyPlaceholder: "AIza...",
    keyHint: "Create a Gemini API key in Google AI Studio. Do not use a browser-exposed VITE_ key.",
  },
  {
    id: "openai",
    name: "ChatGPT (OpenAI)",
    description: "OpenAI ChatGPT models via the official Responses/Chat API.",
    docsUrl: "https://platform.openai.com/docs/api-reference",
    defaultModel: "gpt-4o-mini",
    defaultBaseUrl: "https://api.openai.com/v1",
    models: [
      { value: "gpt-4o-mini", label: "gpt-4o-mini (recommended)" },
      { value: "gpt-4o", label: "gpt-4o" },
      { value: "gpt-4.1", label: "gpt-4.1" },
      { value: "gpt-4.1-mini", label: "gpt-4.1-mini" },
      { value: "o4-mini", label: "o4-mini" },
    ],
    supportsBaseUrl: true,
    supportsOrganization: true,
    supportsApiVersion: false,
    supportsProjectId: true,
    keyPlaceholder: "sk-...",
    keyHint: "Use a server-side OpenAI secret key. Optionally set organization and project for billing isolation.",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude models for longer, brand-safe creative drafts.",
    docsUrl: "https://docs.anthropic.com/en/api/getting-started",
    defaultModel: "claude-sonnet-4-5",
    models: [
      { value: "claude-sonnet-4-5", label: "claude-sonnet-4-5 (recommended)" },
      { value: "claude-opus-4-5", label: "claude-opus-4-5" },
      { value: "claude-haiku-4-5", label: "claude-haiku-4-5" },
    ],
    supportsBaseUrl: false,
    supportsOrganization: false,
    supportsApiVersion: true,
    supportsProjectId: false,
    keyPlaceholder: "sk-ant-...",
    keyHint: "Anthropic API key. Set API version only if your workspace requires a pinned header.",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    description: "DeepSeek chat and reasoner models (OpenAI-compatible API).",
    docsUrl: "https://api-docs.deepseek.com/",
    defaultModel: "deepseek-chat",
    defaultBaseUrl: "https://api.deepseek.com",
    models: [
      { value: "deepseek-chat", label: "deepseek-chat (recommended)" },
      { value: "deepseek-reasoner", label: "deepseek-reasoner" },
    ],
    supportsBaseUrl: true,
    supportsOrganization: false,
    supportsApiVersion: false,
    supportsProjectId: false,
    keyPlaceholder: "sk-...",
    keyHint: "DeepSeek keys work against an OpenAI-compatible base URL.",
  },
  {
    id: "grok",
    name: "Grok (xAI)",
    description: "xAI Grok models for conversational marketing copy.",
    docsUrl: "https://docs.x.ai/",
    defaultModel: "grok-3-mini",
    defaultBaseUrl: "https://api.x.ai/v1",
    models: [
      { value: "grok-3-mini", label: "grok-3-mini (recommended)" },
      { value: "grok-3", label: "grok-3" },
      { value: "grok-2", label: "grok-2" },
    ],
    supportsBaseUrl: true,
    supportsOrganization: false,
    supportsApiVersion: false,
    supportsProjectId: false,
    keyPlaceholder: "xai-...",
    keyHint: "xAI API key. Keep the OpenAI-compatible base URL unless your tenant uses a private endpoint.",
  },
  {
    id: "mistral",
    name: "Mistral",
    description: "Mistral cloud models for multilingual creative generation.",
    docsUrl: "https://docs.mistral.ai/",
    defaultModel: "mistral-small-latest",
    defaultBaseUrl: "https://api.mistral.ai/v1",
    models: [
      { value: "mistral-small-latest", label: "mistral-small-latest (recommended)" },
      { value: "mistral-medium-latest", label: "mistral-medium-latest" },
      { value: "mistral-large-latest", label: "mistral-large-latest" },
    ],
    supportsBaseUrl: true,
    supportsOrganization: false,
    supportsApiVersion: false,
    supportsProjectId: false,
    keyPlaceholder: "…",
    keyHint: "Mistral API key. Override the base URL only for a private or Azure-hosted endpoint.",
  },
  {
    id: "custom",
    name: "Custom (OpenAI-compatible)",
    description: "Any OpenAI-compatible endpoint: Azure OpenAI, vLLM, LiteLLM, or a private gateway.",
    docsUrl: "https://platform.openai.com/docs/api-reference/chat",
    defaultModel: "",
    models: [],
    supportsBaseUrl: true,
    supportsOrganization: true,
    supportsApiVersion: true,
    supportsProjectId: false,
    keyPlaceholder: "sk-...",
    keyHint: "Base URL is required. Point this at your proxy so the browser never holds a production secret.",
  },
];

export const CUSTOM_MODEL_VALUE = "__custom__";

export const DEFAULT_AI_TEMPERATURE = 0.7;
export const DEFAULT_AI_MAX_OUTPUT_TOKENS = 1024;
export const DEFAULT_AI_TIMEOUT_MS = 28000;

export function getAiModelProvider(
  providerId: string | undefined,
): AiModelProviderDefinition | undefined {
  return AI_MODEL_PROVIDERS.find((provider) => provider.id === providerId);
}

export function isAiModelProviderId(value: string): value is AiModelProviderId {
  return AI_MODEL_PROVIDERS.some((provider) => provider.id === value);
}
