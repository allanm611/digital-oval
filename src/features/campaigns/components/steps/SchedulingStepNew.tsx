import { useState, useEffect } from "react";
import { Calendar, AlertCircle } from "lucide-react";
import {
  CreateCampaignRequest,
  CampaignScheduling,
} from "../../types/campaign";
import { tw } from "../../../../shared/utils/utils";
import HeadlessSelect from "../../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../../shared/components/ui/Checkbox";
import Radio from "../../../../shared/components/ui/Radio";
import Input from "../../../../shared/components/ui/Input";
import { getSettingsTimezone, TIMEZONE_OPTIONS } from "../../../../shared/utils/settingsHelper";

interface SchedulingStepProps {
  formData: CreateCampaignRequest;
  setFormData: (data: CreateCampaignRequest) => void;
}

const daysOfWeek = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default function SchedulingStep({
  formData,
  setFormData,
}: SchedulingStepProps) {
  const [scheduling, setScheduling] = useState<CampaignScheduling>(
    formData.scheduling || {
      type: "scheduled",
      time_zone: getSettingsTimezone(),
      start_date: new Date().toISOString().split("T")[0], // Today's date
      end_date: "",
    }
  );

  const [endType, setEndType] = useState<"never" | "at">("never");
  const [startType, setStartType] = useState<"datetime" | "previous">(
    "datetime"
  );

  const [recurrencePattern, setRecurrencePattern] = useState("Weeks");
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [defaultStartTime, setDefaultStartTime] = useState("08:00");
  const [selectedDays, setSelectedDays] = useState<number[]>([
    1, 2, 3, 4, 5, 6,
  ]); // Monday to Saturday
  const [setSpecificStartTime, setSetSpecificStartTime] = useState(false);
  const [startDeliveryOnCompletion, setStartDeliveryOnCompletion] =
    useState(false);
  const [targetRenderTime, setTargetRenderTime] = useState("Real Time");
  const [startBroadcastBefore, setStartBroadcastBefore] = useState("Before");
  const [hoursBeforeBroadcast, setHoursBeforeBroadcast] = useState(0);

  // Initialize formData with default scheduling if not present
  useEffect(() => {
    if (!formData.scheduling) {
      const defaultScheduling = {
        type: "scheduled",
        time_zone: getSettingsTimezone(),
        start_date: new Date().toISOString().split("T")[0], // Today's date
        end_date: "",
      };
      setFormData({ ...formData, scheduling: defaultScheduling });
    }
  }, [formData, setFormData]);

  const updateScheduling = (updates: Partial<CampaignScheduling>) => {
    const newScheduling = { ...scheduling, ...updates };
    setScheduling(newScheduling);
    // Also update the formData so validation works
    setFormData({ ...formData, scheduling: newScheduling });
  };

  const toggleDayOfWeek = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mt-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Broadcast Schedule Range
        </h2>
        <p className="text-sm text-gray-600">
          Configure your campaign broadcast schedule and delivery settings
        </p>
      </div>

      {/* Broadcast Schedule Range */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Broadcast Schedule Range
        </h3>

        <div className={`bg-white border border-gray-200 ${tw.rounded} p-6`}>
          {/* Start Options */}
          <div className="mb-6">
            <div className="flex items-center space-x-6 mb-4">
              <label className="flex items-center">
                <Radio name="startType"
                  value="datetime"
                  checked={startType === "datetime"}
                  onChange={() => setStartType("datetime")}
                  className="w-4 h-4 text-[#3b8169] border-gray-300 focus:ring-[#3b8169]" />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Start date/time
                </span>
              </label>
              <label className="flex items-center">
                <Radio name="startType"
                  value="previous"
                  checked={startType === "previous"}
                  onChange={() => setStartType("previous")}
                  className="w-4 h-4 text-[#3b8169] border-gray-300 focus:ring-[#3b8169]" />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Starts when the previous broadcast is aborted
                </span>
              </label>
            </div>
          </div>

          {/* Start Date/Time Input - Only show when datetime is selected */}
          {startType === "datetime" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Start Date/Time
              </label>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Input
                    type="date"
                    value={scheduling.start_date?.split("T")[0] || "2025-09-22"}
                    onChange={(value) =>
                      updateScheduling({
                        start_date: String(value) + "T08:00",
                      })
                    }
                    className={`px-4 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#3b8169] focus:border-transparent bg-white text-gray-900`}
                    style={{ minWidth: "140px", backgroundColor: "white" }}
                  />
                </div>
                <div className="relative">
                  <Input
                    type="time"
                    value="08:00"
                    onChange={(value) =>
                      updateScheduling({
                        start_date:
                          scheduling.start_date?.split("T")[0] +
                            "T" +
                            String(value) || "2025-09-22T" + String(value),
                      })
                    }
                    className={`px-4 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#3b8169] focus:border-transparent bg-white text-gray-900`}
                    style={{ minWidth: "100px", backgroundColor: "white" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* End Options */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              End
            </label>
            <div className="flex items-center space-x-6 mb-4">
              <label className="flex items-center">
                <Radio name="endType"
                  value="never"
                  checked={endType === "never"}
                  onChange={() => {
                    setEndType("never");
                    updateScheduling({ end_date: "" });
                  }}
                  className="w-4 h-4 text-[#3b8169] border-gray-300 focus:ring-[#3b8169]" />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Never
                </span>
              </label>
              <label className="flex items-center">
                <Radio name="endType"
                  value="at"
                  checked={endType === "at"}
                  onChange={() => {
                    setEndType("at");
                    updateScheduling({ end_date: "2025-12-31T23:59" });
                  }}
                  className="w-4 h-4 text-[#3b8169] border-gray-300 focus:ring-[#3b8169]" />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  At
                </span>
              </label>
            </div>
          </div>

          {/* End Date Input (conditional) */}
          {endType === "at" && (
            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Input
                    type="date"
                    value={scheduling.end_date?.split("T")[0] || "2025-12-31"}
                    onChange={(value) =>
                      updateScheduling({ end_date: String(value) + "T23:59" })
                    }
                    className={`px-4 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#3b8169] focus:border-transparent bg-white text-gray-900`}
                    style={{ minWidth: "140px", backgroundColor: "white" }}
                  />
                </div>
                <div className="relative">
                  <Input
                    type="time"
                    value="23:59"
                    onChange={(value) =>
                      updateScheduling({
                        end_date:
                          scheduling.end_date?.split("T")[0] +
                            "T" +
                            String(value) || "2025-12-31T" + String(value),
                      })
                    }
                    className={`px-4 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#3b8169] focus:border-transparent bg-white text-gray-900`}
                    style={{ minWidth: "100px", backgroundColor: "white" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Time Zone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Time Zone
            </label>
            <HeadlessSelect
              value={scheduling.time_zone || getSettingsTimezone()}
              onChange={(value) =>
                updateScheduling({ time_zone: value as string })
              }
              options={TIMEZONE_OPTIONS}
              placeholder="Select timezone"
              searchable={true}
              className="w-full"
            />
            {/* <p className="text-xs text-gray-500 mt-2">
              Using timezone from Settings: {getSettingsTimezone()}
            </p> */}
          </div>
        </div>
      </div>

      {/* Recurrence Pattern and Delivery */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Recurrence Pattern and Delivery
        </h3>

        <div className={`bg-white border border-gray-200 ${tw.rounded} p-6`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Recurrence Pattern */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recurrence Pattern
              </label>
              <HeadlessSelect
                value={recurrencePattern}
                onChange={(value) => setRecurrencePattern(value as string)}
                options={[
                  { label: "Weeks", value: "Weeks" },
                  { label: "Days", value: "Days" },
                  { label: "Months", value: "Months" },
                ]}
                placeholder="Select pattern"
                className="w-full"
              />
            </div>

            {/* Recur Every */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recur Every
              </label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="1"
                  value={recurrenceInterval}
                  onChange={(value) =>
                    setRecurrenceInterval(Number(String(value)))
                  }
                  className={`w-16 px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#3b8169] focus:border-transparent text-center`}
                />
                <span className="text-sm text-gray-600">
                  {recurrencePattern}
                </span>
              </div>
            </div>

            {/* Default Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Start Time
              </label>
              <Input
                type="time"
                value={defaultStartTime}
                onChange={(value) => setDefaultStartTime(String(value))}
                className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#3b8169] focus:border-transparent bg-white`}
              />
            </div>
          </div>

          {/* Days of Week */}
          <div className="mb-6">
            <div className="grid grid-cols-7 gap-2">
              {daysOfWeek.map((day) => (
                <div
                  key={day.value}
                  className="flex items-center justify-center cursor-pointer"
                  onClick={() => toggleDayOfWeek(day.value)}
                >
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={selectedDays.includes(day.value)}
                    onChange={() => toggleDayOfWeek(day.value)}
                  />
                  <span className="text-sm font-medium text-gray-700 ml-2">
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Time Zone Display */}
          <div className="mb-6">
            <span className="text-sm text-gray-600">{scheduling.time_zone || getSettingsTimezone()}</span>
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <div
              className="flex items-center cursor-pointer"
              onClick={() => setSetSpecificStartTime(!setSpecificStartTime)}
            >
              <Checkbox
                id="specific-start-time"
                checked={setSpecificStartTime}
                onChange={() => setSetSpecificStartTime(!setSpecificStartTime)}
              />
              <span className="ml-3 text-sm font-medium text-gray-700">
                Set specific start time for days
              </span>
            </div>

            <div
              className="flex items-center cursor-pointer"
              onClick={() => setStartDeliveryOnCompletion(!startDeliveryOnCompletion)}
            >
              <Checkbox
                id="delivery-on-completion"
                checked={startDeliveryOnCompletion}
                onChange={() => setStartDeliveryOnCompletion(!startDeliveryOnCompletion)}
              />
              <span className="ml-3 text-sm font-medium text-gray-700">
                Start delivery on completion of specific Broadcasts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Target Render Time */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Target Render Time
        </h3>

        <div className={`bg-white border border-gray-200 ${tw.rounded} p-6`}>
          <div className="flex items-center space-x-8 mb-6">
            <label className="flex items-center">
              <Radio name="renderTime"
                value="Pre-Render"
                checked={targetRenderTime === "Pre-Render"}
                onChange={(value) => setTargetRenderTime(String(value))}
                className="w-4 h-4 text-[#3b8169] border-gray-300 focus:ring-[#3b8169]" />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Pre-Render
              </span>
            </label>

            <label className="flex items-center">
              <Radio name="renderTime"
                value="Real Time"
                checked={targetRenderTime === "Real Time"}
                onChange={(value) => setTargetRenderTime(String(value))}
                className="w-4 h-4 text-[#3b8169] border-gray-300 focus:ring-[#3b8169]" />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Real Time
              </span>
            </label>

            <label className="flex items-center">
              <Radio name="renderTime"
                value="Broadcast Schedule"
                checked={targetRenderTime === "Broadcast Schedule"}
                onChange={(value) => setTargetRenderTime(String(value))}
                className="w-4 h-4 text-[#3b8169] border-gray-300 focus:ring-[#3b8169]" />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Broadcast Schedule
              </span>
            </label>
          </div>

          {targetRenderTime === "Broadcast Schedule" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start broadcasts
                  </label>
                  <HeadlessSelect
                    value={startBroadcastBefore}
                    onChange={(value) =>
                      setStartBroadcastBefore(value as string)
                    }
                    options={[
                      { label: "Before", value: "Before" },
                      { label: "After", value: "After" },
                      { label: "At", value: "At" },
                    ]}
                    placeholder="Select timing"
                    className="w-full"
                  />
                </div>

                {startBroadcastBefore === "At" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time
                    </label>
                    <Input
                      type="time"
                      value="12:00"
                      onChange={(_e) => {
                        // Handle time change
                      }}
                      className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#3b8169] focus:border-transparent bg-white`}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hours
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={hoursBeforeBroadcast}
                      onChange={(value) =>
                        setHoursBeforeBroadcast(Number(String(value)))
                      }
                      className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#3b8169] focus:border-transparent`}
                    />
                  </div>
                )}
              </div>

              {startBroadcastBefore !== "At" && (
                <div className="text-right">
                  <span className="text-sm text-gray-600">
                    from broadcast send time
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Time Zone Display for Target Render Time */}
          <div className="mt-4">
            <span className="text-sm text-gray-600">(GMT+02:00) Sudan</span>
          </div>
        </div>
      </div>

      {/* Preview Schedule Button */}
      <div className="flex justify-center">
        <button
          className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium transition-colors ${tw.button.primary}`}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Preview Schedule
        </button>
      </div>

      {/* Validation Warning */}
      {(!scheduling.start_date || scheduling.start_date === "") && (
        <div
          className={`bg-amber-50 border border-amber-200 ${tw.rounded} p-4`}
        >
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-900">
                Start Date Required
              </h4>
              <p className="text-sm text-amber-700 mt-1">
                Please set a start date for your broadcast schedule.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
