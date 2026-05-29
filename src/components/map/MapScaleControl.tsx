import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { safeMapOp } from "../../lib/safeLeaflet";

export function MapScaleControl() {
  const map = useMap();

  useEffect(() => {
    const scale = L.control.scale({
      imperial: false,
      position: "bottomleft",
    });
    safeMapOp(map, (m) => scale.addTo(m));
    return () => {
      safeMapOp(map, () => scale.remove());
    };
  }, [map]);

  return null;
}
