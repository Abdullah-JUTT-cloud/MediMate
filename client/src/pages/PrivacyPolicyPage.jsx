import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-extrabold mb-4 text-left">Privacy Policy</h1>
          <p className="text-xl text-[var(--color-text-secondary)] mb-12 text-left leading-relaxed">
            We value the trust you place in us for handling clinical and patient data. This policy outlines how we handle your information.
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">What data is collected</h2>
              <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed">
                We collect information necessary to run your clinic, including doctor registration details, patient names and contact information, and digital prescriptions created on the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">How we use it</h2>
              <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed">
                Your data is only used to provide the services of MediMate. This includes generating PDFs, sending WhatsApp notifications on your behalf, and tracking clinic performance for your review.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">No third-party sharing</h2>
              <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed">
                We do not sell, trade, or share your clinical or patient data with any third parties for marketing purposes. Your patient lists and prescriptions belong to you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Security measures</h2>
              <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed">
                We use industry-standard encryption and security protocols to protect your data from unauthorized access. Our systems are regularly monitored for potential vulnerabilities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Your Control</h2>
              <p className="text-lg text-[var(--color-text-secondary)] mb-4">
                You have the right to access, update, and delete your account and associated data. If you have any concerns about your data, please contact our support team.
              </p>
            </section>
          </div>

          <div className="mt-12 text-sm text-[var(--color-text-secondary)] border-t pt-4">
            <p>Last updated: March 2026</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
