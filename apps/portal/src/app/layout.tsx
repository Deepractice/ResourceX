import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResourceX Registry",
  description: "Find & Share AI Resources",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
