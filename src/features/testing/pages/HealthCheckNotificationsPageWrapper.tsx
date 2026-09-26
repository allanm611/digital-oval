import HealthCheckNotificationsPage from './HealthCheckNotificationsPage';
import { SuspenseBoundary } from '../../../shared/components/SuspenseBoundaryWrapper';

export default function HealthCheckNotificationsPageWrapper() {
  return (
    <SuspenseBoundary type="form">
      <HealthCheckNotificationsPage />
    </SuspenseBoundary>
  );
}
