import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCheck,
  ChevronRight,
  CircleDashed,
  MessageSquareText,
  PanelsTopLeft,
  PlugZap,
  Sparkles,
  Workflow,
  Zap,
  PlayCircle
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  formatBillingPrice,
  FREE_AUTOMATION_LIMIT,
  FREE_TOTAL_DELIVERY_LIMIT,
  getBillingCycleLabel,
} from "@/lib/billing";

const productPoints = [
  {
    eyebrow: "Trigger",
    title: "Comments & DMs become entry points.",
    body: "Build flows around the moments your audience actually responds.",
  },
  {
    eyebrow: "Control",
    title: "Posts, keywords, and replies stay visible.",
    body: "Everything important lives in one builder instead of scattered settings.",
  },
  {
    eyebrow: "Launch",
    title: "Only go live when the flow is ready.",
    body: "Integrations, content, and reply logic are checked before launch.",
  },
];

const storyCards = [
  {
    icon: <PlugZap className="size-6 text-zinc-900" />,
    title: "Connect the right channel",
    body: "Instagram or Facebook Page, depending on where your customers already talk.",
  },
  {
    icon: <Workflow className="size-6 text-zinc-900" />,
    title: "Shape the flow",
    body: "Choose the trigger, narrow it to posts, and define the exact message path.",
  },
  {
    icon: <CheckCheck className="size-6 text-zinc-900" />,
    title: "Launch with confidence",
    body: "See what is missing, fix it fast, then activate the automation when it is solid.",
  },
];

const metrics = [
  { label: "Channels", value: "2", note: "Instagram + Facebook" },
  { label: "Builder", value: "5", note: "clear setup steps" },
  { label: "Focus", value: "1", note: "single workspace" },
];

const workflowShots = [
  {
    title: "Connect your channel",
    subtitle: "Link Instagram or Facebook first.",
  },
  {
    title: "Build the automation",
    subtitle: "Set trigger, posts, keywords, and response.",
  },
  {
    title: "Go live and monitor",
    subtitle: "Track results and quota from one dashboard.",
  },
];

