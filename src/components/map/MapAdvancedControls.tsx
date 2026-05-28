import { Layers, Flame, CircleDot } from "lucide-react";
import {
  DEFAULT_BASEMAP_ID,
  MAP_BASEMAPS,
  type MapBasemapId,
} from "../../lib/mapBasemaps";

export interface MapDisplayPrefs {
  basemapId: MapBasemapId;
  showHeat: boolean;
  showClusters: boolean;
}

interface Props {
  prefs: MapDisplayPrefs;
  onChange: (next: MapDisplayPrefs) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  viewportCount?: number;
  mappedTotal?: number;
}

export function MapAdvancedControls({
  prefs,
  onChange,
  collapsed = false,
  onCollapsedChange,
  viewportCount,
  mappedTotal,
}: Props) {
  const set = (patch: Partial<MapDisplayPrefs>) => onChange({ ...prefs, ...patch });

  return (
    <div className="gre-map-advanced pointer-events-none absolute bottom-14 left-3 z-[1002] flex max-w-[min(92vw,20rem)] flex-col gap-2">
      <button
        type="button"
        className="pointer-events-auto flex w-fit flex-col items-start gap-0.5 rounded-2xl bg-white/95 px-3 py-2 text-left shadow-md ring-1 ring-slate-200/90 backdrop-blur-sm transition hover:bg-white"
        onClick={() => onCollapsedChange?.(!collapsed)}
        aria-expanded={!collapsed}
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-slate-800">
          <Layers className="h-3.5 w-3.5 text-brand-600" aria-hidden />
          Map layers
        </span>
        {viewportCount != null && (
          <span className="pl-5 text-[10px] font-medium text-slate-500" aria-live="polite">
            <span className="tabular-nums text-brand-700">{viewportCount}</span> in view
            {mappedTotal != null && mappedTotal > 0 && (
              <span className="text-slate-400"> · {mappedTotal} mapped</span>
            )}
          </span>
        )}
      </button>

      {!collapsed && (
        <div className="pointer-events-auto rounded-2xl bg-white/95 p-3 shadow-lg ring-1 ring-slate-200/90 backdrop-blur-sm">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Basemap
          </p>
          <div className="mb-3 flex flex-wrap gap-1">
            {MAP_BASEMAPS.map((row) => (
              <button
                key={row.id}
                type="button"
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  prefs.basemapId === row.id
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                onClick={() => set({ basemapId: row.id })}
              >
                {row.label}
              </button>
            ))}
          </div>

          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Overlays
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                checked={prefs.showHeat}
                onChange={(e) => set({ showHeat: e.target.checked })}
              />
              <Flame className="h-3.5 w-3.5 text-orange-500" aria-hidden />
              Density heatmap
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                checked={prefs.showClusters}
                onChange={(e) => set({ showClusters: e.target.checked })}
              />
              <CircleDot className="h-3.5 w-3.5 text-brand-600" aria-hidden />
              Cluster markers
            </label>
          </div>

          {prefs.showHeat && (
            <div className="mt-3 border-t border-slate-100 pt-2">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Density
              </p>
              <div
                className="h-2 w-full rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, #0d9488 0%, #14b8a6 35%, #f59e0b 65%, #f97316 85%, #dc2626 100%)",
                }}
                aria-hidden
              />
              <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const STORAGE_KEY = "gre-map-display-prefs-v1";

export function loadMapDisplayPrefs(): MapDisplayPrefs {
  if (typeof window === "undefined") {
    return {
      basemapId: DEFAULT_BASEMAP_ID,
      showHeat: false,
      showClusters: true,
    };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        basemapId: DEFAULT_BASEMAP_ID,
        showHeat: false,
        showClusters: true,
      };
    }
    const parsed = JSON.parse(raw) as Partial<MapDisplayPrefs>;
    const basemapId = MAP_BASEMAPS.some((b) => b.id === parsed.basemapId)
      ? (parsed.basemapId as MapBasemapId)
      : DEFAULT_BASEMAP_ID;
    return {
      basemapId,
      showHeat: Boolean(parsed.showHeat),
      showClusters: parsed.showClusters !== false,
    };
  } catch {
    return {
      basemapId: DEFAULT_BASEMAP_ID,
      showHeat: false,
      showClusters: true,
    };
  }
}

export function saveMapDisplayPrefs(prefs: MapDisplayPrefs) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore quota */
  }
}
