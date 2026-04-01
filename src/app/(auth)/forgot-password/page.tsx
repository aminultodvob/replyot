import AuthShell from "@/components/auth/auth-shell";
import ForgotPasswordForm from "@/components/auth/forgot-password-form";

const Page = () => {
  return (
    <AuthShell
      title="Forgot your password?"
      description="Enter your email and we’ll send you a secure reset link."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
};

export default Page;
