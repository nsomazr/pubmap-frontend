import { useEffect, useRef, type ReactNode } from "react";
import { MapContainer, type MapContainerProps } from "react-leaflet";
import { clearLeafletContainer } from "../../lib/safeLeaflet";

type Props = MapContainerProps & {
  children: ReactNode;
};

/**
 * MapContainer wrapper that clears Leaflet's container id on unmount so remounts
 * after client-side navigation do not throw "already initialized".
 */
export function GreMapContainer({ children, ...props }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const instanceKeyRef = useRef(`gre-map-${Math.random().toString(36).slice(2, 11)}`);

  useEffect(() => {
    return () => {
      const host = hostRef.current;
      const leafletRoot = host?.querySelector(".leaflet-container") as HTMLElement | null;
      clearLeafletContainer(leafletRoot ?? host);
    };
  }, []);

  return (
    <div ref={hostRef} className="gre-map-host h-full w-full">
      <MapContainer key={instanceKeyRef.current} {...props}>
        {children}
      </MapContainer>
    </div>
  );
}
