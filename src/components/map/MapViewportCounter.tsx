import { useCallback, useEffect } from "react";
import { useMap } from "react-leaflet";
import type { Publication } from "../../types";

interface Props {
  publications: Publication[];
  onCount: (visible: number) => void;
}

export function MapViewportCounter({ publications, onCount }: Props) {
  const map = useMap();

  const countInView = useCallback(() => {
    const bounds = map.getBounds();
    let n = 0;
    for (const pub of publications) {
      const lat = parseFloat(pub.coordinates?.latitude ?? "");
      const lng = parseFloat(pub.coordinates?.longitude ?? "");
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      if (bounds.contains([lat, lng])) n += 1;
    }
    onCount(n);
  }, [map, publications, onCount]);

  useEffect(() => {
    countInView();
    map.on("moveend", countInView);
    map.on("zoomend", countInView);
    return () => {
      map.off("moveend", countInView);
      map.off("zoomend", countInView);
    };
  }, [map, countInView]);

  return null;
}
