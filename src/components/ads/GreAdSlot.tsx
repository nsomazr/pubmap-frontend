import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  adDestination,
  buildAdDetailPath,
  trackAdEvent,
  useMapAdCarousel,
  usePlacementAds,
  type AdPlacement,
  type AdTargetingContext,
  resolveAdImageSrc,
  type GreAd,
} from "../../lib/ads";

type Variant = "compact" | "banner" | "card";

const ROTATE_MS = 6000;
const SLIDE_MS = 420;
const SWIPE_THRESHOLD = 48;

interface GreAdSlotProps {
  ads: GreAd[];
  placement: AdPlacement;
  variant?: Variant;
  className?: string;
  emptyClassName?: string;
  /** Auto-advance slides when multiple ads are shown. */
  rotate?: boolean;
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
  const destination = adDestination(ad);
  const detailPath = buildAdDetailPath(ad.id, ad.placement || placement);
  const imageSrc = resolveAdImageSrc(ad.image, ad.id, ad.image_path);
  const trackPlacement = ad.placement || placement;

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    void trackAdEvent(ad.id, trackPlacement, "impression");
  }, [ad.id, trackPlacement]);

  const onVisit = () => {
    void trackAdEvent(ad.id, trackPlacement, "click");
  };

  const label = ad.sponsor_label || "Sponsored";

  const shell =
    variant === "banner"
      ? "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
      : variant === "card"
        ? "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        : "overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 shadow-sm backdrop-blur";

  const imageWrapClass =
    variant === "banner" ? "relative h-28 sm:h-32" : "relative mt-2 h-24 px-3";
  const imageClass =
    variant === "banner"
      ? "h-full w-full object-cover transition group-hover:opacity-95"
      : "h-full w-full rounded-lg object-cover transition group-hover:opacity-95";

  return (
    <article className={`gre-interactive group h-full hover:-translate-y-0.5 hover:shadow-md ${shell}`}>
      <Link
        to={detailPath}
        className="block rounded-[inherit] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        aria-label={`View sponsored ad: ${ad.title}`}
      >
        <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 ring-1 ring-amber-200/80">
            {label}
          </span>
        </div>
        {imageSrc ? (
          <div className={imageWrapClass}>
            <img src={imageSrc} alt="" className={imageClass} loading="lazy" />
          </div>
        ) : (
          <div className={`${imageWrapClass} bg-slate-100`} />
        )}
        <div className="space-y-2 px-3 pb-2 pt-2">
          <p className="text-sm font-semibold leading-snug text-ink transition group-hover:text-brand-700">
            {ad.title}
          </p>
          {ad.description ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">{ad.description}</p>
          ) : null}
          <p className="text-xs font-semibold text-brand-700 group-hover:text-brand-800">
            Details →
          </p>
        </div>
      </Link>
      {destination.href && destination.href !== "#" ? (
        <div className="border-t border-slate-100 px-3 py-2">
          {destination.external ? (
            <a
              href={destination.href}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={onVisit}
              className="text-xs font-semibold text-slate-600 hover:text-ink hover:underline"
            >
              {destination.label}
            </a>
          ) : (
            <Link
              to={destination.href}
              onClick={onVisit}
              className="text-xs font-semibold text-slate-600 hover:text-ink hover:underline"
            >
              {destination.label}
            </Link>
          )}
        </div>
      ) : (
        <div className="h-2" />
      )}
    </article>
  );
}

function GreAdCarousel({
  ads,
  placement,
  variant,
  autoRotate,
}: {
  ads: GreAd[];
  placement: AdPlacement;
  variant: Variant;
  autoRotate: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback(
    (nextIndex: number) => {
      const total = ads.length;
      if (total <= 0) return;
      const wrapped = ((nextIndex % total) + total) % total;
      setIndex(wrapped);
    },
    [ads.length]
  );

  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (!autoRotate || ads.length <= 1 || paused) return;
    const timer = window.setInterval(goNext, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [ads.length, autoRotate, goNext, paused]);

  const onTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
    setDragOffset(0);
  };

  const onTouchMove = (event: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const currentX = event.touches[0]?.clientX ?? touchStartX.current;
    setDragOffset(currentX - touchStartX.current);
  };

  const onTouchEnd = () => {
    if (touchStartX.current == null) return;
    if (dragOffset <= -SWIPE_THRESHOLD) goNext();
    else if (dragOffset >= SWIPE_THRESHOLD) goPrev();
    touchStartX.current = null;
    setDragOffset(0);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative overflow-hidden" aria-live="polite">
        <div
          className="flex transition-transform ease-[var(--gre-ease-out)]"
          style={{
            transform: `translateX(calc(-${index * 100}% + ${dragOffset}px))`,
            transitionDuration: dragOffset ? "0ms" : `${SLIDE_MS}ms`,
          }}
        >
          {ads.map((ad) => (
            <div key={ad.id} className="w-full shrink-0">
              <AdItem ad={ad} placement={ad.placement || placement} variant={variant} />
            </div>
          ))}
        </div>
      </div>

      {ads.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous sponsored ad"
            onClick={goPrev}
            className="gre-interactive absolute left-1 top-[42%] z-10 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 text-slate-600 shadow-sm hover:bg-white hover:text-ink"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next sponsored ad"
            onClick={goNext}
            className="gre-interactive absolute right-1 top-[42%] z-10 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 text-slate-600 shadow-sm hover:bg-white hover:text-ink"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="mt-2 flex items-center justify-center gap-1.5">
            {ads.map((row, dotIndex) => (
              <button
                key={row.id}
                type="button"
                aria-label={`Show sponsored ad: ${row.title}`}
                aria-current={dotIndex === index ? "true" : undefined}
                onClick={() => goTo(dotIndex)}
                className={`h-1.5 rounded-full transition-all ${
                  dotIndex === index ? "w-4 bg-brand-600" : "w-1.5 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
          <p className="mt-1 text-center text-[10px] font-medium text-slate-400">
            {index + 1} / {ads.length}
          </p>
        </>
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
  rotate = true,
}: GreAdSlotProps) {
  if (!ads.length) {
    return emptyClassName ? <div className={emptyClassName} /> : null;
  }

  const showCarousel = ads.length > 1;

  return (
    <aside
      className={className}
      aria-label="Sponsored content"
      data-ad-placement={placement}
    >
      {showCarousel ? (
        <GreAdCarousel
          ads={ads}
          placement={placement}
          variant={variant}
          autoRotate={rotate}
        />
      ) : (
        <AdItem ad={ads[0]} placement={ads[0].placement || placement} variant={variant} />
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
  context?: AdTargetingContext;
}

export function GreAdPlacement({
  placement,
  limit = 4,
  variant = "compact",
  className = "space-y-3",
  enabled = true,
  rotate = true,
  context,
}: GreAdPlacementProps) {
  const { data: ads = [] } = usePlacementAds(placement, limit, enabled, rotate, context);
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

/** Single sliding carousel for map sidebar + research-tool ads. */
export function MapAdRail({
  enabled = true,
  context,
  className = "pointer-events-auto",
}: {
  enabled?: boolean;
  context?: AdTargetingContext;
  className?: string;
}) {
  const { data: ads = [] } = useMapAdCarousel(enabled, context);
  return (
    <GreAdSlot
      ads={ads}
      placement="sidebar"
      className={className}
      rotate
    />
  );
}
