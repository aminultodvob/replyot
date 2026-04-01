import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Replyot",
  description:
    "Privacy policy for Replyot - Your Reply Pilot for Instagram and Facebook automation",
};

export default function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section>{children}</section>;
}
