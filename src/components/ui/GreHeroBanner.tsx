import { User, type LucideIcon } from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";
import { greAvatarInitials, greGradientHero } from "../../lib/greTheme";
import { resolveProfilePhotoSrc } from "../../lib/profilePhoto";

type Variant = "card" | "strip";
type AvatarSize = "sm" | "md" | "lg";

const AVATAR_SIZE: Record<AvatarSize, string> = {
  sm: "h-10 w-10 rounded-full text-xs",
  md: "h-12 w-12 rounded-full text-sm",
  lg: "h-[4.5rem] w-[4.5rem] rounded-full text-xl sm:h-20 sm:w-20",
};

interface AvatarProps {
  photoUrl?: string | null;
  photoVersion?: string | null;
  initials?: string;
  icon?: LucideIcon;
  size?: AvatarSize;
  className?: string;
}

export function GreAvatarSlot({
  photoUrl,
  photoVersion,
  initials,
  icon: Icon = User,
  size = "md",
  className = "",
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const src = resolveProfilePhotoSrc(photoUrl, photoVersion);
  const showPhoto = Boolean(src && !imgError);

  useEffect(() => {
    setImgError(false);
  }, [photoUrl, photoVersion]);

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden border-[3px] border-white bg-slate-100 font-bold text-white shadow-md ${AVATAR_SIZE[size]} ${className}`}
    >
      {showPhoto && src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : initials ? (
        <span className={`${greAvatarInitials} h-full w-full`}>{initials}</span>
      ) : (
        <Icon className="h-[45%] w-[45%] text-slate-400" strokeWidth={1.5} aria-hidden />
      )}
    </div>
  );
}

interface Props {
  variant?: Variant;
  photoUrl?: string | null;
  photoVersion?: string | null;
  initials?: string;
  icon?: LucideIcon;
  avatarSize?: AvatarSize;
  /** Strip: title on gradient. Card: optional title row in white body. */
  title?: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  /** Rendered on the avatar (e.g. verified badge). */
  avatarBadge?: ReactNode;
  /** Shorter gradient strip and tighter body (e.g. publication detail under page hero). */
  compact?: boolean;
  className?: string;
  bannerClassName?: string;
}

export function GreHeroBanner({
  variant = "card",
  photoUrl,
  photoVersion,
  initials,
  icon,
  avatarSize,
  title,
  subtitle,
  meta,
  actions,
  children,
  avatarBadge,
  compact = false,
  className = "",
  bannerClassName = "",
}: Props) {
  const size = avatarSize ?? (variant === "strip" ? "sm" : compact ? "md" : "lg");
  const gradient = greGradientHero;

  if (variant === "strip") {
    return (
      <header
        className={`gre-hero-banner gre-hero-banner--strip flex items-center gap-3 px-4 py-3.5 sm:px-5 ${gradient} ${bannerClassName} ${className}`}
      >
        <GreAvatarSlot
          photoUrl={photoUrl}
          photoVersion={photoVersion}
          initials={initials}
          icon={icon}
          size={size}
          className="border-2"
        />
        <div className="min-w-0 flex-1 text-white">
          {title && <p className="truncate font-semibold leading-snug">{title}</p>}
          {subtitle && (
            <p className="truncate text-xs text-white/80">{subtitle}</p>
          )}
        </div>
        {actions}
      </header>
    );
  }

  return (
    <div
      className={`gre-hero-banner gre-hero-banner--card overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ${className}`}
    >
      <div
        className={`relative overflow-visible ${compact ? "h-14 sm:h-16" : "h-16 sm:h-[4.5rem]"} ${gradient} ${bannerClassName}`}
        aria-hidden
      >
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: "20px 20px",
          }}
        />
        <div
          className={`absolute bottom-0 translate-y-1/2 ${compact ? "left-4" : "left-4 sm:left-5"}`}
        >
          <div className="relative">
            <GreAvatarSlot
              photoUrl={photoUrl}
              photoVersion={photoVersion}
              initials={initials}
              icon={icon}
              size={size}
            />
            {avatarBadge}
          </div>
        </div>
      </div>

      <div
        className={
          compact
            ? "px-4 pb-4 pt-8 sm:px-5 sm:pb-5 sm:pt-9"
            : "px-5 pb-5 pt-10 sm:px-6 sm:pb-6 sm:pt-11"
        }
      >
        {(title || subtitle || actions || meta) && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-4">
              <div
                className={`shrink-0 ${compact ? "w-12 sm:w-12" : "w-[4.5rem] sm:w-20"}`}
                aria-hidden
              />
              <div className="min-w-0 flex-1 pt-0.5 sm:pt-1">
                {title && (
                  <div className="text-lg font-bold leading-snug text-ink sm:text-xl">
                    {title}
                  </div>
                )}
                {subtitle && <div className="mt-1 text-sm text-slate-600">{subtitle}</div>}
                {meta && <div className="mt-2">{meta}</div>}
              </div>
            </div>
            {actions && <div className="shrink-0 sm:mt-1">{actions}</div>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/** Compact top strip for list cards (publication rows, etc.) */
export function GreHeroBannerStrip({
  photoUrl,
  photoVersion,
  initials,
  icon,
  className = "",
  accentColor,
}: Pick<Props, "photoUrl" | "photoVersion" | "initials" | "icon" | "className"> & {
  accentColor?: string;
}) {
  return (
    <div
      className={`relative h-14 overflow-hidden rounded-t-2xl sm:h-16 ${
        accentColor
          ? ""
          : greGradientHero
      } ${className}`}
      style={
        accentColor
          ? {
              background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}dd 45%, #0d9488 100%)`,
            }
          : undefined
      }
      aria-hidden
    >
      <div className="absolute bottom-0 left-3 translate-y-1/3 sm:left-4">
        <GreAvatarSlot
          photoUrl={photoUrl}
          photoVersion={photoVersion}
          initials={initials}
          icon={icon}
          size="sm"
          className="h-9 w-9 rounded-full border-2 text-[10px]"
        />
      </div>
    </div>
  );
}
