import StepExecutionDetailsPage from "./StepExecutionDetailsPage";
import { useLanguage } from "../../../contexts/LanguageContext";
import { SuspenseBoundary } from "../../../shared/components/SuspenseBoundaryWrapper";
import { PermissionGate } from "../../auth/components/PermissionGate";
import UnauthorizedPage from "../../auth/pages/UnauthorizedPage";

export default function StepExecutionDetailsPageWrapper() {
  const { t } = useLanguage();
  return (
    <PermissionGate permission="jobs.read" fallback={<UnauthorizedPage />}>
      <SuspenseBoundary type="table">
        <StepExecutionDetailsPage />
      </SuspenseBoundary>
    </PermissionGate>
  );
}
