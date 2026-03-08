import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "../assets/logo.svg";
import doc from "../assets/doc.jpg";

const features = [
  {
    icon: "📋",
    title: "Digital Prescriptions",
    description:
      "Create and send prescriptions instantly as PDFs via WhatsApp. No more lost or damaged paper prescriptions.",
  },
  {
    icon: "💊",
    title: "Medicine Alternatives",
    description:
      "Find alternative medicines by the same salt composition when your prescribed brand is unavailable.",
  },
  {
    icon: "📅",
    title: "Smart Appointments",
    description:
      "Schedule follow-ups with automatic WhatsApp confirmations. Reduce no-shows with intelligent reminders.",
  },
  {
    icon: "🏥",
    title: "Patient History",
    description:
      "Access complete patient records and visit history instantly. Make informed decisions every time.",
  },
  {
    icon: "🚨",
    title: "Emergency Management",
    description:
      "Cancel a range of appointments with one click in emergencies. Patients are notified automatically.",
  },
  {
    icon: "📊",
    title: "Practice Insights",
    description:
      "Track monthly earnings, patient activity, and clinic performance without any extra effort.",
  },
];

const stats = [
  { value: "10x", label: "Faster Prescriptions" },
  { value: "Zero", label: "Lost Prescriptions" },
  { value: "100%", label: "WhatsApp Delivery" },
  { value: "24/7", label: "Patient Records Access" },
];

