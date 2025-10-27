export default function SkeletonLoader() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Balance Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="skeleton h-4 w-32 rounded mb-4"></div>
            <div className="skeleton h-8 w-48 rounded mb-2"></div>
            <div className="skeleton h-3 w-24 rounded"></div>
          </div>
        ))}
      </div>

      {/* Recent Transactions Skeleton */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="skeleton h-6 w-48 rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex-1">
                <div className="skeleton h-4 w-32 rounded mb-2"></div>
                <div className="skeleton h-3 w-48 rounded"></div>
              </div>
              <div className="skeleton h-5 w-24 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
