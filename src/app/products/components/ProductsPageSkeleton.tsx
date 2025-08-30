/**
 * Loading skeleton for Products page
 */
export function ProductsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Toolbar Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="h-10 w-80 bg-gray-200 rounded-md animate-pulse" />

          {/* Filters */}
          <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse" />
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="h-10 w-20 bg-gray-200 rounded-md animate-pulse" />

          {/* Sort */}
          <div className="h-10 w-40 bg-gray-200 rounded-md animate-pulse" />
        </div>
      </div>

      {/* Results count */}
      <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />

      {/* Products Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2">
          <div className="h-10 w-20 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-10 w-10 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-10 w-10 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-10 w-10 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-10 w-20 bg-gray-200 rounded-md animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/**
 * Product card skeleton
 */
function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      {/* Image */}
      <div className="aspect-square bg-gray-200 rounded-md animate-pulse" />

      {/* Title */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Price */}
      <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />

      {/* Status */}
      <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />

      {/* Actions */}
      <div className="flex gap-2">
        <div className="h-8 w-20 bg-gray-200 rounded-md animate-pulse" />
        <div className="h-8 w-20 bg-gray-200 rounded-md animate-pulse" />
      </div>
    </div>
  );
}
