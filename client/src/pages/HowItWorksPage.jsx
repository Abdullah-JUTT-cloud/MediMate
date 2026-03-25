import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const steps = [
  {
    step: "Step 1",
    title: "Add or search for a patient",
    description: "Start by entering a patient's name or contact number. If they've visited before, their entire history is instantly available for review."
  },
  {
    step: "Step 2",
    title: "Create a digital prescription",
    description: "Select medicines, dosages, and notes in one clean interface. The system handles the layout and formatting for you."
  },
  {
    step: "Step 3",
    title: "Send via WhatsApp",
    description: "Click once to generate a professional PDF and send it directly to the patient's WhatsApp. No printing required."
  },
  {
    step: "Step 4",
    title: "Schedule the next appointment",
    description: "Book follow-up visits immediately while the patient is still with you. The schedule is updated in real-time."
  },
  {
    step: "Step 5",
    title: "Automatic confirmations",
    description: "The system sends reminder messages to your patients, reducing missed appointments and keeping your day on track."
  }
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-extrabold mb-4">How It Works</h1>
          <p className="text-xl text-[var(--color-text-secondary)] mb-12 text-left">
            Simplified workflows designed for busy clinical environments.
          </p>

          <div className="space-y-16">
            {steps.map((s, index) => (
              <section key={index} className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-2xl font-bold">
                  {index + 1}
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3">{s.title}</h2>
                  <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
