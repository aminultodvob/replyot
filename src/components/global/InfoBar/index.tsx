"use client";

import { PAGE_BREAD_CRUMBS } from "@/constants/pages";
import { usePaths } from "@/hooks/user-nav";
import { Menu } from "lucide-react";
import React from "react";
import Sheet from "../sheet";
import { Notifications } from "./notifications";
import SidebarNavContent from "../sidebar/nav-content";
import { UserPlan } from "@/types/dashboard";

type Props = {
  currentPlan?: UserPlan;
};

const InfoBar = ({ currentPlan = null }: Props) => {
  const { page } = usePaths();
  const currentPage = PAGE_BREAD_CRUMBS.includes(page) || page === "dashboard";

  return (
    currentPage && (
      <div className="mb-6 app-shell sticky top-3 z-40 flex flex-wrap items-center gap-3 rounded-[24px] border border-white/60 px-3 py-3 shadow-sm sm:px-4 lg:mb-8 lg:rounded-full lg:px-6">
        <span className="flex items-center gap-x-2 lg:hidden">
          <Sheet trigger={<Menu className="text-zinc-700" />} className="lg:hidden" side="left">
            <SidebarNavContent
              page={page}
              currentPlan={currentPlan}
            />
          </Sheet>
        </span>
        <div className="hidden min-w-0 lg:block">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Workspace
          </p>
          <p className="text-xl font-bold capitalize tracking-tight text-zinc-900">
            {page === "dashboard" ? "Home" : page}
          </p>
        </div>
        <div className="ml-auto lg:ml-auto">
          <Notifications />
        </div>
      </div>
    )
  );
};

export default InfoBar;
