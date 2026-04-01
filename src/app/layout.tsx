import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "sonner";
import ReactQueryProvider from "@/providers/react-query-provider";
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Replyot",
  description: "Your Reply Pilot for Instagram and Facebook automation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={jakarta.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
        >
          <ReactQueryProvider>{children}</ReactQueryProvider>

          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
