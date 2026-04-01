"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getToastConfig, normalizeAppError } from "@/lib/feedback";

const ResetPasswordForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams?.get("token") ?? "", [searchParams]);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    setError(null);
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const payload = (await response.json()) as {
        data?: string;
        error?: string;
      };

      if (!response.ok) {
        setError(normalizeAppError(payload.error, "auth_reset_password"));
        return;
      }

      const nextMessage = payload.data ?? "Password updated";
      setMessage(nextMessage);
      const toastConfig = getToastConfig("auth_reset_password", "success", {
        description: nextMessage,
      });
      toast(toastConfig.title, {
        description: toastConfig.description,
      });
      setTimeout(() => {
        router.push("/sign-in");
      }, 1200);
    });
  };

  if (!token) {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium text-rose-600">
          This reset link is missing a token.
        </p>
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-[#1a73e8] hover:text-[#1967d2]"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-slate-700">
          New password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="h-12 rounded-2xl border-slate-300 bg-white text-slate-950 placeholder:text-slate-400"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-slate-700">
          Confirm new password
        </Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="h-12 rounded-2xl border-slate-300 bg-white text-slate-950 placeholder:text-slate-400"
        />
      </div>
      {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
      {message ? (
        <p className="text-sm font-medium text-teal-700">{message}</p>
      ) : null}
      <Button
        type="submit"
        className="h-12 w-full rounded-xl bg-[#1a73e8] text-white hover:bg-[#1967d2]"
        disabled={isPending}
      >
        {isPending ? "Updating password..." : "Update password"}
      </Button>
    </form>
  );
};

export default ResetPasswordForm;
