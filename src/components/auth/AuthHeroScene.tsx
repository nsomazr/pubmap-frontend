import { BookOpen, MapPin, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { assets } from "../../lib/brand";
import type { AuthHeroVariant } from "../layout/AuthLayout";

const LOCATIONS = [
  "Dar es Salaam",
  "Nairobi",
  "Accra",
  "Cape Town",
  "Lagos",
  "Marrakech",
];

const FEATURES = [
  { icon: MapPin, label: "Map research" },
  { icon: MessageSquare, label: "Join forums" },
  { icon: BookOpen, label: "Share findings" },
];

/** Pins on the ring — angle in degrees */
const RING_PINS = [20, 95, 200, 285];

interface Props {
  variant: AuthHeroVariant;
}

export function AuthHeroScene({ variant }: Props) {
  const [locationIdx, setLocationIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setLocationIdx((i) => (i + 1) % LOCATIONS.length),
      2800
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`auth-visual auth-visual--${variant}`}>
      <div className="auth-visual-glow" aria-hidden />

      <div className="auth-visual-globe">
        <div className="auth-visual-ring auth-visual-ring--3" />
        <div className="auth-visual-ring auth-visual-ring--2" />
        <div className="auth-visual-ring auth-visual-ring--1" />
        <div className="auth-visual-sweep" />
        {RING_PINS.map((deg, i) => (
          <span
            key={deg}
            className="auth-visual-pin"
            style={
              {
                "--pin-angle": `${deg}deg`,
                animationDelay: `${i * 0.5}s`,
              } as React.CSSProperties
            }
          />
        ))}
        <div className="auth-visual-core">
          <img src={assets.mapLogo} alt="" className="h-9 w-9 object-contain" />
        </div>
      </div>

      <p className="auth-visual-ticker" aria-live="polite">
        <span className="auth-visual-ticker-label">Research live from</span>
        <span key={locationIdx} className="auth-visual-ticker-city">
          {LOCATIONS[locationIdx]}
        </span>
      </p>

      <ul className="auth-visual-features">
        {FEATURES.map(({ icon: Icon, label }) => (
          <li key={label}>
            <Icon className="h-4 w-4" strokeWidth={2} />
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
