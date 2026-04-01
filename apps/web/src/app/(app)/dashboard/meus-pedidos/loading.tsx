import { Skeleton } from '@pgb/ui';

export default function MeusPedidosLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-zinc-800 space-y-6">
          {/* Filters Area */}
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>

        <div className="p-0">
          {/* Header */}
          <div className="h-12 bg-slate-50 dark:bg-zinc-900/40 border-b border-slate-200 dark:border-zinc-800 flex items-center px-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-4 w-24" />
            ))}
          </div>
          {/* Rows */}
          <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
