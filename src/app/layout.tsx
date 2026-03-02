import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Social Cockpit — IWA/IWP Content Studio",
  description: "Generazione contenuti social per Italian Wine Podcast & Academy - Professional Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0F0F0F] text-[#FAFAFA]`}
      >
        <Suspense fallback={
          <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
              <span className="text-[#A3A3A3]">Caricamento...</span>
            </div>
          </div>
        }>
          {children}
        </Suspense>
      </body>
    </html>
  );
}
