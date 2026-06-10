import { ExternalLink, Megaphone } from "lucide-react";
import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { PublicPageLayout } from "../components/layout/PublicPageLayout";
import { Button } from "../components/ui/Button";
import {
  adDestination,
  trackAdEvent,
  useAdDetail,
  type AdPlacement,
} from "../lib/ads";
import { resolveAdImageSrc } from "../lib/ads";

const PLACEMENT_VALUES = new Set([
  "sidebar",
  "sponsored_publication",
  "research_tool",
  "institutional_banner",
  "event_sponsor",
]);

function parsePlacement(value: string | null): AdPlacement | undefined {
  if (!value || !PLACEMENT_VALUES.has(value)) return undefined;
  return value as AdPlacement;
}

export function AdDetailPage() {
  const { adId } = useParams<{ adId: string }>();
  const [searchParams] = useSearchParams();
  const placement = parsePlacement(searchParams.get("placement"));
  const { data: ad, isLoading, isError } = useAdDetail(adId);

  useEffect(() => {
    if (!ad || !placement) return;
    void trackAdEvent(ad.id, placement, "impression");
  }, [ad, placement]);

  if (isLoading) {
    return (
      <PublicPageLayout
        title="Sponsored content"
        crumbs={[{ label: "Home", to: "/" }, { label: "Sponsored" }]}
      >
        <p className="text-slate-500">Loading…</p>
      </PublicPageLayout>
    );
  }

  if (isError || !ad) {
    return (
      <PublicPageLayout
        title="Sponsored content unavailable"
        crumbs={[{ label: "Home", to: "/" }, { label: "Sponsored" }]}
        back={{ to: "/", label: "Back to map" }}
      >
        <p className="text-slate-600">This sponsored listing is no longer available.</p>
      </PublicPageLayout>
    );
  }

  const imageSrc = resolveAdImageSrc(ad.image, ad.id, ad.image_path);
  const destination = adDestination(ad);
  const placementLabel = ad.placement_label || ad.placement.replace(/_/g, " ");

  const handleVisit = () => {
    if (placement) {
      void trackAdEvent(ad.id, placement, "click");
    }
  };

  return (
    <PublicPageLayout
      compactHero
      accent="teal"
      badge={ad.sponsor_label || "Sponsored"}
      title={ad.title}
      crumbs={[{ label: "Home", to: "/" }, { label: "Sponsored content" }]}
      back={{ to: "/", label: "Back to map" }}
    >
      <article className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-800">
          <Megaphone className="h-4 w-4" />
          <span>{ad.sponsor_label || "Sponsored"}</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">{placementLabel}</span>
        </div>

        {imageSrc ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <img src={imageSrc} alt="" className="max-h-[28rem] w-full object-cover" />
          </div>
        ) : null}

        {ad.description ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">About</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {ad.description}
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            This is a sponsored listing on the Global Research Exchange. Use the button below to
            continue to the sponsor content.
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          {destination.href && destination.href !== "#" ? (
            destination.external ? (
              <a
                href={destination.href}
                target="_blank"
                rel="noopener noreferrer sponsored"
                onClick={handleVisit}
              >
                <Button className="!gap-2">
                  {destination.label}
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            ) : (
              <Link to={destination.href} onClick={handleVisit}>
                <Button>{destination.label}</Button>
              </Link>
            )
          ) : null}
          <Link to="/">
            <Button variant="secondary">Back to GRE map</Button>
          </Link>
        </div>
      </article>
    </PublicPageLayout>
  );
}
