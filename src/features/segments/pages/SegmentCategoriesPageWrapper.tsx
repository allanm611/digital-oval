/**
 * SegmentCategoriesPageWrapper - Suspense-enabled wrapper for SegmentCategoriesPage
 *
 * This wrapper adds Suspense support to SegmentCategoriesPage without modifying the original component.
 * The page now renders immediately with a skeleton, then loads data in the background.
 *
 * To use this:
 * 1. Replace the import in Dashboard.tsx from:
 *    import SegmentCategoriesPage from '../../segments/pages/SegmentCategoriesPage'
 * 2. To:
 *    import SegmentCategoriesPageWrapper from '../../segments/pages/SegmentCategoriesPageWrapper'
 * 3. Use SegmentCategoriesPageWrapper instead of SegmentCategoriesPage in the routes
 *
 * That's it! No changes needed to SegmentCategoriesPage itself.
 */

import { Suspense } from "react";
import SegmentCategoriesPage from "./SegmentCategoriesPage";
import { SuspenseBoundary } from "../../../shared/components/SuspenseBoundaryWrapper";

/**
 * Suspense-enabled wrapper
 * Shows table skeleton while SegmentCategoriesPage mounts and loads its data
 */
export default function SegmentCategoriesPageWrapper() {
  return (
    <SuspenseBoundary type="table">
      <SegmentCategoriesPage />
    </SuspenseBoundary>
  );
}

/**
 * Alternative: Use this if you want custom error handling
 */
export function SegmentCategoriesPageWithErrorHandling() {
  return (
    <SuspenseBoundary
      type="table"
      errorFallback={(error) => (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-900 font-bold mb-2">Failed to Load Segment Categories</h3>
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
      <SegmentCategoriesPage />
    </SuspenseBoundary>
  );
}
