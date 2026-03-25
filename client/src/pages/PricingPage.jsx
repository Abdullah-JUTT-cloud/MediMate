import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold mb-4">Simple, transparent pricing</h1>
          <p className="text-xl text-[var(--color-text-secondary)] mb-12">
            No hidden fees. No complicated tiers. One plan for every doctor.
          </p>

          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-8 md:p-12 shadow-sm max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-2">Monthly Subscription</h2>
            <div className="flex items-baseline justify-center gap-1 mb-6">
              <span className="text-3xl font-bold">Rs.</span>
              <span className="text-6xl font-extrabold">4,999</span>
              <span className="text-[var(--color-text-secondary)] text-lg">PKR/month</span>
            </div>

            <div className="text-left space-y-4 mb-8">
              <h3 className="font-bold text-lg border-b pb-2">What you get:</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <span className="text-[var(--color-success)] text-xl">✓</span>
                  <span>Unlimited digital prescriptions</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[var(--color-success)] text-xl">✓</span>
                  <span>Unlimited patient records & history</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[var(--color-success)] text-xl">✓</span>
                  <span>WhatsApp delivery for all documents</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[var(--color-success)] text-xl">✓</span>
                  <span>Smart appointment scheduling</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[var(--color-success)] text-xl">✓</span>
                  <span>Emergency cancellation tool</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-[var(--color-success)] text-xl">✓</span>
                  <span>Practice insights & earnings tracking</span>
                </li>
              </ul>
            </div>

            <div className="text-left mb-8">
              <h3 className="font-bold text-lg mb-2">Who it is for:</h3>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                This plan is designed for independent practitioners and clinic owners who want to modernize their workflow without a massive upfront investment or technical headache.
              </p>
            </div>

            <div className="text-left">
              <h3 className="font-bold text-lg mb-2">Why it's worth it:</h3>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                MediMate saves you roughly 2-3 hours of administrative work every week. By reducing patient calls for lost prescriptions and automating appointment reminders, you get more time to focus on care.
              </p>
            </div>

            <button className="w-full mt-10 bg-[var(--color-primary)] text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition">
              Get Started Now
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
