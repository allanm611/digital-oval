import { useState, useEffect, useRef } from "react";
import { Calendar, AlertCircle, Trash2, Bell } from "lucide-react";
import { tw, color } from "../utils/utils";
import { buttons } from "../utils/tokens";
import Input from "./ui/Input";
import HeadlessSelect from "./ui/HeadlessSelect";
import type {
  SchedulingData,
  SchedulingComponentProps,
} from "../types/scheduling";
import Checkbox from "./ui/Checkbox";
import Radio from "./ui/Radio";
import { getSettingsTimezone } from "../utils/settingsHelper";
import { timezoneService } from "../../features/configurations/services/timezoneService";
import type { TimeZone } from "../../features/configurations/types/timezone";
import {
  convertWallClockBetweenOffsets,
  shiftClockTime,
} from "../utils/wallClockTimezone";

interface NotificationPreference {
  stage: string;
  channels: ('email' | 'sms' | 'in_app' | 'platform')[];
}

const executionStages = [
  { id: 'target_rendering', label: 'Target Rendering Started' },
  { id: 'delivery_started', label: 'Delivery Started' },
  { id: 'delivery_completed', label: 'Delivery Completed' },
  { id: 'campaign_failed', label: 'Campaign Failed' },
  { id: 'campaign_paused', label: 'Campaign Paused' },
];

