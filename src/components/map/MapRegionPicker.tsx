import { Circle, Marker } from "react-leaflet";
import { useMapEvents } from "react-leaflet";
import type { MapRegionSelection } from "../../types";

type Props = {
  enabled: boolean;
  region: MapRegionSelection | null;
  onPick: (lat: number, lng: number) => void;
};

export function MapRegionPicker({ enabled, region, onPick }: Props) {
  useMapEvents({
    click(event) {
      if (!enabled) return;
      const { lat, lng } = event.latlng;
      window.setTimeout(() => onPick(lat, lng), 0);
    },
  });

  if (!region) return null;

  return (
    <>
      <Marker position={[region.lat, region.lng]} />
      <Circle
        center={[region.lat, region.lng]}
        radius={region.radiusKm * 1000}
        pathOptions={{
          color: "#3b5bdb",
          fillColor: "#3b5bdb",
          fillOpacity: 0.12,
          weight: 2,
        }}
      />
    </>
  );
}
