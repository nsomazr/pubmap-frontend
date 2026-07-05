import { ArrowRight, BookOpen, Globe2, Mail, Map, MessageCircle, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { GreAdPlacement } from "../components/ads/GreAdSlot";
import { PublicPageLayout } from "../components/layout/PublicPageLayout";
import { PublicPageTabs } from "../components/layout/PublicPageTabs";
import { PublicSection } from "../components/layout/PublicSection";

const PILLARS = [
  {
    icon: Map,
    label: "Discover",
    text: "Find geolocated research on the global map.",
  },
  {
    icon: BookOpen,
    label: "Share",
    text: "Publish studies with lasting visibility on GRE.",
  },
  {
    icon: MessageCircle,
    label: "Connect",
    text: "Discuss papers, join forums, and meet peers.",
  },
];

const STEPS = [
  { title: "Add your research", text: "Publish with title, abstract, and map location." },
  { title: "Reach a global audience", text: "Your work stays visible on the map and directory." },
  { title: "Stay in the conversation", text: "Comments, forums, events, and messages." },
];

const CONTACT_CHANNELS = [
  {
    title: "Administrative",
    description: "Membership, partnerships, and general questions.",
    email: "admin@globalresearchexchange.com",
  },
  {
    title: "Technical support",
    description: "Accounts, bugs, and publishing help.",
    email: "support@globalresearchexchange.com",
  },
];

export function AboutPage() {
  const { pathname } = useLocation();
  const isContact = pathname.includes("contact");
  const title = isContact ? "Contact" : "About";

  return (
    <PublicPageLayout
      compactHero
      title={title}
      subtitle={
        isContact
          ? "Reach the GRE team by email."
          : "A global platform to publish, discover, and discuss research."
      }
      crumbs={[{ label: "Home", to: "/" }, { label: title }]}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <PublicPageTabs
          active={isContact ? "/contact" : "/about"}
          tabs={[
            { kind: "link", to: "/about", label: "About" },
            { kind: "link", to: "/contact", label: "Contact" },
          ]}
        />
        {!isContact && (
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            Open map
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {isContact ? (
        <div className="space-y-6">
          <PublicSection title="How to reach us">
            <p className="text-sm leading-relaxed text-slate-600">
              Choose the channel that fits your question. We read every message and reply as soon as
              we can.
            </p>
          </PublicSection>

          <div className="grid gap-4 sm:grid-cols-2">
            {CONTACT_CHANNELS.map((channel) => (
              <a
                key={channel.email}
                href={`mailto:${channel.email}`}
                className="gre-interactive gre-public-card flex flex-col p-5 transition hover:border-brand-200"
              >
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Mail className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-ink">{channel.title}</h3>
                <p className="mt-1 flex-1 text-sm text-slate-500">{channel.description}</p>
                <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700">
                  {channel.email}
                  <ArrowRight className="h-3.5 w-3.5" />
                </p>
              </a>
            ))}
          </div>

          <PublicSection title="Browse first">
            <p className="mb-4 text-sm text-slate-600">
              Many answers are already in publications, forum topics, and event listings.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/forum"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:border-brand-200 hover:text-brand-700"
              >
                Forum
              </Link>
              <Link
                to="/events"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:border-brand-200 hover:text-brand-700"
              >
                Events
              </Link>
              <Link
                to="/"
                className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Research map
              </Link>
            </div>
          </PublicSection>
        </div>
      ) : (
        <div className="space-y-6">
          <PublicSection title="Global Research Exchange">
            <p className="text-sm leading-relaxed text-slate-600">
              GRE helps researchers publish geolocated studies, join discussions, and build
              visibility beyond traditional conferences and journals. Your work stays on the map,
              open to dialogue and collaboration.
            </p>
          </PublicSection>

          <div className="grid gap-3 sm:grid-cols-3">
            {PILLARS.map(({ icon: Icon, label, text }) => (
              <article key={label} className="gre-public-card p-4 sm:p-5">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-brand-700">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-ink">{label}</h3>
                <p className="mt-1.5 text-sm text-slate-500">{text}</p>
              </article>
            ))}
          </div>

          <PublicSection title="How it works">
            <ol className="space-y-4">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-ink">{step.title}</h3>
                    <p className="mt-0.5 text-sm text-slate-500">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </PublicSection>

          <PublicSection title="Why GRE">
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex gap-3">
                <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <span>Global visibility for published studies and recommendations.</span>
              </li>
              <li className="flex gap-3">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <span>Forums, events, and discussions that keep research active over time.</span>
              </li>
              <li className="flex gap-3">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <span>Comments and threads under publications, not just static uploads.</span>
              </li>
            </ul>
          </PublicSection>

          <GreAdPlacement
            placement="institutional_banner"
            limit={2}
            variant="banner"
            rotate
          />

          <PublicSection title="Get started">
            <p className="mb-4 text-sm text-slate-600">
              Join researchers, academics, and field teams publishing on GRE.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Create account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contact"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand-200 hover:text-brand-700"
              >
                Contact us
              </Link>
            </div>
          </PublicSection>
        </div>
      )}
    </PublicPageLayout>
  );
}
