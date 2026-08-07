import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, Gift, Edit, X } from "lucide-react";
import { color , tw} from "../../../shared/utils/utils";
import { zIndex } from "../../../shared/utils/tokens";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import HeadlessMultiSelect from "../../../shared/components/ui/HeadlessMultiSelect";
import Checkbox from "../../../shared/components/ui/Checkbox";
import Input from "../../../shared/components/ui/Input";
import {
  RULE_REWARD_TYPE_LABELS,
  type RuleRewardType,
} from "../../../shared/data/rewardProviders";
import { useRewardProviders } from "../../../shared/hooks/useRewardProviders";
import { useRewardProviderConfigurations } from "../../../shared/hooks/useRewardProviderConfigurations";
import RewardConfigurationParametersEditor from "../../configurations/components/reward-forms/RewardConfigurationParametersEditor";
import { errorGroupService } from "../../configurations/services/errorGroupService";
import type { ErrorGroup } from "../../configurations/types/errorGroup";
import {
  errorGroupIdKey,
  getRuleErrorGroupIds,
  resolveErrorGroupDefaultFailureMessage,
  withRuleErrorGroups,
} from "../../configurations/types/errorGroup";
import {
  isDefaultRewardTemplate,
  isVirtualDefaultTemplateId,
  materializeRewardTemplateId,
} from "../../configurations/utils/rewardTemplateDefaults";
import type { OfferReward, OfferRewardRule } from "../types/offerReward";
import type { OfferTrackingSource } from "../types/offerTrackingSource";
import { rewardConfigShouldBindTrackingRule } from "../utils/normalizeOfferWizardBindings";
import {
  createDefaultImmediateConfiguration,
  ensureImmediateDefaultReward,
  formatImmediateAddConfigButtonLabel,
  IMMEDIATE_DEFAULT_REWARD_NAME,
} from "../utils/seedingRewardDefaults";
import ConfigureErrorGroupModal from "./ConfigureErrorGroupModal";

interface OfferRewardStepProps {
  rewards: OfferReward[];
  onRewardsChange: (rewards: OfferReward[]) => void;
  trackingSources?: OfferTrackingSource[];
  requiresRewardTrackingMapping?: boolean;
  /** Immediate reward: always show/configure a tracking-independent default reward */
  usesDefaultReward?: boolean;
  /** Selected offer type display name (e.g. "Seeding") for CTA / copy */
  offerTypeName?: string | null;
}

