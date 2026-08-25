import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const featureGroups = [
  {
    title: "Consultation & Prescription",
    items: [
      "Digital prescriptions with clear dosage and instructions",
      "Clinic-branded PDF generation for every prescription",
      "Instant prescription sharing via WhatsApp",
      "Salt-composition medicine alternatives",
      "Follow-up note capture during consultation",
      "Structured consultation notes for continuity",
    ],
  },
  {
    title: "Patients & Medical Records",
    items: [
      "Centralized patient profiles",
      "Visit timeline and prescription history",
      "Search patients by key details",
      "Allergy and treatment context visibility",
      "Organized consultation context retention",
      "Safer record retrieval without paper dependency",
    ],
  },
  {
    title: "Appointments & Follow-ups",
    items: [
      "Appointment booking and rescheduling",
      "Follow-up scheduling in the same workflow",
      "Automatic reminder messaging",
      "Emergency appointment handling",
      "Calendar visibility for daily load planning",
      "Reduced no-shows through automated communication",
    ],
  },
  {
    title: "Communication",
    items: [
      "WhatsApp prescription delivery",
      "Automatic appointment reminder messaging",
      "Emergency schedule-change communication",
      "Support ticket updates",
      "Patient portal chat coming soon",
      "Follow-up communication tools in progress",
    ],
  },
  {
    title: "Clinic Operations & Insights",
    items: [
      "Dashboard for appointments, patients, and activity",
      "Operational insights and reporting",
      "Revenue and billing visibility",
      "Notifications for key workflow updates",
      "Issue ticket and support center workflow",
      "Support chat with status tracking",
    ],
  },
  {
    title: "Admin, Security & Control",
    items: [
      "Admin verification and account management",
      "Role-aware access handling",
      "Secure authentication and session controls",
      "File upload safeguards for attachments",
      "Data handling controls and policy-ready structure",
      "Scalable setup for independent and small-clinic teams",
    ],
  },
];

const outcomes = [
  "Less manual admin work every day",
  "Fewer prescription and follow-up errors",
  "Stronger continuity between patient visits",
  "Faster front-desk and doctor coordination",
  "Higher communication reliability with patients",
  "Better operational visibility for clinic growth",
];

