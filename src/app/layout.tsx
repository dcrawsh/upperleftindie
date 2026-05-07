import type { Metadata } from "next";
import "./globals.css";
import FooterSubscribe from "./components/FooterSubscribe";
import Nav from "./components/Nav";

const siteUrl = "https://www.upperleftindie.com";
const siteDescription =
  "Upper Left Indie is a Northwest music curation project supporting local underserved and under-heard independent artists.";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="grid min-h-screen grid-rows-[auto_1fr_auto]">
          <Nav />
          <main>{children}</main>
          <footer className="border-t border-ink/10 px-6 py-8 text-sm text-ink/60 md:px-10">
            <div className="mx-auto flex max-w-6xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p>Upper Left Indie</p>
                <p>Pacific Northwest artists, heard closer.</p>
              </div>
              <FooterSubscribe />
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
