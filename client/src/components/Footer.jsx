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

        <div className="mt-8 rounded-xl border bg-[var(--color-bg)] p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-bold">Stay updated with tools that make your clinic faster</h4>
              <p className="mt-2 text-xs text-[var(--color-text-secondary)]">Get updates on features that save time and reduce patient confusion.</p>
            </div>
            <div className="flex w-full gap-3 sm:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-xl border bg-[var(--color-card)] px-4 py-2 text-sm outline-none focus:border-[var(--color-primary)] sm:w-64"
              />
              <button className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-white">Subscribe</button>
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
