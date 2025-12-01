import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Game of Memes - Where Losers Balance the Meta",
  description: "The only card game where losers vote on nerfs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
