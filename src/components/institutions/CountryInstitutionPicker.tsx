import { Building2, Globe2, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCountries } from "../../lib/countries";
import {
  normalizeInstitutionLabel,
  useInstitutionsByCountry,
} from "../../lib/institutions";
import { ScrollableSelect } from "../ui/ScrollableSelect";
import { RequiredMark } from "../ui/RequiredField";

interface Props {
  countryCode: string;
  onCountryChange: (code: string) => void;
  institution: string;
  onInstitutionChange: (label: string) => void;
  countryLabel?: string;
  institutionLabel?: string;
  required?: boolean;
  className?: string;
}

export function CountryInstitutionPicker({
  countryCode,
  onCountryChange,
  institution,
  onInstitutionChange,
  countryLabel = "Country of residence",
  institutionLabel = "Institution / affiliation",
  required,
  className = "",
}: Props) {
  const { data: countries = [], isLoading: loadingCountries } = useCountries();
  const [filter, setFilter] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const { data: catalog = [], isLoading: loadingCatalog } = useInstitutionsByCountry(
    countryCode,
    filter
  );

  useEffect(() => {
    if (!countryCode) {
      setCustomMode(false);
      return;
    }
    if (!institution) {
      setCustomMode(false);
      return;
    }
    const inCatalog = catalog.some(
      (row) => row.label.toLowerCase() === institution.trim().toLowerCase()
    );
    if (!inCatalog && institution.trim()) {
      setCustomMode(true);
    }
  }, [countryCode, institution, catalog]);

  const selectedCountry = useMemo(
    () => countries.find((row) => row.code === countryCode),
    [countries, countryCode]
  );

  const countryOptions = useMemo(
    () => countries.map((row) => ({ value: row.code, label: row.name })),
    [countries]
  );

  const institutionOptions = useMemo(
    () => [
      ...catalog.map((row) => ({ value: row.label, label: row.label })),
      { value: "__custom__", label: "Not listed: type institution / affiliation" },
    ],
    [catalog]
  );

  const handleCountryChange = (next: string) => {
    onCountryChange(next);
    onInstitutionChange("");
    setFilter("");
    setCustomMode(false);
  };

  const handleInstitutionSelect = (value: string) => {
    if (value === "__custom__") {
      setCustomMode(true);
      onInstitutionChange("");
      return;
    }
    setCustomMode(false);
    onInstitutionChange(normalizeInstitutionLabel(value));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">
          {countryLabel}
          {required ? <RequiredMark /> : null}
        </label>
        <div className="relative">
          {loadingCountries ? (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
              Loading countries…
            </div>
          ) : (
            <ScrollableSelect
              value={countryCode}
              onChange={handleCountryChange}
              options={countryOptions}
              placeholder="Select your country…"
              required={required}
              aria-label={countryLabel}
              icon={<Globe2 className="h-4 w-4" />}
              triggerClassName="pl-3 pr-3"
              maxMenuHeight={280}
            />
          )}
        </div>
        {selectedCountry && !selectedCountry.has_catalog && (
          <p className="mt-1.5 text-xs text-slate-500">
            No curated institution list yet for {selectedCountry.name}. Enter your institution or
            affiliation below.
          </p>
        )}
      </div>

      {countryCode && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            {institutionLabel}
            {required ? <RequiredMark /> : null}
          </label>

          {loadingCatalog && catalog.length === 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
              Loading institutions for {selectedCountry?.name || "this country"}…
            </div>
          )}

          {!loadingCatalog && !customMode && catalog.length > 0 && (
            <>
              <input
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter institutions in this country…"
                className="mb-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              <ScrollableSelect
                value={institution}
                onChange={handleInstitutionSelect}
                options={institutionOptions}
                placeholder="Choose your institution or affiliation…"
                required={required && !customMode}
                aria-label={institutionLabel}
                icon={<Building2 className="h-4 w-4" />}
                triggerClassName="pl-3 pr-3"
                maxMenuHeight={280}
              />
              <button
                type="button"
                onClick={() => {
                  setCustomMode(true);
                  setFilter("");
                }}
                className="mt-2 text-xs font-medium text-brand-700 hover:text-brand-800"
              >
                Not listed? Type another institution / affiliation
              </button>
            </>
          )}

          {!loadingCatalog && (customMode || catalog.length === 0) && (
            <div className="space-y-2">
              {catalog.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomMode(false);
                    setFilter("");
                  }}
                  className="text-xs font-medium text-brand-700 hover:text-brand-800"
                >
                  Back to institution list
                </button>
              )}
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={institution}
                  required={required}
                  placeholder="Type institution or affiliation"
                  onChange={(e) => onInstitutionChange(e.target.value)}
                  onBlur={() => onInstitutionChange(normalizeInstitutionLabel(institution))}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <p className="text-xs text-slate-500">
                Use the complete institution or affiliation name. We will normalize it for rankings
                and map search where possible.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
