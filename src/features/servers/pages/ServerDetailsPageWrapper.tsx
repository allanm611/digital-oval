/**
 * ServerDetailsPageWrapper - Permission & Suspense-enabled wrapper for ServerDetailsPage
 *
 * This wrapper adds permission gating and Suspense support to ServerDetailsPage without modifying the original component.
 */

import ServerDetailsPage from "./ServerDetailsPage";
import { useLanguage } from "../../../contexts/LanguageContext";
import { SuspenseBoundary } from "../../../shared/components/SuspenseBoundaryWrapper";
import { PermissionGate } from "../../auth/components/PermissionGate";

/**
 * Permission-gated + Suspense-enabled wrapper
 * Shows detail page skeleton while ServerDetailsPage mounts and loads its data
 */
export default function ServerDetailsPageWrapper() {
  const { t } = useLanguage();
  return (
    <PermissionGate permission="servers.read">
      <SuspenseBoundary type="detail">
        <ServerDetailsPage />
      </SuspenseBoundary>
    </PermissionGate>
  );
}
