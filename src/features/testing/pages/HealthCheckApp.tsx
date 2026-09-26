/**
 * HealthCheckApp
 * Layout shell for the health-check feature at /health-check/*
 * Child routes are declared in App.tsx and rendered via <Outlet />.
 */

import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { TestingLayout } from '../components/TestingLayout';
import { TestingHeader } from '../components/TestingHeader';
import { TestingSidebar } from '../components/TestingSidebar';

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
        <Outlet />
      </Suspense>
    </TestingLayout>
  );
}
