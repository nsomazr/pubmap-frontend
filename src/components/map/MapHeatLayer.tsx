import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat/dist/leaflet-heat.js";
import type { Publication } from "../../types";
import { safeMapOp, safeRemoveLayer } from "../../lib/safeLeaflet";

interface Props {
  publications: Publication[];
  enabled: boolean;
}

export function MapHeatLayer({ publications, enabled }: Props) {
  const map = useMap();

  useEffect(() => {
    if (!enabled) return;

    const points: [number, number, number][] = [];
    for (const pub of publications) {
      const lat = parseFloat(pub.coordinates?.latitude ?? "");
      const lng = parseFloat(pub.coordinates?.longitude ?? "");
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      points.push([lat, lng, 0.55]);
    }

    if (points.length === 0) return;

    const heat = L.heatLayer(points, {
      radius: 26,
      blur: 20,
      maxZoom: 14,
      minOpacity: 0.35,
      gradient: {
        0.2: "#0d9488",
        0.45: "#14b8a6",
        0.65: "#f59e0b",
        0.85: "#f97316",
        1: "#dc2626",
      },
    });
    heat.addTo(map);

    const layer = heat as L.HeatLayer & { _canvas?: HTMLCanvasElement };
    if (layer._canvas) {
      layer._canvas.style.pointerEvents = "none";
    }

    return () => {
      safeRemoveLayer(map, heat);
    };
  }, [map, publications, enabled]);

  return null;
}
