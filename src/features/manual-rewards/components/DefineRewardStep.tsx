import { useState, useEffect, useRef } from "react";
import { AlertCircle, Package, Coins, Percent, DollarSign, ChevronDown } from "lucide-react";
import { color, tw, zIndex, components } from "../../../shared/utils/utils";
import { ManualRewardData } from "../pages/CreateManualRewardPage";
import { useLanguage } from "../../../contexts/LanguageContext";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { communicationPolicyService } from "../../campaigns/services/communicationPolicyService";
import type { CommunicationPolicyConfiguration } from "../../campaigns/types/communicationPolicyConfig";
import { useClickOutside } from "../../../shared/hooks/useClickOutside";

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

  // Communication Policy states
  const [communicationPolicies, setCommunicationPolicies] = useState<
    CommunicationPolicyConfiguration[]
  >([]);
  const [selectedPolicy, setSelectedPolicy] =
    useState<CommunicationPolicyConfiguration | null>(null);
  const [isPolicyDropdownOpen, setIsPolicyDropdownOpen] = useState(false);
  const policyDropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(policyDropdownRef, () => setIsPolicyDropdownOpen(false));

  // Load Communication Policies
  useEffect(() => {
    setCommunicationPolicies(communicationPolicyService.getAllPolicies());

    const unsubscribe = communicationPolicyService.subscribe(
      (updatedPolicies) => {
        setCommunicationPolicies(updatedPolicies);
      },
    );

    return unsubscribe;
  }, []);

  // Sync selectedPolicy with parent data
  useEffect(() => {
    if (data.selectedCommunicationPolicyId) {
      const policy = communicationPolicyService.getPolicyById(
        data.selectedCommunicationPolicyId,
      );
      if (policy) {
        setSelectedPolicy(policy);
      }
    }
  }, [data.selectedCommunicationPolicyId]);

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
    onUpdate({ rewardType: type, rewardValue: "" });
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
      selectedCommunicationPolicyId: selectedPolicy?.id,
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
                  key={`${type.id}-${isSelected}`}
                  type="button"
                  onClick={() => handleRewardTypeSelect(type.id)}
                  className={`flex flex-col items-center justify-center gap-1.5 p-2.5 ${tw.rounded} bg-white`}
                  style={{
                    borderWidth: "2px",
                    borderStyle: "solid",
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
              onChange={(e) => {
                setRewardValue(e.target.value);
                onUpdate({ rewardValue: e.target.value });
              }}
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
              onChange={(value) => {
                setBundleTrack(value as string);
                onUpdate({ bundleTrack: value as string });
              }}
              placeholder={t.manualRewards.bundleTrackPlaceholder}
              zIndex={zIndex.popover}
            />
            <p className={`mt-1 text-xs ${tw.textSecondary}`}>
              {t.manualRewards.bundleTrackHelper}
            </p>
          </div>
        )}

        {/* Communication Policy (Optional) */}
        <div>
          <label className={`block text-sm font-medium ${tw.textPrimary} mb-3`}>
            Communication Policy{" "}
            <span className={tw.textMuted}>({t.manualRewards.optional})</span>
          </label>
          <div className="relative" ref={policyDropdownRef}>
            <button
              type="button"
              onClick={() => setIsPolicyDropdownOpen(!isPolicyDropdownOpen)}
              className={`${
                components.input.default
              } w-full px-3 py-2 text-left flex items-center justify-between ${
                selectedPolicy ? "" : "text-gray-500"
              }`}
            >
              <div className="flex items-center gap-2">
                {selectedPolicy && (
                  <div
                    className={`w-2 h-2 rounded-full ${
                      selectedPolicy.isActive ? "bg-green-500" : "bg-gray-400"
                    }`}
                  ></div>
                )}
                <span className="text-sm">
                  {selectedPolicy
                    ? selectedPolicy.name
                    : "Choose a communication policy (optional)"}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isPolicyDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isPolicyDropdownOpen && (
              <div
                className={`absolute z-50 w-full mt-1 bg-white border ${tw.rounded} shadow-xl max-h-64 overflow-hidden`}
                style={{ borderColor: color.border.default }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPolicy(null);
                    onUpdate({ selectedCommunicationPolicyId: undefined });
                    setIsPolicyDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b"
                  style={{ borderColor: color.border.default }}
                >
                  <div className={`text-sm font-medium ${tw.textPrimary}`}>
                    No Policy
                  </div>
                  <div className={`text-xs ${tw.textSecondary}`}>
                    Reward will use default communication settings
                  </div>
                </button>

                <div className="max-h-48 overflow-y-auto">
                  {communicationPolicies.map((policy) => (
                    <button
                      key={policy.id}
                      type="button"
                      onClick={() => {
                        setSelectedPolicy(policy);
                        onUpdate({ selectedCommunicationPolicyId: policy.id });
                        setIsPolicyDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b last:border-b-0"
                      style={{ borderColor: color.border.default }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            policy.isActive ? "bg-green-500" : "bg-gray-400"
                          }`}
                        ></div>
                        <div className={`text-sm font-medium ${tw.textPrimary}`}>
                          {policy.name}
                        </div>
                      </div>
                      {policy.description && (
                        <div className={`text-xs ${tw.textSecondary} mt-1`}>
                          {policy.description}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <p className={`mt-1 text-xs ${tw.textSecondary}`}>
            Select a communication policy to control how this reward is delivered to recipients
          </p>
        </div>

        {/* Description (Optional) */}
        <div>
          <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
            {t.manualRewards.descriptionLabel}{" "}
            <span className={tw.textMuted}>({t.manualRewards.optional})</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              onUpdate({ description: e.target.value });
            }}
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

    </div>
  );
}
