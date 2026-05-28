import L from "leaflet";
import { Loader2, MapPin, Maximize2, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
  ZoomControl,
} from "react-leaflet";
import { assets } from "../../lib/brand";
import {
  formatCoords,
  hasValidCoords,
  reverseGeocodeRegion,
  searchPlaces,
  type GeocodeResult,
} from "../../lib/geocode";
import { formatRegionRadiusLabel, MAP_REGION_RADIUS_KM } from "../../lib/mapRegion";
import { InstitutionPicker } from "../institutions/InstitutionPicker";
import { RequiredMark } from "../ui/RequiredField";
import type { Coordinate } from "../../types";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: [number, number] = [-6.37, 34.89];
const DEFAULT_ZOOM = 5;
/** Map zoom when a region is selected (province / district scale, not street level). */
const REGION_CENTER_ZOOM = 8;

const pinIcon = L.icon({
  iconUrl: assets.marker,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

function MapFitRegion({ lat, lng, radiusKm }: { lat: number; lng: number; radiusKm: number }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.circle([lat, lng], { radius: radiusKm * 1000 }).getBounds();
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 11 });
  }, [lat, lng, radiusKm, map]);
  return null;
}

function MapInvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);
  return null;
}

function MapClickPick({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface MapViewProps {
  center: [number, number];
  zoom: number;
  height: string;
  hasPin: boolean;
  lat: number;
  lng: number;
  pickEnabled: boolean;
  onPick: (lat: number, lng: number) => void;
  onDragEnd: (lat: number, lng: number) => void;
}

function LocationMapView({
  center,
  zoom,
  height,
  hasPin,
  lat,
  lng,
  pickEnabled,
  onPick,
  onDragEnd,
  mapKey,
}: MapViewProps & { mapKey: string }) {
  return (
    <MapContainer
      key={mapKey}
      center={center}
      zoom={zoom}
      className="location-picker-map h-full w-full cursor-crosshair"
      style={{ height }}
      scrollWheelZoom
      zoomControl={false}
    >
      <ZoomControl position="bottomright" />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapInvalidateSize />
      {hasPin && (
        <>
          <MapFitRegion lat={lat} lng={lng} radiusKm={MAP_REGION_RADIUS_KM} />
          <Circle
            center={[lat, lng]}
            radius={MAP_REGION_RADIUS_KM * 1000}
            pathOptions={{
              color: "#3b5bdb",
              fillColor: "#3b5bdb",
              fillOpacity: 0.1,
              weight: 2,
            }}
          />
          <Marker
            position={[lat, lng]}
            icon={pinIcon}
            draggable={pickEnabled}
            eventHandlers={{
              dragend: (e) => {
                const p = e.target.getLatLng();
                onDragEnd(p.lat, p.lng);
              },
            }}
          />
        </>
      )}
      {pickEnabled && <MapClickPick onPick={onPick} />}
    </MapContainer>
  );
}

type Mode = "search" | "map";

interface Props {
  value: Coordinate;
  onChange: (coord: Coordinate) => void;
  institutionDefault?: string;
}

export function LocationPicker({ value, onChange, institutionDefault }: Props) {
  const [mode, setMode] = useState<Mode>("search");
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [reverseLoading, setReverseLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appliedInstitutionDefaultRef = useRef(false);

  const lat = parseFloat(value.latitude);
  const lng = parseFloat(value.longitude);
  const hasPin = hasValidCoords(value.latitude, value.longitude);

  useEffect(() => {
    const defaultInst = institutionDefault?.trim();
    if (!defaultInst || appliedInstitutionDefaultRef.current) return;
    if (value.institution?.trim()) {
      appliedInstitutionDefaultRef.current = true;
      return;
    }
    appliedInstitutionDefaultRef.current = true;
    onChange({ ...value, institution: defaultInst });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only seed institution once from profile
  }, [institutionDefault, value.institution]);

  const applyCoords = useCallback(
    async (latitude: number, longitude: number, locationName?: string) => {
      let location = locationName ?? value.location;
      if (!locationName) {
        setReverseLoading(true);
        try {
          const name = await reverseGeocodeRegion(latitude, longitude);
          if (name) location = name;
        } catch {
          /* keep existing label */
        } finally {
          setReverseLoading(false);
        }
      }
      onChange({
        ...value,
        location,
        latitude: String(latitude),
        longitude: String(longitude),
        institution: value.institution || institutionDefault || "",
      });
    },
    [onChange, value, institutionDefault]
  );

  const regionLabelFromResult = (displayName: string) => {
    const parts = displayName.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length <= 3) return parts.join(", ");
    return parts.slice(-3).join(", ");
  };

  const selectResult = (r: GeocodeResult) => {
    const label = regionLabelFromResult(r.display_name);
    setQuery(label);
    setResults([]);
    applyCoords(parseFloat(r.lat), parseFloat(r.lon), label);
    setMode("map");
  };

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  useEffect(() => {
    if (mode !== "search") return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearchError("");
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setSearchError("");
      try {
        const data = await searchPlaces(q);
        setResults(data);
        if (data.length === 0) setSearchError("No places found. Try a city, region, or landmark.");
      } catch {
        setSearchError("Search unavailable. Pick a point on the map instead.");
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, mode]);

  const mapCenter: [number, number] = hasPin ? [lat, lng] : DEFAULT_CENTER;
  const mapZoom = hasPin ? REGION_CENTER_ZOOM : DEFAULT_ZOOM;
  const regionHint = formatRegionRadiusLabel(MAP_REGION_RADIUS_KM);

  const mapProps: MapViewProps & { mapKey: string } = {
    center: mapCenter,
    zoom: mapZoom,
    height: "100%",
    hasPin,
    lat,
    lng,
    pickEnabled: true,
    onPick: applyCoords,
    onDragEnd: applyCoords,
    mapKey: expanded ? "location-picker-expanded" : "location-picker-inline",
  };

  const openExpandedMap = () => {
    setMode("map");
    setExpanded(true);
  };

  const expandOverlay =
    expanded &&
    createPortal(
      <div className="location-picker-expand fixed inset-0 z-[2000] flex flex-col bg-slate-900/50 p-3 sm:p-6">
        <div className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
            <div>
              <p className="font-semibold text-ink">Pick study region</p>
              <p className="text-xs text-slate-500">
                Click the map or drag the pin — circle shows the study area ({regionHint}) · Esc to close
              </p>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <X className="h-4 w-4" />
              Done
            </button>
          </div>
          <div className="relative min-h-0 flex-1">
            <LocationMapView {...mapProps} mapKey="location-picker-expanded" />
          </div>
          {hasPin && (
            <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-600 sm:px-5">
              <span className="font-medium text-slate-700">Coordinates: </span>
              {formatCoords(value.latitude, value.longitude)}
              {value.location && (
                <span className="text-slate-400"> · {value.location}</span>
              )}
            </div>
          )}
        </div>
      </div>,
      document.body
    );

  return (
    <div className="location-picker space-y-4">
      <div className="inline-flex rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200/80">
        <button
          type="button"
          onClick={() => setMode("search")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            mode === "search"
              ? "bg-white text-brand-700 shadow-sm"
              : "text-slate-600 hover:text-ink"
          }`}
        >
          <Search className="h-4 w-4" />
          Search place
        </button>
        <button
          type="button"
          onClick={() => setMode("map")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            mode === "map"
              ? "bg-white text-brand-700 shadow-sm"
              : "text-slate-600 hover:text-ink"
          }`}
        >
          <MapPin className="h-4 w-4" />
          Pick on map
        </button>
      </div>

      {mode === "search" && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Find a location</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Dar es Salaam, University of Nairobi, Cape Town…"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-brand-600" />
            )}
          </div>
          {searchError && <p className="text-sm text-amber-700">{searchError}</p>}
          {results.length > 0 && (
            <ul className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
              {results.map((r) => (
                <li key={r.place_id}>
                  <button
                    type="button"
                    onClick={() => selectResult(r)}
                    className="w-full px-4 py-3 text-left text-sm transition hover:bg-brand-50"
                  >
                    <span className="font-medium text-ink">
                      {r.display_name.split(",").slice(0, 2).join(",")}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500 line-clamp-1">
                      {r.display_name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {mode === "search" && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center">
          <MapPin className="mx-auto h-8 w-8 text-brand-600/80" aria-hidden />
          <p className="mt-3 text-sm font-medium text-ink">Need to click the map?</p>
          <p className="mt-1 text-sm text-slate-600">
            Switch to <span className="font-semibold">Pick on map</span> or open the expanded map to place
            your study region.
          </p>
          <button
            type="button"
            onClick={openExpandedMap}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
          >
            <Maximize2 className="h-4 w-4" />
            Open map
          </button>
        </div>
      )}

      {mode === "map" && !expanded && (
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-600">
              Click the map or drag the pin to set the study region. The shaded circle ({regionHint}) is
              the area shown on the research map.
            </p>
            <button
              type="button"
              onClick={openExpandedMap}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-brand-300 hover:text-brand-700"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Expand map
            </button>
          </div>
          <div className="location-picker-frame relative isolate overflow-hidden rounded-xl border border-slate-200 shadow-inner">
            <div className="h-[min(320px,50vh)] min-h-[240px] w-full sm:h-[320px]">
              <LocationMapView {...mapProps} height="100%" mapKey="location-picker-inline" />
            </div>
          </div>
          {reverseLoading && (
            <p className="mt-2 text-xs text-slate-500">Looking up place name…</p>
          )}
        </div>
      )}

      {expandOverlay}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Location of study
            <RequiredMark />
          </label>
          <input
            type="text"
            required
            value={value.location}
            onChange={(e) => onChange({ ...value, location: e.target.value })}
            placeholder="e.g. Dar es Salaam Region, Tanzania"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <InstitutionPicker
            value={value.institution || ""}
            onChange={(institution) => onChange({ ...value, institution })}
            label="Institution / affiliation"
            placeholder="University, lab, organization, or affiliation…"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Study area (optional)</label>
          <input
            type="text"
            value={value.study_area || ""}
            onChange={(e) => onChange({ ...value, study_area: e.target.value })}
            placeholder="Region or study zone"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      {hasPin ? (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-100">
          <span className="font-medium text-slate-700">Coordinates: </span>
          {formatCoords(value.latitude, value.longitude)}
          <span className="text-slate-400"> · saved automatically</span>
        </p>
      ) : (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-100">
          Search for a place or pick on the map, then enter the location of study and your institution.
        </p>
      )}
    </div>
  );
}
