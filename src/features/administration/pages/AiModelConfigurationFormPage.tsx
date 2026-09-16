import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Input from "../../../shared/components/ui/Input";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../shared/components/ui/Checkbox";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { color, tw } from "../../../shared/utils/utils";
import {
  CUSTOM_MODEL_VALUE,
  DEFAULT_AI_MAX_OUTPUT_TOKENS,
  DEFAULT_AI_TEMPERATURE,
  DEFAULT_AI_TIMEOUT_MS,
  getAiModelProvider,
} from "../constants/aiModelProviders";
import { aiModelConfigurationService } from "../services/aiModelConfigurationService";

interface FormState {
  name: string;
  apiKey: string;
  hasApiKey: boolean;
  apiKeyMasked?: string;
  modelSelect: string;
  customModel: string;
  baseUrl: string;
  organization: string;
  apiVersion: string;
  projectId: string;
  temperature: string;
  maxOutputTokens: string;
  timeoutMs: string;
  isActive: boolean;
  isDefault: boolean;
}

function emptyForm(providerName: string, defaultModel: string, defaultBaseUrl?: string): FormState {
  return {
    name: providerName,
    apiKey: "",
    hasApiKey: false,
    modelSelect: defaultModel || CUSTOM_MODEL_VALUE,
    customModel: "",
    baseUrl: defaultBaseUrl || "",
    organization: "",
    apiVersion: "",
    projectId: "",
    temperature: String(DEFAULT_AI_TEMPERATURE),
    maxOutputTokens: String(DEFAULT_AI_MAX_OUTPUT_TOKENS),
    timeoutMs: String(DEFAULT_AI_TIMEOUT_MS),
    isActive: true,
    isDefault: false,
  };
}

