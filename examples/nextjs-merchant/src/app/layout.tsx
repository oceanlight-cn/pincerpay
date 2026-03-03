import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PincerPay Next.js Merchant Example",
  description: "Accept USDC payments from AI agents in a Next.js app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 antialiased">{children}</body>
    </html>
  );
}
