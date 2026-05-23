import "leaflet";

declare module "leaflet" {
  interface MarkerClusterGroupOptions {
    maxClusterRadius?: number;
    iconCreateFunction?: (cluster: MarkerCluster) => DivIcon;
    showCoverageOnHover?: boolean;
    zoomToBoundsOnClick?: boolean;
    spiderfyOnMaxZoom?: boolean;
  }

  interface MarkerCluster extends Marker {
    getChildCount(): number;
  }

  class MarkerClusterGroup extends FeatureGroup {
    addLayer(layer: Layer): this;
    clearLayers(): this;
    zoomToShowLayer(layer: Layer, callback?: () => void): void;
  }

  function markerClusterGroup(options?: MarkerClusterGroupOptions): MarkerClusterGroup;
}
