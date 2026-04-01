import AuthShell from "@/components/auth/auth-shell";
import SignInForm from "@/components/auth/sign-in-form";
import Link from "next/link";

const Page = () => {
  return (
    <AuthShell
      title="Continue setup"
      description="Sign in to continue with your Free or Pro workspace, automations, and package settings."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="font-medium text-[#1a73e8] hover:text-[#1967d2]">
            Create one
          </Link>
        </>
      }
    >
      <SignInForm />
    </AuthShell>
  );
};

export default Page;
