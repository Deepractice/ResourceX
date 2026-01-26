import type { Metadata } from "next";
import { Sidebar } from "~/components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resource Registry",
  description: "Discover and share AI resources",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background-secondary">
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
