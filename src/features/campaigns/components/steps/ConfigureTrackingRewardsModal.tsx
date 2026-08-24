import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { BarChart3, Gift, Plus, Trash2, X } from "lucide-react";
import { color, tw } from "../../../../shared/utils/utils";
import { zIndex } from "../../../../shared/utils/tokens";
import Input from "../../../../shared/components/ui/Input";
import Radio from "../../../../shared/components/ui/Radio";
import Checkbox from "../../../../shared/components/ui/Checkbox";
import HeadlessSelect from "../../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../../shared/components/ui/LoadingSpinner";
import { offerService } from "../../../offers/services/offerService";
import { parseOfferWizardMetadata } from "../../../offers/utils/offerWizardPersistence";
import type { OfferTrackingSource } from "../../../offers/types/offerTrackingSource";
import type { OfferReward } from "../../../offers/types/offerReward";
import { engineTrackingSourceService } from "../../../configurations/services/engineTrackingSourceService";
import { engineSourceTypeLabel } from "../../../configurations/types/engineTrackingSource";
import { TRACKING_TYPE_OPTIONS } from "../../../offers/utils/trackingSourcesConfig";
import type { MappingTrackingRewardConfig } from "../../types/trackingRewardConfig";
import {
  cloneMappingTrackingRewardConfig,
  commitMappingTrackingRewardConfig,
  createTrackingSourceCampaignConfig,
  enabledRulesForSource,
  formatLimit,
  hoursToAttributionWindow,
  rewardLabelForSource,
  unassignedTrackingSources,
  validateMappingTrackingRewardConfig,
} from "../../utils/trackingRewardConfig";

interface ConfigureTrackingRewardsModalProps {
  isOpen: boolean;
  segmentName: string;
  offerName: string;
  offerId: string;
  initialConfig?: MappingTrackingRewardConfig;
  onClose: () => void;
  onSave: (config: MappingTrackingRewardConfig) => void;
}

function trackingTypeLabel(type: string | undefined): string {
  if (!type) return "—";
  return (
    TRACKING_TYPE_OPTIONS.find((t) => t.value === type)?.label ||
    engineSourceTypeLabel(type)
  );
}

