import { useState } from "react";
import {
  Gift,
  AlertCircle,
  Package,
  Coins,
  Percent,
  DollarSign,
} from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { ManualRewardData } from "../pages/CreateManualRewardPage";
import { useLanguage } from "../../../contexts/LanguageContext";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";

interface DefineRewardStepProps {
  data: ManualRewardData;
  onUpdate: (data: Partial<ManualRewardData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

type RewardType = "bundle" | "points" | "discount" | "cashback";

const BUNDLE_TRACKS = [
  "R2TPersAdjustBalCount2",
  "SelectDependantProduct",
  "SYSDATE",
];

export default function DefineRewardStep({
  data,
  onUpdate,
  onNext,
  onPrevious,
}: DefineRewardStepProps) {
  const { t } = useLanguage();
  const [rewardType, setRewardType] = useState<RewardType>(
    (data.rewardType as RewardType) || "bundle"
  );
  const [rewardValue, setRewardValue] = useState(data.rewardValue || "");
  const [bundleTrack, setBundleTrack] = useState(
    data.bundleTrack || BUNDLE_TRACKS[0]
  );
  const [description, setDescription] = useState(data.description || "");
  const [error, setError] = useState("");

  const rewardTypes = [
    {
      id: "bundle" as RewardType,
      name: t.manualRewards.rewardTypeBundle,
      icon: Package,
      description: t.manualRewards.rewardTypeBundleDesc,
    },
    {
      id: "points" as RewardType,
      name: t.manualRewards.rewardTypePoints,
      icon: Coins,
      description: t.manualRewards.rewardTypePointsDesc,
    },
    {
      id: "discount" as RewardType,
      name: t.manualRewards.rewardTypeDiscount,
      icon: Percent,
      description: t.manualRewards.rewardTypeDiscountDesc,
    },
    {
      id: "cashback" as RewardType,
      name: t.manualRewards.rewardTypeCashback,
      icon: DollarSign,
      description: t.manualRewards.rewardTypeCashbackDesc,
    },
  ];

  const handleRewardTypeSelect = (type: RewardType) => {
    setRewardType(type);
    // Reset value when changing type
    setRewardValue("");
  };

  const handleNext = () => {
    // Validation
    if (!rewardValue.trim()) {
      setError(t.manualRewards.errorRewardValueRequired);
      return;
    }

    // Validate numeric value
    const numValue = parseFloat(rewardValue);
    if (isNaN(numValue) || numValue <= 0) {
      setError(t.manualRewards.errorRewardValueInvalid);
      return;
    }

    // For bundle type, validate bundle track
    if (rewardType === "bundle" && !bundleTrack) {
      setError(t.manualRewards.errorBundleTrackRequired);
      return;
    }

    setError("");

    // Update data
    onUpdate({
      rewardType: rewardType,
      rewardValue: rewardValue.trim(),
      bundleTrack: rewardType === "bundle" ? bundleTrack : undefined,
      description: description.trim() || undefined,
    });

    // Move to next step
    onNext();
  };

  return (
    <div
      className={`bg-white ${tw.rounded} shadow-sm border`}
      style={{ borderColor: color.border.default }}
    >
      <div
        className="p-4 sm:p-6 border-b"
        style={{ borderColor: color.border.default }}
      >
        <h2 className={`text-lg sm:text-xl font-semibold ${tw.textPrimary}`}>
          {t.manualRewards.defineRewardTitle}
        </h2>
        <p className={`text-xs sm:text-sm ${tw.textSecondary} mt-1`}>
          {t.manualRewards.defineRewardSubtitle}
        </p>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Reward Type Selection */}
        <div>
          <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
            {t.manualRewards.rewardTypeLabel}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2">
            {rewardTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = rewardType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleRewardTypeSelect(type.id)}
                  className={`flex flex-col items-center justify-center gap-1.5 p-2.5 ${tw.rounded} border-2 transition-all bg-white`}
                  style={{
                    borderColor: isSelected
                      ? color.primary.accent
                      : color.border.default,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: isSelected
                        ? color.primary.accent
                        : color.surface.cards,
                    }}
                  >
                    <Icon
                      className="w-4 h-4"
                      style={{
                        color: isSelected ? "white" : color.text.secondary,
                      }}
                    />
                  </div>
                  <div className="text-center">
                    <p
                      className={`text-sm font-semibold ${
                        isSelected ? tw.textPrimary : tw.textSecondary
                      }`}
                    >
                      {type.name}
                    </p>
                    <p
                      className={`text-xs ${tw.textMuted} mt-0.5 hidden sm:block`}
                    >
                      {type.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: color.primary.accent }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reward Value */}
        <div>
          <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
            {t.manualRewards.rewardValueLabel}
          </label>
          <div className="relative">
            <input
              type="number"
              value={rewardValue}
              onChange={(e) => setRewardValue(e.target.value)}
              className={`w-full px-3 py-2 text-sm border ${tw.rounded} focus:outline-none focus:ring-2`}
              style={{
                borderColor: color.border.default,
                color: color.text.primary,
              }}
              placeholder={
                rewardType === "bundle"
                  ? t.manualRewards.rewardValuePlaceholderBundle
                  : rewardType === "points"
                  ? t.manualRewards.rewardValuePlaceholderPoints
                  : rewardType === "discount"
                  ? t.manualRewards.rewardValuePlaceholderDiscount
                  : t.manualRewards.rewardValuePlaceholderCashback
              }
              min="0"
              step="0.01"
            />
            <span
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm"
              style={{ color: color.text.muted }}
            >
              {rewardType === "discount" ? "%" : ""}
            </span>
          </div>
          <p className={`mt-1 text-xs ${tw.textSecondary}`}>
            {rewardType === "bundle"
              ? t.manualRewards.rewardValueHelperBundle
              : rewardType === "points"
              ? t.manualRewards.rewardValueHelperPoints
              : rewardType === "discount"
              ? t.manualRewards.rewardValueHelperDiscount
              : t.manualRewards.rewardValueHelperCashback}
          </p>
        </div>

        {/* Bundle Track (only for bundle type) */}
        {rewardType === "bundle" && (
          <div>
            <label
              className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
            >
              {t.manualRewards.bundleTrackLabel}
            </label>
            <HeadlessSelect
              options={BUNDLE_TRACKS.map((track) => ({
                value: track,
                label: track,
              }))}
              value={bundleTrack}
              onChange={(value) => setBundleTrack(value as string)}
              placeholder={t.manualRewards.bundleTrackPlaceholder}
            />
            <p className={`mt-1 text-xs ${tw.textSecondary}`}>
              {t.manualRewards.bundleTrackHelper}
            </p>
          </div>
        )}

        {/* Description (Optional) */}
        <div>
          <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
            {t.manualRewards.descriptionLabel}{" "}
            <span className={tw.textMuted}>({t.manualRewards.optional})</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`w-full px-3 py-2 text-sm border ${tw.rounded} focus:outline-none focus:ring-2`}
            style={{
              borderColor: color.border.default,
              color: color.text.primary,
            }}
            placeholder={t.manualRewards.descriptionPlaceholder}
            rows={3}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div
            className={`mt-4 sm:mt-6 p-3 ${tw.rounded} flex items-start space-x-2`}
            style={{
              backgroundColor: `${color.status.danger}10`,
              border: `1px solid ${color.status.danger}30`,
            }}
          >
            <AlertCircle
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              style={{ color: color.status.danger }}
            />
            <p className="text-sm" style={{ color: color.status.danger }}>
              {error}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="p-4 sm:p-6 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
        style={{ borderColor: color.border.default }}
      >
        <button
          onClick={onPrevious}
          className={`w-full sm:w-auto px-6 py-2.5 ${tw.rounded} transition-all text-sm font-semibold whitespace-nowrap`}
          style={{
            backgroundColor: color.surface.cards,
            border: `1px solid ${color.border.default}`,
            color: color.text.primary,
          }}
        >
          {t.manualRewards.previous}
        </button>
        <button
          onClick={handleNext}
          disabled={!rewardValue.trim()}
          className={`w-full sm:w-auto px-6 py-2.5 text-white ${tw.rounded} transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
          style={{ backgroundColor: color.primary.action }}
        >
          {t.manualRewards.nextPreview}
        </button>
      </div>
    </div>
  );
}
