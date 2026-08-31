import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Stethoscope,
  HeartPulse,
  Pill,
  BadgeCheck,
  ShieldCheck,
  Zap,
  ArrowRight,
  Building2,
  Hospital,
  Menu,
  Sparkles,
  ChevronDown,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import "./booking.css";
import MedalertoLogo from "./Logo";
import { GlassBar, MobileDrawer } from "./Nav";
import {
  Button,
  Badge,
  Card,
  Avatar,
  Reveal,
  EmptyState,
  DoctorCardSkeleton,
  StarRating,
} from "./ui";
import { cn } from "./cn";
import { layout, gradient } from "./theme";
import { DOCTORS, SPECIALIZATIONS, PATIENT } from "./mockData";

const SORTS = [
  { id: "recommended", label: "Recommended" },
  { id: "rating", label: "Rating: high to low" },
  { id: "experience", label: "Most experienced" },
  { id: "fee-low", label: "Fee: low to high" },
  { id: "fee-high", label: "Fee: high to low" },
];

/* ── Doctor card ──────────────────────────────────────────────────────────── */
function DoctorCard({ doctor, index }) {
  const navigate = useNavigate();
  const fee = doctor.onlineBookingFee || 0;
  const clinic = doctor.clinics?.[0];
  const hospital = doctor.hospitals?.[0];

  return (
    <Reveal delay={Math.min(index, 5) * 70} className="h-full">
      <div
        className="group flex h-full cursor-pointer flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_24px_rgba(124,58,237,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.015] hover:border-violet-300/70 hover:shadow-[0_22px_48px_-16px_rgba(124,58,237,0.3)] dark:border-slate-700/60 dark:bg-slate-800/50 dark:hover:border-violet-500/40"
        onClick={() => navigate(`/book/doctors/${doctor.id}`)}
        role="link"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate(`/book/doctors/${doctor.id}`);
          }
        }}
        aria-label={`View profile of ${doctor.title} ${doctor.fullName}`}
      >
        <div>
          {/* Header: avatar, identity, fee badge */}
          <div className="flex items-start gap-4">
            <Avatar name={doctor.fullName} size="lg" online />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {doctor.title} {doctor.fullName}
                </h3>
                <BadgeCheck
                  size={17}
                  className="shrink-0 text-sky-500"
                  aria-label="PMDC verified"
                />
              </div>
              <p className="mt-0.5 text-xs font-bold text-violet-600 dark:text-violet-400">
                {doctor.specialization}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {doctor.yearsOfExperience} yrs exp • {doctor.primaryDegree}
              </p>
            </div>
            {fee > 0 && (
              <span className="shrink-0 rounded-xl bg-violet-100/80 px-3 py-1.5 text-right dark:bg-violet-500/15">
                <span className="block text-[10px] font-extrabold uppercase tracking-wide text-violet-500 dark:text-violet-400">
                  Online Fee
                </span>
                <span className="block text-sm font-black text-violet-700 dark:text-violet-300">
                  Rs {fee.toLocaleString()}
                </span>
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="mt-3 flex items-center gap-1.5">
            <StarRating value={doctor.avgRating} />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {doctor.avgRating.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400">({doctor.reviewCount})</span>
          </div>

          {/* Locations */}
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 dark:border-slate-700/50">
            {clinic && (
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-md bg-teal-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
                  <Building2 size={11} /> Clinic
                </span>
                <span className="truncate font-medium text-slate-600 dark:text-slate-300">
                  {clinic.name}
                </span>
              </div>
            )}
            {hospital && (
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                  <Hospital size={11} /> Hospital
                </span>
                <span className="truncate font-medium text-slate-600 dark:text-slate-300">
                  {hospital.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-5">
          <div
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-white transition-all duration-300 group-hover:shadow-[0_10px_28px_-8px_rgba(124,58,237,0.6)]",
              gradient.brand
            )}
          >
            View Profile & Book
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Doctors list page
 * ──────────────────────────────────────────────────────────────────────────── */
export default function DoctorsPage() {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [sort, setSort] = useState("recommended");
  const [drawer, setDrawer] = useState(false);

  /* Simulated fetch → shows themed skeletons on first paint. */
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 750);
    return () => clearTimeout(t);
  }, []);

  const results = useMemo(() => {
    let list = [...DOCTORS];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (d) =>
          d.fullName.toLowerCase().includes(q) ||
          d.specialization.toLowerCase().includes(q) ||
          d.clinics.some((c) => c.name.toLowerCase().includes(q)) ||
          d.hospitals.some((h) => h.name.toLowerCase().includes(q))
      );
    }
    if (specialization) {
      list = list.filter((d) => d.specialization === specialization);
    }
    switch (sort) {
      case "rating":
        list.sort((a, b) => b.avgRating - a.avgRating);
        break;
      case "experience":
        list.sort((a, b) => b.yearsOfExperience - a.yearsOfExperience);
        break;
      case "fee-low":
        list.sort((a, b) => a.onlineBookingFee - b.onlineBookingFee);
        break;
      case "fee-high":
        list.sort((a, b) => b.onlineBookingFee - a.onlineBookingFee);
        break;
      default:
        list.sort((a, b) => b.reviewCount - a.reviewCount);
    }
    return list;
  }, [query, specialization, sort]);

  const clearFilters = () => {
    setQuery("");
    setSpecialization("");
  };

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <GlassBar>
        <Link to="/" className="shrink-0" aria-label="MedAlerto home">
          <MedalertoLogo />
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/book/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:border-violet-500/50"
          >
            <SlidersHorizontal size={14} /> My Appointments
          </Link>
          <div className="flex items-center gap-2.5">
            <Avatar name={PATIENT.name} size="sm" online />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {PATIENT.name}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDrawer(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/70 text-slate-600 transition hover:text-violet-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 md:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </GlassBar>

      <MobileDrawer open={drawer} onClose={() => setDrawer(false)} label="Menu">
        <nav className="flex flex-col gap-1">
          <Link
            to="/book/dashboard"
            onClick={() => setDrawer(false)}
            className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            My Appointments
          </Link>
          <Link
            to="/"
            onClick={() => setDrawer(false)}
            className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            MedAlerto Home
          </Link>
        </nav>
      </MobileDrawer>

      {/* ── Hero search section ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden text-white">
        <div className={cn("absolute inset-0", gradient.brand)} />
        <div className="ma-medical-pattern absolute inset-0 opacity-30" />
        <div className="ma-pulse absolute -left-20 top-0 h-80 w-80 rounded-full bg-violet-400/25 blur-3xl" />
        <div className="ma-pulse absolute -right-10 top-10 h-72 w-72 rounded-full bg-indigo-400/25 blur-3xl" style={{ animationDelay: "1.4s" }} />
        <div className="ma-pulse absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-teal-300/15 blur-3xl" style={{ animationDelay: "2.6s" }} />

        <Stethoscope className="ma-float absolute left-[6%] top-16 h-11 w-11 text-white/20" aria-hidden="true" />
        <HeartPulse className="ma-float absolute right-[7%] top-24 h-9 w-9 text-white/20" style={{ animationDelay: "1.8s" }} aria-hidden="true" />
        <Pill className="ma-float absolute bottom-16 right-[16%] h-8 w-8 text-white/15" style={{ animationDelay: "3.2s" }} aria-hidden="true" />

        <div className={cn(layout.container, "relative py-14 text-center sm:py-20")}>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-bold text-indigo-100 backdrop-blur-sm">
              <Sparkles size={14} className="text-amber-300" />
              Find & Book Certified Medical Specialists
            </span>

            <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Consult Top Doctors{" "}
              <span className="text-indigo-300">Online</span>{" "}
              <span className="text-slate-400">&</span>{" "}
              <span className="text-teal-300">In-Clinic</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm font-medium text-indigo-100/85 sm:text-base">
              Search verified specialists, compare availability, review online booking fees, and schedule your appointment instantly.
            </p>
          </Reveal>

          {/* Search bar */}
          <Reveal delay={120}>
            <form
              onSubmit={(e) => e.preventDefault()}
              role="search"
              className="ma-glass mx-auto mt-8 flex max-w-3xl flex-col gap-2 rounded-[2rem] p-2 sm:h-16 sm:flex-row sm:items-center sm:rounded-full"
            >
              <div className="relative flex-1">
                <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search doctor by name, clinic, or hospital..."
                  aria-label="Search doctors"
                  className="h-12 w-full rounded-full bg-transparent pl-12 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none sm:h-full"
                />
              </div>
              <div className="hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-600" />
              <div className="relative sm:w-56">
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  aria-label="Filter by specialization"
                  className="h-12 w-full cursor-pointer appearance-none rounded-full bg-transparent pl-5 pr-8 text-sm font-semibold text-slate-700 outline-none dark:text-slate-200 sm:h-full"
                >
                  <option value="" className="text-slate-700 dark:bg-slate-800">
                    All Specializations
                  </option>
                  {SPECIALIZATIONS.map((s) => (
                    <option key={s} value={s} className="text-slate-700 dark:bg-slate-800">
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <button
                type="submit"
                className={cn(
                  "ma-btn-glow inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold text-white sm:h-full",
                  gradient.accent
                )}
              >
                <Search size={16} /> Search
              </button>
            </form>
          </Reveal>
        </div>
      </section>

      {/* ── Results ──────────────────────────────────────────────────────── */}
      <main className={cn(layout.container, "pb-20")}>
        {/* Filter bar */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5 dark:border-slate-800">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              Available Doctors
              <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-extrabold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                {results.length}
              </span>
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Showing verified medical specialists ready for online appointment booking
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-4 text-xs font-semibold text-slate-500 sm:flex dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-500" /> PMDC Verified
              </span>
              <span className="flex items-center gap-1.5">
                <Zap size={15} className="text-violet-500" /> Instant Slots
              </span>
            </div>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort doctors"
                className="appearance-none rounded-full border border-slate-200 bg-white py-2 pl-4 pr-9 text-xs font-bold text-slate-600 outline-none transition focus:border-violet-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Specialization quick-filter chips */}
        <div className="ma-scroll-fade ma-no-scrollbar mt-4 flex items-center gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setSpecialization("")}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all",
              !specialization
                ? "bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-md shadow-violet-500/30"
                : "border border-slate-200 bg-white text-slate-600 hover:border-violet-300 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
            )}
          >
            All
          </button>
          {SPECIALIZATIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpecialization(s === specialization ? "" : s)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all",
                specialization === s
                  ? "bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-md shadow-violet-500/30"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-violet-300 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Grid / skeleton / empty */}
        <div className="mt-6">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <DoctorCardSkeleton key={i} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="No doctors match your search"
              text="We couldn't find any specialist matching your terms. Try a different name, clinic, or specialization."
              action={
                <Button onClick={clearFilters}>
                  <SlidersHorizontal size={15} /> Clear filters
                </Button>
              }
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((doc, i) => (
                <DoctorCard key={doc.id} doctor={doc} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Trust strip */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-semibold text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1.5">
            <BadgeCheck size={15} className="text-sky-500" /> All doctors PMDC verified
          </span>
          <span className="flex items-center gap-1.5">
            <Star size={14} className="fill-amber-400 text-amber-400" /> Real patient reviews
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={15} className="text-emerald-500" /> Secure payments
          </span>
          <span className="flex items-center gap-1.5">
            <Zap size={14} className="text-violet-500" /> Book in under 60 seconds
          </span>
        </div>
      </main>
    </div>
  );
}
