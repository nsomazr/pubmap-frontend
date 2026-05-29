import { Maximize2, Minimize2 } from "lucide-react";
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { safeMapOp } from "../../lib/safeLeaflet";

interface Props {
  expanded: boolean;
  onToggle: () => void;
}

function MapResizeWatcher({ expanded }: { expanded: boolean }) {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      safeMapOp(map, (m) => m.invalidateSize({ animate: false }));
    }, 60);
    return () => window.clearTimeout(timer);
  }, [expanded, map]);

  return null;
}

export function MapExpandControl({ expanded, onToggle }: Props) {
  return (
    <>
      <MapResizeWatcher expanded={expanded} />
      <div className="leaflet-top leaflet-right map-expand-control">
        <div className="leaflet-control leaflet-bar map-expand-control-inner">
          <button
            type="button"
            onClick={onToggle}
            className="map-expand-control-btn"
            aria-label={expanded ? "Exit expanded map" : "Expand map"}
            title={expanded ? "Exit expanded map" : "Expand map"}
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </>
  );
}
