import type { ReactNode } from "react";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import Radio from "../../../shared/components/ui/Radio";
import { tw } from "../../../shared/utils/utils";
import type {
  AttributeFieldOption,
  PointsValidityMode,
} from "../types/loyaltyProgram";
import {
  createEmptyAttribute,
  createEmptyTier,
  type LoyaltyProgramFormErrors,
  type LoyaltyProgramFormValues,
} from "../utils/loyaltyProgramForm";
import SegmentationTiersEditor, {
  AddTierButton,
} from "./SegmentationTiersEditor";
import CustomAttributesEditor, {
  AddCustomAttributeButton,
  attributeFieldOptions,
} from "./CustomAttributesEditor";

interface LoyaltyProgramFormProps {
  value: LoyaltyProgramFormValues;
  errors: LoyaltyProgramFormErrors;
  sources: AttributeFieldOption[];
  sourcesLoading: boolean;
  sourcesError: string | null;
  sourcesNote?: string | null;
  disabled?: boolean;
  onChange: (value: LoyaltyProgramFormValues) => void;
}

export default function LoyaltyProgramForm({
  value,
  errors,
  sources,
  sourcesLoading,
  sourcesError,
  sourcesNote = null,
  disabled = false,
  onChange,
}: LoyaltyProgramFormProps) {
  const patch = (next: Partial<LoyaltyProgramFormValues>) => {
    onChange({ ...value, ...next });
  };

  return (
    <div className="space-y-6">
      <Section
        title="Program"
        description="Name the program and describe how customers earn and redeem inside it. Points stay in this program and are not added to any other program."
      >
        <Input
          label="Program name"
          value={value.name}
          disabled={disabled}
          hasError={Boolean(errors.name)}
          onChange={(next) => patch({ name: String(next) })}
        />
        {errors.name && <FieldError>{errors.name}</FieldError>}
        <Textarea
          label="Description"
          value={value.description}
          disabled={disabled}
          hasError={Boolean(errors.description)}
          rows={3}
          onChange={(next) => patch({ description: next })}
        />
        {errors.description && <FieldError>{errors.description}</FieldError>}
      </Section>

      <Section
        title="Program validity"
        description="Customers can register and earn while the program is inside these dates. Point expiry is configured separately and can continue after the program ends."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Input
              label="Start date"
              type="date"
              value={value.startDate}
              disabled={disabled}
              hasError={Boolean(errors.startDate)}
              onChange={(next) => patch({ startDate: String(next) })}
            />
            {errors.startDate && <FieldError>{errors.startDate}</FieldError>}
          </div>
          <div>
            <Input
              label="End date"
              type="date"
              value={value.endDate}
              disabled={disabled}
              hasError={Boolean(errors.endDate)}
              onChange={(next) => patch({ endDate: String(next) })}
            />
            {errors.endDate && <FieldError>{errors.endDate}</FieldError>}
          </div>
        </div>
      </Section>

      <Section
        title="Bonus points validity"
        description="Bonus points are the balance a customer redeems as rewards."
      >
        <ValidityChoice
          name="bonus-points-validity"
          mode={value.bonusValidity}
          days={value.bonusValidityDays}
          daysError={errors.bonusDays}
          disabled={disabled}
          onModeChange={(mode) => patch({ bonusValidity: mode })}
          onDaysChange={(days) => patch({ bonusValidityDays: days })}
        />
      </Section>

      <Section
        title="Segmentation tiers"
        description="Segmentation points place a customer in a tier."
        action={
          <AddTierButton
            disabled={disabled}
            onClick={() =>
              patch({ tiers: [...value.tiers, createEmptyTier()] })
            }
          />
        }
      >
        <SegmentationTiersEditor
          mode={value.tierMode}
          tiers={value.tiers}
          errors={errors.tiers ?? []}
          disabled={disabled}
          onModeChange={(tierMode) => patch({ tierMode })}
          onTiersChange={(tiers) => patch({ tiers })}
        />
      </Section>

      <Section
        title="Segmentation points validity"
        description="Choose how long segmentation points remain available for tier evaluation."
      >
        <ValidityChoice
          name="segmentation-points-validity"
          mode={value.segmentationValidity}
          days={value.segmentationValidityDays}
          daysError={errors.segmentationDays}
          disabled={disabled}
          onModeChange={(mode) => patch({ segmentationValidity: mode })}
          onDaysChange={(days) => patch({ segmentationValidityDays: days })}
        />
      </Section>

      <Section
        title="Custom attributes (Optional)"
        description="Build a formula from numeric fields and apply a condition."
        action={
          <AddCustomAttributeButton
            disabled={
              disabled ||
              sourcesLoading ||
              Boolean(sourcesError) ||
              attributeFieldOptions(sources, value.attributes).length === 0
            }
            onClick={() =>
              patch({
                attributes: [...value.attributes, createEmptyAttribute()],
              })
            }
          />
        }
      >
        <CustomAttributesEditor
          attributes={value.attributes}
          sources={sources}
          sourcesLoading={sourcesLoading}
          sourcesError={sourcesError}
          sourcesNote={sourcesNote}
          errors={errors.attributes ?? []}
          disabled={disabled}
          onChange={(attributes) => patch({ attributes })}
        />
      </Section>
    </div>
  );
}

function ValidityChoice({
  name,
  mode,
  days,
  daysError,
  disabled,
  onModeChange,
  onDaysChange,
}: {
  name: string;
  mode: PointsValidityMode;
  days: string;
  daysError?: string;
  disabled?: boolean;
  onModeChange: (mode: PointsValidityMode) => void;
  onDaysChange: (days: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-8">
        <Radio
          name={name}
          value="unlimited"
          checked={mode === "unlimited"}
          disabled={disabled}
          label="Unlimited"
          onChange={() => onModeChange("unlimited")}
        />
        <Radio
          name={name}
          value="limited"
          checked={mode === "limited"}
          disabled={disabled}
          label="Limited"
          onChange={() => onModeChange("limited")}
        />
      </div>
      {mode === "limited" && (
        <div className="max-w-xs">
          <Input
            label="Valid for (days)"
            type="number"
            value={days}
            disabled={disabled}
            hasError={Boolean(daysError)}
            onChange={(next) => onDaysChange(String(next))}
          />
          {daysError && <FieldError>{daysError}</FieldError>}
        </div>
      )}
      {mode === "unlimited" && (
        <p className={`text-sm ${tw.textSecondary}`}>
          Accumulated points do not expire.
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <p className={`mt-1 text-sm ${tw.textSecondary}`}>{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function FieldError({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-sm text-red-600">{children}</p>;
}
