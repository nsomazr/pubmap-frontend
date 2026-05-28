import { useEffect } from "react";
import { useMap } from "react-leaflet";

/** Ensures zoom gestures stay enabled (scroll, touch, double-click, controls). */
export function MapInteractionHandlers() {
  const map = useMap();

  useEffect(() => {
    map.scrollWheelZoom.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
  }, [map]);

  return null;
}
