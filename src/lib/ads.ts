import { useQuery } from "@tanstack/react-query";
import api from "./api";
import { resolveApiBaseUrl } from "./apiBaseUrl";
import { mediaUrl } from "./mediaUrl";
import { buildPublicationPath } from "./publicationPaths";

export type AdPlacement =
  | "sidebar"
  | "sponsored_publication"
  | "research_tool"
  | "institutional_banner"
  | "event_sponsor"
  | "forum_sidebar"
  | "forum_inline"
  | "rankings_sidebar"
  | "statistics_banner";

export interface AdTargeting {
  category_ids?: number[];
  sub_category_ids?: number[];
  locations?: string[];
  affiliations?: string[];
  keywords?: string[];
}

export interface AdTargetingContext {
  categoryId?: number | null;
  subCategoryId?: number | null;
  location?: string | null;
  affiliation?: string | null;
  areaOfStudy?: string | null;
  title?: string | null;
}

export interface GreAd {
  id: number;
  title: string;
  image: string;
  image_path?: string;
  link: string;
  placement: AdPlacement;
  placement_label?: string;
  location: string;
  status: string;
  sponsor_label: string;
  description: string;
  publication_id: number | null;
  publication_encoded_id?: string | null;
  sort_order: number;
}

export function buildAdDetailPath(adId: number, placement?: AdPlacement): string {
  const base = `/sponsored/${adId}`;
  if (!placement) return base;
  return `${base}?placement=${encodeURIComponent(placement)}`;
}

export function adDestination(ad: Pick<GreAd, "link" | "publication_id" | "publication_encoded_id">) {
  if (ad.publication_id) {
    return {
      href: buildPublicationPath(ad.publication_id, ad.publication_encoded_id),
      external: false,
      label: "View publication",
    };
  }
  const href = adLinkHref(ad.link);
  const external = isExternalAdLink(ad.link);
  return {
    href,
    external,
    label: external || ad.link ? "Visit sponsor" : "Learn more",
  };
}

export function useAdDetail(adId: number | string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["ads", "public", adId],
    enabled: enabled && Boolean(adId),
    queryFn: async () => {
      const { data } = await api.get<GreAd>(`/ads/${adId}/public/`);
      return data;
    },
  });
}

export const AD_PLACEMENTS: { value: AdPlacement; label: string; hint: string }[] = [
  {
    value: "sidebar",
    label: "Map sidebar",
    hint: "Compact cards beside the research map, never over content.",
  },
  {
    value: "sponsored_publication",
    label: "Sponsored publication",
    hint: "Clearly labeled promoted studies on publication pages.",
  },
  {
    value: "research_tool",
    label: "Research tool / service",
    hint: "Tools and services in side rails on publication views.",
  },
  {
    value: "institutional_banner",
    label: "Institutional banner",
    hint: "Wide partner banners on events and about pages.",
  },
  {
    value: "event_sponsor",
    label: "Event sponsorship",
    hint: "Sponsor strip on the events directory.",
  },
  {
    value: "forum_sidebar",
    label: "Forum sidebar",
    hint: "Side rail on forum index, category, and topic pages.",
  },
  {
    value: "forum_inline",
    label: "Forum inline",
    hint: "Inline sponsored cards between forum discussions.",
  },
  {
    value: "rankings_sidebar",
    label: "Rankings sidebar",
    hint: "Leaderboard pages for institutions and researchers.",
  },
  {
    value: "statistics_banner",
    label: "Statistics banner",
    hint: "Wide banner on the public research statistics page.",
  },
];

