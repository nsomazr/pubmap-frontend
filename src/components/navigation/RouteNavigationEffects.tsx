import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Reset scroll and stray body locks when the route changes (prevents blank / frozen views after modals). */
export function RouteNavigationEffects() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.body.style.overflow = "";
    document.body.style.removeProperty("overflow");
    document.documentElement.style.overflow = "";
    document.documentElement.style.removeProperty("overflow");
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
