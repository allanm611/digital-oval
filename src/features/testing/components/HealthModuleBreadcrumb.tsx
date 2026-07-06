import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HEALTH_CHECK_BASE, healthCheckModulePath } from '../constants/routes';

export interface HealthBreadcrumbItem {
  label: string;
  path?: string;
}

interface HealthModuleBreadcrumbProps {
  items: HealthBreadcrumbItem[];
  className?: string;
}
/**
 * Multi-level breadcrumb for health-check module flows:
 * Health Check > {module} > Edit / Schedule / Logs
 */
export default function HealthModuleBreadcrumb({
  items,
  className = '',
}: HealthModuleBreadcrumbProps) {
  const navigate = useNavigate();

  if (items.length === 0) {
    return null;
  }

  const parents = items.slice(0, -1);
  const current = items[items.length - 1];

  const handleBack = () => {
    const previous = parents[parents.length - 1];
    if (previous?.path) {
      navigate(previous.path);
      return;
    }
    navigate(HEALTH_CHECK_BASE);
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-2 text-base ${className}`}
    >
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center text-gray-700 hover:text-black transition-colors"
        aria-label={
          parents.length > 0
            ? `Go back to ${parents[parents.length - 1].label}`
            : 'Go back to Health Check'
        }
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <ol className="flex items-center gap-1 text-base flex-wrap">
        {parents.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="w-3 h-3 text-gray-400" aria-hidden="true" />
            )}
            {item.path ? (
              <button
                type="button"
                onClick={() => navigate(item.path!)}
                className="text-base text-gray-600 hover:text-black transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <span className="text-base text-gray-600">{item.label}</span>
            )}
          </li>
        ))}

        {parents.length > 0 && (
          <li className="text-gray-400" aria-hidden="true">
            <ChevronRight className="w-3 h-3" />
          </li>
        )}

        <li className="text-base font-medium text-gray-900" aria-current="page">
          {current.label}
        </li>
      </ol>
    </nav>
  );
}

export function healthCheckListCrumb(): HealthBreadcrumbItem {
  return { label: 'Health Check', path: HEALTH_CHECK_BASE };
}

export function healthCheckModuleCrumb(
  moduleId: string,
  moduleName: string,
): HealthBreadcrumbItem {
  return {
    label: moduleName,
    path: healthCheckModulePath(moduleId),
  };
}
