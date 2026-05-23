import L from "leaflet";
import "leaflet.markercluster";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { createClusterIcon, createPublicationIcon } from "./mapMarkers";
import { buildPublicationPopupHtml } from "./publicationPopup";
import { attachPublicationPopupSummary } from "./publicationPopupSummary";
import { publicationSubcategoryVisual } from "../../lib/taxonomyVisuals";
import type { Publication } from "../../types";

const FOCUS_ZOOM = 13;

interface Props {
  publications: Publication[];
  focusPublicationId?: number | null;
}

export function PublicationMarkerLayer({ publications, focusPublicationId }: Props) {
  const map = useMap();
  const markersById = useRef<Map<number, L.Marker>>(new Map());
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const lastFocusRef = useRef<number | null>(null);

  useEffect(() => {
    const withCoords = publications.filter(
      (p) => p.coordinates?.latitude && p.coordinates?.longitude
    );

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 60,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: createClusterIcon,
    });

    markersById.current.clear();
    for (const pub of withCoords) {
      const subVisual = publicationSubcategoryVisual(pub);
      const accentColor = subVisual?.accent_color;
      const marker = L.marker(
        [
          parseFloat(pub.coordinates!.latitude),
          parseFloat(pub.coordinates!.longitude),
        ],
        {
          icon: createPublicationIcon(accentColor),
          accentColor,
        } as L.MarkerOptions & { accentColor?: string }
      );
      marker.bindPopup(buildPublicationPopupHtml(pub), {
        maxWidth: 280,
        className: "gre-map-popup",
        autoPan: true,
        autoPanPaddingTopLeft: L.point(24, 150),
        autoPanPaddingBottomRight: L.point(24, 80),
        keepInView: true,
      });
      markersById.current.set(pub.id, marker);
      cluster.addLayer(marker);
    }

    clusterRef.current = cluster;
    map.addLayer(cluster);

    const onClusterClick = (e: L.LeafletEvent) => {
      const layer = (e as L.LeafletEvent & { layer: L.MarkerCluster }).layer;
      const icon = layer.getElement?.();
      if (icon) {
        icon.classList.add("gre-cluster--expand");
        window.setTimeout(() => icon.classList.remove("gre-cluster--expand"), 480);
      }
    };
    const onSpiderfied = (e: L.LeafletEvent) => {
      const clusterLayer = (e as L.LeafletEvent & { cluster: L.MarkerCluster }).cluster;
      const icon = clusterLayer.getElement?.();
      if (icon) {
        icon.classList.add("gre-cluster--spiderfy");
        window.setTimeout(() => icon.classList.remove("gre-cluster--spiderfy"), 600);
      }
    };
    cluster.on("clusterclick", onClusterClick);
    cluster.on("spiderfied", onSpiderfied);

    const detachSummary = attachPublicationPopupSummary(map);

    return () => {
      cluster.off("clusterclick", onClusterClick);
      cluster.off("spiderfied", onSpiderfied);
      detachSummary();
      map.removeLayer(cluster);
      cluster.clearLayers();
      clusterRef.current = null;
      markersById.current.clear();
      lastFocusRef.current = null;
    };
  }, [publications, map]);

  useEffect(() => {
    if (!focusPublicationId) {
      lastFocusRef.current = null;
      return;
    }
    if (lastFocusRef.current === focusPublicationId) return;

    const pub = publications.find((p) => p.id === focusPublicationId);
    const marker = markersById.current.get(focusPublicationId);
    const cluster = clusterRef.current;
    if (!pub?.coordinates?.latitude || !pub.coordinates?.longitude || !marker || !cluster) {
      return;
    }

    const lat = parseFloat(pub.coordinates.latitude);
    const lng = parseFloat(pub.coordinates.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    lastFocusRef.current = focusPublicationId;
    map.flyTo([lat, lng], FOCUS_ZOOM, { duration: 0.85 });

    const timer = window.setTimeout(() => {
      cluster.zoomToShowLayer(marker, () => marker.openPopup());
    }, 900);

    return () => window.clearTimeout(timer);
  }, [focusPublicationId, publications, map]);

  return null;
}
