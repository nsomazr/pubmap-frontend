import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  adLinkHref,
  isExternalAdLink,
  trackAdEvent,
  usePlacementAds,
  type AdPlacement,
  type GreAd,
} from "../../lib/ads";
import { mediaUrl } from "../../lib/mediaUrl";
import { buildPublicationPath } from "../../lib/publicationPaths";

type Variant = "compact" | "banner" | "card";

const ROTATE_MS = 6000;
const FADE_MS = 320;

interface GreAdSlotProps {
  ads: GreAd[];
  placement: AdPlacement;
  variant?: Variant;
  className?: string;
  emptyClassName?: string;
  rotate?: boolean;
}

function resolveImage(image: string): string {
  if (!image) return "";
  if (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("/")) {
    return image;
  }
  return mediaUrl(image) || "";
}

function AdItem({
  ad,
  placement,
  variant,
}: {
  ad: GreAd;
  placement: AdPlacement;
  variant: Variant;
}) {
  const tracked = useRef(false);
  const href = ad.publication_id
    ? buildPublicationPath(ad.publication_id, ad.publication_encoded_id)
    : adLinkHref(ad.link);
  const external = !ad.publication_id && isExternalAdLink(ad.link);
  const imageSrc = resolveImage(ad.image);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    void trackAdEvent(ad.id, placement, "impression");
  }, [ad.id, placement]);

  const onClick = () => {
    void trackAdEvent(ad.id, placement, "click");
  };

  const label = ad.sponsor_label || "Sponsored";

  const shell =
    variant === "banner"
      ? "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
      : variant === "card"
        ? "overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        : "overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 shadow-sm backdrop-blur";

  const content = (
    <>
      <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 ring-1 ring-amber-200/80">
          {label}
        </span>
      </div>
      {imageSrc && (
        <div className={variant === "banner" ? "relative h-28 sm:h-32" : "relative mt-2 h-24 px-3"}>
          <img
            src={imageSrc}
            alt=""
            className={
              variant === "banner"
                ? "h-full w-full object-cover"
                : "h-full w-full rounded-lg object-cover"
            }
            loading="lazy"
          />
        </div>
      )}
      <div className="space-y-1 px-3 pb-3 pt-2">
        <p className="text-sm font-semibold leading-snug text-ink">{ad.title}</p>
        {ad.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">{ad.description}</p>
        )}
      </div>
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={onClick}
        className={`group block transition hover:-translate-y-0.5 hover:shadow-md ${shell}`}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      to={href}
      onClick={onClick}
      className={`group block transition hover:-translate-y-0.5 hover:shadow-md ${shell}`}
    >
      {content}
    </Link>
  );
}

function GreAdCarousel({
  ads,
  placement,
  variant,
}: {
  ads: GreAd[];
  placement: AdPlacement;
  variant: Variant;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (ads.length <= 1 || paused) return;
    let fadeTimer: ReturnType<typeof setTimeout> | undefined;
    const timer = window.setInterval(() => {
      setVisible(false);
      fadeTimer = window.setTimeout(() => {
        setIndex((current) => (current + 1) % ads.length);
        setVisible(true);
      }, FADE_MS);
    }, ROTATE_MS);
    return () => {
      window.clearInterval(timer);
      if (fadeTimer) window.clearTimeout(fadeTimer);
    };
  }, [ads.length, paused]);

  const ad = ads[index];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div
        className={`transition-[opacity,transform] duration-300 ease-out ${
          visible ? "translate-x-0 opacity-100" : "translate-x-3 opacity-0"
        }`}
        aria-live="polite"
      >
        <AdItem key={ad.id} ad={ad} placement={placement} variant={variant} />
      </div>
      {ads.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {ads.map((row, dotIndex) => (
            <button
              key={row.id}
              type="button"
              aria-label={`Show sponsored ad: ${row.title}`}
              aria-current={dotIndex === index ? "true" : undefined}
              onClick={() => {
                setVisible(false);
                window.setTimeout(() => {
                  setIndex(dotIndex);
                  setVisible(true);
                }, FADE_MS);
              }}
              className={`h-1.5 rounded-full transition-all ${
                dotIndex === index ? "w-4 bg-brand-600" : "w-1.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function GreAdSlot({
  ads,
  placement,
  variant = "compact",
  className = "",
  emptyClassName = "hidden",
  rotate = false,
}: GreAdSlotProps) {
  if (!ads.length) {
    return emptyClassName ? <div className={emptyClassName} /> : null;
  }

  const showCarousel = rotate && ads.length > 1;

  return (
    <aside
      className={className}
      aria-label="Sponsored content"
      data-ad-placement={placement}
    >
      {showCarousel ? (
        <GreAdCarousel ads={ads} placement={placement} variant={variant} />
      ) : (
        ads.map((ad) => (
          <AdItem key={ad.id} ad={ad} placement={placement} variant={variant} />
        ))
      )}
    </aside>
  );
}

interface GreAdPlacementProps {
  placement: AdPlacement;
  limit?: number;
  variant?: Variant;
  className?: string;
  enabled?: boolean;
  rotate?: boolean;
}

export function GreAdPlacement({
  placement,
  limit = 2,
  variant = "compact",
  className = "space-y-3",
  enabled = true,
  rotate = false,
}: GreAdPlacementProps) {
  const { data: ads = [] } = usePlacementAds(placement, limit, enabled, rotate);
  return (
    <GreAdSlot
      ads={ads}
      placement={placement}
      variant={variant}
      className={className}
      rotate={rotate}
    />
  );
}
