import type { Metadata, Viewport } from "next";
import { Nunito, Nunito_Sans } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito-sans",
});

export const metadata: Metadata = {
  title: "Heartopia Daily",
  description: "Your cozy daily companion for Heartopia - resources, weather, and redeem codes.",
};

export const viewport: Viewport = {
  themeColor: "#f5efe6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className={`${nunito.variable} ${nunitoSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
