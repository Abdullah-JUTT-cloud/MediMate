import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import BrandLogo from "./BrandLogo";

export default function Navbar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Fix the stuck-open drawer state on small screens by letting Escape close the menu.
    if (!menuOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [menuOpen]);

  const navBaseClass =
    scrolled || !isHome
      ? "border border-[var(--color-border)]/70 bg-[var(--color-bg)]/85 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.16)] backdrop-blur-md"
      : "border border-[var(--color-border)]/50 bg-[var(--color-bg)]/75 backdrop-blur-md";

  const linkClass = (path) =>
    `font-mono text-[11px] uppercase tracking-[0.24em] transition duration-300 hover:text-[var(--color-primary)] ${
      location.pathname === path
        ? "text-[var(--color-primary)]"
        : "text-[var(--color-text-secondary)]"
    }`;

  // Keep the mobile drawer aligned with page gutters and collapse it after navigation.

  return (
    <nav className="sticky top-4 z-50 px-4 sm:px-6 lg:px-8">
      <div
        className={`relative mx-auto flex w-full max-w-7xl items-center justify-between rounded-full px-4 py-4 sm:px-5 ${navBaseClass}`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(to_right,transparent,rgba(93,112,82,0.55),rgba(193,140,93,0.8),transparent)]"
        />

        <Link to="/" className="group flex items-center gap-4">
          <BrandLogo
            variant="home"
            markSize={40}
            subtitle="rooted clinic tools"
            markClassName="transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          <Link to="/features" className={linkClass("/features")}>
            Features
          </Link>
          <Link to="/how-it-works" className={linkClass("/how-it-works")}>
            How it Works
          </Link>
          <Link to="/pricing" className={linkClass("/pricing")}>
            Pricing
          </Link>
          <Link to="/faq" className={linkClass("/faq")}>
            FAQ
          </Link>
          <Link to="/blog" className={linkClass("/blog")}>
            Blog
          </Link>
          <Link
            to="/book/doctors"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-5 font-body text-sm font-bold text-[var(--color-primary)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-primary)]/20 active:translate-y-0"
          >
            Book Appointment
          </Link>
          {/* Primary auth actions — the marketing header always shows these two
              links (no logged-in profile pill), pointing at /login and
              /signup respectively. Real <Link>s so they behave like anchors
              (middle-click / open-in-new-tab / crawlable). */}
          <Link
            to="/login"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--color-primary)]/60 bg-transparent px-5 font-body text-sm font-bold text-[var(--color-primary)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 hover:shadow-[0_10px_28px_-14px_rgba(13,148,136,0.35)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/70 focus-visible:ring-offset-2"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)] px-5 font-body text-sm font-bold text-[var(--color-on-primary)] shadow-[0_4px_20px_-2px_rgba(13,148,136,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-primary-hover)] hover:bg-[var(--color-primary-hover)] hover:shadow-[0_10px_28px_-14px_rgba(13,148,136,0.5)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/70 focus-visible:ring-offset-2"
          >
            Create Account
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)]/70 text-[var(--color-primary)] transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-bg-soft)] hover:shadow-[0_10px_28px_-14px_rgba(93,112,82,0.24)] lg:hidden"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
        >
          <div className="space-y-1.5">
            <span
              className={`block h-px w-5 bg-current transition duration-300 ${menuOpen ? "translate-y-2 rotate-45" : ""}`}
            />
            <span
              className={`block h-px w-5 bg-current transition duration-300 ${menuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`block h-px w-5 bg-current transition duration-300 ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`}
            />
          </div>
        </button>
      </div>

      {menuOpen && (
        <div
          id="mobile-nav"
          className="absolute left-4 right-4 top-full z-50 mt-3 rounded-4xl border border-[var(--color-border)]/80 bg-[var(--color-card)]/96 p-5 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.18)] backdrop-blur-md sm:left-6 sm:right-6 lg:hidden"
        >
          <div className="flex flex-col gap-4">
            <Link
              to="/features"
              className={linkClass("/features")}
              onClick={() => setMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              to="/how-it-works"
              className={linkClass("/how-it-works")}
              onClick={() => setMenuOpen(false)}
            >
              How it Works
            </Link>
            <Link
              to="/pricing"
              className={linkClass("/pricing")}
              onClick={() => setMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              to="/faq"
              className={linkClass("/faq")}
              onClick={() => setMenuOpen(false)}
            >
              FAQ
            </Link>
            <Link
              to="/blog"
              className={linkClass("/blog")}
              onClick={() => setMenuOpen(false)}
            >
              Blog
            </Link>
            <Link
              to="/book/doctors"
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)]/10 px-5 font-body text-sm font-bold text-[var(--color-primary)] transition duration-300 hover:-translate-y-0.5"
            >
              Book Appointment
            </Link>
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[var(--color-primary)]/60 bg-transparent px-5 font-body text-sm font-bold text-[var(--color-primary)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/70 focus-visible:ring-offset-2 active:translate-y-0"
            >
              Login
            </Link>
            <Link
              to="/signup"
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)] px-5 font-body text-sm font-bold text-[var(--color-on-primary)] shadow-[0_4px_20px_-2px_rgba(13,148,136,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-primary-hover)] hover:bg-[var(--color-primary-hover)] hover:shadow-[0_10px_28px_-14px_rgba(13,148,136,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/70 focus-visible:ring-offset-2 active:translate-y-0"
            >
              Create Account
            </Link>
          </div>
        </div>
      )}

    </nav>
  );
}
