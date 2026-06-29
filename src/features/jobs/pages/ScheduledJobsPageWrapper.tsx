

import ScheduledJobsPage from "./ScheduledJobsPage";
import { useLanguage } from "../../../contexts/LanguageContext";
import { SuspenseBoundary } from "../../../shared/components/SuspenseBoundaryWrapper";
// import { PermissionGate } from "../../auth/components/PermissionGate";
// import UnauthorizedPage from "../../auth/pages/UnauthorizedPage";


export default function ScheduledJobsPageWrapper() {
  const { t } = useLanguage();
  return (
    // <PermissionGate permission="jobs.read" fallback={<UnauthorizedPage />}>
      <SuspenseBoundary type="table">
        <ScheduledJobsPage />
      </SuspenseBoundary>
    // </PermissionGate>
  );
}


export function ScheduledJobsPageWithErrorHandling() {
  const { t } = useLanguage();
  return (
    <SuspenseBoundary
      type="table"
      errorFallback={(error) => (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-900 font-bold mb-2">
            {t.jobs.failedToLoadScheduledJobs || "Failed to Load Scheduled Jobs"}
          </h3>
          <p className="text-red-700 text-sm">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className={`mt-4 px-4 py-2 bg-red-600  rounded hover:bg-red-700`}
          >
            {t.common.retry || "Retry"}
          </button>
        </div>
      )}
    >
      <ScheduledJobsPage />
    </SuspenseBoundary>
  );
}
