import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import BackButton from '../../../shared/components/ui/BackButton';
import { navigateBackOrFallback } from '../../../shared/utils/navigation';
import NotificationSettingsContent from '../components/NotificationSettingsContent';

import { HEALTH_CHECK_BASE } from '../constants/routes';

export default function HealthCheckNotificationsPage() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigateBackOrFallback(navigate, HEALTH_CHECK_BASE);
  };

  return (
    <div className="space-y-6">
      <BackButton
        showBreadcrumb
        parentLabel="Health Check"
        currentLabel="Notifications"
        onClick={handleBack}
      />

      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shrink-0">
          <Bell size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure global email alerts and send test notifications for health-check failures.
          </p>
        </div>
      </div>

      <NotificationSettingsContent onCancel={handleBack} showCancel />
    </div>
  );
}
