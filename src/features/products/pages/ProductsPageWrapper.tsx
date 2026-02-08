/**
 * ProductsPageWrapper - Suspense-enabled wrapper for ProductsPage
 *
 * This wrapper adds Suspense support to ProductsPage without modifying the original component.
 * The page now renders immediately with a skeleton, then loads data in the background.
 */

import ProductsPage from "./ProductsPage";
import { SuspenseBoundary } from "../../../shared/components/SuspenseBoundaryWrapper";
import { PermissionGate } from "../../auth/components/PermissionGate";
import UnauthorizedPage from "../../auth/pages/UnauthorizedPage";

/**
 * Suspense-enabled wrapper
 * Shows table skeleton while ProductsPage mounts and loads its data
 */
export default function ProductsPageWrapper() {
  return (
    <PermissionGate permission="products.read" fallback={<UnauthorizedPage />}>
      <SuspenseBoundary type="table">
        <ProductsPage />
      </SuspenseBoundary>
    </PermissionGate>
  );
}

/**
 * Alternative: Use this if you want custom error handling
 */
export function ProductsPageWithErrorHandling() {
  return (
    <SuspenseBoundary
      type="table"
      errorFallback={(error) => (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-900 font-bold mb-2">
            Failed to Load Products
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
      <ProductsPage />
    </SuspenseBoundary>
  );
}
