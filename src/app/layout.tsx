import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "sonner";
import ReactQueryProvider from "@/providers/react-query-provider";

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
      <body suppressHydrationWarning className="font-sans">
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
