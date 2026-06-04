import { useState, useEffect } from "react";
import {
  X,
  Target,
  Users,
  TrendingUp,
  Heart,
  Zap,
  Shield,
  Star,
  Flag,
  Trophy,
  Gift,
  Megaphone,
  ChartBar,
  Lightbulb,
  Rocket,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import Input from "../../../shared/components/ui/Input";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import {
  CampaignObjective,
  CreateObjectiveRequest,
  ObjectiveIcon,
  ObjectiveIconOption,
  PriorityLevelOption,
  StatusOption,
  RankOption,
} from "../types/objective";

interface ObjectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (objective: CreateObjectiveRequest) => Promise<void>;
  objective?: CampaignObjective | null;
  isLoading?: boolean;
}

// Icon options with Lucide icons
const iconOptions: ObjectiveIconOption[] = [
  {
    value: "target",
    label: "Target",
    description: "Goal-oriented campaigns",
    icon: "Target",
  },
  {
    value: "users",
    label: "Users",
    description: "User-focused campaigns",
    icon: "Users",
  },
  {
    value: "trending-up",
    label: "Trending Up",
    description: "Growth campaigns",
    icon: "TrendingUp",
  },
  {
    value: "heart",
    label: "Heart",
    description: "Engagement campaigns",
    icon: "Heart",
  },
  {
    value: "zap",
    label: "Zap",
    description: "Quick action campaigns",
    icon: "Zap",
  },
  {
    value: "shield",
    label: "Shield",
    description: "Security campaigns",
    icon: "Shield",
  },
  {
    value: "star",
    label: "Star",
    description: "Premium campaigns",
    icon: "Star",
  },
  {
    value: "flag",
    label: "Flag",
    description: "Milestone campaigns",
    icon: "Flag",
  },
  {
    value: "trophy",
    label: "Trophy",
    description: "Achievement campaigns",
    icon: "Trophy",
  },
  {
    value: "gift",
    label: "Gift",
    description: "Reward campaigns",
    icon: "Gift",
  },
  {
    value: "megaphone",
    label: "Megaphone",
    description: "Promotion campaigns",
    icon: "Megaphone",
  },
  {
    value: "chart-bar",
    label: "Chart Bar",
    description: "Analytics campaigns",
    icon: "ChartBar",
  },
  {
    value: "lightbulb",
    label: "Lightbulb",
    description: "Innovation campaigns",
    icon: "Lightbulb",
  },
  {
    value: "rocket",
    label: "Rocket",
    description: "Launch campaigns",
    icon: "Rocket",
  },
  {
    value: "clock",
    label: "Clock",
    description: "Time-sensitive campaigns",
    icon: "Clock",
  },
  {
    value: "check-circle",
    label: "Check Circle",
    description: "Completion campaigns",
    icon: "CheckCircle",
  },
];

// Priority level options
const priorityOptions: PriorityLevelOption[] = [
  {
    value: "low",
    label: "Low",
    description: "Low priority campaigns",
    color: "#6B7280",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Medium priority campaigns",
    color: "#F59E0B",
  },
  {
    value: "high",
    label: "High",
    description: "High priority campaigns",
    color: "#EF4444",
  },
  {
    value: "critical",
    label: "Critical",
    description: "Critical priority campaigns",
    color: "#DC2626",
  },
];

// Status options
const statusOptions: StatusOption[] = [
  {
    value: "active",
    label: "Active",
    description: "Currently active",
    color: "#10B981",
  },
  {
    value: "inactive",
    label: "Inactive",
    description: "Currently inactive",
    color: "#6B7280",
  },
];

// Rank options (1-5)
const rankOptions: RankOption[] = [
  { value: 1, label: "Rank 1", description: "Lowest priority" },
  { value: 2, label: "Rank 2", description: "Low priority" },
  { value: 3, label: "Rank 3", description: "Medium priority" },
  { value: 4, label: "Rank 4", description: "High priority" },
  { value: 5, label: "Rank 5", description: "Highest priority" },
];

// Icon component mapping
const iconComponents: Record<
  ObjectiveIcon,
  React.ComponentType<{ className?: string }>
> = {
  target: Target,
  users: Users,
  "trending-up": TrendingUp,
  heart: Heart,
  zap: Zap,
  shield: Shield,
  star: Star,
  flag: Flag,
  trophy: Trophy,
  gift: Gift,
  megaphone: Megaphone,
  "chart-bar": ChartBar,
  lightbulb: Lightbulb,
  rocket: Rocket,
  clock: Clock,
  "check-circle": CheckCircle,
};

