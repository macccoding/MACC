import type { Metadata } from "next";
import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google";
import "../globals.css";
import ClientProviders from "../components/ClientProviders";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MACC — Mike Chen",
  description:
    "Jamaican-Chinese entrepreneur building businesses at the intersection of food, technology, and design. CEO of Istry. Based in Mandeville, Jamaica.",
  keywords: [
    "Mike Chen",
    "MACC",
    "Istry",
    "SuperPlus",
    "Mandeville Jamaica",
    "Entrepreneur",
    "Food & Beverage",
    "Technology",
    "Design",
  ],
  openGraph: {
    title: "MACC — Mike Chen",
    description:
      "Build things. Taste everything. Design the rest.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${playfair.variable} ${inter.variable} ${jetbrains.variable} antialiased`}
      >
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
