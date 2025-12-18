import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Settings,
  GripVertical,
  Award,
  TestTube,
  RotateCw,
  Layers,
  ChevronDown,
} from "lucide-react";
import {
  CreateCampaignRequest,
  CampaignSegment,
  SegmentControlGroupConfig,
  ControlGroup,
} from "../../types/campaign";
import { Segment } from "../../../segments/types/segment";
import ChampionChallengerDisplay from "../displays/ChampionChallengerDisplay";
import ABTestDisplay from "../displays/ABTestDisplay";
import SequentialCampaignDisplay from "../displays/SequentialCampaignDisplay";
import { tw, components, color, zIndex } from "../../../../shared/utils/utils";
import { useClickOutside } from "../../../../shared/hooks/useClickOutside";

interface AvailableControlGroup {
  id: string;
  name: string;
  description: string;
  percentage: number;
  created_at: string;
}
import SegmentSelectionModal from "./SegmentSelectionModal";
import UniversalControlGroupModal from "./UniversalControlGroupModal";
import SegmentModal from "../../../segments/components/SegmentModal";

interface AudienceConfigurationStepProps {
  formData: CreateCampaignRequest;
  setFormData: (data: CreateCampaignRequest) => void;
  selectedSegments: CampaignSegment[];
  setSelectedSegments: (segments: CampaignSegment[]) => void;
  controlGroup: ControlGroup;
  validationErrors?: { [key: string]: string };
  clearValidationErrors?: () => void;
}

