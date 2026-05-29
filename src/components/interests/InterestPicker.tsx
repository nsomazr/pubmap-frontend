import { Sparkles, Search, UserPlus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UserAvatar } from "../ui/UserAvatar";
import { Button } from "../ui/Button";
import {
  fetchInterestSuggestions,
  normalizeInterestLabel,
  previewInterestCollaborators,
  searchInterests,
  uniqueInterestLabels,
  usePopularInterests,
  type InterestCollaborator,
  type ResearchInterest,
} from "../../lib/interests";
import { authorDisplayName } from "../../lib/userDisplay";

interface Props {
  value: string[];
  onChange: (labels: string[]) => void;
  affiliation?: string;
  showCollaborators?: boolean;
  maxInterests?: number;
}

export function InterestPicker({
  value,
  onChange,
  affiliation = "",
  showCollaborators = true,
  maxInterests = 20,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResearchInterest[]>([]);
  const [searching, setSearching] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [collaborators, setCollaborators] = useState<InterestCollaborator[]>([]);
  const [collabLoading, setCollabLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: popular = [] } = usePopularInterests(10);

  const selectedKeys = useMemo(
    () => new Set(value.map((label) => normalizeInterestLabel(label))),
    [value]
  );

  const addInterest = useCallback(
    (label: string) => {
      const next = uniqueInterestLabels([...value, label]).slice(0, maxInterests);
      onChange(next);
      setQuery("");
      setMenuOpen(false);
    },
    [maxInterests, onChange, value]
  );

  const removeInterest = useCallback(
    (label: string) => {
      const key = normalizeInterestLabel(label);
      onChange(value.filter((item) => normalizeInterestLabel(item) !== key));
    },
    [onChange, value]
  );

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = window.setTimeout(() => {
      searchInterests(q, 10)
        .then((rows) => {
          setResults(rows.filter((row) => !selectedKeys.has(normalizeInterestLabel(row.label))));
        })
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query, selectedKeys]);

  useEffect(() => {
    if (!showCollaborators || value.length === 0) {
      setCollaborators([]);
      return;
    }
    setCollabLoading(true);
    const timer = window.setTimeout(() => {
      previewInterestCollaborators({ interests: value, affiliation, limit: 4 })
        .then(setCollaborators)
        .catch(() => setCollaborators([]))
        .finally(() => setCollabLoading(false));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [affiliation, showCollaborators, value]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const canAddCustom =
    query.trim().length >= 2 &&
    !selectedKeys.has(normalizeInterestLabel(query)) &&
    value.length < maxInterests;

  const popularChoices = popular.filter(
    (item) => !selectedKeys.has(normalizeInterestLabel(item.label))
  );

  const runAiSuggest = async () => {
    setAiLoading(true);
    try {
      const suggestions = await fetchInterestSuggestions({
        selected: value,
        affiliation,
        limit: 6,
      });
      const next = uniqueInterestLabels([...value, ...suggestions]).slice(0, maxInterests);
      onChange(next);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div ref={containerRef} className="space-y-2">
        <label className="block text-sm font-medium text-ink">Research interests</label>
        <p className="text-xs text-slate-500">
          Search GRE topics, pick popular fields, or add your own. Select at least one to get better
          collaborator suggestions.
        </p>

        {value.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.map((label) => (
              <span
                key={normalizeInterestLabel(label)}
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800 ring-1 ring-brand-100"
              >
                {label}
                <button
                  type="button"
                  className="rounded-full p-0.5 hover:bg-brand-100"
                  aria-label={`Remove ${label}`}
                  onClick={() => removeInterest(label)}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setMenuOpen(true);
            }}
            onFocus={() => setMenuOpen(true)}
            placeholder="Search interests, e.g. hydrogeology, GIS, seismology"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm shadow-sm focus:border-brand-600 gre-field focus:outline-none focus:ring-0"
          />

          {menuOpen && (query.trim().length >= 2 || results.length > 0) && (
            <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              {searching && (
                <p className="px-3 py-2 text-xs text-slate-500">Searching…</p>
              )}
              {!searching &&
                results.map((item) => (
                  <button
                    key={`${item.id ?? "new"}-${item.label}`}
                    type="button"
                    className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-slate-50"
                    onClick={() => addInterest(item.label)}
                  >
                    <span className="font-medium text-ink">{item.label}</span>
                    {(item.category_name || item.publication_count) && (
                      <span className="text-xs text-slate-500">
                        {[item.category_name, item.publication_count ? `${item.publication_count} publications` : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                  </button>
                ))}
              {!searching && results.length === 0 && query.trim().length >= 2 && (
                <p className="px-3 py-2 text-xs text-slate-500">No matches yet.</p>
              )}
              {canAddCustom && (
                <button
                  type="button"
                  className="w-full border-t border-slate-100 px-3 py-2 text-left text-sm font-semibold text-brand-700 hover:bg-brand-50"
                  onClick={() => addInterest(query.trim())}
                >
                  Add custom interest: “{query.trim()}”
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {popularChoices.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Popular research topics
          </p>
          <div className="flex flex-wrap gap-2">
            {popularChoices.slice(0, 8).map((item) => (
              <button
                key={item.label}
                type="button"
                disabled={value.length >= maxInterests}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
                onClick={() => addInterest(item.label)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button
        type="button"
        variant="secondary"
        loading={aiLoading}
        className="!rounded-xl"
        onClick={runAiSuggest}
      >
        <Sparkles className="h-4 w-4" />
        AI-suggested interests
      </Button>

      {showCollaborators && value.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <UserPlus className="h-4 w-4 text-brand-600" />
            Suggested collaborators
          </div>
          {collabLoading ? (
            <p className="text-xs text-slate-500">Finding researchers with shared interests…</p>
          ) : collaborators.length === 0 ? (
            <p className="text-xs text-slate-500">
              Add more interests to discover researchers in your field.
            </p>
          ) : (
            <ul className="space-y-2">
              {collaborators.map((person) => (
                <li
                  key={person.id}
                  className="flex items-start gap-3 rounded-lg bg-white px-3 py-2 ring-1 ring-slate-100"
                >
                  <UserAvatar
                    name={authorDisplayName(person)}
                    photoUrl={person.photo}
                    size="sm"
                    className="h-9 w-9"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{authorDisplayName(person)}</p>
                    {person.affiliation && (
                      <p className="truncate text-xs text-slate-500">{person.affiliation}</p>
                    )}
                    {person.match_reason && (
                      <p className="mt-0.5 text-[11px] font-medium text-brand-700">
                        {person.match_reason}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
