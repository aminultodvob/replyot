"use client";

import { completeWhatsAppEmbeddedSignup } from "@/actions/integrations";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import React from "react";

declare global {
  interface Window {
    FB?: {
      init: (config: Record<string, unknown>) => void;
      login: (
        callback: (response: {
          authResponse?: { code?: string };
          status?: string;
        }) => void,
        options?: Record<string, unknown>
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

type Props = {
  disabled?: boolean;
  label: string;
  className?: string;
  onComplete?: () => void;
};

const FACEBOOK_SDK_ID = "facebook-jssdk";
const FACEBOOK_SDK_SRC = "https://connect.facebook.net/en_US/sdk.js";

const getWhatsAppSdkConfig = () => ({
  appId:
    process.env.NEXT_PUBLIC_WHATSAPP_APP_ID ??
    process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ??
    "",
  configId: process.env.NEXT_PUBLIC_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID ?? "",
});

const loadFacebookSdk = async (appId: string) => {
  const initFacebookSdk = () => {
    window.FB?.init({
      appId,
      autoLogAppEvents: true,
      cookie: true,
      xfbml: true,
      version: "v25.0",
    });
  };

  if (window.FB) {
    initFacebookSdk();
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const previousFbAsyncInit = window.fbAsyncInit;
    const timeout = window.setTimeout(() => {
      reject(new Error("facebook_sdk_timeout"));
    }, 15000);

    window.fbAsyncInit = () => {
      try {
        previousFbAsyncInit?.();
        initFacebookSdk();
        window.clearTimeout(timeout);
        resolve();
      } catch (error) {
        window.clearTimeout(timeout);
        reject(error);
      }
    };

    const existing = document.getElementById(FACEBOOK_SDK_ID);
    if (existing) {
      return;
    }

    const script = document.createElement("script");
    script.id = FACEBOOK_SDK_ID;
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.src = FACEBOOK_SDK_SRC;
    script.onerror = () => reject(new Error("facebook_sdk_failed"));
    document.body.appendChild(script);
  });
};

const isEmbeddedSignupEvent = (payload: unknown): payload is {
  type?: string;
  event?: string;
  data?: {
    phone_number_id?: string;
    waba_id?: string;
  };
} => {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "event" in payload &&
      (payload as { event?: string }).event === "WA_EMBEDDED_SIGNUP"
  );
};

const getEmbeddedSignupEvent = (payload: unknown) => {
  const candidate = Array.isArray(payload) ? payload[0] : payload;
  return isEmbeddedSignupEvent(candidate) ? candidate : null;
};

export default function WhatsAppEmbeddedSignupButton({
  disabled = false,
  label,
  className,
  onComplete,
}: Props) {
  const [isPending, setIsPending] = React.useState(false);
  const sdkConfig = getWhatsAppSdkConfig();

  const handleClick = async () => {
    if (disabled || isPending) {
      return;
    }

    if (!sdkConfig.appId || !sdkConfig.configId) {
      toast("WhatsApp config missing", {
        description:
          "Add NEXT_PUBLIC_WHATSAPP_APP_ID and NEXT_PUBLIC_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID first.",
      });
      return;
    }

    setIsPending(true);

    const handleMessage = async (event: MessageEvent) => {
      if (
        typeof event.origin !== "string" ||
        !event.origin.includes("facebook.com")
      ) {
        return;
      }

      let payload: unknown = event.data;
      if (typeof payload === "string") {
        try {
          payload = JSON.parse(payload);
        } catch {
          return;
        }
      }

      const embeddedSignupEvent = getEmbeddedSignupEvent(payload);
      if (!embeddedSignupEvent) {
        return;
      }

      if (embeddedSignupEvent.type === "FINISH") {
        window.removeEventListener("message", handleMessage);
        const phoneNumberId = embeddedSignupEvent.data?.phone_number_id;
        const wabaId = embeddedSignupEvent.data?.waba_id;

        if (!phoneNumberId || !wabaId) {
          toast("WhatsApp connect failed", {
            description: "Meta did not return the expected phone number details.",
          });
          setIsPending(false);
          return;
        }

        const result = await completeWhatsAppEmbeddedSignup({
          phoneNumberId,
          wabaId,
        });

        if (result?.status === 200) {
          toast("WhatsApp connected", {
            description: "Your WhatsApp Business number is ready for automations.",
          });
          onComplete?.();
          window.location.assign(
            result.data?.redirectTo ?? "/dashboard/integrations"
          );
          return;
        }

        window.location.assign(
          result?.data && typeof result.data === "object" && "redirectTo" in result.data
            ? String(result.data.redirectTo)
            : "/dashboard/integrations?integration_error=whatsapp-connect-failed"
        );
        return;
      }

      if (embeddedSignupEvent.type === "CANCEL") {
        window.removeEventListener("message", handleMessage);
        toast("WhatsApp signup cancelled", {
          description: "You can restart the Meta connection flow any time.",
        });
        setIsPending(false);
        return;
      }

      if (embeddedSignupEvent.type === "ERROR") {
        window.removeEventListener("message", handleMessage);
        toast("WhatsApp signup failed", {
          description: "Meta returned an error while connecting the number.",
        });
        setIsPending(false);
      }
    };

    try {
      await loadFacebookSdk(sdkConfig.appId);
      window.addEventListener("message", handleMessage);

      window.FB?.login(
        (response) => {
          if (!response.authResponse?.code && response.status !== "connected") {
            window.removeEventListener("message", handleMessage);
            toast("WhatsApp login cancelled", {
              description: "Meta login was closed before setup finished.",
            });
            setIsPending(false);
          }
        },
        {
          config_id: sdkConfig.configId,
          response_type: "code",
          override_default_response_type: true,
          extras: {
            feature: "whatsapp_embedded_signup",
            sessionInfoVersion: 3,
          },
        }
      );
    } catch {
      toast("Facebook SDK failed", {
        description: "The Meta SDK could not be loaded. Please try again.",
      });
      setIsPending(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={disabled || isPending}
      className={className}
    >
      {isPending ? "Opening..." : label}
    </Button>
  );
}
