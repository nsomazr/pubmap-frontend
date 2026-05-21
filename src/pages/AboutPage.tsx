import {
  ArrowRight,
  BookOpen,
  Globe2,
  Handshake,
  Lightbulb,
  Mail,
  Map,
  MessageCircle,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { BrandMark } from "../components/brand/BrandMark";
import { PublicPageLayout } from "../components/layout/PublicPageLayout";

const PILLARS = [
  {
    icon: Map,
    label: "Discover",
    text: "Explore research on an interactive global map.",
  },
  {
    icon: BookOpen,
    label: "Share",
    text: "Publish studies with location, context, and lasting visibility.",
  },
  {
    icon: MessageCircle,
    label: "Connect",
    text: "Forum, events, and messaging built for researchers.",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Add your research",
    text: "Create a publication with title, summary, and study location on the map.",
  },
  {
    step: "2",
    title: "Reach a global audience",
    text: "Your work appears on GRE's map and publication directory for others to find.",
  },
  {
    step: "3",
    title: "Stay in the conversation",
    text: "Engage through forum discussions, events, and direct messages with peers.",
  },
];

const BENEFITS = [
  {
    icon: Globe2,
    title: "Global visibility",
    text: "Go beyond conference posters and journal paywalls. Show work where people actually browse.",
  },
  {
    icon: Sparkles,
    title: "Lasting impact",
    text: "Publications remain discoverable as living resources, not one-off presentations.",
  },
  {
    icon: Users,
    title: "Built for collaboration",
    text: "Find researchers in your field, region, or institution through shared topics and places.",
  },
  {
    icon: Handshake,
    title: "Flexible & open",
    text: "Share on your schedule. No venue bookings or travel required to participate.",
  },
];

const AUDIENCE = [
  "Researchers",
  "Graduate students",
  "Faculty & labs",
  "Policy & NGO teams",
  "Industry R&D",
  "Field scientists",
];

const CONTACT_CHANNELS = [
  {
    title: "Administrative inquiries",
    description: "Membership, policies, partnerships, and general questions.",
    email: "admin@globalresearchexchange.com",
    color: "border-brand-200 bg-brand-50/50",
    iconColor: "bg-brand-600 text-white",
  },
  {
    title: "Technical support",
    description: "Account access, bugs, or help publishing on the platform.",
    email: "support@globalresearchexchange.com",
    color: "border-teal-200 bg-teal-50/50",
    iconColor: "bg-teal-600 text-white",
  },
];

function PageTabs() {
  const { pathname } = useLocation();
  const isContact = pathname.includes("contact");

  return (
    <nav
      className="inline-flex rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200/80"
      aria-label="About and contact"
    >
      <Link
        to="/about"
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
          !isContact
            ? "bg-white text-brand-700 shadow-sm"
            : "text-slate-600 hover:text-ink"
        }`}
      >
        About GRE
      </Link>
      <Link
        to="/contact"
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
          isContact
            ? "bg-white text-brand-700 shadow-sm"
            : "text-slate-600 hover:text-ink"
        }`}
      >
        Contact
      </Link>
    </nav>
  );
}

