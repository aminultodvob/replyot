"use client";

import { useEffect, useTransition } from "react";
import { onIntegrate } from "@/actions/integrations";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type Props = {
  searchParams: {
    code?: string;
  };
};

export default function Page({ searchParams: { code } }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const integrationsHref = "/dashboard/integrations";

  useEffect(() => {
    if (code) {
      startTransition(async () => {
        const result = await onIntegrate(code.split("#_")[0]);
        const redirectTo = result.data?.redirectTo ?? integrationsHref;

        if (result.status === 200) {
          router.replace(`${redirectTo}?integration_notice=instagram-connected`);
        } else if (result.status === 409 && result.data?.errorCode === "instagram-already-connected") {
          router.replace(`${redirectTo}?integration_error=instagram-already-connected`);
        } else if (result.status === 403 && result.data?.errorCode === "free-channel-limit") {
          router.replace(`${redirectTo}?integration_error=free-channel-limit`);
        } else if (result.status === 400 && result.data?.errorCode === "instagram-account-unavailable") {
          router.replace(`${redirectTo}?integration_error=instagram-account-unavailable`);
        } else {
          router.replace(`${integrationsHref}?integration_error=instagram-account-unavailable`);
        }
      });
    } else {
      router.replace(`${integrationsHref}?integration_error=instagram-account-unavailable`);
    }
  }, [code, integrationsHref, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f7fb]">
      <div className="flex flex-col items-center gap-4 text-zinc-500">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm font-medium animate-pulse">Connecting account...</p>
      </div>
    </div>
  );
}
