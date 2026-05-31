import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Konduit — Observability",
  description: "Self-hosted distributed tracing and AI root cause analysis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="scanlines">
        <Navbar />
        <main
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "1.5rem",
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}