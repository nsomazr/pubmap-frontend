import {
  Children,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { MapPanelLayoutContext } from "../../context/MapPanelLayoutContext";
import { useIsMobile } from "../../hooks/useMediaQuery";

const DEFAULT_STORAGE_KEY = "gre-map-search-position-v2";

interface Position {
  x: number;
  y: number;
}

export type DraggableMapPanelLayout = "search-bar" | "floating-card";

interface Props {
  boundsRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  storageKey?: string;
  /** search-bar: pinned under nav on mobile. floating-card: draggable everywhere. */
  layout?: DraggableMapPanelLayout;
}

function loadPosition(key: string): Position | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const p = JSON.parse(raw) as Position;
    if (typeof p.x === "number" && typeof p.y === "number") return p;
  } catch {
    /* ignore */
  }
  return null;
}

function savePosition(key: string, pos: Position) {
  try {
    sessionStorage.setItem(key, JSON.stringify(pos));
  } catch {
    /* ignore */
  }
}

function computeExpandUpward(
  pos: Position | null,
  boundsEl: HTMLElement | null,
  panelEl: HTMLElement | null
): boolean {
  if (!pos || !boundsEl || !panelEl) return false;
  const bh = boundsEl.clientHeight;
  const ph = panelEl.offsetHeight;
  if (bh <= 0 || ph <= 0) return false;
  const panelBottom = pos.y + ph;
  return panelBottom > bh * 0.58;
}

export function DraggableMapPanel({
  boundsRef,
  children,
  storageKey = DEFAULT_STORAGE_KEY,
  layout = "search-bar",
}: Props) {
  const isCompact = useIsMobile();
  const isFloating = layout === "floating-card";
  const mobilePinned = isCompact && !isFloating;
  const dragEnabled = !mobilePinned;
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Position | null>(null);
  const [expandUpward, setExpandUpward] = useState(false);
  const dragState = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const updateExpandDirection = useCallback(() => {
    setExpandUpward(
      computeExpandUpward(pos, boundsRef.current, panelRef.current)
    );
  }, [pos, boundsRef]);

  const clampPosition = useCallback(
    (x: number, y: number): Position => {
      const bounds = boundsRef.current;
      const panel = panelRef.current;
      if (!bounds || !panel) return { x, y };

      const margin = 12;
      const bw = bounds.clientWidth;
      const bh = bounds.clientHeight;
      const pw = panel.offsetWidth;
      const ph = panel.offsetHeight;
      return {
        x: Math.min(Math.max(margin, x), Math.max(margin, bw - pw - margin)),
        y: Math.min(Math.max(margin, y), Math.max(margin, bh - ph - margin)),
      };
    },
    [boundsRef]
  );

  const applyPosition = useCallback(
    (candidate?: Position | null) => {
      const bounds = boundsRef.current;
      const panel = panelRef.current;
      if (!bounds || !panel) return false;

      const bw = bounds.clientWidth;
      const bh = bounds.clientHeight;
      const pw = panel.offsetWidth || 320;
      const ph = panel.offsetHeight || 200;
      const margin = 12;

      let defaultX = (bw - pw) / 2;
      let defaultY = 16;

      if (isFloating) {
        defaultX = Math.max(margin, bw - pw - margin);
        defaultY = Math.max(margin, bh - ph - (isCompact ? 72 : 24));
      }

      const x = candidate?.x ?? defaultX;
      const y = candidate?.y ?? defaultY;
      setPos(clampPosition(x, y));
      return true;
    },
    [boundsRef, clampPosition, isCompact, isFloating]
  );

  useLayoutEffect(() => {
    if (mobilePinned) return;
    const saved = loadPosition(storageKey);
    if (applyPosition(saved)) return;
    const id = requestAnimationFrame(() => applyPosition(saved));
    return () => cancelAnimationFrame(id);
  }, [applyPosition, mobilePinned, storageKey]);

  useLayoutEffect(() => {
    updateExpandDirection();
  }, [pos, updateExpandDirection]);

  useEffect(() => {
    if (mobilePinned) {
      setExpandUpward(false);
      return;
    }
    const onResize = () => {
      setPos((current) => (current ? clampPosition(current.x, current.y) : current));
      updateExpandDirection();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampPosition, updateExpandDirection, mobilePinned]);

  useEffect(() => {
    if (pos) savePosition(storageKey, pos);
  }, [pos, storageKey]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!dragEnabled || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const current = pos ?? { x: 0, y: 16 };
    dragState.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: current.x,
      originY: current.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos, dragEnabled]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    setPos(clampPosition(drag.originX + dx, drag.originY + dy));
  }, [clampPosition]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (dragState.current?.pointerId === e.pointerId) {
      dragState.current = null;
      requestAnimationFrame(updateExpandDirection);
    }
  }, [updateExpandDirection]);

  const style: CSSProperties | undefined = mobilePinned
    ? undefined
    : pos
      ? { left: pos.x, top: pos.y }
      : isFloating
        ? undefined
        : { left: "50%", top: 16, transform: "translateX(-50%)" };

  const orderedChildren = useMemo(() => {
    const items = Children.toArray(children);
    if (!expandUpward || items.length < 2) return items;
    return [...items].reverse();
  }, [children, expandUpward]);

  const layoutValue = useMemo(
    () => ({
      expandUpward: mobilePinned ? false : expandUpward,
      isCompact,
      dragEnabled,
      dragHandlers: {
        onPointerDown,
        onPointerMove,
        onPointerUp,
      },
    }),
    [expandUpward, isCompact, dragEnabled, onPointerDown, onPointerMove, onPointerUp]
  );

  return (
    <MapPanelLayoutContext.Provider value={layoutValue}>
      <div
        ref={panelRef}
        className={`map-draggable-panel pointer-events-none w-full max-w-lg px-3 sm:px-4 ${
          mobilePinned
            ? "map-draggable-panel--top fixed inset-x-0 top-0 z-[1100]"
            : `absolute z-[1150] ${expandUpward ? "map-draggable-panel--up" : ""} ${
                isFloating ? "map-draggable-panel--floating w-[min(100%,22rem)]" : "w-[min(100%,32rem)]"
              }`
        }`}
        style={style}
      >
        <div className="pointer-events-auto flex w-full flex-col gap-3">
          {orderedChildren}
        </div>
      </div>
    </MapPanelLayoutContext.Provider>
  );
}
