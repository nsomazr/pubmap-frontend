import { ArrowLeft, Map } from "lucide-react";
import { Link } from "react-router-dom";
import { AuthFormDecor } from "../auth/AuthFormDecor";
import { AuthHeroScene } from "../auth/AuthHeroScene";
import { AuthMobileBrand } from "../auth/AuthMobileBrand";
import { greGradientPremium } from "../../lib/greTheme";
import { BrandMark } from "../brand/BrandMark";

export type AuthHeroVariant = "login" | "register" | "onboarding";

const heroCopy: Record<AuthHeroVariant, { headline: string; tagline: string }> = {
  register: {
    headline: "Share discoveries.\nMap impact globally.",
    tagline: "Join researchers publishing geolocated work, joining forums, and building collaborations.",
  },
  login: {
    headline: "Welcome back.",
    tagline: "Continue managing publications, discussions, and your network on GRE.",
  },
  onboarding: {
    headline: "Almost there.",
    tagline: "Complete your profile so others can find and trust your work on the map.",
  },
};

interface Props {
  variant?: AuthHeroVariant;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showBackToMap?: boolean;
}

export function AuthLayout({
  variant = "register",
  title,
  subtitle,
  children,
  footer,
  showBackToMap = true,
}: Props) {
  const hero = heroCopy[variant];
  const headlineLines = hero.headline.split("\n");

  return (
    <div className="auth-page flex min-h-[100dvh] w-full bg-[#f4f6fb]">
      {/* Left  -  brand & animation (desktop) */}
      <aside className="auth-hero relative hidden overflow-hidden lg:flex lg:w-[44%] lg:flex-col xl:w-[46%]">
        <div className={`absolute inset-0 ${greGradientPremium}`} />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
          aria-hidden
        />

        <div className="relative z-10 flex min-h-full flex-col px-10 py-10 xl:px-12 xl:py-12">
          <Link to="/" className="inline-flex w-fit items-center gap-3 text-white transition hover:opacity-90">
            <BrandMark symbol="full" variant="plain" size="md" className="!rounded-xl !bg-white/95 !p-1.5" />
            <div>
              <p className="text-sm font-semibold leading-tight">Global Research Exchange</p>
              <p className="text-[11px] text-white/55">Research worldwide</p>
            </div>
          </Link>

          <div className="flex flex-1 flex-col justify-center py-10">
            <div className="mb-10">
              <h2 className="text-[2rem] font-bold leading-[1.12] tracking-tight text-white xl:text-[2.25rem]">
                {headlineLines.map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/70">{hero.tagline}</p>
            </div>
            <AuthHeroScene variant={variant} />
          </div>
        </div>
      </aside>

      {/* Right  -  form panel */}
      <div className="auth-panel relative flex min-h-[100dvh] flex-1 flex-col bg-[#f4f6fb]">
        <AuthFormDecor variant={variant} />
        <AuthMobileBrand variant={variant} />

        <div className="auth-panel-body relative z-10 flex flex-1 flex-col">
          <div className="hidden items-center justify-between border-b border-slate-200/80 bg-white/80 px-8 py-4 backdrop-blur-sm lg:flex">
            <Link to="/" className="inline-flex items-center gap-2.5 text-sm text-slate-600 hover:text-brand-600">
              <BrandMark symbol="full" variant="light" size="sm" />
              <span className="font-semibold text-ink">Global Research Exchange</span>
            </Link>
            {showBackToMap && (
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-brand-50 hover:text-brand-700"
              >
                <Map className="h-3.5 w-3.5" />
                Research map
              </Link>
            )}
          </div>

          <div className="flex flex-1 flex-col justify-center px-5 py-8 sm:px-10 lg:px-14 lg:py-12 xl:px-20">
            <div className="mx-auto w-full max-w-[400px] animate-fade-up">
              <header className="auth-panel-header mb-6 lg:mb-8">
                <h1 className="text-[1.75rem] font-bold tracking-tight text-ink">{title}</h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{subtitle}</p>
              </header>

              <div className="auth-form-shell">{children}</div>

              {footer && <div className="auth-panel-footer mt-6">{footer}</div>}

              {showBackToMap && (
                <Link to="/" className="auth-panel-map-cta mt-6 lg:hidden">
                  <Map className="h-4 w-4 text-brand-600" />
                  <span>Explore the research map</span>
                  <ArrowLeft className="ml-auto h-4 w-4 rotate-180 text-slate-400" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
