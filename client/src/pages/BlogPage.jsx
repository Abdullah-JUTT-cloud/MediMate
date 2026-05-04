import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const blogs = [
  {
    id: 1,
    title:
      "The Future of Patient Management: How Digital Health Records Transform Clinic Efficiency",
    metaDescription:
      "Discover how MedAlerto's patient management system digitizes medical history, blood groups, and past visits to streamline your clinic's operations.",
    keywords: [
      "patient management software",
      "digital health records",
      "clinic efficiency",
      "medical history tracking",
      "electronic health records (EHR)",
    ],
    content: `In the fast-paced environment of a busy clinic, managing paper files and physical registers is no longer sustainable. Finding a patient's medical history from a visit three years ago shouldn't take ten minutes of digging through filing cabinets. This is where a modern patient management software steps in.

With MedAlerto, maintaining a complete digital record for every patient is effortless. The system allows healthcare providers to securely store essential details such as medical history, blood group, contact information, and specific clinic or hospital affiliations. But the real power lies in the timeline—every past visit, diagnosis, and prescription is linked directly to the patient's profile.

### Why Digital Patient Management Matters:

*   **Instant Access**: Retrieve a patient's entire medical history in seconds, allowing for more informed clinical decisions.
*   **Reduced Errors**: Eliminating illegible handwriting and misplaced files drastically reduces the chance of medical errors.
*   **Enhanced Patient Experience**: When you remember a patient's history without asking them to repeat it, it builds trust and rapport.

By transitioning to digital health records with MedAlerto, clinics not only improve their operational efficiency but also elevate the standard of care they provide. Say goodbye to paper trails and hello to a streamlined, organized future.`,
    category: "Management",
    readTime: "4 min read",
    date: "May 4, 2026",
  },
  {
    id: 2,
    title:
      "Stop Double-Booking: The Power of Smart Appointment Scheduling for Clinics",
    metaDescription:
      "Learn how MedAlerto's smart appointment booking auto-generates slots, prevents double-booking, and tracks patient statuses effortlessly.",
    keywords: [
      "smart appointment booking",
      "clinic scheduling software",
      "prevent double-booking",
      "patient scheduling",
      "medical appointment system",
    ],
    content: `Double-booking a time slot is a surefire way to create a crowded waiting room, stressed staff, and unhappy patients. Traditional appointment diaries are prone to human error, but modern clinic scheduling software is designed to eliminate these headaches entirely.

MedAlerto introduces a smart appointment booking system that takes the guesswork out of scheduling. Based on the doctor's predefined clinic schedule and session durations, the system automatically generates available time slots. Once a slot is booked, it's instantly removed from availability, making double-booking mathematically impossible.

### Key Benefits of Smart Scheduling:

*   **Automated Availability**: The system knows your hours and only offers valid slots.
*   **Status Tracking at a Glance**: Instantly see which appointments are Confirmed, Completed, Cancelled, or No-shows.
*   **Streamlined Operations**: Front desk staff spend less time managing the calendar and more time assisting patients.

A well-managed calendar is the backbone of a successful practice. MedAlerto ensures your schedule is optimized, realistic, and stress-free, allowing you to focus on what matters most: patient care.`,
    category: "Scheduling",
    readTime: "3 min read",
    date: "May 3, 2026",
  },
  {
    id: 3,
    title: "Beyond Paper: The Clinical Benefits of Digital Checkup Records",
    metaDescription:
      "Explore how digital checkup records in MedAlerto capture diagnoses, clinical notes, and prescriptions for permanent, searchable medical histories.",
    keywords: [
      "digital checkup records",
      "electronic medical records",
      "clinical notes software",
      "digital prescriptions",
      "medical record keeping",
    ],
    content: `The clinical encounter is the core of medical practice, and documenting that encounter accurately is crucial. Relying on paper charts means vital clinical notes can be easily lost, damaged, or misinterpreted due to poor handwriting. Transitioning to digital checkup records ensures that every detail is captured securely and permanently.

MedAlerto provides a comprehensive interface to record every aspect of a patient visit. Doctors can digitally input diagnoses, detailed clinical notes, lab test orders, and specific patient advice. Furthermore, the system handles complex medication regimens, tracking medicine names, dosages, and durations clearly and concisely.

### Advantages of Going Digital with Checkups:

*   **Searchability**: Easily search past records for specific diagnoses or previously prescribed medications.
*   **Continuity of Care**: Having a clear, legible history of every visit ensures consistent and accurate follow-up care.
*   **Secure Storage**: Digital records are stored securely in the cloud, protected from physical damage or loss.

By utilizing MedAlerto's digital checkup records, doctors build a robust, accessible database of clinical knowledge for every patient, leading to better outcomes and a more organized practice.`,
    category: "Clinical",
    readTime: "5 min read",
    date: "May 2, 2026",
  },
  {
    id: 4,
    title:
      "Professionalism in Seconds: The Value of Auto-Generated Prescription PDFs",
    metaDescription:
      "See how MedAlerto automatically formats prescriptions into professional, cloud-stored PDFs ready for sharing or printing.",
    keywords: [
      "auto-generated prescriptions",
      "digital prescription software",
      "PDF medical prescriptions",
      "e-prescribing",
      "clinic management tools",
    ],
    content: `The traditional handwritten prescription is iconic, but it's also notorious for causing confusion at the pharmacy. In today's digital age, patients expect a more professional and legible format. Digital prescription software not only improves safety but also elevates the professional image of your clinic.

MedAlerto streamlines this process entirely with auto-generated prescription PDFs. Once a doctor completes a digital checkup record, the system instantly formats the medicines, dosages, lab tests, and advice into a clean, professional PDF document. This file is automatically stored securely in the cloud.

### Why Auto-Generated PDFs are a Game Changer:

*   **Zero Ambiguity**: Printed or digital PDFs eliminate the risk of pharmacists misreading medication names or dosages.
*   **Easy Sharing**: Prescriptions can be easily downloaded, printed at the desk, or shared digitally with the patient.
*   **Permanent Record**: Every generated PDF is saved to the patient's profile, making refills or historical reviews incredibly simple.

Providing a professional, clear prescription reflects the quality of care you provide. With MedAlerto, generating these documents takes zero extra effort, giving you the best of both worlds.`,
    category: "Technology",
    readTime: "3 min read",
    date: "May 1, 2026",
  },
  {
    id: 5,
    title:
      "Secure Doctor-Patient Chat: Bridging the Communication Gap in Healthcare",
    metaDescription:
      "Discover how MedAlerto's secure doctor-patient chat improves communication, allows safe image sharing, and enhances post-visit care.",
    keywords: [
      "secure medical chat",
      "doctor-patient communication",
      "HIPAA compliant messaging",
      "telehealth messaging",
      "patient engagement platform",
    ],
    content: `Good healthcare doesn't stop when the patient leaves the clinic. Often, patients have quick follow-up questions, need to share lab results, or simply require reassurance. Relying on personal phone numbers or unsecured messaging apps blurs professional boundaries and compromises privacy. A dedicated, secure medical chat system is the solution.

MedAlerto features a built-in Doctor-Patient Chat designed specifically for healthcare communication. Patients receive a private login, allowing them to communicate directly and securely with their doctor. The platform supports text messaging and secure image sharing—perfect for reviewing test results or monitoring visual symptoms.

### The Impact of Secure Messaging:

*   **Professional Boundaries**: Keep patient communication strictly within a secure, dedicated platform rather than your personal WhatsApp.
*   **Enhanced Patient Engagement**: Patients feel more connected and cared for when they have a direct, reliable line to their doctor.
*   **Efficient Follow-ups**: Resolve simple queries quickly without requiring the patient to book another physical appointment.

By integrating secure messaging into your practice management, MedAlerto helps you provide modern, responsive care while maintaining privacy and professional standards.`,
    category: "Communication",
    readTime: "4 min read",
    date: "April 30, 2026",
  },
  {
    id: 6,
    title: "Never Miss a Rupee: Streamlining Clinic Billing & Payment Tracking",
    metaDescription:
      "Learn how MedAlerto's billing tracker helps clinics log consultation fees, track paid/unpaid status, and maintain perfect financial records.",
    keywords: [
      "clinic billing software",
      "medical payment tracking",
      "doctor fee management",
      "healthcare billing solutions",
      "clinic financial tracking",
    ],
    content: `Managing finances in a busy clinic often involves a chaotic mix of cash drawers, paper receipts, and mental notes. When the day is done, reconciling the books can be a nightmare. Implementing reliable clinic billing software is essential to ensure that every consultation is accounted for and no revenue slips through the cracks.

MedAlerto simplifies this process by integrating billing and payment tracking directly into the checkup workflow. Every time a visit is recorded, doctors can log the consultation fee, specify the payment method (Cash, Card, or Online Transfer), and instantly mark it as Paid or Unpaid.

### The Financial Benefits for Your Practice:

*   **Clear Visibility**: A dedicated billing log allows you to view all transactions, making end-of-day reconciliation a breeze.
*   **Reduce Unpaid Dues**: Easily filter for 'Unpaid' visits to track outstanding balances and ensure you are compensated for your time.
*   **Audit-Ready Records**: Digital financial tracking means you always have an accurate, searchable history of your clinic's revenue.

Take control of your clinic's finances. With MedAlerto, billing becomes an integrated, effortless part of your daily routine rather than an end-of-day chore.`,
    category: "Finance",
    readTime: "4 min read",
    date: "April 29, 2026",
  },
  {
    id: 7,
    title:
      "Data-Driven Medicine: The Value of Clinical Insights & Analytics for Doctors",
    metaDescription:
      "Discover how MedAlerto's clinical analytics dashboard tracks top diseases, prescribed medicines, and patient retention for smarter practice management.",
    keywords: [
      "clinical analytics software",
      "medical practice insights",
      "healthcare data tracking",
      "patient retention metrics",
      "disease tracking software",
    ],
    content: `In modern healthcare, intuition alone isn't enough to grow a successful practice. Doctors need concrete data to understand their patient demographics, treatment efficacy, and operational bottlenecks. This is the domain of clinical analytics software.

MedAlerto features a powerful, automated analytics dashboard that turns your daily checkup records into actionable insights. The system tracks the diseases you treat most frequently, your most prescribed medications, and crucial patient flow metrics like new versus returning patients.

### How Clinical Insights Transform Your Practice:

*   **Identify Trends**: See month-over-month trends in disease frequency, helping you anticipate seasonal spikes (e.g., flu season) and manage inventory.
*   **Monitor Patient Retention**: Track "dormant patients" who haven't returned for follow-ups, allowing you to improve care continuity.
*   **Optimize Operations**: Analyze your peak days and hours to staff your clinic appropriately and reduce waiting times.

By leveraging MedAlerto's clinical analytics, you shift from reactive management to proactive strategy, ensuring your practice grows intelligently and sustainably.`,
    category: "Analytics",
    readTime: "5 min read",
    date: "April 28, 2026",
  },
  {
    id: 8,
    title: "Visualize Your Growth: Inside the Revenue Dashboard",
    metaDescription:
      "Explore MedAlerto's Revenue Dashboard to track daily earnings, project annual revenue, and analyze financial performance over time.",
    keywords: [
      "clinic revenue dashboard",
      "medical practice financial analytics",
      "doctor income tracking",
      "healthcare revenue projection",
      "clinic profitability",
    ],
    content: `While clinical excellence is the priority, a private medical practice is still a business. Understanding your financial health at a glance is vital for long-term success. Relying on monthly statements from an accountant means you're always looking backwards. A real-time clinic revenue dashboard puts financial control directly in your hands.

MedAlerto provides a dedicated financial analytics module—the Revenue Lab. This dashboard offers a comprehensive breakdown of your earnings: Today, This Week, This Month, and This Year. It goes beyond simple tracking by providing visual charts and future revenue projections based on your current performance.

### Why You Need Real-Time Financial Data:

*   **Track Growth Instantly**: See month-over-month percentage changes to know exactly if your practice is expanding.
*   **Understand Average Fees**: Track your average consultation fee over time to ensure your pricing strategy is effective.
*   **Identify Lost Revenue**: The system calculates potential revenue lost due to cancelled appointments or no-shows, highlighting areas for operational improvement.

MedAlerto's Revenue Dashboard transforms raw billing data into clear, visual financial intelligence, empowering you to make informed business decisions for your practice.`,
    category: "Finance",
    readTime: "4 min read",
    date: "April 27, 2026",
  },
  {
    id: 9,
    title:
      "Reduce No-Shows: The Impact of Automated Appointment Reminders via WhatsApp",
    metaDescription:
      "Learn how automated WhatsApp appointment reminders in MedAlerto reduce patient no-shows and improve clinic efficiency.",
    keywords: [
      "automated appointment reminders",
      "WhatsApp medical reminders",
      "reduce clinic no-shows",
      "patient reminder software",
      "medical scheduling automation",
    ],
    content: `Patient no-shows are one of the most frustrating and costly issues for any private practice. An empty slot means lost revenue and wasted time that could have been offered to someone else. While calling every patient is time-consuming for staff, automated appointment reminders offer a modern, hands-free solution.

MedAlerto tackles this problem head-on by integrating automated reminders directly through WhatsApp—the communication platform patients already use daily. The system's background jobs automatically detect upcoming appointments and send a timely message to the patient, ensuring they remember their slot.

### The Benefits of Automated Reminders:

*   **Drastically Reduce No-Shows**: A simple WhatsApp ping significantly increases the likelihood that a patient will arrive on time.
*   **Save Staff Time**: Free up your reception team from making hours of confirmation calls every day.
*   **Enhance Patient Experience**: Patients appreciate the professional courtesy of a reminder, improving their overall perception of your clinic.

Automation is the key to an efficient clinic. With MedAlerto's WhatsApp reminders, you maximize your schedule's efficiency without lifting a finger.`,
    category: "Automation",
    readTime: "3 min read",
    date: "April 26, 2026",
  },
  {
    id: 10,
    title:
      "Built for Doctors: Why Secure & Professional Practice Management Matters",
    metaDescription:
      "Discover how MedAlerto prioritizes security and professionalism with license verification and secure data storage for modern clinics.",
    keywords: [
      "secure clinic software",
      "HIPAA compliant practice management",
      "doctor verification platform",
      "safe medical data storage",
      "professional clinic tools",
    ],
    content: `When digitizing a medical practice, security and trust are non-negotiable. Patients trust you with their most sensitive health information, and you need a platform that treats that data with the highest level of security. Choosing a secure clinic software is the most important technology decision a doctor can make.

MedAlerto is built from the ground up with security and professionalism in mind. It is not an open marketplace; it is a professional tool. Every doctor on the platform goes through an admin verification process requiring their medical license (PMDC) credentials, ensuring the integrity of the network.

### Core Pillars of MedAlerto's Security:

*   **Verified Professionals Only**: Our strict onboarding pipeline ensures that only legitimate, licensed doctors use the platform.
*   **Data Protection**: Utilizing industry-standard security measures, including secure JWT authentication and encrypted data transmission, patient records are kept safe.
*   **Reliable Infrastructure**: Built on a robust tech stack (Node.js, Express, MongoDB), the platform is designed for high availability and performance.

Your practice's reputation relies on the security of your tools. MedAlerto provides a professional, verified, and secure environment, giving you—and your patients—complete peace of mind.`,
    category: "Security",
    readTime: "4 min read",
    date: "April 25, 2026",
  },
];

