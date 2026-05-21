import type { AuthHeroVariant } from "../layout/AuthLayout";

interface Props {
  variant: AuthHeroVariant;
}

/** Ambient background for the form panel — map dots + soft gradients */
export function AuthFormDecor({ variant }: Props) {
  return (
    <div className="auth-panel-decor" aria-hidden data-variant={variant}>
      <div className="auth-panel-orb auth-panel-orb--1" />
      <div className="auth-panel-orb auth-panel-orb--2" />
      <div className="auth-panel-grid" />
      <div className="auth-panel-map-dots">
        {[
          { t: "12%", l: "78%", d: "0s" },
          { t: "28%", l: "88%", d: "0.8s" },
          { t: "45%", l: "72%", d: "1.6s" },
          { t: "62%", l: "92%", d: "0.4s" },
          { t: "75%", l: "68%", d: "1.2s" },
          { t: "18%", l: "62%", d: "2s" },
        ].map((dot, i) => (
          <span
            key={i}
            className="auth-panel-dot"
            style={{ top: dot.t, left: dot.l, animationDelay: dot.d }}
          />
        ))}
      </div>
    </div>
  );
}
