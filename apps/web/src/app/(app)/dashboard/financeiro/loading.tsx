
import { Skeleton } from '@pgb/ui';

export default function FinanceiroLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:gap-4 lg:gap-5 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl shadow-sm" />
        ))}
      </div>

      {/* Filters & Content Area */}
      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <div className="space-y-6">
          {/* Filter Card */}
          <Skeleton className="h-[400px] rounded-xl shadow-sm" />
        </div>

        <div className="space-y-6">
          {/* Chart/Table Area */}
          <Skeleton className="h-[200px] w-full rounded-xl shadow-sm" />

          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
