import ModuleLogsPage from './ModuleLogsPage';
import { SuspenseBoundary } from '../../../shared/components/SuspenseBoundaryWrapper';

function LogsPageError({ error }: { error: Error }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-rose-800">
        <p className="font-medium">Unable to load run logs</p>
        <p className="text-sm mt-1">{error.message || 'An unexpected error occurred.'}</p>
      </div>
    </div>
  );
}

export default function ModuleLogsPageWrapper() {
  return (
    <SuspenseBoundary type="detail" errorFallback={(error) => <LogsPageError error={error} />}>
      <ModuleLogsPage />
    </SuspenseBoundary>
  );
}
