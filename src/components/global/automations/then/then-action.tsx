import { useListener } from "@/hooks/use-automations";
import React from "react";
import TriggerButton from "../trigger-button";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Loader from "../../loader";
import InlineStatus from "../../inline-status";
import { useMutationDataState } from "@/hooks/use-mutation-data";

type Props = {
  id: string;
  channel?: "INSTAGRAM" | "FACEBOOK_MESSENGER";
  label?: string;
  initialValues?: {
    listener?: "MESSAGE" | string;
    prompt?: string;
    reply?: string | null;
  };
  submitLabel?: string;
};

const ThenAction = ({
  id,
  channel = "INSTAGRAM",
  label = "Then",
  initialValues,
  submitLabel = "Add listener",
}: Props) => {
  const isFacebook = channel === "FACEBOOK_MESSENGER";
  const {
    onSetListener,
    listener: Listener,
    onFormSubmit,
    register,
    isPending,
  } = useListener(id, channel, initialValues);
  const { latestVariable } = useMutationDataState(["create-lister"]);

  return (
    <TriggerButton label={label}>
      <div className="flex flex-col gap-y-3">
        <div
          onClick={() => onSetListener("MESSAGE")}
          className={cn(
            Listener === "MESSAGE"
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-slate-50 text-slate-700",
            "flex cursor-pointer flex-col gap-y-2 rounded-xl border p-3 transition hover:opacity-90"
          )}
        >
          <p className="font-medium">
            {isFacebook
              ? "Public comment reply"
              : "Send the user a message"}
          </p>
          <p className="text-sm">
            {isFacebook
              ? "Post this reply publicly when a matched Facebook comment is received."
              : "Enter the message that you want to send the user."}
          </p>
        </div>
        <form onSubmit={onFormSubmit} className="flex flex-col gap-y-2">
          {isFacebook ? (
            <Textarea
              placeholder="Add the public comment reply text"
              {...register("reply")}
              className="min-h-28 rounded-xl border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 outline-none ring-0 focus:ring-0"
            />
          ) : (
            <>
              <Textarea
                placeholder="Add a message you want to send to your customers"
                {...register("prompt")}
                className="min-h-28 rounded-xl border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 outline-none ring-0 focus:ring-0"
              />
              <Input
                {...register("reply")}
                placeholder="Add a public reply for comments (Optional)"
                className="rounded-xl border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 outline-none ring-0 focus:ring-0"
              />
            </>
          )}
          <Button
            disabled={isPending}
            className="w-full rounded-xl bg-slate-900 font-medium text-white hover:bg-slate-800"
          >
            <Loader state={isPending}>{submitLabel}</Loader>
          </Button>
          <InlineStatus
            status={
              latestVariable?.status === "pending"
                ? "pending"
                : latestVariable?.status === "success"
                  ? "success"
                  : latestVariable?.status === "error"
                    ? "error"
                    : "idle"
            }
            pendingLabel="Saving listener..."
            successLabel="Listener synced"
            errorLabel="Listener update failed"
          />
        </form>
      </div>
    </TriggerButton>
  );
};

export default ThenAction;
