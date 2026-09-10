import type { APIRoute } from 'astro';

import { absolute, withBase } from '../i18n';

/**
 * Generated rather than static, so the sitemap URL always matches the
 * deployment target — origin and base path included.
 */
export const GET: APIRoute = () => {
  const sitemap = absolute(withBase('/sitemap-index.xml'));

  return new Response(['User-agent: *', 'Allow: /', '', `Sitemap: ${sitemap}`, ''].join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
