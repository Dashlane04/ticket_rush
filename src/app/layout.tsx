import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthHydrate } from "@/components/auth/AuthHydrate";
import { LiveTracker } from "@/components/LiveTracker";
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
  title: {
    default: "TicketRush — Đặt vé sự kiện",
    template: "%s | TicketRush",
  },
  description: "Nền tảng đặt vé sự kiện và suất chiếu nhanh nhất Việt Nam.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthHydrate />
        <LiveTracker />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
