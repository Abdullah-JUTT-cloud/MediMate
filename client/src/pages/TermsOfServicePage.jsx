import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-extrabold mb-4 text-left">Terms of Service</h1>
          <p className="text-xl text-[var(--color-text-secondary)] mb-12 text-left leading-relaxed">
            By using MediMate, you agree to these simple terms.
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">Clinical Responsibility</h2>
              <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed">
                Doctors are solely responsible for the prescriptions they create and the medical advice they provide. MediMate is a tool to assist in clinic management and does not make medical decisions or provide clinical advice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Proper Use of Platform</h2>
              <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed">
                You agree to use the platform for its intended purpose of clinic management. Any unauthorized use, including attempting to breach security or gain unauthorized access to clinical data, will result in immediate termination of your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Account Responsibility</h2>
              <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed">
                You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. Please notify us immediately if you suspect any unauthorized access to your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Limitation of Liability</h2>
              <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed">
                MediMate is provided "as is" without any warranties. While we strive for 100% uptime and data accuracy, we are not liable for any losses or damages resulting from your use of the platform.
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
