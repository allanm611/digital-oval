import { useEffect, useState } from "react";
import Input from "../../../../shared/components/ui/Input";
import Textarea from "../../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../../shared/components/ui/Checkbox";
import {
  color,
  tw,
  button,
  getButtonStyles,
} from "../../../../shared/utils/utils";
import type {
  CreateRewardProviderRequest,
  RewardProvider,
  RewardProviderHttpMethod,
  RewardProviderSchemaField,
  UpdateRewardProviderRequest,
} from "../../types/rewardProvider";
import RewardProviderFieldSchemaEditor, {
  validateRewardFieldSchema,
} from "./RewardProviderFieldSchemaEditor";
import { coerceSchemaDefaultValue, isSchemaFieldEditable } from "./rewardSchemaFieldUtils";

interface RewardTypeOption {
  value: string;
  label: string;
}

interface RewardProviderFormProps {
  mode: "create" | "edit";
  isLoading: boolean;
  rewardTypeOptions: RewardTypeOption[];
  rewardTypesLoading?: boolean;
  initialData?: RewardProvider | null;
  onCancel: () => void;
  onSave: (
    payload: CreateRewardProviderRequest | UpdateRewardProviderRequest,
  ) => void;
}

const HTTP_METHODS: { value: RewardProviderHttpMethod; label: string }[] = [
  { value: "POST", label: "POST" },
  { value: "PUT", label: "PUT" },
  { value: "PATCH", label: "PATCH" },
  { value: "GET", label: "GET" },
];

const DEFAULT_REQUEST_TEMPLATE = `{
  "channel": "{{config.channel}}",
  "subscriber": [
    {
      "msisdn": "{{subscriber.msisdn}}",
      "action": "{{config.action}}"
    }
  ]
}`;

function normalizeFields(
  fields: RewardProviderSchemaField[],
): RewardProviderSchemaField[] {
  return fields.map((field) => ({
    name: field.name.trim(),
    label: field.label.trim(),
    type: field.type,
    required: !!field.required,
    // Explicit boolean so backend always receives the flag (default editable).
    is_editable: isSchemaFieldEditable(field),
    ...(field.placeholder?.trim()
      ? { placeholder: field.placeholder.trim() }
      : {}),
    ...(field.default !== undefined && field.default !== ""
      ? (() => {
          const defaultVal = coerceSchemaDefaultValue(field, field.default);
          return defaultVal !== undefined ? { default: defaultVal } : {};
        })()
      : {}),
    ...(field.type === "select"
      ? {
          options: (field.options || [])
            .map((o) => o.trim())
            .filter(Boolean),
        }
      : {}),
  }));
}

