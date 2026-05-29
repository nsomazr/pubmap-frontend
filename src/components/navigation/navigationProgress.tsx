import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";

type NavigationProgressContextValue = {
  completeNavigation: () => void;
};

const NavigationProgressContext = createContext<NavigationProgressContextValue | null>(null);

const MAX_WAIT_MS = 12_000;
const TICK_MS = 180;

export function NavigationProgressProvider({ children }: { children: ReactNode }) {
  const { pathname, search, key } = useLocation();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const completedRef = useRef(false);
  const tickRef = useRef<number | null>(null);
  const maxWaitRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (tickRef.current != null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (maxWaitRef.current != null) {
      window.clearTimeout(maxWaitRef.current);
      maxWaitRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    clearTimers();
    setProgress(1);
    window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 220);
  }, [clearTimers]);

  const completeNavigation = useCallback(() => {
    finish();
  }, [finish]);

  useEffect(() => {
    completedRef.current = false;
    clearTimers();
    setVisible(true);
    setProgress(0.14);

    tickRef.current = window.setInterval(() => {
      setProgress((value) => {
        if (value >= 0.9) return value;
        const step = value < 0.45 ? 0.1 : value < 0.75 ? 0.05 : 0.02;
        return Math.min(value + step, 0.9);
      });
    }, TICK_MS);

    maxWaitRef.current = window.setTimeout(() => {
      finish();
    }, MAX_WAIT_MS);

    return () => {
      clearTimers();
    };
  }, [pathname, search, key, clearTimers, finish]);

  return (
    <NavigationProgressContext.Provider value={{ completeNavigation }}>
      {children}
      <div
        className={`gre-route-progress pointer-events-none fixed inset-x-0 top-0 z-[10050] h-[3px] transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        role="progressbar"
        aria-hidden={!visible}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <div
          className="gre-route-progress-bar h-full origin-left rounded-r-full bg-gradient-to-r from-brand-500 via-brand-600 to-teal-500 shadow-[0_0_12px_rgba(59,91,219,0.45)] transition-[width] duration-200 ease-out"
          style={{ width: `${Math.max(progress * 100, visible ? 8 : 0)}%` }}
        />
      </div>
    </NavigationProgressContext.Provider>
  );
}

/** Call when a route page has mounted (after lazy chunk load). */
export function RouteNavigationComplete() {
  const ctx = useContext(NavigationProgressContext);
  const { key } = useLocation();

  useEffect(() => {
    ctx?.completeNavigation();
  }, [ctx, key]);

  return null;
}

export function usePrefetchOnIntent(pathname: string) {
  return {
    onMouseEnter: () => {
      import("../../lib/routePrefetch").then(({ prefetchRoute }) => prefetchRoute(pathname));
    },
    onFocus: () => {
      import("../../lib/routePrefetch").then(({ prefetchRoute }) => prefetchRoute(pathname));
    },
  };
}
