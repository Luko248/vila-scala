# Vila SCALA

Marketing site for **Vila SCALA** — a five-apartment villa house built into the
rock at Veslařská 1039/144, Brno-Jundrov. A rebuild of the original Webnode
site as a static, bilingual, accessible Astro project.

**Live:** https://www.vila-scala.cz

---

## Stack

| | |
|---|---|
| Framework | [Astro 7](https://astro.build) — static output, zero framework runtime |
| Styling | Tailwind CSS 4 (`@theme` tokens, no config file) |
| Runtime / package manager | [Bun](https://bun.sh) |
| Images | `astro:assets` + sharp — AVIF/WebP, responsive `srcset`, build-time |
| Fonts | Self-hosted Cormorant Garamond (display) + Inter Variable (UI) |
| Hosting | GitHub Pages via GitHub Actions |

The client-side budget is one small module: theme persistence, the mobile
menu, a scroll reveal, the hero video controller, the lightbox and form
validation. No framework, no polyfills, no analytics.

## Getting started

```bash
bun install
bun run dev        # http://localhost:4321
```

| Script | Does |
|---|---|
| `bun run dev` | Dev server with HMR |
| `bun run build` | Type-check, then production build into `dist/` |
| `bun run build:ci` | Build only (the type-check runs as its own CI step) |
| `bun run check` | `astro check` — types across `.astro`, `.ts` |
| `bun run preview` | Serve the built `dist/` locally |

## Project layout

```
src/
  assets/          Source images — optimised at build by astro:assets
    brand/         Logo
    floorplans/    Per-unit plans
    images/        Photography and visualisations
  components/      Presentational pieces (Header, Hero, Gallery, UnitIndex, …)
  data/
    site.ts        Address, phone, e-mail, geo, virtual-tour URL
    units.ts       The five apartments: areas, prices, status, media, PDFs
  i18n/
    cs.ts en.ts    Every UI string, both locales
    units.cs.ts    Per-unit prose (kept out of the main dictionary)
    units.en.ts
    index.ts       t(), tu(), path(), alternates(), withBase()
    locales.mjs    Shared with astro.config.mjs
  layouts/         BaseLayout — head, SEO, theme bootstrap, chrome
  pages/           Thin route files; both locales import the same view
  scripts/app.ts   The entire client-side budget
  styles/global.css  Design tokens, base styles, components, utilities
  views/           One component per page, rendered by both locales
public/
  docs/            Unit PDFs, energy certificate, specification
  video/           Hero loop (1280 and 854 wide, H.264, silent)
  og/              Social preview image
```

## Content

Everything editable lives in three places:

- **`src/i18n/cs.ts` and `src/i18n/en.ts`** — every visible string. Czech is the
  source of truth; `en.ts` is typed as `typeof cs`, so a missing or misspelled
  key fails `bun run check` rather than shipping.
- **`src/data/units.ts`** — the apartments. Areas, prices, status
  (`available` / `soon` / `sold`), which photos and which PDF.
- **`src/data/site.ts`** — address, phone, e-mail, coordinates, tour URL.

Adding a language means adding `xx.ts`, listing it in `src/i18n/locales.mjs`,
adding its slugs to the `segments` map in `src/i18n/index.ts`, and creating the
route files under `src/pages/xx/`.

## Routing and i18n

Czech is the default locale and is served without a prefix; English lives under
`/en/`. Slugs are translated:

| | Czech | English |
|---|---|---|
| Home | `/` | `/en/` |
| Project | `/o-nas/` | `/en/about/` |
| Apartments | `/byty/` | `/en/apartments/` |
| Apartment | `/byty/1039-1/` | `/en/apartments/1039-1/` |
| Prices | `/cenik/` | `/en/pricing/` |
| Documents | `/dokumentace/` | `/en/documents/` |
| Contact | `/kontakt/` | `/en/contact/` |

Never hard-code a URL — call `path('units', locale)`. It resolves the locale
prefix, the translated segment and the deployment base path in one place.
For static files under `public/`, wrap the URL in `withBase()`.

## Deployment

Pushing to `main` runs `.github/workflows/static.yml`: Bun install →
type-check → build → publish to GitHub Pages. It can also be triggered by
hand from the Actions tab.

**One-time setup:** Settings → Pages → *Source: GitHub Actions*.

The build reads `SITE` and `BASE` from the environment, which the workflow
fills from `actions/configure-pages`. That is what makes one source tree
deploy correctly both to the project page
(`https://luko248.github.io/vila-scala/`, base `/vila-scala`) and to a custom
domain (base `/`) without editing anything.

Never hard-code an absolute URL in a template: use `absolute()` or
`siteRoot()` from `src/i18n`, which resolve against whichever origin the
build is actually targeting. Canonicals, hreflang, `og:image`, robots and
every JSON-LD `@id` go through them.

**Custom domain:** add `public/CNAME` containing `www.vila-scala.cz`, then set
the domain under Settings → Pages. `BASE` then resolves to `/` on its own.

The output is a plain static directory, so `dist/` also drops onto Cloudflare
Pages unchanged (build command `bun run build:ci`, output directory `dist`).

## Accessibility

Targets WCAG 2.2 AA, verified with Lighthouse (100 on Accessibility, Best
Practices and SEO) and by keyboard.

- Every text pair clears 4.5:1 in both themes; most clear AAA. Control borders
  clear 3:1. The contrast of the palette is the reason those exact hex values
  are in `global.css` — re-check before changing any of them.
- Status is never carried by colour alone: each badge pairs its hue with a
  distinct glyph and a text label.
- Skip link, one `<h1>` per page, landmark regions, visible focus rings that
  the sticky header can never obscure (`scroll-padding-top`).
- Menu and lightbox are real `<dialog>` elements — Escape, focus trapping and
  inertness come from the platform. Focus returns to whatever opened them.
- The hero video is muted, decorative (`aria-hidden`) and pausable, per WCAG
  2.2.2. It never loads for a visitor who asked for reduced motion, has
  Save-Data on, or is on a 2G connection.
- `prefers-reduced-motion: reduce` renders every animation's final state
  immediately. Without JavaScript, all revealed content is visible.

## Media

Photography, floor plans, PDFs and the hero loop were taken from the original
site and are stored in this repository. The hero loop is the original clip
mirrored end-to-end, so it repeats without a visible cut, encoded silent at two
widths; the poster frame is what paints first and what LCP measures.

## Design

`design-system/vila-scala/MASTER.md` holds the generated design-system
starting point. `DESIGN.md` records what was kept, what was overridden, and
why.
