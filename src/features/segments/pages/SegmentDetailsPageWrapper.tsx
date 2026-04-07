/**
 * SegmentDetailsPageWrapper - Suspense-enabled wrapper for SegmentDetailsPage
 *
 * This wrapper adds Suspense support to SegmentDetailsPage without modifying the original component.
 * The page now renders immediately with a skeleton, then loads data in the background.
 */

import SegmentDetailsPage from "./SegmentDetailsPage";
import { SuspenseBoundary } from "../../../shared/components/SuspenseBoundaryWrapper";
import { PermissionGate } from "../../auth/components/PermissionGate";
import UnauthorizedPage from "../../auth/pages/UnauthorizedPage";

/**
 * Suspense-enabled wrapper
 * Shows detail page skeleton while SegmentDetailsPage mounts and loads its data
 */
export default function SegmentDetailsPageWrapper() {
  return (
    <PermissionGate permission="segments.read" fallback={<UnauthorizedPage />}>
      <SuspenseBoundary type="detail">
        <SegmentDetailsPage />
      </SuspenseBoundary>
    </PermissionGate>
  );
}

/**
 * Alternative: Use this if you want custom error handling
 */
export function SegmentDetailsPageWithErrorHandling() {
  return (
    <SuspenseBoundary
      type="detail"
      errorFallback={(error) => (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-900 font-bold mb-2">
            Failed to Load Segment Details
          </h3>
          <p className="text-red-700 text-sm">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className={`mt-4 px-4 py-2 bg-red-600  rounded hover:bg-red-700`}
          >
            Retry
          </button>
        </div>
      )}
    >
      <SegmentDetailsPage />
    </SuspenseBoundary>
  );
}
