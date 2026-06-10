import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  MousePointerClick,
  Pencil,
  Trash2,
} from "lucide-react";
import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import {
  buildAdDetailPath,
  useAdAnalytics,
  type AdAnalyticsRow,
  type AdPlacement,
} from "../../lib/ads";
import {
  downloadAdAnalyticsReport,
  downloadSingleAdAnalytics,
} from "../../lib/adAnalyticsExport";
import { Button } from "../ui/Button";

interface Props {
  days?: number;
  onEditAd?: (adId: number) => void;
  onDeleteAd?: (ad: AdAnalyticsRow) => void;
  deletePendingId?: number | null;
}

export function GreAdAnalyticsPanel({
  days = 30,
  onEditAd,
  onDeleteAd,
  deletePendingId = null,
}: Props) {
  const { data, isLoading, isError } = useAdAnalytics(days);
  const [expandedAdId, setExpandedAdId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="gre-card p-6">
        <p className="text-sm text-slate-500">Loading ad analytics…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="gre-card p-6">
        <p className="text-sm text-red-600">Could not load analytics.</p>
      </div>
    );
  }

  const cards = [
    {
      label: "Impressions",
      value: data.summary.impressions.toLocaleString(),
      icon: Eye,
      tone: "text-brand-600 bg-brand-50",
    },
    {
      label: "Clicks",
      value: data.summary.clicks.toLocaleString(),
      icon: MousePointerClick,
      tone: "text-teal-700 bg-teal-50",
    },
    {
      label: "CTR",
      value: `${data.summary.ctr}%`,
      icon: BarChart3,
      tone: "text-amber-800 bg-amber-50",
    },
  ];

  const toggleExpanded = (adId: number) => {
    setExpandedAdId((current) => (current === adId ? null : adId));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Performance ({data.days} days)</h2>
          <p className="mt-1 text-sm text-slate-500">
            Impressions are deduplicated once per visitor per day. Expand an ad to see metrics by
            placement.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="!gap-2 shrink-0"
          onClick={() => downloadAdAnalyticsReport(data)}
        >
          <Download className="h-4 w-4" />
          Download report
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="gre-card flex items-center gap-4 p-5">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
              </p>
              <p className="text-2xl font-bold text-ink">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="gre-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-ink">By placement</h3>
          <button
            type="button"
            onClick={() => downloadAdAnalyticsReport(data)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Placement</th>
                <th className="px-5 py-3 font-semibold">Impressions</th>
                <th className="px-5 py-3 font-semibold">Clicks</th>
                <th className="px-5 py-3 font-semibold">CTR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.by_placement.map((row) => (
                <tr key={row.placement}>
                  <td className="px-5 py-3 font-medium text-ink">{row.label}</td>
                  <td className="px-5 py-3 text-slate-600">{row.impressions.toLocaleString()}</td>
                  <td className="px-5 py-3 text-slate-600">{row.clicks.toLocaleString()}</td>
                  <td className="px-5 py-3 text-slate-600">{row.ctr}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="gre-card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-ink">By advertisement</h3>
          <p className="mt-1 text-xs text-slate-500">
            Sorted by impressions. Use actions to preview, edit, delete, or download per-ad metrics.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-8 px-3 py-3" aria-label="Expand" />
                <th className="px-5 py-3 font-semibold">Title</th>
                <th className="px-5 py-3 font-semibold">Placement</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Impressions</th>
                <th className="px-5 py-3 font-semibold">Clicks</th>
                <th className="px-5 py-3 font-semibold">CTR</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.ads.map((row) => {
                const expanded = expandedAdId === row.id;
                const hasPlacementMetrics = row.by_placement?.some(
                  (item) => item.impressions || item.clicks
                );
                return (
                  <Fragment key={row.id}>
                    <tr className="align-top">
                      <td className="px-3 py-3">
                        {hasPlacementMetrics ? (
                          <button
                            type="button"
                            onClick={() => toggleExpanded(row.id)}
                            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-ink"
                            aria-label={expanded ? "Collapse placement metrics" : "Expand placement metrics"}
                          >
                            {expanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        ) : null}
                      </td>
                      <td className="px-5 py-3 font-medium text-ink">{row.title}</td>
                      <td className="px-5 py-3 text-slate-600">
                        {row.placement_label || row.placement.replace(/_/g, " ")}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            row.status === "active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{row.impressions.toLocaleString()}</td>
                      <td className="px-5 py-3 text-slate-600">{row.clicks.toLocaleString()}</td>
                      <td className="px-5 py-3 font-semibold text-ink">{row.ctr}%</td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <Link
                            to={buildAdDetailPath(row.id, row.placement as AdPlacement)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-8 items-center rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-brand-700 hover:bg-brand-50/50"
                          >
                            Preview
                          </Link>
                          {onEditAd ? (
                            <button
                              type="button"
                              onClick={() => onEditAd(row.id)}
                              className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => downloadSingleAdAnalytics(data, row)}
                            className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <Download className="h-3 w-3" />
                            CSV
                          </button>
                          {onDeleteAd ? (
                            <button
                              type="button"
                              onClick={() => onDeleteAd(row)}
                              disabled={deletePendingId === row.id}
                              className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 text-[11px] font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                    {expanded && hasPlacementMetrics ? (
                      <tr className="bg-slate-50/80">
                        <td colSpan={8} className="px-5 py-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Metrics by placement for {row.title}
                          </p>
                          <table className="mt-3 min-w-full text-xs">
                            <thead className="text-left uppercase tracking-wide text-slate-500">
                              <tr>
                                <th className="pb-2 pr-4 font-semibold">Placement</th>
                                <th className="pb-2 pr-4 font-semibold">Impressions</th>
                                <th className="pb-2 pr-4 font-semibold">Clicks</th>
                                <th className="pb-2 font-semibold">CTR</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/80">
                              {(row.by_placement || [])
                                .filter((item) => item.impressions || item.clicks)
                                .map((item) => (
                                  <tr key={`${row.id}-${item.placement}`}>
                                    <td className="py-2 pr-4 font-medium text-ink">{item.label}</td>
                                    <td className="py-2 pr-4 text-slate-600">
                                      {item.impressions.toLocaleString()}
                                    </td>
                                    <td className="py-2 pr-4 text-slate-600">
                                      {item.clicks.toLocaleString()}
                                    </td>
                                    <td className="py-2 text-slate-600">{item.ctr}%</td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
