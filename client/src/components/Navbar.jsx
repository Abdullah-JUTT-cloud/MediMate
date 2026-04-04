import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo-compact.webp";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navBaseClass = scrolled || !isHome
    ? "border border-[#DED8CF]/70 bg-[#FDFCF8]/85 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.16)] backdrop-blur-md"
    : "border border-[#DED8CF]/50 bg-[#FDFCF8]/75 backdrop-blur-md";

  const linkClass = (path) =>
    `font-mono text-[11px] uppercase tracking-[0.24em] transition duration-300 hover:text-[#5D7052] ${
      location.pathname === path ? "text-[#5D7052]" : "text-[#78786C]"
    }`;

  return (
    <nav className="sticky top-4 z-50 px-4 sm:px-6 lg:px-8">
      <div className={`relative mx-auto flex w-full max-w-7xl items-center justify-between rounded-full px-4 py-4 sm:px-5 ${navBaseClass}`}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(to_right,transparent,rgba(93,112,82,0.55),rgba(193,140,93,0.8),transparent)]"
        />

        <Link to="/" className="group flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#DED8CF]/70 bg-[#5D7052] shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)]">
            <img src={logo} alt="MedAlerto Logo" className="h-7 w-auto rounded-full" />
          </span>
          <span>
            <span className="block font-heading text-sm font-semibold uppercase tracking-[0.22em] text-[#2C2C24]">
              MedAlerto
            </span>
            <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.3em] text-[#78786C] transition duration-300 group-hover:text-[#5D7052]">
              rooted clinic tools
            </span>
          </span>
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
          <button
            onClick={() => navigate("/login")}
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#C18C5D] bg-white/65 px-5 font-body text-sm font-bold text-[#C18C5D] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#B67746] hover:bg-[#F0EBE5] hover:shadow-[0_10px_28px_-14px_rgba(193,140,93,0.28)] active:translate-y-0"
          >
            Login
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-full border border-[#5D7052] bg-[#5D7052] px-5 font-body text-sm font-bold text-[#F3F4F1] shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-14px_rgba(93,112,82,0.3)] active:translate-y-0"
          >
            <span className="absolute inset-0 bg-[#C18C5D] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative z-10">Create Account</span>
          </button>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#DED8CF] bg-white/70 text-[#5D7052] transition duration-300 hover:-translate-y-0.5 hover:bg-[#F0EBE5] hover:shadow-[0_10px_28px_-14px_rgba(93,112,82,0.24)] lg:hidden"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
        >
          <div className="space-y-1.5">
            <span className={`block h-px w-5 bg-current transition duration-300 ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-px w-5 bg-current transition duration-300 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-px w-5 bg-current transition duration-300 ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </div>
        </button>
      </div>

      {menuOpen && (
        <div id="mobile-nav" className="absolute left-4 right-4 top-full mt-3 rounded-4xl border border-[#DED8CF]/80 bg-[#FEFEFA]/96 p-5 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.18)] backdrop-blur-md lg:hidden">
          <div className="flex flex-col gap-4">
            <Link to="/features" className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#78786C] transition duration-300 hover:text-[#5D7052]" onClick={() => setMenuOpen(false)}>Features</Link>
            <Link to="/how-it-works" className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#78786C] transition duration-300 hover:text-[#5D7052]" onClick={() => setMenuOpen(false)}>How it Works</Link>
            <Link to="/pricing" className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#78786C] transition duration-300 hover:text-[#5D7052]" onClick={() => setMenuOpen(false)}>Pricing</Link>
            <button
              onClick={() => {
                navigate("/login");
                setMenuOpen(false);
              }}
              className="inline-flex h-11 items-center justify-center rounded-full border border-[#C18C5D] bg-white/65 px-5 font-body text-sm font-bold text-[#C18C5D] transition duration-300 hover:-translate-y-0.5 hover:bg-[#F0EBE5] hover:shadow-[0_10px_28px_-14px_rgba(193,140,93,0.28)]"
            >
              Login
            </button>
            <button
              onClick={() => {
                navigate("/signup");
                setMenuOpen(false);
              }}
              className="inline-flex h-11 items-center justify-center rounded-full border border-[#5D7052] bg-[#5D7052] px-5 font-body text-sm font-bold text-[#F3F4F1] shadow-[0_4px_20px_-2px_rgba(93,112,82,0.15)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-14px_rgba(93,112,82,0.3)]"
            >
              Create Account
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
