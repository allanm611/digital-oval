/**
 * QuickListsPageWrapper - Permission & Suspense-enabled wrapper for QuickListsPage
 *
 * This wrapper adds permission gating and Suspense support to QuickListsPage without modifying the original component.
 */

import QuickListsPage from "./QuickListsPage";
import { useLanguage } from "../../../contexts/LanguageContext";
import { SuspenseBoundary } from "../../../shared/components/SuspenseBoundaryWrapper";
import { PermissionGate } from "../../auth/components/PermissionGate";

/**
 * Permission-gated + Suspense-enabled wrapper
 * Shows table skeleton while QuickListsPage mounts and loads its data
 */
export default function QuickListsPageWrapper() {
  const { t } = useLanguage();
  return (
    <PermissionGate permission="quicklists.read">
      <SuspenseBoundary type="table">
        <QuickListsPage />
      </SuspenseBoundary>
    </PermissionGate>
  );
}
