import { RouteNavigationComplete } from "./navigationProgress";

/** Marks navigation complete for eagerly loaded routes (e.g. home). */
export function EagerRouteComplete() {
  return <RouteNavigationComplete />;
}
