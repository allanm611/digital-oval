/**
 * HealthCheckApp
 * Standalone router for the health-check feature at /health-check/*
 * Mirrors the docs pattern at /documentation/*
 */

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { TestingLayout } from '../components/TestingLayout';
import { TestingHeader } from '../components/TestingHeader';
import { TestingSidebar } from '../components/TestingSidebar';

const TestingDashboardPage = lazy(() => import('./TestingDashboardPageWrapper'));
const CreateModulePage = lazy(() => import('./CreateModulePageWrapper'));
const AIInsightsPage = lazy(() => import('./AIInsightsPageWrapper'));
const HealthCheckNotificationsPage = lazy(
  () => import('./HealthCheckNotificationsPageWrapper'),
);
const ModuleLogsPage = lazy(() => import('./ModuleLogsPageWrapper'));
const EditModulePage = lazy(() => import('./EditModulePageWrapper'));
const ModuleSchedulePage = lazy(() => import('./ModuleSchedulePageWrapper'));
const ModuleDetailPage = lazy(() => import('./ModuleDetailPageWrapper'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3b8169]" />
    </div>
  );
}

export function HealthCheckApp() {
  return (
    <TestingLayout
      header={<TestingHeader />}
      sidebar={<TestingSidebar />}
    >
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route index element={<TestingDashboardPage />} />
          <Route path="create" element={<CreateModulePage />} />
          <Route path="insights" element={<AIInsightsPage />} />
          <Route path="notifications" element={<HealthCheckNotificationsPage />} />
          <Route path=":id/logs" element={<ModuleLogsPage />} />
          <Route path=":id/edit" element={<EditModulePage />} />
          <Route path=":id/schedule" element={<ModuleSchedulePage />} />
          <Route path=":id" element={<ModuleDetailPage />} />
          <Route path="*" element={<Navigate to="/health-check" replace />} />
        </Routes>
      </Suspense>
    </TestingLayout>
  );
}
