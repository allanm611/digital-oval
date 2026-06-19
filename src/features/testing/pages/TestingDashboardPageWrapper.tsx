/**
 * TestingDashboardPageWrapper - Suspense-enabled wrapper for the health dashboard.
 */
import TestingDashboardPage from './TestingDashboardPage';
import { SuspenseBoundary } from '../../../shared/components/SuspenseBoundaryWrapper';

export default function TestingDashboardPageWrapper() {
  return (
    <SuspenseBoundary type="grid">
      <TestingDashboardPage />
    </SuspenseBoundary>
  );
}
