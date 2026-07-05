import { useMemo, useState } from "react";
import { buildChartSlices, type ChartSlice } from "../../lib/chartSlices";

export type CompositionChartItem = {
  id: string;
  label: string;
  hint?: string;
  value: number;
};

interface Props {
  items: CompositionChartItem[];
  caption?: string;
  emptyMessage?: string;
}

function TreemapTile({
  slice,
  total,
  selected,
  dimmed,
  onSelect,
}: {
  slice: ChartSlice;
  total: number;
  selected: boolean;
  dimmed: boolean;
  onSelect: (id: string) => void;
}) {
  const pct = total > 0 ? (slice.value / total) * 100 : 0;
  const minWidth = slice.value > 0 ? "min(100%, 7rem)" : undefined;

  return (
    <button
      type="button"
      onClick={() => onSelect(slice.id)}
      aria-pressed={selected}
      className={`gre-interactive relative flex min-h-[4.5rem] flex-col justify-end overflow-hidden rounded-xl p-3 text-left transition ${
        selected ? "ring-2 ring-ink ring-offset-2" : "hover:brightness-95"
      }`}
      style={{
        flex: `${slice.value} 1 ${minWidth ?? "auto"}`,
        backgroundColor: slice.color,
        opacity: dimmed ? 0.45 : 1,
        minWidth: pct < 12 ? "5.5rem" : undefined,
      }}
      title={`${slice.label}${slice.hint ? ` · ${slice.hint}` : ""} · ${slice.value} (${slice.share})`}
    >
      <span className="relative z-[1] line-clamp-2 text-sm font-semibold leading-snug text-white drop-shadow-sm">
        {slice.label}
      </span>
      {slice.hint ? (
        <span className="relative z-[1] mt-0.5 line-clamp-1 text-[11px] font-medium text-white/85">
          {slice.hint}
        </span>
      ) : null}
      <span className="relative z-[1] mt-2 text-xs font-bold tabular-nums text-white/95">
        {slice.value.toLocaleString()} · {slice.share}
      </span>
      <span
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 to-black/10"
        aria-hidden
      />
    </button>
  );
}

export function CompositionChart({
  items,
  caption,
  emptyMessage = "No data yet",
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { slices, total } = useMemo(() => {
    const sliceRows = buildChartSlices(items);
    const sum = items.reduce((acc, item) => acc + item.value, 0);
    return { slices: sliceRows, total: sum };
  }, [items]);

  if (items.length === 0) {
    return (
      <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {caption ? <p className="text-xs text-slate-500">{caption}</p> : null}

      <div className="flex min-h-[11rem] flex-wrap gap-2">
        {slices.map((slice) => (
          <TreemapTile
            key={slice.id}
            slice={slice}
            total={total}
            selected={selectedId === slice.id}
            dimmed={selectedId != null && selectedId !== slice.id}
            onSelect={setSelectedId}
          />
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5">
        <div className="flex h-3 overflow-hidden rounded-full bg-slate-200/80">
          {slices.map((slice) => {
            const width = total > 0 ? (slice.value / total) * 100 : 0;
            if (width <= 0) return null;
            return (
              <span
                key={slice.id}
                className="h-full transition-opacity duration-200"
                style={{
                  width: `${width}%`,
                  backgroundColor: slice.color,
                  opacity: selectedId == null || selectedId === slice.id ? 1 : 0.35,
                }}
                title={`${slice.label}: ${slice.share}`}
              />
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          {total.toLocaleString()} publication{total === 1 ? "" : "s"} split across{" "}
          {slices.length} subfield{slices.length === 1 ? "" : "s"}.
          {selectedId ? (
            <>
              {" "}
              Selected:{" "}
              <span className="font-semibold text-ink">
                {slices.find((slice) => slice.id === selectedId)?.label}
              </span>
              .
            </>
          ) : (
            " Click a tile to focus it."
          )}
        </p>
      </div>
    </div>
  );
}
