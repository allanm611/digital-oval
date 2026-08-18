import JobExecutionDetailsPage from "./JobExecutionDetailsPage";
import { useLanguage } from "../../../contexts/LanguageContext";
import { SuspenseBoundary } from "../../../shared/components/SuspenseBoundaryWrapper";
import { PermissionGate } from "../../auth/components/PermissionGate";
import UnauthorizedPage from "../../auth/pages/UnauthorizedPage";

export default function JobExecutionDetailsPageWrapper() {
  const { t } = useLanguage();
  return (
    <PermissionGate
      permission="job-executions.read"
      fallback={<UnauthorizedPage />}
    >
      <SuspenseBoundary type="table">
        <JobExecutionDetailsPage />
      </SuspenseBoundary>
    </PermissionGate>
  );
}
