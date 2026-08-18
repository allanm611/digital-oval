import ModuleDetailPage from './ModuleDetailPage';
import { SuspenseBoundary } from '../../../shared/components/SuspenseBoundaryWrapper';

export default function ModuleDetailPageWrapper() {
  return (
    <SuspenseBoundary type="detail">
      <ModuleDetailPage />
    </SuspenseBoundary>
  );
}