const footerLinks = {
  Product: ["Features", "How it Works", "Pricing"],
  Company: ["About Us"],
  Support: ["Help Center", "Contact Us", "Privacy Policy", "Terms of Service"],
  Integrations: ["WhatsApp", "PDF Export", "Drug Database", "SMS Alerts"],
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen font-sans" style={{ background: "#ffffff", color: "#1a1a2e" }}>

      {/* NAVBAR */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(15,25,35,0.97)" : "#0f1923",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          boxShadow: scrolled ? "0 2px 20px rgba(16,184,169,0.15)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src={logo} alt="MediMate Logo" className="h-8 sm:h-10 w-auto brightness-0 invert" />
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <a href="#features" className="text-sm font-medium transition-colors hover:text-teal-400" style={{ color: "#94a3b8" }}>Features</a>
            <a href="#stats" className="text-sm font-medium transition-colors hover:text-teal-400" style={{ color: "#94a3b8" }}>Why MediMate</a>
            <a href="#contact" className="text-sm font-medium transition-colors hover:text-teal-400" style={{ color: "#94a3b8" }}>Contact</a>
            <button
              onClick={() => navigate("/login")}
              className="text-sm font-semibold px-4 lg:px-5 py-2 rounded-xl transition-all duration-200"
              style={{ color: "#10b8a9", border: "1.5px solid #10b8a9" }}
              onMouseEnter={e => e.target.style.background = "rgba(16,184,169,0.1)"}
              onMouseLeave={e => e.target.style.background = "transparent"}
            >
              Login
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="text-sm font-semibold px-4 lg:px-5 py-2 rounded-xl text-white transition-all duration-200 hover:opacity-90 hover:scale-105"
              style={{ background: "linear-gradient(135deg, #10b8a9, #0d9488)", boxShadow: "0 4px 15px rgba(16,184,169,0.4)" }}
            >
              Create Account
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            <div className="space-y-1.5">
              <span className={`block w-6 h-0.5 transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} style={{ background: "#10b8a9" }}></span>
              <span className={`block w-6 h-0.5 transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} style={{ background: "#10b8a9" }}></span>
              <span className={`block w-6 h-0.5 transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} style={{ background: "#10b8a9" }}></span>
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden px-4 pb-5 pt-2 flex flex-col gap-3" style={{ background: "#0f1923", borderTop: "1px solid rgba(16,184,169,0.2)" }}>
            <a href="#features" className="text-sm font-medium py-2" style={{ color: "#94a3b8" }} onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#stats" className="text-sm font-medium py-2" style={{ color: "#94a3b8" }} onClick={() => setMenuOpen(false)}>Why MediMate</a>
            <a href="#contact" className="text-sm font-medium py-2" style={{ color: "#94a3b8" }} onClick={() => setMenuOpen(false)}>Contact</a>
            <button onClick={() => { navigate("/login"); setMenuOpen(false); }} className="text-sm font-semibold py-3 rounded-xl w-full" style={{ color: "#10b8a9", border: "1.5px solid #10b8a9" }}>Login</button>
            <button onClick={() => { navigate("/signup"); setMenuOpen(false); }} className="text-sm font-semibold py-3 rounded-xl text-white w-full" style={{ background: "linear-gradient(135deg, #10b8a9, #0d9488)" }}>Create Account</button>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden pt-16"
        style={{ background: "linear-gradient(135deg, #0f1923 0%, #1a2f3f 60%, #0f2a2a 100%)" }}
      >
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #10b8a9, transparent)", filter: "blur(60px)" }} />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #10b8a9, transparent)", filter: "blur(80px)" }} />
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `linear-gradient(rgba(16,184,169,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16,184,169,0.3) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left — Text content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-6"
                style={{ background: "rgba(16,184,169,0.15)", color: "#10b8a9", border: "1px solid rgba(16,184,169,0.3)" }}
              >
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                Built for Modern Clinics
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5 leading-tight text-white">
                A Great Place to
                <br />
                <span style={{ background: "linear-gradient(135deg, #10b8a9, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Care for Yourself
                </span>
              </h1>

              <p className="text-base sm:text-lg max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed" style={{ color: "#94a3b8" }}>
                MediMate automates prescriptions, appointments, and patient records —
                so you spend less time on paperwork and more time with patients.
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-8">
                {[["500+", "Doctors"], ["50k+", "Patients"], ["99%", "Satisfaction"]].map(([val, label]) => (
                  <div key={label} className="text-center lg:text-left">
                    <div className="text-xl sm:text-2xl font-extrabold" style={{ color: "#10b8a9" }}>{val}</div>
                    <div className="text-xs" style={{ color: "#64748b" }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
                <button
                  onClick={() => navigate("/signup")}
                  className="group w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-2xl text-white font-semibold text-sm sm:text-base transition-all duration-300 hover:scale-105 hover:shadow-2xl flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #10b8a9, #0d9488)", boxShadow: "0 8px 30px rgba(16,184,169,0.4)" }}
                >
                  Book Appointment
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-2xl font-semibold text-sm sm:text-base transition-all duration-200"
                  style={{ color: "#10b8a9", border: "1.5px solid rgba(16,184,169,0.5)", background: "rgba(16,184,169,0.05)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(16,184,169,0.1)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(16,184,169,0.05)"}
                >
                  Sign In to Dashboard
                </button>
              </div>
            </div>

            {/* Right — Doctor image placeholder */}
            <div className="relative flex justify-center lg:justify-end">
              <div
                className="relative w-72 sm:w-80 lg:w-96 h-96 sm:h-[450px] lg:h-[500px] rounded-3xl overflow-hidden flex items-end justify-center"
                style={{ background: "linear-gradient(180deg, rgba(16,184,169,0.15) 0%, rgba(16,184,169,0.3) 100%)", border: "1px solid rgba(16,184,169,0.2)" }}
              >
                {/* Replace this div with your doctor image */}
                <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ color: "rgba(16,184,169,0.4)" }}>
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <img src={doc} alt="" />
                </div>

                {/* Floating info cards */}
                <div
                  className="absolute top-6 left-4 px-3 py-2 rounded-xl text-xs font-medium"
                  style={{ background: "rgba(15,25,35,0.9)", border: "1px solid rgba(16,184,169,0.3)", color: "#10b8a9", backdropFilter: "blur(10px)" }}
                >
                  ✓ 500+ Doctors Online
                </div>
                <div
                  className="absolute bottom-6 right-4 px-3 py-2 rounded-xl text-xs font-medium"
                  style={{ background: "rgba(15,25,35,0.9)", border: "1px solid rgba(16,184,169,0.3)", color: "white", backdropFilter: "blur(10px)" }}
                >
                  📋 Prescription Sent via WhatsApp
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section id="stats" className="py-14 sm:py-20" style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl sm:text-4xl font-extrabold mb-1 sm:mb-2" style={{ color: "#10b8a9" }}>{value}</div>
                <div className="text-xs sm:text-sm font-medium" style={{ color: "#64748b" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-16 sm:py-24" style={{ background: "#ffffff" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4 uppercase tracking-wider" style={{ background: "rgba(16,184,169,0.1)", color: "#10b8a9" }}>
              What We Provide
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3 sm:mb-4" style={{ color: "#0f1923" }}>
              See What We Provide
              <br />
              <span style={{ color: "#10b8a9" }}>to Keep You Healthy</span>
            </h2>
            <p className="text-base sm:text-lg max-w-xl mx-auto px-4" style={{ color: "#585858" }}>
              From digital prescriptions to smart appointments — MediMate handles it all.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map(({ icon, title, description }, i) => (
              <div
                key={title}
                className="group p-5 sm:p-6 rounded-2xl sm:rounded-3xl transition-all duration-300 hover:-translate-y-1 cursor-default"
                style={{
                  background: i % 3 === 0 ? "linear-gradient(135deg, #0f1923, #1a2f3f)" : "white",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 30px rgba(16,184,169,0.15)"; e.currentTarget.style.borderColor = "rgba(16,184,169,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
              >
                <div
                  className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl mb-3 sm:mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: "rgba(16,184,169,0.15)" }}
                >
                  {icon}
                </div>
                <h3 className="text-base sm:text-lg font-bold mb-1.5 sm:mb-2" style={{ color: i % 3 === 0 ? "white" : "#0f1923" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: i % 3 === 0 ? "#94a3b8" : "#585858" }}>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-16 sm:py-24 px-4 sm:px-6" style={{ background: "#f8fafc" }}>
        <div
          className="max-w-4xl mx-auto rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0f1923, #0f2a2a)", boxShadow: "0 30px 80px rgba(16,184,169,0.2)", border: "1px solid rgba(16,184,169,0.2)" }}
        >
          <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #10b8a9, transparent)", transform: "translate(30%, -30%)" }} />
          <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #10b8a9, transparent)", transform: "translate(-30%, 30%)" }} />
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3 sm:mb-4 tracking-tight">
            Ready to Modernize
            <br />
            <span style={{ color: "#10b8a9" }}>Your Clinic?</span>
          </h2>
          <p className="text-base sm:text-lg mb-6 sm:mb-8 max-w-xl mx-auto px-2" style={{ color: "#94a3b8" }}>
            Join doctors already using MediMate to save time, reduce errors, and deliver better care.
          </p>
          <button
            onClick={() => navigate("/signup")}
            className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 hover:scale-105 text-white"
            style={{ background: "linear-gradient(135deg, #10b8a9, #0d9488)", boxShadow: "0 8px 30px rgba(16,184,169,0.4)" }}
          >
            Create Your Free Account →
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" style={{ background: "#0f1923", color: "#94a3b8" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 sm:gap-10">
            {/* Brand column */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src={logo} alt="MediMate Logo" className="h-8 w-auto brightness-0 invert" />
              </div>
              <p className="text-sm leading-relaxed mb-5" style={{ color: "#64748b" }}>
                The modern clinic management platform built for doctors who care about their patients.
              </p>
              <div className="flex gap-3">
                {["𝕏", "in", "✉"].map((icon, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs cursor-pointer transition-all"
                    style={{ background: "#1e293b", color: "#94a3b8" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#10b8a9"; e.currentTarget.style.color = "white"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#1e293b"; e.currentTarget.style.color = "#94a3b8"; }}
                  >
                    {icon}
                  </div>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="text-sm font-semibold mb-4" style={{ color: "#f1f5f9" }}>{category}</h4>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm transition-colors"
                        style={{ color: "#64748b" }}
                        onMouseEnter={e => e.target.style.color = "#10b8a9"}
                        onMouseLeave={e => e.target.style.color = "#64748b"}
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Newsletter */}
          <div className="mt-10 sm:mt-12 p-5 sm:p-6 rounded-2xl" style={{ background: "#1e293b", border: "1px solid rgba(16,184,169,0.2)" }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold mb-1" style={{ color: "#f1f5f9" }}>Stay updated with MediMate</h4>
                <p className="text-xs" style={{ color: "#64748b" }}>Get the latest features and updates delivered to your inbox.</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 sm:w-56 px-4 py-2 rounded-xl text-sm outline-none"
                  style={{ background: "#0f1923", border: "1px solid rgba(16,184,169,0.2)", color: "#f1f5f9" }}
                />
                <button
                  className="px-4 py-2 rounded-xl text-white text-sm font-semibold whitespace-nowrap transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #10b8a9, #0d9488)" }}
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid #1e293b" }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-center sm:text-left" style={{ color: "#475569" }}>
              © 2026 MediMate. All rights reserved. Built for doctors who care.
            </p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-xs transition-colors"
                  style={{ color: "#475569" }}
                  onMouseEnter={e => e.target.style.color = "#10b8a9"}
                  onMouseLeave={e => e.target.style.color = "#475569"}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}