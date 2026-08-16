import type { Metadata } from "next";
import { Archivo_Narrow, Public_Sans } from "next/font/google";
import "./globals.css";
import Nav from "./components/Nav";
import SiteFooter from "./components/SiteFooter";
import { SITE_DESCRIPTION, SITE_URL } from "../lib/site";

const siteUrl = SITE_URL;
const siteDescription = SITE_DESCRIPTION;

// Figma foundations: Archivo Narrow for display, Public Sans for text. Weights
// are limited to the four the design actually uses, and both faces are
// self-hosted and subset by next/font to keep the payload small — the product
// previously loaded no webfont at all.
const displayFont = Archivo_Narrow({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-display",
});

const textFont = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-text",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Upper Left Indie | Northwest Independent Music Curator",
    template: "%s | Upper Left Indie",
  },
  description: siteDescription,
  applicationName: "Upper Left Indie",
  authors: [{ name: "Upper Left Indie", url: siteUrl }],
  creator: "Upper Left Indie",
  publisher: "Upper Left Indie",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "Upper Left Indie",
    "Northwest music",
    "Pacific Northwest music",
    "PNW independent artists",
    "local music curator",
    "under-heard artists",
    "underserved artists",
    "indie playlist",
    "Oregon music",
    "Washington music",
    "Idaho music",
    "Alaska music",
    "British Columbia music",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Upper Left Indie",
    title: "Upper Left Indie | Northwest Independent Music Curator",
    description: siteDescription,
    images: [
      {
        url: "/Upperleftindie.png",
        width: 800,
        height: 800,
        alt: "Upper Left Indie logo and playlist artwork",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Upper Left Indie | Northwest Independent Music Curator",
    description: siteDescription,
    images: ["/Upperleftindie.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/icon.svg",
  },
  verification: {
    google: "I2IjfhHLjwEfWBPi-wKRseBKiE3PqQpDuCh32o2nKpQ",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${displayFont.variable} ${textFont.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-field focus:bg-inverse focus:px-5 focus:py-3 focus:type-button focus:text-on-inverse"
        >
          Skip to content
        </a>
        <div id="site-shell" className="grid min-h-screen grid-rows-[auto_1fr_auto]">
          <Nav />
          {/* min-w-0: as a grid item, main defaults to min-width:auto, which
              lets any wide descendant (a horizontal filter strip, a long
              unbroken string) push the whole page wider than the viewport. */}
          <main id="main" className="min-w-0">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
