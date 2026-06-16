import { useState, useEffect, useRef } from "react";
import Input from '../../../shared/components/ui/Input';
import Textarea from '../../../shared/components/ui/Textarea';
import {
  AlertCircle,
  Package,
  Coins,
  Percent,
  DollarSign,
  ChevronDown,
  Send,
  CheckCircle,
  XCircle,
  Mail,
  MessageSquare,
  Phone,
  Bell,
  Loader,
} from "lucide-react";
import { communicationChannelService } from "../../../shared/services/communicationChannelService";
import { smsRouteService } from "../../routes/services/smsRouteService";
import { SMSRoute } from "../../routes/types/smsRoute";
import { emailRouteService } from "../../routes/services/emailRouteService";
import { EmailRoute } from "../../routes/types/emailRoute";
import { color, tw, zIndex, components, getButtonStyles, button } from "../../../shared/utils/utils";
import { ManualRewardData } from "../pages/CreateManualRewardPage";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useConfigurationData } from "../../../shared/services/configurationDataService";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { communicationPolicyService } from "../../campaigns/services/communicationPolicyService";
import type { CommunicationPolicyConfiguration } from "../../campaigns/types/communicationPolicyConfig";
import { useClickOutside } from "../../../shared/hooks/useClickOutside";
import {
  isValidCountryCodePhone,
  isValidEmail,
} from "../../../shared/utils/validation";
import { getSettingsCommunicationChannel } from "../../../shared/utils/settingsHelper";
import Checkbox from "../../../shared/components/ui/Checkbox";
import { SeedListRecipient } from "../../../shared/services/seedListService";
import SeedListRecipientsModal from "../../../shared/components/SeedListRecipientsModal";

interface DefineRewardStepProps {
  data: ManualRewardData;
  onUpdate: (data: Partial<ManualRewardData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

type RewardType = "bundle" | "points" | "discount" | "cashback";
type Channel = "EMAIL" | "SMS" | "WHATSAPP" | "PUSH";

interface RewardSeedTestResult {
  contact: string;
  status: "success" | "failed";
  message: string;
}

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
    (data.rewardType as RewardType) || "bundle",
  );
  const [rewardValue, setRewardValue] = useState(data.rewardValue || "");
  const [bundleTrack, setBundleTrack] = useState(
    data.bundleTrack || BUNDLE_TRACKS[0],
  );
  const [description, setDescription] = useState(data.description || "");
  const [error, setError] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [seedTestError, setSeedTestError] = useState("");
  const [selectedSeedContactIds, setSelectedSeedContactIds] = useState<Set<number>>(
    new Set(),
  );
  const [seedTestResults, setSeedTestResults] = useState<
    RewardSeedTestResult[]
  >([]);

  // Seedlist modal state
  const [showSeedListModal, setShowSeedListModal] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<SeedListRecipient[]>([]);

  // Channel states
  const [channels, setChannels] = useState<Array<{ id: Channel; name: string; icon: any }>>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel>(
    data.channel || (getSettingsCommunicationChannel() as Channel),
  );
  const [smsRoutes, setSmsRoutes] = useState<SMSRoute[]>([]);
  const [smsRoute, setSmsRoute] = useState("");
  const [emailRoute, setEmailRoute] = useState("");
  const [rewardTitle, setRewardTitle] = useState("");

  // Load email routes from configuration (dummy data)
  const emailRoutesConfig = useConfigurationData("emailRoutes");
  const emailRoutes = emailRoutesConfig?.data?.filter((r: any) => r.isActive || r.is_active) || [];

  // Communication Policy states
  const [communicationPolicies, setCommunicationPolicies] = useState<
    CommunicationPolicyConfiguration[]
  >([]);
  const [selectedPolicy, setSelectedPolicy] =
    useState<CommunicationPolicyConfiguration | null>(null);
  const [isPolicyDropdownOpen, setIsPolicyDropdownOpen] = useState(false);
  const policyDropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(policyDropdownRef, () => setIsPolicyDropdownOpen(false));

  // Fetch SMS routes
  useEffect(() => {
    const fetchSmsRoutes = async () => {
      try {
        const routes = await smsRouteService.getAllRoutes();
        setSmsRoutes(Array.isArray(routes) ? routes : []);
      } catch (error) {
        console.error("Failed to fetch SMS routes:", error);
        setSmsRoutes([]);
      }
    };
    fetchSmsRoutes();
  }, []);


