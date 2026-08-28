import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import MyAppointmentsButton from "../../components/booking/MyAppointmentsButton";
import {
  Search,
  Stethoscope,
  Star,
  CheckCircle2,
  Calendar,
  Building2,
  ArrowRight,
  Filter,
  UserCheck,
  ShieldCheck,
  Clock,
  Sparkles,
} from "lucide-react";

const SPECIALIZATIONS = [
  "General Physician",
  "Cardiologist",
  "Dermatologist",
  "Pediatrician",
  "Gynecologist",
  "Orthopedic",
  "Neurologist",
  "Psychiatrist",
  "ENT",
  "Ophthalmologist",
  "Urologist",
  "Oncologist",
  "Endocrinologist",
];

function StarRating({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          className={`${
            s <= Math.round(value)
              ? "text-amber-400 fill-amber-400"
              : "text-slate-200 dark:text-zinc-700 fill-slate-100 dark:fill-zinc-800"
          }`}
        />
      ))}
    </div>
  );
}

function DoctorAvatar({ profilePicUrl, fullName }) {
  const [imgError, setImgError] = useState(false);
  const isValidUrl = Boolean(
    profilePicUrl &&
      typeof profilePicUrl === "string" &&
      (profilePicUrl.startsWith("http://") || profilePicUrl.startsWith("https://") || profilePicUrl.startsWith("/"))
  );

  return (
    <div className="relative w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center justify-center text-xl shrink-0 overflow-hidden border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
      {isValidUrl && !imgError ? (
        <img
          src={profilePicUrl}
          alt={fullName || "Doctor"}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="uppercase tracking-wider font-extrabold">{fullName?.charAt(0) || "D"}</span>
      )}
      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full" />
    </div>
  );
}

