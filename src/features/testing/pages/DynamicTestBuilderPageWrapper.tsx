import DynamicTestBuilderPage from './DynamicTestBuilderPage';
import { SuspenseBoundary } from '../../../shared/components/SuspenseBoundaryWrapper';

export default function DynamicTestBuilderPageWrapper() {
  return (
    <SuspenseBoundary type="form">
      <DynamicTestBuilderPage />
    </SuspenseBoundary>
  );
}
