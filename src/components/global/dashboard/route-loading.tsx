"use client";

import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  variant?: "overview" | "list" | "detail" | "compact";
};

const DashboardRouteLoading = ({ variant = "overview" }: Props) => {
  if (variant === "list") {
    return (
      <div className="space-y-6">
        <div className="app-panel rounded-[28px] p-6">
          <Skeleton className="h-6 w-24 rounded-xl" />
          <Skeleton className="mt-3 h-9 w-72 rounded-xl" />
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-52 rounded-[22px]" />
            ))}
          </div>
        </div>
        <div className="app-panel rounded-[28px] p-5">
          <Skeleton className="h-6 w-28 rounded-xl" />
          <Skeleton className="mt-3 h-8 w-56 rounded-xl" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-[20px]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-[24px]" />
        <div className="space-y-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="app-panel space-y-4 rounded-[24px] p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-7 w-56 rounded-xl" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-32 w-full rounded-[20px]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-56 rounded-xl" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="app-panel space-y-4 rounded-[28px] p-5">
              <Skeleton className="h-7 w-40 rounded-xl" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-20 w-full rounded-[20px]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="app-panel space-y-4 rounded-[28px] p-6">
        <Skeleton className="h-8 w-56 rounded-xl" />
        <Skeleton className="h-4 w-80 max-w-full" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-[20px]" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Skeleton className="app-panel h-80 rounded-[28px]" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="app-panel h-24 rounded-[24px]" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardRouteLoading;
