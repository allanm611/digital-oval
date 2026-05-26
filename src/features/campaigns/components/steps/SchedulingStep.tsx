import { useState } from "react";
import SchedulingComponent from "../../../../shared/components/SchedulingComponent";
import ScheduledModal from "../ScheduledModal";
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
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleSchedulingChange = (scheduling: SchedulingData) => {
    setFormData({
      ...formData,
      scheduling: scheduling as any, // Keep campaign's scheduling type
      timezone: scheduling.time_zone || formData.timezone, // Sync root-level timezone with scheduling timezone
    });
  };

  const handlePreviewSchedule = () => {
    if (formData.scheduling) {
      setShowPreviewModal(true);
    }
  };

  return (
    <>
      <SchedulingComponent
        scheduling={formData.scheduling || {}}
        onSchedulingChange={handleSchedulingChange}
        title="Broadcast Schedule Range"
        subtitle="Configure your campaign broadcast schedule and delivery settings"
        showPreviewButton={true}
        onPreviewSchedule={handlePreviewSchedule}
      />

      <ScheduledModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        campaignName={formData.name || "Campaign"}
        startDate={formData.scheduling?.start_date || null}
        endDate={formData.scheduling?.end_date || null}
      />
    </>
  );
}
