"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import { FaInstagram } from "react-icons/fa";
import SiteContainer from "./SiteContainer";

const links = [
  { href: "/submit", label: "Submit" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

const instagramUrl = "https://www.instagram.com/upperleftindie/";

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <nav className="relative z-50 border-b border-ink/10 bg-paper/90 backdrop-blur">
      <SiteContainer className="flex items-center justify-between gap-3 py-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 sm:gap-3"
          aria-label="Upper Left Indie home"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-xs font-black uppercase text-paper sm:h-10 sm:w-10 sm:text-sm">
            UL
          </span>
          <span className="whitespace-nowrap text-sm font-black uppercase tracking-[0.1em] text-ink sm:text-lg lg:tracking-[0.18em]">
            Upper Left Indie
          </span>
        </Link>

        <ul className="hidden items-center gap-4 text-xs font-bold uppercase tracking-[0.08em] text-ink/60 md:flex lg:gap-6 lg:text-sm lg:tracking-[0.12em]">
          <li>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span>Support</span>
              <Link
                href="/artists"
                className={`transition hover:text-ink ${
                  pathname === "/artists" ? "text-ink" : ""
                }`}
              >
                Artists
              </Link>
              <span className="text-ink/30">/</span>
              <Link
                href="/support-the-project"
                className={`transition hover:text-ink ${
                  pathname === "/support-the-project" ? "text-ink" : ""
                }`}
              >
                Playlist
              </Link>
            </div>
          </li>
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`transition hover:text-ink ${
                  pathname === link.href ? "text-ink" : ""
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden shrink-0 items-center gap-2 md:flex lg:gap-3">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="grid h-11 w-11 place-items-center rounded-full border border-ink/15 text-ink transition hover:border-clay hover:text-clay"
            aria-label="Upper Left Indie on Instagram"
            title="Instagram"
          >
            <FaInstagram size={21} />
          </a>
          <Link
            href="/submit"
            className="rounded-full bg-clay px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] text-paper shadow-soft transition hover:bg-ink lg:px-5 lg:text-sm lg:tracking-[0.12em]"
          >
            Send a Track
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-ink/15 text-ink md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </SiteContainer>

      <div
        className={`fixed inset-0 bg-ink/35 transition-opacity duration-300 md:hidden ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />

      <div
        className={`fixed right-0 top-0 flex h-screen w-72 flex-col bg-paper shadow-soft transition-transform duration-300 md:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <span className="font-black uppercase tracking-[0.14em]">Menu</span>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="grid h-10 w-10 place-items-center rounded-full border border-ink/15"
            aria-label="Close navigation menu"
          >
            <FiX size={22} />
          </button>
        </div>

        <ul className="flex-1 space-y-2 px-5 py-6 text-lg font-bold">
          <li>
            <div
              className={`rounded-md px-3 py-3 ${
                pathname === "/artists" || pathname === "/support-the-project"
                  ? "bg-ink text-paper"
                  : "text-ink"
              }`}
            >
              <span className="mb-2 block text-sm uppercase tracking-[0.14em] opacity-70">
                Support
              </span>
              <div className="flex items-center gap-2">
                <Link href="/artists" className="transition hover:opacity-70">
                  Artist
                </Link>
                <span className="opacity-40">/</span>
                <Link
                  href="/support-the-project"
                  className="transition hover:opacity-70"
                >
                  Playlist
                </Link>
              </div>
            </div>
          </li>
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`block rounded-md px-3 py-3 transition hover:bg-ink/5 ${
                  pathname === link.href ? "bg-ink text-paper" : "text-ink"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="border-t border-ink/10 p-5">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="mb-3 flex items-center justify-center gap-2 rounded-full border border-ink/15 px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-ink"
          >
            <FaInstagram size={19} />
            Instagram
          </a>
          <Link
            href="/submit"
            className="block rounded-full bg-clay px-5 py-3 text-center text-sm font-bold uppercase tracking-[0.12em] text-paper"
          >
            Send a Track
          </Link>
        </div>
      </div>
    </nav>
  );
}
