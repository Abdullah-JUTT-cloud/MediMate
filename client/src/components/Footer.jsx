import { Link } from "react-router-dom";
import useThemedLogo from "../hooks/useThemedLogo";

const footerLinks = {
  Product: [
    { name: "Features", href: "/features" },
    { name: "How it Works", href: "/how-it-works" },
    { name: "Pricing", href: "/pricing" },
  ],
  Company: [
    { name: "About Us", href: "/about-us" },
    { name: "Contact", href: "/contact" },
    { name: "Blog", href: "/blog" },
  ],
  // Fix duplicate footer content by replacing the repeated contact link with distinct support destinations.
  Support: [
    { name: "FAQ", href: "/faq" },
    { name: "Privacy Policy", href: "/privacy-policy" },
  ],
  Integrations: [
    { name: "WhatsApp", href: "#" },
    { name: "PDF Export", href: "#" },
    { name: "Drug Database", href: "#" },
  ],
};

export default function Footer() {
  const logo = useThemedLogo();

  return (
    <footer
      id="contact"
      className="relative overflow-hidden border-t border-[var(--color-border)]/70 bg-[var(--color-bg)] text-[var(--color-text-primary)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-12 top-12 h-80 w-80 bg-[var(--color-accent)]/20 blur-3xl"
        style={{ borderRadius: "60% 40% 35% 65% / 55% 35% 65% 45%" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 bottom-12 h-80 w-80 bg-[var(--color-primary)]/10 blur-3xl"
        style={{ borderRadius: "48% 52% 39% 61% / 48% 34% 66% 52%" }}
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link to="/" className="group inline-flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)]/80 bg-[var(--color-card)] shadow-[var(--shadow-soft)]">
                <img
                  src={logo}
                  alt="MedAlerto Logo"
                  className="h-full w-full object-contain p-1"
                />
              </span>
              <span>
                <span className="block font-heading text-sm font-semibold uppercase tracking-[0.15em] text-[var(--color-text-primary)]">
                  MedAlerto
                </span>
                <div className="h-px w-10 bg-[var(--color-border)] mt-1 mb-1 opacity-60" />
                <span className="block font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-text-secondary)] transition duration-300 group-hover:text-[var(--color-primary)]">
                  rooted clinic tools
                </span>
              </span>
            </Link>

            <p className="mt-6 max-w-[320px] text-sm font-medium leading-relaxed text-[var(--color-text-secondary)]">
              Trusted clinic management for faster workflows, secure delivery, and seamless patient communication.
            </p>
            
            <p className="mt-4 text-xs font-bold text-[var(--color-primary)]/80">
              Built for doctors. Designed for simplicity.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="https://www.instagram.com/medalerto?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)]/80 bg-[var(--color-card)] text-[var(--color-primary)] transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5 hover:shadow-lg cursor-pointer"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect x="3.5" y="3.5" width="17" height="17" />
                  <circle cx="12" cy="12" r="4.25" />
                  <circle
                    cx="17.4"
                    cy="6.6"
                    r="1"
                    fill="currentColor"
                    stroke="none"
                  />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/company/medalerto/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)]/80 bg-[var(--color-card)] text-[var(--color-primary)] transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5 hover:shadow-lg cursor-pointer"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  aria-hidden="true"
                  fill="currentColor"
                >
                  <path d="M6.8 8.9H3.6V20h3.2V8.9zM5.2 3.8a1.9 1.9 0 100 3.8 1.9 1.9 0 000-3.8zM20.4 13.6c0-3.1-1.7-5-4.4-5-1.8 0-2.9 1-3.4 1.8v-1.5H9.5c0 .9.1 11.1 0 11.1h3.2v-6.2c0-.3 0-.7.1-.9.3-.7 1-1.5 2.2-1.5 1.6 0 2.2 1.2 2.2 3v5.6h3.2v-6.4z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 lg:col-span-4 lg:gap-x-4">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="font-heading text-sm font-bold uppercase tracking-[0.22em] text-[var(--color-text-primary)]">
                  {category}
                </h4>
                <ul className="mt-6 space-y-4">
                  {links.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.href}
                        className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-text-secondary)] transition-all duration-300 hover:text-[var(--color-primary)] hover:translate-x-1 inline-block"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4">
            <div className="ml-auto max-w-[400px] rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all hover:shadow-[0_15px_40px_rgba(0,0,0,0.12)]">
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--color-primary)]">
                Updates
              </p>
              <h4 className="mt-4 font-heading text-2xl font-semibold leading-tight text-[var(--color-text-primary)]">
                Stay updated with product improvements.
              </h4>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Get practical clinic workflows and feature updates that reduce
                friction without noise.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="h-12 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/70 px-4 font-body text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/20"
                />
                <button className="group relative inline-flex h-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)] px-6 font-body text-sm font-bold text-[var(--color-on-primary)] shadow-[0_4px_20px_-2px_rgba(var(--color-primary-rgb),0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-14px_rgba(var(--color-primary-rgb),0.4)] active:translate-y-0">
                  <span className="relative z-10">Subscribe</span>
                </button>
              </div>
              <p className="mt-3 text-[10px] text-[var(--color-text-secondary)]/80 text-center sm:text-left">
                No spam. Only useful updates.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-[#E5E7EB] pt-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-text-secondary)]">
              © 2026 MedAlerto. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <Link
                to="/privacy-policy"
                className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-text-secondary)] transition-colors duration-300 hover:text-[var(--color-primary)]"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms-of-service"
                className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-text-secondary)] transition-colors duration-300 hover:text-[var(--color-primary)]"
              >
                Terms of Service
              </Link>
              <Link
                to="/cookie-policy"
                className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-text-secondary)] transition-colors duration-300 hover:text-[var(--color-primary)]"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
