/**
 * UserManagementPageWrapper - Permission & Suspense-enabled wrapper for UserManagementPage
 *
 * This wrapper adds permission gating and Suspense support to UserManagementPage without modifying the original component.
 */

import UserManagementPage from "./UserManagementPage";
import { useLanguage } from "../../../contexts/LanguageContext";
import { SuspenseBoundary } from "../../../shared/components/SuspenseBoundaryWrapper";
import { PermissionGate } from "../../auth/components/PermissionGate";

/**
 * Permission-gated + Suspense-enabled wrapper
 * Shows table skeleton while UserManagementPage mounts and loads its data
 */
export default function UserManagementPageWrapper() {
  const { t } = useLanguage();
  return (
    <PermissionGate permission="users.read">
      <SuspenseBoundary type="table">
        <UserManagementPage />
      </SuspenseBoundary>
    </PermissionGate>
  );
}
