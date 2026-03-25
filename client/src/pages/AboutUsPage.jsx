import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-extrabold mb-4 text-left">About MediMate</h1>
          <p className="text-xl text-[var(--color-text-secondary)] mb-12 text-left leading-relaxed">
            We build tools that make clinic management simple, fast, and reliable.
          </p>

          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-bold mb-4">Why we built this</h2>
              <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed">
                Most clinical software is designed for large hospitals, making it over-engineered for independent doctors and medium-sized clinics. We saw doctors struggling with messy paper files, uncollected fees, and constant WhatsApp messages from patients who lost their physical prescriptions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Problems we're solving</h2>
              <ul className="list-disc list-inside space-y-3 text-lg text-[var(--color-text-secondary)]">
                <li>Inaccessible patient history during follow-ups.</li>
                <li>Manual, repetitive scheduling that leads to no-shows.</li>
                <li>Confusion over brand-specific medicine shortages.</li>
                <li>Paper-based prescriptions that are easy to lose or damage.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
              <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed">
                Our mission is to save doctors time and reduce confusion for patients. We focus on creating a clinical companion that works as fast as you do, without the fluff or unnecessary features.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Simplicity & Reliability</h2>
              <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed font-semibold">
                We believe software should help you work, not give you more work. Every button in MediMate exists for a reason, and we prioritize uptime and speed above everything else.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
