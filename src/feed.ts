// Felles, kronologisk feed med synspunkter (artikler) og bokmeldinger (anmeldelser).
// Brukes av forsiden og arkivsiden.
import { render } from 'astro:content';
import { getArtikler, getAnmeldelser, reviewListTitle, reviewImage } from './lib';

const SYNSPUNKT = { label: 'Synspunkt', href: '/artikler/' };
const BOKMELDING = { label: 'Bokmelding', href: '/anmeldelser/' };

export async function getFeed({ festet = true } = {}) {
  const [artikler, anmeldelser] = await Promise.all([getArtikler(), getAnmeldelser()]);
  const innlegg = await Promise.all([
    ...artikler.map(async (a) => ({
      href: `/artikler/${a.id}/`, title: a.data.title, description: a.data.description, date: a.data.date,
      forsideplass: a.data.forsideplass as number | undefined,
      image: a.data.image, imageWide: !a.data.imagePortrait,
      tag: SYNSPUNKT, Content: (await render(a)).Content,
    })),
    ...anmeldelser.map(async (b) => ({
      href: `/anmeldelser/${b.id}/`, ...reviewListTitle(b.data), image: reviewImage(b.data),
      description: b.data.description, date: b.data.date, rating: b.data.rating,
      forsideplass: b.data.forsideplass as number | undefined,
      tag: BOKMELDING, Content: (await render(b)).Content,
    })),
  ]);
  innlegg.sort((a, b) => b.date.valueOf() - a.date.valueOf());
  // Innlegg med «forsideplass» i frontmatter festes på den plassen (1 = øverst) på forsiden.
  if (festet) {
    innlegg.filter((p) => p.forsideplass).sort((a, b) => a.forsideplass! - b.forsideplass!).forEach((p) => {
      innlegg.splice(innlegg.indexOf(p), 1);
      innlegg.splice(p.forsideplass! - 1, 0, p);
    });
  }
  return innlegg;
}
