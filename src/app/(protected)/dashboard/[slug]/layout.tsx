import InfoBar from "@/components/global/InfoBar";
import { DashboardNavigationProvider } from "@/components/global/dashboard/navigation-feedback";
import Sidebar from "@/components/global/sidebar";
import { onUserInfo } from "@/actions/user";
import React from "react";
import { UserPlan } from "@/types/dashboard";
import { deriveCurrentPlan } from "@/lib/billing";

type Props = {
  children: React.ReactNode;
  params: { slug: string };
};

async function layout({ children }: Props) {
  const profile = await onUserInfo();
  const currentPlan: UserPlan =
    profile.status === 200 ? deriveCurrentPlan(profile.data?.subscription) : null;

  return (
    <DashboardNavigationProvider>
      <div className="min-h-screen">
        <Sidebar
          currentPlan={currentPlan}
          firstname={profile.status === 200 ? profile.data?.firstname : null}
          lastname={profile.status === 200 ? profile.data?.lastname : null}
        />
        <div className="flex min-h-screen flex-col px-4 pb-10 pt-4 lg:ml-64 lg:px-8 lg:pb-12 lg:pt-4">
          <InfoBar currentPlan={currentPlan} />
          {children}
        </div>
      </div>
    </DashboardNavigationProvider>
  );
}

export default layout;
