"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { usePaths } from "@/hooks/user-nav";
import DashboardLink from "../dashboard/link";
import { ArrowRight } from "lucide-react";
type Props = {};

function GoToAutomationsButton({}: Props) {
  const { pathname } = usePaths();
  const href = `${pathname}/automations`;
  return (
    <Button
      variant="outline"
      className="h-12 rounded-2xl border-[#d2e3fc] bg-[#eef3fd] px-5 font-medium text-[#1a73e8] hover:bg-[#e2ecfb]"
      asChild
    >
      <DashboardLink
        href={href}
      >
        <ArrowRight size={16} />
        <p className="hidden lg:inline">Continue Setup</p>
      </DashboardLink>
    </Button>
  );
}

export default GoToAutomationsButton;
