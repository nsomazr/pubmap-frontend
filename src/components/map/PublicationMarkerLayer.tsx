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
const LANDING_POPUP_BOTTOM_PAD = 148;
const LANDING_POPUP_TOP_PAD = 160;
const EMBEDDED_FOCUS_ZOOM = 10;

interface Props {
  publications: Publication[];
  focusPublicationId?: number | null;
  embedded?: boolean;
  useSheet?: boolean;
  clustered?: boolean;
  onPublicationSelect?: (publication: Publication | null) => void;
}

export function PublicationMarkerLayer({
  publications,
  focusPublicationId,
  embedded = false,
  useSheet = false,
  clustered = true,
  onPublicationSelect,
}: Props) {
  const map = useMap();
  const markersById = useRef<Map<number, L.Marker>>(new Map());
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const lastFocusRef = useRef<number | null>(null);
  const onPublicationSelectRef = useRef(onPublicationSelect);

  useEffect(() => {
    onPublicationSelectRef.current = onPublicationSelect;
  }, [onPublicationSelect]);

  useEffect(() => {
    const withCoords = publications.filter(
      (p) => p.coordinates?.latitude && p.coordinates?.longitude
    );

    const cluster = clustered
      ? L.markerClusterGroup({
          maxClusterRadius: 60,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          spiderfyOnMaxZoom: true,
          iconCreateFunction: createClusterIcon,
        })
      : null;

    const layerGroup = clustered ? null : L.layerGroup();

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

      if (useSheet) {
        marker.on("click", (event) => {
          L.DomEvent.stopPropagation(event);
          onPublicationSelectRef.current?.(pub);
        });
      } else if (!embedded) {
        marker.bindPopup(buildPublicationPopupHtml(pub, { variant: "default" }), {
          maxWidth: 280,
          className: "gre-map-popup",
          autoPan: true,
          autoPanPaddingTopLeft: L.point(24, LANDING_POPUP_TOP_PAD),
          autoPanPaddingBottomRight: L.point(24, LANDING_POPUP_BOTTOM_PAD),
          offset: L.point(0, -8),
          keepInView: true,
          closeButton: true,
          autoClose: true,
          closeOnClick: true,
        });
      }

      markersById.current.set(pub.id, marker);
      if (cluster) {
        cluster.addLayer(marker);
      } else {
        layerGroup!.addLayer(marker);
      }
    }

    clusterRef.current = cluster;
    if (cluster) {
      map.addLayer(cluster);
    } else if (layerGroup) {
      map.addLayer(layerGroup);
    }

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
    if (cluster) {
      cluster.on("clusterclick", onClusterClick);
      cluster.on("spiderfied", onSpiderfied);
    }

    const onMapClick = () => {
      if (useSheet) onPublicationSelectRef.current?.(null);
    };
    if (useSheet) {
      map.on("click", onMapClick);
    }

    const detachSummary = useSheet ? () => {} : attachPublicationPopupSummary(map);

    return () => {
      if (cluster) {
        cluster.off("clusterclick", onClusterClick);
        cluster.off("spiderfied", onSpiderfied);
        map.removeLayer(cluster);
        cluster.clearLayers();
      } else if (layerGroup) {
        map.removeLayer(layerGroup);
        layerGroup.clearLayers();
      }
      if (useSheet) {
        map.off("click", onMapClick);
      }
      detachSummary();
      clusterRef.current = null;
      markersById.current.clear();
      lastFocusRef.current = null;
    };
  }, [publications, map, embedded, useSheet, clustered]);

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
    const zoom = embedded ? EMBEDDED_FOCUS_ZOOM : FOCUS_ZOOM;
    map.flyTo([lat, lng], zoom, { duration: 0.85 });

    const timer = window.setTimeout(() => {
      const reveal = () => {
        if (embedded) return;
        if (useSheet) {
          onPublicationSelectRef.current?.(pub);
          return;
        }
        marker.openPopup();
      };
      if (cluster) {
        cluster.zoomToShowLayer(marker, reveal);
      } else {
        reveal();
      }
    }, 900);

    return () => window.clearTimeout(timer);
  }, [focusPublicationId, publications, map, embedded, useSheet]);

  return null;
}
