import ScheduledJobDetailsPage from "./ScheduledJobDetailsPage";
import { useLanguage } from "../../../contexts/LanguageContext";
import { SuspenseBoundary } from "../../../shared/components/SuspenseBoundaryWrapper";
import { PermissionGate } from "../../auth/components/PermissionGate";
import UnauthorizedPage from "../../auth/pages/UnauthorizedPage";

export default function ScheduledJobDetailsPageWrapper() {
  const { t } = useLanguage();
  return (
    <PermissionGate permission="jobs.read" fallback={<UnauthorizedPage />}>
      <SuspenseBoundary type="table">
        <ScheduledJobDetailsPage />
      </SuspenseBoundary>
    </PermissionGate>
  );
}
