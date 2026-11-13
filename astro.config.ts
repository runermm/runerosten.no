import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';
import { SITE } from './src/config';

export default defineConfig({
  site: SITE.url,
  integrations: [
    sitemap(),
    {
      // GitHub Pages trenger en CNAME-fil med domenet. Den lages fra SITE.url.
      name: 'cname',
      hooks: {
        'astro:build:done': ({ dir }) => {
          fs.writeFileSync(new URL('CNAME', dir), new URL(SITE.url).hostname + '\n');
        },
      },
    },
  ],
  // Sider som har flyttet. Gamle lenker sendes videre til ny adresse.
  redirects: {
    '/artikler/stanford-inc': '/anmeldelser/stanford-inc/',
    '/artikler/datakraft-vs-dommekraft': '/anmeldelser/datakraft-vs-dommekraft/',
  },
});
