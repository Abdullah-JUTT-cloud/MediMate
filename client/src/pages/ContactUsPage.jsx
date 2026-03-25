import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ContactUsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-extrabold mb-4 text-left">Contact Us</h1>
          <p className="text-xl text-[var(--color-text-secondary)] mb-12 text-left leading-relaxed">
            Need help? Have a question about a feature? We're here to help you get the most out of MediMate.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-[var(--color-card)] border border-[var(--color-border)] p-8 rounded-2xl shadow-sm">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span>📧</span> Email Support
              </h2>
              <p className="text-[var(--color-text-secondary)] mb-6">
                Most doctors find email best for technical questions or account issues.
              </p>
              <a 
                href="mailto:support@medalerto.com" 
                className="text-[var(--color-primary)] font-bold text-lg hover:underline"
              >
                support@medalerto.com
              </a>
              <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
                Average response time: Within 4 hours.
              </p>
            </section>

            <section className="bg-[var(--color-card)] border border-[var(--color-border)] p-8 rounded-2xl shadow-sm">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span>💬</span> WhatsApp Support
              </h2>
              <p className="text-[var(--color-text-secondary)] mb-6">
                For quick questions or setup help, reach out to us on WhatsApp.
              </p>
              <a 
                href="https://wa.me/923001234567" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-[var(--color-success)] text-white px-6 py-3 rounded-xl font-bold inline-block hover:opacity-90 transition"
              >
                Chat on WhatsApp
              </a>
              <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
                Average response time: Instant (during business hours).
              </p>
            </section>
          </div>

          <div className="mt-12 text-center text-[var(--color-text-secondary)]">
            <p className="text-lg">
              We value your feedback. If you have any suggestions on how we can improve MediMate for your clinic, don't hesitate to reach out.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
