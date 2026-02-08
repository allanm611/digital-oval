import JobExecutionDetailsPage from "./JobExecutionDetailsPage";
import { SuspenseBoundary } from "../../../shared/components/SuspenseBoundaryWrapper";
import { PermissionGate } from "../../auth/components/PermissionGate";
import UnauthorizedPage from "../../auth/pages/UnauthorizedPage";

export default function JobExecutionDetailsPageWrapper() {
  return (
    <PermissionGate permission="job-executions.read" fallback={<UnauthorizedPage />}>
      <SuspenseBoundary type="table">
        <JobExecutionDetailsPage />
      </SuspenseBoundary>
    </PermissionGate>
  );
}
