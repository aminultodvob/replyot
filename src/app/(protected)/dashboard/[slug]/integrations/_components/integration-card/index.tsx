"use client";
import { deleteIntegration, onOAuthInstagram } from "@/actions/integrations";
import { Button } from "@/components/ui/button";
import React from "react";
import InlineStatus from "@/components/global/inline-status";
import WhatsAppEmbeddedSignupButton from "@/components/global/integrations/whatsapp-embedded-signup-button";
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
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { getToastConfig, normalizeAppError } from "@/lib/feedback";

type Props = {
  title: string;
  description: string;
  icon: React.ReactNode;
  strategy: "INSTAGRAM" | "FACEBOOK_MESSENGER" | "WHATSAPP";
  integrated: boolean;
  connectedLabel?: string;
  integrationId?: string;
  readOnly?: boolean;
  blockedReason?: string;
};

const IntegrationCard = ({
  description,
  icon,
  strategy,
  title,
  integrated,
  connectedLabel,
  integrationId,
  readOnly = false,
  blockedReason,
}: Props) => {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const onInstaOAuth = () => onOAuthInstagram(strategy);
  const isWhatsApp = strategy === "WHATSAPP";
  const handleConnect = async () => {
    if (isWhatsApp) {
      return;
    }
    setIsRedirecting(true);
    try {
      await onInstaOAuth();
    } finally {
      window.setTimeout(() => setIsRedirecting(false), 1200);
    }
  };
  const handleDelete = async () => {
    if (!integrationId || confirmText !== "DELETE" || isDeleting) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await deleteIntegration(integrationId);
      if (response.status === 200) {
        setDeleteDialogOpen(false);
        setConfirmText("");
        const toastConfig = getToastConfig("integration_disconnect", "success");
        toast(toastConfig.title, {
          description: toastConfig.description,
        });
        router.refresh();
        return;
      }

      const toastConfig = getToastConfig("integration_disconnect", "error", {
        description: normalizeAppError(response.data, "integration_disconnect"),
      });
      toast(toastConfig.title, {
        description: toastConfig.description,
      });
    } catch {
      const toastConfig = getToastConfig("integration_disconnect", "error");
      toast(toastConfig.title, {
        description: toastConfig.description,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 rounded-[20px] border border-slate-200 bg-white p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#eef3fd] text-[#1a73e8]">
        {icon}
      </div>
      <div className="flex flex-col flex-1">
        <h3 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
        {connectedLabel ? (
          <p className="mt-3 text-sm font-medium text-slate-700">
            {connectedLabel}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-stretch gap-2 lg:items-end">
        {integrated ? (
          <>
            <span className="rounded-full bg-[#e6f4ea] px-3 py-1 text-sm font-medium text-[#137333]">
              Connected
            </span>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto">
              {isWhatsApp ? (
                <WhatsAppEmbeddedSignupButton
                  disabled={isDeleting || readOnly}
                  label="Reconnect"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm hover:bg-slate-50 sm:w-auto"
                />
              ) : (
                <Button
                  onClick={handleConnect}
                  variant="outline"
                  disabled={isRedirecting || isDeleting || readOnly}
                  className="w-full rounded-xl border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm hover:bg-slate-50 sm:w-auto"
                >
                  {isRedirecting
                    ? "Opening..."
                    : strategy === "FACEBOOK_MESSENGER"
                      ? "Change Page"
                      : "Reconnect"}
                </Button>
              )}
              <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                  setDeleteDialogOpen(open);
                  if (!open) {
                    setConfirmText("");
                  }
                }}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={!integrationId || isDeleting || isRedirecting || readOnly}
                    className="w-full rounded-xl border-[#f5c2c7] bg-white px-4 text-sm text-[#c5221f] shadow-sm hover:bg-[#fce8e6] sm:w-auto"
                  >
                    <Trash2 size={14} className="mr-2" />
                    Disconnect
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-slate-200 bg-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-slate-950">
                      Delete integration permanently?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-600">
                      This removes tokens and page mapping for this channel. Type DELETE to confirm.
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
                      disabled={isDeleting}
                      className="border-slate-300 text-slate-700"
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(event) => {
                        event.preventDefault();
                        handleDelete();
                      }}
                      disabled={isDeleting || confirmText !== "DELETE"}
                      className="bg-rose-600 text-white hover:bg-rose-700"
                    >
                      {isDeleting ? "Deleting..." : "Delete forever"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        ) : (
          isWhatsApp ? (
            <WhatsAppEmbeddedSignupButton
              disabled={readOnly || Boolean(blockedReason)}
              label="Connect"
              className="w-full rounded-xl bg-[#1a73e8] px-4 text-sm font-medium text-white hover:bg-[#1765cc] sm:w-auto"
            />
          ) : (
            <Button
              onClick={handleConnect}
              disabled={isRedirecting || readOnly || Boolean(blockedReason)}
              className="w-full rounded-xl bg-[#1a73e8] px-4 text-sm font-medium text-white hover:bg-[#1765cc] sm:w-auto"
            >
              {isRedirecting
                ? "Opening..."
                : strategy === "FACEBOOK_MESSENGER"
                  ? "Choose Page"
                  : "Connect"}
            </Button>
          )
        )}
        {blockedReason ? (
          <p className="max-w-xs text-left text-xs leading-5 text-amber-700 lg:text-right">
            {blockedReason}
          </p>
        ) : null}
        <InlineStatus
          status={isRedirecting || isDeleting ? "pending" : "idle"}
          pendingLabel={
            isDeleting
              ? "Deleting integration..."
              : strategy === "FACEBOOK_MESSENGER"
                ? "Opening Facebook Page selection..."
                : strategy === "WHATSAPP"
                  ? "Opening WhatsApp Business setup..."
                : "Opening Instagram login..."
          }
        />
      </div>
    </div>
  );
};

export default IntegrationCard;
