import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingProjectPage() {
  return (
    <div>
      <div className="mb-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-3 h-4 w-96" />
      </div>

      <div className="mb-8">
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>

      <div className="mb-8">
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    </div>
  );
}

