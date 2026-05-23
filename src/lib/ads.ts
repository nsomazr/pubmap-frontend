import { useQuery } from "@tanstack/react-query";
import api from "./api";

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
  link: string;
  placement: AdPlacement;
  location: string;
  status: string;
  sponsor_label: string;
  description: string;
  publication_id: number | null;
  sort_order: number;
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

export interface AdAnalyticsRow {
  id: number;
  title: string;
  placement: AdPlacement;
  location: string;
  status: string;
  impressions: number;
  clicks: number;
  ctr: number;
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

export function usePlacementAds(placement: AdPlacement, limit = 3, enabled = true) {
  return useQuery({
    queryKey: ["ads", "placement", placement, limit],
    queryFn: async () => {
      const { data } = await api.get<{ placement: AdPlacement; ads: GreAd[] }>(
        "/ads/placements/",
        { params: { placement, limit } }
      );
      return data.ads;
    },
    enabled,
    staleTime: 60_000,
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
