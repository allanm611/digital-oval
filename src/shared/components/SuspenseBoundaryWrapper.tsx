import React, { Suspense, SuspenseList } from "react";
import {
  PageHeaderSkeleton,
  FormSkeleton,
  StepperSkeleton,
  DetailPageSkeleton,
  ListPageSkeleton,
  TableSkeleton,
  CardGridSkeleton,
} from "./skeletons/PageSkeleton";

interface SuspenseBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: (error: Error) => React.ReactNode;
  type?: "form" | "stepper" | "detail" | "list" | "table" | "grid";
}

/**
 * Wrapper for Suspense boundaries with error handling
 * Shows appropriate skeleton based on page type
 */
export function SuspenseBoundary({
  children,
  fallback,
  errorFallback,
  type = "form",
}: SuspenseBoundaryProps) {
  const defaultFallbacks = {
    form: <FormSkeleton />,
    stepper: <StepperSkeleton />,
    detail: <DetailPageSkeleton />,
    list: <ListPageSkeleton />,
    table: <TableSkeleton />,
    grid: <CardGridSkeleton />,
  };

  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback || defaultFallbacks[type]}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 * Multiple independent Suspense boundaries that load in order
 * Better UX than waiting for all data at once
 */
export function SuspenseList_({
  children,
  revealOrder = "forwards",
  tail = "collapsed",
}: {
  children: React.ReactNode;
  revealOrder?: "forwards" | "backwards" | "together";
  tail?: "collapsed" | "hidden";
}) {
  return (
    <SuspenseList revealOrder={revealOrder} tail={tail}>
      {children}
    </SuspenseList>
  );
}

/**
 * Simple error boundary for Suspense errors
 */
class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback?: (error: Error) => React.ReactNode;
  },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback?: (error: Error) => React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback?.(this.state.error) || (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-red-900 font-bold mb-2">Error Loading Data</h3>
            <p className="text-red-700 text-sm">{this.state.error.message}</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
