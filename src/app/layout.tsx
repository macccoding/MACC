import type { Metadata, Viewport } from "next";
import { Alegreya, IBM_Plex_Mono, Zen_Antique } from "next/font/google";
import { InkCursor } from "@/components/ink/InkCursor";
import { LoadingScreen } from "@/components/ink/LoadingScreen";
import "./globals.css";

const zenAntique = Zen_Antique({
  subsets: ["latin"],
  variable: "--font-shippori",
  display: "swap",
  weight: "400",
});

const alegreya = Alegreya({
  subsets: ["latin"],
  variable: "--font-noto-serif",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Mike Chen",
  description: "Experience. Build. Move.",
  metadataBase: new URL("https://mikechen.xyz"),
  openGraph: {
    title: "Mike Chen",
    description: "Experience. Build. Move.",
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
  themeColor: "#F5EDE0",
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
      className={`${zenAntique.variable} ${alegreya.variable} ${ibmPlexMono.variable}`}
    >
      <body className="bg-parchment text-ink-black antialiased">
        <LoadingScreen />
        <InkCursor />
        {children}
      </body>
    </html>
  );
}
