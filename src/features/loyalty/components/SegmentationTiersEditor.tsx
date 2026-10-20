import { Trash2 } from "lucide-react";
import LoyaltyAddButton from "./LoyaltyAddButton";
import Radio from "../../../shared/components/ui/Radio";
import Input from "../../../shared/components/ui/Input";
import Checkbox from "../../../shared/components/ui/Checkbox";
import { tw } from "../../../shared/utils/utils";
import type { TierEvaluationMode } from "../types/loyaltyProgram";
import {
  createEmptyTier,
  type TierDraft,
} from "../utils/loyaltyProgramForm";

export function AddTierButton({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <LoyaltyAddButton label="Add tier" disabled={disabled} onClick={onClick} />
  );
}

interface SegmentationTiersEditorProps {
  mode: TierEvaluationMode;
  tiers: TierDraft[];
  errors: string[];
  disabled?: boolean;
  onModeChange: (mode: TierEvaluationMode) => void;
  onTiersChange: (tiers: TierDraft[]) => void;
}

export default function SegmentationTiersEditor({
  mode,
  tiers,
  errors,
  disabled = false,
  onModeChange,
  onTiersChange,
}: SegmentationTiersEditorProps) {
  const automated = mode === "automated";

  const updateTier = (clientId: string, patch: Partial<TierDraft>) => {
    onTiersChange(
      tiers.map((tier) =>
        tier.clientId === clientId ? { ...tier, ...patch } : tier,
      ),
    );
  };

  const addTier = () => onTiersChange([...tiers, createEmptyTier()]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-8">
        <Radio
          name="tier-evaluation-mode"
          value="automated"
          checked={mode === "automated"}
          disabled={disabled}
          label="Automated"
          onChange={() => onModeChange("automated")}
        />
        <Radio
          name="tier-evaluation-mode"
          value="manual"
          checked={mode === "manual"}
          disabled={disabled}
          label="Manual"
          onChange={() => onModeChange("manual")}
        />
      </div>
      <p className={`text-sm ${tw.textSecondary}`}>
        {automated
          ? "Enter a tier name and the point range. System assigns each member to the tier that contains their segmentation points. One tier must start at 0, one must end at Unlimited, and the ranges must continue without gaps or shared values. The next tier starts one point after the previous one ends."
          : "Enter the tier names. System does not calculate the tier. Map a customer onto one of these names through the subscriber tier API."}
      </p>

      <div className="space-y-3">
        {tiers.map((tier, index) => (
          <div
            key={tier.clientId}
            className={
              automated
                ? "grid grid-cols-1 gap-3 rounded-md border border-gray-200 p-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto_auto] md:items-end"
                : "flex flex-col gap-3 rounded-md border border-gray-200 p-3 sm:flex-row sm:items-end"
            }
          >
            <div className={automated ? "min-w-0" : "min-w-0 flex-1"}>
              <Input
                label="Tier name"
                value={tier.name}
                disabled={disabled}
                hasError={Boolean(errors.length) && !tier.name.trim()}
                onChange={(next) =>
                  updateTier(tier.clientId, { name: String(next) })
                }
              />
            </div>
            {automated && (
              <Input
                label="Point from"
                type="number"
                value={tier.pointsFrom}
                disabled={disabled}
                hasError={Boolean(errors.length) && !tier.pointsFrom.trim()}
                onChange={(next) =>
                  updateTier(tier.clientId, { pointsFrom: String(next) })
                }
              />
            )}
            {automated && (
              <Input
                label="Point to"
                type="number"
                value={tier.pointsTo}
                disabled={disabled || tier.pointsToUnlimited}
                hasError={
                  Boolean(errors.length) &&
                  !tier.pointsToUnlimited &&
                  !tier.pointsTo.trim()
                }
                onChange={(next) =>
                  updateTier(tier.clientId, { pointsTo: String(next) })
                }
              />
            )}
            {automated && (
              <label className="flex items-center gap-2 pb-2 text-sm text-gray-700">
                <Checkbox
                  checked={tier.pointsToUnlimited}
                  disabled={disabled}
                  onChange={(event) =>
                    updateTier(tier.clientId, {
                      pointsToUnlimited: event.target.checked,
                      pointsTo: event.target.checked ? "" : tier.pointsTo,
                    })
                  }
                />
                Unlimited
              </label>
            )}
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center self-end rounded text-gray-400 transition-colors hover:bg-red-50 hover:text-red-400 disabled:opacity-40 sm:self-auto"
              disabled={disabled}
              title={`Remove tier ${index + 1}`}
              onClick={() =>
                onTiersChange(tiers.filter((item) => item.clientId !== tier.clientId))
              }
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <AddTierButton disabled={disabled} onClick={addTier} />

      {errors.length > 0 && (
        <ul className="space-y-1 text-sm text-red-600">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