export default function ObjectiveModal({
  isOpen,
  onClose,
  onSave,
  objective,
  isLoading = false,
}: ObjectiveModalProps) {
  const [formData, setFormData] = useState<CreateObjectiveRequest>({
    name: "",
    description: "",
    icon: "target",
    status: "active",
    priority_level: "medium",
    rank: 3,
    tags: [],
    business_rules: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when modal opens or objective changes
  useEffect(() => {
    if (isOpen) {
      if (objective) {
        setFormData({
          name: objective.name,
          description: objective.description || "",
          icon: objective.icon,
          status: objective.status,
          priority_level: objective.priority_level,
          rank: objective.rank,
          tags: objective.tags,
          business_rules: objective.business_rules || "",
        });
      } else {
        setFormData({
          name: "",
          description: "",
          icon: "target",
          status: "active",
          priority_level: "medium",
          rank: 3,
          tags: [],
          business_rules: "",
        });
      }
      setErrors({});
    }
  }, [isOpen, objective]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Objective name is required";
    }

    if (formData.rank < 1 || formData.rank > 5) {
      newErrors.rank = "Rank must be between 1 and 5";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Failed to save objective:", error);
    }
  };

  const handleInputChange = (
    field: keyof CreateObjectiveRequest,
    value: string | number | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {objective ? "Edit Objective" : "Create New Objective"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Objective Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objective Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Enter objective name..."
                  value={formData.name}
                  onChange={(value) => handleInputChange("name", value)}
                  hasError={!!errors.name}
                  variant="medium"
                />
                {errors.name && (
                  <div className="flex items-center mt-1 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.name}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  rows={3}
                  className={`w-full px-4 py-3 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-[#3b8169] focus:border-transparent`}
                  placeholder="Enter objective description..."
                />
              </div>

              {/* Icon Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {iconOptions.map((option) => {
                    const IconComponent = iconComponents[option.value];
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleInputChange("icon", option.value)}
                        className={`p-3 ${
                          tw.rounded
                        } border-2 transition-all duration-200 flex flex-col items-center space-y-2 ${
                          formData.icon === option.value
                            ? `border-[${color.primary.action}] bg-[${color.primary.action}]20`
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {IconComponent && (
                          <IconComponent className="w-5 h-5 text-gray-600" />
                        )}
                        <span className="text-xs text-gray-600 text-center">
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <HeadlessSelect
                  options={statusOptions.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  value={formData.status}
                  onChange={(value) => handleInputChange("status", value)}
                  placeholder="Select status..."
                  zIndex={zIndex.popover}
                />
              </div>

              {/* Priority Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level
                </label>
                <HeadlessSelect
                  options={priorityOptions.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  value={formData.priority_level}
                  onChange={(value) =>
                    handleInputChange("priority_level", value)
                  }
                  placeholder="Select priority level..."
                />
              </div>

              {/* Rank */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rank (1-5)
                </label>
                <HeadlessSelect
                  options={rankOptions.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  value={formData.rank}
                  onChange={(value) => handleInputChange("rank", Number(value))}
                  placeholder="Select rank..."
                />
                {errors.rank && (
                  <div className="flex items-center mt-1 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.rank}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <TagInput
                  tags={formData.tags}
                  onChange={(tags) => handleInputChange("tags", tags)}
                  placeholder="Add tags..."
                />
              </div>

              {/* Business Rules */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Rules (Optional)
                </label>
                <textarea
                  value={formData.business_rules}
                  onChange={(e) =>
                    handleInputChange("business_rules", e.target.value)
                  }
                  rows={4}
                  className={`w-full px-4 py-3 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-[#3b8169] focus:border-transparent`}
                  placeholder="Enter business rules or guidelines..."
                />
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 text-sm font-medium ${tw.rounded} transition-colors`}
                style={{
                  background: "transparent",
                  color: color.primary.action,
                  border: `1px solid ${color.primary.action}`,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium text-white ${tw.rounded} transition-colors flex items-center justify-center`}
                style={{
                  backgroundColor: color.primary.action,
                  opacity: isLoading ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    (e.target as HTMLButtonElement).style.backgroundColor =
                      color.interactive.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    (e.target as HTMLButtonElement).style.backgroundColor =
                      color.primary.action;
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner
                      variant="modern"
                      size="sm"
                      color="white"
                      className="mr-2"
                    />
                    {objective ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  objective ? "Update" : "Create"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
