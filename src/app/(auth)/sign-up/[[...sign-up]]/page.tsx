import AuthShell from "@/components/auth/auth-shell";
import SignUpForm from "@/components/auth/sign-up-form";
import Link from "next/link";

function Page() {
  return (
    <AuthShell
      title="Start setup"
      description="Create your account, start on Free right away, and upgrade later only if you need more capacity."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-[#1a73e8] hover:text-[#1967d2]">
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}

export default Page;
