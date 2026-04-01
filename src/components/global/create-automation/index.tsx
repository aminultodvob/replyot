"use client";

import { Button } from "@/components/ui/button";
import React, { useMemo } from "react";
import Loader from "../loader";
import { useCreateAutomation } from "@/hooks/use-automations";
import { v4 } from "uuid";
import { Plus } from "lucide-react";
import { trackUxEvent } from "@/lib/ux-analytics";

type Props = {
  disabled?: boolean;
  disabledReason?: string;
};

const CreateAutomation = ({ disabled = false, disabledReason }: Props) => {
  const mutationId = useMemo(() => v4(), []);
  const { isPending, mutate } = useCreateAutomation(mutationId);

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        className="h-12 rounded-2xl bg-[#1a73e8] px-5 font-medium text-white hover:bg-[#1765cc]"
        disabled={disabled || isPending}
        onClick={() => {
          trackUxEvent("automation_created");
          mutate({
            name: "Untitled",
            id: mutationId,
            createdAt: new Date(),
            keywords: [],
          });
        }}
      >
        <Loader state={isPending}>
          <Plus size={16} />
          <p>Start Setup</p>
        </Loader>
      </Button>
      {disabledReason ? (
        <p className="text-center text-xs text-slate-500">{disabledReason}</p>
      ) : null}
    </div>
  );
};

export default CreateAutomation;
