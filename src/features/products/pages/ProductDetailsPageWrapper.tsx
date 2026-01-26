/**
 * ProductDetailsPageWrapper - Suspense-enabled wrapper for ProductDetailsPage
 *
 * This wrapper adds Suspense support to ProductDetailsPage without modifying the original component.
 * The page now renders immediately with a skeleton, then loads data in the background.
 */

import ProductDetailsPage from "./ProductDetailsPage";
import { SuspenseBoundary } from "../../../shared/components/SuspenseBoundaryWrapper";

/**
 * Suspense-enabled wrapper
 * Shows detail page skeleton while ProductDetailsPage mounts and loads its data
 */
export default function ProductDetailsPageWrapper() {
  return (
    <SuspenseBoundary type="detail">
      <ProductDetailsPage />
    </SuspenseBoundary>
  );
}

/**
 * Alternative: Use this if you want custom error handling
 */
export function ProductDetailsPageWithErrorHandling() {
  return (
    <SuspenseBoundary
      type="detail"
      errorFallback={(error) => (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-900 font-bold mb-2">Failed to Load Product Details</h3>
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
      <ProductDetailsPage />
    </SuspenseBoundary>
  );
}
