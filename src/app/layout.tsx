import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

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
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
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
      </body>
    </html>
  );
}
