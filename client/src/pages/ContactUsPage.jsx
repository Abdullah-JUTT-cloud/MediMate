import {
  ArrowUpRight,
  Check,
  Clock3,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const channels = [
  {
    title: "General inquiries",
    description: "Product questions, clinic demos, and onboarding requests.",
    label: "hello@medalerto.me",
    href: "mailto:hello@medalerto.me",
    icon: Mail,
    actionIcon: ArrowUpRight,
    actionClass:
      "bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 font-bold px-4 py-2 rounded-xl text-xs hover:underline inline-flex items-center gap-1.5",
  },
  {
    title: "Support & technical help",
    description: "Account, usage, billing, and technical assistance.",
    label: "support@medalerto.me",
    href: "mailto:support@medalerto.me",
    icon: Mail,
    actionIcon: ArrowUpRight,
    actionClass:
      "bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 font-bold px-4 py-2 rounded-xl text-xs hover:underline inline-flex items-center gap-1.5",
  },
  {
    title: "Direct phone calls",
    description: "Call us for urgent clinic-side operational concerns.",
    label: "+92 321 4194045",
    href: "tel:+923214194045",
    icon: Phone,
    actionIcon: Phone,
    actionClass:
      "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 font-bold px-4 py-2 rounded-xl text-xs hover:border-teal-500 inline-flex items-center gap-1.5",
  },
  {
    title: "WhatsApp support",
    description: "Chat with our team for quick setup and usage guidance.",
    label: "+92 321 4194045",
    href: "https://wa.me/923214194045",
    icon: MessageCircle,
    actionIcon: MessageCircle,
    actionClass:
      "bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md inline-flex items-center gap-2 transition-all",
    external: true,
  },
];

const notes = [
  "Include clinic name and registered email",
  "Share screenshots for faster troubleshooting",
];

export default function ContactUsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <Navbar />

      <main className="px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <header className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-[11px] font-bold tracking-[0.16em] text-teal-800 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-200">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-600 dark:bg-teal-400" />
              </span>
              DIRECT CLINIC SUPPORT
            </div>
            <h1 className="mt-5 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
              Talk to the MedAlerto team.
            </h1>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-700 dark:text-slate-300">
              If you need product guidance, clinic onboarding, or technical assistance, we respond with direct help.
            </p>
          </header>

          <section aria-label="Contact channels" className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
            {channels.map((channel) => {
              const Icon = channel.icon;
              const ActionIcon = channel.actionIcon;
              return (
                <article
                  key={channel.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-teal-500/40 dark:border-slate-800 dark:bg-slate-900"
                >
                  <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                    <Icon className="h-5 w-5 text-teal-700 dark:text-teal-300" aria-hidden="true" />
                    {channel.title}
                  </h2>
                  <p className="mb-4 text-xs font-medium leading-5 text-slate-600 dark:text-slate-300">
                    {channel.description}
                  </p>
                  <a
                    href={channel.href}
                    target={channel.external ? "_blank" : undefined}
                    rel={channel.external ? "noopener noreferrer" : undefined}
                    className={channel.actionClass}
                    aria-label={`${channel.title}: ${channel.label}`}
                  >
                    <ActionIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    {channel.label}
                  </a>
                </article>
              );
            })}
          </section>

          <section className="mt-8 grid gap-5 md:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 text-base font-bold text-slate-900 dark:text-white">Before you reach out</h2>
              <ul className="space-y-3">
                {notes.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs font-semibold leading-5 text-slate-700 dark:text-slate-300">
                    <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" aria-hidden="true">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-900 to-teal-950 p-6 text-white shadow-md">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-white">
                <Clock3 className="h-5 w-5 text-teal-300" aria-hidden="true" />
                Business hours
              </h2>
              <span className="mb-1 block text-xs font-semibold text-slate-200">
                Monday – Friday: 9:00 AM – 6:00 PM (PKT)
              </span>
              <span className="block text-xs font-semibold text-slate-200">
                Saturday: 10:00 AM – 3:00 PM (PKT)
              </span>
            </article>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
