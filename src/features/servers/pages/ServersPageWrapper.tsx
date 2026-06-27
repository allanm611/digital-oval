/**
 * ServersPageWrapper - Permission & Suspense-enabled wrapper for ServersPage
 *
 * This wrapper adds permission gating and Suspense support to ServersPage without modifying the original component.
 */

import ServersPage from "./ServersPage";
import { useLanguage } from "../../../contexts/LanguageContext";
import { SuspenseBoundary } from "../../../shared/components/SuspenseBoundaryWrapper";
import { PermissionGate } from "../../auth/components/PermissionGate";

/**
 * Permission-gated + Suspense-enabled wrapper
 * Shows table skeleton while ServersPage mounts and loads its data
 */
export default function ServersPageWrapper() {
  const { t } = useLanguage();
  return (
    <PermissionGate permission="servers.read">
      <SuspenseBoundary type="table">
        <ServersPage />
      </SuspenseBoundary>
    </PermissionGate>
  );
}
