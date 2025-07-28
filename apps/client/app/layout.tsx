import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Axiologic - Maritime Business Platform",
  description: "Metadata-driven business platform for maritime industry",
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
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
