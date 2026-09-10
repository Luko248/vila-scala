import cs from './cs';
import en from './en';
import { LOCALES, DEFAULT_LOCALE } from './locales.mjs';

export type Locale = 'cs' | 'en';
export const locales = LOCALES as readonly Locale[];
export const defaultLocale = DEFAULT_LOCALE as Locale;

const dictionaries = { cs, en } as const;

export type Dict = typeof cs;

export function t(locale: Locale): Dict {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

/** Fill {placeholders} in a translated string. */
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, key) =>
    key in values ? String(values[key]) : m,
  );
}

/** Every page of the site, with its localised path segment. */
export type RouteKey =
  | 'home'
  | 'about'
  | 'units'
  | 'unit'
  | 'documents'
  | 'pricing'
  | 'contact';

const segments: Record<RouteKey, Record<Locale, string>> = {
  home: { cs: '', en: '' },
  about: { cs: 'o-nas', en: 'about' },
  units: { cs: 'byty', en: 'apartments' },
  unit: { cs: 'byty', en: 'apartments' },
  documents: { cs: 'dokumentace', en: 'documents' },
  pricing: { cs: 'cenik', en: 'pricing' },
  contact: { cs: 'kontakt', en: 'contact' },
};

/**
 * Prefix a root-relative URL with the deployment base path, so the same
 * markup works at a custom domain and under https://user.github.io/<repo>/.
 */
export function withBase(url: string): string {
  const base = import.meta.env.BASE_URL || '/';
  if (base === '/') return url;
  return `${base.replace(/\/$/, '')}${url}`;
}

/**
 * Absolute URL for a root-relative path, resolved against the origin this
 * build is actually being deployed to. Never hard-code the production
 * domain: a project page lives on github.io, and canonicals, hreflang,
 * og:image and JSON-LD @ids all have to agree with wherever the page is
 * really served from.
 */
export function absolute(url: string): string {
  return new URL(url, import.meta.env.SITE || 'https://www.vila-scala.cz').href;
}

/** Absolute URL of the site root, base path included. Ends with a slash. */
export function siteRoot(): string {
  return absolute(withBase('/'));
}

/**
 * Build a root-relative, locale-aware path. Czech is the default locale and
 * is served without a prefix; English lives under /en/.
 */
export function path(key: RouteKey, locale: Locale, slug?: string): string {
  const parts = [
    locale === defaultLocale ? '' : locale,
    segments[key][locale],
    key === 'unit' ? slug : undefined,
  ].filter((p): p is string => Boolean(p));

  return withBase(`/${parts.join('/')}${parts.length ? '/' : ''}`);
}

/** hreflang alternates for a given route, including x-default. */
export function alternates(key: RouteKey, slug?: string) {
  return [
    ...locales.map((l) => ({ hreflang: l === 'cs' ? 'cs-CZ' : 'en', href: path(key, l, slug) })),
    { hreflang: 'x-default', href: path(key, defaultLocale, slug) },
  ];
}

export const NAV_ORDER: Exclude<RouteKey, 'unit'>[] = [
  'home',
  'about',
  'units',
  'pricing',
  'documents',
  'contact',
];

import unitsCs from './units.cs';
import unitsEn from './units.en';

const unitDicts = { cs: unitsCs, en: unitsEn } as const;

/** Per-unit copy (long prose kept out of the main dictionary). */
export function tu(locale: Locale) {
  return unitDicts[locale] ?? unitDicts[defaultLocale];
}
