import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { safeMapOp } from "../../lib/safeLeaflet";

/** Ensures zoom gestures stay enabled (scroll, touch, double-click, controls). */
export function MapInteractionHandlers() {
  const map = useMap();

  useEffect(() => {
    safeMapOp(map, (m) => {
      m.scrollWheelZoom.enable();
      m.touchZoom.enable();
      m.doubleClickZoom.enable();
      m.boxZoom.enable();
      m.keyboard.enable();
    });
  }, [map]);

  return null;
}
