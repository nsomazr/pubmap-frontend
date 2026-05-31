import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { assets } from "../../lib/brand";
import { BrandMark } from "../brand/BrandMark";
import type { AuthHeroVariant } from "../layout/AuthLayout";

const LOCATIONS = ["Dar es Salaam", "Nairobi", "Accra", "Cape Town"];

const taglines: Record<AuthHeroVariant, string> = {
  login: "Welcome back to the research map.",
  register: "Join researchers worldwide.",
  onboarding: "One step to go live on the map.",
};

interface Props {
  variant: AuthHeroVariant;
}

export function AuthMobileBrand({ variant }: Props) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % LOCATIONS.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="auth-mobile-brand lg:hidden">
      <div className="auth-mobile-brand-bg" />
      <div className="relative px-5 pb-8 pt-6">
        <Link to="/" className="mx-auto flex w-fit flex-col items-center gap-3 text-center">
          <BrandMark symbol="full" variant="float" size="md" />
          <p className="text-xs font-medium text-white/60">Research worldwide</p>
        </Link>

        <p className="mt-5 text-center text-sm text-white/80">{taglines[variant]}</p>

        <div className="auth-mobile-mini-globe mx-auto mt-5">
          <div className="auth-mobile-mini-ring" />
          <div className="auth-mobile-mini-sweep" />
          <img src={assets.mapLogo} alt="" className="relative z-10 h-6 w-6 object-contain" />
        </div>

        <p className="mt-4 text-center text-xs text-white/50">
          Live from{" "}
          <span key={idx} className="font-semibold text-white">
            {LOCATIONS[idx]}
          </span>
        </p>
      </div>
    </div>
  );
}