const notificationChannels = [
  { id: 'email', label: 'Email' },
  { id: 'sms', label: 'SMS' },
  { id: 'in_app', label: 'In-App' },
  { id: 'platform', label: 'Platform Notification' },
];

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
  const [endType, setEndType] = useState<"never" | "at">(
    scheduling?.end_date ? "at" : "never",
  );
  const [startType, setStartType] = useState<"datetime" | "previous">(
    scheduling?.start_type === "previous" ? "previous" : "datetime",
  );

  const [recurrencePattern, setRecurrencePattern] = useState(
    scheduling?.recurrence_pattern === "daily"
      ? "Days"
      : scheduling?.recurrence_pattern === "monthly"
        ? "Months"
        : "Weeks",
  );
  const [recurrenceInterval, setRecurrenceInterval] = useState(
    typeof scheduling?.recurrence_interval === "number"
      ? scheduling.recurrence_interval
      : 1,
  );
  const [monthlyRule, setMonthlyRule] = useState<
    "first_day" | "last_day" | "day_of_month"
  >("first_day");
  const [monthlyDayOfMonth, setMonthlyDayOfMonth] = useState(1);
  const [defaultStartTime, setDefaultStartTime] = useState(
    (typeof scheduling?.default_start_time === "string" &&
      scheduling.default_start_time) ||
      (typeof scheduling?.start_time === "string" && scheduling.start_time) ||
      "08:00",
  );
  const [selectedDays, setSelectedDays] = useState<number[]>(
    Array.isArray(scheduling?.selected_days) && scheduling.selected_days.length > 0
      ? scheduling.selected_days
      : [1, 2, 3, 4, 5, 6],
  );
  const [setSpecificStartTime, setSetSpecificStartTime] = useState(false);
  const [specificDayStartTimes, setSpecificDayStartTimes] = useState<
    Array<{ id: number; day: number; time: string }>
  >([{ id: 1, day: 1, time: "08:00" }]);
  const [startDeliveryOnCompletion, setStartDeliveryOnCompletion] =
    useState(false);
  const [targetRenderTime, setTargetRenderTime] = useState(
    typeof scheduling?.target_render_time === "string"
      ? scheduling.target_render_time
      : "Real Time",
  );
  const [startBroadcastBefore, setStartBroadcastBefore] = useState("Before");
  const [hoursBeforeBroadcast, setHoursBeforeBroadcast] = useState(0);
  const [broadcastStartTime, setBroadcastStartTime] = useState("12:00");

  // Notification preferences state
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreference[]>(
    (scheduling?.notification_preferences as NotificationPreference[]) || []
  );

  // Timezone state - fetch from API
  const [timezoneList, setTimezoneList] = useState<TimeZone[]>([]);
  const [timezonesLoading, setTimezonesLoading] = useState(true);

  // Prevent re-initialization loop
  const initializedRef = useRef(false);
  const schedulingRef = useRef(scheduling);
  schedulingRef.current = scheduling;
  const onSchedulingChangeRef = useRef(onSchedulingChange);
  onSchedulingChangeRef.current = onSchedulingChange;

  // Fetch timezones from API
  useEffect(() => {
    const loadTimezones = async () => {
      try {
        setTimezonesLoading(true);
        const data = await timezoneService.getTimezones();
        if (Array.isArray(data)) {
          const activeTimezones = data.filter((tz) => tz && tz.is_active === true);
          setTimezoneList(activeTimezones);
        } else {
          setTimezoneList([]);
        }
      } catch (error) {
        console.error("Failed to load timezones:", error);
        setTimezoneList([]);
      } finally {
        setTimezonesLoading(false);
      }
    };
    loadTimezones();
  }, []);

  // Initialize with defaults if not provided (mount-only)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const current = schedulingRef.current;
    if (!current || !current.start_date || !current.time_zone) {
      const settingsTimezone = getSettingsTimezone();
      const time =
        (typeof current?.start_time === "string" && current.start_time.slice(0, 5)) ||
        "08:00";
      const datePart =
        current?.start_date?.split("T")[0] ||
        new Date().toISOString().split("T")[0];
      const startDate = current?.start_date?.includes("T")
        ? current.start_date
        : `${datePart}T${time}`;
      updateScheduling({
        type: current?.type || "scheduled",
        time_zone: current?.time_zone || settingsTimezone,
        start_date: startDate,
        start_time: startDate.split("T")[1]?.slice(0, 5) || time,
        end_date: current?.end_date || "",
      });
    }
  }, []);

  // Stamp the IANA zone and its UTC offset once the timezone catalog loads.
  useEffect(() => {
    if (timezoneList.length === 0) return;
    const current = schedulingRef.current;
    const zone = current?.time_zone || getSettingsTimezone();
    const selected = timezoneList.find((tz) => tz.value === zone);
    if (!selected?.utc_offset) return;
    if (
      current?.time_zone === zone &&
      current?.time_zone_offset === selected.utc_offset
    ) {
      return;
    }
    updateScheduling({
      time_zone: zone,
      time_zone_offset: selected.utc_offset,
    });
  }, [timezoneList]);

  const notificationsReadyRef = useRef(false);
  // Push notification edits after the first paint so a saved selection is not cleared.
  useEffect(() => {
    if (!notificationsReadyRef.current) {
      notificationsReadyRef.current = true;
      return;
    }
    updateScheduling({ notification_preferences: notificationPreferences });
  }, [notificationPreferences]);

  useEffect(() => {
    if (!scheduling) return;

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
      default_start_time: defaultStartTime,
      start_type: startType,
      target_render_time: targetRenderTime,
      monthly_rule:
        mappedPattern === "monthly" && setSpecificStartTime
          ? monthlyRule
          : undefined,
      monthly_day_of_month:
        mappedPattern === "monthly" &&
        setSpecificStartTime &&
        monthlyRule === "day_of_month"
          ? monthlyDayOfMonth
          : undefined,
      set_specific_start_time:
        mappedPattern === "daily" ? setSpecificStartTime : undefined,
      specific_day_start_times:
        mappedPattern === "daily" && setSpecificStartTime
          ? specificDayStartTimes.map((entry) => ({
              day: entry.day,
              time: entry.time,
            }))
          : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    recurrencePattern,
    recurrenceInterval,
    selectedDays,
    monthlyRule,
    monthlyDayOfMonth,
    setSpecificStartTime,
    specificDayStartTimes,
    defaultStartTime,
    startType,
    targetRenderTime,
  ]);

  useEffect(() => {
    if (
      recurrencePattern !== "Days" &&
      recurrencePattern !== "Months" &&
      setSpecificStartTime
    ) {
      setSetSpecificStartTime(false);
    }
  }, [recurrencePattern, setSpecificStartTime]);

  const getDayOptionsForRow = (rowId: number) => {
    const selectedByOtherRows = new Set(
      specificDayStartTimes
        .filter((entry) => entry && entry.id !== rowId)
        .map((entry) => entry && entry.day)
        .filter(Boolean),
    );

    return daysOfWeek
      .filter((day) => !selectedByOtherRows.has(day.value))
      .map((day) => ({ label: day.label, value: day.value }));
  };

  function updateScheduling(updates: Partial<SchedulingData>) {
    const base = schedulingRef.current || {};
    const newScheduling = { ...base, ...updates };
    schedulingRef.current = newScheduling;
    onSchedulingChangeRef.current(newScheduling);
  }

  const toggleDayOfWeek = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort(),
    );
  };

  const addSpecificDayRow = () => {
    setSpecificDayStartTimes((prev) => {
      if (!Array.isArray(prev)) return prev;

      // Find first available day not already selected
      const selectedDays = new Set(prev.map((entry) => entry && entry.day).filter(Boolean));
      let availableDay = 1;
      for (let day = 0; day < 7; day++) {
        if (!selectedDays.has(day)) {
          availableDay = day;
          break;
        }
      }

      return [
        ...prev,
        {
          id: Date.now() + (prev.length || 0),
          day: availableDay,
          time: "08:00",
        },
      ];
    });
  };

  const updateSpecificDayRow = (
    id: number,
    updates: Partial<{ day: number; time: string }>,
  ) => {
    setSpecificDayStartTimes((prev) =>
      Array.isArray(prev)
        ? prev.map((entry) =>
            entry && entry.id === id ? { ...entry, ...updates } : entry,
          )
        : [],
    );
  };

  const removeSpecificDayRow = (id: number) => {
    setSpecificDayStartTimes((prev) => {
      if (!Array.isArray(prev) || prev.length <= 1) return prev || [];
      return prev.filter((entry) => entry && entry.id !== id);
    });
  };

  const toggleStageNotification = (stageId: string) => {
    setNotificationPreferences((prev) => {
      const existing = prev.find((p) => p.stage === stageId);
      if (existing) {
        return prev.filter((p) => p.stage !== stageId);
      } else {
        return [...prev, { stage: stageId, channels: ['email'] }];
      }
    });
  };

  const updateStageChannels = (stageId: string, channels: ('email' | 'sms' | 'in_app' | 'platform')[]) => {
    setNotificationPreferences((prev) =>
      prev.map((p) =>
        p.stage === stageId ? { ...p, channels } : p
      )
    );
  };

  const toggleChannel = (stageId: string, channel: 'email' | 'sms' | 'in_app' | 'platform') => {
    setNotificationPreferences((prev) => {
      const existing = prev.find((p) => p.stage === stageId);

      if (!existing) {
        // Stage doesn't exist, create it with this channel
        return [...prev, { stage: stageId, channels: [channel] }];
      }

      // Stage exists, toggle the channel
      const newChannels = existing.channels.includes(channel)
        ? existing.channels.filter((c) => c !== channel)
        : [...existing.channels, channel];

      // If no channels left, remove the stage entirely
      if (newChannels.length === 0) {
        return prev.filter((p) => p.stage !== stageId);
      }

      return prev.map((p) =>
        p.stage === stageId ? { ...p, channels: newChannels } : p
      );
    });
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
              <Radio
                name="startType"
                value="datetime"
                checked={startType === "datetime"}
                onChange={() => {
                  setStartType("datetime");
                  updateScheduling({ start_type: "datetime" });
                }}
                label="Start date/time"
              />
              <Radio
                name="startType"
                value="previous"
                checked={startType === "previous"}
                onChange={() => {
                  setStartType("previous");
                  updateScheduling({ start_type: "previous" });
                }}
                label="Starts when the previous broadcast is aborted"
              />
            </div>
          </div>

          {/* Start Date/Time Input - Only show when datetime is selected */}
          {startType === "datetime" && scheduling && (
            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <Input
                  type="date"
                  label="Start Date"
                  value={
                    scheduling.start_date
                      ? scheduling.start_date.split("T")[0]
                      : ""
                  }
                  onChange={(value) => {
                    if (value) {
                      const current = schedulingRef.current;
                      const time =
                        (typeof current?.start_time === "string" &&
                          current.start_time.slice(0, 5)) ||
                        current?.start_date?.split("T")[1]?.slice(0, 5) ||
                        defaultStartTime ||
                        "08:00";
                      updateScheduling({
                        start_date: `${String(value)}T${time}`,
                        start_time: time,
                      });
                    }
                  }}
                  className="flex-1"
                  variant="default"
                  placeholder=""
                />
                <Input
                  type="time"
                  label="Start Time"
                  value={
                    scheduling.start_time ||
                    scheduling.start_date?.split("T")[1]?.slice(0, 5) ||
                    "08:00"
                  }
                  onChange={(value) => {
                    if (value && scheduling.start_date) {
                      updateScheduling({
                        start_time: String(value),
                        start_date:
                          scheduling.start_date.split("T")[0] +
                          "T" +
                          String(value),
                      });
                    }
                  }}
                  className="flex-1"
                  variant="default"
                  placeholder=""
                />
              </div>
            </div>
          )}

          {/* End Options */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              End
            </label>
            <div className="flex items-center space-x-6 mb-4">
              <Radio
                name="endType"
                value="never"
                checked={endType === "never"}
                onChange={() => {
                  setEndType("never");
                  updateScheduling({ end_date: "" });
                }}
                label="Never"
              />
              <Radio
                name="endType"
                value="at"
                checked={endType === "at"}
                onChange={() => {
                  setEndType("at");
                  updateScheduling({ end_date: "2025-12-31T23:59" });
                }}
                label="At"
              />
            </div>
          </div>

          {/* End Date Input (conditional) */}
          {endType === "at" && scheduling && (
            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <Input
                  type="date"
                  label="End Date"
                  value={
                    scheduling.end_date
                      ? scheduling.end_date.split("T")[0]
                      : ""
                  }
                  onChange={(value) => {
                    if (value) {
                      updateScheduling({ end_date: String(value) + "T23:59" });
                    }
                  }}
                  className="flex-1"
                  variant="default"
                  placeholder=""
                />
                <Input
                  type="time"
                  label="End Time"
                  value={
                    scheduling.end_date
                      ? scheduling.end_date.split("T")[1] || "23:59"
                      : "23:59"
                  }
                  onChange={(value) => {
                    if (value && scheduling.end_date) {
                      updateScheduling({
                        end_date:
                          scheduling.end_date.split("T")[0] +
                          "T" +
                          String(value),
                      });
                    }
                  }}
                  className="flex-1"
                  variant="default"
                  placeholder=""
                />
              </div>
            </div>
          )}

          {/* Time Zone */}
          <div>
            {timezonesLoading ? (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
                Loading timezones...
              </div>
            ) : (
              <>
                <HeadlessSelect
                  label="Time Zone"
                  value={scheduling?.time_zone || getSettingsTimezone()}
                  onChange={(value) => {
                    if (!value) return;
                    const nextTz = timezoneList.find((tz) => tz.value === value);
                    const current = schedulingRef.current;
                    const previousTz = timezoneList.find(
                      (tz) => tz.value === current?.time_zone,
                    );
                    const updatedData: Partial<SchedulingData> = {
                      time_zone: value as string,
                      time_zone_offset: nextTz?.utc_offset,
                    };

                    const canShift =
                      previousTz?.utc_offset &&
                      nextTz?.utc_offset &&
                      previousTz.utc_offset !== nextTz.utc_offset;

                    if (canShift && current?.start_date) {
                      const wall = current.start_date.includes("T")
                        ? current.start_date
                        : `${current.start_date}T${current.start_time || defaultStartTime || "08:00"}`;
                      const converted = convertWallClockBetweenOffsets(
                        wall,
                        previousTz.utc_offset,
                        nextTz.utc_offset,
                      );
                      updatedData.start_date = converted;
                      updatedData.start_time = converted.split("T")[1];
                    }

                    if (canShift && current?.end_date) {
                      updatedData.end_date = convertWallClockBetweenOffsets(
                        String(current.end_date),
                        previousTz.utc_offset,
                        nextTz.utc_offset,
                      );
                    }

                    if (canShift) {
                      const anchor =
                        (updatedData.start_date || current?.start_date || "2026-01-01")
                          .split("T")[0];
                      const shiftedDefault = shiftClockTime(
                        defaultStartTime,
                        anchor,
                        previousTz.utc_offset,
                        nextTz.utc_offset,
                      );
                      setDefaultStartTime(shiftedDefault);
                      setSpecificDayStartTimes((rows) =>
                        rows.map((row) => ({
                          ...row,
                          time: shiftClockTime(
                            row.time,
                            anchor,
                            previousTz.utc_offset,
                            nextTz.utc_offset,
                          ),
                        })),
                      );
                    }

                    updateScheduling(updatedData);
                  }}
                  options={
                    Array.isArray(timezoneList) && timezoneList.length > 0
                      ? timezoneList
                          .filter((tz) => tz && tz.value)
                          .map((tz) => ({
                            value: tz.value || "",
                            label: `${tz.label || tz.value || ""} (${tz.utc_offset  || ""})`,
                          }))
                      : [
                          {
                            value: getSettingsTimezone(),
                            label: getSettingsTimezone(),
                          },
                        ]
                  }
                  placeholder="Select timezone"
                  searchable={true}
                  className="w-full"
                />
                {scheduling?.time_zone === getSettingsTimezone() && (
                  <p className="text-xs text-gray-500 mt-2">
                    Using default timezone from settings
                  </p>
                )}
              </>
            )}
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
              <HeadlessSelect
                label="Recurrence Pattern"
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
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  label="Recur Every"
                  value={recurrenceInterval}
                  onChange={(value) =>
                    setRecurrenceInterval(Number(value))
                  }
                  className="w-16"
                  variant="default"
                  placeholder=""
                />
                <span className="text-sm text-gray-600">
                  {recurrencePattern}
                </span>
              </div>
            </div>

            {/* Default Start Time */}
            <div>
              <Input
                type="time"
                label="Default Start Time"
                value={defaultStartTime}
                onChange={(value) => setDefaultStartTime(String(value))}
                className="w-full"
                variant="default"
                placeholder=""
              />
            </div>
          </div>

          {/* Monthly Rule - shown only when monthly recurrence and specific schedule is enabled */}
          {recurrencePattern === "Months" && setSpecificStartTime && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <HeadlessSelect
                  label="Monthly Rule"
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
                  <Input
                    type="number"
                    label="Day Number"
                    value={monthlyDayOfMonth}
                    onChange={(value) =>
                      setMonthlyDayOfMonth(
                        Math.max(1, Math.min(31, Number(value) || 1)),
                      )
                    }
                    className="w-full"
                    variant="default"
                    placeholder=""
                  />
                </div>
              )}
            </div>
          )}

          {/* Days of Week - shown only for weekly recurrence */}
          {recurrencePattern === "Weeks" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Days of Week
              </label>
              <div className="flex gap-3 flex-wrap">
                {daysOfWeek.map((day) => (
                  <div
                    key={day.value}
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => toggleDayOfWeek(day.value)}
                  >
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={selectedDays.includes(day.value)}
                      onChange={() => toggleDayOfWeek(day.value)}
                    />
                    <span className="text-sm text-gray-700 font-medium">
                      {day.label.substring(0, 3)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Additional Options */}
          <div className="space-y-3">
            {(recurrencePattern === "Days" ||
              recurrencePattern === "Months") && (
              <>
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => {
                    const newValue = !setSpecificStartTime;
                    setSetSpecificStartTime(newValue);
                    if (newValue && specificDayStartTimes.length === 0) {
                      setSpecificDayStartTimes([
                        { id: Date.now(), day: 1, time: "08:00" },
                      ]);
                    }
                  }}
                >
                  <Checkbox
                    id="set-specific-schedule"
                    checked={setSpecificStartTime}
                    onChange={() => {
                      const newValue = !setSpecificStartTime;
                      setSetSpecificStartTime(newValue);
                      if (newValue && specificDayStartTimes.length === 0) {
                        setSpecificDayStartTimes([
                          { id: Date.now(), day: 1, time: "08:00" },
                        ]);
                      }
                    }}
                  />
                  <span className="text-sm text-gray-700 font-medium">
                    Set specific schedule
                  </span>
                </div>

                {setSpecificStartTime && recurrencePattern === "Days" && (
                  <div
                    className={`border border-gray-200 ${tw.rounded} p-4 space-y-3`}
                  >
                    {specificDayStartTimes.map((entry) => (
                      <div
                        key={entry.id}
                        className="grid grid-cols-1 md:grid-cols-[1fr_160px_auto] gap-3 items-end"
                      >
                        <div>
                          <HeadlessSelect
                            value={entry.day}
                            onChange={(value) =>
                              updateSpecificDayRow(entry.id, {
                                day: Number(value),
                              })
                            }
                            options={getDayOptionsForRow(entry.id)}
                            placeholder="Select day"
                            className="w-full"
                          />
                        </div>

                        <div>
                          <Input
                            type="time"
                            label="Time"
                            value={entry.time}
                            onChange={(value) =>
                              updateSpecificDayRow(entry.id, {
                                time: String(value),
                              })
                            }
                            className="w-full"
                            variant="default"
                            placeholder=""
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => removeSpecificDayRow(entry.id)}
                          className="inline-flex items-center justify-center h-10 w-10 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                          disabled={specificDayStartTimes.length === 1}
                          aria-label="Remove row"
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addSpecificDayRow}
                      style={{
                        background: buttons.bordered.background,
                        color: buttons.bordered.color,
                        border: buttons.bordered.border,
                        padding: `${buttons.bordered.paddingY} ${buttons.bordered.paddingX}`,
                        borderRadius: buttons.bordered.borderRadius,
                        fontSize: buttons.bordered.fontSize,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      Add Day Time
                    </button>
                  </div>
                )}
              </>
            )}

            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setStartDeliveryOnCompletion(!startDeliveryOnCompletion)}
            >
              <Checkbox
                id="start-delivery-completion"
                checked={startDeliveryOnCompletion}
                onChange={() => setStartDeliveryOnCompletion(!startDeliveryOnCompletion)}
              />
              <span className="text-sm text-gray-700 font-medium">
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
            <Radio
              name="renderTime"
              value="Pre-Render"
              checked={targetRenderTime === "Pre-Render"}
              onChange={() => setTargetRenderTime("Pre-Render")}
              label="Pre-Render"
            />

            <Radio
              name="renderTime"
              value="Real Time"
              checked={targetRenderTime === "Real Time"}
              onChange={() => setTargetRenderTime("Real Time")}
              label="Real Time"
            />

            <Radio
              name="renderTime"
              value="Broadcast Schedule"
              checked={targetRenderTime === "Broadcast Schedule"}
              onChange={() => setTargetRenderTime("Broadcast Schedule")}
              label="Broadcast Schedule"
            />
          </div>

          {targetRenderTime === "Broadcast Schedule" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <HeadlessSelect
                    label="Start broadcasts"
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
                    <Input
                      type="time"
                      label="Time"
                      value={broadcastStartTime}
                      onChange={(value) => {
                        setBroadcastStartTime(String(value));
                        updateScheduling({
                          broadcast_start_time: String(value),
                        });
                      }}
                      className="w-full"
                      variant="default"
                      placeholder=""
                    />
                  </div>
                ) : (
                  <div>
                    <Input
                      type="number"
                      label="Hours"
                      value={hoursBeforeBroadcast}
                      onChange={(value) =>
                        setHoursBeforeBroadcast(Number(value))
                      }
                      className="w-full"
                      variant="default"
                      placeholder=""
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

        </div>
      </div>

      {/* Notification Preferences Table */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Notification Preferences
          </h3>
          <p className="text-xs text-gray-600">
            Check the channels where you want to receive notifications for each campaign stage. At least one channel must be selected to enable notifications for a stage.
          </p>
        </div>

        <div className={`bg-white border border-gray-200 ${tw.rounded} overflow-hidden`}>
          <table className="w-full divide-y" style={{ borderColor: 'rgb(229, 231, 235)' }}>
            <thead style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Execution Stage
                </th>
                {notificationChannels.map((channel) => (
                  <th
                    key={channel.id}
                    className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider"
                  >
                    {channel.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y" style={{ borderColor: 'rgb(229, 231, 235)' }}>
              {executionStages.map((stage) => {
                const preference = notificationPreferences.find((p) => p.stage === stage.id);
                const isEnabled = !!preference;

                return (
                  <tr key={stage.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {stage.label}
                    </td>
                    {notificationChannels.map((channel) => (
                      <td
                        key={`${stage.id}-${channel.id}`}
                        className="px-6 py-4 text-center"
                      >
                        <div
                          className="flex items-center justify-center cursor-pointer"
                          onClick={() =>
                            toggleChannel(
                              stage.id,
                              channel.id as 'email' | 'sms' | 'in_app' | 'platform'
                            )
                          }
                        >
                          <Checkbox
                            id={`notif-${stage.id}-${channel.id}`}
                            checked={
                              isEnabled &&
                              preference.channels.includes(
                                channel.id as 'email' | 'sms' | 'in_app' | 'platform'
                              )
                            }
                            onChange={() =>
                              toggleChannel(
                                stage.id,
                                channel.id as 'email' | 'sms' | 'in_app' | 'platform'
                              )
                            }
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
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
