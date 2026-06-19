import CreateModulePage from './CreateModulePage';
import { SuspenseBoundary } from '../../../shared/components/SuspenseBoundaryWrapper';

export default function CreateModulePageWrapper() {
  return (
    <SuspenseBoundary type="form">
      <CreateModulePage />
    </SuspenseBoundary>
  );
}