export default function OfferRewardStep({
  rewards,
  onRewardsChange,
  trackingSources = [],
  requiresRewardTrackingMapping = false,
  usesDefaultReward = false,
  offerTypeName = null,
}: OfferRewardStepProps) {
  const [selectedReward, setSelectedReward] = useState<string | null>(
    rewards.length > 0 ? rewards[0].id : null
  );
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [isNewRule, setIsNewRule] = useState(false);
  const [editingRule, setEditingRule] = useState<OfferRewardRule | null>(null);
  const [ruleModalError, setRuleModalError] = useState("");
  const [ruleParametersValid, setRuleParametersValid] = useState(true);
  const [errorGroups, setErrorGroups] = useState<ErrorGroup[]>([]);
  const [loadingErrorGroups, setLoadingErrorGroups] = useState(false);
  const [errorGroupsError, setErrorGroupsError] = useState("");
  const [showErrorGroupModal, setShowErrorGroupModal] = useState(false);
  const {
    providerOptions,
    defaultProviderId,
    loading: loadingRewardProviders,
    resolveProvider,
    getProvider,
    error: providerLoadError,
  } = useRewardProviders({
    rewardType: showRuleModal ? editingRule?.reward_type ?? null : null,
  });
  const [rewardActionError, setRewardActionError] = useState("");
  const [sourceToAddReward, setSourceToAddReward] = useState("");

  const loadErrorGroups = useCallback(async (providerId?: string) => {
    setLoadingErrorGroups(true);
    setErrorGroupsError("");
    try {
      let groups: ErrorGroup[] = [];

      // Prefer provider-attached groups — fulfilment resolves mappings via this link.
      if (providerId && Number.isFinite(Number(providerId))) {
        try {
          groups = await errorGroupService.getErrorGroupsForProvider(providerId, {
            activeOnly: true,
          });
        } catch (providerErr) {
          console.warn(
            "Could not load provider error groups; falling back to catalog:",
            providerErr,
          );
        }
      }

      // Merge with full active catalog so operators can pick and attach.
      const allActive = await errorGroupService.getErrorGroups({
        activeOnly: true,
      });
      const byId = new Map<number, ErrorGroup>();
      [...groups, ...allActive].forEach((g) => {
        byId.set(Number(g.id), g);
      });
      setErrorGroups(Array.from(byId.values()));
    } catch (error) {
      console.error("Error fetching error groups:", error);
      setErrorGroups([]);
      setErrorGroupsError(
        "Could not load error groups. Check that /error-groups is available.",
      );
    } finally {
      setLoadingErrorGroups(false);
    }
  }, []);

  const selectedProviderId = editingRule?.bundle_subscription_track ?? "";

  useEffect(() => {
    if (showRuleModal) {
      void loadErrorGroups(selectedProviderId || undefined);
    }
  }, [showRuleModal, selectedProviderId, loadErrorGroups]);

  // Seeding offers must always expose a default reward (create + edit).
  useEffect(() => {
    if (!usesDefaultReward) return;
    const { rewards: next, changed } = ensureImmediateDefaultReward(rewards);
    if (changed) {
      onRewardsChange(next);
      const defaultReward = next.find((r) => r.is_default);
      if (defaultReward) setSelectedReward(defaultReward.id);
    }
  }, [usesDefaultReward, rewards, onRewardsChange]);

  const selectedErrorGroupIds = useMemo(
    () => (editingRule ? getRuleErrorGroupIds(editingRule) : []),
    [editingRule],
  );

  const errorGroupOptions = useMemo(() => {
    const opts = errorGroupService.toSelectOptions(errorGroups).map((o) => ({
      value: String(o.value),
      label: o.label,
    }));
    const known = new Set(opts.map((o) => o.value));

    // Keep currently selected ids visible even if temporarily missing from catalog.
    selectedErrorGroupIds.forEach((id) => {
      if (!id || known.has(id)) return;
      const labelPart = editingRule?.error_group
        ?.split(",")
        .map((s) => s.trim())
        .find((s) => s.includes(id));
      opts.unshift({
        value: id,
        label: labelPart || `Error group (${id})`,
      });
      known.add(id);
    });

    return opts;
  }, [errorGroups, selectedErrorGroupIds, editingRule?.error_group]);

  const ensureGroupDetails = async (groupId: string): Promise<ErrorGroup | null> => {
    let group =
      errorGroups.find((g) => errorGroupIdKey(g.id) === groupId) || null;
    if (group && group.mappings && group.mappings.length > 0) return group;
    try {
      group = await errorGroupService.getErrorGroupById(groupId);
      setErrorGroups((prev) => {
        const others = prev.filter((g) => errorGroupIdKey(g.id) !== groupId);
        return [...others, group!];
      });
      return group;
    } catch {
      return group;
    }
  };

  const attachGroupsToProvider = async (groupIds: string[]) => {
    const providerId = editingRule?.bundle_subscription_track;
    if (!providerId || !Number.isFinite(Number(providerId))) return;
    await Promise.allSettled(
      groupIds.map((groupId) =>
        errorGroupService.attachErrorGroupToProvider(providerId, groupId),
      ),
    );
  };

  const applyErrorGroupSelections = async (rawIds: Array<string | number>) => {
    if (!editingRule) return;

    const nextIds = Array.from(
      new Set(rawIds.map((id) => errorGroupIdKey(id)).filter(Boolean)),
    );
    const previousIds = getRuleErrorGroupIds(editingRule);
    const addedIds = nextIds.filter((id) => !previousIds.includes(id));

    // Prefetch details for newly added groups (failure-text seeding).
    const resolvedGroups = [...errorGroups];
    for (const groupId of addedIds) {
      const detailed = await ensureGroupDetails(groupId);
      if (
        detailed &&
        !resolvedGroups.some((g) => errorGroupIdKey(g.id) === groupId)
      ) {
        resolvedGroups.push(detailed);
      }
    }

    await attachGroupsToProvider(addedIds.length > 0 ? addedIds : nextIds);

    const primaryId = nextIds[0] || "";
    const primaryGroup = primaryId
      ? resolvedGroups.find((g) => errorGroupIdKey(g.id) === primaryId) ||
        errorGroups.find((g) => errorGroupIdKey(g.id) === primaryId)
      : null;
    const suggested = primaryGroup
      ? resolveErrorGroupDefaultFailureMessage(primaryGroup)
      : "";
    const previousPrimary = previousIds[0]
      ? errorGroups.find((g) => errorGroupIdKey(g.id) === previousIds[0])
      : null;
    const previousDefault = previousPrimary
      ? resolveErrorGroupDefaultFailureMessage(previousPrimary)
      : "";
    const shouldApplyDefault =
      !!suggested &&
      (!editingRule.failure_text?.trim() ||
        editingRule.failure_text.trim() === previousDefault);

    setEditingRule(
      withRuleErrorGroups(
        {
          ...editingRule,
          failure_text: shouldApplyDefault
            ? suggested
            : editingRule.failure_text,
        },
        nextIds,
        resolvedGroups,
      ),
    );
  };

  const handleErrorGroupCreated = (group: ErrorGroup) => {
    const groupId = errorGroupIdKey(group.id);
    setErrorGroups((prev) => {
      if (prev.some((g) => errorGroupIdKey(g.id) === groupId)) {
        return prev.map((g) =>
          errorGroupIdKey(g.id) === groupId ? group : g,
        );
      }
      return [...prev, group];
    });

    // Append (do not replace) so "Save & add another" accumulates multiple groups.
    setEditingRule((prev) => {
      if (!prev) return prev;
      const nextIds = Array.from(
        new Set([...getRuleErrorGroupIds(prev), groupId]),
      );
      const suggested = resolveErrorGroupDefaultFailureMessage(group);
      const shouldSeedFailure =
        !!suggested &&
        (!prev.failure_text?.trim() || getRuleErrorGroupIds(prev).length === 0);
      return withRuleErrorGroups(
        {
          ...prev,
          failure_text: shouldSeedFailure ? suggested : prev.failure_text,
        },
        nextIds,
        [group, ...errorGroups],
      );
    });

    const providerId = editingRule?.bundle_subscription_track;
    if (providerId && Number.isFinite(Number(providerId))) {
      void errorGroupService
        .attachErrorGroupToProvider(providerId, groupId)
        .catch((err) =>
          console.warn("Failed to attach error group to provider:", err),
        );
    }
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const trackingSourceOptions = useMemo(
    () =>
      trackingSources
        .filter((s) => s.enabled !== false)
        .map((s) => ({
          value: s.id,
          label: s.name?.trim() ? s.name : `Tracking source (${s.type})`,
        })),
    [trackingSources],
  );

  /** Sources not yet assigned to any reward — used when adding a new reward. */
  const unassignedTrackingSourceOptions = useMemo(() => {
    const used = new Set(
      rewards
        .map((r) => r.tracking_source_id)
        .filter(Boolean)
        .map(String),
    );
    return trackingSourceOptions.filter((o) => !used.has(String(o.value)));
  }, [trackingSourceOptions, rewards]);

  const trackingSourceLabel = (sourceId?: string) => {
    if (!sourceId) return "—";
    const match = trackingSources.find((s) => s.id === sourceId);
    return match?.name?.trim() || sourceId;
  };

  const getLinkedTrackingSource = (sourceId?: string) =>
    trackingSources.find((s) => s.id === sourceId);

  const trackingRuleLabel = (
    sourceId: string | undefined,
    ruleId: string | undefined,
  ) => {
    if (!sourceId || !ruleId) return "—";
    const source = getLinkedTrackingSource(sourceId);
    const rule = source?.rules?.find((r) => r.id === ruleId);
    if (!rule) return ruleId;
    return rule.name?.trim() || `Rule (${rule.parameter})`;
  };

  const formatTrackingRuleOptionLabel = (rule: {
    name: string;
    parameter: string;
    condition: string;
    value: string;
    enabled: boolean;
  }) => {
    const base = rule.name?.trim() || rule.parameter;
    const detail = `${rule.parameter} ${rule.condition.replace(/_/g, " ")} "${rule.value}"`;
    return rule.enabled === false ? `${base} (disabled) — ${detail}` : `${base} — ${detail}`;
  };

  /** Tracking rules available for the reward currently being edited. */
  const trackingRuleOptionsForEditing = useMemo(() => {
    const parent = rewards.find((r) => r.id === selectedReward);
    const sourceId =
      parent?.tracking_source_id || editingRule?.tracking_source_id;
    const source = trackingSources.find((s) => s.id === sourceId);
    if (!source) return [];

    const usedByOtherConfigs = new Set(
      (parent?.rules || [])
        .filter(
          (r) =>
            r.enabled !== false &&
            r.id !== editingRule?.id &&
            r.tracking_rule_id,
        )
        .map((r) => String(r.tracking_rule_id)),
    );

    return (source.rules || [])
      .filter((r) => r.enabled !== false)
      .filter(
        (r) =>
          !usedByOtherConfigs.has(r.id) ||
          r.id === editingRule?.tracking_rule_id,
      )
      .map((r) => ({
        value: r.id,
        label: formatTrackingRuleOptionLabel(r),
      }));
  }, [
    trackingSources,
    rewards,
    selectedReward,
    editingRule?.id,
    editingRule?.tracking_source_id,
    editingRule?.tracking_rule_id,
  ]);

  const addRewardForSource = (sourceId: string) => {
    if (!sourceId) {
      setRewardActionError("Select a tracking source to add a reward for.");
      return;
    }

    const source = trackingSources.find((s) => s.id === sourceId);
    if (!source) {
      setRewardActionError("Selected tracking source was not found.");
      return;
    }

    const taken = rewards.some(
      (r) => r.tracking_source_id && r.tracking_source_id === sourceId,
    );
    if (taken) {
      setRewardActionError(
        `"${source.name || "This tracking source"}" already has a reward. Each tracking source can only have one.`,
      );
      return;
    }

    setRewardActionError("");
    const label = source.name?.trim() || `Tracking source (${source.type})`;
    const newReward: OfferReward = {
      id: generateId(),
      name: label,
      type: "default",
      tracking_source_id: source.id,
      rules: [],
    };

    onRewardsChange([...rewards, newReward]);
    setSelectedReward(newReward.id);
    setSourceToAddReward("");
  };

  const addReward = () => {
    if (unassignedTrackingSourceOptions.length === 0) {
      setRewardActionError(
        trackingSources.length === 0
          ? usesDefaultReward
            ? "Tracking is optional for immediate-reward offers. The default reward is already available."
            : "Add at least one enabled tracking source in the previous step first."
          : "Every tracking source already has a reward. Add another tracking source on the Tracking step.",
      );
      return;
    }

    if (sourceToAddReward) {
      addRewardForSource(sourceToAddReward);
      return;
    }

    // Single unused source → bind immediately; otherwise require explicit pick
    if (unassignedTrackingSourceOptions.length === 1) {
      addRewardForSource(String(unassignedTrackingSourceOptions[0].value));
      return;
    }

    setRewardActionError(
      "Select which tracking source this reward is for, then click Add Reward.",
    );
  };

  const removeReward = (id: string) => {
    const target = rewards.find((r) => r.id === id);
    if (target?.is_default) {
      setRewardActionError(
        "The default reward cannot be removed for immediate-reward offers.",
      );
      return;
    }

    const updatedRewards = rewards.filter((r) => r.id !== id);
    onRewardsChange(updatedRewards);

    if (selectedReward === id) {
      setSelectedReward(
        updatedRewards.length > 0 ? updatedRewards[0].id : null
      );
    }
  };

  const updateReward = (id: string, updates: Partial<OfferReward>) => {
    const updatedRewards = rewards.map((r) =>
      r.id === id ? { ...r, ...updates } : r
    );
    onRewardsChange(updatedRewards);
  };

  const addRule = () => {
    const parent = rewards.find((r) => r.id === selectedReward);
    const inheritedSourceId = parent?.tracking_source_id || "";
    const bindTrackingRule = rewardConfigShouldBindTrackingRule(
      inheritedSourceId,
      requiresRewardTrackingMapping,
      parent?.is_default === true,
    );

    if (bindTrackingRule && !inheritedSourceId) {
      setRewardActionError(
        "Select a tracking source for this reward before adding configurations.",
      );
      return;
    }

    const linked = getLinkedTrackingSource(inheritedSourceId);
    const enabledTrackingRules = (linked?.rules || []).filter(
      (r) => r.enabled !== false,
    );
    if (bindTrackingRule && enabledTrackingRules.length === 0) {
      setRewardActionError(
        "This tracking source has no enabled tracking rules. Add rules on the Tracking step first.",
      );
      return;
    }

    const usedRuleIds = new Set(
      (parent?.rules || [])
        .filter((r) => r.enabled !== false && r.tracking_rule_id)
        .map((r) => String(r.tracking_rule_id)),
    );
    const defaultTrackingRule = enabledTrackingRules.find(
      (r) => !usedRuleIds.has(r.id),
    );

    if (bindTrackingRule && !defaultTrackingRule) {
      setRewardActionError(
        "Every enabled tracking rule already has a reward configuration. Disable one, or add another tracking rule first.",
      );
      return;
    }

    setRewardActionError("");
    const newRule: OfferRewardRule = parent?.is_default
      ? {
          ...createDefaultImmediateConfiguration(generateId()),
          priority: (parent.rules?.length || 0) + 1,
        }
      : {
          id: generateId(),
          name: defaultTrackingRule?.name?.trim()
            ? `${defaultTrackingRule.name} reward`
            : "New Rule",
          bundle_subscription_track: "",
          reward_configuration_id: "",
          reward_configuration_name: "",
          tracking_source_id: inheritedSourceId,
          tracking_rule_id: defaultTrackingRule?.id || "",
          priority: 1,
          condition: "",
          value: "",
          reward_type: "bundle",
          reward_value: "",
          fulfillment_response: "success",
          success_text: "",
          default_failure: "failed",
          error_group_ids: [],
          error_group_id: "",
          error_group: "",
          failure_text: "",
          enabled: true,
        };

    setEditingRule(newRule);
    setIsNewRule(true);
    setRuleModalError("");
    setRuleParametersValid(true);
    setShowRuleModal(true);
  };

  const {
    configurations: providerConfigurations,
    templateOptions,
    defaultTemplate,
    loading: loadingConfigurations,
    seedWarning: templateSeedWarning,
  } = useRewardProviderConfigurations({
    providerId: selectedProviderId,
    rewardType: editingRule?.reward_type ?? null,
    enabled: showRuleModal && !!selectedProviderId,
  });

  const configurationOptions = useMemo(() => {
    return templateOptions.map((o) => ({
      value: String(o.value),
      label: o.label,
    }));
  }, [templateOptions]);

  /**
   * Resolve the template id that should be selected for the current provider.
   * Keeps the dropdown and parameters panel aligned when switching providers
   * (empty / stale / virtual ids → provider default).
   */
  const resolvedTemplateId = useMemo(() => {
    if (!selectedProviderId || loadingConfigurations) return "";
    if (configurationOptions.length === 0) return "";

    const current = String(editingRule?.reward_configuration_id ?? "").trim();
    const optionValues = new Set(configurationOptions.map((o) => o.value));
    const defaultId = defaultTemplate
      ? String(defaultTemplate.id)
      : configurationOptions.find((o) =>
          providerConfigurations.some(
            (c) =>
              String(c.id) === o.value && isDefaultRewardTemplate(c),
          ),
        )?.value || configurationOptions[0]?.value;

    if (current && optionValues.has(current)) {
      return current;
    }

    // Virtual / stale id after provider switch or dedupe — use default.
    if (defaultId && optionValues.has(defaultId)) {
      return defaultId;
    }

    return configurationOptions[0]?.value ?? "";
  }, [
    selectedProviderId,
    loadingConfigurations,
    configurationOptions,
    editingRule?.reward_configuration_id,
    defaultTemplate,
    providerConfigurations,
  ]);

  const selectedConfigurationId = useMemo(() => {
    if (!resolvedTemplateId) return null;
    const n = Number(resolvedTemplateId);
    return Number.isFinite(n) ? n : null;
  }, [resolvedTemplateId]);

  useEffect(() => {
    if (!showRuleModal || !editingRule || loadingRewardProviders) return;
    if (editingRule.bundle_subscription_track) return;
    if (!defaultProviderId) return;
    setEditingRule((prev) =>
      prev
        ? {
            ...prev,
            bundle_subscription_track: defaultProviderId,
            reward_configuration_id: "",
            reward_configuration_name: "",
            auth_config: undefined,
            payload_config: undefined,
          }
        : prev,
    );
  }, [
    showRuleModal,
    editingRule,
    loadingRewardProviders,
    defaultProviderId,
  ]);

  // Keep form state in sync with the resolved template for the selected provider.
  useEffect(() => {
    if (!showRuleModal) return;
    if (!selectedProviderId || loadingConfigurations) return;
    if (!resolvedTemplateId) return;

    const matched = providerConfigurations.find(
      (c) => String(c.id) === resolvedTemplateId,
    );

    setEditingRule((prev) => {
      if (!prev) return prev;
      if (String(prev.bundle_subscription_track) !== String(selectedProviderId)) {
        return prev;
      }
      if (String(prev.reward_configuration_id ?? "") === resolvedTemplateId) {
        // Still refresh name if it was missing (avoids blank / Template #id labels).
        if (!prev.reward_configuration_name?.trim() && matched?.name) {
          return { ...prev, reward_configuration_name: matched.name };
        }
        return prev;
      }

      const previousId = String(prev.reward_configuration_id ?? "");
      const switchingTemplate =
        !previousId ||
        previousId !== resolvedTemplateId ||
        isVirtualDefaultTemplateId(previousId);

      return {
        ...prev,
        reward_configuration_id: resolvedTemplateId,
        reward_configuration_name:
          matched?.name ||
          defaultTemplate?.name ||
          prev.reward_configuration_name ||
          "",
        // Reload provider defaults when template/provider mapping changes.
        auth_config: switchingTemplate ? undefined : prev.auth_config,
        payload_config: switchingTemplate ? undefined : prev.payload_config,
      };
    });
  }, [
    showRuleModal,
    selectedProviderId,
    loadingConfigurations,
    resolvedTemplateId,
    providerConfigurations,
    defaultTemplate,
  ]);

  const [isSavingRule, setIsSavingRule] = useState(false);

  const saveRule = async (rewardId: string, rule: OfferRewardRule) => {
    const parent = rewards.find((r) => r.id === rewardId);
    const isDefaultReward = parent?.is_default === true;
    const inheritedSourceId = isDefaultReward
      ? ""
      : parent?.tracking_source_id?.trim() ||
        rule.tracking_source_id?.trim() ||
        "";
    const bindTrackingRule = rewardConfigShouldBindTrackingRule(
      inheritedSourceId,
      requiresRewardTrackingMapping,
      isDefaultReward,
    );

    const ruleToSave: OfferRewardRule = {
      ...rule,
      tracking_source_id: isDefaultReward
        ? undefined
        : inheritedSourceId || undefined,
      tracking_rule_id: isDefaultReward
        ? undefined
        : rule.tracking_rule_id?.trim() || undefined,
    };

    if (!ruleToSave.bundle_subscription_track?.trim()) {
      setRuleModalError("Select a reward provider.");
      return;
    }
    if (!ruleToSave.reward_configuration_id?.trim()) {
      setRuleModalError("Select a reward template for this provider.");
      return;
    }
    if (ruleToSave.reward_configuration_id && !ruleParametersValid) {
      setRuleModalError("Complete all required template parameters.");
      return;
    }
    if (bindTrackingRule && ruleToSave.enabled && !inheritedSourceId) {
      setRuleModalError(
        "Select a tracking source for this reward before saving configurations.",
      );
      return;
    }
    if (bindTrackingRule && ruleToSave.enabled && !ruleToSave.tracking_rule_id) {
      setRuleModalError(
        "Select the tracking rule this reward configuration should fulfil.",
      );
      return;
    }

    if (bindTrackingRule && ruleToSave.enabled && ruleToSave.tracking_rule_id) {
      const linked = getLinkedTrackingSource(inheritedSourceId);
      const exists = linked?.rules?.some(
        (r) => r.id === ruleToSave.tracking_rule_id && r.enabled !== false,
      );
      if (!exists) {
        setRuleModalError(
          "Selected tracking rule is missing or disabled on this tracking source.",
        );
        return;
      }

      const duplicate = (parent?.rules || []).some(
        (r) =>
          r.id !== ruleToSave.id &&
          r.enabled !== false &&
          r.tracking_rule_id === ruleToSave.tracking_rule_id,
      );
      if (duplicate) {
        setRuleModalError(
          "That tracking rule already has an enabled reward configuration.",
        );
        return;
      }
    }

    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward) return;

    setIsSavingRule(true);
    setRuleModalError("");
    try {
      // Persist virtual provider-default templates before storing the offer rule.
      if (isVirtualDefaultTemplateId(ruleToSave.reward_configuration_id)) {
        const providerId = Number(ruleToSave.bundle_subscription_track);
        const persisted = await materializeRewardTemplateId(
          ruleToSave.reward_configuration_id,
          providerId,
        );
        ruleToSave = {
          ...ruleToSave,
          reward_configuration_id: String(persisted.id),
          reward_configuration_name: persisted.name,
        };
      }

      // Normalize multi error-group selection + ensure provider attachments.
      const selectedGroupIds = getRuleErrorGroupIds(ruleToSave);
      ruleToSave = withRuleErrorGroups(
        ruleToSave,
        selectedGroupIds,
        errorGroups,
      );
      if (selectedGroupIds.length > 0) {
        const providerId = ruleToSave.bundle_subscription_track;
        if (providerId && Number.isFinite(Number(providerId))) {
          await Promise.allSettled(
            selectedGroupIds.map((groupId) =>
              errorGroupService.attachErrorGroupToProvider(
                providerId,
                groupId,
              ),
            ),
          );
        }
      }

      const existingRuleIndex = reward.rules.findIndex(
        (r) => r.id === ruleToSave.id,
      );
      let updatedRules;

      if (existingRuleIndex >= 0) {
        updatedRules = [...reward.rules];
        updatedRules[existingRuleIndex] = ruleToSave;
      } else {
        updatedRules = [...reward.rules, ruleToSave];
      }

      updateReward(rewardId, { rules: updatedRules });
      setShowRuleModal(false);
      setEditingRule(null);
      setIsNewRule(false);
      setRuleModalError("");
    } catch (err) {
      setRuleModalError(
        err instanceof Error
          ? err.message
          : "Failed to save reward template for this provider.",
      );
    } finally {
      setIsSavingRule(false);
    }
  };

  const removeRule = (rewardId: string, ruleId: string) => {
    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward) return;

    const updatedRules = reward.rules.filter((r) => r.id !== ruleId);
    updateReward(rewardId, { rules: updatedRules });
  };

  const selectedRewardData = rewards.find((r) => r.id === selectedReward);
  const selectedIsDefault = selectedRewardData?.is_default === true;
  const offerTypeLabel = offerTypeName?.trim() || "immediate reward";
  const addConfigButtonLabel = selectedIsDefault
    ? formatImmediateAddConfigButtonLabel(offerTypeName)
    : "Add Reward Configuration";
  /** Create and edit share the same binding UI whenever a source is linked. */
  const showTrackingRuleBinding = rewardConfigShouldBindTrackingRule(
    selectedRewardData?.tracking_source_id || editingRule?.tracking_source_id,
    requiresRewardTrackingMapping,
    selectedIsDefault,
  );

  // Ensure selectedRewardData exists before rendering - reset if it doesn't match
  if (selectedReward && !selectedRewardData && rewards.length > 0) {
    setSelectedReward(rewards[0].id);
  }

  return (
    <div className="space-y-6">
      {rewards.length === 0 ? (
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-8 text-center`}>
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-gray-400" />
          </div>
          {usesDefaultReward ? (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Preparing default reward
              </h3>
              <p className="text-gray-500 text-sm mb-2 max-w-md mx-auto">
                {offerTypeLabel} offers always include a default reward that does
                not depend on tracking.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Rewards Added
              </h3>
              <p className="text-gray-500 text-sm mb-2 max-w-md mx-auto">
                
              </p>
              <div className="max-w-sm mx-auto space-y-3 mt-6 text-left">
                <HeadlessSelect
                  label="Add reward for tracking source"
                  options={unassignedTrackingSourceOptions}
                  value={sourceToAddReward}
                  onChange={(value) => {
                    setSourceToAddReward(String(value));
                    setRewardActionError("");
                  }}
                  disabled={unassignedTrackingSourceOptions.length === 0}
                  placeholder={
                    unassignedTrackingSourceOptions.length === 0
                      ? "No unused tracking sources"
                      : "Select tracking source..."
                  }
                />
                <button
                  type="button"
                  onClick={addReward}
                  className={`inline-flex items-center justify-center w-full px-4 py-2 text-sm text-white ${tw.rounded} font-medium`}
                  style={{ backgroundColor: color.primary.action }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Reward
                </button>
              </div>
            </>
          )}
          {rewardActionError ? (
            <p className="mt-3 text-sm text-red-600">{rewardActionError}</p>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rewards List */}
          <div className="lg:col-span-1">
            <div className={`bg-white ${tw.rounded} border border-gray-200 p-4`}>
              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-gray-900">Rewards</h3>
                  {usesDefaultReward ? (
                    <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-gray-100 text-gray-700">
                      {offerTypeLabel}
                    </span>
                  ) : null}
                </div>
                {usesDefaultReward ? (
                  <p className={`text-xs ${tw.textSecondary}`}>
                    {offerTypeLabel} always includes a default reward. Tracking
                    is optional — configure the grant below.
                  </p>
                ) : (
                  <>
                    <HeadlessSelect
                      label="Add reward for"
                      options={unassignedTrackingSourceOptions}
                      value={sourceToAddReward}
                      onChange={(value) => {
                        setSourceToAddReward(String(value));
                        setRewardActionError("");
                      }}
                      disabled={unassignedTrackingSourceOptions.length === 0}
                      placeholder={
                        unassignedTrackingSourceOptions.length === 0
                          ? "All sources have rewards"
                          : "Select tracking source..."
                      }
                    />
                    <button
                      type="button"
                      onClick={addReward}
                      className={`inline-flex items-center justify-center w-full px-3 py-1.5 text-sm text-white ${tw.rounded} font-medium`}
                      style={{ backgroundColor: color.primary.action }}
                      disabled={unassignedTrackingSourceOptions.length === 0}
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Add Reward
                    </button>
                  </>
                )}
                {usesDefaultReward && trackingSources.length > 0 ? (
                  <details className="pt-1">
                    <summary
                      className={`text-xs cursor-pointer ${tw.textSecondary}`}
                    >
                      Optional: add tracking-bound reward
                    </summary>
                    <div className="mt-2 space-y-2">
                      <HeadlessSelect
                        label="Add reward for"
                        options={unassignedTrackingSourceOptions}
                        value={sourceToAddReward}
                        onChange={(value) => {
                          setSourceToAddReward(String(value));
                          setRewardActionError("");
                        }}
                        disabled={unassignedTrackingSourceOptions.length === 0}
                        placeholder={
                          unassignedTrackingSourceOptions.length === 0
                            ? "All sources have rewards"
                            : "Select tracking source..."
                        }
                      />
                      <button
                        type="button"
                        onClick={addReward}
                        className={`inline-flex items-center justify-center w-full px-3 py-1.5 text-sm border border-gray-300 text-gray-700 ${tw.rounded} font-medium`}
                        disabled={unassignedTrackingSourceOptions.length === 0}
                      >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Add tracking reward
                      </button>
                    </div>
                  </details>
                ) : null}
              </div>
              {rewardActionError ? (
                <p className="mb-3 text-xs text-red-600">{rewardActionError}</p>
              ) : !usesDefaultReward ? (
                <p className={`mb-3 text-xs ${tw.textSecondary}`}>
                  One reward per tracking source. 
                </p>
              ) : null}

              <div className="space-y-2">
                {rewards.map((reward) => {
                  const linked = getLinkedTrackingSource(
                    reward.tracking_source_id,
                  );
                  const trackingRuleCount = linked?.rules?.length ?? 0;
                  const configCount = reward.rules.length;
                  const isDefault = reward.is_default === true;
                  return (
                    <div
                      key={reward.id}
                      onClick={() => setSelectedReward(reward.id)}
                      className={`p-3 ${tw.rounded} border cursor-pointer transition-all ${
                        selectedReward === reward.id
                          ? "border-gray-300 bg-gray-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div
                            className={`w-8 h-8 ${tw.rounded} flex items-center justify-center bg-gray-100 shrink-0`}
                          >
                            <Gift className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate flex items-center gap-2">
                              <span className="truncate">
                                {isDefault
                                  ? reward.name || IMMEDIATE_DEFAULT_REWARD_NAME
                                  : trackingSourceLabel(
                                        reward.tracking_source_id,
                                      ) !== "—"
                                    ? trackingSourceLabel(
                                        reward.tracking_source_id,
                                      )
                                    : reward.name || "Unassigned reward"}
                              </span>
                              {isDefault ? (
                                <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded bg-emerald-50 text-emerald-800 border border-emerald-100">
                                  Default
                                </span>
                              ) : null}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {isDefault
                                ? "No tracking required"
                                : reward.tracking_source_id
                                  ? `${trackingRuleCount} tracking rule${
                                      trackingRuleCount === 1 ? "" : "s"
                                    }`
                                  : "Select a tracking source"}
                            </div>
                          </div>
                        </div>
                        {!isDefault ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeReward(reward.id);
                            }}
                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : null}
                      </div>
                      <div className="mt-2 text-xs text-gray-600">
                        {configCount} reward configuration
                        {configCount === 1 ? "" : "s"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reward Configuration */}
          <div className="lg:col-span-2">
            {selectedRewardData ? (
              <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
                <div className="space-y-6">
                  {(() => {
                    if (selectedIsDefault) {
                      return (
                        <div className="space-y-3">
                          <Input
                            label="Reward"
                            type="text"
                            value={
                              selectedRewardData.name ||
                              IMMEDIATE_DEFAULT_REWARD_NAME
                            }
                            onChange={() => {
                              /* system default — not renamed here */
                            }}
                            disabled
                          />
                          <div
                            className={`px-3 py-2 border border-gray-200 ${tw.rounded} bg-gray-50 text-left`}
                          >
                            <p className={`text-xs ${tw.textSecondary}`}>
                              Default {offerTypeLabel} reward — granted without
                              a tracking source. Use &quot;
                              {addConfigButtonLabel}&quot; to define what is
                              granted.
                            </p>
                          </div>
                          {rewardActionError ? (
                            <p className="text-xs text-red-600">
                              {rewardActionError}
                            </p>
                          ) : null}
                        </div>
                      );
                    }

                    const linked = getLinkedTrackingSource(
                      selectedRewardData.tracking_source_id,
                    );
                    return (
                      <div className="space-y-3">
                        <Input
                          label="Tracking Source"
                          type="text"
                          value={trackingSourceLabel(
                            selectedRewardData.tracking_source_id,
                          )}
                          onChange={() => {
                            /* bound when reward is created */
                          }}
                          disabled
                        />
                        {!linked ? (
                          <p className={`text-xs text-amber-800`}>
                            This reward is not linked to a tracking source.
                          </p>
                        ) : null}
                        {rewardActionError ? (
                          <p className="text-xs text-red-600">
                            {rewardActionError}
                          </p>
                        ) : null}
                      </div>
                    );
                  })()}

                  {/* Rules Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4 gap-3">
                      <h4 className="font-medium text-gray-900">
                        Reward Configurations
                      </h4>
                      {selectedRewardData.rules.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => addRule()}
                          className={`inline-flex items-center px-3 py-1 text-sm text-white ${tw.rounded} shrink-0`}
                          style={{ backgroundColor: color.primary.action }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          {addConfigButtonLabel}
                        </button>
                      ) : null}
                    </div>

                    {selectedRewardData.rules.length === 0 ? (
                      <div className={`text-center py-8 border-2 border-dashed border-gray-200 ${tw.rounded}`}>
                        <p className="text-gray-500 text-sm mb-1">
                          No reward configuration added yet
                        </p>
                        
                        <button
                          type="button"
                          onClick={() => addRule()}
                          className={`inline-flex items-center px-4 py-2 text-white ${tw.rounded}`}
                          style={{ backgroundColor: color.primary.action }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {addConfigButtonLabel}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedRewardData.rules.map((rule) => (
                          <div
                            key={rule.id}
                            className={`p-4 border border-gray-200 ${tw.rounded}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-3">
                                <span className="font-medium text-sm text-gray-900">
                                  {rule.name}
                                </span>
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                  Priority: {rule.priority}
                                </span>
                                <span
                                  className={`px-2 py-1 text-xs rounded ${
                                    rule.enabled
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {rule.enabled ? "Enabled" : "Disabled"}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingRule({
                                      ...rule,
                                      tracking_source_id:
                                        selectedRewardData.tracking_source_id ||
                                        rule.tracking_source_id,
                                      tracking_rule_id:
                                        rule.tracking_rule_id || "",
                                      bundle_subscription_track: resolveProvider(
                                        rule.bundle_subscription_track,
                                      ),
                                    });
                                    setIsNewRule(false);
                                    setRuleModalError("");
                                    setRuleParametersValid(true);
                                    setShowRuleModal(true);
                                  }}
                                  className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    removeRule(selectedRewardData.id, rule.id)
                                  }
                                  className="p-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>
                                Provider:{" "}
                                {getProvider(rule.bundle_subscription_track)
                                  ?.name ||
                                  rule.bundle_subscription_track ||
                                  "—"}
                              </div>
                              <div>
                                Configuration:{" "}
                                {rule.reward_configuration_name ||
                                  (rule.reward_configuration_id
                                    ? `#${rule.reward_configuration_id}`
                                    : "—")}
                              </div>
                              <div>
                                Type:{" "}
                                {RULE_REWARD_TYPE_LABELS[
                                  rule.reward_type as RuleRewardType
                                ] || rule.reward_type}
                              </div>
                              {showTrackingRuleBinding ? (
                                <>
                                  <div>
                                    Tracking source:{" "}
                                    {trackingSourceLabel(
                                      selectedRewardData.tracking_source_id ||
                                        rule.tracking_source_id,
                                    )}
                                  </div>
                                  <div>
                                    Tracking rule:{" "}
                                    {trackingRuleLabel(
                                      selectedRewardData.tracking_source_id ||
                                        rule.tracking_source_id,
                                      rule.tracking_rule_id,
                                    )}
                                  </div>
                                </>
                              ) : null}
                              <div>
                                Success:{" "}
                                {rule.success_text || "Default success message"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`bg-gray-50 ${tw.rounded} border border-gray-200 p-8 text-center`}>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Reward Selected
                </h3>
                <p className="text-gray-500 text-sm">
                  Select a reward from the list above to start configuring.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rule Modal */}
      {showRuleModal &&
        editingRule &&
        createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            style={{ zIndex: zIndex.modal - 1 }}
          >
            <div className={`bg-white ${tw.rounded} p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isNewRule
                    ? selectedIsDefault
                      ? IMMEDIATE_ADD_CONFIG_BUTTON_LABEL
                      : "Add Reward Configuration"
                    : "Edit Reward Configuration"}
                </h3>
                <button
                  onClick={() => {
                    setShowRuleModal(false);
                    setEditingRule(null);
                    setIsNewRule(false);
                    setRuleModalError("");
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Configuration Name"
                    type="text"
                    value={editingRule.name}
                    onChange={(value) =>
                      setEditingRule({ ...editingRule, name: String(value) })
                    }
                    placeholder="Configuration name"
                  />

                  <Input
                    label="Priority"
                    type="number"
                    value={String(editingRule.priority)}
                    onChange={(value) =>
                      setEditingRule({
                        ...editingRule,
                        priority: parseInt(String(value)) || 1,
                      })
                    }
                    placeholder="1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <HeadlessSelect
                    label="Reward Type"
                    options={Object.entries(RULE_REWARD_TYPE_LABELS).map(
                      ([value, label]) => ({ value, label }),
                    )}
                    value={editingRule.reward_type}
                    onChange={(value) =>
                      setEditingRule({
                        ...editingRule,
                        reward_type: value as RuleRewardType,
                        bundle_subscription_track: "",
                        reward_configuration_id: "",
                        reward_configuration_name: "",
                        reward_value: "",
                      })
                    }
                    placeholder="Select reward type"
                    zIndex={zIndex.popover}
                  />

                  {showTrackingRuleBinding ? (
                    <Input
                      label="Offer tracking source"
                      type="text"
                      value={trackingSourceLabel(
                        selectedRewardData?.tracking_source_id ||
                          editingRule.tracking_source_id,
                      )}
                      onChange={() => {
                        /* read-only — bound at reward level */
                      }}
                      disabled
                    />
                  ) : null}
                </div>

                {showTrackingRuleBinding ? (
                  <div>
                    <HeadlessSelect
                      label="Tracking rule"
                      options={trackingRuleOptionsForEditing}
                      value={editingRule.tracking_rule_id ?? ""}
                      onChange={(value) => {
                        const sourceId =
                          selectedRewardData?.tracking_source_id ||
                          editingRule.tracking_source_id;
                        const source = getLinkedTrackingSource(sourceId);
                        const selected = source?.rules?.find(
                          (r) => r.id === value,
                        );
                        const nextName =
                          editingRule.name === "New Rule" ||
                          !editingRule.name?.trim()
                            ? selected?.name?.trim()
                              ? `${selected.name} reward`
                              : editingRule.name
                            : editingRule.name;
                        setEditingRule({
                          ...editingRule,
                          tracking_rule_id: value as string,
                          name: nextName,
                        });
                      }}
                      placeholder={
                        trackingRuleOptionsForEditing.length === 0
                          ? "No available tracking rules"
                          : "Select tracking rule to fulfil"
                      }
                      disabled={trackingRuleOptionsForEditing.length === 0}
                      zIndex={zIndex.popover}
                    />
                    {trackingRuleOptionsForEditing.length === 0 ? (
                      <p className="mt-1 text-xs text-amber-800">
                        No unused enabled tracking rules on this source. Add
                        rules on the Tracking step, or disable an existing
                        configuration that already uses one.
                      </p>
                    ) : (
                      <p className={`mt-1 text-xs ${tw.textSecondary}`}>
                        Fulfilment runs when this specific tracking rule matches.
                        One enabled configuration per rule.
                      </p>
                    )}
                  </div>
                ) : null}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <HeadlessSelect
                      label="Reward Provider"
                      options={providerOptions}
                      value={editingRule.bundle_subscription_track}
                      onChange={(value) => {
                        const nextProviderId = String(value);
                        if (
                          nextProviderId ===
                          String(editingRule.bundle_subscription_track)
                        ) {
                          return;
                        }
                        // Clear template immediately so parameters reload for the new provider.
                        setEditingRule({
                          ...editingRule,
                          bundle_subscription_track: nextProviderId,
                          reward_configuration_id: "",
                          reward_configuration_name: "",
                          auth_config: undefined,
                          payload_config: undefined,
                        });
                        setRuleParametersValid(true);
                      }}
                      placeholder={
                        loadingRewardProviders
                          ? "Loading providers..."
                          : providerOptions.length === 0
                            ? "No providers for this reward type"
                            : "Select reward provider"
                      }
                      disabled={
                        loadingRewardProviders || providerOptions.length === 0
                      }
                      zIndex={zIndex.popover}
                    />
                    {providerLoadError ? (
                      <p className="mt-1 text-xs text-red-600">
                        {providerLoadError}
                      </p>
                    ) : !loadingRewardProviders &&
                      providerOptions.length === 0 ? (
                      <p className={`mt-1 text-xs ${tw.textSecondary}`}>
                        No active providers for &quot;{editingRule.reward_type}
                        &quot;. Add one under Configurations → Reward Providers.
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <HeadlessSelect
                      label="Reward Template"
                      options={configurationOptions}
                      value={resolvedTemplateId}
                      onChange={(value) => {
                        const nextId = String(value);
                        const config = providerConfigurations.find(
                          (c) => String(c.id) === nextId,
                        );
                        setEditingRule({
                          ...editingRule,
                          reward_configuration_id: nextId,
                          reward_configuration_name: config?.name || "",
                          auth_config: undefined,
                          payload_config: undefined,
                        });
                        setRuleParametersValid(true);
                      }}
                      placeholder={
                        !editingRule.bundle_subscription_track
                          ? "Select a provider first"
                          : loadingConfigurations
                            ? "Loading templates..."
                            : configurationOptions.length === 0
                              ? "No templates for this provider"
                              : "Select reward template"
                      }
                      disabled={
                        !editingRule.bundle_subscription_track ||
                        loadingConfigurations ||
                        configurationOptions.length === 0
                      }
                      zIndex={zIndex.popover}
                    />
                    {editingRule.bundle_subscription_track &&
                    !loadingConfigurations &&
                    configurationOptions.length === 0 ? (
                      <p className="mt-1 text-xs text-red-600">
                        Could not load or build a default template for this
                        provider. Check that the provider exists and you can
                        access Configurations → Reward Configurations.
                      </p>
                    ) : editingRule.bundle_subscription_track &&
                      !loadingConfigurations &&
                      configurationOptions.length > 0 ? (
                      <p className={`mt-1 text-xs ${tw.textSecondary}`}>
                        Default template uses all provider fields with their
                        default values
                        {selectedConfigurationId != null &&
                        isVirtualDefaultTemplateId(selectedConfigurationId)
                          ? " (shown from the provider until saved)."
                          : "."}{" "}
                        Custom templates also appear here when configured.
                      </p>
                    ) : null}
                    {templateSeedWarning ? (
                      <p className="mt-1 text-xs text-amber-800">
                        {templateSeedWarning}
                      </p>
                    ) : null}
                  </div>
                </div>

                <RewardConfigurationParametersEditor
                  key={selectedConfigurationId ?? "none"}
                  configurationId={selectedConfigurationId}
                  value={{
                    auth_config: editingRule.auth_config,
                    payload_config: editingRule.payload_config,
                  }}
                  onChange={({ auth_config, payload_config }) =>
                    setEditingRule((prev) =>
                      prev
                        ? { ...prev, auth_config, payload_config }
                        : prev,
                    )
                  }
                  onValidationChange={setRuleParametersValid}
                />

                {ruleModalError ? (
                  <p className="text-sm text-red-600">{ruleModalError}</p>
                ) : null}

                <div>
                  <label className={`block text-sm font-medium ${tw.textPrimary} mb-1.5`}>
                    Error Groups
                  </label>
                  <div className="flex">
                    <div className="flex-1 min-w-0">
                      <HeadlessMultiSelect
                        options={errorGroupOptions}
                        value={selectedErrorGroupIds}
                        onChange={(values) =>
                          void applyErrorGroupSelections(values)
                        }
                        placeholder={
                          loadingErrorGroups
                            ? "Loading error groups..."
                            : errorGroupOptions.length === 0
                              ? "No error groups configured"
                              : "Select one or more error groups"
                        }
                        disabled={
                          loadingErrorGroups && errorGroupOptions.length === 0
                        }
                        searchable
                        maxDisplayed={2}
                        className="[&>div>button]:rounded-r-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowErrorGroupModal(true)}
                      className="px-3 py-2 text-white rounded-r-md flex items-center justify-center text-sm border-l-0 self-start"
                      style={{
                        backgroundColor: color.primary.action,
                        borderColor: color.primary.action,
                        border: "1px solid",
                        minHeight: "42px",
                      }}
                      title="Configure new error group"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {errorGroupsError ? (
                    <p className="mt-1 text-xs text-red-600">{errorGroupsError}</p>
                  ) : !selectedProviderId ? (
                    <p className={`mt-1 text-xs ${tw.textSecondary}`}>
                      Select a reward provider first so selected groups can be
                      attached for fulfilment mapping.
                    </p>
                  ) : (
                    <p className={`mt-1 text-xs ${tw.textSecondary}`}>
                      Select multiple groups to map different provider error
                      codes. Each selected group is attached to the reward
                      provider. Use + to create another group.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Default success message"
                    type="text"
                    value={editingRule.success_text}
                    onChange={(value) =>
                      setEditingRule({
                        ...editingRule,
                        success_text: String(value),
                      })
                    }
                    placeholder="Enter default success message..."
                  />

                  <Input
                    label="Default failure message"
                    type="text"
                    value={editingRule.failure_text}
                    onChange={(value) =>
                      setEditingRule({
                        ...editingRule,
                        failure_text: String(value),
                      })
                    }
                    placeholder="Enter default failure message..."
                  />
                </div>

                <div
                  className="flex items-center cursor-pointer"
                  onClick={() =>
                    setEditingRule({
                      ...editingRule,
                      enabled: !editingRule.enabled,
                    })
                  }
                >
                  <Checkbox
                    id="rule-enabled"
                    checked={editingRule.enabled}
                    onChange={() =>
                      setEditingRule({
                        ...editingRule,
                        enabled: !editingRule.enabled,
                      })
                    }
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable this rule</span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowRuleModal(false);
                    setEditingRule(null);
                    setIsNewRule(false);
                    setRuleModalError("");
                  }}
                  className={`px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded}`}
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    selectedRewardData &&
                    void saveRule(selectedRewardData.id, editingRule)
                  }
                  disabled={isSavingRule}
                  className={`px-4 py-2 text-white ${tw.rounded} disabled:opacity-60`}
                  style={{ backgroundColor: color.primary.action }}
                >
                  {isSavingRule
                    ? "Saving..."
                    : "Save Reward Configuration"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <ConfigureErrorGroupModal
        isOpen={showErrorGroupModal}
        onClose={() => setShowErrorGroupModal(false)}
        onSaved={handleErrorGroupCreated}
        providerId={
          selectedProviderId && Number.isFinite(Number(selectedProviderId))
            ? Number(selectedProviderId)
            : null
        }
      />
    </div>
  );
}
