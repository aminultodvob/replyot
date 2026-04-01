"use client";
import { usePaths } from "@/hooks/user-nav";
import { UserPlan } from "@/types/dashboard";
import React from "react";
import SidebarNavContent from "./nav-content";

type Props = {
  currentPlan: UserPlan;
  firstname?: string | null;
  lastname?: string | null;
};

const Sidebar = ({ currentPlan, firstname, lastname }: Props) => {
  const { page } = usePaths();

  return (
    <div
      className="fixed bottom-0 left-0 top-0 hidden w-[252px] border-r border-white/50 bg-white/40 backdrop-blur-xl shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] lg:block"
    >
      <SidebarNavContent
        page={page}
        currentPlan={currentPlan}
        firstname={firstname}
        lastname={lastname}
      />
    </div>
  );
};

export default Sidebar;
