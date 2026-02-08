import JobWorkflowStepDetailsPage from "./JobWorkflowStepDetailsPage";
import { SuspenseBoundary } from "../../../shared/components/SuspenseBoundaryWrapper";
import { PermissionGate } from "../../auth/components/PermissionGate";
import UnauthorizedPage from "../../auth/pages/UnauthorizedPage";

export default function JobWorkflowStepDetailsPageWrapper() {
  return (
    <PermissionGate
      permission="job-workflow-steps.read"
      fallback={<UnauthorizedPage />}
    >
      <SuspenseBoundary type="table">
        <JobWorkflowStepDetailsPage />
      </SuspenseBoundary>
    </PermissionGate>
  );
}
