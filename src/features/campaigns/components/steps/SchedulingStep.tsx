import SchedulingComponent from "../../../../shared/components/SchedulingComponent";
import type { SchedulingData } from "../../../../shared/types/scheduling";
import { CreateCampaignRequest } from "../../types/createCampaign";

interface SchedulingStepProps {
  formData: CreateCampaignRequest;
  setFormData: (data: CreateCampaignRequest) => void;
}

/**
 * Campaign Scheduling Step
 * Wrapper around the generic SchedulingComponent
 * Handles campaign-specific scheduling logic
 */
export default function SchedulingStep({
  formData,
  setFormData,
}: SchedulingStepProps) {
  const handleSchedulingChange = (scheduling: SchedulingData) => {
    setFormData({
      ...formData,
      scheduling: scheduling as any, // Keep campaign's scheduling type
    });
  };

  const handlePreviewSchedule = () => {
    if (formData.scheduling) {
      const scheduleInfo = `
Schedule Type: ${formData.scheduling.type === "immediate" ? "Immediate" : "Scheduled"}
${formData.scheduling.type === "scheduled" ? `Start Date/Time: ${formData.scheduling.start_date}` : ""}
${formData.scheduling.end_date ? `End Date/Time: ${formData.scheduling.end_date}` : ""}
Time Zone: ${formData.scheduling.time_zone || "(GMT+02:00) Sudan"}
      `.trim();
      alert(scheduleInfo);
    }
  };

  return (
    <SchedulingComponent
      scheduling={formData.scheduling || {}}
      onSchedulingChange={handleSchedulingChange}
      title="Broadcast Schedule Range"
      subtitle="Configure your campaign broadcast schedule and delivery settings"
      showPreviewButton={true}
      onPreviewSchedule={handlePreviewSchedule}
    />
  );
}
