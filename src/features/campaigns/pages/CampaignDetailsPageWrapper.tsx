/**
 * CampaignDetailsPageWrapper - Suspense-enabled wrapper for CampaignDetailsPage
 *
 * This wrapper adds Suspense support to CampaignDetailsPage without modifying the original component.
 * The page now renders immediately with a skeleton, then loads data in the background.
 */

import CampaignDetailsPage from "./CampaignDetailsPage";
import { SuspenseBoundary } from "../../../shared/components/SuspenseBoundaryWrapper";
import { PermissionGate } from "../../auth/components/PermissionGate";
import UnauthorizedPage from "../../auth/pages/UnauthorizedPage";
import { useLanguage } from "../../../contexts/LanguageContext";

/**
 * Suspense-enabled wrapper
 * Shows detail page skeleton while CampaignDetailsPage mounts and loads its data
 */
export default function CampaignDetailsPageWrapper() {
  return (
    <PermissionGate permission="campaigns.read" fallback={<UnauthorizedPage />}>
      <SuspenseBoundary type="detail">
        <CampaignDetailsPage />
      </SuspenseBoundary>
    </PermissionGate>
  );
}

/**
 * Alternative: Use this if you want custom error handling
 */
export function CampaignDetailsPageWithErrorHandling() {
  const { t } = useLanguage();
  return (
    <SuspenseBoundary
      type="detail"
      errorFallback={(error) => (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-900 font-bold mb-2">
            {t.campaigns.failedToLoad || "Failed to Load Campaign Details"}
          </h3>
          <p className="text-red-700 text-sm">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className={`mt-4 px-4 py-2 bg-red-600  rounded hover:bg-red-700`}
          >
            {t.common.retry || "Retry"}
          </button>
        </div>
      )}
    >
      <CampaignDetailsPage />
    </SuspenseBoundary>
  );
}
