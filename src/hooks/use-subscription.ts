import axios from "axios";
import { useState } from "react";
import { trackUxEvent } from "@/lib/ux-analytics";
import { toast } from "sonner";
import { getToastConfig, normalizeAppError } from "@/lib/feedback";

export const useSubscription = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const onSubscribe = async () => {
    setIsProcessing(true);
    trackUxEvent("payment_cta_clicked");
    try {
      const response = await axios.get("/api/payment");
      if (response.data.status === 200 && response.data.session_url) {
        window.location.href = response.data.session_url as string;
        return;
      }

      const toastConfig = getToastConfig("payment_start", "error", {
        description: normalizeAppError(response.data?.error, "payment_start"),
      });
      toast(toastConfig.title, {
        description: toastConfig.description,
      });
    } catch {
      const toastConfig = getToastConfig("payment_start", "error");
      toast(toastConfig.title, {
        description: toastConfig.description,
      });
    }
    setIsProcessing(false);
  };

  return { onSubscribe, isProcessing };
};
