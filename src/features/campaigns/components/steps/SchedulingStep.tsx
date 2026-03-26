import { useState, useEffect } from "react";
import { Calendar, AlertCircle, Trash2, X } from "lucide-react";
import { CampaignScheduling } from "../../types/campaign";
import { color , tw} from "../../../../shared/utils/utils";
import { buttons } from "../../../../shared/utils/tokens";
import HeadlessSelect from "../../../../shared/components/ui/HeadlessSelect";
import { CreateCampaignRequest } from "../../types/createCampaign";

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
    formData.scheduling && formData.scheduling.type
      ? formData.scheduling as CampaignScheduling
      : {
          type: "scheduled",
          time_zone: "(GMT+02:00) Sudan",
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
  const [autoPreRender, setAutoPreRender] = useState(true);
  const [preRenderHours, setPreRenderHours] = useState(24);
  const [startBroadcastBefore, setStartBroadcastBefore] = useState("Before");
  const [hoursBeforeBroadcast, setHoursBeforeBroadcast] = useState(0);
  const [atTime, setAtTime] = useState("12:00");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("23:59");
  const [showPreview, setShowPreview] = useState(false);

  // For "Set specific start time for days" — day of week + time entries
  const [dayTimeEntries, setDayTimeEntries] = useState<
    { id: string; dayOfWeek: number; time: string }[]
  >([{ id: crypto.randomUUID(), dayOfWeek: 0, time: "08:00" }]); // Start with Sunday

  // For "Months" pattern — month + time entries
  const [monthTimeEntries, setMonthTimeEntries] = useState<
    { id: string; month: number; time: string }[]
  >([{ id: crypto.randomUUID(), month: 0, time: "08:00" }]); // Start with January

  const monthsOfYear = [
    { value: 0, label: "January" },
    { value: 1, label: "February" },
    { value: 2, label: "March" },
    { value: 3, label: "April" },
    { value: 4, label: "May" },
    { value: 5, label: "June" },
    { value: 6, label: "July" },
    { value: 7, label: "August" },
    { value: 8, label: "September" },
    { value: 9, label: "October" },
    { value: 10, label: "November" },
    { value: 11, label: "December" },
  ];

  // Initialize formData with default scheduling if not present
  useEffect(() => {
    if (!formData.scheduling) {
      const defaultScheduling: CampaignScheduling = {
        type: "scheduled",
        time_zone: "(GMT+02:00) Sudan",
        start_date: new Date().toISOString().split("T")[0], // Today's date
        end_date: "",
      };
      setFormData({ ...formData, scheduling: defaultScheduling });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Day+Time entry handlers
  const addDayTimeEntry = () => {
    const selectedDaysInEntries = dayTimeEntries.map((e) => e.dayOfWeek);
    const nextAvailableDay = daysOfWeek.find(
      (day) => !selectedDaysInEntries.includes(day.value)
    )?.value ?? 0;
    setDayTimeEntries((prev) => [
      ...prev,
      { id: crypto.randomUUID(), dayOfWeek: nextAvailableDay, time: "08:00" },
    ]);
  };

  const removeDayTimeEntry = (id: string) =>
    setDayTimeEntries((prev) => prev.filter((e) => e.id !== id));

  const updateDayTimeEntry = (
    id: string,
    field: "dayOfWeek" | "time",
    value: string | number
  ) =>
    setDayTimeEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );

  // Month+Time entry handlers
  const addMonthTimeEntry = () => {
    const selectedMonthsInEntries = monthTimeEntries.map((e) => e.month);
    const nextAvailableMonth = monthsOfYear.find(
      (month) => !selectedMonthsInEntries.includes(month.value)
    )?.value ?? 0;
    setMonthTimeEntries((prev) => [
      ...prev,
      { id: crypto.randomUUID(), month: nextAvailableMonth, time: "08:00" },
    ]);
  };

  const removeMonthTimeEntry = (id: string) =>
    setMonthTimeEntries((prev) => prev.filter((e) => e.id !== id));

  const updateMonthTimeEntry = (
    id: string,
    field: "month" | "time",
    value: string | number
  ) =>
    setMonthTimeEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );

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
                <input
                  type="radio"
                  name="startType"
                  value="datetime"
                  checked={startType === "datetime"}
                  onChange={() => setStartType("datetime")}
                  className="w-4 h-4 text-[#3b8169] border-gray-300 focus:ring-[#3b8169]"
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
                  className="w-4 h-4 text-[#3b8169] border-gray-300 focus:ring-[#3b8169]"
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
                    value={scheduling.start_date?.split("T")[0] || "2025-09-22"}
                    onChange={(e) =>
                      updateScheduling({
                        start_date: e.target.value + "T08:00",
                      })
                    }
                    className={`px-4 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#3b8169] focus:border-transparent bg-white text-gray-900`}
                    style={{ minWidth: "140px", backgroundColor: "white" }}
                  />
                </div>
                <div className="relative">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      const date = scheduling.start_date?.split("T")[0] || new Date().toISOString().split("T")[0];
                      updateScheduling({
                        start_date: date + "T" + e.target.value,
                      });
                    }}
                    disabled={false}
                    className={`px-4 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#3b8169] focus:border-transparent bg-white text-gray-900 cursor-pointer`}
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
                  className="w-4 h-4 text-[#3b8169] border-gray-300 focus:ring-[#3b8169]"
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
                  className="w-4 h-4 text-[#3b8169] border-gray-300 focus:ring-[#3b8169]"
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
                    value={scheduling.end_date?.split("T")[0] || "2025-12-31"}
                    onChange={(e) =>
                      updateScheduling({ end_date: e.target.value + "T23:59" })
                    }
                    className={`px-4 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#3b8169] focus:border-transparent bg-white text-gray-900`}
                    style={{ minWidth: "140px", backgroundColor: "white" }}
                  />
                </div>
                <div className="relative">
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      updateScheduling({
                        end_date:
                          scheduling.end_date?.split("T")[0] +
                            "T" +
                            e.target.value || "2025-12-31T" + e.target.value,
                      })
                    }}
                    disabled={false}
                    className={`px-4 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#3b8169] focus:border-transparent bg-white text-gray-900 cursor-pointer`}
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
              value={scheduling.time_zone}
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
              <input
                type="time"
                value={defaultStartTime}
                onChange={(e) => setDefaultStartTime(e.target.value)}
                disabled={false}
                className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#3b8169] focus:border-transparent bg-white cursor-pointer`}
              />
            </div>
          </div>

          {/* Days of Week - Only show when Weeks pattern is selected */}
          {recurrencePattern === "Weeks" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Days of Week
              </label>
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
                      className="w-4 h-4 text-[#3b8169] border-gray-300 rounded focus:ring-[#3b8169] mr-2"
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
            <span className="text-sm text-gray-600">(GMT+02:00) Sudan</span>
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            {/* Checkbox only shows for Days and Months patterns */}
            {(recurrencePattern === "Days" || recurrencePattern === "Months") && (
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={setSpecificStartTime}
                  onChange={(e) => setSetSpecificStartTime(e.target.checked)}
                  className="w-4 h-4 text-[#3b8169] border-gray-300 rounded focus:ring-[#3b8169]"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">
                  Set specific start time for {recurrencePattern.toLowerCase()}
                </span>
              </label>
            )}

            {/* Days Pattern - Day + Time Entries */}
            {setSpecificStartTime && recurrencePattern === "Days" && (
              <div className="mt-4 space-y-3">
                {dayTimeEntries.map((entry) => {
                  // Filter out days that are already selected in other entries
                  const selectedDaysInEntries = dayTimeEntries
                    .filter((e) => e.id !== entry.id)
                    .map((e) => e.dayOfWeek);
                  const availableDays = daysOfWeek.filter(
                    (day) => !selectedDaysInEntries.includes(day.value)
                  );

                  return (
                    <div key={entry.id} className="flex items-center gap-3">
                      <HeadlessSelect
                        value={String(entry.dayOfWeek)}
                        onChange={(value) =>
                          updateDayTimeEntry(
                            entry.id,
                            "dayOfWeek",
                            Number(value)
                          )
                        }
                        options={availableDays.map((day) => ({
                          label: day.label,
                          value: String(day.value),
                        }))}
                        placeholder="Select day"
                        className="flex-1 max-w-xs"
                      />
                      <input
                        type="time"
                        value={entry.time}
                        onChange={(e) =>
                          updateDayTimeEntry(entry.id, "time", e.target.value)
                        }
                        className={`w-32 px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#3b8169] focus:border-transparent bg-white text-gray-900`}
                      />
                      <button
                        onClick={() => removeDayTimeEntry(entry.id)}
                        disabled={dayTimeEntries.length === 1}
                        className={`p-2 rounded transition-colors ${
                          dayTimeEntries.length === 1
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-red-600 hover:bg-red-50 cursor-pointer"
                        }`}
                        title={
                          dayTimeEntries.length === 1
                            ? "Must have at least one entry"
                            : "Delete this entry"
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={addDayTimeEntry}
                  disabled={dayTimeEntries.length >= 7}
                  style={{
                    background: dayTimeEntries.length >= 7 ? "#D1D5DB" : buttons.action.background,
                    color: buttons.action.color,
                    padding: `${buttons.action.paddingY} ${buttons.action.paddingX}`,
                    borderRadius: buttons.action.borderRadius,
                    fontSize: buttons.action.fontSize,
                    fontWeight: 500,
                    border: "none",
                    cursor: dayTimeEntries.length >= 7 ? "not-allowed" : "pointer",
                  }}
                  className=""
                  title={dayTimeEntries.length >= 7 ? "All days selected" : ""}
                >
                  Add
                </button>
              </div>
            )}

            {/* Months Pattern - Month + Time Entries */}
            {setSpecificStartTime && recurrencePattern === "Months" && (
              <div className="mt-4 space-y-3">
                {monthTimeEntries.map((entry) => {
                  // Filter out months that are already selected in other entries
                  const selectedMonthsInEntries = monthTimeEntries
                    .filter((e) => e.id !== entry.id)
                    .map((e) => e.month);
                  const availableMonths = monthsOfYear.filter(
                    (month) => !selectedMonthsInEntries.includes(month.value)
                  );

                  return (
                    <div key={entry.id} className="flex items-center gap-3">
                      <HeadlessSelect
                        value={String(entry.month)}
                        onChange={(value) =>
                          updateMonthTimeEntry(
                            entry.id,
                            "month",
                            Number(value)
                          )
                        }
                        options={availableMonths.map((month) => ({
                          label: month.label,
                          value: String(month.value),
                        }))}
                        placeholder="Select month"
                        className="flex-1 max-w-xs"
                      />
                      <input
                        type="time"
                        value={entry.time}
                        onChange={(e) =>
                          updateMonthTimeEntry(entry.id, "time", e.target.value)
                        }
                        className={`w-32 px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#3b8169] focus:border-transparent bg-white text-gray-900`}
                      />
                      <button
                        onClick={() => removeMonthTimeEntry(entry.id)}
                        disabled={monthTimeEntries.length === 1}
                        className={`p-2 rounded transition-colors ${
                          monthTimeEntries.length === 1
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-red-600 hover:bg-red-50 cursor-pointer"
                        }`}
                        title={
                          monthTimeEntries.length === 1
                            ? "Must have at least one entry"
                            : "Delete this entry"
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={addMonthTimeEntry}
                  disabled={monthTimeEntries.length >= 12}
                  style={{
                    background: monthTimeEntries.length >= 12 ? "#D1D5DB" : buttons.action.background,
                    color: buttons.action.color,
                    padding: `${buttons.action.paddingY} ${buttons.action.paddingX}`,
                    borderRadius: buttons.action.borderRadius,
                    fontSize: buttons.action.fontSize,
                    fontWeight: 500,
                    border: "none",
                    cursor: monthTimeEntries.length >= 12 ? "not-allowed" : "pointer",
                  }}
                  className=""
                  title={monthTimeEntries.length >= 12 ? "All months selected" : ""}
                >
                  Add
                </button>
              </div>
            )}

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={startDeliveryOnCompletion}
                onChange={(e) => setStartDeliveryOnCompletion(e.target.checked)}
                className="w-4 h-4 text-[#3b8169] border-gray-300 rounded focus:ring-[#3b8169]"
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
                className="w-4 h-4 text-[#3b8169] border-gray-300 focus:ring-[#3b8169]"
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
                className="w-4 h-4 text-[#3b8169] border-gray-300 focus:ring-[#3b8169]"
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
                className="w-4 h-4 text-[#3b8169] border-gray-300 focus:ring-[#3b8169]"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Broadcast Schedule
              </span>
            </label>
          </div>

          {targetRenderTime === "Pre-Render" && (
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={autoPreRender}
                  onChange={(e) => setAutoPreRender(e.target.checked)}
                  className="w-4 h-4 text-[#3b8169] border-gray-300 focus:ring-[#3b8169]"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Automatic
                </span>
              </label>

              {!autoPreRender && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pre-render hours before scheduled send time
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="168"
                      value={preRenderHours}
                      onChange={(e) => setPreRenderHours(Number(e.target.value))}
                      className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#3b8169] focus:border-transparent`}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

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
                      value={atTime}
                      onChange={(e) => {
                        setAtTime(e.target.value);
                        const date = scheduling.start_date?.split("T")[0] || new Date().toISOString().split("T")[0];
                        updateScheduling({ start_date: date + "T" + e.target.value });
                      }}
                      disabled={false}
                      className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#3b8169] focus:border-transparent bg-white cursor-pointer`}
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
          onClick={() => setShowPreview(true)}
          className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium transition-colors text-white hover:opacity-90`}
          style={{ backgroundColor: color.primary.action }}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Preview Schedule
        </button>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`bg-white ${tw.rounded} p-8 max-w-md w-full mx-4 shadow-lg relative`}>
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Preview</h3>
            <div className="space-y-3 mb-6">
              <div>
                <p className="text-xs text-gray-600">Start Date</p>
                <p className="text-sm font-medium text-gray-900">{scheduling.start_date || "Not set"}</p>
              </div>
              {scheduling.end_date && (
                <div>
                  <p className="text-xs text-gray-600">End Date</p>
                  <p className="text-sm font-medium text-gray-900">{scheduling.end_date}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-600">Recurrence Pattern</p>
                <p className="text-sm font-medium text-gray-900">{recurrencePattern}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Target Render Time</p>
                <p className="text-sm font-medium text-gray-900">{targetRenderTime}</p>
              </div>
              {targetRenderTime === "Pre-Render" && (
                <div>
                  <p className="text-xs text-gray-600">Pre-Render Setting</p>
                  <p className="text-sm font-medium text-gray-900">
                    {autoPreRender ? "Automatic (backend will set)" : `${preRenderHours} hours before send`}
                  </p>
                </div>
              )}
              {targetRenderTime === "Broadcast Schedule" && (
                <div>
                  <p className="text-xs text-gray-600">Broadcast Timing</p>
                  <p className="text-sm font-medium text-gray-900">
                    {startBroadcastBefore === "At" ? `At ${atTime}` : `${startBroadcastBefore} ${hoursBeforeBroadcast} hours`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Validation Warning */}
      {(!scheduling.start_date || scheduling.start_date === "") && (
        <div className={`bg-amber-50 border border-amber-200 ${tw.rounded} p-4`}>
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
