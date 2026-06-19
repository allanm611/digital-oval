import ModuleLogsPage from './ModuleLogsPage';
import { SuspenseBoundary } from '../../../shared/components/SuspenseBoundaryWrapper';

export default function ModuleLogsPageWrapper() {
  return (
    <SuspenseBoundary type="detail">
      <ModuleLogsPage />
    </SuspenseBoundary>
  );
}
