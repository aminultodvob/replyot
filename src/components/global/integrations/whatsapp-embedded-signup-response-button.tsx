"use client";

import { completeWhatsAppEmbeddedSignupFromResponse } from "@/actions/integrations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

type Props = {
  disabled?: boolean;
  className?: string;
};

export default function WhatsAppEmbeddedSignupResponseButton({
  disabled = false,
  className,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [responseText, setResponseText] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    if (disabled || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      const result = await completeWhatsAppEmbeddedSignupFromResponse(responseText);

      if (result.status === 200) {
        toast("WhatsApp connected", {
          description: "The Embedded Signup response was saved successfully.",
        });
        setOpen(false);
        setResponseText("");
        router.refresh();
        return;
      }

      toast("WhatsApp response not saved", {
        description:
          result.data && typeof result.data === "object" && "message" in result.data
            ? String(result.data.message)
            : "Check that your response includes phone_number_id and waba_id.",
      });
    } catch {
      toast("WhatsApp response not saved", {
        description: "Something went wrong while saving the response.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={className}
        >
          Paste ES Response
        </Button>
      </DialogTrigger>
      <DialogContent className="border-slate-200 bg-white sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-slate-950">
            Save Embedded Signup response
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Paste the response from Meta that contains phone_number_id and waba_id.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={responseText}
          onChange={(event) => setResponseText(event.target.value)}
          placeholder='[{"data":{"phone_number_id":"111...","waba_id":"895..."},"type":"WA_EMBEDDED_SIGNUP","event":"FINISH"}]'
          className="min-h-44 border-slate-300 font-mono text-xs text-slate-900"
        />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSaving}
            className="border-slate-300 text-slate-700"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || responseText.trim().length === 0}
            className="bg-[#1a73e8] text-white hover:bg-[#1765cc]"
          >
            {isSaving ? "Saving..." : "Save response"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
