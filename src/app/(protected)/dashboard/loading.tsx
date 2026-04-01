import DashboardRouteLoading from "@/components/global/dashboard/route-loading";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="fixed bottom-0 left-0 top-0 hidden w-[252px] border-r border-slate-200 bg-[#f8fafc] lg:block">
        <div className="flex h-full flex-col gap-y-6 px-4 py-6">
          <div className="space-y-2 px-3">
            <Skeleton className="h-7 w-36 rounded-xl" />
            <Skeleton className="h-3 w-20 rounded-xl" />
          </div>

          <div className="space-y-2">
            {["Overview", "Automations", "Channels", "Billing"].map((item) => (
              <div
                key={item}
                className="flex items-center gap-x-3 rounded-2xl px-4 py-3.5"
              >
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-24 rounded-xl" />
              </div>
            ))}
          </div>

          <Skeleton className="mx-1 h-12 rounded-2xl" />

          <div className="mt-auto space-y-3 px-1">
            <Skeleton className="h-12 rounded-2xl" />
            <Skeleton className="h-12 rounded-2xl" />
            <div className="app-panel rounded-[24px] p-4">
              <Skeleton className="h-5 w-24 rounded-xl" />
              <Skeleton className="mt-3 h-4 w-full rounded-xl" />
              <Skeleton className="mt-2 h-4 w-10/12 rounded-xl" />
              <Skeleton className="mt-4 h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen flex-col px-4 pb-10 pt-4 lg:ml-64 lg:px-8 lg:pb-12">
        <div className="app-shell mb-8 flex items-center gap-x-3 rounded-[24px] border border-slate-200/80 px-4 py-3 lg:px-6">
          <div className="flex flex-1 items-center gap-x-2 lg:hidden">
            <Skeleton className="h-10 w-10 rounded-2xl" />
          </div>
          <div className="hidden space-y-2 lg:block">
            <Skeleton className="h-3 w-20 rounded-xl" />
            <Skeleton className="h-6 w-28 rounded-xl" />
          </div>
          <div className="flex-1 lg:ml-auto lg:max-w-xl">
            <Skeleton className="h-12 rounded-full" />
          </div>
          <Skeleton className="h-12 w-40 rounded-2xl" />
          <Skeleton className="h-12 w-12 rounded-2xl" />
        </div>

        <DashboardRouteLoading variant="overview" />
      </div>
    </div>
  );
}
