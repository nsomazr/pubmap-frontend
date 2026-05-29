/** OpenStreetMap Nominatim  -  free geocoding (use sparingly: max ~1 req/s). */

const NOMINATIM = "https://nominatim.openstreetmap.org";
const HEADERS = {
  Accept: "application/json",
  "Accept-Language": "en",
};

export interface GeocodeResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
  type?: string;
  class?: string;
  importance?: number;
}

/** Region-scale label for study context (state / district / country), not street-level. */
export function formatStudyRegionLabel(displayName: string): string {
  const parts = displayName
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length <= 3) return parts.join(", ");
  return parts.slice(-3).join(", ");
}

const REGION_SEARCH_TYPES = new Set([
  "administrative",
  "state",
  "county",
  "region",
  "city",
  "town",
  "village",
  "municipality",
  "district",
]);

function rankPlaceResult(result: GeocodeResult): number {
  const type = (result.type || "").toLowerCase();
  const klass = (result.class || "").toLowerCase();
  let score = result.importance ?? 0;
  if (REGION_SEARCH_TYPES.has(type)) score += 2;
  if (klass === "boundary" || klass === "place") score += 1;
  if (type === "house" || type === "building" || type === "road") score -= 3;
  return score;
}

export async function searchPlaces(query: string): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const params = new URLSearchParams({
    q,
    format: "json",
    limit: "12",
    addressdetails: "1",
    dedupe: "1",
  });

  const res = await fetch(`${NOMINATIM}/search?${params}`, { headers: HEADERS });
  if (!res.ok) throw new Error("Place search failed");
  const rows = (await res.json()) as GeocodeResult[];
  return [...rows].sort((a, b) => rankPlaceResult(b) - rankPlaceResult(a)).slice(0, 8);
}

export async function reverseGeocode(
  lat: number,
  lon: number,
  options?: { zoom?: number; preferRegion?: boolean }
): Promise<string | null> {
  const preferRegion = options?.preferRegion ?? false;
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: "json",
    zoom: String(options?.zoom ?? (preferRegion ? 8 : 14)),
    addressdetails: "1",
  });

  const res = await fetch(`${NOMINATIM}/reverse?${params}`, { headers: HEADERS });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    display_name?: string;
    address?: Record<string, string>;
  };

  const address = data.address;
  if (address) {
    if (preferRegion) {
      const parts = [
        address.state || address.region,
        address.county || address.state_district,
        address.city || address.town,
        address.country,
      ].filter(Boolean);
      const unique = parts.filter((p, i) => i === 0 || p !== parts[i - 1]);
      if (unique.length >= 1) {
        return unique.slice(0, 3).join(", ");
      }
    } else {
      const village =
        address.village ||
        address.hamlet ||
        address.town ||
        address.suburb ||
        address.neighbourhood ||
        address.locality;
      const district = address.city_district || address.county || address.state_district;
      const region = address.state || address.region;
      const country = address.country;
      const parts = [village, district, region, country].filter(Boolean);
      if (parts.length >= 2) {
        return parts.join(", ");
      }
    }
  }

  if (preferRegion && data.display_name) {
    const tail = data.display_name.split(",").map((s) => s.trim()).filter(Boolean);
    if (tail.length >= 2) {
      return tail.slice(-Math.min(3, tail.length)).join(", ");
    }
  }

  return data.display_name ?? null;
}

/** Region-scale label (state / district / country), not village-level. */
export async function reverseGeocodeRegion(lat: number, lon: number): Promise<string | null> {
  return reverseGeocode(lat, lon, { preferRegion: true, zoom: 8 });
}

/** Short label for a map region pick. */
export function formatMapRegionLabel(lat: number, lng: number, resolved?: string | null): string {
  if (resolved?.trim()) return resolved.trim();
  return `Near ${lat.toFixed(3)}, ${lng.toFixed(3)}`;
}

export function formatCoords(lat: string | number, lon: string | number): string {
  const la = typeof lat === "string" ? parseFloat(lat) : lat;
  const lo = typeof lon === "string" ? parseFloat(lon) : lon;
  if (Number.isNaN(la) || Number.isNaN(lo)) return "";
  return `${la.toFixed(5)}, ${lo.toFixed(5)}`;
}

export function hasValidCoords(lat?: string, lon?: string): boolean {
  const la = parseFloat(lat || "");
  const lo = parseFloat(lon || "");
  return (
    !Number.isNaN(la) &&
    !Number.isNaN(lo) &&
    la >= -90 &&
    la <= 90 &&
    lo >= -180 &&
    lo <= 180
  );
}
