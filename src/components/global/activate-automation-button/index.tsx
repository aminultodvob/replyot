import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import React from "react";
import { useMutationData } from "@/hooks/use-mutation-data";
import { activateAutomation } from "@/actions/automations";
import { queryKeys } from "@/lib/query-keys";
import { Power } from "lucide-react";

type Props = {
  id: string;
  active: boolean;
  disabled?: boolean;
};

const ActivateAutomationButton = ({ id, active, disabled = false }: Props) => {
  const { mutate, isPending } = useMutationData(
    ["activate"],
    (data: { state: boolean }) => activateAutomation(id, data.state),
    {
      onMutate: (client, variables: { state: boolean }) => {
        const previousAutomation = client.getQueryData(queryKeys.automation(id));
        client.setQueryData(queryKeys.automation(id), (current: any) =>
          current?.data
            ? {
                ...current,
                data: {
                  ...current.data,
                  active: variables.state,
                },
              }
            : current
        );
        return {
          rollback: () => {
            client.setQueryData(queryKeys.automation(id), previousAutomation);
          },
        };
      },
      onError: (_error, variables, context) => {
        context?.rollback?.();
      },
      successToast: {
        context: "activation_toggle",
        title: (_data, variables) =>
          variables.state ? "Automation live" : "Automation disabled",
        description: (_data, variables) =>
          variables.state
            ? "Your automation is now active."
            : "Your automation has been turned off.",
      },
      errorToast: "activation_toggle",
    }
  );

  return (
    <Button
      disabled={isPending || disabled}
      onClick={() => mutate({ state: !active })}
      className="ml-4 min-w-[140px] rounded-2xl bg-slate-900 px-5 text-white hover:bg-slate-800"
    >
      {isPending ? <Loader2 className="animate-spin" /> : <Power />}

      <p className="hidden lg:inline">
        {active ? "Disable" : "Go Live"}
      </p>
    </Button>
  );
};

export default ActivateAutomationButton;
