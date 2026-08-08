import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI IP Factory",
  description: "Internal creative tool",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="font-display antialiased">{children}</body>
    </html>
  );
}
