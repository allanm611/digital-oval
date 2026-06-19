import EditModulePage from './EditModulePage';
import { SuspenseBoundary } from '../../../shared/components/SuspenseBoundaryWrapper';

export default function EditModulePageWrapper() {
  return (
    <SuspenseBoundary type="form">
      <EditModulePage />
    </SuspenseBoundary>
  );
}
