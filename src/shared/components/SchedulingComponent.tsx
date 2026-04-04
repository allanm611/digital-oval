import { useState, useEffect } from "react";
import { Calendar, AlertCircle } from "lucide-react";
import { tw } from "../utils/utils";
import HeadlessSelect from "./ui/HeadlessSelect";
import type {
  SchedulingData,
  SchedulingComponentProps,
} from "../types/scheduling";

const daysOfWeek = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default function SchedulingComponent({
  scheduling,
  onSchedulingChange,
  title = "Broadcast Schedule Range",
  subtitle = "Configure your broadcast schedule and delivery settings",
  showPreviewButton = true,
  onPreviewSchedule,
}: SchedulingComponentProps) {
  const [endType, setEndType] = useState<"never" | "at">("never");
  const [startType, setStartType] = useState<"datetime" | "previous">(
    "datetime",
  );

  const [recurrencePattern, setRecurrencePattern] = useState("Weeks");
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [monthlyRule, setMonthlyRule] = useState<
    "first_day" | "last_day" | "day_of_month"
  >("first_day");
  const [monthlyDayOfMonth, setMonthlyDayOfMonth] = useState(1);
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

  // Initialize with defaults if not provided
  useEffect(() => {
    if (!scheduling.start_date) {
      const defaultScheduling = {
        ...scheduling,
        type: scheduling.type || "scheduled",
        time_zone: scheduling.time_zone || "(GMT+02:00) Sudan",
        start_date: new Date().toISOString().split("T")[0],
        end_date: scheduling.end_date || "",
      };
      onSchedulingChange(defaultScheduling);
    }
  }, []);

  useEffect(() => {
    const mappedPattern: "daily" | "weekly" | "monthly" =
      recurrencePattern === "Days"
        ? "daily"
        : recurrencePattern === "Months"
          ? "monthly"
          : "weekly";

    updateScheduling({
      recurrence_pattern: mappedPattern,
      recurrence_interval: recurrenceInterval,
      selected_days: selectedDays,
      monthly_rule: mappedPattern === "monthly" ? monthlyRule : undefined,
      monthly_day_of_month:
        mappedPattern === "monthly" && monthlyRule === "day_of_month"
          ? monthlyDayOfMonth
          : undefined,
    });
  }, [
    recurrencePattern,
    recurrenceInterval,
    selectedDays,
    monthlyRule,
    monthlyDayOfMonth,
  ]);

  const updateScheduling = (updates: Partial<SchedulingData>) => {
    const newScheduling = { ...scheduling, ...updates };
    onSchedulingChange(newScheduling);
  };

  const toggleDayOfWeek = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort(),
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mt-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-600">{subtitle}</p>
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
                <input
                  type="radio"
                  name="startType"
                  value="datetime"
                  checked={startType === "datetime"}
                  onChange={() => setStartType("datetime")}
                  style={{ accentColor: "#00BBCC" }}
                  className="w-4 h-4 border-gray-300 focus:ring-2 focus:ring-[#00BBCC]"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Start date/time
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="startType"
                  value="previous"
                  checked={startType === "previous"}
                  onChange={() => setStartType("previous")}
                  style={{ accentColor: "#00BBCC" }}
                  className="w-4 h-4 border-gray-300 focus:ring-2 focus:ring-[#00BBCC]"
                />
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
                  <input
                    type="date"
                    value={scheduling.start_date?.split("T")[0] || ""}
                    onChange={(e) =>
                      updateScheduling({
                        start_date: e.target.value + "T08:00",
                      })
                    }
                    className={`px-4 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#00BBCC] focus:border-transparent bg-white text-gray-900`}
                    style={{ minWidth: "140px", backgroundColor: "white" }}
                  />
                </div>
                <div className="relative">
                  <input
                    type="time"
                    value="08:00"
                    onChange={(e) =>
                      updateScheduling({
                        start_date:
                          scheduling.start_date?.split("T")[0] +
                            "T" +
                            e.target.value || "T" + e.target.value,
                      })
                    }
                    className={`px-4 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#00BBCC] focus:border-transparent bg-white text-gray-900`}
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
                <input
                  type="radio"
                  name="endType"
                  value="never"
                  checked={endType === "never"}
                  onChange={() => {
                    setEndType("never");
                    updateScheduling({ end_date: "" });
                  }}
                  style={{ accentColor: "#00BBCC" }}
                  className="w-4 h-4 border-gray-300 focus:ring-2 focus:ring-[#00BBCC]"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Never
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="endType"
                  value="at"
                  checked={endType === "at"}
                  onChange={() => {
                    setEndType("at");
                    updateScheduling({ end_date: "2025-12-31T23:59" });
                  }}
                  style={{ accentColor: "#00BBCC" }}
                  className="w-4 h-4 border-gray-300 focus:ring-2 focus:ring-[#00BBCC]"
                />
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
                  <input
                    type="date"
                    value={scheduling.end_date?.split("T")[0] || ""}
                    onChange={(e) =>
                      updateScheduling({ end_date: e.target.value + "T23:59" })
                    }
                    className={`px-4 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#00BBCC] focus:border-transparent bg-white text-gray-900`}
                    style={{ minWidth: "140px", backgroundColor: "white" }}
                  />
                </div>
                <div className="relative">
                  <input
                    type="time"
                    value="23:59"
                    onChange={(e) =>
                      updateScheduling({
                        end_date:
                          scheduling.end_date?.split("T")[0] +
                            "T" +
                            e.target.value || "T" + e.target.value,
                      })
                    }
                    className={`px-4 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#00BBCC] focus:border-transparent bg-white text-gray-900`}
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
              value={scheduling.time_zone || "(GMT+02:00) Sudan"}
              onChange={(value) =>
                updateScheduling({ time_zone: value as string })
              }
              options={[
                { label: "(GMT+02:00) Sudan", value: "(GMT+02:00) Sudan" },
                {
                  label: "UTC (Coordinated Universal Time)",
                  value: "(GMT+00:00) UTC",
                },
                { label: "Eastern Time (ET)", value: "(GMT-05:00) Eastern" },
                { label: "Central Time (CT)", value: "(GMT-06:00) Central" },
                { label: "Paris (CET/CEST)", value: "(GMT+01:00) Paris" },
              ]}
              placeholder="Select timezone"
              className="w-full"
            />
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
                <input
                  type="number"
                  min="1"
                  value={recurrenceInterval}
                  onChange={(e) =>
                    setRecurrenceInterval(Number(e.target.value))
                  }
                  className={`w-16 px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#00BBCC] focus:border-transparent text-center`}
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
              <input
                type="time"
                value={defaultStartTime}
                onChange={(e) => setDefaultStartTime(e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#00BBCC] focus:border-transparent bg-white`}
              />
            </div>
          </div>

          {/* Monthly Rule - shown only for monthly recurrence */}
          {recurrencePattern === "Months" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Rule
                </label>
                <HeadlessSelect
                  value={monthlyRule}
                  onChange={(value) =>
                    setMonthlyRule(
                      value as "first_day" | "last_day" | "day_of_month",
                    )
                  }
                  options={[
                    { label: "First day of month", value: "first_day" },
                    { label: "Last day of month", value: "last_day" },
                    { label: "Day of month", value: "day_of_month" },
                  ]}
                  placeholder="Select monthly rule"
                  className="w-full"
                />
              </div>

              {monthlyRule === "day_of_month" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Day Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={monthlyDayOfMonth}
                    onChange={(e) =>
                      setMonthlyDayOfMonth(
                        Math.max(1, Math.min(31, Number(e.target.value) || 1)),
                      )
                    }
                    className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#00BBCC] focus:border-transparent`}
                  />
                </div>
              )}
            </div>
          )}

          {/* Days of Week */}
          {recurrencePattern !== "Months" && (
            <div className="mb-6">
              <div className="grid grid-cols-7 gap-2">
                {daysOfWeek.map((day) => (
                  <label
                    key={day.value}
                    className="flex items-center justify-center"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDays.includes(day.value)}
                      onChange={() => toggleDayOfWeek(day.value)}
                      style={{ accentColor: "#00BBCC" }}
                      className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-[#00BBCC] mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {day.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Time Zone Display */}
          <div className="mb-6">
            <span className="text-sm text-gray-600">
              {scheduling.time_zone || "(GMT+02:00) Sudan"}
            </span>
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={setSpecificStartTime}
                onChange={(e) => setSetSpecificStartTime(e.target.checked)}
                style={{ accentColor: "#00BBCC" }}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-[#00BBCC]"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">
                Set specific start time for days
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={startDeliveryOnCompletion}
                onChange={(e) => setStartDeliveryOnCompletion(e.target.checked)}
                style={{ accentColor: "#00BBCC" }}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-[#00BBCC]"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">
                Start delivery on completion of specific Broadcasts
              </span>
            </label>
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
              <input
                type="radio"
                name="renderTime"
                value="Pre-Render"
                checked={targetRenderTime === "Pre-Render"}
                onChange={(e) => setTargetRenderTime(e.target.value)}
                style={{ accentColor: "#00BBCC" }}
                className="w-4 h-4 border-gray-300 focus:ring-2 focus:ring-[#00BBCC]"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Pre-Render
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="radio"
                name="renderTime"
                value="Real Time"
                checked={targetRenderTime === "Real Time"}
                onChange={(e) => setTargetRenderTime(e.target.value)}
                style={{ accentColor: "#00BBCC" }}
                className="w-4 h-4 border-gray-300 focus:ring-2 focus:ring-[#00BBCC]"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Real Time
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="radio"
                name="renderTime"
                value="Broadcast Schedule"
                checked={targetRenderTime === "Broadcast Schedule"}
                onChange={(e) => setTargetRenderTime(e.target.value)}
                style={{ accentColor: "#00BBCC" }}
                className="w-4 h-4 border-gray-300 focus:ring-2 focus:ring-[#00BBCC]"
              />
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
                    <input
                      type="time"
                      value="12:00"
                      onChange={(_e) => {
                        // Handle time change
                      }}
                      className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#00BBCC] focus:border-transparent bg-white`}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hours
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={hoursBeforeBroadcast}
                      onChange={(e) =>
                        setHoursBeforeBroadcast(Number(e.target.value))
                      }
                      className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#00BBCC] focus:border-transparent`}
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
            <span className="text-sm text-gray-600">
              {scheduling.time_zone || "(GMT+02:00) Sudan"}
            </span>
          </div>
        </div>
      </div>

      {/* Preview Schedule Button */}
      {showPreviewButton && onPreviewSchedule && (
        <div className="flex justify-center">
          <button
            onClick={onPreviewSchedule}
            className={`inline-flex items-center px-6 py-2 ${tw.rounded} text-sm font-medium text-white bg-[#252829] hover:opacity-90 transition-opacity`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Preview Schedule
          </button>
        </div>
      )}

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
