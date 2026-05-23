import L from "leaflet";
import { assets } from "../../lib/brand";
import { DEFAULT_ACCENT } from "../../lib/taxonomyVisuals";

const BRAND_BLUE = "#4169e1";

/** Publication pin  -  tinted by subcategory accent when provided */
export function createPublicationIcon(accentColor = DEFAULT_ACCENT): L.DivIcon {
  const color = accentColor || BRAND_BLUE;
  return L.divIcon({
    html: `
      <div class="gre-pub-marker" style="--accent:${color}">
        <span class="gre-pub-marker__halo"></span>
        <img src="${assets.star}" class="gre-pub-marker__star" width="18" height="18" alt="" />
      </div>
    `,
    className: "gre-pub-marker-wrap",
    iconSize: [26, 30],
    iconAnchor: [13, 28],
    popupAnchor: [0, -24],
  });
}

/** Blue concentric cluster with publication count (legacy GRE map style) */
export function createClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount();
  const size = count < 10 ? 48 : count < 100 ? 52 : 56;
  const inner = count < 10 ? 36 : count < 100 ? 40 : 44;

  let accent = BRAND_BLUE;
  const clusterWithChildren = cluster as L.MarkerCluster & {
    getAllChildMarkers(): L.Marker[];
  };
  const children = clusterWithChildren.getAllChildMarkers?.() ?? [];
  if (children.length > 0) {
    const first = children[0] as L.Marker & { options: { accentColor?: string } };
    accent = first.options.accentColor || BRAND_BLUE;
  }

  return L.divIcon({
    html: `
      <div class="gre-cluster" style="width:${size + 20}px;height:${size}px;--cluster-accent:${accent}">
        <img src="${assets.star}" class="gre-cluster-doc" width="18" height="18" alt="" />
        <div class="gre-cluster-badge" style="width:${size}px;height:${size}px">
          <div class="gre-cluster-outer" style="width:${size}px;height:${size}px"></div>
          <div class="gre-cluster-inner" style="width:${inner}px;height:${inner}px;background:${accent}">
            <span>${count}</span>
          </div>
        </div>
      </div>
    `,
    className: "gre-cluster-icon",
    iconSize: L.point(size + 20, size),
    iconAnchor: L.point((size + 20) / 2, size / 2),
  });
}
