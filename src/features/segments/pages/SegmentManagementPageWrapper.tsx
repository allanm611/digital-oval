/**
 * SegmentManagementPageWrapper - Suspense-enabled wrapper for SegmentManagementPage
 *
 * This wrapper adds Suspense support to SegmentManagementPage without modifying the original component.
 * The page now renders immediately with a skeleton, then loads data in the background.
 */

import SegmentManagementPage from "./SegmentManagementPage";
import { useLanguage } from "../../../contexts/LanguageContext";
import { SuspenseBoundary } from "../../../shared/components/SuspenseBoundaryWrapper";
import { PermissionGate } from "../../auth/components/PermissionGate";
import UnauthorizedPage from "../../auth/pages/UnauthorizedPage";

/**
 * Suspense-enabled wrapper
 * Shows table skeleton while SegmentManagementPage mounts and loads its data
 */
export default function SegmentManagementPageWrapper() {
  const { t } = useLanguage();
  return (
    <PermissionGate permission="segments.read" fallback={<UnauthorizedPage />}>
      <SuspenseBoundary type="table">
        <SegmentManagementPage />
      </SuspenseBoundary>
    </PermissionGate>
  );
}

/**
 * Alternative: Use this if you want custom error handling
 */
export function SegmentManagementPageWithErrorHandling() {
  return (
    <SuspenseBoundary
      type="table"
      errorFallback={(error) => (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-900 font-bold mb-2">
            {t.segments.failedToLoadSegments || "Failed to Load Segments"}
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
      <SegmentManagementPage />
    </SuspenseBoundary>
  );
}
