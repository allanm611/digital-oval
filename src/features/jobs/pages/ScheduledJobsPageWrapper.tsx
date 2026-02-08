/**
 * ScheduledJobsPageWrapper - Suspense-enabled wrapper for ScheduledJobsPage
 *
 * This wrapper adds Suspense support to ScheduledJobsPage without modifying the original component.
 * The page now renders immediately with a skeleton, then loads data in the background.
 */

import ScheduledJobsPage from "./ScheduledJobsPage";
import { SuspenseBoundary } from "../../../shared/components/SuspenseBoundaryWrapper";
import { PermissionGate } from "../../auth/components/PermissionGate";
import UnauthorizedPage from "../../auth/pages/UnauthorizedPage";

/**
 * Suspense-enabled wrapper
 * Shows table skeleton while ScheduledJobsPage mounts and loads its data
 */
export default function ScheduledJobsPageWrapper() {
  return (
    <PermissionGate permission="jobs.read" fallback={<UnauthorizedPage />}>
      <SuspenseBoundary type="table">
        <ScheduledJobsPage />
      </SuspenseBoundary>
    </PermissionGate>
  );
}

/**
 * Alternative: Use this if you want custom error handling
 */
export function ScheduledJobsPageWithErrorHandling() {
  return (
    <SuspenseBoundary
      type="table"
      errorFallback={(error) => (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-900 font-bold mb-2">
            Failed to Load Scheduled Jobs
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
      <ScheduledJobsPage />
    </SuspenseBoundary>
  );
}
