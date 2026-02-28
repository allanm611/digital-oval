/**
 * UserAnalyticsPageWrapper - Permission & Suspense-enabled wrapper for UserAnalyticsPage
 *
 * This wrapper adds permission gating and Suspense support to UserAnalyticsPage without modifying the original component.
 */

import UserAnalyticsPage from "./UserAnalyticsPage";
import { SuspenseBoundary } from "../../../shared/components/SuspenseBoundaryWrapper";
import { PermissionGate } from "../../auth/components/PermissionGate";

/**
 * Permission-gated + Suspense-enabled wrapper
 * Shows loading skeleton while UserAnalyticsPage mounts and loads its data
 */
export default function UserAnalyticsPageWrapper() {
  return (
    <PermissionGate permission="users.read">
      <SuspenseBoundary type="page">
        <UserAnalyticsPage />
      </SuspenseBoundary>
    </PermissionGate>
  );
}
