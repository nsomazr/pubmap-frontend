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
import { GreAdPlacement } from "../components/ads/GreAdSlot";
import { PublicPageLayout } from "../components/layout/PublicPageLayout";

const INTRO = {
  lead: "Welcome to the Global Research Exchange (GRE)",
  mission:
    "This is a transformative platform that redefines how research connects with the world. Our mission is to amplify the impact of groundbreaking research, foster collaboration, and build a dynamic global community of thinkers, creators, and problem-solvers.",
  living:
    "GRE offers a unique alternative to traditional research sharing. Through our platform, your work doesn't just reach an audience; it thrives. We ensure your research is more than a publication, it becomes a living, breathing resource enriched by global engagement. Think of your contributions as fine wine, growing richer with time, dialogue, and collaboration.",
};

const PILLARS = [
  {
    icon: Map,
    label: "Discover",
    text: "Explore geolocated research on an interactive global map.",
  },
  {
    icon: BookOpen,
    label: "Share",
    text: "Publish findings and recommendations with lasting visibility beyond conferences and journals.",
  },
  {
    icon: MessageCircle,
    label: "Connect",
    text: "Forums, events, and discussions where research evolves with the community.",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Add your research",
    text: "Create a publication with title, abstract, and study location on the map.",
  },
  {
    step: "2",
    title: "Reach a global audience",
    text: "Your work gains prolonged visibility on GRE's map and publication directory.",
  },
  {
    step: "3",
    title: "Stay in the conversation",
    text: "Engage through comments, forum discussions, events, and direct messages with peers.",
  },
];

const EXCEPTIONAL = [
  {
    icon: Globe2,
    title: "Global Visibility",
    text: "Showcase your research to a worldwide audience beyond the confines of conferences and journals.",
  },
  {
    icon: Sparkles,
    title: "Prolonged Impact",
    text: "Your findings remain accessible and relevant, fostering ongoing discussions and unlocking new opportunities for innovation.",
  },
  {
    icon: Users,
    title: "Collaborative Environment",
    text: "Join a vibrant community committed to solving real-world challenges. GRE is a hub where research evolves and relationships blossom.",
  },
  {
    icon: Handshake,
    title: "Flexibility & Convenience",
    text: "Forget the logistical hassles of traditional conferences. At GRE, every day is a chance to connect, share, and grow.",
  },
];

const MEMBER_BENEFITS = [
  {
    icon: Globe2,
    title: "Global Visibility",
    text: "Share your research findings and recommendations with a worldwide audience.",
  },
  {
    icon: MessageCircle,
    title: "Engage & Collaborate",
    text: "Connect with peers by commenting on and discussing submitted abstracts, fostering meaningful academic dialogues.",
  },
  {
    icon: BookOpen,
    title: "Specialized Forums",
    text: "Participate in forums tailored to various specializations, where you can exchange ideas with experts in your field.",
  },
  {
    icon: Lightbulb,
    title: "Resource Accessibility",
    text: "Discover valuable research materials, tools, and insights to enhance your work.",
  },
  {
    icon: Target,
    title: "Recognition",
    text: "Showcase your contributions and establish your presence in the academic and research community.",
  },
];

const AUDIENCE = [
  "Researchers",
  "Academics",
  "Industry experts",
  "Graduate students",
  "Policy & NGO teams",
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
          : "A transformative platform where research connects with the world."
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
          {/* At-a-glance  -  single entry card instead of overlapping dark banner */}
          <section className="gre-card overflow-hidden p-0">
            <div className="border-b border-slate-100 bg-gradient-to-r from-brand-50 to-teal-50/80 px-6 py-5 sm:px-8">
              <div className="flex flex-wrap items-center gap-4">
                <BrandMark symbol="icon" variant="gradient" size="lg" />
                <div>
                  <h2 className="text-lg font-bold text-ink sm:text-xl">{INTRO.lead}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base">
                    {INTRO.mission}
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

          {/* Living research */}
          <section className="flex gap-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 sm:flex">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-600">
                Research that grows richer
              </p>
              <h2 className="mt-1 text-xl font-bold text-ink sm:text-2xl">
                More than a publication
              </h2>
              <p className="mt-3 max-w-3xl leading-relaxed text-slate-600">{INTRO.living}</p>
            </div>
          </section>

          {/* How it works */}
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

          {/* What makes GRE exceptional */}
          <section className="rounded-2xl border-l-4 border-brand-500 bg-white px-6 py-5 shadow-sm ring-1 ring-slate-200/80 sm:px-8 sm:py-6">
            <div className="flex gap-3">
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <div className="w-full">
                <h2 className="font-bold text-ink">What makes GRE truly exceptional?</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {EXCEPTIONAL.map(({ icon: Icon, title: benefitTitle, text }) => (
                    <article
                      key={benefitTitle}
                      className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 ring-1 ring-slate-200/80">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="font-bold text-ink">{benefitTitle}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Member benefits */}
          <section>
            <h2 className="text-xl font-bold text-ink sm:text-2xl">
              Why being a GRE member matters
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
              As a member, you gain access to an array of benefits that empower you to make a real
              impact in the research community.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MEMBER_BENEFITS.map(({ icon: Icon, title: benefitTitle, text }) => (
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
            <p className="mt-5 max-w-3xl text-sm leading-relaxed text-slate-600">
              One of the unique benefits of GRE is the ability for members to add comments and engage
              in discussions under submitted abstracts. Much like fine wine that improves with age,
              these abstracts gain value and richness as insights from discussions and collaborations
              are incorporated.
            </p>
          </section>

          {/* Audience */}
          <section className="rounded-2xl bg-slate-50 px-6 py-6 ring-1 ring-slate-200/80 sm:px-8">
            <h2 className="font-bold text-ink">Who it is for</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Whether you&apos;re a researcher, academic, or industry expert, GRE is designed for
              you. It&apos;s more than a platform; it&apos;s a movement to reshape the future of
              research exchange, turning ideas into actions that impact the world.
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
          <GreAdPlacement
            placement="institutional_banner"
            limit={1}
            variant="banner"
            className="mb-8"
          />

          <section className="flex flex-col items-center gap-5 rounded-2xl gre-gradient-bar px-6 py-10 text-center text-white sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="text-lg font-bold sm:text-xl">
                Join us where boundaries dissolve and innovation knows no limits
              </p>
              <p className="mt-1 text-sm text-white/80">
                Together, we can create a better tomorrow, one idea at a time. Welcome to the GRE
                family, where your research thrives without boundaries.
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
