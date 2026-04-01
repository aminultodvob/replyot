import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/global/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service | Replyot",
  description:
    "Terms of Service for Replyot, Your Reply Pilot for Instagram and Facebook automation.",
};

const lastUpdated = "April 2, 2026";

export default function TermsServicePage() {
  return (
    <LegalPage
      eyebrow="Replyot"
      title="Terms of Service"
      description="These Terms of Service govern your access to and use of Replyot, including our website, dashboard, automation tools, connected integrations, and related services."
      lastUpdated={lastUpdated}
      sections={[
        {
          title: "1. Acceptance of Terms",
          body: (
            <>
              <p>
                By accessing or using Replyot, you agree to be bound by these
                Terms of Service and our Privacy Policy. If you do not agree,
                you must not use the service.
              </p>
            </>
          ),
        },
        {
          title: "2. Services",
          body: (
            <>
              <p>
                Replyot provides tools for automating and managing selected
                Instagram and Facebook Page interactions, including replies,
                message flows, post targeting, keyword-based triggers, and
                related analytics.
              </p>
              <p>
                Features may change over time. We may update, suspend, or
                discontinue features at any time, with or without prior notice,
                where permitted by law.
              </p>
            </>
          ),
        },
        {
          title: "3. Account Responsibilities",
          body: (
            <>
              <p>
                You are responsible for maintaining the confidentiality of your
                account credentials and for all activities that occur under your
                account.
              </p>
              <p>
                You agree to provide accurate information, keep it current, and
                promptly notify us of any unauthorized use or suspected security
                incident.
              </p>
            </>
          ),
        },
        {
          title: "4. Acceptable Use",
          body: (
            <>
              <p>You agree not to use Replyot to:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>violate any law, regulation, or third-party rights;</li>
                <li>send spam, deceptive messages, or abusive automated content;</li>
                <li>impersonate others or misrepresent your identity or business;</li>
                <li>interfere with service operation, security, or availability;</li>
                <li>violate Meta, Instagram, Facebook, or other platform policies.</li>
              </ul>
            </>
          ),
        },
        {
          title: "5. Third-Party Platforms",
          body: (
            <>
              <p>
                Replyot depends on third-party platforms and APIs, including
                Meta services. Your use of those platforms remains subject to
                their own terms, policies, permissions, approvals, and technical
                limitations.
              </p>
              <p>
                We are not responsible for outages, restrictions, permission
                denials, policy enforcement, or API changes imposed by third
                parties.
              </p>
            </>
          ),
        },
        {
          title: "6. Fees and Billing",
          body: (
            <>
              <p>
                Certain Replyot features may require a paid subscription. By
                subscribing, you authorize the applicable charges and agree to
                the pricing, billing cycle, usage limits, and renewal terms
                shown at the time of purchase.
              </p>
              <p>
                Unless otherwise required by law, fees are non-refundable after
                a billing period begins.
              </p>
            </>
          ),
        },
        {
          title: "7. Intellectual Property",
          body: (
            <>
              <p>
                Replyot, including its software, branding, website content,
                design, and related materials, is owned by or licensed to us and
                protected by applicable intellectual property laws.
              </p>
              <p>
                You retain ownership of your own content, business materials, and
                lawful automation inputs you provide through the service.
              </p>
            </>
          ),
        },
        {
          title: "8. Termination",
          body: (
            <>
              <p>
                We may suspend or terminate access to Replyot if you violate
                these Terms, misuse the platform, create security risk, fail to
                pay required fees, or if continued service would expose us to
                legal or operational risk.
              </p>
            </>
          ),
        },
        {
          title: "9. Disclaimer of Warranties",
          body: (
            <>
              <p>
                Replyot is provided on an “as is” and “as available” basis. To
                the fullest extent permitted by law, we disclaim all warranties,
                whether express, implied, or statutory, including warranties of
                merchantability, fitness for a particular purpose, and
                non-infringement.
              </p>
            </>
          ),
        },
        {
          title: "10. Limitation of Liability",
          body: (
            <>
              <p>
                To the maximum extent permitted by law, Replyot and its owners,
                operators, affiliates, and service providers will not be liable
                for indirect, incidental, special, consequential, or punitive
                damages, or for loss of profits, revenue, goodwill, business
                opportunity, data, or platform access.
              </p>
            </>
          ),
        },
        {
          title: "11. Contact",
          body: (
            <>
              <p>
                For legal or support inquiries about these Terms, contact{" "}
                <Link
                  href="mailto:todvob@gmail.com"
                  className="font-medium text-blue-700 hover:underline"
                >
                  todvob@gmail.com
                </Link>
                .
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
