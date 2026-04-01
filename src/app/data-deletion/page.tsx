import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/global/legal/legal-page";

export const metadata: Metadata = {
  title: "User Data Deletion Instructions | Replyot",
  description:
    "Instructions for requesting account and user data deletion from Replyot.",
};

const lastUpdated = "April 2, 2026";

export default function DataDeletionPage() {
  return (
    <LegalPage
      eyebrow="Replyot"
      title="User Data Deletion Instructions"
      description="If you would like Replyot to delete your account data or connected integration data, follow the instructions on this page."
      lastUpdated={lastUpdated}
      sections={[
        {
          title: "1. Delete Data From Inside Replyot",
          body: (
            <>
              <p>
                If you still have access to your Replyot account, you may remove
                connected integrations from the dashboard and stop using the
                service at any time.
              </p>
            </>
          ),
        },
        {
          title: "2. Request Full Account Deletion",
          body: (
            <>
              <p>
                To request deletion of your Replyot account and related stored
                data, email us from the address associated with your account at{" "}
                <Link
                  href="mailto:todvob@gmail.com?subject=Replyot%20Data%20Deletion%20Request"
                  className="font-medium text-blue-700 hover:underline"
                >
                  todvob@gmail.com
                </Link>
                .
              </p>
              <p>Please include:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>your Replyot account email address;</li>
                <li>your business or page name, if applicable;</li>
                <li>a clear request that you want your data deleted.</li>
              </ul>
            </>
          ),
        },
        {
          title: "3. What We Delete",
          body: (
            <>
              <p>
                Upon verified request, we will delete or anonymize personal data
                and service data associated with your account, subject to legal,
                tax, fraud-prevention, payment, and security retention
                obligations.
              </p>
              <p>This may include account profile data, automation settings, integration references, and stored usage records associated with your account.</p>
            </>
          ),
        },
        {
          title: "4. Retention Exceptions",
          body: (
            <>
              <p>
                Certain information may be retained for a limited period if
                required for security, payment reconciliation, fraud prevention,
                dispute resolution, legal compliance, or enforcement of our
                agreements.
              </p>
            </>
          ),
        },
        {
          title: "5. Processing Time",
          body: (
            <>
              <p>
                We aim to review and process verified deletion requests within a
                reasonable timeframe. If additional verification is needed, we
                may contact you before completing the request.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
