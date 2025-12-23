import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { VisualEditsMessenger } from "orchids-visual-edits";
import ErrorReporter from "@/components/ErrorReporter";
import { IframeErrorSuppressor } from "@/components/IframeErrorSuppressor";
import { OrchidsScripts } from "@/components/OrchidsScripts";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PROTRADER - Trading Dashboard",
  description: "Professional Trading Dashboard",
  icons: {
    icon: "/next.svg", // Using existing SVG as favicon
  },
  other: {
    "preconnect-s3-tradingview": "https://s3.tradingview.com",
    "dns-prefetch-s3-tradingview": "https://s3.tradingview.com",
    "preconnect-tradingview": "https://www.tradingview.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
        >
          <IframeErrorSuppressor />
          <ErrorReporter />
          <OrchidsScripts />
          {children}
          <Toaster />
          <VisualEditsMessenger />
        </ThemeProvider>
      </body>
    </html>
  );
}
