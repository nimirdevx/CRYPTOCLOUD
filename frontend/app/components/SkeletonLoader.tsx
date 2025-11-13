export function FileItemSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 glass-light rounded-xl animate-pulse">
      <div className="flex items-center gap-4 flex-1">
        <div className="shrink-0">
          <div className="w-8 h-8 bg-gray-600 rounded"></div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-600 rounded w-3/4"></div>
          <div className="h-3 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
      <div className="w-24 h-9 bg-gray-600 rounded-lg"></div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass p-6 rounded-2xl shadow-2xl animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-600 rounded-xl"></div>
        <div className="h-6 bg-gray-600 rounded w-1/3"></div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-700 rounded w-4/6"></div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center animate-pulse">
          <div className="space-y-3">
            <div className="h-10 bg-gray-700 rounded w-64"></div>
            <div className="h-4 bg-gray-700 rounded w-48"></div>
          </div>
          <div className="flex gap-3">
            <div className="w-24 h-10 bg-gray-700 rounded-lg"></div>
            <div className="w-24 h-10 bg-gray-700 rounded-lg"></div>
          </div>
        </div>

        {/* Upload Card Skeleton */}
        <CardSkeleton />

        {/* Files Card Skeleton */}
        <div className="glass p-6 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-3 mb-6 animate-pulse">
            <div className="w-10 h-10 bg-gray-600 rounded-xl"></div>
            <div className="space-y-2">
              <div className="h-6 bg-gray-600 rounded w-32"></div>
              <div className="h-4 bg-gray-700 rounded w-24"></div>
            </div>
          </div>
          <div className="space-y-3">
            <FileItemSkeleton />
            <FileItemSkeleton />
            <FileItemSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
