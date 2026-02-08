/**
 * QuickListDetailsPageWrapper - Permission & Suspense-enabled wrapper for QuickListDetailsPage
 *
 * This wrapper adds permission gating and Suspense support to QuickListDetailsPage without modifying the original component.
 */

import QuickListDetailsPage from "./QuickListDetailsPage";
import { SuspenseBoundary } from "../../../shared/components/SuspenseBoundaryWrapper";
import { PermissionGate } from "../../auth/components/PermissionGate";

/**
 * Permission-gated + Suspense-enabled wrapper
 * Shows detail page skeleton while QuickListDetailsPage mounts and loads its data
 */
export default function QuickListDetailsPageWrapper() {
  return (
    <PermissionGate permission="quicklists.read">
      <SuspenseBoundary type="detail">
        <QuickListDetailsPage />
      </SuspenseBoundary>
    </PermissionGate>
  );
}
