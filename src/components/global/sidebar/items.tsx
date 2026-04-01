"use client";

import { SIDEBAR_MENU } from "@/constants/menu";
import { cn } from "@/lib/utils";
import DashboardLink from "../dashboard/link";
import React from "react";

type Props = {
  page: string;
};

const Items = ({ page }: Props) => {
  return SIDEBAR_MENU.map((item) => (
    <DashboardLink
      key={item.id}
      href={item.path ? `/dashboard/${item.path}` : "/dashboard"}
      className={cn(
        "flex items-center gap-x-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all",
        page === item.path && "bg-[#e8f0fe] text-[#1a73e8] shadow-sm",
        page === "dashboard" && item.path === ""
          ? "bg-[#e8f0fe] text-[#1a73e8] shadow-sm"
          : "text-slate-500 hover:bg-[#eef3fd] hover:text-[#1a73e8]"
      )}
    >
      {item.icon}
      {item.label}
    </DashboardLink>
  ));
};

export default Items;
