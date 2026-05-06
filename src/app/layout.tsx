import type { Metadata } from "next";
import "./globals.css";
import Nav from "./components/Nav";

export const metadata: Metadata = {
  title: "Upper Left Indie",
  description: "A Spotify playlist spotlighting under-heard Northwest artists.",
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
            <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p>Upper Left Indie</p>
              <p>Pacific Northwest artists, heard closer.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
