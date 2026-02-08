import ScheduledJobDetailsPage from "./ScheduledJobDetailsPage";
import { SuspenseBoundary } from "../../../shared/components/SuspenseBoundaryWrapper";
import { PermissionGate } from "../../auth/components/PermissionGate";
import UnauthorizedPage from "../../auth/pages/UnauthorizedPage";

export default function ScheduledJobDetailsPageWrapper() {
  return (
    <PermissionGate permission="jobs.read" fallback={<UnauthorizedPage />}>
      <SuspenseBoundary type="table">
        <ScheduledJobDetailsPage />
      </SuspenseBoundary>
    </PermissionGate>
  );
}
