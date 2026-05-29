import type { Layer, LeafletEventHandlerFn, Map as LeafletMap } from "leaflet";

/** True when the Leaflet map instance is still attached to the DOM. */
export function isMapUsable(map: LeafletMap | null | undefined): map is LeafletMap {
  if (!map) return false;
  try {
    const container = map.getContainer?.();
    return Boolean(container && container.isConnected);
  } catch {
    return false;
  }
}

/** Run a Leaflet operation only while the map is still mounted (e.g. after route change). */
export function safeMapOp(map: LeafletMap | null | undefined, fn: (map: LeafletMap) => void): void {
  if (!isMapUsable(map)) return;
  try {
    fn(map);
  } catch {
    /* map torn down during navigation */
  }
}

export function safeRemoveLayer(map: LeafletMap | null | undefined, layer: Layer): void {
  safeMapOp(map, (m) => {
    if (m.hasLayer(layer)) {
      m.removeLayer(layer);
    }
  });
}

export function safeMapOff(
  map: LeafletMap | null | undefined,
  types: string,
  fn: LeafletEventHandlerFn
): void {
  safeMapOp(map, (m) => {
    m.off(types, fn);
  });
}

/** Prevents "Map container is already initialized" when React remounts quickly. */
export function clearLeafletContainer(container: HTMLElement | null | undefined): void {
  if (!container) return;
  const el = container as HTMLElement & { _leaflet_id?: number };
  if (el._leaflet_id != null) {
    delete el._leaflet_id;
  }
  el.replaceChildren();
}
