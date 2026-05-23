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
  });

  const res = await fetch(`${NOMINATIM}/reverse?${params}`, { headers: HEADERS });
  if (!res.ok) return null;
  const data = await res.json();
  return data.display_name ?? null;
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
