import type { Metadata } from "next";
import { Geist, Geist_Mono, Spline_Sans } from "next/font/google";
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

const splineSans = Spline_Sans({
  variable: "--font-display",
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
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=add,arrow_back,auto_awesome,calendar_today,check,close,content_copy,description,edit_note,home,image,notifications,podcasts,preview,refresh,save,send,settings" rel="stylesheet" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${splineSans.variable} font-display antialiased bg-background-light dark:bg-background-dark text-slate-900 dark:text-[#FAFAFA]`}
      >
        <Suspense fallback={
          <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-slate-500 dark:text-slate-400">Caricamento...</span>
            </div>
          </div>
        }>
          {children}
        </Suspense>
      </body>
    </html>
  );
}
