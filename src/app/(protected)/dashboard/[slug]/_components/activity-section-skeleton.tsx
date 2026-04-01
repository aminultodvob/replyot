import { Skeleton } from "@/components/ui/skeleton";

const ActivitySectionSkeleton = () => {
  return (
    <div className="app-panel rounded-[32px] p-6">
      <div className="mb-5 space-y-3">
        <Skeleton className="h-8 w-52 rounded-xl" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-[24px]" />
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-[24px]" />
          <Skeleton className="h-24 rounded-[24px]" />
          <Skeleton className="h-24 rounded-[24px]" />
        </div>
      </div>
    </div>
  );
};

export default ActivitySectionSkeleton;
