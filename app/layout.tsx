import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hike",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-stone-50">{children}</body>
    </html>
  );
}
