import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { tw } from "../../../shared/utils/utils";
import { SAMPLE_IDENTITY_FIELDS } from "../data/analyseSamples";

interface AnalysisOptionsFieldsProps {
  countIndividualAsRecipient: boolean;
  uniqueIdentifier: string | null;
  onCountIndividualChange: (value: boolean) => void;
  onUniqueIdentifierChange: (value: string | null) => void;
  isFavourite?: boolean;
  onFavouriteChange?: (value: boolean) => void;
  showFavourite?: boolean;
}

export default function AnalysisOptionsFields({
  countIndividualAsRecipient,
  uniqueIdentifier,
  onCountIndividualChange,
  onUniqueIdentifierChange,
  isFavourite = false,
  onFavouriteChange,
  showFavourite = false,
}: AnalysisOptionsFieldsProps) {
  return (
    <div className="space-y-4">
      {showFavourite && onFavouriteChange && (
        <label className={`flex items-start gap-3 text-sm ${tw.textPrimary}`}>
          <input
            type="checkbox"
            className="mt-0.5"
            checked={isFavourite}
            onChange={(event) => onFavouriteChange(event.target.checked)}
          />
          <span>Make this analysis a favourite</span>
        </label>
      )}

      <label className={`flex items-start gap-3 text-sm ${tw.textPrimary}`}>
        <input
          type="checkbox"
          className="mt-0.5"
          checked={countIndividualAsRecipient}
          onChange={(event) => onCountIndividualChange(event.target.checked)}
        />
        <span>
          Count each person once, even when they hold more than one account.
          The selected identity field is sent as the audience&apos;s unique
          identifier.
        </span>
      </label>

      {countIndividualAsRecipient && (
        <div className="pl-7">
          <HeadlessSelect
            label="Person identifier"
            options={SAMPLE_IDENTITY_FIELDS.map((field) => ({
              value: field.field_value,
              label: field.field_name,
            }))}
            value={uniqueIdentifier || ""}
            onChange={(value) =>
              onUniqueIdentifierChange(value ? String(value) : null)
            }
            placeholder="Select identity field"
            searchable
          />
        </div>
      )}
    </div>
  );
}