export interface AdAnalyticsPlacementRow {
  placement: AdPlacement;
  label: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface AdAnalyticsRow {
  id: number;
  title: string;
  placement: AdPlacement;
  placement_label?: string;
  location: string;
  status: string;
  link?: string;
  sponsor_label?: string;
  impressions: number;
  clicks: number;
  ctr: number;
  by_placement?: AdAnalyticsPlacementRow[];
}

export interface AdAnalytics {
  days: number;
  since: string;
  summary: { impressions: number; clicks: number; ctr: number };
  ads: AdAnalyticsRow[];
  by_placement: {
    placement: AdPlacement;
    label: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }[];
}

export function adTargetingQueryParams(context?: AdTargetingContext): Record<string, string> {
  if (!context) return {};
  const params: Record<string, string> = {};
  if (context.categoryId) params.category_id = String(context.categoryId);
  if (context.subCategoryId) params.sub_category_id = String(context.subCategoryId);
  if (context.location?.trim()) params.location = context.location.trim();
  if (context.affiliation?.trim()) params.affiliation = context.affiliation.trim();
  if (context.areaOfStudy?.trim()) params.area_of_study = context.areaOfStudy.trim();
  if (context.title?.trim()) params.title = context.title.trim();
  return params;
}

export function emptyAdTargetingForm(): AdTargeting {
  return {
    category_ids: [],
    sub_category_ids: [],
    locations: [],
    affiliations: [],
    keywords: [],
  };
}

export function adTargetingToForm(targeting?: AdTargeting | null) {
  const value = targeting ?? emptyAdTargetingForm();
  return {
    category_ids: (value.category_ids ?? []).join(", "),
    sub_category_ids: (value.sub_category_ids ?? []).join(", "),
    locations: (value.locations ?? []).join(", "),
    affiliations: (value.affiliations ?? []).join(", "),
    keywords: (value.keywords ?? []).join(", "),
  };
}

export function adTargetingFromForm(form: {
  category_ids: string;
  sub_category_ids: string;
  locations: string;
  affiliations: string;
  keywords: string;
}): AdTargeting {
  const parseIds = (raw: string) =>
    raw
      .split(",")
      .map((part) => Number(part.trim()))
      .filter((id) => Number.isFinite(id) && id > 0);
  const parseTokens = (raw: string) =>
    raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

  return {
    category_ids: parseIds(form.category_ids),
    sub_category_ids: parseIds(form.sub_category_ids),
    locations: parseTokens(form.locations),
    affiliations: parseTokens(form.affiliations),
    keywords: parseTokens(form.keywords),
  };
}

export function usePlacementAds(
  placement: AdPlacement,
  limit = 3,
  enabled = true,
  rotate = false,
  context?: AdTargetingContext
) {
  const targetingParams = adTargetingQueryParams(context);
  return useQuery({
    queryKey: ["ads", "placement", placement, limit, rotate, targetingParams],
    queryFn: () => fetchPlacementAds(placement, limit, rotate, context),
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export async function fetchPlacementAds(
  placement: AdPlacement,
  limit = 3,
  rotate = false,
  context?: AdTargetingContext
): Promise<GreAd[]> {
  const targetingParams = adTargetingQueryParams(context);
  const { data } = await api.get<{ placement: AdPlacement; ads: GreAd[] }>(
    "/ads/placements/",
    {
      params: {
        placement,
        limit,
        rotate: rotate ? 1 : undefined,
        ...targetingParams,
      },
    }
  );
  return data.ads;
}

/** Sidebar + research-tool ads merged into one carousel for the map. */
export function useMapAdCarousel(enabled = true, context?: AdTargetingContext) {
  const targetingParams = adTargetingQueryParams(context);
  return useQuery({
    queryKey: ["ads", "map-carousel", targetingParams],
    queryFn: async () => {
      const [sidebarAds, toolAds] = await Promise.all([
        fetchPlacementAds("sidebar", 4, true, context),
        fetchPlacementAds("research_tool", 2, true, context),
      ]);
      const seen = new Set<number>();
      const merged: GreAd[] = [];
      for (const ad of [...sidebarAds, ...toolAds]) {
        if (seen.has(ad.id)) continue;
        seen.add(ad.id);
        merged.push(ad);
      }
      return merged;
    },
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function trackAdEvent(
  adId: number,
  placement: AdPlacement,
  event: "impression" | "click"
) {
  return api.post("/ads/track/", { ad_id: adId, placement, event }).catch(() => {});
}

export function useAdAnalytics(days = 30) {
  return useQuery({
    queryKey: ["ads", "analytics", days],
    queryFn: async () => {
      const { data } = await api.get<AdAnalytics>("/ads/analytics/", { params: { days } });
      return data;
    },
  });
}

export function adLinkHref(link: string): string {
  if (!link) return "#";
  if (link.startsWith("http://") || link.startsWith("https://") || link.startsWith("/")) {
    return link;
  }
  return `/${link.replace(/^\//, "")}`;
}

export function isExternalAdLink(link: string): boolean {
  return link.startsWith("http://") || link.startsWith("https://");
}

export const AD_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif";
export const AD_IMAGE_MAX_BYTES = 4 * 1024 * 1024;

export function validateAdImageFile(file: File): string | null {
  if (file.size > AD_IMAGE_MAX_BYTES) {
    return "Image must be 4 MB or smaller.";
  }
  return null;
}

function adImageApiUrl(adId: number): string {
  const apiBase = resolveApiBaseUrl().replace(/\/api\/?$/, "");
  return `${apiBase}/api/ads/${adId}/image/`;
}

function isUploadedAdAsset(path: string): boolean {
  const normalized = path.replace(/^\/+/, "").toLowerCase();
  return (
    normalized.includes("uploads/ads/") ||
    normalized.includes("/media/uploads/ads/")
  );
}

export function resolveAdImageSrc(
  image?: string | null,
  adId?: number,
  imagePath?: string | null
): string {
  const display = (image || "").trim();
  const stored = (imagePath || display).trim();

  if (adId && (isUploadedAdAsset(display) || isUploadedAdAsset(stored))) {
    return adImageApiUrl(adId);
  }

  if (display.startsWith("http://") || display.startsWith("https://")) {
    return display;
  }

  if (stored) {
    const resolved = mediaUrl(stored);
    if (resolved) return resolved;
  }

  if (adId) {
    return adImageApiUrl(adId);
  }

  return display;
}

export async function uploadAdImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("image", file);
  const { data } = await api.post<{ image: string; url?: string }>("/ads/upload-image/", body);
  return data.image;
}
