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
  | "event_sponsor";

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
    label: external ? "Visit sponsor" : ad.link ? "Continue" : "Learn more",
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

export function usePlacementAds(
  placement: AdPlacement,
  limit = 3,
  enabled = true,
  rotate = false
) {
  return useQuery({
    queryKey: ["ads", "placement", placement, limit, rotate],
    queryFn: async () => {
      const { data } = await api.get<{ placement: AdPlacement; ads: GreAd[] }>(
        "/ads/placements/",
        { params: { placement, limit, rotate: rotate ? 1 : undefined } }
      );
      return data.ads;
    },
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: true,
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
