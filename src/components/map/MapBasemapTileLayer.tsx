import { TileLayer } from "react-leaflet";
import { getBasemap, type MapBasemapId } from "../../lib/mapBasemaps";

interface Props {
  basemapId: MapBasemapId;
}

export function MapBasemapTileLayer({ basemapId }: Props) {
  const basemap = getBasemap(basemapId);
  return (
    <TileLayer
      key={basemap.id}
      attribution={basemap.attribution}
      url={basemap.url}
      maxZoom={basemap.maxZoom}
    />
  );
}
