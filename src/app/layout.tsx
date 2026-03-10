import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CopilotSidebar } from "@/components/ui/CopilotSidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aura - AI Research Workspace",
  description: "Next-generation Academic Research Assistant & Grant Proposal Generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-cyan-500/30 w-full overflow-x-hidden`}
      >
        {children}
        <CopilotSidebar />
      </body>
    </html>
  );
}
