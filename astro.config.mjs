// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import { LOCALES, DEFAULT_LOCALE } from './src/i18n/locales.mjs';

/*
 * Deployment target. GitHub Actions injects SITE/BASE from
 * `actions/configure-pages`, so the same build works at the custom domain
 * (base "/") and at https://<user>.github.io/<repo>/ (base "/<repo>").
 */
const SITE = process.env.SITE || 'https://www.vila-scala.cz';
const BASE = process.env.BASE && process.env.BASE !== '' ? process.env.BASE : '/';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  /*
   * Opt-in rather than prefetchAll: prefetching every link on the page cost
   * two long tasks inside the TBT window for links nobody follows. The nav
   * and the primary calls to action carry `data-astro-prefetch` instead.
   */
  prefetch: { defaultStrategy: 'hover' },
  i18n: {
    locales: LOCALES,
    defaultLocale: DEFAULT_LOCALE,
    routing: { prefixDefaultLocale: false, redirectToDefaultLocale: false },
  },
  image: {
    /*
     * Every source image is local; sharp generates the variants at build time.
     * Astro's global responsive styles are deliberately off — each <Image>
     * here already carries explicit `widths`/`sizes` plus its own layout
     * classes, and the injected rules would override them.
     */
    responsiveStyles: false,
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: DEFAULT_LOCALE, locales: { cs: 'cs-CZ', en: 'en' } },
      filter: (page) => !page.includes('/404'),
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
