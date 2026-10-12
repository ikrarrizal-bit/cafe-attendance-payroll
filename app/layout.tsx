import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Café Team | Attendance & Payroll",
  description: "Your café team, shifts, attendance and 30-day payroll in one place.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
