"use client";

import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getToastConfig, normalizeAppError } from "@/lib/feedback";

const ForgotPasswordForm = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");

    setMessage(null);
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json()) as {
        data?: string;
        error?: string;
      };

      if (!response.ok) {
        setError(normalizeAppError(payload.error, "auth_forgot_password"));
        return;
      }

      const nextMessage =
        payload.data ?? "If an account exists, a reset link has been sent.";
      setMessage(nextMessage);
      const toastConfig = getToastConfig("auth_forgot_password", "success", {
        description: nextMessage,
      });
      toast(toastConfig.title, {
        description: toastConfig.description,
      });
    });
  };

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-slate-700">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
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
        {isPending ? "Sending link..." : "Send reset link"}
      </Button>
      <p className="text-sm text-slate-500">
        Remembered your password?{" "}
        <Link href="/sign-in" className="font-medium text-[#1a73e8] hover:text-[#1967d2]">
          Back to sign in
        </Link>
      </p>
    </form>
  );
};

export default ForgotPasswordForm;
