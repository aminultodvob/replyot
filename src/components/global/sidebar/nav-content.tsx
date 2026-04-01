"use client";

import { Separator } from "@/components/ui/separator";
import { UserPlan } from "@/types/dashboard";
import LogoLockup from "../brand/logo-lockup";
import { SubscriptionPlan } from "../subscription-plan";
import Items from "./items";
import UpgradeCard from "./upgrade";
import DashboardLink from "../dashboard/link";
import { Plus, User } from "lucide-react";
import SignOutButton from "@/components/auth/sign-out-button";

type Props = {
  page: string;
  currentPlan: UserPlan;
  firstname?: string | null;
  lastname?: string | null;
};

const SidebarNavContent = ({
  page,
  currentPlan,
  firstname,
  lastname,
}: Props) => {
  const initials = [firstname?.[0], lastname?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-full w-full flex-col gap-y-6 px-4 py-6">
      <div className="px-3 py-1">
        <LogoLockup logoClassName="w-[140px]" />
      </div>
      <div className="flex flex-col gap-y-1">
        <Items page={page} />
      </div>
      <DashboardLink
        href="/dashboard/automations"
        className="mx-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1a73e8] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1765cc]"
      >
        <Plus size={16} />
        New automation
      </DashboardLink>
      <div className="px-1">
        <Separator orientation="horizontal" className="bg-slate-200" />
      </div>
      <SubscriptionPlan type="FREE" currentPlan={currentPlan}>
        <div className="pt-2">
          <UpgradeCard />
        </div>
      </SubscriptionPlan>
      <div className="mt-auto flex flex-col gap-y-2 px-1">
        <div className="flex items-center gap-x-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a73e8] text-xs font-semibold text-white">
            {initials || <User size={14} />}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {[firstname, lastname].filter(Boolean).join(" ") || "Profile"}
            </p>
            <p className="text-xs text-slate-500">Signed in</p>
          </div>
        </div>
        <SignOutButton />
      </div>
    </div>
  );
};

export default SidebarNavContent;
