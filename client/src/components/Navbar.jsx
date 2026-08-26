import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useThemedLogo from "../hooks/useThemedLogo";

const CENTER_LINKS = [
  { label: "Features", to: "/#features" },
  { label: "Workflow", to: "/#workflow" },
  { label: "Pricing", to: "/pricing" },
  { label: "Security & Infrastructure", to: "/#security" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const logo = useThemedLogo();
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
      ? "border border-slate-200/80 bg-white/85 shadow-[0_10px_40px_-10px_rgba(15,23,42,0.16)] backdrop-blur-md"
      : "border border-slate-200/60 bg-white/75 backdrop-blur-md";

  const linkClass = (path) =>
    `font-mono text-[11px] uppercase tracking-[0.2em] transition duration-300 hover:text-teal-600 ${
      location.pathname + location.hash === path ||
      (path.startsWith("/#") && location.pathname === "/" && location.hash === path.slice(1))
        ? "text-teal-600"
        : "text-slate-500"
    }`;

  return (
    <nav className="sticky top-4 z-50 px-4 sm:px-6 lg:px-8">
      <div
        className={`relative mx-auto flex w-full max-w-7xl items-center justify-between rounded-full px-4 py-3.5 sm:px-5 ${navBaseClass}`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(to_right,transparent,rgba(15,23,42,0.35),rgba(13,148,136,0.7),transparent)]"
        />

        <Link to="/" className="group flex items-center gap-3">
          <div className="flex w-[38px] sm:w-[44px] aspect-square items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm transition-all group-hover:scale-105">
            <img
              src={logo}
              alt="MedAlerto Logo"
              className="h-2/3 w-auto object-contain"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="block font-heading text-sm font-bold uppercase tracking-[0.1em] text-slate-900">
              MedAlerto
            </span>
            <span className="inline-flex items-center rounded-md bg-slate-900 px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.14em] text-teal-400">
              Pro
            </span>
          </div>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {CENTER_LINKS.map((item) => (
            <Link key={item.label} to={item.to} className={linkClass(item.to)}>
              {item.label}
            </Link>
          ))}
          <button
            onClick={() => navigate("/login")}
            className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-5 font-body text-sm font-semibold text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900 hover:shadow-md active:translate-y-0"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="group relative inline-flex h-10 items-center justify-center overflow-hidden rounded-full bg-teal-600 px-5 font-body text-sm font-bold text-white shadow-[0_10px_25px_-8px_rgba(13,148,136,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-teal-500 hover:shadow-[0_15px_30px_-8px_rgba(13,148,136,0.7)] active:translate-y-0"
          >
            <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-0" />
            <span className="relative z-10">Launch Clinic</span>
          </button>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-teal-600 transition duration-300 hover:-translate-y-0.5 hover:shadow-md lg:hidden"
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
          className="absolute left-4 right-4 top-full z-50 mt-3 rounded-3xl border border-slate-200/80 bg-white/97 p-5 shadow-[0_10px_40px_-10px_rgba(15,23,42,0.2)] backdrop-blur-md sm:left-6 sm:right-6 lg:hidden"
        >
          <div className="flex flex-col gap-4">
            {CENTER_LINKS.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={linkClass(item.to)}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => {
                navigate("/login");
                setMenuOpen(false);
              }}
              className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 font-body text-sm font-semibold text-slate-600 transition duration-300 hover:border-slate-300 hover:text-slate-900"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                navigate("/signup");
                setMenuOpen(false);
              }}
              className="inline-flex h-11 items-center justify-center rounded-full bg-teal-600 px-5 font-body text-sm font-bold text-white shadow-[0_10px_25px_-8px_rgba(13,148,136,0.6)] transition duration-300 hover:bg-teal-500"
            >
              Launch Clinic
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
