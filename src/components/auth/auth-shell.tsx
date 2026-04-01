import Link from "next/link";
import type { ReactNode } from "react";
import LogoLockup from "@/components/global/brand/logo-lockup";
import {
  formatBillingPrice,
  FREE_AUTOMATION_LIMIT,
  FREE_TOTAL_DELIVERY_LIMIT,
  getBillingCycleLabel,
} from "@/lib/billing";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

type Props = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

const AuthShell = ({ title, description, children, footer }: Props) => {
  return (
    <div className="relative mx-auto flex w-full max-w-6xl items-center justify-center overflow-hidden rounded-[28px] border border-white/60 bg-white/70 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] backdrop-blur-2xl sm:rounded-[40px]">
      {/* Background Blurs behind the form */}
      <div className="absolute -left-[10%] -top-[10%] h-[400px] w-[400px] rounded-full bg-blue-100/50 blur-[100px]" />

      <div className="relative z-10 grid w-full lg:grid-cols-[1.1fr_0.9fr]">
        
        {/* Left Form Section */}
        <section className="flex flex-col justify-center p-6 sm:p-10 lg:p-14">
          <Link href="/" className="inline-flex items-center">
            <LogoLockup priority />
          </Link>
          
          <div className="mt-8 space-y-3 sm:mt-12">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="max-w-md text-base font-medium leading-relaxed text-zinc-600 sm:text-lg">
              {description}
            </p>
          </div>

          <div className="relative mt-10">
            <div className="relative">
              {children}
            </div>
          </div>

          {footer ? (
            <div className="mt-8 border-t border-zinc-200/50 pt-6 text-sm font-medium text-zinc-500">
              {footer}
            </div>
          ) : null}
        </section>

        {/* Right Info Section */}
        <aside className="relative flex hidden flex-col justify-between overflow-hidden border-l border-zinc-200/50 bg-[#f4f7fb]/50 p-10 lg:flex sm:p-14 backdrop-blur-xl">
          <div className="absolute right-[-10%] top-[-10%] h-96 w-96 rounded-full bg-white/80 blur-[80px] -z-10" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-blue-700">
              <Sparkles size={14} className="text-blue-500" />
              Your Reply Pilot
            </div>
            
            <h2 className="mt-8 max-w-sm text-3xl font-bold leading-tight tracking-tight text-zinc-900">
              Start playing around for free. Upgrade when you grow.
            </h2>
            
            <div className="mt-10 grid gap-5">
              {/* Free Tier Card */}
              <div className="group relative overflow-hidden rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">Free Forever</p>
                  <ShieldCheck size={20} className="text-zinc-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-zinc-900">0 BDT</p>
                </div>
                <p className="mt-2 font-medium text-sm text-zinc-600">
                  1 channel, {FREE_AUTOMATION_LIMIT} flow, {FREE_TOTAL_DELIVERY_LIMIT} msgs limit.
                </p>
              </div>

              {/* Pro Tier Card */}
              <div className="group relative overflow-hidden rounded-[32px] border border-blue-200 bg-gradient-to-b from-blue-50/80 to-indigo-50/80 p-6 shadow-sm transition-all hover:shadow-md">
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold uppercase tracking-widest text-blue-600">Replyot Pro</p>
                    <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-bold text-white shadow-sm">POPULAR</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-zinc-900">{formatBillingPrice()}</p>
                    <p className="text-sm font-medium text-zinc-500">/{getBillingCycleLabel()}</p>
                  </div>
                  <p className="mt-2 font-medium text-sm text-zinc-700">
                    Unlimited channels, massive limits, full suite.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-12 rounded-[24px] border border-zinc-200/50 bg-white/80 p-6 shadow-sm backdrop-blur-md">
            <p className="font-bold text-zinc-900">Fast Setup in 3 steps:</p>
            <ol className="mt-3 space-y-2 text-sm font-medium text-zinc-600">
              <li className="flex items-center gap-2"><ArrowRight size={14} className="text-zinc-400"/> Create an account instantly</li>
              <li className="flex items-center gap-2"><ArrowRight size={14} className="text-zinc-400"/> Connect Facebook or Instagram</li>
              <li className="flex items-center gap-2"><ArrowRight size={14} className="text-zinc-400"/> Launch your first response workflow</li>
            </ol>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default AuthShell;
