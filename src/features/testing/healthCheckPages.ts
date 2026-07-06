/**
 * Lazy-loaded health-check page components.
 * Centralized here so App.tsx can declare nested routes under /health-check.
 */

import { lazy } from 'react';

export const TestingDashboardPage = lazy(
  () => import('./pages/TestingDashboardPageWrapper'),
);
export const CreateModulePage = lazy(
  () => import('./pages/CreateModulePageWrapper'),
);
export const AIInsightsPage = lazy(
  () => import('./pages/AIInsightsPageWrapper'),
);
export const HealthCheckNotificationsPage = lazy(
  () => import('./pages/HealthCheckNotificationsPageWrapper'),
);
export const ModuleLogsPage = lazy(
  () => import('./pages/ModuleLogsPageWrapper'),
);
export const EditModulePage = lazy(
  () => import('./pages/EditModulePageWrapper'),
);
export const ModuleSchedulePage = lazy(
  () => import('./pages/ModuleSchedulePageWrapper'),
);
export const ModuleDetailPage = lazy(
  () => import('./pages/ModuleDetailPageWrapper'),
);