export default function DoctorSearchPage() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ name: "", specialization: "", page: 1 });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.name) params.set("name", filters.name);
        if (filters.specialization) params.set("specialization", filters.specialization);
        params.set("page", filters.page);
        params.set("limit", "12");
        const { data } = await axios.get(`/public/doctors?${params}`);
        setDoctors(data.doctors || []);
        setPagination(data.pagination || { total: 0, pages: 1, page: 1 });
      } catch {
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters]);

  const handleSearch = (e) => {
    setFilters((p) => ({ ...p, [e.target.name]: e.target.value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ name: "", specialization: "", page: 1 });
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-zinc-950 font-sans text-slate-800 dark:text-zinc-100 pb-20">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800">
        <div className="w-full max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              M
            </div>
            <div>
              <span className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">MedAlerto</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block -mt-1">
                Verified Doctors
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Authenticated → /book/dashboard; guest → Patient Login/Signup
                modal (never a dead route). */}
            <MyAppointmentsButton />
            <Link
              to="/book/login"
              className="text-xs font-bold text-slate-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 px-3.5 py-2 rounded-xl transition"
            >
              Sign In
            </Link>
            <Link
              to="/book/register"
              className="hidden min-[480px]:inline text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl shadow-sm shadow-indigo-500/20 transition hover:shadow-md"
            >
              Register Account
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white py-16 sm:py-20 px-4">
        {/* Background Ambient Lights */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden">
          <div className="absolute -top-24 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute top-12 right-1/4 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-indigo-200 text-xs font-bold mb-6">
            <Sparkles size={14} className="text-amber-400" />
            <span>Find & Book Certified Medical Specialists</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            Consult Top Doctors <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-indigo-200 to-teal-300">Online & In-Clinic</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto mb-10 font-medium">
            Search verified specialists, compare availability, review online booking fees, and schedule your appointment instantly.
          </p>

          {/* Search Box Form */}
          <div className="bg-white/10 dark:bg-zinc-900/60 backdrop-blur-xl p-3 sm:p-4 rounded-3xl border border-white/20 shadow-2xl max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-2.5">
              {/* Doctor Name Input */}
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  name="name"
                  placeholder="Search doctor by name, clinic, or hospital…"
                  value={filters.name}
                  onChange={handleSearch}
                  className="w-full pl-11 pr-4 py-3 bg-white text-slate-900 rounded-2xl text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                />
              </div>

              {/* Specialization Select */}
              <div className="relative sm:w-64">
                <Stethoscope size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  name="specialization"
                  value={filters.specialization}
                  onChange={handleSearch}
                  className="w-full pl-11 pr-8 py-3 bg-white text-slate-900 rounded-2xl text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-inner"
                >
                  <option value="">All Specializations</option>
                  {SPECIALIZATIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                  ▼
                </div>
              </div>

              {/* Clear Filters Button */}
              {(filters.name || filters.specialization) && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-3 bg-white/20 hover:bg-white/30 text-white rounded-2xl text-xs font-bold transition shrink-0"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area — fluid from 320px up */}
      <main className="w-full max-w-7xl mx-auto px-4 pt-10">
        {/* Results Header Info */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Available Doctors</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                {pagination.total}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Showing verified medical specialists ready for online appointment booking
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <ShieldCheck size={15} className="text-emerald-500" /> PMDC Verified
            </span>
            <span className="flex items-center gap-1">
              <Clock size={15} className="text-indigo-500" /> Instant Slots
            </span>
          </div>
        </div>

        {/* Doctor Grid or Skeleton */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200/80 dark:border-zinc-800 animate-pulse h-64 flex flex-col justify-between"
              >
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-zinc-800" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-1/2" />
                    <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-1/3" />
                  </div>
                </div>
                <div className="h-10 bg-slate-100 dark:bg-zinc-800 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : doctors.length === 0 ? (
          /* Empty State */
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-zinc-800 shadow-sm max-w-md mx-auto my-12">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 text-2xl">
              🔍
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No verified doctors found</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 mb-6">
              We couldn't find any doctor matching your search terms. Try searching for a different name or specialization.
            </p>
            <button
              onClick={clearFilters}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-md"
            >
              Clear Search Filters
            </button>
          </div>
        ) : (
          /* Doctor Cards Grid */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doc) => {
              const fee = doc.onlineBookingFee || doc.advanceBookingFee || 0;
              const hasClinics = doc.clinics && doc.clinics.length > 0;
              const hasHospitals = doc.hospitals && doc.hospitals.length > 0;

              return (
                <div
                  key={doc._id}
                  onClick={() => navigate(`/book/doctors/${doc._id}`)}
                  className="group bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-200/90 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:border-indigo-500/40 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Avatar & Info */}
                    <div className="flex items-start gap-4 mb-4">
                      <DoctorAvatar profilePicUrl={doc.profilePicUrl} fullName={doc.fullName} />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight truncate">
                            {doc.title ? `${doc.title} ` : "Dr. "}
                            {doc.fullName}
                          </h3>
                          <CheckCircle2 size={16} className="text-indigo-500 shrink-0" />
                        </div>

                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                          {doc.specialization || "General Physician"}
                        </p>

                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1">
                          <span>{doc.yearsOfExperience || 1} yrs exp</span>
                          {doc.primaryDegree && (
                            <>
                              <span>•</span>
                              <span className="truncate">{doc.primaryDegree}</span>
                            </>
                          )}
                        </p>

                        {/* Rating */}
                        {doc.reviewCount > 0 ? (
                          <div className="flex items-center gap-1.5 mt-2">
                            <StarRating value={doc.avgRating} />
                            <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300">
                              {Number(doc.avgRating).toFixed(1)} ({doc.reviewCount})
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 mt-2 text-[11px] text-slate-400 font-medium">
                            <Star size={12} className="text-slate-300 fill-slate-300" />
                            <span>No reviews yet</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Practice Locations Tag */}
                    <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-zinc-800/80 mb-4">
                      {hasClinics && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400 truncate">
                          <span className="px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-[10px] font-bold uppercase">
                            Clinic
                          </span>
                          <span className="truncate font-medium">{doc.clinics[0].name}</span>
                        </div>
                      )}
                      {hasHospitals && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400 truncate">
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase">
                            Hospital
                          </span>
                          <span className="truncate font-medium">{doc.hospitals[0].name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom: Fee & CTA */}
                  <div>
                    {fee > 0 ? (
                      <div className="mb-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl px-3.5 py-2.5 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wide">
                          Online Fee
                        </span>
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                          Rs {fee.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <div className="mb-3.5 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl px-3.5 py-2.5 text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                        Fee specified at clinic
                      </div>
                    )}

                    <div className="w-full flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                      <span>View Profile & Book</span>
                      <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {Array.from({ length: pagination.pages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setFilters((p) => ({ ...p, page: i + 1 }))}
                className={`w-10 h-10 rounded-2xl text-xs font-bold transition ${
                  i + 1 === filters.page
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                    : "bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
