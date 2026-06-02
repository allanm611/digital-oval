import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { History, User, FileText } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import { color, tw } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { offerService } from "../services/offerService";
import { useLanguage } from "../../../contexts/LanguageContext";
import DateFormatter from "../../../shared/components/DateFormatter";

interface LifecycleHistoryEntry {
  id: number;
  offer_id: number;
  previous_status: string;
  new_status: string;
  comments?: string;
  changed_by: string;
  created_at: string;
}

export default function OfferLifecycleHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<LifecycleHistoryEntry[]>([]);
  const [offerName, setOfferName] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const [historyData, offerData] = await Promise.all([
          offerService.getLifecycleHistory(parseInt(id)),
          offerService.getOfferById(parseInt(id), true),
        ]);

        // Extract data from API response structure
        // Backend returns array directly or in { success: true, data: [] } format
        const historyArray = Array.isArray(historyData)
          ? historyData
          : (
              historyData as unknown as {
                success: boolean;
                data: LifecycleHistoryEntry[];
              }
            )?.data || [];

        const offerInfo =
          (offerData as unknown as { success: boolean; data: { name: string } })
            ?.data || offerData;

        setHistory(historyArray);
        setOfferName(offerInfo?.name || `Offer ${id}`);
      } catch (error) {
        // Failed to fetch lifecycle history
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [id]);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800 border-gray-200",
      active: "bg-green-100 text-green-800 border-green-200",
      inactive: "bg-orange-100 text-orange-800 border-orange-200",
      expired: "bg-red-100 text-red-800 border-red-200",
      archived: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return badges[status] || badges.draft;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <BackButton showBreadcrumb={true} currentLabel="Offer Lifecycle History" />

      {/* Timeline */}
      <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <LoadingSpinner
              variant="modern"
              size="xl"
              color="primary"
              className="mb-4"
            />
            <p className={`${tw.textMuted} font-medium text-sm`}>
              {t.historyPages.loadingHistory}
            </p>
          </div>
        ) : history.length > 0 ? (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

            {/* Timeline Entries */}
            <div className="space-y-6">
              {history.map((entry, index) => (
                <div key={entry.id || index} className="relative pl-14">
                  {/* Timeline Dot */}
                  <div
                    className="absolute left-4 w-4 h-4 rounded-full border-4 border-white"
                    style={{ backgroundColor: color.primary.action }}
                  />

                  {/* Content */}
                  <div
                    className={`bg-gray-50 ${tw.rounded} p-4 border border-gray-200`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {entry.previous_status && (
                          <>
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                                entry.previous_status
                              )}`}
                            >
                              {entry.previous_status}
                            </span>
                            <span className={tw.textMuted}>→</span>
                          </>
                        )}
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                            entry.new_status
                          )}`}
                        >
                          {entry.new_status}
                        </span>
                      </div>
                      <span className={`text-xs ${tw.textMuted}`}>
                        <DateFormatter date={entry.created_at} useUserTimezone includeTime />
                      </span>
                    </div>

                    {entry.comments && (
                      <div className="mb-3">
                        <div className="flex items-start space-x-2">
                          <FileText
                            className={`w-4 h-4 mt-0.5 text-[${color.text.muted}]`}
                          />
                          <p className={`text-sm ${tw.textSecondary}`}>
                            {entry.comments}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2 text-xs">
                      <User className="w-3 h-3" />
                      <span className={tw.textMuted}>
                        {entry.changed_by || "System"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <History className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className={`text-lg font-semibold ${tw.textPrimary} mb-2`}>
              {t.historyPages.noLifecycleHistory}
            </p>
            <p className={`text-sm ${tw.textMuted}`}>
              {t.historyPages.noLifecycleHistoryDesc}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
