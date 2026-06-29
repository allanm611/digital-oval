/**
 * ProductCategoriesPageWrapper - Suspense-enabled wrapper for ProductCategoriesPage
 *
 * This wrapper adds Suspense support to ProductCategoriesPage without modifying the original component.
 * The page now renders immediately with a skeleton, then loads data in the background.
 *
 * To use this:
 * 1. Replace the import in Dashboard.tsx from:
 *    import ProductCategoriesPage from '../../products/pages/ProductCategoriesPage'
 * 2. To:
 *    import ProductCategoriesPageWrapper from '../../products/pages/ProductCategoriesPageWrapper'
 * 3. Use ProductCategoriesPageWrapper instead of ProductCategoriesPage in the routes
 *
 * That's it! No changes needed to ProductCategoriesPage itself.
 */

import { Suspense } from "react";
import { useLanguage } from "../../../contexts/LanguageContext";
import ProductCategoriesPage from "./ProductCategoriesPage";
import { SuspenseBoundary } from "../../../shared/components/SuspenseBoundaryWrapper";

/**
 * Suspense-enabled wrapper
 * Shows table skeleton while ProductCategoriesPage mounts and loads its data
 */
export default function ProductCategoriesPageWrapper() {
  const { t } = useLanguage();
  return (
    <SuspenseBoundary type="table">
      <ProductCategoriesPage />
    </SuspenseBoundary>
  );
}

/**
 * Alternative: Use this if you want custom error handling
 */
export function ProductCategoriesPageWithErrorHandling() {
  const { t } = useLanguage();
  return (
    <SuspenseBoundary
      type="table"
      errorFallback={(error) => (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-900 font-bold mb-2">{t.products.failedToLoadCategories || "Failed to Load Product Categories"}</h3>
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
      <ProductCategoriesPage />
    </SuspenseBoundary>
  );
}