export default function AiModelConfigurationFormPage() {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const provider = getAiModelProvider(providerId);
  const hubPath = "/dashboard/ai-models";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(() =>
    emptyForm(provider?.name || "", provider?.defaultModel || "", provider?.defaultBaseUrl),
  );

  const modelOptions = useMemo(() => {
    const catalog = (provider?.models || []).map((model) => ({
      value: model.value,
      label: model.label,
    }));
    return [...catalog, { value: CUSTOM_MODEL_VALUE, label: "Other (enter model id)" }];
  }, [provider]);

  useEffect(() => {
    if (!provider) {
      navigate(hubPath, { replace: true });
      return;
    }
    loadConfig();
  }, [providerId]);

  const loadConfig = async () => {
    if (!provider) return;
    try {
      setLoading(true);
      const existing = await aiModelConfigurationService.getByProvider(provider.id);
      if (!existing) {
        setForm(emptyForm(provider.name, provider.defaultModel, provider.defaultBaseUrl));
        return;
      }
      const knownModel = provider.models.some((model) => model.value === existing.model);
      setForm({
        name: existing.name || provider.name,
        apiKey: "",
        hasApiKey: existing.has_api_key,
        apiKeyMasked: existing.api_key_masked,
        modelSelect: knownModel ? existing.model : CUSTOM_MODEL_VALUE,
        customModel: knownModel ? "" : existing.model,
        baseUrl: existing.base_url || provider.defaultBaseUrl || "",
        organization: existing.organization || "",
        apiVersion: existing.api_version || "",
        projectId: existing.project_id || "",
        temperature: String(existing.temperature ?? DEFAULT_AI_TEMPERATURE),
        maxOutputTokens: String(existing.max_output_tokens ?? DEFAULT_AI_MAX_OUTPUT_TOKENS),
        timeoutMs: String(existing.timeout_ms ?? DEFAULT_AI_TIMEOUT_MS),
        isActive: existing.is_active !== false,
        isDefault: Boolean(existing.is_default),
      });
    } catch (err) {
      showError(
        "Error",
        extractBackendError(err, "Failed to load this AI model configuration"),
      );
      navigate(hubPath);
    } finally {
      setLoading(false);
    }
  };

  const resolvedModel =
    form.modelSelect === CUSTOM_MODEL_VALUE ? form.customModel.trim() : form.modelSelect.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider) return;

    if (!form.name.trim()) {
      showError("Validation Error", "Display name is required");
      return;
    }
    if (!resolvedModel) {
      showError("Validation Error", "Select or enter a model id");
      return;
    }
    if (!form.hasApiKey && !form.apiKey.trim()) {
      showError("Validation Error", "API key is required");
      return;
    }
    if (provider.supportsBaseUrl && provider.id === "custom" && !form.baseUrl.trim()) {
      showError("Validation Error", "Base URL is required for a custom OpenAI-compatible endpoint");
      return;
    }

    const temperature = Number(form.temperature);
    const maxOutputTokens = Number(form.maxOutputTokens);
    const timeoutMs = Number(form.timeoutMs);
    if (!Number.isFinite(temperature) || temperature < 0 || temperature > 2) {
      showError("Validation Error", "Temperature must be between 0 and 2");
      return;
    }
    if (!Number.isFinite(maxOutputTokens) || maxOutputTokens < 64 || maxOutputTokens > 8192) {
      showError("Validation Error", "Max output tokens must be between 64 and 8192");
      return;
    }
    if (!Number.isFinite(timeoutMs) || timeoutMs < 5000 || timeoutMs > 120000) {
      showError("Validation Error", "Timeout must be between 5 and 120 seconds");
      return;
    }

    setSaving(true);
    try {
      await aiModelConfigurationService.upsert(provider.id, {
        name: form.name.trim(),
        model: resolvedModel,
        api_key: form.apiKey.trim() || undefined,
        base_url: form.baseUrl.trim() || undefined,
        organization: form.organization.trim() || undefined,
        api_version: form.apiVersion.trim() || undefined,
        project_id: form.projectId.trim() || undefined,
        temperature,
        max_output_tokens: maxOutputTokens,
        timeout_ms: timeoutMs,
        is_active: form.isActive,
        is_default: form.isDefault,
      });
      success("Saved", `${provider.name} is ready for message generation`);
      navigate(hubPath);
    } catch (err) {
      showError(
        "Error",
        extractBackendError(err, "Failed to save AI model configuration"),
      );
    } finally {
      setSaving(false);
    }
  };

  if (!provider || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className={`${tw.textMuted} font-medium mt-4`}>Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton
        showBreadcrumb={true}
        currentLabel={provider.name}
        parentTo={hubPath}
      />

      <p className={`text-sm ${tw.textSecondary}`}>{provider.description}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Credentials</h2>
          <p className={`text-xs ${tw.textSecondary} mb-6`}>
            API keys stay on the server in production. Generation requests send only this
            configuration id — never the secret. Rotate a key by entering a new value.
          </p>
          <div className="space-y-6">
            <Input
              label="Display name"
              value={form.name}
              onChange={(value) => setForm((prev) => ({ ...prev, name: String(value) }))}
              placeholder={provider.name}
              required
              disabled={saving}
            />

            <div>
              <Input
                label="API key"
                type="password"
                value={form.apiKey}
                onChange={(value) => setForm((prev) => ({ ...prev, apiKey: String(value) }))}
                placeholder={
                  form.hasApiKey
                    ? form.apiKeyMasked || "••••••••"
                    : provider.keyPlaceholder
                }
                required={!form.hasApiKey}
                disabled={saving}
              />
              <p className={`text-xs mt-2 ${tw.textSecondary}`}>
                {form.hasApiKey
                  ? "A key is already saved. Leave this blank to keep it, or paste a new key to rotate."
                  : provider.keyHint}
              </p>
            </div>

            {provider.supportsBaseUrl && (
              <Input
                label="Base URL"
                type="url"
                value={form.baseUrl}
                onChange={(value) => setForm((prev) => ({ ...prev, baseUrl: String(value) }))}
                placeholder={provider.defaultBaseUrl || "https://api.example.com/v1"}
                required={provider.id === "custom"}
                disabled={saving}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {provider.supportsOrganization && (
                <Input
                  label="Organization (optional)"
                  value={form.organization}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, organization: String(value) }))
                  }
                  placeholder="org_..."
                  disabled={saving}
                />
              )}
              {provider.supportsProjectId && (
                <Input
                  label="Project ID (optional)"
                  value={form.projectId}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, projectId: String(value) }))
                  }
                  placeholder={provider.id === "gemini" ? "Google Cloud project" : "proj_..."}
                  disabled={saving}
                />
              )}
              {provider.supportsApiVersion && (
                <Input
                  label="API version (optional)"
                  value={form.apiVersion}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, apiVersion: String(value) }))
                  }
                  placeholder={provider.id === "anthropic" ? "2023-06-01" : "v1"}
                  disabled={saving}
                />
              )}
            </div>
          </div>
        </div>

        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className={`${tw.cardHeading} text-gray-900 mb-4`}>Generation defaults</h2>
          <div className="space-y-6">
            {provider.models.length > 0 ? (
              <HeadlessSelect
                label="Model"
                options={modelOptions}
                value={form.modelSelect}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, modelSelect: String(value) }))
                }
                disabled={saving}
              />
            ) : null}

            {(provider.models.length === 0 || form.modelSelect === CUSTOM_MODEL_VALUE) && (
              <Input
                label={provider.models.length > 0 ? "Custom model id" : "Model"}
                value={form.customModel}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, customModel: String(value) }))
                }
                placeholder="Exact model id from the provider"
                required={form.modelSelect === CUSTOM_MODEL_VALUE || provider.models.length === 0}
                disabled={saving}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="Temperature"
                type="number"
                value={form.temperature}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, temperature: String(value) }))
                }
                disabled={saving}
                min={0}
                max={2}
                step={0.1}
              />
              <Input
                label="Max output tokens"
                type="number"
                value={form.maxOutputTokens}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, maxOutputTokens: String(value) }))
                }
                disabled={saving}
                min={64}
                max={8192}
                step={1}
              />
              <Input
                label="Timeout (ms)"
                type="number"
                value={form.timeoutMs}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, timeoutMs: String(value) }))
                }
                disabled={saving}
                min={5000}
                max={120000}
                step={1000}
              />
            </div>
            <p className={`text-xs ${tw.textSecondary}`}>
              Temperature 0–2 controls variation. Lower values stay closer to the brief.
              Max tokens caps the model reply, not the SMS length. Timeout should cover
              the provider round-trip (25–30s is typical).
            </p>

            <div className="flex items-start gap-3">
              <Checkbox
                id="ai-model-active"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                }
                disabled={saving}
              />
              <div>
                <label htmlFor="ai-model-active" className={`block text-sm font-medium ${tw.textPrimary}`}>
                  Active
                </label>
                <p className={`text-xs ${tw.textSecondary}`}>
                  Only active models appear in the generate-message picker.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="ai-model-default"
                checked={form.isDefault}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, isDefault: e.target.checked }))
                }
                disabled={saving}
              />
              <div>
                <label htmlFor="ai-model-default" className={`block text-sm font-medium ${tw.textPrimary}`}>
                  Default for message generation
                </label>
                <p className={`text-xs ${tw.textSecondary}`}>
                  Pre-selected when a marketer opens Generate. Only one provider can be default.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className={`text-xs ${tw.textSecondary}`}>
          Docs:{" "}
          <a
            href={provider.docsUrl}
            target="_blank"
            rel="noreferrer"
            className="underline"
            style={{ color: color.primary.action }}
          >
            {provider.docsUrl}
          </a>
        </p>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate(hubPath)}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-60"
            style={{
              background: "transparent",
              color: color.primary.action,
              border: `1px solid ${color.primary.action}`,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-60"
            style={{ backgroundColor: color.primary.action }}
          >
            {saving ? "Saving..." : "Save configuration"}
          </button>
        </div>
      </form>
    </div>
  );
}
