export type PasswordRuleState = {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
};

export const PASSWORD_MIN_LENGTH = 6;

export const getSafeCallbackUrl = (candidate?: string | null) => {
  if (!candidate) return "/dashboard";
  if (!candidate.startsWith("/")) return "/dashboard";
  if (candidate.startsWith("//")) return "/dashboard";
  return candidate;
};

export const validateEmail = (email: string) => {
  const normalized = email.trim();
  if (!normalized) return "Email is required";
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
  if (!isEmail) return "Enter a valid email address";
  return "";
};

export const getPasswordRuleState = (password: string): PasswordRuleState => ({
  minLength: password.length >= PASSWORD_MIN_LENGTH,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  number: /\d/.test(password),
});

export const validatePassword = (password: string) => {
  if (!password) return "Password is required";
  const rules = getPasswordRuleState(password);
  if (Object.values(rules).every(Boolean)) return "";
  return "Use at least 6 characters, uppercase, lowercase, and number";
};

export const getPasswordStrength = (password: string) => {
  if (!password) {
    return { label: "Weak", tone: "text-slate-500", bar: "w-1/4 bg-slate-300" };
  }

  const score = Object.values(getPasswordRuleState(password)).filter(Boolean).length;
  if (score <= 2) {
    return { label: "Weak", tone: "text-rose-600", bar: "w-1/3 bg-rose-500" };
  }
  if (score === 3) {
    return { label: "Okay", tone: "text-amber-600", bar: "w-2/3 bg-amber-500" };
  }
  return { label: "Strong", tone: "text-emerald-600", bar: "w-full bg-emerald-500" };
};

export const validateName = (value: string, label: "First name" | "Last name") => {
  if (!value.trim()) return `${label} is required`;
  return "";
};

export const validateConfirmPassword = (password: string, confirmPassword: string) => {
  if (!confirmPassword) return "Confirm your password";
  if (password !== confirmPassword) return "Passwords do not match";
  return "";
};