export default function FeaturesPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-24 h-80 w-80 rounded-[60%_40%_35%_65%/55%_35%_65%_45%] bg-[var(--color-accent)]/60 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-56 h-96 w-96 rounded-[48%_52%_39%_61%/48%_34%_66%_52%] bg-[var(--color-primary)]/10 blur-3xl" />
      <Navbar />

      <main className="relative z-10 px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <section className="overflow-hidden rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-8 shadow-[0_15px_50px_-10px_rgba(0,0,0,0.05)] sm:p-12 pb-6 sm:pb-8">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">Product Suite</p>
                <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight sm:text-6xl">
                  All <span className="text-[var(--color-primary)]">core workflows</span> your clinic needs in one <span className="text-[var(--color-primary)]">system</span>.
                </h1>
                <p className="mt-6 text-lg leading-relaxed text-[var(--color-text-secondary)]">
                  MedAlerto is built for independent doctors, specialists, and small clinics. It combines prescription workflow, records,
                  appointments, and support operations without enterprise complexity.
                </p>
                
                <button 
                  onClick={() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="mt-8 rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)] px-8 py-3.5 text-sm font-bold text-[var(--color-on-primary)] shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-float)]"
                >
                  See It In Action
                </button>

                <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-[var(--color-border)]/50 pt-10">
                  {[
                    { label: "Digital Prescriptions", icon: <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
                    { label: "Smart Appointments", icon: <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
                    { label: "Patient Records", icon: <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /> },
                    { label: "Real-time Chat", icon: <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /> },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-[11px] font-bold text-[var(--color-text-secondary)]">
                      <svg className="h-4 w-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        {item.icon}
                      </svg>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="hidden lg:block relative">
                <div className="aspect-[4/3.5] rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-soft)]/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden p-3 transition-transform duration-500 hover:scale-[1.01]">
                  <div className="h-full w-full rounded-2xl bg-white shadow-2xl flex flex-col border border-[var(--color-border)]/50">
                    {/* Top Bar Strip */}
                    <div className="h-10 w-full bg-[#0D2B3E] flex items-center justify-between px-4 shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                          <div className="h-2 w-2 rounded-full bg-red-400/80" />
                          <div className="h-2 w-2 rounded-full bg-yellow-400/80" />
                          <div className="h-2 w-2 rounded-full bg-green-400/80" />
                        </div>
                        <span className="ml-2 font-heading text-[10px] font-bold tracking-wider text-white">MedAlerto</span>
                      </div>
                      <div className="h-6 w-32 rounded-md bg-white/10 px-2 flex items-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-white/30" />
                      </div>
                      <div className="h-6 w-6 rounded-full bg-white/20 border border-white/10" />
                    </div>
                    
                    <div className="flex-1 flex overflow-hidden">
                      {/* Left Sidebar */}
                      <div className="w-10 bg-[#0D2B3E] flex flex-col items-center py-4 gap-4 border-r border-white/5">
                        {[
                          { icon: <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zm-11 11h7v7H3v-7zm11 0h7v7h-7v-7z" />, active: true },
                          { icon: <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0V7.5M21 18.75V7.5" /> },
                          { icon: <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /> },
                          { icon: <path d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /> },
                          { icon: <path d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09-2.06 0-3.99.21-5.83.57 1.08 3.59 4.17 6.18 7.92 6.18 3.08 0 5.77-1.7 7.21-4.22a8.13 8.13 0 01-5.18-2.44h-.03z" /> }
                        ].map((item, i) => (
                          <div key={i} className={`h-6 w-6 rounded-md flex items-center justify-center transition-colors ${item.active ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20' : 'text-white/40 hover:text-white/70'}`}>
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              {item.icon}
                            </svg>
                          </div>
                        ))}
                      </div>

                      <div className="flex-1 p-5 overflow-hidden">
                        {/* Stat Cards */}
                        <div className="grid grid-cols-3 gap-3 mb-8">
                          {[
                            { label: "Appt", value: "12", icon: <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0V7.5M21 18.75V7.5" />, trend: "12%" },
                            { label: "Patients", value: "47", icon: <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />, trend: "8%" },
                            { label: "Rx", value: "9", icon: <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />, trend: "5%" }
                          ].map(stat => (
                            <div key={stat.label} className="p-3 rounded-xl bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/10 text-left relative overflow-hidden group">
                              <div className="flex justify-between items-start mb-1">
                                <svg className="h-3 w-3 text-[var(--color-primary)]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  {stat.icon}
                                </svg>
                              </div>
                              <p className="text-lg font-bold text-[var(--color-primary)] leading-none">{stat.value}</p>
                              <div className="mt-1 flex items-center gap-1">
                                <svg className="h-2 w-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                  <path d="M5 15l7-7 7 7" />
                                </svg>
                                <span className="text-[7px] font-bold text-green-600">{stat.trend}</span>
                              </div>
                              <p className="mt-1 text-[8px] font-bold text-[var(--color-text-secondary)]/60 leading-tight truncate">{stat.label}</p>
                            </div>
                          ))}
                        </div>
                        
                        {/* Appointments List */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Upcoming Schedule</p>
                            <div className="h-1 w-12 bg-[var(--color-bg-soft)] rounded-full" />
                          </div>
                          {[
                            { name: "John Cooper", time: "10:30 AM", type: "General Checkup" },
                            { name: "Sarah Miller", time: "11:15 AM", type: "Follow-up" },
                            { name: "Robert Fox", time: "12:00 PM", type: "Consultation" }
                          ].map((patient, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl border-l-2 border-l-[var(--color-primary)] border-t border-r border-b border-[var(--color-border)]/50 bg-white shadow-sm transition-colors hover:bg-[var(--color-bg-soft)]/30">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                  {patient.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-[var(--color-text-primary)]">{patient.name}</p>
                                  <p className="text-[9px] text-[var(--color-text-secondary)]/70">{patient.type} • {patient.time}</p>
                                </div>
                              </div>
                              <span className="px-2 py-1 rounded-full bg-[var(--color-primary)] text-[8px] font-bold text-white shadow-sm shadow-[var(--color-primary)]/20">Confirmed</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="relative mt-20 overflow-hidden rounded-4xl border-2 border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/10 p-8 shadow-xl sm:p-12">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--color-secondary)]/10 blur-3xl" />
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-secondary)] text-white shadow-lg shadow-[var(--color-secondary)]/30">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-[var(--color-secondary)]/10 px-3 py-1 border border-[var(--color-secondary)]/20">
                    <svg className="h-3.5 w-3.5 text-[var(--color-secondary)]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-secondary)]">Critical Feature</span>
                  </div>
                </div>
                <h2 className="mt-5 font-heading text-3xl font-semibold">Emergency Bulk Appointment Cancel</h2>
                <p className="mt-4 text-base leading-relaxed text-[var(--color-text-secondary)]">
                  In emergencies, doctors can cancel a selected range of appointments in one action. MedAlerto then sends automated updates to affected patients quickly, reducing front-desk pressure and communication delays.
                </p>
              </div>
              
              <div className="relative">
                <div className="flex flex-col gap-4">
                  {[
                    { label: "Appointments selected", color: "bg-[var(--color-primary)]/20 text-[var(--color-primary)]" },
                    { label: "Cancelled", color: "bg-[var(--color-primary)] text-white" },
                    { label: "Patients notified", color: "bg-[var(--color-primary)]/20 text-[var(--color-primary)]" }
                  ].map((step, i) => (
                    <div key={step.label} className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold shadow-sm ${step.color}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 rounded-2xl border border-[var(--color-primary)]/20 bg-white/40 p-3 text-sm font-bold text-[var(--color-text-primary)]">
                        {step.label}
                      </div>
                      {i < 2 && (
                        <div className="hidden sm:block">
                          <svg className="h-5 w-5 text-[var(--color-primary)]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="mt-20 h-px w-full bg-[#E5E7EB]" />

          <section id="features-section" className="mt-20 grid gap-8 lg:grid-cols-2">
            {[
              { ...featureGroups[0], icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /> }, // Document (Consultation)
              { ...featureGroups[1], icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v.75c0 .621.504 1.125 1.125 1.125h6.75c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125H3.375A1.125 1.125 0 012.25 18.75V7.125z" /> }, // Folder (Medical Records)
              { ...featureGroups[2], icon: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0V7.5M21 18.75V7.5m-13.5 6h.008v.008H7.5V13.5zm3 0h.008v.008h-.008V13.5zm3 0h.008v.008h-.008V13.5zm3 0h.008v.008h-.008V13.5zm-9 3h.008v.008H7.5v-.008zm3 0h.008v.008h-.008v-.008zm3 0h.008v.008h-.008v-.008z" /> }, // Calendar (Appointments)
              { ...featureGroups[3], icon: <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /> }, // Chat Bubble (Communication)
              { ...featureGroups[4], icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /> }, // Bar Chart (Clinic Operations)
              { ...featureGroups[5], icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751A11.959 11.959 0 0112 2.714z" /> } // Shield (Admin & Security)
            ]
.map((group) => (
              // Fix inconsistent feature-card heights by stretching every card to fill its grid track.
              <article key={group.title} className="group h-full rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.08)]">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    {group.icon}
                  </svg>
                  <h2 className="font-heading text-2xl font-semibold text-[var(--color-text-primary)] transition-colors group-hover:text-[var(--color-primary)]">{group.title}</h2>
                </div>
                <ul className="mt-8 space-y-5">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-start gap-4 text-sm font-medium leading-relaxed text-[var(--color-text-primary)]/90">
                      <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </section>

          <div className="mt-20 h-px w-full bg-[#E5E7EB]" />

          <section className="mt-20 rounded-4xl border border-[var(--color-border)]/70 bg-[var(--color-card)]/95 p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.04)] sm:p-12">
            <h2 className="font-heading text-3xl font-semibold text-[var(--color-text-primary)]">Operational impact</h2>
            <p className="mt-3 text-[var(--color-text-secondary)]">Measurable improvements for your clinical workspace.</p>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[
                { text: outcomes[0], icon: <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
                { text: outcomes[1], icon: <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
                { text: outcomes[2], icon: <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /> },
                { text: outcomes[3], icon: <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /> },
                { text: outcomes[4], icon: <path d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /> },
                { text: outcomes[5], icon: <><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></> }
              ].map((item) => (
                <div key={item.text} className="flex h-full items-center gap-4 rounded-3xl border border-[var(--color-primary)]/15 bg-[var(--color-primary)]/5 p-5 text-sm font-bold text-[var(--color-text-primary)] transition-all duration-300 hover:scale-[1.03] hover:border-[var(--color-primary)]/40 hover:bg-white hover:shadow-md cursor-default">
                  {/* Fix uneven outcome rows by giving every impact card the same full-height footprint. */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <svg className="h-5 w-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      {item.icon}
                    </svg>
                  </div>
                  {item.text}
                </div>
              ))}
            </div>
          </section>

          <div className="mt-20 flex flex-wrap justify-center gap-x-12 gap-y-6 px-4">
            {[
              "500+ prescriptions written",
              "Zero paper dependency",
              "Built for independent clinics"
            ].map((stat) => (
              <div key={stat} className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                <span className="text-sm font-bold uppercase tracking-widest text-[var(--color-primary)]">{stat}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
