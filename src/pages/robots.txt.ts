import { SITE } from '../config';

export const GET = () =>
  new Response(`User-agent: *\nAllow: /\nSitemap: ${new URL('/sitemap-index.xml', SITE.url)}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
