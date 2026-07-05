import { buildChartSlices, describeDonutSlice, type ChartSlice } from "../../lib/chartSlices";

export type DonutChartItem = {
  id: string;
  label: string;
  hint?: string;
  value: number;
};

interface Props {
  items: DonutChartItem[];
  centerLabel?: string;
  caption?: string;
  emptyMessage?: string;
  ariaLabel?: string;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

function DonutSvg({
  slices,
  total,
  selectedId,
  onSelect,
}: {
  slices: ChartSlice[];
  total: number;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 96;
  const innerR = 58;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="h-[220px] w-[220px]"
      role="img"
      aria-label={`Chart total ${total}`}
    >
      {slices.map((slice) => {
        const selected = selectedId === slice.id;
        const dimmed = selectedId != null && !selected;
        const sweep = slice.endAngle - slice.startAngle;
        if (sweep <= 0) return null;

        if (sweep >= 359.999) {
          const r = selected ? outerR + 4 : outerR;
          return (
            <g key={slice.id} opacity={dimmed ? 0.35 : 1}>
              <circle
                cx={cx}
                cy={cy}
                r={(r + innerR) / 2}
                fill="none"
                stroke={slice.color}
                strokeWidth={r - innerR}
                className={onSelect ? "cursor-pointer" : undefined}
                onClick={() => onSelect?.(slice.id)}
              />
            </g>
          );
        }

        return (
          <path
            key={slice.id}
            d={describeDonutSlice(
              cx,
              cy,
              selected ? outerR + 4 : outerR,
              innerR,
              slice.startAngle,
              slice.endAngle
            )}
            fill={slice.color}
            opacity={dimmed ? 0.35 : 1}
            stroke={selected ? "#1e293b" : "#ffffff"}
            strokeWidth={selected ? 2 : 1.5}
            className={onSelect ? "cursor-pointer transition-opacity duration-200" : undefined}
            onClick={() => onSelect?.(slice.id)}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={innerR - 1} fill="#ffffff" />
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        className="fill-slate-400 text-[10px] font-semibold uppercase tracking-wide"
      >
        Total
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" className="fill-ink text-[22px] font-bold">
        {total.toLocaleString()}
      </text>
    </svg>
  );
}

function DonutLegend({
  slices,
  selectedId,
  onSelect,
}: {
  slices: ChartSlice[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  return (
    <ul className="min-w-0 flex-1 space-y-1.5 self-stretch sm:pt-2">
      {slices.map((slice) => {
        const selected = selectedId === slice.id;
        const RowTag = onSelect ? "button" : "div";
        return (
          <li key={slice.id}>
            <RowTag
              {...(onSelect
                ? {
                    type: "button" as const,
                    onClick: () => onSelect(slice.id),
                    "aria-pressed": selected,
                  }
                : {})}
              className={`flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition ${
                onSelect ? "gre-interactive hover:bg-slate-50" : ""
              } ${selected ? "bg-brand-50 ring-1 ring-brand-200" : ""}`}
            >
              <span
                className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate font-medium ${selected ? "text-brand-900" : "text-ink"}`}
                >
                  {slice.label}
                </span>
                {slice.hint ? (
                  <span className="block truncate text-xs text-slate-400">{slice.hint}</span>
                ) : null}
              </span>
              <span className="shrink-0 tabular-nums text-slate-600">
                {slice.value.toLocaleString()}
                <span className="ml-1 text-xs text-slate-400">({slice.share})</span>
              </span>
            </RowTag>
          </li>
        );
      })}
    </ul>
  );
}

export function DonutChart({
  items,
  centerLabel = "Total",
  caption,
  emptyMessage = "No data yet",
  ariaLabel,
  selectedId,
  onSelect,
}: Props) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </p>
    );
  }

  const total = items.reduce((sum, item) => sum + item.value, 0);
  const slices = buildChartSlices(items);

  return (
    <div className="space-y-4">
      {caption ? <p className="text-xs text-slate-500">{caption}</p> : null}
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-6">
        <div className="relative shrink-0" aria-label={ariaLabel}>
          <DonutSvg slices={slices} total={total} selectedId={selectedId} onSelect={onSelect} />
          {centerLabel !== "Total" ? (
            <span className="sr-only">{centerLabel}</span>
          ) : null}
        </div>
        <DonutLegend slices={slices} selectedId={selectedId} onSelect={onSelect} />
      </div>
    </div>
  );
}
