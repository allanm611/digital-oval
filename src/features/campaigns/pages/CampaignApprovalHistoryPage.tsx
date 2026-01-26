import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { tw } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import BackButton from "../../../shared/components/ui/BackButton";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function CampaignApprovalHistoryPage() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Implement when backend endpoint is available
    // For now, this is a placeholder page
    setIsLoading(false);
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-4">
            <BackButton
              fallbackTo={`/dashboard/campaigns/${id}`}
              iconSize="w-4 h-4"
              className="flex items-center text-sm text-gray-600 hover:text-gray-900"
            />
          </div>
          <h1 className={`text-3xl font-bold ${tw.textPrimary}`}>
            {t.historyPages.approvalHistory}
          </h1>
          <p className={`mt-2 text-sm ${tw.textSecondary}`}>
            {t.historyPages.approvalHistoryDesc}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        ) : (
          <div
            className={`bg-white ${tw.rounded} shadow-sm border border-gray-200 p-6`}
          >
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-2`}>
                {t.historyPages.notAvailable}
              </h3>
              <p className={`text-sm ${tw.textSecondary}`}>
                {t.historyPages.featureNotImplemented}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
