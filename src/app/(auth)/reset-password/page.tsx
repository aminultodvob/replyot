import AuthShell from "@/components/auth/auth-shell";
import ResetPasswordForm from "@/components/auth/reset-password-form";
import { Suspense } from "react";

const Page = () => {
  return (
    <AuthShell
      title="Reset password"
      description="Choose a new password for your account."
    >
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
};

export default Page;
