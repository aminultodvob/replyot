"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Check, Eye, EyeOff } from "lucide-react";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

import {
  getPasswordRuleState,
  getPasswordStrength,
  getSafeCallbackUrl,
  validateConfirmPassword,
  validateEmail,
  validateName,
  validatePassword,
} from "@/components/auth/form-logic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getToastConfig, normalizeAuthError } from "@/lib/feedback";

type SignUpErrors = {
  firstname?: string;
  lastname?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const SignUpForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(
    () => getSafeCallbackUrl(searchParams?.get("callbackUrl") ?? null),
    [searchParams]
  );

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const passwordRules = useMemo(() => getPasswordRuleState(password), [password]);
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const validateForm = () => {
    const nextErrors: SignUpErrors = {};

    const firstnameError = validateName(firstname, "First name");
    if (firstnameError) nextErrors.firstname = firstnameError;

    const lastnameError = validateName(lastname, "Last name");
    if (lastnameError) nextErrors.lastname = lastnameError;

    const emailError = validateEmail(email);
    if (emailError) nextErrors.email = emailError;

    const passwordError = validatePassword(password);
    if (passwordError) nextErrors.password = passwordError;

    const confirmError = validateConfirmPassword(password, confirmPassword);
    if (confirmError) nextErrors.confirmPassword = confirmError;

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);
    if (!validateForm()) return;

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstname: firstname.trim(),
            lastname: lastname.trim(),
            email: email.trim(),
            password,
            confirmPassword,
          }),
        });

        const payload = (await response.json()) as {
          error?: string;
        };

        if (!response.ok) {
          setError(normalizeAuthError(payload.error, response.status));
          return;
        }

        const result = await signIn("credentials", {
          email: email.trim(),
          password,
          redirect: false,
          callbackUrl,
        });

        if (result?.error) {
          setError("Account created, but sign-in failed. Please sign in manually.");
          return;
        }

        const toastConfig = getToastConfig("auth_sign_up", "success");
        toast(toastConfig.title, {
          description: toastConfig.description,
        });
        router.push(result?.url ?? "/dashboard");
        router.refresh();
      } catch {
        setError(normalizeAuthError("network"));
      }
    });
  };

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstname" className="text-slate-700">
            First name
          </Label>
          <Input
            id="firstname"
            name="firstname"
            value={firstname}
            onChange={(event) => {
              setFirstname(event.target.value);
              setErrors((prev) => ({ ...prev, firstname: undefined }));
            }}
            onBlur={() => {
              const firstnameError = validateName(firstname, "First name");
              setErrors((prev) => ({ ...prev, firstname: firstnameError || undefined }));
            }}
            required
            autoComplete="given-name"
            className="h-12 rounded-xl border-slate-300 bg-white text-slate-950 placeholder:text-slate-400 focus-visible:ring-[#1a73e8]"
          />
          {errors.firstname ? <p className="text-xs text-rose-600">{errors.firstname}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastname" className="text-slate-700">
            Last name
          </Label>
          <Input
            id="lastname"
            name="lastname"
            value={lastname}
            onChange={(event) => {
              setLastname(event.target.value);
              setErrors((prev) => ({ ...prev, lastname: undefined }));
            }}
            onBlur={() => {
              const lastnameError = validateName(lastname, "Last name");
              setErrors((prev) => ({ ...prev, lastname: lastnameError || undefined }));
            }}
            required
            autoComplete="family-name"
            className="h-12 rounded-xl border-slate-300 bg-white text-slate-950 placeholder:text-slate-400 focus-visible:ring-[#1a73e8]"
          />
          {errors.lastname ? <p className="text-xs text-rose-600">{errors.lastname}</p> : null}
        </div>
      </div>
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
        <Label htmlFor="password" className="text-slate-700">
          Password
        </Label>
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
              const passwordError = validatePassword(password);
              setErrors((prev) => ({ ...prev, password: passwordError || undefined }));
            }}
            required
            minLength={6}
            autoComplete="new-password"
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
        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
          <div className="flex items-center justify-between text-xs">
            <p className="font-medium text-slate-700">Password strength</p>
            <p className={passwordStrength.tone}>{passwordStrength.label}</p>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-200">
            <div className={`h-full rounded-full transition-all ${passwordStrength.bar}`} />
          </div>
          <ul className="space-y-1 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <Check size={13} className={passwordRules.minLength ? "text-emerald-600" : "text-slate-400"} />
              At least 6 characters
            </li>
            <li className="flex items-center gap-2">
              <Check size={13} className={passwordRules.uppercase ? "text-emerald-600" : "text-slate-400"} />
              One uppercase letter
            </li>
            <li className="flex items-center gap-2">
              <Check size={13} className={passwordRules.lowercase ? "text-emerald-600" : "text-slate-400"} />
              One lowercase letter
            </li>
            <li className="flex items-center gap-2">
              <Check size={13} className={passwordRules.number ? "text-emerald-600" : "text-slate-400"} />
              One number
            </li>
          </ul>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-slate-700">
          Confirm password
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            onBlur={() => {
              const confirmError = validateConfirmPassword(password, confirmPassword);
              setErrors((prev) => ({ ...prev, confirmPassword: confirmError || undefined }));
            }}
            required
            minLength={6}
            autoComplete="new-password"
            className="h-12 rounded-xl border-slate-300 bg-white pr-12 text-slate-950 placeholder:text-slate-400 focus-visible:ring-[#1a73e8]"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.confirmPassword ? (
          <p className="text-xs text-rose-600">{errors.confirmPassword}</p>
        ) : null}
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
        {isPending ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
};

export default SignUpForm;
