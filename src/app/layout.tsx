import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { PwaInstaller } from "@/components/pwa/PwaInstaller";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InterviewAce — AI Mock Interviews for Tech Jobs",
  description: "Practice real tech interviews with an AI interviewer. 8 IT roles, honest scorecards, sample better answers, and a 7-day practice plan. Free to start.",
  keywords: ["mock interview", "interview prep", "tech interview", "software engineer interview", "AI interviewer", "interview practice"],
  authors: [{ name: "InterviewAce" }],
  manifest: "/manifest.json",
  applicationName: "InterviewAce",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "InterviewAce",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/icons/icon-192.png"],
  },
  openGraph: {
    title: "InterviewAce — AI Mock Interviews for Tech Jobs",
    description: "Practice real tech interviews with an AI interviewer. Get honest feedback in 15 minutes.",
    siteName: "InterviewAce",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "InterviewAce — AI Mock Interviews",
    description: "Practice real tech interviews with an AI interviewer.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <PwaInstaller />
      </body>
    </html>
  );
}
