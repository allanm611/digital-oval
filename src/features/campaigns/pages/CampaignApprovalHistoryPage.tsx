import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { tw } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";

export default function CampaignApprovalHistoryPage() {
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
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <h1 className={`text-3xl font-bold ${tw.textPrimary}`}>
            Campaign Approval History
          </h1>
          <p className={`mt-2 text-sm ${tw.textSecondary}`}>
            {campaignName || "View approval history for this campaign"}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        ) : (
          <div className={`bg-white ${tw.rounded} shadow-sm border border-gray-200 p-6`}>
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className={`text-lg font-semibold ${tw.textPrimary} mb-2`}>
                Approval History Not Available
              </h3>
              <p className={`text-sm ${tw.textSecondary}`}>
                This feature is not yet implemented. The backend endpoint is
                still under development.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
