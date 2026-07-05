import { Link } from "react-router-dom";
import type { PublicStatsCountryCount } from "../../types";
import { buildMapLocationPath } from "../../lib/mapDeepLink";
import { DonutChart } from "./DonutChart";

interface Props {
  countries: PublicStatsCountryCount[];
  selectedCountry?: string | null;
  onCountrySelect?: (country: string) => void;
}

export function CountryHeatGrid({ countries, selectedCountry, onCountrySelect }: Props) {
  const total = countries.reduce((sum, country) => sum + country.count, 0);

  return (
    <DonutChart
      items={countries.map((country) => ({
        id: country.country,
        label: country.country,
        value: country.count,
      }))}
      emptyMessage="No location data yet. Add map coordinates to publications."
      ariaLabel="Publications by location"
      caption={
        countries.length === 0
          ? undefined
          : `${total.toLocaleString()} geolocated publication${total === 1 ? "" : "s"} across ${countries.length} location${countries.length === 1 ? "" : "s"}. Click a slice or legend item to highlight it on the map.`
      }
      selectedId={selectedCountry ?? null}
      onSelect={onCountrySelect}
    />
  );
}

export function CountryHeatGridHint({ selectedCountry }: { selectedCountry?: string | null }) {
  if (!selectedCountry) return null;

  return (
    <p className="mt-3 text-xs text-slate-500">
      Highlighting <span className="font-semibold text-ink">{selectedCountry}</span> on the map.{" "}
      <Link
        to={buildMapLocationPath(selectedCountry)}
        className="font-semibold text-brand-700 hover:text-brand-800"
      >
        View studies on map
      </Link>
    </p>
  );
}
