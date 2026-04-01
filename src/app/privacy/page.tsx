import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/global/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy | Replyot",
  description:
    "Privacy Policy for Replyot, Your Reply Pilot for Instagram and Facebook automation.",
};

const lastUpdated = "April 2, 2026";

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Replyot"
      title="Privacy Policy"
      description="This Privacy Policy explains how Replyot collects, uses, stores, and protects information when you use our website, dashboard, and connected social automation features."
      lastUpdated={lastUpdated}
      sections={[
        {
          title: "1. Information We Collect",
          body: (
            <>
              <p>
                We may collect information you provide directly to us, including
                your name, email address, account credentials, billing details,
                and support messages.
              </p>
              <p>
                When you connect third-party services such as Instagram or
                Facebook Pages, we may process account identifiers, page IDs,
                access tokens, post metadata, webhook events, automation
                settings, and message or comment trigger data required to
                operate the service.
              </p>
              <p>
                We may also collect technical information such as IP address,
                browser type, device data, approximate location, usage events,
                and security logs for service reliability, fraud prevention, and
                abuse monitoring.
              </p>
            </>
          ),
        },
        {
          title: "2. How We Use Information",
          body: (
            <>
              <p>We use collected information to:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>create and manage your Replyot account;</li>
                <li>authenticate users and secure access;</li>
                <li>operate automations for comments, direct messages, and page interactions;</li>
                <li>process billing, subscriptions, and payment history;</li>
                <li>respond to support requests and service inquiries;</li>
                <li>monitor service health, prevent fraud, and enforce platform policies;</li>
                <li>improve our product, features, and user experience.</li>
              </ul>
            </>
          ),
        },
        {
          title: "3. Legal Basis and Platform Data",
          body: (
            <>
              <p>
                We process information as necessary to provide the services you
                request, to perform our contract with you, to comply with legal
                obligations, and to support our legitimate interests in running,
                securing, and improving Replyot.
              </p>
              <p>
                If you connect Meta platforms, we process platform data only to
                support the Replyot features you enable, such as account
                connection, post selection, automation triggers, public replies,
                and usage analytics.
              </p>
            </>
          ),
        },
        {
          title: "4. Data Sharing",
          body: (
            <>
              <p>
                We do not sell your personal information. We may share limited
                data with service providers that support hosting, authentication,
                email delivery, payment processing, analytics, database
                infrastructure, and platform integrations, only to the extent
                necessary to operate Replyot.
              </p>
              <p>
                We may also disclose information if required by law, regulation,
                valid legal request, or to protect the rights, security, and
                integrity of Replyot, our users, or the public.
              </p>
            </>
          ),
        },
        {
          title: "5. Data Retention",
          body: (
            <>
              <p>
                We retain account, subscription, automation, and integration
                data for as long as needed to provide the service, comply with
                legal obligations, resolve disputes, and enforce agreements.
              </p>
              <p>
                Access tokens, webhook-related data, and security logs may be
                retained for operational and compliance purposes for a limited
                period based on system needs and legal requirements.
              </p>
            </>
          ),
        },
        {
          title: "6. Security",
          body: (
            <>
              <p>
                We use reasonable administrative, technical, and organizational
                safeguards to protect information against unauthorized access,
                misuse, alteration, disclosure, or destruction. However, no
                internet-based service can guarantee absolute security.
              </p>
            </>
          ),
        },
        {
          title: "7. Your Rights and Choices",
          body: (
            <>
              <p>
                Depending on your location, you may have rights to access,
                correct, export, restrict, object to, or delete certain
                personal information we hold about you.
              </p>
              <p>
                You may also disconnect integrations, stop using the service, or
                request deletion by contacting us at{" "}
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
        {
          title: "8. Children’s Privacy",
          body: (
            <>
              <p>
                Replyot is not intended for children under the age of 13, and we
                do not knowingly collect personal information from children.
              </p>
            </>
          ),
        },
        {
          title: "9. Changes to This Policy",
          body: (
            <>
              <p>
                We may update this Privacy Policy from time to time. When we do,
                we will update the “Last updated” date on this page. Continued
                use of Replyot after changes become effective constitutes
                acceptance of the updated policy.
              </p>
            </>
          ),
        },
        {
          title: "10. Contact",
          body: (
            <>
              <p>
                If you have privacy-related questions, requests, or complaints,
                contact us at{" "}
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
