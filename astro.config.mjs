// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://runerosten.no',
  integrations: [sitemap()],
  // Sider som har flyttet. Gamle lenker sendes videre til ny adresse.
  redirects: {
    '/artikler/stanford-inc': '/anmeldelser/stanford-inc/',
    '/artikler/datakraft-vs-dommekraft': '/anmeldelser/datakraft-vs-dommekraft/',
  },
});
