import { ProductCardSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function ShopLoading() {
  return (
    <div className="container-edge pb-24 pt-6 md:pt-8">
      <Skeleton className="h-4 w-44" />
      <Skeleton className="mt-6 h-36 w-full rounded-2xl" />
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
