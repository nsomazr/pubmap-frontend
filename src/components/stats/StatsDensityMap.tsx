import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import { CircleMarker, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import { GreMapContainer } from "../map/GreMapContainer";
import { safeMapOp } from "../../lib/safeLeaflet";
import type { PublicStatsHeatmapPoint } from "../../types";
import { buildMapLocationPath } from "../../lib/mapDeepLink";
import "leaflet/dist/leaflet.css";

interface Props {
  points: PublicStatsHeatmapPoint[];
  height?: string;
  selectedCountry?: string | null;
  onCountrySelect?: (country: string) => void;
}

function radiusForCount(count: number, max: number) {
  const minR = 8;
  const maxR = 36;
  if (max <= 0) return minR;
  return minR + (count / max) * (maxR - minR);
}

function FlyToCountry({
  points,
  selectedCountry,
}: {
  points: PublicStatsHeatmapPoint[];
  selectedCountry?: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedCountry) return;
    const point = points.find((row) => row.country === selectedCountry);
    if (!point) return;
    safeMapOp(map, (m) => {
      m.flyTo([point.latitude, point.longitude], 5, { duration: 0.65 });
    });
  }, [map, points, selectedCountry]);

  return null;
}

function CountryMarker({
  point,
  max,
  selected,
  onSelect,
}: {
  point: PublicStatsHeatmapPoint;
  max: number;
  selected: boolean;
  onSelect?: (country: string) => void;
}) {
  const markerRef = useRef<L.CircleMarker>(null);

  useEffect(() => {
    if (selected) {
      markerRef.current?.openPopup();
      return;
    }
    markerRef.current?.closePopup();
  }, [selected]);

  return (
    <CircleMarker
      ref={markerRef}
      center={[point.latitude, point.longitude]}
      radius={radiusForCount(point.count, max)}
      pathOptions={{
        color: selected ? "#0f766e" : "#64748b",
        fillColor: selected ? "#14b8a6" : "#94a3b8",
        fillOpacity: selected ? 0.55 : 0.35,
        weight: selected ? 2 : 1,
      }}
      eventHandlers={{
        click: () => onSelect?.(point.country),
      }}
    >
      <Tooltip direction="top" offset={[0, -4]} opacity={0.95}>
        <span className="font-semibold">{point.country}</span>
        <br />
        {point.count.toLocaleString()} publications
      </Tooltip>
      <Popup closeButton autoPan className="stats-density-popup">
        <div className="min-w-[10rem] space-y-2 text-sm">
          <p className="font-semibold text-ink">{point.country}</p>
          <p className="text-slate-600">
            {point.count.toLocaleString()} published{" "}
            {point.count === 1 ? "study" : "studies"} in this region
          </p>
          <Link
            to={buildMapLocationPath(point.country)}
            className="stats-density-popup-action inline-flex items-center rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold no-underline transition hover:bg-brand-700"
          >
            View studies on map
          </Link>
        </div>
      </Popup>
    </CircleMarker>
  );
}

export function StatsDensityMap({
  points,
  height = "22rem",
  selectedCountry,
  onCountrySelect,
}: Props) {
  if (points.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500 ring-1 ring-slate-200"
        style={{ height }}
      >
        Map heatmap appears when publications include coordinates.
      </div>
    );
  }

  const max = Math.max(...points.map((p) => p.count), 1);
  const center: [number, number] = [
    points.reduce((sum, p) => sum + p.latitude, 0) / points.length,
    points.reduce((sum, p) => sum + p.longitude, 0) / points.length,
  ];

  return (
    <div
      className="gre-map overflow-hidden rounded-2xl ring-1 ring-slate-200"
      style={{ height }}
    >
      <GreMapContainer center={center} zoom={3} className="h-full w-full" scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyToCountry points={points} selectedCountry={selectedCountry} />
        {points.map((point) => (
          <CountryMarker
            key={point.country}
            point={point}
            max={max}
            selected={selectedCountry === point.country}
            onSelect={onCountrySelect}
          />
        ))}
      </GreMapContainer>
    </div>
  );
}
