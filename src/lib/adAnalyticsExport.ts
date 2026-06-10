import type { AdAnalytics, AdAnalyticsRow } from "./ads";

function csvCell(value: string | number): string {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const body = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadAdAnalyticsReport(data: AdAnalytics) {
  const rows: Array<Array<string | number>> = [
    ["GRE advertisement analytics"],
    ["Period (days)", data.days],
    ["Since", data.since],
    [],
    ["Summary"],
    ["Metric", "Value"],
    ["Impressions", data.summary.impressions],
    ["Clicks", data.summary.clicks],
    ["CTR (%)", data.summary.ctr],
    [],
    ["By placement"],
    ["Placement", "Impressions", "Clicks", "CTR (%)"],
    ...data.by_placement.map((row) => [
      row.label,
      row.impressions,
      row.clicks,
      row.ctr,
    ]),
    [],
    ["By advertisement"],
    [
      "Ad ID",
      "Title",
      "Primary placement",
      "Status",
      "Sponsor label",
      "Impressions",
      "Clicks",
      "CTR (%)",
    ],
    ...data.ads.map((row) => [
      row.id,
      row.title,
      row.placement_label || row.placement,
      row.status,
      row.sponsor_label || "Sponsored",
      row.impressions,
      row.clicks,
      row.ctr,
    ]),
  ];

  for (const ad of data.ads) {
    if (!ad.by_placement?.some((row) => row.impressions || row.clicks)) continue;
    rows.push([]);
    rows.push([`Per-placement metrics: ${ad.title} (ID ${ad.id})`]);
    rows.push(["Placement", "Impressions", "Clicks", "CTR (%)"]);
    rows.push(
      ...ad.by_placement.map((row) => [
        row.label,
        row.impressions,
        row.clicks,
        row.ctr,
      ])
    );
  }

  downloadCsv(`gre-ad-analytics-${data.days}d.csv`, rows);
}

export function downloadSingleAdAnalytics(
  data: AdAnalytics,
  ad: AdAnalyticsRow
) {
  const rows: Array<Array<string | number>> = [
    ["GRE advertisement metrics"],
    ["Ad ID", ad.id],
    ["Title", ad.title],
    ["Period (days)", data.days],
    ["Since", data.since],
    [],
    ["Totals"],
    ["Impressions", ad.impressions],
    ["Clicks", ad.clicks],
    ["CTR (%)", ad.ctr],
    [],
    ["By placement"],
    ["Placement", "Impressions", "Clicks", "CTR (%)"],
    ...(ad.by_placement || []).map((row) => [
      row.label,
      row.impressions,
      row.clicks,
      row.ctr,
    ]),
  ];
  const slug = ad.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  downloadCsv(`gre-ad-${ad.id}-${slug || "metrics"}.csv`, rows);
}
