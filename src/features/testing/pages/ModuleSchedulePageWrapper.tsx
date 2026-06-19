import ModuleSchedulePage from './ModuleSchedulePage';
import { SuspenseBoundary } from '../../../shared/components/SuspenseBoundaryWrapper';

export default function ModuleSchedulePageWrapper() {
  return (
    <SuspenseBoundary type="form">
      <ModuleSchedulePage />
    </SuspenseBoundary>
  );
}
