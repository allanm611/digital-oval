import Checkbox from "../../../../shared/components/ui/Checkbox";
import { color, tw } from "../../../../shared/utils/utils";
import {
  ALL_RULE_REWARD_TYPES,
  RULE_REWARD_TYPE_LABELS,
  validateAllowedRewardTypes,
  type RuleRewardType,
} from "../../../../shared/data/rewardProviders";

interface RewardProviderAllowedTypesEditorProps {
  selectedTypes: RuleRewardType[];
  disabled?: boolean;
  error?: string;
  onChange: (types: RuleRewardType[]) => void;
}

export function validateAllowedTypesSelection(
  types: RuleRewardType[],
): Record<string, string> {
  const message = validateAllowedRewardTypes(types);
  return message ? { allowed_reward_types: message } : {};
}

export default function RewardProviderAllowedTypesEditor({
  selectedTypes,
  disabled = false,
  error,
  onChange,
}: RewardProviderAllowedTypesEditorProps) {
  const toggleType = (type: RuleRewardType) => {
    if (disabled) return;
    if (selectedTypes.includes(type)) {
      onChange(selectedTypes.filter((t) => t !== type));
    } else {
      onChange([...selectedTypes, type]);
    }
  };

  return (
    <div>
      <p className={`text-sm font-semibold ${tw.textPrimary} mb-3`}>
        Allowed Reward Types *
      </p>
      <p className={`text-xs ${tw.textSecondary} mb-4`}>
        Only these reward types will be available when this provider is selected
        in offers and manual rewards.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ALL_RULE_REWARD_TYPES.map((type) => {
          const checked = selectedTypes.includes(type);
          return (
            <label
              key={type}
              className={`flex items-center gap-3 p-3 border ${tw.rounded} cursor-pointer transition-colors`}
              style={{
                borderColor: checked
                  ? color.primary.accent
                  : color.border.default,
                backgroundColor: checked
                  ? `${color.primary.accent}08`
                  : "white",
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <Checkbox
                id={`reward-type-${type}`}
                checked={checked}
                onChange={() => toggleType(type)}
                disabled={disabled}
              />
              <span className={`text-sm font-medium ${tw.textPrimary}`}>
                {RULE_REWARD_TYPE_LABELS[type]}
              </span>
            </label>
          );
        })}
      </div>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
}
