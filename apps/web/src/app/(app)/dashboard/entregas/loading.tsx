
import { Skeleton } from '@pgb/ui';

export default function EntregasLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Filters Card */}
      <Skeleton className="h-[280px] w-full rounded-xl shadow-sm" />

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="p-0">
          {/* Header */}
          <div className="h-12 bg-slate-50 border-b border-slate-200 flex items-center px-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-4 w-24" />
            ))}
          </div>
          {/* Rows */}
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 flex items-center px-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map(j => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