  // Fetch communication channels
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const allChannels = await communicationChannelService.getAll();
        const iconMap: { [key: string]: any } = {
          SMS: MessageSquare,
          EMAIL: Mail,
          WHATSAPP: Phone,
          PUSH: Bell,
        };

        const channelsList = (allChannels || [])
          .filter((ch: any) => ch.is_active)
          .map((ch: any) => {
            const code = ch.code?.toUpperCase() || "";
            return {
              id: code as Channel,
              name: ch.name || code,
              icon: iconMap[code] || MessageSquare,
            };
          });

        setChannels(channelsList);
        // Set default channel to first available
        if (channelsList.length > 0) {
          setSelectedChannel(channelsList[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch communication channels:", error);
        setChannels([]);
      }
    };
    fetchChannels();
  }, []);

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

  // Sync channel data from parent on mount
  useEffect(() => {
    if (data.channel) setSelectedChannel(data.channel as Channel);
    if (data.smsRoute) setSmsRoute(data.smsRoute);
    if (data.rewardTitle) setRewardTitle(data.rewardTitle);
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

  const activeSeedRecipients: SeedListRecipient[] = selectedRecipients;

  const availableSeedContacts = activeSeedRecipients
    .map(
      (recipient) => recipient.customer_phone || recipient.customer_email || "",
    )
    .filter(Boolean);

  // Handle saving selected recipients from modal
  const handleSaveSelectedRecipients = (_segmentId: string, recipients: SeedListRecipient[]) => {
    if (!recipients || !Array.isArray(recipients)) {
      console.warn("Invalid recipients data received");
      return;
    }
    setSelectedRecipients(recipients);
    setShowSeedListModal(false);
    // Reset test contact selections when changing recipients
    setSelectedSeedContactIds(new Set());
  };

  const resetRewardValidation = () => {
    setSeedTestResults([]);
    setSeedTestError("");
    onUpdate({ rewardValidation: undefined });
  };

  const toggleSeedContact = (recipientId: number) => {
    if (typeof recipientId !== "number" || recipientId < 0) {
      console.warn("Invalid recipientId:", recipientId);
      return;
    }
    const next = new Set(selectedSeedContactIds);
    if (next.has(recipientId)) {
      next.delete(recipientId);
    } else {
      next.add(recipientId);
    }
    setSelectedSeedContactIds(next);
  };

  const validateSeedContact = (contact: string): boolean => {
    if (!contact || typeof contact !== "string") {
      return false;
    }
    if (contact.includes("@")) {
      return isValidEmail(contact);
    }
    return isValidCountryCodePhone(contact);
  };

  const handleRunSeedTest = async () => {
    if (!activeSeedRecipients || !Array.isArray(activeSeedRecipients)) {
      setSeedTestError("No recipients available");
      return;
    }
    if (!selectedSeedContactIds || selectedSeedContactIds.size === 0) {
      setSeedTestError("Select at least one seed-list recipient for testing");
      return;
    }

    const selectedRecipientsList = activeSeedRecipients.filter((r) => {
      if (!r || typeof r.id !== "number") return false;
      return selectedSeedContactIds.has(r.id);
    });

    const contactsToTest = selectedRecipientsList
      .map((r) => {
        if (!r) return "";
        return r.customer_phone || r.customer_email || "";
      })
      .filter(Boolean);

    if (contactsToTest.length === 0) {
      setSeedTestError("Select at least one seed-list recipient for testing");
      return;
    }

    setIsTesting(true);
    setSeedTestError("");
    setSeedTestResults([]);

    const results: RewardSeedTestResult[] = contactsToTest.map((contact) => {
      const isValid = validateSeedContact(contact);
      return {
        contact,
        status: isValid ? "success" : "failed",
        message: isValid
          ? "Test reward payload validated"
          : "Invalid seed-list contact format",
      };
    });

    await new Promise((resolve) => setTimeout(resolve, 450));

    const passed = results.filter(
      (result) => result.status === "success",
    ).length;
    const failed = results.length - passed;

    setSeedTestResults(results);
    onUpdate({
      seedTestContacts: contactsToTest,
      rewardValidation: {
        completed: true,
        passed,
        failed,
        testedAt: new Date().toISOString(),
      },
    });
    setIsTesting(false);
  };

  const handleRewardTypeSelect = (type: RewardType) => {
    setRewardType(type);
    // Reset value when changing type
    setRewardValue("");
    onUpdate({ rewardType: type, rewardValue: "" });
    resetRewardValidation();
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

    if (!data.rewardValidation?.completed) {
      setError("Run seed-list testing before continuing");
      return;
    }

    setError("");

    // Update data
    onUpdate({
      rewardType: rewardType,
      rewardValue: rewardValue.trim(),
      bundleTrack: rewardType === "bundle" ? bundleTrack : undefined,
      description: description.trim() || undefined,
      channel: selectedChannel,
      smsRoute: selectedChannel === "SMS" ? smsRoute : undefined,
      rewardTitle: selectedChannel === "EMAIL" ? rewardTitle : undefined,
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
            <Input
              type="number"
              value={rewardValue}
              onChange={(value) => {
                setRewardValue(String(value));
                onUpdate({ rewardValue: String(value) });
                resetRewardValidation();
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
            <HeadlessSelect
              label={t.manualRewards.bundleTrackLabel}
              options={BUNDLE_TRACKS.map((track) => ({
                value: track,
                label: track,
              }))}
              value={bundleTrack}
              onChange={(value) => {
                setBundleTrack(value as string);
                onUpdate({ bundleTrack: value as string });
                resetRewardValidation();
              }}
              placeholder={t.manualRewards.bundleTrackPlaceholder}
              zIndex={zIndex.popover}
            />
            <p className={`mt-1 text-xs ${tw.textSecondary}`}>
              {t.manualRewards.bundleTrackHelper}
            </p>
          </div>
        )}

        {/* Communication Channel, SMS Route, and Email Route */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <HeadlessSelect
              label="Communication Channel *"
              value={selectedChannel}
              onChange={(value) => {
                setSelectedChannel(value as Channel);
                setSmsRoute("");
                setRewardTitle("");
              }}
              options={channels.map((channel) => ({
                value: channel.id,
                label: channel.name,
              }))}
              placeholder="Select a communication channel"
              zIndex={zIndex.popover}
            />
          </div>

          {/* SMS Route (for SMS variants) */}
          {selectedChannel && selectedChannel.toUpperCase().includes("SMS") && (
            <div className="flex-1">
              <HeadlessSelect
                label="SMS Route *"
                options={[
                  { value: "", label: "Select SMS Route" },
                  ...(smsRoutes || [])
                    .filter((route) => route.is_active)
                    .map((route) => ({
                      value: route.id.toString(),
                      label: route.name,
                    })),
                ]}
                value={smsRoute}
                onChange={(value) => {
                  setSmsRoute(value);
                }}
                placeholder="Select SMS Route"
                zIndex={zIndex.popover}
              />
            </div>
          )}

          {/* Email Route (for Email channel only) */}
          {selectedChannel && selectedChannel.toUpperCase() === "EMAIL" && (
            <div className="flex-1">
              <HeadlessSelect
                label="Email Route *"
                options={[
                  { value: "", label: "Select Email Route" },
                  ...(emailRoutes || []).map((route: any) => ({
                    value: route.id.toString(),
                    label: route.name,
                  })),
                ]}
                value={emailRoute}
                onChange={(value) => {
                  setEmailRoute(value);
                }}
                placeholder="Select Email Route"
                zIndex={zIndex.popover}
              />
            </div>
          )}
        </div>

        {/* Subject Line (for Email channel only) */}
        {selectedChannel === "EMAIL" && (
          <div>
            <Input
              label="Subject Line"
              placeholder="Enter email subject..."
              value={rewardTitle}
              onChange={(value) => setRewardTitle(String(value))}
             
              required
            />
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
                        resetRewardValidation();
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
                        <div
                          className={`text-sm font-medium ${tw.textPrimary}`}
                        >
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
            Select a communication policy to control how this reward is
            delivered to recipients
          </p>
        </div>

        {/* Description (Optional) */}
        <div>
          <Textarea
            label={`${t.manualRewards.descriptionLabel} (${t.manualRewards.optional})`}
            value={description}
            onChange={(value) => {
              setDescription(value);
              onUpdate({ description: String(value) });
              resetRewardValidation();
            }}
            placeholder={t.manualRewards.descriptionPlaceholder}
            rows={3}
          />
        </div>

        {/* Seed List Testing */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={`block text-sm font-medium ${tw.textPrimary}`}>
              Seed List Test
            </label>
            <button
              onClick={() => setShowSeedListModal(true)}
              style={getButtonStyles(button.action)}
            >
              Select from Seed List
            </button>
          </div>

          {activeSeedRecipients.length > 0 && (
            <div className={`text-sm ${tw.textSecondary} mb-3`}>
              {selectedSeedContactIds.size} of {activeSeedRecipients.length} recipients selected
            </div>
          )}

          {activeSeedRecipients.length === 0 ? (
            <p className={`text-sm ${tw.textMuted}`}>
              No active seed-list recipients available.
            </p>
          ) : (
            <div
              className={`border ${tw.rounded} overflow-hidden`}
              style={{ borderColor: color.border.default }}
            >
                <table className="min-w-full divide-y" style={{ borderColor: color.border.default }}>
                  <thead style={{ backgroundColor: color.surface.cards }}>
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-12">
                        <Checkbox
                          id="select-all-seed-contacts"
                          checked={selectedSeedContactIds.size === activeSeedRecipients.length && activeSeedRecipients.length > 0}
                          onChange={() => {
                            if (selectedSeedContactIds.size === activeSeedRecipients.length) {
                              setSelectedSeedContactIds(new Set());
                            } else {
                              setSelectedSeedContactIds(new Set(activeSeedRecipients.map((r) => r.id)));
                            }
                          }}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y" style={{ borderColor: color.border.default }}>
                    {activeSeedRecipients.map((recipient) => {
                      const contact = recipient.customer_phone || recipient.customer_email || "";
                      const isSelected = selectedSeedContactIds.has(recipient.id);
                      return (
                        <tr key={recipient.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <Checkbox
                              id={`seed-contact-${recipient.id}`}
                              checked={isSelected}
                              onChange={() => toggleSeedContact(recipient.id)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900">
                              {recipient.customer_name || "-"}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-600 truncate">
                              {recipient.customer_email || "-"}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-600">
                              {recipient.customer_phone || "-"}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSeedContactIds(new Set([recipient.id]));
                                handleRunSeedTest();
                              }}
                              disabled={isTesting}
                              style={{
                                ...getButtonStyles(button.action),
                                opacity: isTesting ? 0.5 : 1,
                              }}
                            >
                              Test
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          {activeSeedRecipients.length > 0 && (
            <button
              type="button"
              onClick={handleRunSeedTest}
              disabled={isTesting || selectedSeedContactIds.size === 0}
              className="text-sm"
              style={{
                ...getButtonStyles(button.action),
                opacity: (isTesting || selectedSeedContactIds.size === 0) ? 0.5 : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "1rem",
              }}
            >
              {isTesting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin flex-shrink-0" />
                  <span>Sending Tests...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 flex-shrink-0" />
                  <span>Send Tests</span>
                </>
              )}
            </button>
          )}

          {seedTestError && (
            <p className="mt-2 text-sm" style={{ color: color.status.danger }}>
              {seedTestError}
            </p>
          )}

          {data.rewardValidation?.completed && (
            <p className={`mt-2 text-xs ${tw.textMuted}`}>
              Last test: {data.rewardValidation.passed} passed,{" "}
              {data.rewardValidation.failed} failed
            </p>
          )}

          {seedTestResults.length > 0 && (
            <div className="mt-6 space-y-2">
              {seedTestResults.map((result) => (
                <div
                  key={`${result.contact}-${result.status}`}
                  className={`p-2 ${tw.rounded} border flex items-center gap-2`}
                  style={{
                    borderColor:
                      result.status === "success"
                        ? `${color.status.success}40`
                        : `${color.status.danger}40`,
                    backgroundColor:
                      result.status === "success"
                        ? `${color.status.success}10`
                        : `${color.status.danger}10`,
                  }}
                >
                  {result.status === "success" ? (
                    <CheckCircle
                      className="w-4 h-4"
                      style={{ color: color.status.success }}
                    />
                  ) : (
                    <XCircle
                      className="w-4 h-4"
                      style={{ color: color.status.danger }}
                    />
                  )}
                  <div className="text-xs">
                    <div className={`font-medium ${tw.textPrimary}`}>
                      {result.contact}
                    </div>
                    <div className={tw.textMuted}>{result.message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
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

        {/* Seed List Recipients Modal */}
        <SeedListRecipientsModal
          isOpen={showSeedListModal}
          onClose={() => setShowSeedListModal(false)}
          segmentId="reward"
          selectedSeedLists={selectedRecipients.map((r) => String(r.id))}
          onSave={handleSaveSelectedRecipients}
        />
      </div>
    </div>
  );
}
