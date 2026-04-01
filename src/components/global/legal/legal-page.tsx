import Link from "next/link";

type Section = {
  title: string;
  body: React.ReactNode;
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  lastUpdated: string;
  sections: Section[];
};

const LegalPage = ({
  eyebrow,
  title,
  description,
  lastUpdated,
  sections,
}: LegalPageProps) => {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="overflow-hidden rounded-[28px] border border-white/60 bg-white/85 shadow-[0_30px_70px_-40px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:rounded-[36px]">
        <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_60%,#eef6ff_100%)] px-5 py-8 sm:px-8 sm:py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            {description}
          </p>
          <p className="mt-4 text-sm font-medium text-slate-500">
            Last updated: {lastUpdated}
          </p>
        </div>

        <div className="space-y-8 px-5 py-8 sm:px-8 sm:py-10">
          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                {section.title}
              </h2>
              <div className="space-y-3 text-sm leading-7 text-slate-600 sm:text-base">
                {section.body}
              </div>
            </section>
          ))}

          <section className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5">
            <p className="text-sm font-semibold text-slate-900">Replyot Legal Links</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-blue-700">
              <Link href="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms-service" className="hover:underline">
                Terms of Service
              </Link>
              <Link href="/data-deletion" className="hover:underline">
                User Data Deletion Instructions
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
};

export default LegalPage;
