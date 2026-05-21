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

const STORAGE_KEY = "gre-map-search-position-v2";

interface Position {
  x: number;
  y: number;
}

interface Props {
  boundsRef: RefObject<HTMLElement | null>;
  children: ReactNode;
}

function loadPosition(): Position | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Position;
    if (typeof p.x === "number" && typeof p.y === "number") return p;
  } catch {
    /* ignore */
  }
  return null;
}

function savePosition(pos: Position) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
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

export function DraggableMapPanel({ boundsRef, children }: Props) {
  const isCompact = useIsMobile();
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
      const pw = panel.offsetWidth || 320;
      const defaultX = (bw - pw) / 2;
      const defaultY = 16;
      const x = candidate?.x ?? defaultX;
      const y = candidate?.y ?? defaultY;
      setPos(clampPosition(x, y));
      return true;
    },
    [boundsRef, clampPosition]
  );

  useLayoutEffect(() => {
    if (isCompact) return;
    const saved = loadPosition();
    if (applyPosition(saved)) return;
    const id = requestAnimationFrame(() => applyPosition(saved));
    return () => cancelAnimationFrame(id);
  }, [applyPosition, isCompact]);

  useLayoutEffect(() => {
    updateExpandDirection();
  }, [pos, updateExpandDirection]);

  useEffect(() => {
    if (isCompact) {
      setExpandUpward(false);
      return;
    }
    const onResize = () => {
      setPos((current) => (current ? clampPosition(current.x, current.y) : current));
      updateExpandDirection();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampPosition, updateExpandDirection, isCompact]);

  useEffect(() => {
    if (pos) savePosition(pos);
  }, [pos]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (isCompact || e.button !== 0) return;
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
  }, [pos, isCompact]);

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

  const style: CSSProperties | undefined = isCompact
    ? undefined
    : pos
      ? { left: pos.x, top: pos.y }
      : { left: "50%", top: 16, transform: "translateX(-50%)" };

  const orderedChildren = useMemo(() => {
    const items = Children.toArray(children);
    if (!expandUpward || items.length < 2) return items;
    return [...items].reverse();
  }, [children, expandUpward]);

  const layoutValue = useMemo(
    () => ({
      expandUpward: isCompact ? false : expandUpward,
      isCompact,
      dragHandlers: {
        onPointerDown,
        onPointerMove,
        onPointerUp,
      },
    }),
    [expandUpward, isCompact, onPointerDown, onPointerMove, onPointerUp]
  );

  return (
    <MapPanelLayoutContext.Provider value={layoutValue}>
      <div
        ref={panelRef}
        className={`map-draggable-panel pointer-events-none z-[1100] w-full max-w-lg px-3 sm:px-4 ${
          isCompact
            ? "map-draggable-panel--top fixed inset-x-0 top-0"
            : `absolute w-[min(100%,32rem)] ${expandUpward ? "map-draggable-panel--up" : ""}`
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
