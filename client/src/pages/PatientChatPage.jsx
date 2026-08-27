import { Clock, LogOut, MessageSquareOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import usePatientAuthStore from "../store/patientAuthStore";

export default function PatientChatPage() {
  const navigate = useNavigate();
  const { logout } = usePatientAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/patient-login");
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)] px-4 py-6 text-[var(--color-text-primary)]">
      <div className="mx-auto flex w-full max-w-5xl justify-end">
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-soft)]"
        >
          <LogOut size={16} strokeWidth={2.2} />
          Logout
        </button>
      </div>

      <main className="mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-5xl items-center justify-center">
        <div className="w-full max-w-xl rounded-4xl border border-[var(--color-border)] bg-[var(--color-card)]/95 p-8 text-center shadow-[0_10px_40px_-10px_rgba(93,112,82,0.18)] sm:p-10">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-3xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <MessageSquareOff size={28} strokeWidth={2.2} />
          </div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
            Patient Chat
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
            We are building this feature. Patient-doctor chat is coming soon.
          </p>
          <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-4 py-2 text-xs font-semibold text-[var(--color-text-secondary)]">
            <Clock size={14} strokeWidth={2.2} />
            Coming soon
          </div>
        </div>
      </main>
    </div>
  );
}
