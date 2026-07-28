import { useEffect, useState } from "react";
import Input from "../../../../shared/components/ui/Input";
import Textarea from "../../../../shared/components/ui/Textarea";
import Checkbox from "../../../../shared/components/ui/Checkbox";
import {
  color,
  tw,
  button,
  getButtonStyles,
} from "../../../../shared/utils/utils";
import {
  CreateRewardProviderRequest,
  RewardProvider,
  UpdateRewardProviderRequest,
} from "../../services/rewardProviderService";
import {
  validateProviderKey,
  type RuleRewardType,
} from "../../../../shared/data/rewardProviders";
import RewardProviderAllowedTypesEditor, {
  validateAllowedTypesSelection,
} from "./RewardProviderAllowedTypesEditor";

interface RewardProviderFormProps {
  mode: "create" | "edit";
  isLoading: boolean;
  initialData?: RewardProvider | null;
  onCancel: () => void;
  onSave: (
    payload: CreateRewardProviderRequest | UpdateRewardProviderRequest,
  ) => void;
}

export default function RewardProviderForm({
  mode,
  isLoading,
  initialData,
  onCancel,
  onSave,
}: RewardProviderFormProps) {
  const [providerKey, setProviderKey] = useState(
    initialData?.provider_key || "",
  );
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [isActive, setIsActive] = useState(initialData?.is_active !== false);
  const [allowedTypes, setAllowedTypes] = useState<RuleRewardType[]>(
    initialData?.allowed_reward_types?.length
      ? [...initialData.allowed_reward_types]
      : ["bundle"],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!initialData) return;
    setProviderKey(initialData.provider_key || "");
    setName(initialData.name || "");
    setDescription(initialData.description || "");
    setIsActive(initialData.is_active !== false);
    setAllowedTypes(
      initialData.allowed_reward_types?.length
        ? [...initialData.allowed_reward_types]
        : ["bundle"],
    );
  }, [initialData]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (mode === "create") {
      const keyError = validateProviderKey(providerKey);
      if (keyError) next.provider_key = keyError;
    }

    if (!name.trim()) next.name = "Display name is required";
    else if (name.trim().length > 100) {
      next.name = "Display name must be 100 characters or less";
    }

    Object.assign(next, validateAllowedTypesSelection(allowedTypes));
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (mode === "create") {
      onSave({
        provider_key: providerKey.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        allowed_reward_types: allowedTypes,
        is_active: isActive,
      } as CreateRewardProviderRequest);
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      allowed_reward_types: allowedTypes,
      is_active: isActive,
    } as UpdateRewardProviderRequest);
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
            {mode === "create" ? (
              <div>
                <Input
                  label="Provider Key *"
                  value={providerKey}
                  onChange={setProviderKey}
                  placeholder="e.g. R2TPersAdjustBalCount2"
                  disabled={isLoading}
                  hasError={!!errors.provider_key}
                  required
                />
                {errors.provider_key && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.provider_key}
                  </p>
                )}
                <p className={`text-xs ${tw.textMuted} mt-1`}>
                  Stable identifier sent to fulfilment systems. Cannot be changed
                  after creation.
                </p>
              </div>
            ) : (
              <div>
                <p className={`text-xs uppercase ${tw.textMuted}`}>
                  Provider Key
                </p>
                <p className={`text-sm font-mono ${tw.textPrimary} mt-1`}>
                  {initialData?.provider_key}
                </p>
                <p className={`text-xs ${tw.textMuted} mt-1`}>
                  Provider key is immutable after creation.
                </p>
              </div>
            )}
            <div>
              <Input
                label="Display Name *"
                value={name}
                onChange={setName}
                placeholder="e.g. Personal Balance Adjustment"
                disabled={isLoading}
                hasError={!!errors.name}
                required
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>
          </div>

          <Textarea
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="Optional notes about this provider integration..."
            rows={2}
            disabled={isLoading}
          />

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
        <RewardProviderAllowedTypesEditor
          selectedTypes={allowedTypes}
          disabled={isLoading}
          error={errors.allowed_reward_types}
          onChange={setAllowedTypes}
        />
        {mode === "edit" && (
          <p className={`text-xs ${tw.textSecondary} mt-4`}>
            Removing a reward type may invalidate existing offer rules or manual
            rewards that use this provider with that type. Prefer deactivating
            the provider if it is in use.
          </p>
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
