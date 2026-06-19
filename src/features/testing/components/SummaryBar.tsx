import React from 'react';
import {
  Activity, CheckCircle2, HelpCircle, Layers, Loader2, XCircle,
} from 'lucide-react';
import { tw, color } from '../../../shared/utils/utils';
import type { HealthDashboardData } from '../types/health';

interface SummaryBarProps {
  summary?: HealthDashboardData['summary'];
}

const defaultSummary = {
  total: 0,
  passing: 0,
  failing: 0,
  running: 0,
  unknown: 0,
};

const SummaryBar: React.FC<SummaryBarProps> = ({ summary = defaultSummary }) => {
  const summaryData = summary ?? defaultSummary;
  const totalRan = summaryData.passing + summaryData.failing;
  const passRate = totalRan > 0 ? Math.round((summaryData.passing / totalRan) * 100) : null;

  const cards = [
    {
      key: 'total',
      label: 'Total Modules',
      value: summaryData.total,
      icon: <Layers className="h-5 w-5" style={{ color: color.primary.accent }} />,
    },
    {
      key: 'passing',
      label: 'Passing',
      value: summaryData.passing,
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    },
    {
      key: 'failing',
      label: 'Failing',
      value: summaryData.failing,
      icon: <XCircle className="h-5 w-5 text-rose-500" />,
    },
    {
      key: 'running',
      label: 'Running',
      value: summaryData.running,
      icon: <Loader2 className="h-5 w-5 text-blue-500" />,
    },
    {
      key: 'unknown',
      label: 'Unknown',
      value: summaryData.unknown,
      icon: <HelpCircle className="h-5 w-5 text-amber-500" />,
    },
  ] as const;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div
          key={card.key}
          className={`${tw.rounded} border border-gray-200 bg-white p-5 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            {card.icon}
            <p className="text-sm font-medium text-gray-600">{card.label}</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">{card.value}</p>
        </div>
      ))}

      {passRate !== null && (
        <div className={`${tw.rounded} border border-gray-200 bg-white p-5 shadow-sm`}>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-gray-500" />
            <p className="text-sm font-medium text-gray-600">Pass Rate</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">{passRate}%</p>
          <p className="text-xs text-gray-500 mt-1">
            {summaryData.passing}/{totalRan} modules
          </p>
        </div>
      )}
    </div>
  );
};

export default SummaryBar;
