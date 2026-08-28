import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import usePatientAccountStore from "../../store/patientAccountStore";
import PatientAuthModal from "./PatientAuthModal";

/**
 * "My Appointments" header button for the public booking portal.
 *
 *  - Patient token/session exists  → navigates directly to /book/dashboard.
 *  - Not authenticated             → opens the Patient Login/Signup modal
 *    (instead of redirecting to a dead route, which previously dropped the
 *    patient out of the booking flow).
 *
 * `from` is passed to the modal so that after signing in via the modal the
 * patient lands where the spec says (the dashboard) unless a different
 * destination is requested.
 */
export default function MyAppointmentsButton({ from = "/book/dashboard" }) {
  const navigate = useNavigate();
  const patient = usePatientAccountStore((s) => s.patient);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const isAuthenticated = Boolean(patient?._id || patient?.email);

  const handleClick = () => {
    if (isAuthenticated) {
      navigate("/book/dashboard");
    } else {
      setAuthModalOpen(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label="My Appointments"
        title={isAuthenticated ? "My Appointments" : "Sign in to view your appointments"}
        className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 px-2.5 py-2 sm:px-3.5 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700 transition"
      >
        <Calendar size={14} />
        {/* Icon-only on the narrowest phones so the header never overflows */}
        <span className="hidden sm:inline">My Appointments</span>
      </button>
      <PatientAuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} from={from} />
    </>
  );
}
