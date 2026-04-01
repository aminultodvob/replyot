"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { connectSelectedFacebookPage, onIntegrateFacebook } from "@/actions/integrations";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

function FacebookCallbackContent() {
  const [pages, setPages] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const integrationsHref = "/dashboard/integrations";
  const code = searchParams?.get("code") ?? null;

  useEffect(() => {
    if (code) {
      startTransition(async () => {
        const result = await onIntegrateFacebook(code);
        console.info("[developer:facebook] callback_result", {
          status: result?.status ?? null,
          hasRedirectTo: Boolean(result?.data && "redirectTo" in result.data && result.data.redirectTo),
          hasPages: Boolean(result?.status === 202 && result?.data && "pages" in result.data),
          pageCount:
            result?.status === 202 && result?.data && "pages" in result.data
              ? result.data.pages?.length ?? 0
              : 0,
        });

        if (result.data?.redirectTo) {
          router.replace(result.data.redirectTo);
        } else if (result.status === 202 && result.data?.pages) {
          setPages(result.data.pages);
        } else {
          console.error("[developer:facebook] callback_unexpected_result", result);
          router.replace(
            `${integrationsHref}?integration_error=facebook-connect-failed`
          );
        }
      });
    } else {
      console.error("[developer:facebook] callback_missing_code");
      router.replace(
        `${integrationsHref}?integration_error=facebook-connect-failed`
      );
    }
  }, [code, integrationsHref, router]);

  if (pages.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#f4f7fb]">
        <div className="w-full max-w-2xl rounded-[32px] border border-zinc-200/50 bg-white/80 p-8 shadow-md backdrop-blur-xl">
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
            Choose a Facebook Page
          </h1>
          <p className="mt-2 text-base font-medium text-zinc-600">
            Select the Page you want this workspace to use for Messenger automations.
          </p>
          <div className="mt-8 flex flex-col gap-4">
            {pages.map((page) => (
              <form key={page.id} action={connectSelectedFacebookPage}>
                <input type="hidden" name="selectionToken" value={page.selectionToken} />
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full justify-between rounded-full border border-zinc-200 bg-white px-6 py-6 font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
                >
                  <span className="text-[15px]">{page.name}</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#1a73e8]">Use this Page</span>
                </Button>
              </form>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f7fb]">
      <div className="flex flex-col items-center gap-4 text-zinc-500">
        <Loader2 className={`h-8 w-8 ${isPending ? "animate-spin" : "animate-spin"}`} />
        <p className="text-sm font-medium animate-pulse">Connecting account...</p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f4f7fb]">
          <div className="flex flex-col items-center gap-4 text-zinc-500">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm font-medium animate-pulse">Connecting account...</p>
          </div>
        </div>
      }
    >
      <FacebookCallbackContent />
    </Suspense>
  );
}
