import { useCustomerSegments } from "../hooks/useCustomerSegments";
import CustomerCampaignsTab from "./CustomerCampaignsTab";
import CustomerSegmentsTab from "./CustomerSegmentsTab";

type CustomerAudiencePanelProps = {
  view: "segments" | "campaigns";
  subscriberId?: string | number | null;
  customerRecord?: Record<string, unknown> | null;
};

export default function CustomerAudiencePanel({
  view,
  subscriberId,
  customerRecord,
}: CustomerAudiencePanelProps) {
  const state = useCustomerSegments(subscriberId ?? undefined, customerRecord);
  const tabProps = {
    subscriberId,
    ...state,
  };

  return view === "campaigns" ? (
    <CustomerCampaignsTab {...tabProps} />
  ) : (
    <CustomerSegmentsTab {...tabProps} />
  );
}
