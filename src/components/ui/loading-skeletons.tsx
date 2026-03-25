import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function PageHeaderSkeleton({ withActions = false }: { withActions?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {withActions && <Skeleton className="h-9 w-28 rounded-md" />}
    </div>
  );
}

function SectionHeaderSkeleton({
  withAction = false,
}: {
  withAction?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      {withAction && <Skeleton className="h-9 w-28 rounded-md" />}
    </div>
  );
}

function FilterBarSkeleton() {
  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="border-b px-4 py-4 sm:px-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
      </div>
      <div className="flex flex-wrap gap-3 px-4 py-4 sm:px-5">
        <Skeleton className="h-9 w-36 rounded-md" />
        <Skeleton className="h-9 w-36 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
    </div>
  );
}

function SettingsNavSkeleton() {
  return (
    <div className="flex gap-3 border-b pb-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-8 w-24 rounded-md" />
      ))}
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  columns = 6,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card shadow-sm", className)}>
      <div className="border-b bg-muted/40 px-4 py-3">
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} className="h-3 w-20" />
          ))}
        </div>
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-4 px-4 py-4"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((__, columnIndex) => (
              <Skeleton
                key={`${rowIndex}-${columnIndex}`}
                className={cn(
                  "h-4",
                  columnIndex === columns - 1
                    ? "w-16 justify-self-end"
                    : "w-full max-w-[10rem]",
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border bg-card p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-4 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-8 w-24" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>
      <section className="space-y-4">
        <SectionHeaderSkeleton />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border bg-card p-6 shadow-sm"
            >
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-4 h-8 w-40" />
              <Skeleton className="mt-2 h-3 w-40" />
            </div>
          ))}
        </div>
      </section>
      <section className="space-y-4">
        <SectionHeaderSkeleton withAction />
        <TableSkeleton rows={5} columns={6} />
      </section>
    </div>
  );
}

export function TablePageSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <FilterBarSkeleton />
      <section className="space-y-4">
        <SectionHeaderSkeleton />
        <TableSkeleton />
      </section>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="max-w-5xl space-y-8">
      <PageHeaderSkeleton withActions />
      <section className="space-y-4">
        <SectionHeaderSkeleton />
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>
        </div>
      </section>
      <section className="space-y-4">
        <SectionHeaderSkeleton />
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-xl border bg-card p-6 shadow-sm">
              <Skeleton className="h-5 w-28" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: 5 }).map((__, lineIndex) => (
                  <Skeleton key={lineIndex} className="h-4 w-full" />
                ))}
              </div>
            </div>
          ))}
          <div className="rounded-xl border bg-card p-6 shadow-sm lg:col-span-2">
            <Skeleton className="h-5 w-24" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function RatesSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <section className="space-y-4">
        <SectionHeaderSkeleton withAction />
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-xl border bg-card shadow-sm">
            <div className="border-b px-6 py-5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-2 h-4 w-44" />
            </div>
            <TableSkeleton rows={3} columns={6} className="rounded-none border-0 shadow-none" />
          </div>
        ))}
      </section>
      <section className="space-y-4">
        <SectionHeaderSkeleton withAction />
        <TableSkeleton rows={4} columns={6} />
      </section>
    </div>
  );
}

export function ReviewsSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton withActions />
      <FilterBarSkeleton />
      <section className="space-y-4">
        <SectionHeaderSkeleton />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="mt-4 h-4 w-40" />
              <Skeleton className="mt-4 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-[92%]" />
              <Skeleton className="mt-2 h-4 w-[80%]" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <SettingsNavSkeleton />
      <section className="max-w-5xl space-y-4">
        <SectionHeaderSkeleton />
        <div className="max-w-3xl space-y-6 rounded-xl border bg-card p-6 shadow-sm">
          {Array.from({ length: 4 }).map((_, sectionIndex) => (
            <div key={sectionIndex} className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-72 max-w-full" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-end">
            <Skeleton className="h-10 w-28 rounded-md" />
          </div>
        </div>
      </section>
    </div>
  );
}

export function SettingsTableSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <SettingsNavSkeleton />
      <section className="space-y-4">
        <SectionHeaderSkeleton withAction />
        <TableSkeleton />
      </section>
    </div>
  );
}

export function RoomsSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton withActions />
      <SettingsNavSkeleton />
      <section className="space-y-4">
        <SectionHeaderSkeleton />
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-xl border bg-card shadow-sm">
              <div className="border-b px-6 py-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-4 w-64 max-w-full" />
                  </div>
                  <Skeleton className="h-9 w-24 rounded-md" />
                </div>
              </div>
              <div className="divide-y">
                {Array.from({ length: 3 }).map((__, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="flex min-h-14 flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-7 w-32 rounded-md" />
                      <Skeleton className="size-8 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <section className="space-y-4">
        <SectionHeaderSkeleton />
        <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-9 w-40 rounded-md" />
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-9 w-40 rounded-md" />
          </div>
          <Skeleton className="h-4 w-72 max-w-full" />
          <div className="overflow-hidden rounded-lg border">
            <div className="grid grid-cols-[180px_repeat(7,minmax(0,1fr))] gap-px bg-border">
              {Array.from({ length: 32 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-card px-3 py-3"
                >
                  <Skeleton className={index < 8 ? "h-4 w-full" : "h-8 w-full"} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
