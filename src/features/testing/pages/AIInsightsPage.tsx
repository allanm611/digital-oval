import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Brain } from 'lucide-react';
import BackButton from '../../../shared/components/ui/BackButton';
import { navigateBackOrFallback } from '../../../shared/utils/navigation';
import { useHealthStatus } from '../hooks/useHealthStatus';
import AIInsightsContent from '../components/AIInsightsContent';
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner';

import { HEALTH_CHECK_BASE } from '../constants/routes';

type TabParam = 'overview' | 'analysis' | 'generate';

function parseTab(value: string | null): TabParam {
  if (value === 'analysis' || value === 'generate') return value;
  return 'overview';
}

export default function AIInsightsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data, isLoading } = useHealthStatus();

  const runId = searchParams.get('runId');
  const initialTab = parseTab(searchParams.get('tab'));

  const modules = useMemo(() => data?.modules ?? [], [data?.modules]);

  const handleBack = () => {
    navigateBackOrFallback(navigate, HEALTH_CHECK_BASE);
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner variant="modern" size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton
        showBreadcrumb
        parentLabel="Health Check"
        currentLabel="AI Insights"
        onClick={handleBack}
      />

      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shrink-0">
          <Brain size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
          <p className="text-sm text-gray-500 mt-1">
            Health overview, failure analysis, and test stub generation powered by Claude.
          </p>
        </div>
      </div>

      <AIInsightsContent
        modules={modules}
        runId={runId}
        initialTab={initialTab}
      />
    </div>
  );
}
