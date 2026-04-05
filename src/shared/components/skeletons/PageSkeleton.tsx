
export function PageHeaderSkeleton() {
  return (
    <div className="mb-8 space-y-3">
      <div className="h-8 bg-[var(--c-interactive-hover)] rounded w-1/3 animate-pulse"></div>
      <div className="h-4 bg-[var(--c-interactive-hover)] rounded w-1/2 animate-pulse"></div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-[var(--c-interactive-hover)] rounded w-24 animate-pulse"></div>
          <div className="h-10 bg-[var(--c-interactive-hover)] rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-12 bg-[var(--c-interactive-hover)] rounded animate-pulse"></div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-64 bg-[var(--c-interactive-hover)] rounded-lg animate-pulse"
        ></div>
      ))}
    </div>
  );
}

export function StepperSkeleton({ steps = 5 }: { steps?: number }) {
  return (
    <div className="space-y-8">
      {/* Step indicators */}
      <div className="flex justify-between items-center">
        {Array.from({ length: steps }).map((_, i) => (
          <div key={i} className="flex items-center">
            <div className="w-10 h-10 bg-[var(--c-interactive-hover)] rounded-full animate-pulse"></div>
            {i < steps - 1 && <div className="w-12 h-1 bg-[var(--c-interactive-hover)] mx-2 animate-pulse"></div>}
          </div>
        ))}
      </div>

      {/* Form content */}
      <FormSkeleton />
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FormSkeleton />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[var(--c-interactive-hover)] rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ListPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="h-10 bg-[var(--c-interactive-hover)] rounded w-1/4 animate-pulse mb-4"></div>
      <TableSkeleton />
    </div>
  );
}
