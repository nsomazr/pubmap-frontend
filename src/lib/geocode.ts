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
}

export async function searchPlaces(query: string): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const params = new URLSearchParams({
    q,
    format: "json",
    limit: "8",
    addressdetails: "1",
  });

  const res = await fetch(`${NOMINATIM}/search?${params}`, { headers: HEADERS });
  if (!res.ok) throw new Error("Place search failed");
  return res.json();
}

export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: "json",
    zoom: "14",
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

  return data.display_name ?? null;
}

/** Short label for a local map search pin (village / town scale). */
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
