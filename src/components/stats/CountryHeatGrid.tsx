import { Link } from "react-router-dom";
import type { PublicStatsCountryCount } from "../../types";
import { buildMapLocationPath } from "../../lib/mapDeepLink";

interface Props {
  countries: PublicStatsCountryCount[];
  selectedCountry?: string | null;
  onCountrySelect?: (country: string) => void;
}

export function CountryHeatGrid({ countries, selectedCountry, onCountrySelect }: Props) {
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
        const selected = selectedCountry === country.country;

        return (
          <button
            key={country.country}
            type="button"
            onClick={() => onCountrySelect?.(country.country)}
            className={`rounded-xl px-3 py-3 text-left ring-1 transition ${
              selected
                ? "bg-brand-50/80 ring-brand-300"
                : "bg-slate-50 ring-slate-100 hover:bg-white hover:ring-slate-200"
            }`}
            title={`${country.count} publications · Click to highlight on map`}
            aria-pressed={selected}
          >
            <p className="truncate text-sm font-semibold text-ink">{country.country}</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-slate-700">
              {country.count.toLocaleString()}
            </p>
            <div
              className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200/90"
              aria-hidden
            >
              <div
                className={`h-full rounded-full transition-all ${selected ? "bg-brand-500" : "bg-teal-500/70"}`}
                style={{ width: `${Math.max(intensity * 100, 8)}%` }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function CountryHeatGridHint({ selectedCountry }: { selectedCountry?: string | null }) {
  if (!selectedCountry) return null;

  return (
    <p className="mt-3 text-xs text-slate-500">
      Showing <span className="font-semibold text-ink">{selectedCountry}</span> on the map.{" "}
      <Link
        to={buildMapLocationPath(selectedCountry)}
        className="font-semibold text-brand-700 hover:text-brand-800"
      >
        View studies on map
      </Link>
    </p>
  );
}
