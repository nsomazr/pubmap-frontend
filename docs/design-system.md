# GRE design system

Consistent UI rhythm for dashboard and public pages (inspired by modern control-panel patterns: open canvas, white cards, clear metrics).

## Surfaces

| Class | Use |
|-------|-----|
| `.dashboard-bg` | Dashboard shell background (`#f4f6f9`) |
| `.gre-dashboard-shell` | Page content wrapper (padding only, no card chrome) |
| `.gre-dashboard-card` | White card on dashboard (`1rem` radius, subtle border + shadow) |
| `.gre-public-card` | Same as dashboard card on public publication/stat pages (no gradient top bar) |
| `.gre-card` | Legacy premium card with accent gradient bar — use for marketing/forum only |

**Prefer** `gre-dashboard-card` / `gre-public-card` for new work.

## Typography

- Font: **Plus Jakarta Sans** (`--font-sans`)
- Page title: `text-2xl font-bold` (dashboard `PageHeader` clean variant)
- Section label: `text-xs font-bold uppercase tracking-wide text-slate-500`
- Body: `text-sm text-slate-600`

## Components

| Component | Path | When |
|-----------|------|------|
| `PageHeader` | `components/dashboard/PageHeader.tsx` | Dashboard pages; `variant="clean"` default (GRE Meet, Overview, etc.) |
| `MetricTile` | `components/dashboard/MetricTile.tsx` | Clickable stat + sparkline + chevron |
| `StatDisplayTile` | `components/dashboard/StatDisplayTile.tsx` | Read-only stat (e.g. public Statistics) |
| `QuickLinkTile` | `components/dashboard/QuickLinkTile.tsx` | Secondary nav row with chevron |
| `DashboardSection` | `components/dashboard/DashboardSection.tsx` | Section title + grid |
| `MiniSparkline` | `components/dashboard/MiniSparkline.tsx` | 8-point area chart under metrics |
| `InfoBanner` | `components/dashboard/InfoBanner.tsx` | Dismissible inline tip |

## Sparklines

- **Dashboard:** `GET /api/dashboard/stats/` → `activity_trend` (last 8 months per workflow key).
- **Public stats:** `publication_trend` on `GET /api/stats/public/`.
- Helper: `pickActivityTrend()` / `trendToSparkline()` in `src/lib/sparkline.ts`.

## Motion

CSS variables in `index.css`:

- `--gre-duration-fast` (150ms), `--gre-duration` (240ms)
- `--gre-ease-out`, `--gre-ease-in-out`
- `.gre-interactive` for buttons/links
- `.gre-card-hover` for lift on hover (marketing cards)

## Colors

- Brand: `--color-brand-600` (`#3b5bdb`)
- Accent / map: `--color-accent` (`#0d9488`)
- Ink: `--color-ink` (`#0f172a`)

## Public page headers

`PublicPageLayout` uses **`heroVariant="clean"`** by default:

- White / soft gray background, brand accent top line, dark title text
- Used on Statistics, Events, Forum, Rankings, About, Research assistant (`/publication/:id/chat`), publications, etc.

Pass **`heroVariant="premium"`** only when a dark gradient hero is intentional (rare; not used on GRE Meet or dashboard pages).

## Layout

- Max content width: `--gre-content-max` (72rem) via `.gre-page-shell`
- Section spacing: `space-y-6` on dashboard pages

## Checklist for new screens

1. Gray canvas + white cards (not one giant wrapper panel).
2. `PageHeader` clean variant unless it's a Meet hero.
3. Metrics use `MetricTile` or `StatDisplayTile` with real API trend data.
4. Quick links use `QuickLinkTile`.
5. Match border radius (`1rem`) and shadow from `gre-dashboard-card`.
