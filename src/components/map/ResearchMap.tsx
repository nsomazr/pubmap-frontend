import { useMap, ZoomControl } from "react-leaflet";
import { GreMapContainer } from "./GreMapContainer";
import { safeMapOp } from "../../lib/safeLeaflet";
import L from "leaflet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Publication } from "../../types";
import { PublicationMarkerLayer } from "./PublicationMarkerLayer";
import { MapExpandControl } from "./MapExpandControl";
import { MapRegionPicker } from "./MapRegionPicker";
import type { MapRegionSelection } from "../../types";
import { formatRegionRadiusLabel } from "../../lib/mapRegion";
import { MapBasemapTileLayer } from "./MapBasemapTileLayer";
import { MapHeatLayer } from "./MapHeatLayer";
import { MapScaleControl } from "./MapScaleControl";
import { MapViewportCounter } from "./MapViewportCounter";
import { MapInteractionHandlers } from "./MapInteractionHandlers";
import {
  MapAdvancedControls,
  loadMapDisplayPrefs,
  saveMapDisplayPrefs,
  type MapDisplayPrefs,
} from "./MapAdvancedControls";
import type { MapBasemapId } from "../../lib/mapBasemaps";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

function FitBounds({
  pubs,
  resetToken = 0,
}: {
  pubs: Publication[];
  resetToken?: number;
}) {
  const map = useMap();
  const lastFitKeyRef = useRef<string | null>(null);

  useEffect(() => {
    lastFitKeyRef.current = null;
  }, [resetToken]);

  const pubKey = useMemo(
    () =>
      pubs
        .filter((p) => p.coordinates?.latitude && p.coordinates?.longitude)
        .map((p) => p.id)
        .sort((a, b) => a - b)
        .join(","),
    [pubs]
  );

  useEffect(() => {
    if (!pubKey || lastFitKeyRef.current === pubKey) return;
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
      safeMapOp(map, (m) => {
        m.fitBounds(L.latLngBounds(coords), { padding: [60, 60], maxZoom: 8 });
        lastFitKeyRef.current = pubKey;
      });
    }
  }, [pubKey, pubs, map]);

  return null;
}

function FitMapRegion({ region }: { region: MapRegionSelection }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.circle([region.lat, region.lng], {
      radius: region.radiusKm * 1000,
    }).getBounds();
    safeMapOp(map, (m) => {
      m.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
    });
  }, [region, map]);
  return null;
}

interface Props {
  publications: Publication[];
  height?: string;
  className?: string;
  zoomPosition?: "bottomright" | "bottomleft" | "topright" | "topleft";
  focusPublicationId?: number | null;
  highlightedPublicationIds?: number[];
  /** Increment to refit the default map viewport (e.g. after clearing search). */
  mapViewResetToken?: number;
  variant?: "default" | "embedded";
  advancedControls?: boolean;
  mappedTotal?: number;
  mapExpanded?: boolean;
  onMapExpandedChange?: (expanded: boolean) => void;
  onPublicationSelect?: (publication: Publication | null) => void;
  mapPickMode?: boolean;
  mapRegion?: MapRegionSelection | null;
  onMapRegionPick?: (lat: number, lng: number) => void;
}

export function ResearchMap({
  publications,
  height = "calc(100vh - 4rem)",
  className = "",
  zoomPosition = "bottomright",
  focusPublicationId = null,
  highlightedPublicationIds = [],
  mapViewResetToken = 0,
  variant = "default",
  advancedControls,
  mappedTotal,
  mapExpanded = false,
  onMapExpandedChange,
  onPublicationSelect,
  mapPickMode = false,
  mapRegion = null,
  onMapRegionPick,
}: Props) {
  const withCoords = publications.filter(
    (p) => p.coordinates?.latitude && p.coordinates?.longitude
  );
  const embedded = variant === "embedded";
  const showAdvanced = advancedControls ?? !embedded;
  const useSheet = !embedded && Boolean(onPublicationSelect);
  const mapZoomPosition = embedded ? "topright" : zoomPosition;

  const [displayPrefs, setDisplayPrefs] = useState<MapDisplayPrefs>(loadMapDisplayPrefs);
  const [layersPanelOpen, setLayersPanelOpen] = useState(false);
  const [viewportCount, setViewportCount] = useState(0);

  const handlePrefsChange = useCallback((next: MapDisplayPrefs) => {
    setDisplayPrefs(next);
    saveMapDisplayPrefs(next);
  }, []);

  const handleViewportCount = useCallback((n: number) => {
    setViewportCount(n);
  }, []);

  const basemapId: MapBasemapId = showAdvanced
    ? displayPrefs.basemapId
    : "voyager";
  const darkBasemap =
    basemapId === "dark" || basemapId === "satellite";

  const totalMapped = mappedTotal ?? withCoords.length;

  return (
    <div
      style={{ height }}
      className={`gre-map ts-map relative w-full ${embedded ? "gre-map--embedded" : "gre-map--landing"} ${darkBasemap ? "gre-map--dark-basemap" : ""} ${mapPickMode ? "gre-map--pick-mode" : ""} ${className || "rounded-none border-0 shadow-none"}`}
    >
      {mapPickMode && (
        <div className="map-pick-banner pointer-events-none absolute left-1/2 top-3 z-[1002] max-w-[min(92vw,22rem)] -translate-x-1/2 rounded-full bg-brand-600/95 px-4 py-2 text-center text-xs font-semibold text-white shadow-lg">
          Click map to set region ({formatRegionRadiusLabel()})
        </div>
      )}

      {showAdvanced && (
        <MapAdvancedControls
          prefs={displayPrefs}
          onChange={handlePrefsChange}
          collapsed={!layersPanelOpen}
          onCollapsedChange={(collapsed) => setLayersPanelOpen(!collapsed)}
          viewportCount={viewportCount}
          mappedTotal={totalMapped}
        />
      )}

      <GreMapContainer
        center={[-6.37, 34.89]}
        zoom={5}
        className={`h-full w-full ${embedded ? "rounded-none" : ""}`}
        scrollWheelZoom
        touchZoom
        doubleClickZoom
        zoomControl={false}
        attributionControl={false}
      >
        <MapInteractionHandlers />
        <ZoomControl position={mapZoomPosition} />
        {showAdvanced && <MapScaleControl />}
        {!embedded && onMapExpandedChange && (
          <MapExpandControl
            expanded={mapExpanded}
            onToggle={() => onMapExpandedChange(!mapExpanded)}
          />
        )}
        <MapBasemapTileLayer basemapId={basemapId} />
        {showAdvanced && displayPrefs.showHeat && (
          <MapHeatLayer publications={withCoords} enabled />
        )}
        {showAdvanced && (
          <MapViewportCounter
            publications={withCoords}
            onCount={handleViewportCount}
          />
        )}
        {!focusPublicationId && !mapRegion && (
          <FitBounds pubs={withCoords} resetToken={mapViewResetToken} />
        )}
        {mapRegion && <FitMapRegion region={mapRegion} />}
        {onMapRegionPick && (
          <MapRegionPicker
            enabled={mapPickMode}
            region={mapRegion}
            onPick={onMapRegionPick}
          />
        )}
        <PublicationMarkerLayer
          publications={publications}
          focusPublicationId={focusPublicationId}
          highlightedPublicationIds={highlightedPublicationIds}
          embedded={embedded}
          useSheet={useSheet}
          clustered={showAdvanced ? displayPrefs.showClusters : true}
          onPublicationSelect={onPublicationSelect}
        />
      </GreMapContainer>
    </div>
  );
}
