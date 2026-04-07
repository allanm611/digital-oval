import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  X,
  Clock,
  GitBranch,
  Settings,
  ChevronDown,
  ChevronRight,
  Edit,
} from "lucide-react";
import {
  CampaignOffer,
  CampaignSegment,
  IntervalConfig,
  ConditionConfig,
  SequentialOfferMapping,
} from "../../types/campaign";
import { color , tw} from "../../../../shared/utils/utils";
import HeadlessSelect from "../../../../shared/components/ui/HeadlessSelect";
import Input from "../../../../shared/components/ui/Input";

interface OfferFlowChartProps {
  campaignType: "round_robin" | "multiple_level";
  segment: CampaignSegment;
  selectedOffers: CampaignOffer[];
  offerMappings: SequentialOfferMapping[];
  onUpdateMappings: (mappings: SequentialOfferMapping[]) => void;
  onAddOffer: () => void;
}

export default function OfferFlowChart({
  campaignType,
  segment,
  selectedOffers,
  offerMappings,
  onUpdateMappings,
  onAddOffer,
}: OfferFlowChartProps) {
  const navigate = useNavigate();
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set([0]));
  const [editingNode, setEditingNode] = useState<number | null>(null);

  const toggleNode = (index: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedNodes(newExpanded);
  };

  const handleRemoveMapping = (index: number) => {
    const newMappings = offerMappings.filter((_, i) => i !== index);
    // Reorder sequence
    const reorderedMappings = newMappings.map((mapping, i) => ({
      ...mapping,
      sequence_order: i + 1,
    }));
    onUpdateMappings(reorderedMappings);
  };

  const handleUpdateInterval = (index: number, config: IntervalConfig) => {
    const newMappings = [...offerMappings];
    newMappings[index] = {
      ...newMappings[index],
      interval_config: config,
    };
    onUpdateMappings(newMappings);
    setEditingNode(null);
  };

  const handleUpdateCondition = (index: number, config: ConditionConfig) => {
    const newMappings = [...offerMappings];
    newMappings[index] = {
      ...newMappings[index],
      condition_config: config,
    };
    onUpdateMappings(newMappings);
    setEditingNode(null);
  };

  const getOfferById = (offerId: string) => {
    return selectedOffers.find((o) => o.id === offerId);
  };

  return (
    <div className={`bg-white border border-gray-200 ${tw.rounded} p-6`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Offer Flow Configuration
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {campaignType === "round_robin"
              ? "Configure offers with time intervals between each delivery"
              : "Configure offers with conditional logic for delivery"}
          </p>
        </div>
        <button
          onClick={onAddOffer}
          className={`inline-flex items-center px-4 py-2 text-white ${tw.rounded} text-sm font-medium`}
          style={{ backgroundColor: color.primary.action }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Offer
        </button>
      </div>

      {/* Segment Start Node */}
      <div className="space-y-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 w-12 flex flex-col items-center">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-700 font-bold text-sm">START</span>
            </div>
            {offerMappings.length > 0 && (
              <div className="w-0.5 h-12 bg-gray-300"></div>
            )}
          </div>
          <div className={`flex-1 ml-4 bg-gray-50 border border-gray-200 ${tw.rounded} p-4`}>
            <div className="flex items-center space-x-3">
              <div className="font-semibold text-gray-900">{segment.name}</div>
              <span className="text-sm text-gray-600">
                {segment.customer_count.toLocaleString()} customers
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{segment.description}</p>
          </div>
        </div>

        {/* Offer Nodes */}
        {offerMappings.map((mapping, index) => {
          const offer = getOfferById(mapping.offer_id);
          if (!offer) return null;

          const isExpanded = expandedNodes.has(index);
          const isEditing = editingNode === index;

          return (
            <div key={index} className="flex items-start">
              <div className="flex-shrink-0 w-12 flex flex-col items-center">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-700 font-bold text-xs">
                    {index + 1}
                  </span>
                </div>
                {index < offerMappings.length - 1 && (
                  <div className="w-0.5 h-12 bg-gray-300"></div>
                )}
              </div>

              <div className="flex-1 ml-4 space-y-3">
                {/* Interval/Condition Display */}
                {campaignType === "round_robin" && mapping.interval_config && (
                  <div className={`bg-amber-50 border border-amber-200 ${tw.rounded} p-3`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-900">
                          Wait {mapping.interval_config.interval_value}{" "}
                          {mapping.interval_config.interval_type}
                        </span>
                      </div>
                      <button
                        onClick={() => setEditingNode(index)}
                        className="text-amber-600 hover:text-amber-700"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                    {mapping.interval_config.description && (
                      <p className="text-xs text-amber-700 mt-1">
                        {mapping.interval_config.description}
                      </p>
                    )}
                  </div>
                )}

                {campaignType === "multiple_level" &&
                  mapping.condition_config && (
                    <div className={`bg-blue-50 border border-blue-200 ${tw.rounded} p-3`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <GitBranch className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">
                            If {mapping.condition_config.field}{" "}
                            {mapping.condition_config.operator}{" "}
                            {String(mapping.condition_config.value)}
                          </span>
                        </div>
                        <button
                          onClick={() => setEditingNode(index)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                      {mapping.condition_config.description && (
                        <p className="text-xs text-blue-700 mt-1">
                          {mapping.condition_config.description}
                        </p>
                      )}
                    </div>
                  )}

                {/* Offer Card */}
                <div className={`bg-white border border-gray-200 ${tw.rounded} p-4`}>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleNode(index)}
                      className="flex items-center space-x-3 flex-1"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">
                          {offer.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {offer.reward_type} - {offer.reward_value}
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/dashboard/offers/${offer.id}/edit`)}
                        className="text-gray-400 hover:text-blue-600 p-1"
                        title="Edit offer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveMapping(index)}
                        className="text-gray-400 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                      <p className="text-sm text-gray-600">
                        {offer.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Valid for {offer.validity_period} days</span>
                        <span className="px-2 py-1 bg-gray-100 rounded">
                          {offer.offer_type}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Editing Panels */}
                {isEditing && campaignType === "round_robin" && (
                  <IntervalConfigPanel
                    config={
                      mapping.interval_config || {
                        interval_type: "days",
                        interval_value: 1,
                      }
                    }
                    onSave={(config) => handleUpdateInterval(index, config)}
                    onCancel={() => setEditingNode(null)}
                  />
                )}

                {isEditing && campaignType === "multiple_level" && (
                  <ConditionConfigPanel
                    config={
                      mapping.condition_config || {
                        condition_type: "customer_attribute",
                        operator: "equals",
                        field: "",
                        value: "",
                      }
                    }
                    onSave={(config) => handleUpdateCondition(index, config)}
                    onCancel={() => setEditingNode(null)}
                  />
                )}
              </div>
            </div>
          );
        })}

        {/* End Node */}
        {offerMappings.length > 0 && (
          <div className="flex items-start">
            <div className="flex-shrink-0 w-12 flex flex-col items-center">
<<<<<<< Updated upstream
              <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">END</span>
=======
              <div className="w-10 h-10 ${tw.surfaceSecondary} rounded-full flex items-center justify-center">
                <span className={` font-bold text-sm`}>END</span>
>>>>>>> Stashed changes
              </div>
            </div>
            <div className={`flex-1 ml-4 bg-gray-50 border border-gray-200 ${tw.rounded} p-4`}>
              <div className="text-sm text-gray-600">
                Campaign sequence complete
              </div>
            </div>
          </div>
        )}

        {offerMappings.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>
              No offers added yet. Click "Add Offer" to start building your
              sequence.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Interval Config Panel
interface IntervalConfigPanelProps {
  config: IntervalConfig;
  onSave: (config: IntervalConfig) => void;
  onCancel: () => void;
}

function IntervalConfigPanel({
  config,
  onSave,
  onCancel,
}: IntervalConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState<IntervalConfig>(config);

  return (
    <div className={`bg-amber-50 border border-amber-300 ${tw.rounded} p-4 space-y-4`}>
      <h4 className="font-semibold text-gray-900">Configure Time Interval</h4>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Interval Value
          </label>
          <Input
            type="number"
            min="1"
            value={localConfig.interval_value}
            onChange={(value) =>
              setLocalConfig({
                ...localConfig,
                interval_value: parseInt(String(value)) || 1,
              })
            }
            className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#588157] focus:border-transparent`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Interval Type
          </label>
          <HeadlessSelect
            value={localConfig.interval_type}
            onChange={(value) =>
              setLocalConfig({
                ...localConfig,
                interval_type: value as "hours" | "days" | "weeks",
              })
            }
            options={[
              { label: "Hours", value: "hours" },
              { label: "Days", value: "days" },
              { label: "Weeks", value: "weeks" },
            ]}
            placeholder="Select interval type"
            className="w-full"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description (optional)
        </label>
        <Input
          type="text"
          value={localConfig.description || ""}
          onChange={(value) =>
            setLocalConfig({ ...localConfig, description: String(value) })
          }
          className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#588157] focus:border-transparent`}
          placeholder="e.g., Wait for customer to open first email"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className={`px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-colors`}
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(localConfig)}
          className={`px-4 py-2 text-white ${tw.rounded} text-sm font-medium`}
          style={{ backgroundColor: color.primary.action }}
        >
          Save Interval
        </button>
      </div>
    </div>
  );
}

// Condition Config Panel
interface ConditionConfigPanelProps {
  config: ConditionConfig;
  onSave: (config: ConditionConfig) => void;
  onCancel: () => void;
}

function ConditionConfigPanel({
  config,
  onSave,
  onCancel,
}: ConditionConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState<ConditionConfig>(config);

  return (
    <div className={`bg-blue-50 border border-blue-300 ${tw.rounded} p-4 space-y-4`}>
      <h4 className="font-semibold text-gray-900">Configure Condition</h4>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Condition Type
        </label>
        <HeadlessSelect
          value={localConfig.condition_type}
          onChange={(value) =>
            setLocalConfig({
              ...localConfig,
              condition_type: value as ConditionConfig["condition_type"],
            })
          }
          options={[
            { label: "Customer Attribute", value: "customer_attribute" },
            { label: "Behavior", value: "behavior" },
            { label: "Transaction", value: "transaction" },
            { label: "Custom", value: "custom" },
          ]}
          placeholder="Select condition type"
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Field
        </label>
        <Input
          type="text"
          value={localConfig.field}
          onChange={(value) =>
            setLocalConfig({ ...localConfig, field: String(value) })
          }
          className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#588157] focus:border-transparent`}
          placeholder="e.g., purchase_amount, email_opened, tier_level"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Operator
          </label>
          <HeadlessSelect
            value={localConfig.operator}
            onChange={(value) =>
              setLocalConfig({
                ...localConfig,
                operator: value as ConditionConfig["operator"],
              })
            }
            options={[
              { label: "Equals", value: "equals" },
              { label: "Not Equals", value: "not_equals" },
              { label: "Greater Than", value: "greater_than" },
              { label: "Less Than", value: "less_than" },
              { label: "Contains", value: "contains" },
              { label: "Not Contains", value: "not_contains" },
            ]}
            placeholder="Select operator"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Value
          </label>
          <Input
            type="text"
            value={String(localConfig.value)}
            onChange={(value) => {
              // Try to parse as number if possible
              const val = String(value);
              const numVal = parseFloat(val);
              setLocalConfig({
                ...localConfig,
                value: isNaN(numVal) ? val : numVal,
              });
            }}
            className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#588157] focus:border-transparent`}
            placeholder="e.g., 100, premium, true"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description (optional)
        </label>
        <Input
          type="text"
          value={localConfig.description || ""}
          onChange={(value) =>
            setLocalConfig({ ...localConfig, description: String(value) })
          }
          className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#588157] focus:border-transparent`}
          placeholder="e.g., Only for premium customers"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className={`px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-colors`}
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(localConfig)}
          className={`px-4 py-2 text-white ${tw.rounded} text-sm font-medium`}
          style={{ backgroundColor: color.primary.action }}
        >
          Save Condition
        </button>
      </div>
    </div>
  );
}
