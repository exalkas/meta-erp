import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@erp/shared-ui";

export const metadata: Metadata = {
  title: "Axiologic - Admin Platform",
  description:
    "Administrative platform for building and managing business applications",
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
        <AuthProvider app={"admin" as any}>{children}</AuthProvider>
      </body>
    </html>
  );
}