export function AboutPage() {
  const { pathname } = useLocation();
  const isContact = pathname.includes("contact");
  const title = isContact ? "Contact Us" : "About Us";

  return (
    <PublicPageLayout
      compactHero
      accent={isContact ? "teal" : "blue"}
      badge={isContact ? "Get in touch" : "Global Research Exchange"}
      title={title}
      subtitle={
        isContact
          ? "Questions about GRE? Pick the team that fits. We reply as soon as we can."
          : "One place to map, share, and discuss research with a worldwide community."
      }
      crumbs={[{ label: "Home", to: "/" }, { label: title }]}
    >
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <PageTabs />
        {!isContact && (
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Explore the map
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {isContact ? (
        <div className="space-y-8">
          <section className="gre-card p-6 sm:p-8">
            <p className="text-base leading-relaxed text-slate-600">
              Whether you need help with your account, want to partner with GRE, or have
              feedback. We read every message. Choose a channel below and we will route it to
              the right team.
            </p>
          </section>

          <div className="grid gap-5 sm:grid-cols-2">
            {CONTACT_CHANNELS.map((ch) => (
              <a
                key={ch.email}
                href={`mailto:${ch.email}`}
                className={`group flex flex-col rounded-2xl border p-6 transition hover:-translate-y-0.5 hover:shadow-md ${ch.color}`}
              >
                <div
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${ch.iconColor}`}
                >
                  <Mail className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-ink">{ch.title}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">
                  {ch.description}
                </p>
                <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 group-hover:gap-3">
                  {ch.email}
                  <ArrowRight className="h-4 w-4" />
                </p>
              </a>
            ))}
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center sm:p-8">
            <p className="font-medium text-ink">Prefer browsing first?</p>
            <p className="mt-1 text-sm text-slate-500">
              Many answers live in publications, forum topics, and event listings.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                to="/forum"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:text-brand-700"
              >
                Forum
              </Link>
              <Link
                to="/events"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:text-brand-700"
              >
                Events
              </Link>
              <Link
                to="/"
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Research map
              </Link>
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-10">
          {/* At-a-glance — single entry card instead of overlapping dark banner */}
          <section className="gre-card overflow-hidden p-0">
            <div className="border-b border-slate-100 bg-gradient-to-r from-brand-50 to-teal-50/80 px-6 py-5 sm:px-8">
              <div className="flex flex-wrap items-center gap-4">
                <BrandMark symbol="icon" variant="gradient" size="lg" />
                <div>
                  <h2 className="text-lg font-bold text-ink sm:text-xl">
                    What is Global Research Exchange?
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                    GRE is a map-first platform where researchers publish geolocated studies,
                    discover work worldwide, and collaborate through community tools.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {PILLARS.map(({ icon: Icon, label, text }) => (
                <div key={label} className="px-6 py-5 sm:px-5 sm:py-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="font-bold text-ink">{label}</p>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Mission — readable, not another full gradient block */}
          <section className="flex gap-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 sm:flex">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-600">
                Our mission
              </p>
              <h2 className="mt-1 text-xl font-bold text-ink sm:text-2xl">
                Research without borders
              </h2>
              <p className="mt-3 max-w-3xl leading-relaxed text-slate-600">
                We help groundbreaking work travel further by placing it on a shared map,
                keeping it accessible over time, and connecting the people behind the ideas.
                GRE is built for discovery, dialogue, and real-world impact.
              </p>
            </div>
          </section>

          {/* How it works — scannable steps */}
          <section>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-ink sm:text-2xl">How it works</h2>
              <p className="mt-1 text-sm text-slate-500">
                Three steps from your desk to a global audience.
              </p>
            </div>
            <ol className="grid gap-4 sm:grid-cols-3">
              {STEPS.map(({ step, title: stepTitle, text }) => (
                <li
                  key={step}
                  className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full gre-gradient-bar text-sm font-bold text-white"
                    aria-hidden
                  >
                    {step}
                  </span>
                  <h3 className="mt-4 font-bold text-ink">{stepTitle}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{text}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Why different — concise contrast */}
          <section className="rounded-2xl border-l-4 border-brand-500 bg-white px-6 py-5 shadow-sm ring-1 ring-slate-200/80 sm:px-8 sm:py-6">
            <div className="flex gap-3">
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <div>
                <h2 className="font-bold text-ink">Why GRE is different</h2>
                <p className="mt-2 leading-relaxed text-slate-600">
                  Traditional sharing often ends when a conference closes or a paper is filed
                  away. On GRE, your research stays visible on the map, open to search,
                  discussion, and follow-up, so impact can grow after the first presentation.
                </p>
              </div>
            </div>
          </section>

          {/* Benefits grid */}
          <section>
            <h2 className="text-xl font-bold text-ink sm:text-2xl">What you gain</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {BENEFITS.map(({ icon: Icon, title: benefitTitle, text }) => (
                <article
                  key={benefitTitle}
                  className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand-200 hover:shadow-md"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-brand-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-ink">{benefitTitle}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Audience */}
          <section className="rounded-2xl bg-slate-50 px-6 py-6 ring-1 ring-slate-200/80 sm:px-8">
            <h2 className="font-bold text-ink">Who it is for</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Anyone who wants their work seen, understood, and discussed across borders, whether
              you are publishing your first study or leading a lab.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {AUDIENCE.map((role) => (
                <li
                  key={role}
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
                >
                  {role}
                </li>
              ))}
            </ul>
          </section>

          {/* CTA */}
          <section className="flex flex-col items-center gap-5 rounded-2xl gre-gradient-bar px-6 py-10 text-center text-white sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="text-lg font-bold sm:text-xl">Ready to put your research on the map?</p>
              <p className="mt-1 text-sm text-white/80">
                Create a free account and publish your first study in minutes.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap justify-center gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-700 shadow-lg transition hover:scale-[1.02]"
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/25"
              >
                Contact us
              </Link>
            </div>
          </section>
        </div>
      )}
    </PublicPageLayout>
  );
}
