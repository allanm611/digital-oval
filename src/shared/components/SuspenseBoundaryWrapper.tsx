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
      console.error("ErrorBoundary caught error:", this.state.error);
      return this.props.fallback?.(this.state.error) || null;
    }

    return this.props.children;
  }
}
