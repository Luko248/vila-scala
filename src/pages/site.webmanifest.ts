import type { APIRoute } from 'astro';

import { t, withBase } from '../i18n';

/**
 * Generated rather than static: a manifest is fetched as a plain file, so
 * root-relative icon paths would resolve against the origin and 404 whenever
 * the site is served under a base path.
 */
export const GET: APIRoute = () => {
  const dict = t('cs');

  const manifest = {
    name: dict.meta.siteName,
    short_name: dict.meta.siteName,
    description: dict.home.seoDescription,
    start_url: withBase('/'),
    scope: withBase('/'),
    display: 'standalone',
    background_color: '#0e0c0b',
    theme_color: '#0e0c0b',
    lang: dict.meta.locale,
    icons: [
      { src: withBase('/icon.svg'), sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: withBase('/apple-touch-icon.png'), sizes: '180x180', type: 'image/png' },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
};
