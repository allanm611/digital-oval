/**
 * CampaignsPageWrapper - Suspense-enabled wrapper for CampaignsPage
 *
 * This wrapper adds Suspense support to CampaignsPage without modifying the original component.
 * The page now renders immediately with a skeleton, then loads data in the background.
 *
 * To use this:
 * 1. Replace the import in Dashboard.tsx from:
 *    import CampaignsPage from '../../campaigns/pages/CampaignsPage'
 * 2. To:
 *    import CampaignsPageWrapper from '../../campaigns/pages/CampaignsPageWrapper'
 * 3. Use CampaignsPageWrapper instead of CampaignsPage in the routes
 *
 * That's it! No changes needed to CampaignsPage itself.
 */

import { Suspense } from "react";
import CampaignsPage from "./CampaignsPage";
import { SuspenseBoundary } from "../../../shared/components/SuspenseBoundaryWrapper";

/**
 * Suspense-enabled wrapper
 * Shows table skeleton while CampaignsPage mounts and loads its data
 */
export default function CampaignsPageWrapper() {
  return (
    <SuspenseBoundary type="table">
      <CampaignsPage />
    </SuspenseBoundary>
  );
}

/**
 * Alternative: Use this if you want custom error handling
 */
export function CampaignsPageWithErrorHandling() {
  return (
    <SuspenseBoundary
      type="table"
      errorFallback={(error) => (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-900 font-bold mb-2">Failed to Load Campaigns</h3>
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
      <CampaignsPage />
    </SuspenseBoundary>
  );
}
