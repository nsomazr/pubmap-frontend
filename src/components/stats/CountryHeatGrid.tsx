import type { PublicStatsCountryCount } from "../../types";

interface Props {
  countries: PublicStatsCountryCount[];
}

export function CountryHeatGrid({ countries }: Props) {
  if (countries.length === 0) {
    return (
      <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        No country data yet. Add map coordinates to publications.
      </p>
    );
  }

  const max = Math.max(...countries.map((c) => c.count), 1);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {countries.map((country) => {
        const intensity = country.count / max;
        return (
          <div
            key={country.country}
            className="rounded-xl px-3 py-3 ring-1 ring-slate-200/80 transition hover:ring-brand-200"
            style={{
              backgroundColor: `rgba(59, 130, 246, ${0.08 + intensity * 0.42})`,
            }}
            title={`${country.count} publications`}
          >
            <p className="truncate text-sm font-semibold text-ink">{country.country}</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-brand-700">
              {country.count.toLocaleString()}
            </p>
          </div>
        );
      })}
    </div>
  );
}