export default function BlogPage() {
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const CATEGORIES = useMemo(() => {
    const categories = Array.from(
      new Set(blogs.map((blog) => blog.category.toUpperCase()))
    );

    return ["ALL", ...categories];
  }, []);

  const filteredBlogs = useMemo(() => {
    if (selectedCategory === "ALL") return blogs;
    return blogs.filter((b) => b.category.toUpperCase() === selectedCategory);
  }, [selectedCategory]);

  const featured = blogs[0];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      {/* Background Blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-24 h-80 w-80 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[var(--color-accent)]/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-56 h-96 w-96 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[var(--color-primary)]/10 blur-3xl"
      />

      <Navbar />

      <main className="relative z-10 px-4 pb-12 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header Section: two-column with featured card */}
          <div className="mb-8">
            <div className="grid gap-8 md:grid-cols-2 items-center">
              <div>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]"
                >
                  MedAlerto Insights
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mt-4 font-heading text-4xl font-bold leading-tight sm:text-6xl"
                >
                  Clinic Excellence{" "}
                  <span className="text-[var(--color-primary)]">Blog</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--color-text-secondary)]"
                >
                  Practical workflows, clinical insights, and technology guides
                  to help you build a more efficient, patient-centered practice.
                </motion.p>
              </div>

              {/* Featured Card */}
              <div>
                <motion.article
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative flex flex-col rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-6 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${"badge-" + (featured.category || "").toLowerCase().replace(/\s+/g, "")}`}
                    >
                      {featured.category}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--color-text-secondary)]">
                      {featured.readTime}
                    </span>
                  </div>

                  <h3 className="font-heading text-2xl font-bold leading-snug text-[var(--color-text-primary)]">
                    {featured.title}
                  </h3>

                  <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)] single-line-ellipsis">
                    {featured.metaDescription}
                  </p>

                  <div className="mt-6">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedBlog(featured);
                      }}
                      className="text-[var(--color-primary)] font-bold"
                    >
                      Read Featured Post →
                    </a>
                  </div>
                </motion.article>
              </div>
            </div>

            {/* Category pills */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1 rounded-full text-sm font-bold tracking-wide transition-all ${selectedCategory === cat ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]" : "bg-transparent border border-[var(--color-border)] text-[var(--color-text-primary)]"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Blog Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredBlogs.map((blog, idx) => (
              <motion.article
                key={blog.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx }}
                className={`group relative flex flex-col rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-6 shadow-[0_10px_40px_-10px_rgba(93,112,82,0.12)] transition-all duration-300 hover:shadow-[0_20px_50px_-15px_rgba(93,112,82,0.18)] hover:-translate-y-1 ${idx === filteredBlogs.length - 1 && filteredBlogs.length % 3 === 1 ? "lg:col-span-3 md:col-span-2" : ""}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${"badge-" + (blog.category || "").toLowerCase().replace(/\s+/g, "")}`}
                  >
                    {blog.category}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--color-text-secondary)]">
                    {blog.readTime}
                  </span>
                </div>

                <h2 className="font-heading text-xl font-bold leading-snug text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors multi-line-clamp-3">
                  {blog.title}
                </h2>

                <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)] line-clamp-3">
                  {blog.metaDescription}
                </p>

                <div className="mt-auto pt-6 flex items-center justify-between border-t border-[var(--color-border)]/40">
                  <span className="text-[10px] text-[var(--color-text-secondary)]/70">
                    {blog.date}
                  </span>
                  <button
                    onClick={() => setSelectedBlog(blog)}
                    className="flex items-center gap-2 text-xs font-bold text-[var(--color-primary)] hover:gap-3 transition-all"
                  >
                    Read Full Article
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2.5 6H9.5M9.5 6L6.5 3M9.5 6L6.5 9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </motion.article>
            ))}
          </div>

          {/* Modal for Full Content */}
          <AnimatePresence>
            {selectedBlog && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--color-bg)]/80 backdrop-blur-md sm:p-8"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-4xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-2xl sm:p-12"
                >
                  <button
                    onClick={() => setSelectedBlog(null)}
                    className="absolute right-6 top-6 h-10 w-10 flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)] transition-all"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M15 5L5 15M5 5L15 15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  <div className="max-w-3xl mx-auto">
                    <span className="px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold uppercase tracking-wider">
                      {selectedBlog.category}
                    </span>
                    <h2 className="mt-6 font-heading text-3xl font-bold leading-tight sm:text-4xl">
                      {selectedBlog.title}
                    </h2>
                    <div className="mt-6 flex items-center gap-6 text-sm text-[var(--color-text-secondary)] border-b border-[var(--color-border)]/50 pb-8">
                      <span>{selectedBlog.date}</span>
                      <span className="h-1 w-1 rounded-full bg-[var(--color-border)]" />
                      <span>{selectedBlog.readTime}</span>
                    </div>

                    <div className="mt-8 prose prose-slate max-w-none">
                      {selectedBlog.content.split("\n\n").map((para, i) => {
                        if (para.startsWith("###")) {
                          return (
                            <h3
                              key={i}
                              className="font-heading text-2xl font-bold text-[var(--color-text-primary)] mt-12 mb-6"
                            >
                              {para.replace("###", "").trim()}
                            </h3>
                          );
                        }
                        if (para.startsWith("*")) {
                          return (
                            <ul key={i} className="space-y-4 my-8">
                              {para.split("\n").map((item, j) => (
                                <li
                                  key={j}
                                  className="flex items-start gap-3 leading-relaxed text-[var(--color-text-secondary)]"
                                >
                                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--color-primary)]" />
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: item.replace(
                                        /^\*\s*\*\*(.*?)\*\*:\s*/,
                                        '<strong class="text-[var(--color-text-primary)]">$1:</strong> ',
                                      ),
                                    }}
                                  />
                                </li>
                              ))}
                            </ul>
                          );
                        }
                        return (
                          <p
                            key={i}
                            className="text-lg leading-relaxed text-[var(--color-text-secondary)] mb-6"
                          >
                            {para}
                          </p>
                        );
                      })}
                    </div>

                    <div className="mt-16 pt-8 border-t border-[var(--color-border)]/50">
                      <p className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider mb-4">
                        Tags
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedBlog.keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-lg bg-[var(--color-bg-soft)] text-[var(--color-text-secondary)] text-xs font-mono"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}
