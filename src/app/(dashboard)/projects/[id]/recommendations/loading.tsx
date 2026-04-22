import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingRecommendations() {
  return (
    <div>
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-3 h-4 w-96" />

      <div className="mt-8 space-y-4">
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
    </div>
  );
}

