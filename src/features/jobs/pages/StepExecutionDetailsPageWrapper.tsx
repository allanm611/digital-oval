import StepExecutionDetailsPage from "./StepExecutionDetailsPage";
import { SuspenseBoundary } from "../../../shared/components/SuspenseBoundaryWrapper";
import { PermissionGate } from "../../auth/components/PermissionGate";
import UnauthorizedPage from "../../auth/pages/UnauthorizedPage";

export default function StepExecutionDetailsPageWrapper() {
  return (
    <PermissionGate permission="jobs.read" fallback={<UnauthorizedPage />}>
      <SuspenseBoundary type="table">
        <StepExecutionDetailsPage />
      </SuspenseBoundary>
    </PermissionGate>
  );
}
