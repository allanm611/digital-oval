/**
 * CreateCampaignPageWrapper - Suspense-enabled wrapper for CreateCampaignPage
 *
 * This wrapper adds Suspense support to CreateCampaignPage without modifying the original component.
 * The page now renders immediately with a skeleton, then loads data in the background.
 *
 * To use this:
 * 1. Replace the import in Dashboard.tsx from:
 *    import CreateCampaignPage from '../../campaigns/pages/CreateCampaignPage'
 * 2. To:
 *    import CreateCampaignPageWrapper from '../../campaigns/pages/CreateCampaignPageWrapper'
 * 3. Use CreateCampaignPageWrapper instead of CreateCampaignPage in the routes
 *
 * That's it! No changes needed to CreateCampaignPage itself.
 */

import CreateCampaignPage from "./CreateCampaignPage";
import { SuspenseBoundary } from "../../../shared/components/SuspenseBoundaryWrapper";
import { PermissionGate } from "../../auth/components/PermissionGate";
import UnauthorizedPage from "../../auth/pages/UnauthorizedPage";

/**
 * Suspense-enabled wrapper
 * Shows stepper skeleton while CreateCampaignPage mounts and loads its data
 */
export default function CreateCampaignPageWrapper() {
  return (
    <PermissionGate
      permission="campaigns.create"
      fallback={<UnauthorizedPage />}
    >
      <SuspenseBoundary type="stepper">
        <CreateCampaignPage />
      </SuspenseBoundary>
    </PermissionGate>
  );
}

/**
 * Alternative: Use this if you want custom error handling
 */
export function CreateCampaignPageWithErrorHandling() {
  return (
    <SuspenseBoundary
      type="stepper"
      errorFallback={(error) => (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-900 font-bold mb-2">
            Failed to Load Campaign Form
          </h3>
          <p className="text-red-700 text-sm">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}
    >
      <CreateCampaignPage />
    </SuspenseBoundary>
  );
}
