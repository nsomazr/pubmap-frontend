import { MapContainer, TileLayer, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import { useCallback, useEffect, useState } from "react";
import type { Publication } from "../../types";
import { MapFocusedPublicationCard } from "./MapFocusedPublicationCard";
import { GRE_SUMMARY_REQUEST, type GreSummaryRequestDetail } from "./publicationPopupSummary";
import { PublicationMarkerLayer } from "./PublicationMarkerLayer";
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

/** Hide the embedded bottom card while a Leaflet popup is open on the marker. */
function EmbeddedPopupOverlaySync({
  onPopupOpen,
  onPopupOpenAgain,
}: {
  onPopupOpen: (open: boolean) => void;
  onPopupOpenAgain?: () => void;
}) {
  const map = useMap();

  useEffect(() => {
    const handleOpen = () => {
      onPopupOpenAgain?.();
      onPopupOpen(true);
    };
    const handleClose = () => onPopupOpen(false);
    map.on("popupopen", handleOpen);
    map.on("popupclose", handleClose);
    return () => {
      map.off("popupopen", handleOpen);
      map.off("popupclose", handleClose);
    };
  }, [map, onPopupOpen, onPopupOpenAgain]);

  return null;
}

interface Props {
  publications: Publication[];
  height?: string;
  className?: string;
  zoomPosition?: "bottomright" | "bottomleft" | "topright" | "topleft";
  focusPublicationId?: number | null;
  variant?: "default" | "embedded";
}

export function ResearchMap({
  publications,
  height = "calc(100vh - 4rem)",
  className = "",
  zoomPosition = "bottomright",
  focusPublicationId = null,
  variant = "default",
}: Props) {
  const withCoords = publications.filter(
    (p) => p.coordinates?.latitude && p.coordinates?.longitude
  );
  const focusedPublication =
    focusPublicationId != null
      ? publications.find((pub) => pub.id === focusPublicationId) ?? null
      : null;
  const embedded = variant === "embedded";
  const mapZoomPosition = embedded ? "topright" : zoomPosition;
  const [embeddedPopupOpen, setEmbeddedPopupOpen] = useState(false);
  const [overlaySuppressed, setOverlaySuppressed] = useState(false);
  const [overlayDismissed, setOverlayDismissed] = useState(false);

  useEffect(() => {
    setOverlayDismissed(false);
  }, [focusPublicationId]);

  useEffect(() => {
    if (!embedded || focusPublicationId == null) return;
    const onSummary = (e: Event) => {
      const { publicationId } = (e as CustomEvent<GreSummaryRequestDetail>).detail;
      if (publicationId === focusPublicationId) {
        setOverlaySuppressed(true);
      }
    };
    window.addEventListener(GRE_SUMMARY_REQUEST, onSummary);
    return () => window.removeEventListener(GRE_SUMMARY_REQUEST, onSummary);
  }, [embedded, focusPublicationId]);

  const showEmbeddedOverlay =
    embedded &&
    focusedPublication &&
    !embeddedPopupOpen &&
    !overlaySuppressed &&
    !overlayDismissed;

  return (
    <div
      style={{ height }}
      className={`gre-map ts-map relative w-full ${embedded ? "gre-map--embedded" : "gre-map--landing"} ${className || "rounded-none border-0 shadow-none"}`}
    >
      <MapContainer
        center={[-6.37, 34.89]}
        zoom={5}
        className={`h-full w-full ${embedded ? "rounded-b-3xl" : ""}`}
        scrollWheelZoom
        zoomControl={false}
      >
        <ZoomControl position={mapZoomPosition} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {!focusPublicationId && <FitBounds pubs={withCoords} />}
        <PublicationMarkerLayer
          publications={publications}
          focusPublicationId={focusPublicationId}
          embedded={embedded}
        />
        {embedded && (
          <EmbeddedPopupOverlaySync
            onPopupOpen={setEmbeddedPopupOpen}
            onPopupOpenAgain={() => setOverlaySuppressed(false)}
          />
        )}
      </MapContainer>
      {showEmbeddedOverlay && (
        <MapFocusedPublicationCard
          publication={focusedPublication}
          onClose={() => setOverlayDismissed(true)}
        />
      )}
    </div>
  );
}
