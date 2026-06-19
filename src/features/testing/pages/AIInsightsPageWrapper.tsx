import AIInsightsPage from './AIInsightsPage';
import { SuspenseBoundary } from '../../../shared/components/SuspenseBoundaryWrapper';

export default function AIInsightsPageWrapper() {
  return (
    <SuspenseBoundary type="form">
      <AIInsightsPage />
    </SuspenseBoundary>
  );
}
