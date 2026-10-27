import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import MaintenanceChecker from "@/components/MaintenanceChecker";

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
    <html lang="ar" dir="rtl">
      <body className="min-h-full flex flex-col antialiased bg-slate-950 text-white">
        <Header />
        <MaintenanceChecker />
        {children}
      </body>
    </html>
  );
}