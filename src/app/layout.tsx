import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import MaintenanceChecker from "@/components/MaintenanceChecker";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "800"],
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
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
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable}`}>
      <body className="min-h-full flex flex-col antialiased bg-slate-950 text-white">
        <Header />
        <MaintenanceChecker />
        {children}
      </body>
    </html>
  );
}