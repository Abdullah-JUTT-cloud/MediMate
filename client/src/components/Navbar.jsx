import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "../assets/logo-compact.webp";

export default function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navBaseClass = scrolled
    ? "border-b bg-[var(--color-card)]/95 shadow-sm backdrop-blur"
    : "border-b border-transparent bg-[var(--color-card)]/80";

  return (
    <nav className={`fixed left-0 right-0 top-0 z-50 transition ${navBaseClass}`}>
      <div className="flex w-full items-center justify-between px-4 py-4 sm:px-8 lg:px-10 xl:px-14">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="MedAlerto Logo" className="h-8 w-auto" />
          <p className="text-sm font-extrabold tracking-tight text-[var(--color-text-primary)] sm:text-base">MedAlerto</p>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link to="/features" className="text-sm font-semibold text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]">Features</Link>
          <Link to="/how-it-works" className="text-sm font-semibold text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]">How it Works</Link>
          <Link to="/pricing" className="text-sm font-semibold text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]">Pricing</Link>
          <button
            onClick={() => navigate("/login")}
            className="rounded-xl border border-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/10"
          >
            Login
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Create Account
          </button>
        </div>

        <button
          type="button"
          className="rounded-xl border p-2 text-[var(--color-text-primary)] md:hidden"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          <div className="space-y-1">
            <span className={`block h-0.5 w-5 bg-current transition ${menuOpen ? "translate-y-1.5 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-5 bg-current transition ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-current transition ${menuOpen ? "-translate-y-1.5 -rotate-45" : ""}`} />
          </div>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t bg-[var(--color-card)] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link to="/features" className="text-sm font-semibold text-[var(--color-text-secondary)]" onClick={() => setMenuOpen(false)}>Features</Link>
            <Link to="/how-it-works" className="text-sm font-semibold text-[var(--color-text-secondary)]" onClick={() => setMenuOpen(false)}>How it Works</Link>
            <Link to="/pricing" className="text-sm font-semibold text-[var(--color-text-secondary)]" onClick={() => setMenuOpen(false)}>Pricing</Link>
            <button
              onClick={() => {
                navigate("/login");
                setMenuOpen(false);
              }}
              className="rounded-xl border border-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)]"
            >
              Login
            </button>
            <button
              onClick={() => {
                navigate("/signup");
                setMenuOpen(false);
              }}
              className="rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white"
            >
              Create Account
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
