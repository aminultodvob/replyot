import type { OnboardingBanner as OnboardingBannerData } from "@/lib/ux-flow";
import DashboardLink from "../dashboard/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

type Props = {
  banner: OnboardingBannerData | null;
  compact?: boolean;
  hideCta?: boolean;
};

const toneClasses: Record<NonNullable<OnboardingBannerData>["tone"], string> = {
  blue: "border-[#d2e3fc] bg-[#f8fbff]",
  amber: "border-amber-200 bg-amber-50",
  emerald: "border-emerald-200 bg-emerald-50",
};

const badgeClasses: Record<NonNullable<OnboardingBannerData>["tone"], string> = {
  blue: "bg-[#e8f0fe] text-[#1a73e8]",
  amber: "bg-[#fff4d6] text-[#b06000]",
  emerald: "bg-[#e6f4ea] text-[#137333]",
};

const stepClasses = (complete: boolean) =>
  complete
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-slate-200 bg-white text-slate-600";

const OnboardingBanner = ({ banner, compact = false, hideCta = false }: Props) => {
  if (!banner) {
    return null;
  }

  return (
    <section
      className={`rounded-[24px] border px-4 py-4 sm:px-5 sm:py-5 ${toneClasses[banner.tone]}`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${badgeClasses[banner.tone]}`}
          >
            {banner.badge}
          </span>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
            {banner.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {banner.description}
          </p>
        </div>

        {!hideCta ? (
          <Button
            asChild
            className="w-full rounded-xl bg-[#1a73e8] px-5 text-white hover:bg-[#1765cc] sm:w-auto"
          >
            <DashboardLink href={banner.ctaHref}>
              {banner.ctaLabel}
              <ArrowRight size={16} />
            </DashboardLink>
          </Button>
        ) : null}
      </div>

      {!compact ? (
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {banner.steps.map((step) => (
            <div
              key={step.label}
              className={`rounded-xl border px-3 py-2 text-sm ${stepClasses(step.complete)}`}
            >
              {step.label}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
};

export default OnboardingBanner;
