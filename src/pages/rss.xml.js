import rss from '@astrojs/rss';
import { SITE } from '../config';
import { getArtikler, getAnmeldelser } from '../lib';

export async function GET(context) {
  const artikler = (await getArtikler()).map((a) => ({
    title: a.data.title,
    description: a.data.description,
    pubDate: a.data.date,
    link: `/artikler/${a.id}/`,
  }));
  const anmeldelser = (await getAnmeldelser()).map((b) => ({
    title: `${b.data.title} av ${b.data.bookAuthor} (terningkast ${b.data.rating})`,
    description: b.data.description,
    pubDate: b.data.date,
    link: `/anmeldelser/${b.id}/`,
  }));
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site,
    items: [...artikler, ...anmeldelser].sort((a, b) => b.pubDate - a.pubDate),
    customData: '<language>nb-no</language>',
  });
}