const pricing = [
  {
    name: "Free",
    price: "0 BDT",
    caption: "Start with one channel, one automation, and a small shared delivery allowance.",
    features: [
      "Connect Instagram or Facebook",
      `${FREE_AUTOMATION_LIMIT} automation flow`,
      `${FREE_TOTAL_DELIVERY_LIMIT} total deliveries / ${getBillingCycleLabel()}`,
      "Upgrade any time to unlock both channels",
    ],
    cta: "Start free",
    tone: "border-zinc-200 bg-white/60 text-zinc-900",
    button: "bg-zinc-900 text-white hover:bg-zinc-800",
  },
  {
    name: "Pro",
    price: formatBillingPrice(),
    caption: "Unlock both channels, more automations, and full monthly delivery capacity.",
    features: [
      "10,000 Facebook comment replies / cycle",
      "1,000 Instagram direct messages / cycle",
      "10,000 Instagram comment replies / cycle",
      "Both Instagram and Facebook support",
      "Full builder, integrations, and activation",
    ],
    cta: "Upgrade to Pro",
    tone:
      "border-blue-200 bg-gradient-to-b from-blue-50/80 to-indigo-50/80 text-zinc-900 shadow-[0_20px_40px_-15px_rgba(59,130,246,0.15)]",
    button: "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen pb-24 text-zinc-900 selection:bg-blue-200">
      
      {/* Background Sky Gradient */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-b from-[#a1c4e6] via-[#dbe2ee] to-[#f4f7fb]" />
      
      {/* Subtle cloud-like radial blurs */}
      <div className="fixed left-[-10%] top-[20%] -z-10 h-[600px] w-[600px] rounded-full bg-white/40 blur-[120px]" />
      <div className="fixed right-[-5%] top-[10%] -z-10 h-[500px] w-[600px] rounded-full bg-white/50 blur-[100px]" />
      <div className="fixed bottom-0 left-[20%] -z-10 h-[400px] w-[800px] rounded-full bg-white/60 blur-[120px]" />

      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-2">
            <Zap className="size-6 text-zinc-900 mix-blend-multiply" fill="currentColor" />
            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold tracking-tight text-zinc-900 sm:text-xl">Replyot</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                Your Reply Pilot
              </span>
            </div>
          </div>
          
          <nav className="hidden gap-8 text-sm font-medium text-zinc-700 md:flex">
            <Link href="#how-it-works" className="transition-colors hover:text-zinc-900">Solutions</Link>
            <Link href="#builder" className="transition-colors hover:text-zinc-900">Features</Link>
            <Link href="#pricing" className="transition-colors hover:text-zinc-900">Pricing</Link>
            <Link href="#" className="transition-colors hover:text-zinc-900">Resources</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button asChild className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-zinc-800 hover:shadow-lg sm:px-6 sm:py-5 sm:text-[15px]">
              <Link href="/sign-up?redirect_url=%2Fdashboard">
                Start Free
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 pt-28 md:px-6 lg:px-8 xl:pt-48">
        <div className="mx-auto max-w-5xl text-center">
          
          <h1 className="mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-8 text-4xl font-bold leading-[1.05] tracking-tight text-zinc-900 duration-1000 sm:text-5xl md:text-7xl lg:text-8xl">
            Your Reply Pilot for comments, DMs, and faster follow-up.
          </h1>
          
          <p className="mx-auto mt-5 max-w-2xl animate-in fade-in slide-in-from-bottom-8 text-base font-medium leading-relaxed text-zinc-700/80 delay-300 duration-1000 sm:text-lg md:text-xl">
            Replyot helps teams automate Instagram and Facebook conversations with a builder that keeps triggers, keywords, posts, and replies clear from setup to launch.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 animate-in fade-in slide-in-from-bottom-8 delay-500 duration-1000 sm:flex-row sm:flex-wrap sm:gap-4">
            <Button asChild size="lg" className="w-full rounded-full bg-zinc-900 px-8 py-6 text-base font-semibold text-white shadow-xl shadow-zinc-900/10 transition-transform hover:scale-105 hover:bg-zinc-800 sm:w-auto">
              <Link href="/sign-up?redirect_url=%2Fdashboard">
                Start Free
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="w-full rounded-full border border-white/20 bg-white/40 px-8 py-6 text-base font-semibold text-zinc-900 shadow-sm backdrop-blur-md transition-transform hover:scale-105 hover:bg-white/50 sm:w-auto">
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="mx-auto mt-14 max-w-5xl animate-in fade-in slide-in-from-bottom-12 delay-700 duration-1000 sm:mt-20">
          <div className="relative overflow-hidden rounded-[28px] border border-white/60 bg-white/80 p-2 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] backdrop-blur-xl sm:rounded-[32px] sm:p-4">
            <div className="relative overflow-hidden rounded-[24px] border border-zinc-200/50 bg-[#f8fafc]">
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src="/Ig-creators.png"
                  alt="Dashboard preview"
                  fill
                  className="object-cover"
                />
                
                {/* Simulated clean UI overlay over the image */}
                <div className="absolute inset-x-0 bottom-0 top-1/3 bg-gradient-to-t from-white via-white/80 to-transparent p-3 text-zinc-900 backdrop-blur-[2px] sm:p-6">
                   <div className="absolute bottom-3 left-3 right-3 grid grid-cols-2 gap-3 sm:bottom-6 sm:left-6 sm:right-6 sm:grid-cols-4 sm:gap-4">
                      {[
                        { title: "Live automations", value: "12" },
                        { title: "Connected channels", value: "2" },
                        { title: "Tracked keywords", value: "48" },
                        { title: "Replies sent", value: "3.2k" }
                      ].map((stat, i) => (
                        <div key={i} className="rounded-xl border border-zinc-200/60 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-5">
                           <div className="flex items-center gap-2 text-[10px] font-semibold text-zinc-500 sm:text-xs">
                             <CircleDashed size={14} />
                             {stat.title}
                           </div>
                           <div className="mt-2 text-lg font-bold tracking-tight text-zinc-900 sm:mt-3 sm:text-2xl">
                             {stat.value}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="mx-auto mt-20 max-w-7xl px-4 md:mt-32 md:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-3">
          {metrics.map((item) => (
            <div key={item.label} className="group relative overflow-hidden rounded-[32px] border border-white/50 bg-white/40 px-6 py-8 shadow-sm backdrop-blur-md transition-all hover:bg-white/60">
              <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500">{item.label}</p>
              <p className="mt-2 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">{item.value}</p>
              <p className="mt-2 text-sm text-zinc-600">{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="mx-auto mt-20 max-w-7xl px-4 md:mt-32 md:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">Setup logic</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 md:text-5xl">One pilot for every reply flow.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-600 md:text-lg">
            Stop bouncing between confusing platform settings. Replyot keeps the full reply journey visible in one place so teams can launch faster with less guesswork.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {storyCards.map((card) => (
             <div key={card.title} className="rounded-[32px] border border-white/50 bg-white/60 p-8 shadow-sm backdrop-blur-md">
               <div className="mb-6 inline-flex rounded-[20px] bg-zinc-100 p-4 shadow-sm">
                 {card.icon}
               </div>
               <h3 className="text-2xl font-bold text-zinc-900">{card.title}</h3>
               <p className="mt-4 leading-relaxed text-zinc-600">{card.body}</p>
             </div>
          ))}
        </div>
      </section>

      {/* Builder Breakdown */}
      <section id="builder" className="mx-auto mt-20 max-w-7xl px-4 md:mt-32 md:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[32px] border border-white/60 bg-white/50 p-6 shadow-lg backdrop-blur-xl md:rounded-[40px] md:p-14">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">The Core Engine</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 md:text-5xl">Visual reply logic at your fingertips.</h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-600 md:text-lg">
                Replyot moves every automation through the same clean arc: choose a channel, set the trigger, narrow it with posts and keywords, shape the reply, and go live.
              </p>
              
              <div className="mt-8 space-y-4">
                {productPoints.map((point) => (
                  <div key={point.eyebrow} className="rounded-[24px] border border-zinc-200/40 bg-white/80 p-5 shadow-sm backdrop-blur-md">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">{point.eyebrow}</p>
                    <p className="mt-1 text-lg font-semibold text-zinc-900">{point.title}</p>
                    <p className="mt-1 text-sm text-zinc-600">{point.body}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulated UI Representation */}
            <div className="relative rounded-[28px] border border-zinc-200/50 bg-white p-4 shadow-xl sm:rounded-[32px] sm:p-6">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <p className="font-semibold text-zinc-900">DM from Comments</p>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Ready</span>
              </div>
              
              <div className="mt-6 space-y-4 relative">
                <div className="absolute left-[20px] top-[20px] bottom-[20px] w-px bg-zinc-200" />
                {[
                  { step: "01", text: "Instagram Account", status: "Active" },
                  { step: "02", text: "Targeted 3 Posts", status: "Scoped" },
                  { step: "03", text: "Keywords: 'Price'", status: "Matched" },
                  { step: "04", text: "Drafted DM Reply", status: "Ready" },
                ].map((item, idx) => (
                  <div key={item.step} className="relative flex items-center gap-4 pl-[48px]">
                    <div className="absolute left-[4px] flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-zinc-900 text-[10px] font-bold text-white shadow-sm">
                      {item.step}
                    </div>
                    <div className="flex flex-1 items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 transition-colors hover:bg-zinc-100/50">
                      <p className="text-sm font-semibold text-zinc-800">{item.text}</p>
                      <span className="text-xs font-medium text-zinc-500">{item.status}</span>
                    </div>
                  </div>
                ))}
                
                {/* Launch Button visual */}
                <div className="relative flex items-center pl-[48px] pt-4">
                   <div className="absolute left-[8px] h-6 w-6 rounded-full border-[3px] border-white bg-zinc-300" />
                   <div className="w-full rounded-2xl bg-zinc-900 py-4 text-center text-sm font-bold text-white shadow-md">
                     Deploy Automation
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto mt-20 max-w-5xl px-4 md:mt-32 md:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">Pricing</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 md:text-5xl">Scale as you grow.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-600 md:text-lg">
             Start with Replyot Free, then move to Pro when your reply volume grows.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {pricing.map((plan) => (
            <div key={plan.name} className={`relative flex flex-col rounded-[40px] border p-8 backdrop-blur-xl ${plan.tone}`}>
              <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">{plan.name}</p>
              <div className="mt-6 flex items-baseline gap-2">
                <p className="text-5xl font-extrabold text-zinc-900">{plan.price}</p>
                {plan.name !== "Free" && <p className="font-medium text-zinc-500">/{getBillingCycleLabel()}</p>}
              </div>
              <p className="mt-4 text-sm font-medium leading-relaxed text-zinc-600">{plan.caption}</p>
              
              <div className="mt-8 mb-8 space-y-4 flex-1">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 text-sm font-medium text-zinc-700">
                    <CheckCheck className="mt-0.5 size-5 shrink-0 text-zinc-900" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Button asChild size="lg" className={`w-full rounded-full py-6 text-base font-semibold ${plan.button}`}>
                <Link href={`/${plan.name === "Free" ? "sign-up" : "sign-in"}?redirect_url=%2Fdashboard`}>
                  {plan.cta}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="mx-auto mt-20 mb-10 max-w-5xl px-4 md:mt-32 md:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/70 p-8 text-center shadow-xl backdrop-blur-xl md:rounded-[40px] md:p-16">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-5xl">Let Replyot handle the first response.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-base font-medium text-zinc-600 md:text-lg">
              Build your first automated reply flow in minutes and keep every incoming comment or DM moving.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4">
              <Button asChild size="lg" className="w-full rounded-full bg-zinc-900 px-8 py-6 text-base font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-zinc-800 sm:w-auto">
                <Link href="/sign-up">Start Free</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-zinc-200/50 py-10 text-center text-sm font-medium text-zinc-500">
        <p>&copy; {new Date().getFullYear()} Replyot. All rights reserved.</p>
      </footer>
    </main>
  );
}
