import { createContext, useContext, type PointerEvent as ReactPointerEvent } from "react";

export type MapPanelDragHandlers = {
  onPointerDown: (e: ReactPointerEvent) => void;
  onPointerMove: (e: ReactPointerEvent) => void;
  onPointerUp: (e: ReactPointerEvent) => void;
};

export type MapPanelLayoutValue = {
  expandUpward: boolean;
  isCompact: boolean;
  dragEnabled: boolean;
  dragHandlers: MapPanelDragHandlers;
};

const noop = () => {};

const defaultValue: MapPanelLayoutValue = {
  expandUpward: false,
  isCompact: false,
  dragEnabled: false,
  dragHandlers: {
    onPointerDown: noop,
    onPointerMove: noop,
    onPointerUp: noop,
  },
};

export const MapPanelLayoutContext = createContext(defaultValue);

export function useMapPanelLayout() {
  return useContext(MapPanelLayoutContext);
}
