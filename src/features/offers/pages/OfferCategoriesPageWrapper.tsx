/**
 * OfferCategoriesPageWrapper - Suspense-enabled wrapper for OfferCategoriesPage
 *
 * This wrapper adds Suspense support to OfferCategoriesPage without modifying the original component.
 * The page now renders immediately with a skeleton, then loads data in the background.
 *
 * To use this:
 * 1. Replace the import in Dashboard.tsx from:
 *    import OfferCategoriesPage from '../../offers/pages/OfferCategoriesPage'
 * 2. To:
 *    import OfferCategoriesPageWrapper from '../../offers/pages/OfferCategoriesPageWrapper'
 * 3. Use OfferCategoriesPageWrapper instead of OfferCategoriesPage in the routes
 *
 * That's it! No changes needed to OfferCategoriesPage itself.
 */

import { Suspense } from "react";
import OfferCategoriesPage from "./OfferCategoriesPage";
import { SuspenseBoundary } from "../../../shared/components/SuspenseBoundaryWrapper";

/**
 * Suspense-enabled wrapper
 * Shows table skeleton while OfferCategoriesPage mounts and loads its data
 */
export default function OfferCategoriesPageWrapper() {
  return (
    <SuspenseBoundary type="table">
      <OfferCategoriesPage />
    </SuspenseBoundary>
  );
}

/**
 * Alternative: Use this if you want custom error handling
 */
export function OfferCategoriesPageWithErrorHandling() {
  return (
    <SuspenseBoundary
      type="table"
      errorFallback={(error) => (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-900 font-bold mb-2">Failed to Load Offer Categories</h3>
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
      <OfferCategoriesPage />
    </SuspenseBoundary>
  );
}
