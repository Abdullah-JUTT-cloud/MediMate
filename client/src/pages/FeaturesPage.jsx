import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const features = [
  {
    title: "Digital Prescriptions & WhatsApp Delivery",
    problem: "Handwritten prescriptions are easily lost, illegible, or damaged.",
    solution: "Create clear digital prescriptions and send them instantly to your patient's WhatsApp as a professional PDF."
  },
  {
    title: "Complete Patient History Tracking",
    problem: "Reviewing past treatments from paper files is slow and often incomplete.",
    solution: "Access every past visit, prescription, and note in seconds. Make informed decisions based on the full clinical picture."
  },
  {
    title: "Doctor-Controlled Medicine Alternatives",
    problem: "Patients often call back when a specific brand is out of stock at the pharmacy.",
    solution: "The system suggests alternatives with the same salt composition, allowing you to guide the patient without a second consult."
  },
  {
    title: "Smart Appointment Scheduling",
    problem: "No-shows and double-bookings disrupt your clinic flow.",
    solution: "Schedule appointments with automatic WhatsApp confirmations that keep patients informed and your schedule full."
  },
  {
    title: "One-Click Emergency Cancellations",
    problem: "Unexpected emergencies leave patients waiting and frustrated at your clinic.",
    solution: "Cancel a range of appointments instantly. The system automatically notifies all affected patients via WhatsApp."
  },
  {
    title: "Basic Earnings & Clinic Tracking",
    problem: "Calculating daily or monthly revenue manually is tedious and error-prone.",
    solution: "Track your earnings and patient volume automatically. Get a clear view of your clinic's performance without any extra paperwork."
  }
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-extrabold mb-4">Core Features</h1>
          <p className="text-xl text-[var(--color-text-secondary)] mb-12">
            Tools designed to solve the daily frustrations of running a busy clinic.
          </p>

          <div className="grid gap-12">
            {features.map((f, index) => (
              <section key={index} className="border-b border-[var(--color-border)] pb-8 last:border-0">
                <h2 className="text-2xl font-bold mb-3">{f.title}</h2>
                <p className="text-[var(--color-text-secondary)] mb-2">
                  <span className="font-semibold text-[var(--color-text-primary)]">The Problem:</span> {f.problem}
                </p>
                <p className="text-[var(--color-text-secondary)]">
                  <span className="font-semibold text-[var(--color-primary)]">The Solution:</span> {f.solution}
                </p>
              </section>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
