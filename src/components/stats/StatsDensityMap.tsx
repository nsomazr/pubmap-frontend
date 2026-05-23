import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import type { PublicStatsHeatmapPoint } from "../../types";
import "leaflet/dist/leaflet.css";

interface Props {
  points: PublicStatsHeatmapPoint[];
  height?: string;
}

function radiusForCount(count: number, max: number) {
  const minR = 8;
  const maxR = 36;
  if (max <= 0) return minR;
  return minR + (count / max) * (maxR - minR);
}

export function StatsDensityMap({ points, height = "22rem" }: Props) {
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
      <MapContainer center={center} zoom={3} className="h-full w-full" scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((point) => (
          <CircleMarker
            key={point.country}
            center={[point.latitude, point.longitude]}
            radius={radiusForCount(point.count, max)}
            pathOptions={{
              color: "#0d9488",
              fillColor: "#3b82f6",
              fillOpacity: 0.45,
              weight: 1,
            }}
          >
            <Tooltip direction="top" offset={[0, -4]} opacity={0.95}>
              <span className="font-semibold">{point.country}</span>
              <br />
              {point.count.toLocaleString()} publications
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
