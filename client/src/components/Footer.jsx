import { Link } from "react-router-dom";
import logo from "../assets/logo-compact.webp";

const footerLinks = {
  Product: [
    { name: "Features", href: "/features" },
    { name: "How it Works", href: "/how-it-works" },
    { name: "Pricing", href: "/pricing" }
  ],
  Company: [
    { name: "About Us", href: "/about-us" }
  ],
  Support: [
    { name: "Contact Us", href: "/contact" },
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Terms of Service", href: "/terms-of-service" }
  ],
  Integrations: [
    { name: "WhatsApp", href: "#" },
    { name: "PDF Export", href: "#" },
    { name: "Drug Database", href: "#" }
  ],
};

export default function Footer() {
  return (
    <footer id="contact" className="border-t bg-[var(--color-card)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link to="/">
              <img src={logo} alt="MedAlerto Logo" className="h-8 w-auto" />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Trusted clinic management for doctors who value reliable and clear patient communication.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-bold text-[var(--color-text-primary)]">{category}</h4>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link to={link.href} className="text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-6">
          <div>
            <h4 className="text-sm font-bold">View our Pages</h4>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-sm text-[var(--color-text-secondary)]">Instagram:</span>
              <a
                href="https://www.instagram.com/medalerto?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                  <circle cx="12" cy="12" r="4.25" />
                  <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <span className="ml-2 text-sm text-[var(--color-text-secondary)]">LinkedIn:</span>
              <a
                href="https://www.linkedin.com/company/medalerto/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="currentColor">
                  <path d="M6.8 8.9H3.6V20h3.2V8.9zM5.2 3.8a1.9 1.9 0 100 3.8 1.9 1.9 0 000-3.8zM20.4 13.6c0-3.1-1.7-5-4.4-5-1.8 0-2.9 1-3.4 1.8v-1.5H9.5c0 .9.1 11.1 0 11.1h3.2v-6.2c0-.3 0-.7.1-.9.3-.7 1-1.5 2.2-1.5 1.6 0 2.2 1.2 2.2 3v5.6h3.2v-6.4z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="rounded-xl border bg-[var(--color-card)] p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-sm font-bold">Stay updated with tools that make your clinic faster</h4>
                <p className="mt-2 text-xs text-[var(--color-text-secondary)]">Get updates on features that save time and reduce patient confusion.</p>
              </div>
              <div className="flex w-full gap-3 sm:w-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full rounded-xl border bg-[var(--color-bg)] px-4 py-2 text-sm outline-none focus:border-[var(--color-primary)] sm:w-64"
                />
                <button className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-white">Subscribe</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-[var(--color-text-secondary)] sm:flex-row sm:px-6 lg:px-8">
          <p>© 2026 MedAlerto. All rights reserved. Built for doctors who care.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/privacy-policy" className="transition hover:text-[var(--color-primary)]">Privacy Policy</Link>
            <Link to="/terms-of-service" className="transition hover:text-[var(--color-primary)]">Terms of Service</Link>
            <Link to="#" className="transition hover:text-[var(--color-primary)]">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
