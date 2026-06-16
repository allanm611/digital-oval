import React from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  CommunicationPolicyConfiguration,
  TimeWindowConfig,
  MaximumCommunicationConfig,
  DNDConfig,
  VIPListConfig,
  DNDCategory,
  DND_CATEGORIES,
  DAYS_OF_WEEK,
} from "../types/communicationPolicyConfig";
import { color, tw, components } from "../../../shared/utils/utils";
import Input from "../../../shared/components/ui/Input";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../shared/components/ui/Checkbox";

type PolicyConfig =
  | TimeWindowConfig
  | MaximumCommunicationConfig
  | DNDConfig
  | VIPListConfig;

interface PolicyCustomizationPanelProps {
  policy: CommunicationPolicyConfiguration;
  config: PolicyConfig;
  onConfigChange: (newConfig: PolicyConfig) => void;
}

export default function PolicyCustomizationPanel({
  policy,
  config,
  onConfigChange,
}: PolicyCustomizationPanelProps) {
  const renderTimeWindowCustomization = () => {
    const timeConfig = config as TimeWindowConfig;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block ${tw.label} ${tw.textSecondary} mb-2`}>
              Start Time
            </label>
            <Input
              type="time"
              value={timeConfig.startTime}
              onChange={(value) =>
                onConfigChange({ ...timeConfig, startTime: String(value) })
              }
              className={`${components.input.default} w-full px-3 py-2`}
            />
          </div>
          <div>
            <label className={`block ${tw.label} ${tw.textSecondary} mb-2`}>
              End Time
            </label>
            <Input
              type="time"
              value={timeConfig.endTime}
              onChange={(value) =>
                onConfigChange({ ...timeConfig, endTime: String(value) })
              }
              className={`${components.input.default} w-full px-3 py-2`}
            />
          </div>
        </div>
        <div>
          <label className={`block ${tw.label} ${tw.textSecondary} mb-2`}>
            Days of Week (optional)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day.value}
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => {
                  const days = timeConfig.days || [];
                  const newDays = days.includes(day.value)
                    ? days.filter((d) => d !== day.value)
                    : [...days, day.value];
                  onConfigChange({ ...timeConfig, days: newDays });
                }}
              >
                <Checkbox
                  id={`day-${day.value}`}
                  checked={timeConfig.days?.includes(day.value) || false}
                  onChange={() => {
                    const days = timeConfig.days || [];
                    const newDays = days.includes(day.value)
                      ? days.filter((d) => d !== day.value)
                      : [...days, day.value];
                    onConfigChange({ ...timeConfig, days: newDays });
                  }}
                  className={`rounded ${tw.borderDefault} focus:ring-2 focus:ring-[${color.primary.action}] text-[${color.primary.action}]`}
                  style={
                    {
                      accentColor: color.primary.action,
                      "--tw-ring-color": color.primary.action,
                    } as React.CSSProperties
                  } />
                <span className={`${tw.caption} ${tw.textSecondary}`}>
                  {day.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderMaxCommunicationCustomization = () => {
    const maxConfig = config as MaximumCommunicationConfig;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <HeadlessSelect
            label="Period Type"
            value={maxConfig.type}
            onChange={(value) =>
              onConfigChange({
                ...maxConfig,
                type: value as "daily" | "weekly" | "monthly",
              })
            }
            options={[
              { label: "Daily Maximum", value: "daily" },
              { label: "Weekly Maximum", value: "weekly" },
              { label: "Monthly Maximum", value: "monthly" },
            ]}
            placeholder="Select period type"
            className="w-full"
          />
          <div>
            <label className={`block ${tw.label} ${tw.textSecondary} mb-2`}>
              Maximum Count
            </label>
            <Input
              type="number"
              min="1"
              value={maxConfig.maxCount}
              onChange={(value) =>
                onConfigChange({
                  ...maxConfig,
                  maxCount: parseInt(String(value)) || 1,
                })
              }
              className={`${components.input.default} w-full px-3 py-2`}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderDNDCustomization = () => {
    const dndConfig = config as DNDConfig;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h5 className={`${tw.body} font-medium ${tw.textPrimary}`}>
            DND Categories
          </h5>
          <button
            type="button"
            onClick={() => {
              const newCategory: DNDCategory = {
                id: Date.now().toString(),
                name: "",
                type: "marketing",
                status: "stop",
              };
              onConfigChange({
                ...dndConfig,
                categories: [...dndConfig.categories, newCategory],
              });
            }}
            className={`${tw.button} flex items-center gap-1 text-xs px-3 py-1`}
          >
            <Plus className="w-3 h-3" />
            Add Category
          </button>
        </div>
        <div className="space-y-3">
          {dndConfig.categories.map((category, index) => (
            <div
              key={category.id}
              className={`p-3 ${tw.borderDefault} border ${tw.rounded}`}
            >
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label
                    className={`block ${tw.label} ${tw.textSecondary} mb-1`}
                  >
                    Category Name
                  </label>
                  <Input
                    placeholder="Enter category name"
                    value={category.name}
                    onChange={(value) => {
                      const newCategories = [...dndConfig.categories];
                      newCategories[index] = {
                        ...category,
                        name: value,
                      };
                      onConfigChange({
                        ...dndConfig,
                        categories: newCategories,
                      });
                    }}
                    variant="compact"
                  />
                </div>
                <HeadlessSelect
                  label="Type"
                  value={category.type}
                  onChange={(value) => {
                    const newCategories = [...dndConfig.categories];
                    newCategories[index] = {
                      ...category,
                      type: value as DNDCategory["type"],
                    };
                    onConfigChange({
                      ...dndConfig,
                      categories: newCategories,
                    });
                  }}
                  options={DND_CATEGORIES.map((cat) => ({
                    label: cat.label,
                    value: cat.type,
                  }))}
                  placeholder="Select type"
                  className="w-full"
                />
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <HeadlessSelect
                      label="Status"
                      value={category.status}
                      onChange={(value) => {
                        const newCategories = [...dndConfig.categories];
                        newCategories[index] = {
                          ...category,
                          status: value as "stop" | "subscribe",
                        };
                        onConfigChange({
                          ...dndConfig,
                          categories: newCategories,
                        });
                      }}
                      options={[
                        { label: "Stop", value: "stop" },
                        { label: "Subscribe", value: "subscribe" },
                      ]}
                      placeholder="Select status"
                      className="w-full"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newCategories = dndConfig.categories.filter(
                        (_, i) => i !== index
                      );
                      onConfigChange({
                        ...dndConfig,
                        categories: newCategories,
                      });
                    }}
                    className={`p-1 ${tw.danger} ${tw.statusDanger10} rounded`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {dndConfig.categories.length === 0 && (
            <p className={`${tw.caption} ${tw.textMuted} text-center py-4`}>
              No DND categories configured. Click "Add Category" to get started.
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderVIPListCustomization = () => {
    const vipConfig = config as VIPListConfig;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <HeadlessSelect
            label="Action"
            value={vipConfig.action}
            onChange={(value) =>
              onConfigChange({
                ...vipConfig,
                action: value as "include" | "exclude",
              })
            }
            options={[
              { label: "Include VIP List", value: "include" },
              { label: "Exclude VIP List", value: "exclude" },
            ]}
            placeholder="Select action"
            className="w-full"
          />
          <div>
            <label className={`block ${tw.label} ${tw.textSecondary} mb-2`}>
              Priority
            </label>
            <Input
              type="number"
              min="1"
              value={vipConfig.priority || 1}
              onChange={(value) =>
                onConfigChange({
                  ...vipConfig,
                  priority: parseInt(String(value)) || 1,
                })
              }
              className={`${components.input.default} w-full px-3 py-2`}
            />
          </div>
        </div>
        <div>
          <p className={`${tw.caption} ${tw.textMuted}`}>
            VIP lists will be managed separately. This configuration defines how
            VIP customers are handled in campaigns.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {policy.type === "timeWindow" && renderTimeWindowCustomization()}
      {policy.type === "maximumCommunication" &&
        renderMaxCommunicationCustomization()}
      {policy.type === "dnd" && renderDNDCustomization()}
      {policy.type === "vipList" && renderVIPListCustomization()}
    </div>
  );
}
