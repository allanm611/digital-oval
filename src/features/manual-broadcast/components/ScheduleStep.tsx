import SchedulingComponent from "../../../shared/components/SchedulingComponent";
import type { SchedulingData } from "../../../shared/types/scheduling";
import { ManualBroadcastData } from "../pages/CreateManualBroadcastPage";

interface ScheduleStepProps {
  data: ManualBroadcastData;
  onUpdate: (data: Partial<ManualBroadcastData>) => void;
  onSubmit: () => void;
  onPrevious: () => void;
  isEditMode?: boolean;
}

/**
 * Manual Broadcast Schedule Step
 * Wrapper around the generic SchedulingComponent
 * Maps manual broadcast scheduling to the generic format
 */
export default function ScheduleStep({
  data,
  onUpdate,
  onSubmit,
  onPrevious,
  isEditMode = false,
}: ScheduleStepProps) {
  // Convert manual broadcast data to generic scheduling format
  const schedulingData: SchedulingData = {
    type: data.scheduleType === "now" ? "immediate" : "scheduled",
    start_date: data.scheduleDate ? `${data.scheduleDate}T${data.scheduleTime || "00:00"}` : undefined,
    time_zone: "(GMT+02:00) Sudan",
  };

  const handleSchedulingChange = (scheduling: SchedulingData) => {
    // Convert back from generic format to manual broadcast format
    if (scheduling.start_date) {
      const [date, time] = scheduling.start_date.split("T");
      onUpdate({
        scheduleType: scheduling.type === "immediate" ? "now" : "later",
        scheduleDate: date,
        scheduleTime: time || "00:00",
      });
    } else {
      onUpdate({
        scheduleType: "now",
        scheduleDate: undefined,
        scheduleTime: undefined,
      });
    }
  };

  const handlePreviewSchedule = () => {
    // Validate before preview
    if (data.scheduleType === "later") {
      if (!data.scheduleDate || !data.scheduleTime) {
        console.warn("Please select date and time");
        return;
      }
      // Check if scheduled time is in the future
      const scheduledDateTime = new Date(`${data.scheduleDate}T${data.scheduleTime}`);
      if (scheduledDateTime <= new Date()) {
        console.warn("Scheduled time must be in the future");
        return;
      }
    }
    // Then submit
    onSubmit();
  };

  return (
    <div>
      <SchedulingComponent
        scheduling={schedulingData}
        onSchedulingChange={handleSchedulingChange}
        title="Schedule Your Broadcast"
        subtitle="Set when this broadcast will be sent to your audience"
        showPreviewButton={false}
      />

    </div>
  );
}
