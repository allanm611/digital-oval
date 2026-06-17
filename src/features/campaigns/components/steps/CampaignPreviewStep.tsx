import { useState } from "react";
import {
  Users,
  Gift,
  Target,
  Send,
  CheckCircle,
  XCircle,
  Loader,
} from "lucide-react";
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
  seedListMode?: "all" | "per-segment";
  segmentSeedLists?: Record<string, string[]>;
}

interface TestResult {
  seedList: string;
  status: "success" | "failed";
  message?: string;
}

export default function CampaignPreviewStep({
  formData,
  selectedSegments,
  selectedOffers,
  campaignFlows = [],
  seedListMode = "all",
  segmentSeedLists = {},
}: CampaignPreviewStepProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testError, setTestError] = useState("");

  const totalAudienceSize = selectedSegments.reduce(
    (total, segment) => total + (segment.customer_count || 0),
    0
  );

  // Get all test seed lists
  const getTestSeedLists = (): string[] => {
    const seedLists = new Set<string>();
    if (seedListMode === "all" && segmentSeedLists["all"]) {
      segmentSeedLists["all"].forEach((sl) => seedLists.add(sl));
    } else {
      selectedSegments.forEach((segment) => {
        if (segmentSeedLists[segment.id]) {
          segmentSeedLists[segment.id].forEach((sl) => seedLists.add(sl));
        }
      });
    }
    return Array.from(seedLists);
  };

  // Handle sending test to seed lists
  const handleSendTest = async () => {
    const seedLists = getTestSeedLists();

    if (seedLists.length === 0) {
      setTestError("Please select at least one seed list to send tests");
      return;
    }

    setIsTesting(true);
    setTestError("");
    setTestResults([]);

    try {
      const results: TestResult[] = [];

      for (const seedList of seedLists) {
        // Simulate a small delay for each seed list
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Validate seed list (mock validation)
        const isValid = seedList && seedList.length > 0;

        if (isValid) {
          results.push({
            seedList,
            status: "success",
            message: "Test message sent successfully",
          });
        } else {
          results.push({
            seedList,
            status: "failed",
            message: "Failed to send test message",
          });
        }
      }

      setTestResults(results);
    } catch (err) {
      console.error("Failed to process test broadcasts:", err);
      setTestError("Failed to send test messages");
    } finally {
      setIsTesting(false);
    }
  };

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
                  {formData.scheduling?.start_date || formData.start_date ? (
                    <DateFormatter date={formData.scheduling?.start_date || formData.start_date} />
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
                  {formData.scheduling?.end_date || formData.end_date ? (
                    <DateFormatter date={formData.scheduling?.end_date || formData.end_date} />
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
              <div>
                <div className={`text-sm font-medium ${tw.textSecondary} mb-1`}>
                  Line of Business
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {(formData as { line_of_business_id?: number }).line_of_business_id || "Not selected"}
                </div>
              </div>
              <div>
                <div className={`text-sm font-medium ${tw.textSecondary} mb-1`}>
                  Department
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {(formData as { department_id?: number }).department_id || "Not selected"}
                </div>
              </div>
              <div>
                <div className={`text-sm font-medium ${tw.textSecondary} mb-1`}>
                  Program
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {(formData as { program_id?: number }).program_id || "Not selected"}
                </div>
              </div>
              <div>
                <div className={`text-sm font-medium ${tw.textSecondary} mb-1`}>
                  Priority
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {formData.priority ?
                    (formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1))
                    : "Not set"}
                </div>
              </div>
              <div>
                <div className={`text-sm font-medium ${tw.textSecondary} mb-1`}>
                  Description
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {formData.description || "No description"}
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
                <div className="grid grid-cols-5 gap-3 pb-3 mb-4 border-b border-gray-200">
                  <div className="col-span-2 text-sm font-semibold text-gray-700">Segment Name</div>
                  <div className="text-sm font-semibold text-gray-700">Customers</div>
                  <div className="text-sm font-semibold text-gray-700">Control Group</div>
                  <div className="text-sm font-semibold text-gray-700">Seed List</div>
                </div>
                {/* Rows */}
                <div className="space-y-3">
                  {selectedSegments.map((segment) => (
                    <div
                      key={segment.id}
                      className="grid grid-cols-5 gap-3"
                    >
                      <div className="col-span-2 text-sm font-medium text-gray-600">
                        {segment.name}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {segment.customer_count?.toLocaleString() || "0"}
                        </div>
                      </div>
                      <div>
                        {(() => {
                          const config = segment.control_group_config;
                          if (!config) return <div className="text-sm text-gray-400">—</div>;

                          // Handle universal control group
                          if (config.type === "multiple_control_group" && config.selected_control_group_id) {
                            const universalGroups = formData.control_groups || [];
                            const selectedGroup = universalGroups.find(g => g.id === config.selected_control_group_id);
                            if (selectedGroup) {
                              return <div className="text-sm font-medium text-gray-700">{selectedGroup.percentage}%</div>;
                            }
                          }

                          // Handle other control group types
                          const percentage = config.control_group_method?.percentage || config.percentage || "0";
                          return <div className="text-sm font-medium text-gray-700">{percentage}%</div>;
                        })()}
                      </div>
                      <div>
                        {(() => {
                          // Show seed list count based on mode
                          const perSegmentCount = segmentSeedLists[segment.id]?.length || 0;
                          const globalCount = seedListMode === "all" ? (segmentSeedLists["all"]?.length || 0) : 0;
                          const totalCount = perSegmentCount || globalCount;

                          return totalCount > 0 ? (
                            <div className="text-sm font-medium text-gray-700">
                              {totalCount}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">—</div>
                          );
                        })()}
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
                {formData.scheduling?.start_date || formData.start_date ? (
                  <DateFormatter date={formData.scheduling?.start_date || formData.start_date} />
                ) : (
                  "Not scheduled"
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">End</span>
              <span className="font-medium text-gray-900">
                {formData.scheduling?.end_date || formData.end_date ? (
                  <DateFormatter date={formData.scheduling?.end_date || formData.end_date} />
                ) : (
                  "Not scheduled"
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Estimated Duration</span>
              <span className="font-medium text-gray-900">
                {(formData.scheduling?.start_date || formData.start_date) && (formData.scheduling?.end_date || formData.end_date)
                  ? Math.max(
                      1,
                      Math.ceil(
                        (new Date(formData.scheduling?.end_date || formData.end_date).getTime() -
                          new Date(formData.scheduling?.start_date || formData.start_date).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    ) + " days"
                  : "TBD"}
              </span>
            </div>
          </div>

          {/* Test Contacts Section */}
          {((seedListMode === "all" && segmentSeedLists["all"] && segmentSeedLists["all"].length > 0) ||
           (seedListMode === "per-segment" && Object.keys(segmentSeedLists).some((key) => key !== "all" && segmentSeedLists[key]?.length > 0))) && (
            <div className={`${tw.rounded} border border-gray-200 bg-white shadow-sm p-6 space-y-4`}>
              <h3 className="text-sm font-semibold text-gray-900">
                Test Contacts
              </h3>
              <p className={`text-sm ${tw.textSecondary}`}>
                {seedListMode === "all"
                  ? "Seed list applied to all segments"
                  : "Seed lists configured per segment"}
              </p>
              <div className="space-y-4">
                {seedListMode === "all" ? (
                  segmentSeedLists["all"]?.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <p className="font-medium mb-2">Global seed list:</p>
                      <div className="flex flex-wrap gap-2">
                        {segmentSeedLists["all"].map((seedListId) => (
                          <span
                            key={seedListId}
                            className="inline-block px-3 py-1.5 rounded text-sm font-medium"
                            style={{
                              backgroundColor: color.primary.accent,
                              color: "white",
                            }}
                          >
                            {seedListId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-sm space-y-3 max-h-40 overflow-y-auto">
                    {selectedSegments
                      .filter((segment) => segmentSeedLists[segment.id]?.length > 0)
                      .map((segment) => (
                        <div key={segment.id}>
                          <p className="font-medium text-gray-700 text-sm mb-1.5">{segment.name}:</p>
                          <div className="flex flex-wrap gap-2 ml-2">
                            {segmentSeedLists[segment.id].map((seedListId) => (
                              <span
                                key={seedListId}
                                className="inline-block px-3 py-1.5 rounded text-sm font-medium"
                                style={{
                                  backgroundColor: color.primary.accent,
                                  color: "white",
                                }}
                              >
                                {seedListId}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleSendTest}
                disabled={isTesting || getTestSeedLists().length === 0}
                className={`w-auto px-4 py-2 rounded text-sm font-medium  transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ backgroundColor: color.primary.action, color: "white" }}
              >
                {isTesting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin flex-shrink-0" />
                    <span>Sending Tests...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 flex-shrink-0" />
                    <span>Send Test Message</span>
                  </>
                )}
              </button>

              {/* Test Results */}
              {testResults.length > 0 && (
                <div>
                  <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                    Test Results
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {testResults.map((result, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-2 rounded-md text-sm"
                        style={{
                          backgroundColor:
                            result.status === "success"
                              ? `${color.status.success}10`
                              : `${color.status.danger}10`,
                        }}
                      >
                        {result.status === "success" ? (
                          <CheckCircle
                            className="w-4 h-4 flex-shrink-0 mt-0.5"
                            style={{ color: color.status.success }}
                          />
                        ) : (
                          <XCircle
                            className="w-4 h-4 flex-shrink-0 mt-0.5"
                            style={{ color: color.status.danger }}
                          />
                        )}
                        <div className="flex-1">
                          <p
                            className="text-sm font-medium"
                            style={{
                              color:
                                result.status === "success"
                                  ? color.status.success
                                  : color.status.danger,
                            }}
                          >
                            {result.seedList}
                          </p>
                          {result.message && (
                            <p className={`text-sm ${tw.textMuted} mt-0.5`}>
                              {result.message}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Test Error */}
              {testError && (
                <div className="p-3 rounded-md" style={{ backgroundColor: `${color.status.danger}10` }}>
                  <p className="text-sm" style={{ color: color.status.danger }}>
                    {testError}
                  </p>
                </div>
              )}
            </div>
          )}

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
