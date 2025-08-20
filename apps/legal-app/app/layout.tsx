import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@erp/shared-ui";

export const metadata: Metadata = {
  title: "Legal Practice Management - LEGAL-US",
  description:
    "Modern legal practice management system with AI-powered features, IOLTA compliance, and comprehensive case management.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="h-full antialiased">
        <AuthProvider app={"legal" as any}>{children}</AuthProvider>
      </body>
    </html>
  );
}
