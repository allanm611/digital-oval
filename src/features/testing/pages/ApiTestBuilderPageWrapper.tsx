import ApiTestBuilderPage from './ApiTestBuilderPage';
import { SuspenseBoundary } from '../../../shared/components/SuspenseBoundaryWrapper';

export default function ApiTestBuilderPageWrapper() {
  return (
    <SuspenseBoundary type="form">
      <ApiTestBuilderPage />
    </SuspenseBoundary>
  );
}
