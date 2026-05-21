import L from "leaflet";
import "leaflet.markercluster";
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { createClusterIcon, createPublicationIcon } from "./mapMarkers";
import { buildPublicationPopupHtml } from "./publicationPopup";
import { attachPublicationPopupSummary } from "./publicationPopupSummary";
import type { Publication } from "../../types";

interface Props {
  publications: Publication[];
}

export function PublicationMarkerLayer({ publications }: Props) {
  const map = useMap();

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

    for (const pub of withCoords) {
      const marker = L.marker(
        [
          parseFloat(pub.coordinates!.latitude),
          parseFloat(pub.coordinates!.longitude),
        ],
        { icon: createPublicationIcon() }
      );
      marker.bindPopup(buildPublicationPopupHtml(pub), {
        maxWidth: 280,
        className: "gre-map-popup",
        autoPan: true,
        autoPanPaddingTopLeft: L.point(24, 150),
        autoPanPaddingBottomRight: L.point(24, 80),
        keepInView: true,
      });
      cluster.addLayer(marker);
    }

    map.addLayer(cluster);
    const detachSummary = attachPublicationPopupSummary(map);

    return () => {
      detachSummary();
      map.removeLayer(cluster);
      cluster.clearLayers();
    };
  }, [publications, map]);

  return null;
}
