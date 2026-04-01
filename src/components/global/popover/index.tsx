"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import React from "react";

type Props = {
  trigger: JSX.Element;
  children: React.ReactNode;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const PopOver = ({ children, trigger, className, open, onOpenChange }: Props) => {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className={cn("app-panel rounded-[24px] border-slate-200 p-4 shadow-2xl", className)}
        align="end"
        side="bottom"
      >
        {children}
      </PopoverContent>
    </Popover>
  );
};

export default PopOver;
