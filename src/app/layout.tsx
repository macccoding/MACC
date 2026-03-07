import type { Metadata, Viewport } from "next";
import { Noto_Serif, IBM_Plex_Mono } from "next/font/google";
import { InkCursor } from "@/components/ink/InkCursor";
import { LoadingScreen } from "@/components/ink/LoadingScreen";
import "./globals.css";

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  variable: "--font-noto-serif",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Mike Chen",
  description: "Build things. Taste everything. Design the rest.",
  metadataBase: new URL("https://mikechen.xyz"),
  openGraph: {
    title: "Mike Chen",
    description: "Build things. Taste everything. Design the rest.",
    url: "https://mikechen.xyz",
    siteName: "Mike Chen",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@macccoding",
  },
};

export const viewport: Viewport = {
  themeColor: "#1A1814",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${notoSerif.variable} ${ibmPlexMono.variable}`}
    >
      <body className="bg-ink-black text-parchment antialiased">
        <LoadingScreen />
        <InkCursor />
        {children}
      </body>
    </html>
  );
}
