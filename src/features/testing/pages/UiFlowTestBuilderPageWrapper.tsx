import UiFlowTestBuilderPage from './UiFlowTestBuilderPage';
import { SuspenseBoundary } from '../../../shared/components/SuspenseBoundaryWrapper';

export default function UiFlowTestBuilderPageWrapper() {
  return (
    <SuspenseBoundary type="form">
      <UiFlowTestBuilderPage />
    </SuspenseBoundary>
  );
}