export default function RewardProviderForm({
  mode,
  isLoading,
  rewardTypeOptions,
  rewardTypesLoading = false,
  initialData,
  onCancel,
  onSave,
}: RewardProviderFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [rewardType, setRewardType] = useState(initialData?.reward_type || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [apiPath, setApiPath] = useState(initialData?.api_path || "");
  const [httpMethod, setHttpMethod] = useState<RewardProviderHttpMethod>(
    initialData?.http_method || "POST",
  );
  const [isActive, setIsActive] = useState(initialData?.is_active !== false);
  const [authFields, setAuthFields] = useState<RewardProviderSchemaField[]>(
    initialData?.auth_schema?.fields?.length
      ? initialData.auth_schema.fields
      : [],
  );
  const [payloadFields, setPayloadFields] = useState<RewardProviderSchemaField[]>(
    initialData?.payload_schema?.fields?.length
      ? initialData.payload_schema.fields
      : [],
  );
  const [requestTemplateText, setRequestTemplateText] = useState(
    JSON.stringify(initialData?.request_template || {}, null, 2),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!initialData) return;
    setName(initialData.name || "");
    setRewardType(initialData.reward_type || "");
    setDescription(initialData.description || "");
    setApiPath(initialData.api_path || "");
    setHttpMethod(initialData.http_method || "POST");
    setIsActive(initialData.is_active !== false);
    setAuthFields(initialData.auth_schema?.fields || []);
    setPayloadFields(initialData.payload_schema?.fields || []);
    setRequestTemplateText(
      JSON.stringify(initialData.request_template || {}, null, 2),
    );
  }, [initialData]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!name.trim()) next.name = "Provider name is required";
    else if (name.trim().length > 100) {
      next.name = "Provider name must be 100 characters or less";
    }

    if (!rewardType) next.reward_type = "Reward type is required";
    if (!apiPath.trim()) next.api_path = "API path is required";

    Object.assign(next, validateRewardFieldSchema(authFields, "auth_schema"));
    Object.assign(
      next,
      validateRewardFieldSchema(payloadFields, "payload_schema"),
    );

    try {
      const parsed = JSON.parse(requestTemplateText || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        next.request_template = "Request template must be a JSON object";
      }
    } catch {
      next.request_template = "Request template must be valid JSON";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payloadBase = {
      name: name.trim(),
      reward_type: rewardType,
      description: description.trim() || null,
      auth_schema: { fields: normalizeFields(authFields) },
      payload_schema: { fields: normalizeFields(payloadFields) },
      request_template: JSON.parse(requestTemplateText || "{}"),
      api_path: apiPath.trim(),
      http_method: httpMethod,
      is_active: isActive,
    };

    if (mode === "create") {
      onSave(payloadBase as CreateRewardProviderRequest);
      return;
    }

    onSave(payloadBase as UpdateRewardProviderRequest);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div
        className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
      >
        <h2 className={`text-sm font-semibold ${tw.textPrimary} mb-6`}>
          Basic Information
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Provider Name *"
                value={name}
                onChange={setName}
                placeholder="e.g. MICA Bonus Units Provider"
                disabled={isLoading}
                hasError={!!errors.name}
                required
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>
            <div>
              <HeadlessSelect
                label="Reward Type *"
                value={rewardType}
                onChange={setRewardType}
                options={rewardTypeOptions}
                placeholder={
                  rewardTypesLoading
                    ? "Loading reward types..."
                    : "Select reward type"
                }
                disabled={isLoading || rewardTypesLoading}
                error={!!errors.reward_type}
              />
              {errors.reward_type && (
                <p className="text-red-500 text-xs mt-1">{errors.reward_type}</p>
              )}
            </div>
          </div>

          <Textarea
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="Describe this provider integration..."
            rows={2}
            disabled={isLoading}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="API Path *"
                value={apiPath}
                onChange={setApiPath}
                placeholder="e.g. /apigw/om/MICA/bonusUnits"
                disabled={isLoading}
                hasError={!!errors.api_path}
                required
              />
              {errors.api_path && (
                <p className="text-red-500 text-xs mt-1">{errors.api_path}</p>
              )}
            </div>
            <div>
              <HeadlessSelect
                label="HTTP Method *"
                value={httpMethod}
                onChange={(v) => setHttpMethod(v as RewardProviderHttpMethod)}
                options={HTTP_METHODS}
                disabled={isLoading}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              id="reward-provider-active"
              checked={isActive}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setIsActive(e.target.checked)
              }
              disabled={isLoading}
            />
            <span className={`text-sm font-medium ${tw.textPrimary}`}>
              Active
            </span>
          </label>
        </div>
      </div>

      <div
        className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
      >
        <RewardProviderFieldSchemaEditor
          title="Auth Schema"
          description="Authentication fields collected when creating a reward template (e.g. base_url, username, password)."
          schemaErrorKey="auth_schema"
          fields={authFields}
          errors={errors}
          disabled={isLoading}
          onChange={setAuthFields}
        />
      </div>

      <div
        className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
      >
        <RewardProviderFieldSchemaEditor
          title="Payload Schema"
          description="Business payload fields required by this provider (e.g. channel, unitAmount, validityType)."
          schemaErrorKey="payload_schema"
          fields={payloadFields}
          errors={errors}
          disabled={isLoading}
          onChange={setPayloadFields}
        />
      </div>

      <div
        className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
      >
        <h2 className={`text-sm font-semibold ${tw.textPrimary} mb-2`}>
          Request Template *
        </h2>
        <p className={`text-xs ${tw.textSecondary} mb-4`}>
          JSON body template with placeholders such as{" "}
          <code className="font-mono">{`{{config.channel}}`}</code> and{" "}
          <code className="font-mono">{`{{subscriber.msisdn}}`}</code>.
        </p>
        <Textarea
          label=""
          value={requestTemplateText}
          onChange={setRequestTemplateText}
          placeholder={DEFAULT_REQUEST_TEMPLATE}
          rows={12}
          disabled={isLoading}
        />
        {errors.request_template && (
          <p className="text-red-500 text-xs mt-1">{errors.request_template}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="transition-colors disabled:opacity-60"
          style={getButtonStyles(button.bordered)}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-60"
          style={{ backgroundColor: color.primary.action }}
        >
          {isLoading
            ? mode === "create"
              ? "Creating..."
              : "Updating..."
            : mode === "create"
              ? "Create Provider"
              : "Update Provider"}
        </button>
      </div>
    </form>
  );
}
