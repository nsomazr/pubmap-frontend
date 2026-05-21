import L from "leaflet";
import { assets } from "../../lib/brand";

const BRAND_BLUE = "#4169e1";

/** Document marker — matches legacy star.svg publication pin */
export function createPublicationIcon(): L.Icon {
  return L.icon({
    iconUrl: assets.star,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -20],
  });
}

/** Blue concentric cluster with publication count (legacy GRE map style) */
export function createClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount();
  const size = count < 10 ? 48 : count < 100 ? 52 : 56;
  const inner = count < 10 ? 36 : count < 100 ? 40 : 44;

  return L.divIcon({
    html: `
      <div class="gre-cluster" style="width:${size + 20}px;height:${size}px">
        <img src="${assets.star}" class="gre-cluster-doc" width="18" height="18" alt="" />
        <div class="gre-cluster-badge" style="width:${size}px;height:${size}px">
          <div class="gre-cluster-outer" style="width:${size}px;height:${size}px"></div>
          <div class="gre-cluster-inner" style="width:${inner}px;height:${inner}px;background:${BRAND_BLUE}">
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