export default function AudienceConfigurationStep({
  formData,
  setFormData,
  selectedSegments,
  setSelectedSegments,
  controlGroup: _controlGroup, // eslint-disable-line @typescript-eslint/no-unused-vars
  validationErrors = {},
  clearValidationErrors,
}: AudienceConfigurationStepProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCreateSegmentModal, setShowCreateSegmentModal] = useState(false);
  const [showUniversalControlGroupModal, setShowUniversalControlGroupModal] =
    useState(false);
  const [editingControlGroup, setEditingControlGroup] = useState<string | null>(
    null
  );
  const [showControlGroupModal, setShowControlGroupModal] = useState(false);
  const [mutuallyExclusive, setMutuallyExclusive] = useState(false);
  const [draggedSegment, setDraggedSegment] = useState<string | null>(null);
  const [isCampaignTypeDropdownOpen, setIsCampaignTypeDropdownOpen] =
    useState(false);

  const campaignTypeDropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(campaignTypeDropdownRef, () =>
    setIsCampaignTypeDropdownOpen(false)
  );

  // Campaign type options
  const campaignTypeOptions = [
    {
      value: "multiple_target_group",
      label: "Multiple Target",
      description: "Multiple segments with offers",
      icon: Users,
    },
    {
      value: "champion_challenger",
      label: "Champion-Challenger",
      description: "Main segment + challengers",
      icon: Award,
    },
    {
      value: "ab_test",
      label: "A/B Test",
      description: "Two segments: A and B",
      icon: TestTube,
    },
    {
      value: "round_robin",
      label: "Round Robin",
      description: "Offers with intervals",
      icon: RotateCw,
    },
    {
      value: "multiple_level",
      label: "Multiple Level",
      description: "Offers with conditions",
      icon: Layers,
    },
  ];

  // Mock data for available control groups
  const [availableControlGroups] = useState<AvailableControlGroup[]>([
    {
      id: "1",
      name: "Pilot",
      description: "Standard pilot control group",
      percentage: 10,
      created_at: "2024-01-15",
    },
    {
      id: "2",
      name: "Champion Challenger",
      description: "A/B testing control group",
      percentage: 15,
      created_at: "2024-01-20",
    },
    {
      id: "3",
      name: "Multiple Target Groups",
      description: "Multi-variant control group",
      percentage: 20,
      created_at: "2024-02-01",
    },
    {
      id: "4",
      name: "Multiple Target Groups (Non-Exclusive)",
      description: "Non-exclusive multi-variant control",
      percentage: 25,
      created_at: "2024-02-10",
    },
  ]);

  const handleSegmentSelect = (segments: CampaignSegment[]) => {
    // Clear validation errors when segments are selected
    if (clearValidationErrors) {
      clearValidationErrors();
    }

    if (formData.campaign_type === "champion_challenger") {
      // For Champion-Challenger: first segment is champion (priority 1), rest are challengers
      const processedSegments = segments.map((seg, index) => {
        if (selectedSegments.length === 0 && index === 0) {
          // First segment when none exist = Champion with priority 1
          return { ...seg, priority: 1 };
        } else {
          // All others are challengers with priority > 1
          return { ...seg, priority: selectedSegments.length + index + 1 };
        }
      });
      setSelectedSegments([...selectedSegments, ...processedSegments]);
    } else if (formData.campaign_type === "ab_test") {
      // For A/B Test: only 2 segments allowed
      const processedSegments = segments
        .slice(0, 2 - selectedSegments.length)
        .map((seg, index) => {
          return { ...seg, priority: selectedSegments.length + index + 1 };
        });
      setSelectedSegments([...selectedSegments, ...processedSegments]);
    } else if (
      formData.campaign_type === "round_robin" ||
      formData.campaign_type === "multiple_level"
    ) {
      // For Round Robin and Multiple Level: only 1 segment allowed
      setSelectedSegments([segments[0]]);
    } else {
      // Multiple Target Group: normal behavior
      setSelectedSegments(segments);
    }
    setIsModalOpen(false);
  };

  const handleSegmentCreated = (segment: Segment) => {
    // Convert the created segment to CampaignSegment format
    const campaignSegment: CampaignSegment = {
      id: segment.id?.toString() || "",
      name: segment.name,
      description: segment.description || undefined,
      customer_count: segment.size_estimate || 0,
      created_at: segment.created_at || new Date().toISOString(),
      criteria: {}, // Empty criteria object - will be populated from conditions if needed
      priority: selectedSegments.length + 1,
    };

    // For Champion-Challenger: first segment gets priority 1
    if (
      formData.campaign_type === "champion_challenger" &&
      selectedSegments.length === 0
    ) {
      campaignSegment.priority = 1;
    }

    // Handle different campaign types
    if (
      formData.campaign_type === "round_robin" ||
      formData.campaign_type === "multiple_level"
    ) {
      setSelectedSegments([campaignSegment]); // Only one segment
    } else if (
      formData.campaign_type === "ab_test" &&
      selectedSegments.length >= 2
    ) {
      // Don't add if already have 2 segments
      return;
    } else {
      setSelectedSegments([...selectedSegments, campaignSegment]);
    }
    setShowCreateSegmentModal(false);
  };

  const handleRemoveSegment = (segmentId: string) => {
    const updatedSegments = selectedSegments.filter((s) => s.id !== segmentId);
    setSelectedSegments(updatedSegments);
  };

  const handleDragStart = (e: React.DragEvent, segmentId: string) => {
    setDraggedSegment(segmentId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetSegmentId: string) => {
    e.preventDefault();
    if (!draggedSegment || draggedSegment === targetSegmentId) return;

    const draggedIndex = selectedSegments.findIndex(
      (s) => s.id === draggedSegment
    );
    const targetIndex = selectedSegments.findIndex(
      (s) => s.id === targetSegmentId
    );

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newSegments = [...selectedSegments];
    const [draggedItem] = newSegments.splice(draggedIndex, 1);
    newSegments.splice(targetIndex, 0, draggedItem);

    // Update priorities based on new order
    const updatedSegments = newSegments.map((segment, index) => ({
      ...segment,
      priority: index + 1,
    }));

    setSelectedSegments(updatedSegments);
    setDraggedSegment(null);
  };

  const handleDragEnd = () => {
    setDraggedSegment(null);
  };

  const updateSegmentControlGroup = (
    segmentId: string,
    config: SegmentControlGroupConfig
  ) => {
    const updatedSegments = selectedSegments.map((segment: CampaignSegment) =>
      segment.id === segmentId
        ? { ...segment, control_group_config: config }
        : segment
    );
    setSelectedSegments(updatedSegments);
  };

  const getControlGroupLabel = (config?: SegmentControlGroupConfig) => {
    if (!config || config.type === "none") return "No Control Group";
    if (config.type === "with_control_group") {
      if (config.control_group_method === "fixed_percentage")
        return `Fixed Percentage (${config.percentage}%)`;
      if (config.control_group_method === "fixed_number")
        return `Fixed Number (${config.fixed_number?.toLocaleString()})`;
      if (config.control_group_method === "advanced_parameters")
        return `Advanced (${config.confidence_level}% conf.)`;
      return "With Control Group";
    }
    if (config.type === "multiple_control_group") {
      const selectedGroup = availableControlGroups.find(
        (g) => g.id === config.selected_control_group_id
      );
      return selectedGroup
        ? `Universal: ${selectedGroup.name}`
        : "Universal Control Group";
    }
    return "No Control Group";
  };

  const getControlGroupColor = (config?: SegmentControlGroupConfig) => {
    if (!config || config.type === "none") return "bg-gray-100 text-gray-700";
    if (config.type === "with_control_group") {
      if (config.control_group_method === "fixed_percentage")
        return `text-white`;
      if (config.control_group_method === "fixed_number") return `text-white`;
      if (config.control_group_method === "advanced_parameters")
        return `text-white`;
      return `text-white`;
    }
    if (config.type === "multiple_control_group") return `text-white`;
    return "bg-gray-100 text-gray-700";
  };

  const getControlGroupBgColor = (config?: SegmentControlGroupConfig) => {
    if (!config || config.type === "none") return "#f3f4f6";
    if (config.type === "with_control_group") {
      if (config.control_group_method === "fixed_percentage")
        return color.primary.accent;
      if (config.control_group_method === "fixed_number")
        return color.status.success;
      if (config.control_group_method === "advanced_parameters")
        return color.status.warning;
      return color.primary.accent;
    }
    if (config.type === "multiple_control_group") return color.tertiary.tag1;
    return "#f3f4f6";
  };

  return (
    <div className="space-y-4">
      {/* Campaign Type Selection */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-sm font-semibold ${tw.textPrimary}`}>
              Campaign Type
            </h3>
          </div>
        </div>

        <div className="relative" ref={campaignTypeDropdownRef}>
          <button
            type="button"
            onClick={() =>
              setIsCampaignTypeDropdownOpen(!isCampaignTypeDropdownOpen)
            }
            className={`${components.input.default} w-full px-4 py-3 text-left flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              {(() => {
                const selectedOption = campaignTypeOptions.find(
                  (option) => option.value === formData.campaign_type
                );
                const IconComponent = selectedOption?.icon || Users;
                return (
                  <>
                    <IconComponent className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className={`text-sm ${tw.textPrimary}`}>
                        {selectedOption?.label || "Select Campaign Type"}
                      </div>
                      {selectedOption && (
                        <div className={`text-xs ${tw.textSecondary}`}>
                          {selectedOption.description}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isCampaignTypeDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isCampaignTypeDropdownOpen && (
            <div
              className={`absolute w-full mt-1 bg-white border border-gray-300 ${tw.rounded} shadow-xl max-h-64 overflow-hidden`}
              style={{ zIndex: zIndex.dropdown }}
            >
              {campaignTypeOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        campaign_type: option.value as
                          | "multiple_target_group"
                          | "champion_challenger"
                          | "ab_test"
                          | "round_robin"
                          | "multiple_level",
                      });
                      setSelectedSegments([]);
                      setIsCampaignTypeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center gap-3 ${
                      formData.campaign_type === option.value
                        ? "bg-blue-50"
                        : ""
                    }`}
                  >
                    <IconComponent className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className={`text-sm ${tw.textPrimary} font-medium`}>
                        {option.label}
                      </div>
                      <div className={`text-xs ${tw.textSecondary}`}>
                        {option.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mutually Exclusive Segments Checkbox */}
      {selectedSegments.length > 1 && (
        <div className={`${tw.rounded} p-3`}>
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={mutuallyExclusive}
              onChange={(e) => {
                setMutuallyExclusive(e.target.checked);
                // Update all segments with mutual exclusivity
                const updatedSegments = selectedSegments.map((segment) => ({
                  ...segment,
                  is_mutually_exclusive: e.target.checked,
                }));
                setSelectedSegments(updatedSegments);
              }}
              className="mt-1 w-4 h-4 border-gray-300 rounded"
              style={{ accentColor: color.primary.accent }}
            />
            <div>
              <div className="text-sm font-medium text-gray-900">
                Mutually Exclusive Segments
              </div>
              <div className="text-xs text-gray-500">
                Ensure customers can only belong to one segment at a time
              </div>
            </div>
          </label>
        </div>
      )}

      {/* Selected Segments - Adapted by Campaign Type */}
      <div className="space-y-3 mt-8 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-sm font-semibold ${tw.textPrimary}`}>
              {formData.campaign_type === "champion_challenger" &&
                "Champion & Challengers"}
              {formData.campaign_type === "ab_test" && "A/B Test Variants"}
              {formData.campaign_type === "round_robin" && "Round Robin Target"}
              {formData.campaign_type === "multiple_level" &&
                "Multiple Level Target"}
              {formData.campaign_type === "multiple_target_group" &&
                "Selected Segments"}
            </h3>
            <p className={`${tw.caption} ${tw.textSecondary} mb-4`}>
              {formData.campaign_type === "champion_challenger" &&
                "Define champion segment and its challengers"}
              {formData.campaign_type === "ab_test" &&
                "Configure A and B variants for testing"}
              {formData.campaign_type === "round_robin" &&
                "Define single target segment for rotating offers"}
              {formData.campaign_type === "multiple_level" &&
                "Define single target segment for sequential offers"}
              {(formData.campaign_type === "round_robin" ||
                formData.campaign_type === "multiple_level") &&
                "Define single target segment for sequential offers"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(formData.campaign_type === "multiple_target_group" ||
              formData.campaign_type === "champion_challenger" ||
              (formData.campaign_type === "ab_test" &&
                selectedSegments.length < 2) ||
              (formData.campaign_type === "round_robin" &&
                selectedSegments.length === 0) ||
              (formData.campaign_type === "multiple_level" &&
                selectedSegments.length === 0)) && (
              <button
                onClick={() => setIsModalOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 text-white ${tw.rounded} text-sm font-medium`}
                style={{ backgroundColor: color.primary.action }}
              >
                <Plus className="w-4 h-4" />
                {formData.campaign_type === "champion_challenger" &&
                selectedSegments.length === 0
                  ? "Champion"
                  : formData.campaign_type === "champion_challenger"
                  ? "Challenger"
                  : "Add Segment"}
              </button>
            )}
            <button
              onClick={() => setShowCreateSegmentModal(true)}
              className={`px-4 py-2 text-sm font-medium ${tw.rounded} flex items-center gap-2`}
              style={{
                backgroundColor: color.primary.action,
                color: "white",
              }}
            >
              <Plus className="w-4 h-4" />
              Create New Segment
            </button>
          </div>
        </div>

        {/* Champion-Challenger Display */}
        {formData.campaign_type === "champion_challenger" && (
          <ChampionChallengerDisplay
            champion={selectedSegments.find((s) => s.priority === 1) || null}
            challengers={selectedSegments.filter((s) => s.priority !== 1)}
            onAddChampion={() => setIsModalOpen(true)}
            onAddChallenger={() => setIsModalOpen(true)}
            onRemoveSegment={handleRemoveSegment}
            onConfigureControlGroup={(segmentId) => {
              setEditingControlGroup(segmentId);
              setShowControlGroupModal(true);
            }}
          />
        )}

        {/* A/B Test Display */}
        {formData.campaign_type === "ab_test" && (
          <ABTestDisplay
            variantA={selectedSegments[0] || null}
            variantB={selectedSegments[1] || null}
            onRemoveSegment={handleRemoveSegment}
            onConfigureControlGroup={(segmentId) => {
              setEditingControlGroup(segmentId);
              setShowControlGroupModal(true);
            }}
          />
        )}

        {/* Round Robin / Multiple Level Display */}
        {(formData.campaign_type === "round_robin" ||
          formData.campaign_type === "multiple_level") && (
          <SequentialCampaignDisplay
            campaignType={formData.campaign_type}
            segment={selectedSegments[0] || null}
            onRemoveSegment={handleRemoveSegment}
            onConfigureControlGroup={(segmentId) => {
              setEditingControlGroup(segmentId);
              setShowControlGroupModal(true);
            }}
          />
        )}

        {/* Standard Display for Multiple Target Group */}
        {formData.campaign_type === "multiple_target_group" &&
          selectedSegments.length === 0 && (
            <div
              className={`border-2 border-dashed ${tw.rounded} p-4 ${
                validationErrors.segments
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300"
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                <div
                  className={`w-8 h-8 bg-gray-100 ${tw.rounded} flex items-center justify-center`}
                >
                  <Users className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-center">
                  <h3 className={`text-sm ${tw.textPrimary} font-medium`}>
                    No Segments Selected
                  </h3>
                  <p className={`${tw.caption} ${tw.textSecondary}`}>
                    Select target audience segments for your campaign
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Validation Error Message */}
        {validationErrors.segments && (
          <div
            className={`mt-4 p-3 bg-red-50 border border-red-200 ${tw.rounded}`}
          >
            <p className="text-sm text-red-600">{validationErrors.segments}</p>
          </div>
        )}

        {formData.campaign_type === "multiple_target_group" &&
          selectedSegments.length > 0 && (
            <div
              className={`border border-gray-200 ${tw.rounded} overflow-hidden`}
            >
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Priority
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Segment
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Customers
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                      Control Group
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedSegments.map((segment, index) => (
                    <tr
                      key={segment.id}
                      draggable={selectedSegments.length > 1}
                      onDragStart={(e) => handleDragStart(e, segment.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, segment.id)}
                      onDragEnd={handleDragEnd}
                      className={`hover:bg-gray-50 transition-colors ${
                        selectedSegments.length > 1 ? "cursor-move" : ""
                      } ${draggedSegment === segment.id ? "opacity-50" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {selectedSegments.length > 1 && (
                            <GripVertical className="w-4 h-4 text-gray-400" />
                          )}
                          <span
                            className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded text-white"
                            style={{ backgroundColor: color.primary.accent }}
                          >
                            #{index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Users
                            className="w-5 h-5"
                            style={{ color: color.primary.accent }}
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {segment.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {segment.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 font-medium">
                          {segment.customer_count.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">customers</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getControlGroupColor(
                            segment.control_group_config
                          )}`}
                          style={{
                            backgroundColor: getControlGroupBgColor(
                              segment.control_group_config
                            ),
                          }}
                        >
                          {getControlGroupLabel(segment.control_group_config)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingControlGroup(segment.id);
                              setShowControlGroupModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-[#588157] hover:bg-gray-100 rounded transition-colors"
                            title="Configure Control Group"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              console.log("Edit segment:", segment.name);
                            }}
                            className="p-1.5 text-gray-400 hover:text-[#588157] hover:bg-gray-100 rounded transition-colors"
                            title="Edit Segment"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveSegment(segment.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Remove Segment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* Segment Selection Modal */}
      {isModalOpen && (
        <SegmentSelectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelect={handleSegmentSelect}
          selectedSegments={selectedSegments}
          onCreateNew={() => {
            setIsModalOpen(false);
            setShowCreateSegmentModal(true);
          }}
        />
      )}

      {/* Universal Control Group Modal */}
      {showUniversalControlGroupModal && (
        <UniversalControlGroupModal
          isOpen={showUniversalControlGroupModal}
          onClose={() => setShowUniversalControlGroupModal(false)}
        />
      )}

      {/* Create Segment Modal */}
      {showCreateSegmentModal && (
        <SegmentModal
          isOpen={showCreateSegmentModal}
          onClose={() => setShowCreateSegmentModal(false)}
          onSave={handleSegmentCreated}
        />
      )}

      {/* Control Group Configuration Modal */}
      {showControlGroupModal && editingControlGroup && (
        <ControlGroupConfigModal
          isOpen={showControlGroupModal}
          onClose={() => {
            setShowControlGroupModal(false);
            setEditingControlGroup(null);
          }}
          segmentId={editingControlGroup}
          segment={selectedSegments.find((s) => s.id === editingControlGroup)!}
          availableControlGroups={availableControlGroups}
          onSave={updateSegmentControlGroup}
        />
      )}
    </div>
  );
}

// Control Group Configuration Modal Component
interface ControlGroupConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  segmentId: string;
  segment: CampaignSegment;
  availableControlGroups: AvailableControlGroup[];
  onSave: (segmentId: string, config: SegmentControlGroupConfig) => void;
}

function ControlGroupConfigModal({
  isOpen,
  onClose,
  segmentId,
  segment,
  availableControlGroups,
  onSave,
}: ControlGroupConfigModalProps) {
  const [config, setConfig] = useState<SegmentControlGroupConfig>(
    segment.control_group_config || { type: "none" }
  );
  const [searchTerm, setSearchTerm] = useState("");

  const filteredControlGroups = availableControlGroups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
    onSave(segmentId, config);
    onClose();
  };

  const calculateControlGroupSize = () => {
    if (config.type === "with_control_group") {
      if (
        config.control_group_method === "fixed_percentage" &&
        config.percentage
      ) {
        return Math.round(segment.customer_count * (config.percentage / 100));
      }
      if (
        config.control_group_method === "fixed_number" &&
        config.fixed_number
      ) {
        return config.fixed_number;
      }
      if (
        config.control_group_method === "advanced_parameters" &&
        config.confidence_level &&
        config.margin_of_error
      ) {
        // Simplified calculation for demo - in reality this would use statistical formulas
        const baseSize = Math.round(segment.customer_count * 0.1); // 10% base
        const confidenceMultiplier = config.confidence_level / 95; // Normalize to 95%
        const errorMultiplier = 10 / config.margin_of_error; // Inverse relationship
        return Math.round(baseSize * confidenceMultiplier * errorMultiplier);
      }
    }
    if (
      config.type === "multiple_control_group" &&
      config.selected_control_group_id
    ) {
      const selectedGroup = availableControlGroups.find(
        (g) => g.id === config.selected_control_group_id
      );
      if (selectedGroup) {
        return Math.round(
          segment.customer_count * (selectedGroup.percentage / 100)
        );
      }
    }
    return 0;
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
        className={`bg-white ${tw.rounded} max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-300`}
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">
            Configure Control Group
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Configure control group settings for segment:{" "}
            <span className="font-medium">{segment.name}</span>
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Control Group Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Control Group Type
            </label>
            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="controlGroupType"
                  value="none"
                  checked={config.type === "none"}
                  onChange={() => setConfig({ type: "none" })}
                  className="mt-1 w-4 h-4 text-[#588157] border-gray-300 focus:ring-[#588157]"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    No Control Group
                  </div>
                  <div className="text-sm text-gray-500">
                    All customers in this segment will receive the campaign
                  </div>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="controlGroupType"
                  value="with_control_group"
                  checked={config.type === "with_control_group"}
                  onChange={() =>
                    setConfig({
                      type: "with_control_group",
                      control_group_method: "fixed_percentage",
                      percentage: 23,
                    })
                  }
                  className="mt-1 w-4 h-4 text-[#588157] border-gray-300 focus:ring-[#588157]"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    With Control Group
                  </div>
                  <div className="text-sm text-gray-500">
                    Configure control group for this segment
                  </div>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="controlGroupType"
                  value="multiple_control_group"
                  checked={config.type === "multiple_control_group"}
                  onChange={() => setConfig({ type: "multiple_control_group" })}
                  className="mt-1 w-4 h-4 text-[#588157] border-gray-300 focus:ring-[#588157]"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Universal Control Group
                  </div>
                  <div className="text-sm text-gray-500">
                    Select from existing universal control group configurations
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Control Group Method Selection */}
          {config.type === "with_control_group" && (
            <div className={`space-y-4 p-4 ${tw.rounded}`}>
              <h4 className="text-sm font-medium text-gray-900">
                Control Group Configuration Method
              </h4>

              <div className="space-y-3">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="controlGroupMethod"
                    value="fixed_percentage"
                    checked={config.control_group_method === "fixed_percentage"}
                    onChange={() =>
                      setConfig({
                        ...config,
                        control_group_method: "fixed_percentage",
                        percentage: 23,
                      })
                    }
                    className="mt-1 w-4 h-4 text-[#588157] border-gray-300 focus:ring-[#588157]"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Fixed percentage of Target Base
                    </div>
                    <div className="text-sm text-gray-500">
                      Set a fixed percentage with optional limits
                    </div>
                  </div>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="controlGroupMethod"
                    value="fixed_number"
                    checked={config.control_group_method === "fixed_number"}
                    onChange={() =>
                      setConfig({
                        ...config,
                        control_group_method: "fixed_number",
                        fixed_number: 10000,
                      })
                    }
                    className="mt-1 w-4 h-4 text-[#588157] border-gray-300 focus:ring-[#588157]"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Fixed Number of Target Base
                    </div>
                    <div className="text-sm text-gray-500">
                      Set a specific number of customers for control group
                    </div>
                  </div>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="controlGroupMethod"
                    value="advanced_parameters"
                    checked={
                      config.control_group_method === "advanced_parameters"
                    }
                    onChange={() =>
                      setConfig({
                        ...config,
                        control_group_method: "advanced_parameters",
                        confidence_level: 95,
                        margin_of_error: 99,
                      })
                    }
                    className="mt-1 w-4 h-4 text-[#588157] border-gray-300 focus:ring-[#588157]"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Advanced Parameters
                    </div>
                    <div className="text-sm text-gray-500">
                      Configure based on confidence level and margin of error
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Fixed Percentage Configuration */}
          {config.type === "with_control_group" &&
            config.control_group_method === "fixed_percentage" && (
              <div className={`space-y-4 p-4 ${tw.rounded}`}>
                <h4 className="text-sm font-medium text-gray-900">
                  Fixed Percentage Configuration
                </h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Percentage
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      max="50"
                      step="0.1"
                      value={config.percentage || 23}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          percentage: Number(e.target.value),
                        })
                      }
                      className={`w-24 px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#588157] focus:border-transparent`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {calculateControlGroupSize().toLocaleString()} customers
                      will be in control group
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="setLimits"
                      checked={config.set_limits || false}
                      onChange={(e) =>
                        setConfig({ ...config, set_limits: e.target.checked })
                      }
                      className="w-4 h-4 text-[#588157] border-gray-300 focus:ring-[#588157] rounded"
                    />
                    <label
                      htmlFor="setLimits"
                      className="text-sm font-medium text-gray-700"
                    >
                      Set Limits
                    </label>
                  </div>

                  {config.set_limits && (
                    <div className="text-sm text-gray-600 mb-2">
                      Set lower and/or upper limits
                    </div>
                  )}

                  {config.set_limits && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Lower limit
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={config.lower_limit || ""}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              lower_limit: Number(e.target.value),
                            })
                          }
                          className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#588157] focus:border-transparent`}
                          placeholder="Lower limit"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Upper limit
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={config.upper_limit || ""}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              upper_limit: Number(e.target.value),
                            })
                          }
                          className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#588157] focus:border-transparent`}
                          placeholder="Upper limit"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Fixed Number Configuration */}
          {config.type === "with_control_group" &&
            config.control_group_method === "fixed_number" && (
              <div className={`space-y-4 p-4 ${tw.rounded}`}>
                <h4 className="text-sm font-medium text-gray-900">
                  Fixed Number Configuration
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of customers
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={segment.customer_count}
                    value={config.fixed_number || 10000}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        fixed_number: Number(e.target.value),
                      })
                    }
                    className={`w-32 px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#588157] focus:border-transparent`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(
                      ((config.fixed_number || 10000) /
                        segment.customer_count) *
                      100
                    ).toFixed(1)}
                    % of total segment
                  </p>
                </div>
              </div>
            )}

          {/* Multiple Control Group Selection */}
          {config.type === "multiple_control_group" && (
            <div className="space-y-4 p-4">
              <h4 className="text-sm font-medium text-gray-900">
                Select Universal Control Group
              </h4>

              <div
                className={`border border-gray-300 ${tw.rounded} p-4 space-y-3`}
              >
                <input
                  type="text"
                  placeholder="Search universal control groups..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#588157] focus:border-transparent`}
                />

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredControlGroups.map((group) => (
                    <label
                      key={group.id}
                      className={`flex items-start space-x-3 p-3 border border-gray-200 ${tw.rounded} hover:bg-white cursor-pointer`}
                    >
                      <input
                        type="radio"
                        name="selectedControlGroup"
                        value={group.id}
                        checked={config.selected_control_group_id === group.id}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            selected_control_group_id: e.target.value,
                          })
                        }
                        className="mt-1 w-4 h-4 text-[#588157] border-gray-300 focus:ring-[#588157]"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {group.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {group.description}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {group.percentage}% control group • Created{" "}
                          {group.created_at}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Advanced Parameters Configuration */}
          {config.type === "with_control_group" &&
            config.control_group_method === "advanced_parameters" && (
              <div className={`space-y-4 p-4 ${tw.rounded}`}>
                <h4 className="text-sm font-medium text-gray-900">
                  Advanced Parameters
                </h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confidence Level
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="90"
                        max="99"
                        step="1"
                        value={config.confidence_level || 95}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            confidence_level: Number(e.target.value),
                          })
                        }
                        className="flex-1"
                      />
                      <span className="text-sm font-medium text-gray-700 w-12">
                        {config.confidence_level || 95}%
                      </span>
                    </div>
                    <p className="text-xs text-red-500 mt-1">
                      This field is required
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Margin of error
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={config.margin_of_error || 99}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            margin_of_error: Number(e.target.value),
                          })
                        }
                        className="flex-1"
                      />
                      <span className="text-sm font-medium text-gray-700 w-12">
                        {config.margin_of_error || 99}%
                      </span>
                    </div>
                    <p className="text-xs text-red-500 mt-1">
                      This field is required
                    </p>
                  </div>
                </div>
              </div>
            )}

          {/* Summary */}
          {config.type !== "none" && (
            <div className={`${tw.rounded} p-4`}>
              <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Total Segment Size:</span>
                  <span className="font-medium ml-2">
                    {segment.customer_count.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Control Group Size:</span>
                  <span className="font-medium ml-2">
                    {calculateControlGroupSize().toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Target Group Size:</span>
                  <span className="font-medium ml-2">
                    {(
                      segment.customer_count - calculateControlGroupSize()
                    ).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Control Percentage:</span>
                  <span className="font-medium ml-2">
                    {config.type === "with_control_group" &&
                    config.control_group_method === "fixed_percentage"
                      ? `${config.percentage}%`
                      : config.type === "with_control_group" &&
                        config.control_group_method === "fixed_number"
                      ? `${(
                          ((config.fixed_number || 0) /
                            segment.customer_count) *
                          100
                        ).toFixed(1)}%`
                      : config.type === "with_control_group" &&
                        config.control_group_method === "advanced_parameters"
                      ? `${(
                          (calculateControlGroupSize() /
                            segment.customer_count) *
                          100
                        ).toFixed(1)}%`
                      : config.type === "multiple_control_group" &&
                        config.selected_control_group_id
                      ? `${
                          availableControlGroups.find(
                            (g) => g.id === config.selected_control_group_id
                          )?.percentage
                        }%`
                      : "0%"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className={`px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-colors`}
          >
            Cancel
          </button>
          <button onClick={handleSave} className={`${tw.button}`}>
            Save Configuration
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
