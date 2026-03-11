import { Users, Gift, Target } from "lucide-react";
import {
  CreateCampaignRequest,
  CampaignSegment,
  CampaignOffer,
} from "../../types/campaign";
import { CampaignFlowConfig } from "../../types/campaignFlow";
import { color, tw, components } from "../../../../shared/utils/utils";
import DateFormatter from "../../../../shared/components/DateFormatter";

interface CampaignPreviewStepProps {
  formData: CreateCampaignRequest;
  selectedSegments: CampaignSegment[];
  selectedOffers: CampaignOffer[];
  campaignFlows?: CampaignFlowConfig[];
}

export default function CampaignPreviewStep({
  formData,
  selectedSegments,
  selectedOffers,
  campaignFlows = [],
}: CampaignPreviewStepProps) {
  // Debug logging
  console.log("CampaignPreviewStep formData:", formData);
  console.log("selectedSegments:", selectedSegments);
  console.log("selectedOffers:", selectedOffers);
  console.log("campaignFlows:", campaignFlows);
  const totalAudienceSize = selectedSegments.reduce(
    (total, segment) => total + (segment.customer_count || 0),
    0
  );

  const getObjectiveLabel = (objective: string) => {
    const labels = {
      acquisition: "New Customer Acquisition",
      retention: "Customer Retention",
      churn_prevention: "Churn Prevention",
      upsell_cross_sell: "Upsell/Cross-sell",
      reactivation: "Dormant Customer Reactivation",
    };
    return labels[objective as keyof typeof labels] || objective;
  };

  const readinessChecks = [
    {
      label: "Segments configured",
      complete: selectedSegments.length > 0,
    },
    {
      label: "Delivery flows defined",
      complete: campaignFlows.length > 0,
    },
    {
      label: "Campaign details completed",
      complete: Boolean(formData.name && formData.objective),
    },
    {
      label: "Schedule defined",
      complete: Boolean(formData.start_date && formData.end_date),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Review & Launch
        </h2>
        <p className="text-sm text-gray-600">
          Validate your campaign structure, audience coverage, and offer
          mappings before launching.
        </p>
      </div>

      {/* Campaign Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: Target,
            label: "Segments",
            value: selectedSegments.length.toString(),
          },
          {
            icon: Users,
            label: "Total Reach",
            value: totalAudienceSize.toLocaleString(),
          },
          {
            icon: Gift,
            label: "Offers",
            value: selectedOffers.length.toString(),
          },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className={`${tw.rounded} border border-gray-100 p-4 flex items-center gap-3 bg-white shadow-sm`}
          >
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
              <Icon
                className="w-5 h-5"
                style={{ color: color.primary.accent }}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{label}</p>
              <p className="text-lg font-semibold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-2">
          {/* Campaign Details */}
          <div className={components.card.surface}>
            <h3 className={`text-sm font-bold ${tw.textPrimary} mb-4`}>
              Campaign Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <div className={`text-sm font-medium ${tw.textSecondary} mb-1`}>
                  Name
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {formData.name || "Untitled campaign"}
                </div>
              </div>
              <div>
                <div className={`text-sm font-medium ${tw.textSecondary} mb-1`}>
                  Objective
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {getObjectiveLabel(formData.objective)}
                </div>
              </div>
              <div>
                <div className={`text-sm font-medium ${tw.textSecondary} mb-1`}>
                  Catalog
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {formData.category_id
                    ? `Category ${formData.category_id}`
                    : "Not selected"}
                </div>
              </div>
              <div>
                <div className={`text-sm font-medium ${tw.textSecondary} mb-1`}>
                  Start Date
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {formData.start_date ? (
                    <DateFormatter date={formData.start_date} />
                  ) : (
                    "Not scheduled"
                  )}
                </div>
              </div>
              <div>
                <div className={`text-sm font-medium ${tw.textSecondary} mb-1`}>
                  End Date
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {formData.end_date ? (
                    <DateFormatter date={formData.end_date} />
                  ) : (
                    "Not scheduled"
                  )}
                </div>
              </div>
              <div>
                <div className={`text-sm font-medium ${tw.textSecondary} mb-1`}>
                  Tags
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {formData.tag || "None"}
                </div>
              </div>
            </div>
          </div>

          {/* Audience Summary */}
          <div className={components.card.surface}>
            <h3 className={`text-sm font-bold ${tw.textPrimary} mb-4`}>
              Audience Segments
            </h3>

            <div className="mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Campaign Type</span>
                <span className="text-sm font-medium text-gray-900">
                  {formData.campaign_type || "Not specified"}
                </span>
              </div>
            </div>
            {selectedSegments.length ? (
              <div>
                {/* Column Headers */}
                <div className="grid grid-cols-3 gap-4 pb-3 mb-4 border-b border-gray-200">
                  <div className="text-sm font-semibold text-gray-700">Segment Name</div>
                  <div className="text-sm font-semibold text-gray-700">Customers</div>
                  <div className="text-sm font-semibold text-gray-700">Control Group</div>
                </div>
                {/* Rows */}
                <div className="space-y-3">
                  {selectedSegments.map((segment) => (
                    <div
                      key={segment.id}
                      className="grid grid-cols-3 gap-4"
                    >
                      <div className="text-sm font-medium text-gray-600">
                        {segment.name}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {segment.customer_count?.toLocaleString() || "0"}
                        </div>
                      </div>
                      <div>
                        {segment.control_group_config ? (
                          <div className="text-sm font-medium text-gray-700">
                            {segment.control_group_config.control_group_method?.percentage || segment.control_group_config.percentage || "0"}%
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">—</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                No segments have been selected.
              </div>
            )}
          </div>

          {/* Offers Overview */}
          <div className={components.card.surface}>
            <h3 className={`text-sm font-bold ${tw.textPrimary} mb-3`}>
              Selected Offers
            </h3>
            {selectedOffers.length ? (
              <div className="space-y-3">
                {selectedOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className={`flex items-center justify-between p-3 ${tw.rounded} border border-gray-100 bg-white`}
                  >
                    <div className="text-sm font-medium text-gray-600">
                      {offer.name || `Offer #${offer.id}`}
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div className="font-medium text-gray-900">
                        {offer.offer_type || "N/A"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                No offers have been mapped to this campaign yet.
              </div>
            )}
          </div>

        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className={`${tw.rounded} border border-gray-200 bg-white shadow-sm p-5 space-y-3 text-sm`}>
            <h3 className="text-sm font-semibold text-gray-900">
              Schedule Overview
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Start</span>
              <span className="font-medium text-gray-900">
                {formData.start_date ? (
                  <DateFormatter date={formData.start_date} />
                ) : (
                  "Not scheduled"
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">End</span>
              <span className="font-medium text-gray-900">
                {formData.end_date ? (
                  <DateFormatter date={formData.end_date} />
                ) : (
                  "Not scheduled"
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Estimated Duration</span>
              <span className="font-medium text-gray-900">
                {formData.start_date && formData.end_date
                  ? Math.max(
                      1,
                      Math.ceil(
                        (new Date(formData.end_date).getTime() -
                          new Date(formData.start_date).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    ) + " days"
                  : "TBD"}
              </span>
            </div>
          </div>

          <div className={`${tw.rounded} border border-gray-200 bg-white shadow-sm p-5 space-y-3`}>
            <h3 className="text-sm font-semibold text-gray-900">
              Launch Checklist
            </h3>
            <ul className="space-y-2 text-sm">
              {readinessChecks.map((item) => (
                <li key={item.label} className="flex items-center gap-2">
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-sm ${
                      item.complete
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {item.complete ? "✓" : "•"}
                  </span>
                  <span
                    className={
                      item.complete ? "text-gray-900" : "text-gray-500"
                    }
                  >
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
