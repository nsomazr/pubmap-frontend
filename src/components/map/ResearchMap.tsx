import { MapContainer, TileLayer, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import type { Publication } from "../../types";
import { PublicationMarkerLayer } from "./PublicationMarkerLayer";
import { MapExpandControl } from "./MapExpandControl";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

function FitBounds({ pubs }: { pubs: Publication[] }) {
  const map = useMap();
  useEffect(() => {
    const coords = pubs
      .filter((p) => p.coordinates?.latitude && p.coordinates?.longitude)
      .map(
        (p) =>
          [
            parseFloat(p.coordinates!.latitude),
            parseFloat(p.coordinates!.longitude),
          ] as [number, number]
      );
    if (coords.length > 0) {
      map.fitBounds(L.latLngBounds(coords), { padding: [60, 60], maxZoom: 8 });
    }
  }, [pubs, map]);
  return null;
}

interface Props {
  publications: Publication[];
  height?: string;
  className?: string;
  zoomPosition?: "bottomright" | "bottomleft" | "topright" | "topleft";
  focusPublicationId?: number | null;
  variant?: "default" | "embedded";
  mapExpanded?: boolean;
  onMapExpandedChange?: (expanded: boolean) => void;
  onPublicationSelect?: (publication: Publication | null) => void;
}

export function ResearchMap({
  publications,
  height = "calc(100vh - 4rem)",
  className = "",
  zoomPosition = "bottomright",
  focusPublicationId = null,
  variant = "default",
  mapExpanded = false,
  onMapExpandedChange,
  onPublicationSelect,
}: Props) {
  const withCoords = publications.filter(
    (p) => p.coordinates?.latitude && p.coordinates?.longitude
  );
  const embedded = variant === "embedded";
  const useSheet = !embedded && Boolean(onPublicationSelect);
  const mapZoomPosition = embedded ? "topright" : zoomPosition;

  return (
    <div
      style={{ height }}
      className={`gre-map ts-map relative w-full ${embedded ? "gre-map--embedded" : "gre-map--landing"} ${className || "rounded-none border-0 shadow-none"}`}
    >
      <MapContainer
        center={[-6.37, 34.89]}
        zoom={5}
        className={`h-full w-full ${embedded ? "rounded-none" : ""}`}
        scrollWheelZoom
        zoomControl={false}
      >
        <ZoomControl position={mapZoomPosition} />
        {!embedded && onMapExpandedChange && (
          <MapExpandControl
            expanded={mapExpanded}
            onToggle={() => onMapExpandedChange(!mapExpanded)}
          />
        )}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {!focusPublicationId && <FitBounds pubs={withCoords} />}
        <PublicationMarkerLayer
          publications={publications}
          focusPublicationId={focusPublicationId}
          embedded={embedded}
          useSheet={useSheet}
          onPublicationSelect={onPublicationSelect}
        />
      </MapContainer>
    </div>
  );
}