export default function ConfigureTrackingRewardsModal({
  isOpen,
  segmentName,
  offerName,
  offerId,
  initialConfig,
  onClose,
  onSave,
}: ConfigureTrackingRewardsModalProps) {
  const [config, setConfig] = useState<MappingTrackingRewardConfig>(
    cloneMappingTrackingRewardConfig(initialConfig),
  );
  const [trackingSources, setTrackingSources] = useState<OfferTrackingSource[]>(
    [],
  );
  const [rewards, setRewards] = useState<OfferReward[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sourceToAdd, setSourceToAdd] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const resetLocalState = useCallback(() => {
    setConfig(cloneMappingTrackingRewardConfig(initialConfig));
    setFormError("");
    setFieldErrors({});
    setSourceToAdd("");
    setLoadError("");
  }, [initialConfig]);

  useEffect(() => {
    if (!isOpen) return;
    resetLocalState();

    let cancelled = false;
    const loadOffer = async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await offerService.getOfferById(Number(offerId), true);
        const offer = response?.data;
        if (!offer) {
          throw new Error("Offer details were not returned.");
        }
        const wizard = parseOfferWizardMetadata(offer.metadata, {
          trackingSources: offer.tracking_sources,
          rewardConfiguration: offer.reward_configuration,
        });
        const sources = (wizard.trackingSources || []) as OfferTrackingSource[];
        if (cancelled) return;
        setTrackingSources(sources.filter((s) => s && s.id));
        setRewards(wizard.rewards || []);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load offer tracking sources:", err);
        setLoadError(
          err instanceof Error
            ? err.message
            : "Could not load tracking sources for this offer.",
        );
        setTrackingSources([]);
        setRewards([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadOffer();
    return () => {
      cancelled = true;
    };
  }, [isOpen, offerId, resetLocalState]);

  const availableSources = useMemo(
    () => unassignedTrackingSources(trackingSources, config),
    [trackingSources, config],
  );

  const sourceOptions = useMemo(
    () =>
      availableSources.map((source) => ({
        value: source.id,
        label: `${source.name || source.code || source.id} (${trackingTypeLabel(source.type)})`,
      })),
    [availableSources],
  );

  useEffect(() => {
    if (availableSources.length === 0) {
      setSourceToAdd("");
      return;
    }
    if (!availableSources.some((s) => s.id === sourceToAdd)) {
      setSourceToAdd(availableSources[0].id);
    }
  }, [availableSources, sourceToAdd]);

  const handleAddSource = async () => {
    if (!sourceToAdd || isAdding) return;
    const source = availableSources.find((s) => s.id === sourceToAdd);
    if (!source) {
      setFormError("Select a tracking source that does not already have a configuration.");
      return;
    }

    setIsAdding(true);
    setFormError("");
    try {
      let attributionWindow = undefined;
      if (source.engine_tracking_source_id) {
        try {
          const engine = await engineTrackingSourceService.getById(
            source.engine_tracking_source_id,
          );
          if (engine?.attributionWindowHours != null) {
            attributionWindow = hoursToAttributionWindow(
              engine.attributionWindowHours,
            );
          }
        } catch {
          // Catalog lookup is optional — operators can still set the window.
        }
      }

      setConfig((prev) => ({
        ...prev,
        sources: [
          ...prev.sources,
          createTrackingSourceCampaignConfig({ source, attributionWindow }),
        ],
      }));
    } finally {
      setIsAdding(false);
    }
  };

  const updateSource = (
    cardId: string,
    patch: Partial<MappingTrackingRewardConfig["sources"][number]>,
  ) => {
    setConfig((prev) => ({
      ...prev,
      sources: prev.sources.map((card) =>
        card.id === cardId ? { ...card, ...patch } : card,
      ),
    }));
  };

  const updateWindow = (
    cardId: string,
    field: "days" | "hours" | "minutes",
    raw: string | number,
  ) => {
    const parsed = raw === "" ? 0 : Number(raw);
    const value = Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
    setConfig((prev) => ({
      ...prev,
      sources: prev.sources.map((card) =>
        card.id === cardId
          ? {
              ...card,
              attribution_window: {
                ...card.attribution_window,
                [field]: value,
              },
            }
          : card,
      ),
    }));
  };

  const handleRemoveDraft = (cardId: string) => {
    setConfig((prev) => ({
      ...prev,
      sources: prev.sources.filter((card) => card.id !== cardId || card.committed),
    }));
  };

  const handleSave = () => {
    const validation = validateMappingTrackingRewardConfig(config, trackingSources);
    setFieldErrors(validation.fieldErrors);
    if (!validation.isValid) {
      setFormError(
        validation.errors[0] ||
          "Fix the highlighted fields before saving this configuration.",
      );
      return;
    }
    onSave(commitMappingTrackingRewardConfig(config));
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed bg-black bg-opacity-50 flex items-center justify-center"
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: zIndex.modal,
      }}
    >
      <div
        className={`bg-white ${tw.rounded} max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-300`}
      >
        <div className="p-6 border-b border-gray-200 flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Configure tracking and rewards
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Configure tracking and reward settings for{" "}
              <span className="font-medium">{segmentName}</span>
              {" → "}
              <span className="font-medium">{offerName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : loadError ? (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <p className="text-sm text-red-700">{loadError}</p>
            </div>
          ) : trackingSources.length === 0 ? (
            <div className={`border border-dashed border-gray-300 ${tw.rounded} p-8 text-center`}>
              <BarChart3 className="w-8 h-8 mx-auto mb-3 text-gray-400" />
              <p className="text-sm font-medium text-gray-900">
                This offer has no tracking sources
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Add tracking sources and rewards in Offer Management first. Campaign
                mappings overlay attribution, filtering, and limits on those sources.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-stretch gap-2">
                <div className="min-w-0 flex-1">
                  <HeadlessSelect
                    label="Tracking source"
                    options={
                      sourceOptions.length > 0
                        ? sourceOptions
                        : [{ value: "", label: "All sources already configured" }]
                    }
                    value={sourceToAdd}
                    onChange={(value) => setSourceToAdd(String(value))}
                    placeholder="Select a tracking source"
                    disabled={availableSources.length === 0 || isAdding}
                    zIndex={zIndex.confirm}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void handleAddSource()}
                  disabled={availableSources.length === 0 || isAdding || !sourceToAdd}
                  className={`shrink-0 self-stretch inline-flex items-center justify-center gap-1.5 px-4 text-sm font-medium leading-none text-white ${tw.rounded} disabled:opacity-50 disabled:cursor-not-allowed`}
                  style={{ backgroundColor: color.primary.action, minHeight: 0 }}
                  title={
                    availableSources.length === 0
                      ? "Each tracking source can only be configured once"
                      : "Add configuration for the selected tracking source"
                  }
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
              <p className={`text-xs ${tw.textSecondary}`}>
                Each tracking source can have one configuration on this mapping.
                Saved configurations cannot be created again
              </p>

              {config.sources.length === 0 ? (
                <div className={`border border-gray-200 ${tw.rounded} p-8 text-center bg-gray-50`}>
                  <Gift className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900">
                    No tracking source configurations yet
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Use Add to attach attribution, filtering, and limits for a
                    particular tracking source.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {config.sources.map((card) => {
                    const catalog = trackingSources.find(
                      (s) => s.id === card.tracking_source_id,
                    );
                    const ruleCount = enabledRulesForSource(catalog).length;
                    const locked = card.committed;
                    const offerReward = rewardLabelForSource(
                      rewards,
                      card.tracking_source_id,
                    );
                    const noTrackingLimit = card.tracking_limit == null;
                    const noRewardLimit = card.reward_limit == null;

                    return (
                      <div
                        key={card.id}
                        className={`border ${tw.rounded} p-4 space-y-4 ${
                          locked ? "border-gray-200 bg-gray-50" : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-semibold text-gray-900 truncate">
                                {card.tracking_source_name}
                              </h4>
                              {locked ? (
                                <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-gray-200 text-gray-700">
                                  Configured
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-amber-50 text-amber-800">
                                  Draft
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {trackingTypeLabel(card.tracking_source_type)}
                              {ruleCount > 0
                                ? ` · ${ruleCount} tracking rule${ruleCount === 1 ? "" : "s"}`
                                : " · No tracking rules"}
                              {offerReward ? ` · Offer reward: ${offerReward}` : ""}
                            </p>
                          </div>
                          {!locked ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveDraft(card.id)}
                              className="p-1.5 text-red-600 rounded hover:bg-red-50"
                              title="Remove this draft configuration"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : null}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Attribution window
                          </label>
                          <p className="text-xs text-gray-500 mb-3">
                            Leave all values at 0 to inherit the tracking source catalog
                            default. Days/hours/minutes are combined into a single window.
                          </p>
                          <div className="grid grid-cols-3 gap-3">
                            <Input
                              type="number"
                              label="Days"
                              min={0}
                              max={365}
                              value={card.attribution_window.days}
                              disabled={locked}
                              hasError={Boolean(fieldErrors[`${card.id}.days`])}
                              onChange={(value) => updateWindow(card.id, "days", value)}
                            />
                            <Input
                              type="number"
                              label="Hours"
                              min={0}
                              max={23}
                              value={card.attribution_window.hours}
                              disabled={locked}
                              hasError={Boolean(fieldErrors[`${card.id}.hours`])}
                              onChange={(value) => updateWindow(card.id, "hours", value)}
                            />
                            <Input
                              type="number"
                              label="Minutes"
                              min={0}
                              max={59}
                              value={card.attribution_window.minutes}
                              disabled={locked}
                              hasError={Boolean(fieldErrors[`${card.id}.minutes`])}
                              onChange={(value) =>
                                updateWindow(card.id, "minutes", value)
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Filtering criteria
                          </label>
                          <div className="space-y-3">
                            <label className="flex items-start space-x-3 cursor-pointer">
                              <Radio
                                name={`filtering-${card.id}`}
                                value="match_any"
                                checked={card.filtering_criteria === "match_any"}
                                disabled={locked || ruleCount === 0}
                                onChange={() =>
                                  updateSource(card.id, {
                                    filtering_criteria: "match_any",
                                  })
                                }
                                className="mt-1 w-4 h-4"
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  Match any rule
                                </div>
                                <div className="text-sm text-gray-500">
                                  Count a conversion when any enabled tracking rule on
                                  this source matches.
                                </div>
                              </div>
                            </label>
                            <label className="flex items-start space-x-3 cursor-pointer">
                              <Radio
                                name={`filtering-${card.id}`}
                                value="no_rule"
                                checked={card.filtering_criteria === "no_rule"}
                                disabled={locked}
                                onChange={() =>
                                  updateSource(card.id, {
                                    filtering_criteria: "no_rule",
                                  })
                                }
                                className="mt-1 w-4 h-4"
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  No rule
                                </div>
                                <div className="text-sm text-gray-500">
                                  Source-level tracking with no rule filter.
                                </div>
                              </div>
                            </label>
                          </div>
                          {fieldErrors[`${card.id}.filtering_criteria`] ? (
                            <p className="text-xs text-red-600 mt-2">
                              {fieldErrors[`${card.id}.filtering_criteria`]}
                            </p>
                          ) : null}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Limits
                          </label>
                          <p className="text-xs text-gray-500 mb-3">
                            If not set, there is no limit.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`${card.id}-no-tracking-limit`}
                                  checked={noTrackingLimit}
                                  disabled={locked}
                                  onChange={() =>
                                    updateSource(card.id, {
                                      tracking_limit: noTrackingLimit ? 1 : null,
                                    })
                                  }
                                />
                                <label
                                  htmlFor={`${card.id}-no-tracking-limit`}
                                  className="text-sm text-gray-700"
                                >
                                  No tracking limit
                                </label>
                              </div>
                              <Input
                                type="number"
                                label="Tracking limit"
                                min={1}
                                value={card.tracking_limit ?? ""}
                                disabled={locked || noTrackingLimit}
                                hasError={Boolean(
                                  fieldErrors[`${card.id}.tracking_limit`],
                                )}
                                onChange={(value) => {
                                  const n = value === "" ? null : Number(value);
                                  updateSource(card.id, {
                                    tracking_limit:
                                      n == null || !Number.isFinite(n) ? null : Math.floor(n),
                                  });
                                }}
                              />
                              {locked ? (
                                <p className="text-xs text-gray-500">
                                  {formatLimit(card.tracking_limit)}
                                </p>
                              ) : null}
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`${card.id}-no-reward-limit`}
                                  checked={noRewardLimit}
                                  disabled={locked}
                                  onChange={() =>
                                    updateSource(card.id, {
                                      reward_limit: noRewardLimit ? 1 : null,
                                    })
                                  }
                                />
                                <label
                                  htmlFor={`${card.id}-no-reward-limit`}
                                  className="text-sm text-gray-700"
                                >
                                  No reward limit
                                </label>
                              </div>
                              <Input
                                type="number"
                                label="Reward limit"
                                min={1}
                                value={card.reward_limit ?? ""}
                                disabled={locked || noRewardLimit}
                                hasError={Boolean(
                                  fieldErrors[`${card.id}.reward_limit`],
                                )}
                                onChange={(value) => {
                                  const n = value === "" ? null : Number(value);
                                  updateSource(card.id, {
                                    reward_limit:
                                      n == null || !Number.isFinite(n) ? null : Math.floor(n),
                                  });
                                }}
                              />
                              {locked ? (
                                <p className="text-xs text-gray-500">
                                  {formatLimit(card.reward_limit)}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {formError ? (
            <div className="rounded-md bg-red-50 p-3 border border-red-200">
              <p className="text-sm text-red-700">{formError}</p>
            </div>
          ) : null}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-colors`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading || Boolean(loadError)}
            className={`${tw.button} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
