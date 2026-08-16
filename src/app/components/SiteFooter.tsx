import Link from "next/link";
import FooterSubscribe from "./FooterSubscribe";
import SiteContainer from "./SiteContainer";
import { INSTAGRAM_URL } from "../../lib/site";

/**
 * Footer — Figma 21:76 (desktop) / 22:124 (mobile).
 *
 * Carries the secondary destinations, including the project-support ask. Money
 * lives here rather than in the header, matching the project's own
 * de-emphasis of it.
 */
const footerLinks = [
  { href: "/archive", label: "Archive" },
  { href: "/shows", label: "Shows" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/support-the-project", label: "Support the project" },
];

export default function SiteFooter() {
  return (
    <footer className="bg-inverse py-12 md:py-14">
      <SiteContainer className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between md:gap-16">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="type-heading-m text-on-inverse">Upper Left Indie</p>
          <p className="type-body-s text-on-inverse/85">
            Pacific Northwest artists, heard closer.
          </p>
          <nav aria-label="Footer" className="mt-2">
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-11 items-center type-label-s text-on-inverse underline decoration-transparent underline-offset-4 transition hover:decoration-on-inverse"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center type-label-s text-on-inverse underline decoration-transparent underline-offset-4 transition hover:decoration-on-inverse"
                >
                  Instagram
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <FooterSubscribe />
      </SiteContainer>
    </footer>
  );
}
