import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import MaintenanceChecker from "@/components/MaintenanceChecker";

// 👇 بدون تحديد weight أو style، نترك Next.js يحمل الخط كامل
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "Al Fares Robert",
  description: "منصة البكجات والتوقعات الرياضية وعجلة الحظ",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable}`}>
      <body className="min-h-full flex flex-col antialiased bg-slate-950 text-white">
        <Header />
        <MaintenanceChecker />
        {children}
      </body>
    </html>
  );
}