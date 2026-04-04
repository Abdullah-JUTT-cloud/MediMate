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
    { name: "Terms of Service", href: "/terms-of-service" },
    { name: "Cookie Policy", href: "/cookie-policy" }
  ],
  Integrations: [
    { name: "WhatsApp", href: "#" },
    { name: "PDF Export", href: "#" },
    { name: "Drug Database", href: "#" }
  ],
};

export default function Footer() {
  return (
    <footer id="contact" className="relative overflow-hidden border-t border-[#DED8CF]/70 bg-[#FDFCF8] text-[#2C2C24]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-12 top-12 h-80 w-80 bg-[#E6DCCD]/20 blur-3xl"
        style={{ borderRadius: "60% 40% 35% 65% / 55% 35% 65% 45%" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 bottom-12 h-80 w-80 bg-[#5D7052]/10 blur-3xl"
        style={{ borderRadius: "48% 52% 39% 61% / 48% 34% 66% 52%" }}
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Link to="/" className="group inline-flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#DED8CF]/70 bg-[#5D7052] shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)]">
                <img src={logo} alt="MedAlerto Logo" className="h-8 w-auto rounded-full" />
              </span>
              <span>
                <span className="block font-heading text-sm font-semibold uppercase tracking-[0.22em] text-[#2C2C24]">MedAlerto</span>
                <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.3em] text-[#78786C] transition duration-300 group-hover:text-[#5D7052]">
                  rooted clinic tools
                </span>
              </span>
            </Link>

            <p className="mt-6 max-w-sm text-sm leading-relaxed text-[#78786C]">
              Trusted clinic management for doctors who want fast workflows, secure delivery, and clear communication across every patient touchpoint.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="https://www.instagram.com/medalerto?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#DED8CF]/80 bg-[#FEFEFA] text-[#5D7052] transition duration-300 hover:-translate-y-0.5 hover:border-[#5D7052] hover:bg-[#F0EBE5] hover:shadow-[0_10px_28px_-14px_rgba(93,112,82,0.24)]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3.5" y="3.5" width="17" height="17" />
                  <circle cx="12" cy="12" r="4.25" />
                  <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/company/medalerto/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#DED8CF]/80 bg-[#FEFEFA] text-[#5D7052] transition duration-300 hover:-translate-y-0.5 hover:border-[#5D7052] hover:bg-[#F0EBE5] hover:shadow-[0_10px_28px_-14px_rgba(93,112,82,0.24)]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="currentColor">
                  <path d="M6.8 8.9H3.6V20h3.2V8.9zM5.2 3.8a1.9 1.9 0 100 3.8 1.9 1.9 0 000-3.8zM20.4 13.6c0-3.1-1.7-5-4.4-5-1.8 0-2.9 1-3.4 1.8v-1.5H9.5c0 .9.1 11.1 0 11.1h3.2v-6.2c0-.3 0-.7.1-.9.3-.7 1-1.5 2.2-1.5 1.6 0 2.2 1.2 2.2 3v5.6h3.2v-6.4z" />
                </svg>
              </a>
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="lg:col-span-2">
              <h4 className="font-heading text-sm font-semibold uppercase tracking-[0.22em] text-[#2C2C24]">{category}</h4>
              <ul className="mt-5 space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link to={link.href} className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#78786C] transition duration-300 hover:text-[#5D7052]">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="lg:col-span-4">
            <div className="rounded-4xl border border-[#DED8CF]/70 bg-[#FEFEFA] p-6 shadow-[0_4px_20px_-2px_rgba(93,112,82,0.12)]">
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#5D7052]">Quiet updates</p>
              <h4 className="mt-3 font-heading text-2xl leading-tight text-[#2C2C24]">
                Stay close to the product layer.
              </h4>
              <p className="mt-3 text-sm leading-relaxed text-[#78786C]">
                Get releases, clinic workflows, and feature updates that reduce friction without adding noise.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="h-12 w-full rounded-full border border-[#DED8CF] bg-white/70 px-4 font-body text-sm text-[#2C2C24] placeholder:text-[#78786C] focus:border-[#5D7052] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7052]/20"
                />
                <button className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full border border-[#5D7052] bg-[#5D7052] px-5 font-body text-sm font-bold text-[#F3F4F1] shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-14px_rgba(93,112,82,0.3)] active:translate-y-0">
                  <span className="absolute inset-0 bg-[#C18C5D] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="relative z-10">Subscribe</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-[#DED8CF]/70 pt-6">
          <div className="flex flex-col gap-4 text-sm text-[#78786C] lg:flex-row lg:items-center lg:justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#78786C]">
              © 2026 MedAlerto. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-5">
              <Link to="/privacy-policy" className="font-mono text-[10px] uppercase tracking-[0.24em] transition duration-300 hover:text-[#5D7052]">Privacy Policy</Link>
              <Link to="/terms-of-service" className="font-mono text-[10px] uppercase tracking-[0.24em] transition duration-300 hover:text-[#5D7052]">Terms of Service</Link>
              <Link to="/cookie-policy" className="font-mono text-[10px] uppercase tracking-[0.24em] transition duration-300 hover:text-[#5D7052]">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
