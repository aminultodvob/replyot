"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { signIn } from "next-auth/react";

import {
  getSafeCallbackUrl,
  validateEmail,
} from "@/components/auth/form-logic";
import { normalizeAuthError } from "@/lib/feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignInErrors = {
  email?: string;
  password?: string;
};

const SignInForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(
    () => getSafeCallbackUrl(searchParams?.get("callbackUrl") ?? null),
    [searchParams]
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<SignInErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const validateForm = () => {
    const nextErrors: SignInErrors = {};
    const emailError = validateEmail(email);
    if (emailError) nextErrors.email = emailError;
    if (!password) nextErrors.password = "Password is required";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);
    if (!validateForm()) return;

    startTransition(async () => {
      try {
        const result = await signIn("credentials", {
          email: email.trim(),
          password,
          redirect: false,
          callbackUrl,
        });

        if (!result) {
          setError(normalizeAuthError("AUTH_UNAVAILABLE"));
          return;
        }

        if (result?.error) {
          setError(normalizeAuthError(result.error));
          return;
        }

        if (result?.status && result.status >= 400) {
          setError(normalizeAuthError("AUTH_UNAVAILABLE"));
          return;
        }

        router.push(result?.url ?? "/dashboard");
        router.refresh();
      } catch {
        setError(normalizeAuthError("network"));
      }
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
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          onBlur={() => {
            const emailError = validateEmail(email);
            setErrors((prev) => ({ ...prev, email: emailError || undefined }));
          }}
          required
          autoComplete="email"
          className="h-12 rounded-xl border-slate-300 bg-white text-slate-950 placeholder:text-slate-400 focus-visible:ring-[#1a73e8]"
        />
        {errors.email ? <p className="text-xs text-rose-600">{errors.email}</p> : null}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-slate-700">
            Password
          </Label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-[#1a73e8] hover:text-[#1967d2]"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            onBlur={() => {
              if (!password) {
                setErrors((prev) => ({ ...prev, password: "Password is required" }));
              }
            }}
            required
            minLength={6}
            autoComplete="current-password"
            className="h-12 rounded-xl border-slate-300 bg-white pr-12 text-slate-950 placeholder:text-slate-400 focus-visible:ring-[#1a73e8]"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password ? <p className="text-xs text-rose-600">{errors.password}</p> : null}
      </div>
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        className="h-12 w-full rounded-xl bg-[#1a73e8] text-white hover:bg-[#1967d2]"
        disabled={isPending}
      >
        {isPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
};

export default SignInForm;
