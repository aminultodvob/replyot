"use client";
import { ChevronRight, PencilIcon, Trash2 } from "lucide-react";
import React from "react";
import { useDeleteAutomation, useEditAutomation } from "@/hooks/use-automations";
import { useMutationDataState } from "@/hooks/use-mutation-data";
import { Input } from "@/components/ui/input";
import { AutomationDetail } from "@/types/dashboard";
import InlineStatus from "../../inline-status";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

type Props = {
  id: string;
  automation: AutomationDetail;
};

const AutomationsBreadCrumb = ({ id, automation }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const safePathname = pathname ?? "/dashboard";
  const { edit, enableEdit, inputRef, isPending } = useEditAutomation(id);
  const [confirmText, setConfirmText] = React.useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const { mutate: deleteAutomationMutation, isPending: deletePending } =
    useDeleteAutomation(() => {
      setDeleteDialogOpen(false);
      setConfirmText("");
      toast("Deleted", {
        description: "Automation permanently deleted.",
      });
      const segments = safePathname.split("/");
      const redirectPath = segments.slice(0, -1).join("/") || "/dashboard";
      router.push(redirectPath);
    });

  const { latestVariable } = useMutationDataState(["update-automation"]);
  const { latestVariable: activationState } = useMutationDataState(["activate"]);
  const status =
    isPending ||
    latestVariable?.status === "pending" ||
    activationState?.status === "pending"
      ? "pending"
      : latestVariable?.status === "success" ||
          activationState?.status === "success"
        ? "success"
        : latestVariable?.status === "error" ||
            activationState?.status === "error"
          ? "error"
          : "idle";

  return (
    <div className="app-shell flex w-full items-center rounded-[24px] px-5 py-4">
      <div className="min-w-0 flex items-center gap-x-3">
        {/* <Link href={`/dashboard/${}/automations`}> */}
        <p className="truncate text-sm font-medium text-slate-500">Automations</p>
        {/* </Link> */}
        <ChevronRight className="flex-shrink-0 text-slate-400" />
        <span className="flex gap-x-3 items-center min-w-0">
          {edit ? (
            <Input
              ref={inputRef}
              placeholder={
                isPending && latestVariable?.variables?.name
                  ? latestVariable.variables.name
                  : "Add a new name"
              }
              className="h-auto border-none bg-transparent p-0 text-base font-semibold text-slate-900 outline-none ring-0 focus-visible:ring-0"
            />
          ) : (
            <p className="truncate text-base font-semibold text-slate-900">
              {latestVariable?.variables
                ? latestVariable?.variables.name
                : automation.name}
            </p>
          )}
          {edit ? (
            <></>
          ) : (
            <span
              className="mr-4 flex-shrink-0 cursor-pointer rounded-full border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              onClick={enableEdit}
            >
              <PencilIcon size={14} />
            </span>
          )}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-x-5">
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={deletePending}
            >
              <Trash2 size={14} />
              Delete automation
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="border-slate-200 bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-slate-950">
                Delete automation permanently?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-600">
                This cannot be undone. Type DELETE to confirm this permanent action.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder="Type DELETE"
              className="border-slate-300 text-slate-900"
            />
            <AlertDialogFooter>
              <AlertDialogCancel
                className="border-slate-300 text-slate-700"
                disabled={deletePending}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={deletePending || confirmText !== "DELETE"}
                className="bg-rose-600 text-white hover:bg-rose-700"
                onClick={(event) => {
                  event.preventDefault();
                  deleteAutomationMutation({ automationId: id });
                }}
              >
                {deletePending ? "Deleting..." : "Delete forever"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <div className="hidden min-w-0 items-center justify-end md:flex">
          <InlineStatus
            status={status}
            pendingLabel="Saving automation..."
            successLabel="Automation synced"
            errorLabel="Automation update failed"
            className="truncate"
          />
        </div>
      </div>
    </div>
  );
};

export default AutomationsBreadCrumb;
