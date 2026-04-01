"use client";

import { useTransition } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

const SignOutButton = () => {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          await signOut({
            callbackUrl: "/sign-in",
          });
        })
      }
      className="flex w-full items-center gap-x-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-500 transition hover:bg-white hover:text-slate-900"
      disabled={isPending}
    >
      <LogOut size={18} />
      <p>{isPending ? "Logging out..." : "Log out"}</p>
    </button>
  );
};

export default SignOutButton;
