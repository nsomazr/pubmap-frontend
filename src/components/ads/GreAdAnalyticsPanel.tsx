import { BarChart3, MousePointerClick, Eye } from "lucide-react";
import { useAdAnalytics } from "../../lib/ads";

interface Props {
  days?: number;
}

export function GreAdAnalyticsPanel({ days = 30 }: Props) {
  const { data, isLoading, isError } = useAdAnalytics(days);

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-ink">Performance ({data.days} days)</h2>
        <p className="mt-1 text-sm text-slate-500">
          Impressions are deduplicated once per visitor per day. All sponsored units are clearly labeled in the UI.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="gre-card flex items-center gap-4 p-5">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="text-2xl font-bold text-ink">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="gre-card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-ink">By placement</h3>
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
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Title</th>
                <th className="px-5 py-3 font-semibold">Placement</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Impressions</th>
                <th className="px-5 py-3 font-semibold">Clicks</th>
                <th className="px-5 py-3 font-semibold">CTR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.ads.map((row) => (
                <tr key={row.id}>
                  <td className="px-5 py-3 font-medium text-ink">{row.title}</td>
                  <td className="px-5 py-3 text-slate-600">{row.placement.replace(/_/g, " ")}</td>
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
                  <td className="px-5 py-3 text-slate-600">{row.ctr}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
