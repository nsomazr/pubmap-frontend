import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

export function MapScaleControl() {
  const map = useMap();

  useEffect(() => {
    const scale = L.control.scale({
      imperial: false,
      position: "bottomleft",
    });
    scale.addTo(map);
    return () => {
      scale.remove();
    };
  }, [map]);

  return null;
}
