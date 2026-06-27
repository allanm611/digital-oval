import WorkflowDetailsPage from "./WorkflowDetailsPage";
import { useLanguage } from "../../../contexts/LanguageContext";
import { SuspenseBoundary } from "../../../shared/components/SuspenseBoundaryWrapper";
import { PermissionGate } from "../../auth/components/PermissionGate";
import UnauthorizedPage from "../../auth/pages/UnauthorizedPage";

export default function WorkflowDetailsPageWrapper() {
  const { t } = useLanguage();
  return (
    <PermissionGate
      permission="job-workflows.read"
      fallback={<UnauthorizedPage />}
    >
      <SuspenseBoundary type="table">
        <WorkflowDetailsPage />
      </SuspenseBoundary>
    </PermissionGate>
  );
}
