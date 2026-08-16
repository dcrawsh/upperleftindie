"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiMenu, FiX } from "react-icons/fi";
import { FaInstagram } from "react-icons/fa";
import SiteContainer from "./SiteContainer";
import { ButtonLink } from "./ui/Button";
import { INSTAGRAM_URL } from "../../lib/site";

/**
 * Header — Figma component set 16:23.
 *
 * The IA the audit asked for: Listen / Artists / Shows / About plus a single
 * submit CTA. The old "Support Artists / Support Playlist" grouping is gone —
 * "Playlist" pointed at a payment page — and money moves to the footer and to
 * contextual placements.
 */
const navLinks = [
  { href: "/", label: "Listen", section: ["/", "/archive"] },
  { href: "/artists", label: "Artists", section: ["/artists"] },
  { href: "/shows", label: "Shows", section: ["/shows"] },
  { href: "/about", label: "About", section: ["/about"] },
];

const drawerLinks = [
  ...navLinks,
  { href: "/archive", label: "Archive", section: ["/archive"] },
  { href: "/support-the-project", label: "Support the project", section: ["/support-the-project"] },
  { href: "/contact", label: "Contact", section: ["/contact"] },
];

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

function LogoMark() {
  return (
    <span
      className="grid h-9 w-9 shrink-0 grow-0 place-items-center rounded-card bg-inverse text-center text-[12px] font-semibold uppercase leading-none tracking-[0.06em] text-on-inverse"
      aria-hidden="true"
    >
      UL
    </span>
  );
}

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const closeMenu = useCallback(() => {
    restoreFocusRef.current = true;
    setMenuOpen(false);
  }, []);

  // While the drawer is open it is the only interactive region: the rest of the
  // page is made inert, the body cannot scroll, Escape closes, and Tab cycles
  // inside the dialog (requirement A7).
  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const shell = document.getElementById("site-shell");
    const previousOverflow = document.body.style.overflow;

    shell?.setAttribute("inert", "");
    document.body.style.overflow = "hidden";

    const drawer = drawerRef.current;
    drawer?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== "Tab" || !drawer) {
        return;
      }

      const focusable = Array.from(drawer.querySelectorAll<HTMLElement>(FOCUSABLE));

      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      shell?.removeAttribute("inert");
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen, closeMenu]);

  // Focus goes back to the toggle only after the effect above has removed
  // `inert` — focusing inside an inert subtree silently does nothing.
  useEffect(() => {
    if (!menuOpen && restoreFocusRef.current) {
      restoreFocusRef.current = false;
      toggleRef.current?.focus();
    }
  }, [menuOpen]);

  const linkState = (link: { href: string; section: string[] }) => {
    const isExact = pathname === link.href;
    const isSection = link.section.includes(pathname ?? "");

    return {
      "aria-current": isExact ? ("page" as const) : isSection ? ("true" as const) : undefined,
      isSection,
    };
  };

  return (
    <header className="sticky top-0 z-40 border-b border-subtle bg-page/95 backdrop-blur">
      <SiteContainer className="flex h-[72px] items-center gap-4 md:gap-6 lg:gap-8">
        <Link
          href="/"
          className="flex min-h-11 shrink-0 items-center gap-2.5 rounded-field"
          aria-label="Upper Left Indie home"
        >
          <LogoMark />
          <span className="whitespace-nowrap type-heading-m text-primary">
            Upper Left Indie
          </span>
        </Link>

        <nav aria-label="Main" className="hidden min-w-0 flex-1 md:block">
          <ul className="flex items-center gap-5 lg:gap-7">
            {navLinks.map((link) => {
              const state = linkState(link);

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={state["aria-current"]}
                    className={`inline-flex min-h-11 items-center whitespace-nowrap type-label-m transition ${
                      state.isSection
                        ? "text-primary underline decoration-accent-solid decoration-2 underline-offset-8"
                        : "text-secondary hover:text-primary"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Figma keeps a single header action; Instagram lives in the footer
            and in the mobile menu. */}
        <div className="ml-auto hidden shrink-0 md:block">
          <ButtonLink href="/submit" emphasis="primary" size="md">
            Submit music
          </ButtonLink>
        </div>

        <button
          ref={toggleRef}
          type="button"
          onClick={() => setMenuOpen(true)}
          className="ml-auto grid h-11 w-11 shrink-0 place-items-center rounded-full border-[1.5px] border-strong text-primary md:hidden"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-haspopup="dialog"
        >
          <FiMenu size={20} aria-hidden="true" />
        </button>
      </SiteContainer>

      {mounted && menuOpen
        ? createPortal(
            <div className="fixed inset-0 z-50 md:hidden">
              <div
                className="absolute inset-0 bg-inverse/50"
                onClick={closeMenu}
                aria-hidden="true"
              />
              <div
                ref={drawerRef}
                role="dialog"
                aria-modal="true"
                aria-label="Site menu"
                className="absolute right-0 top-0 flex h-[100dvh] w-[min(20rem,88vw)] flex-col bg-page shadow-overlay"
              >
                <div className="flex items-center justify-between border-b border-subtle px-5 py-4">
                  <span className="type-label-m text-secondary">Menu</span>
                  <button
                    type="button"
                    onClick={closeMenu}
                    className="grid h-11 w-11 place-items-center rounded-full border-[1.5px] border-strong text-primary"
                    aria-label="Close menu"
                  >
                    <FiX size={20} aria-hidden="true" />
                  </button>
                </div>

                <nav aria-label="Site" className="flex-1 overflow-y-auto px-5 py-4">
                  <ul className="flex flex-col">
                    {drawerLinks.map((link) => {
                      const state = linkState(link);

                      return (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            aria-current={state["aria-current"]}
                            className={`flex min-h-12 items-center rounded-field px-3 type-heading-s transition ${
                              state.isSection
                                ? "bg-inverse text-on-inverse"
                                : "text-primary hover:bg-accent-soft"
                            }`}
                          >
                            {link.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                <div className="flex flex-col gap-3 border-t border-subtle p-5">
                  <ButtonLink href="/submit" emphasis="primary" size="md" fullWidth>
                    Submit music
                  </ButtonLink>
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-[1.5px] border-strong px-5 type-button text-primary"
                  >
                    <FaInstagram size={18} aria-hidden="true" />
                    Instagram
                  </a>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </header>
  );
}
