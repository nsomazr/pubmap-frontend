import { useCallback, useEffect } from "react";
import { useMap } from "react-leaflet";
import type { Publication } from "../../types";
import { safeMapOff, safeMapOp } from "../../lib/safeLeaflet";

interface Props {
  publications: Publication[];
  onCount: (visible: number) => void;
}

export function MapViewportCounter({ publications, onCount }: Props) {
  const map = useMap();

  const countInView = useCallback(() => {
    safeMapOp(map, (m) => {
      const bounds = m.getBounds();
      let n = 0;
      for (const pub of publications) {
        const lat = parseFloat(pub.coordinates?.latitude ?? "");
        const lng = parseFloat(pub.coordinates?.longitude ?? "");
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        if (bounds.contains([lat, lng])) n += 1;
      }
      onCount(n);
    });
  }, [map, publications, onCount]);

  useEffect(() => {
    countInView();
    safeMapOp(map, (m) => {
      m.on("moveend", countInView);
      m.on("zoomend", countInView);
    });
    return () => {
      safeMapOff(map, "moveend", countInView);
      safeMapOff(map, "zoomend", countInView);
    };
  }, [map, countInView]);

  return null;
}
