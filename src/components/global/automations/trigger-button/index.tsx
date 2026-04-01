"use client";

import React from "react";
import PopOver from "../../popover";
import { BlueAddIcon } from "@/icons";
import { useState } from "react";

type Props = {
  label: string;
  children:
    | React.ReactNode
    | ((state: { open: boolean; setOpen: (open: boolean) => void }) => React.ReactNode);
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function TriggerButton({ children, label, open: controlledOpen, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <PopOver
      open={open}
      onOpenChange={setOpen}
      className="w-[400px]"
      trigger={
        <div className="app-panel-muted flex w-full cursor-pointer items-center justify-center gap-x-2 rounded-[22px] border border-dashed border-slate-300 p-5 text-slate-700 transition hover:border-slate-500 hover:bg-white">
          <BlueAddIcon />
          <p className="font-semibold">{label}</p>
        </div>
      }
    >
      {typeof children === "function" ? children({ open, setOpen }) : children}
    </PopOver>
  );
}

export default TriggerButton;
