// Podkaster fra Raindrop-samlingen «På øret» (se PODKAST i config.ts).
import type { Loader } from 'astro/loaders';
import { PODKAST } from './config';
import { fetchRaindrops, type Raindrop } from './leseliste';

export interface Podkast {
  id: string;
  title: string; // episodens tittel
  show?: string; // programmet
  url: string;
  cover?: string;
  note?: string; // Runes kommentar
  date: string;
}

// «Episodetittel – Program – Apple Podcasts» / «Program: Episode on Apple Podcasts» → { title, show }
function splitTitle(raw: string): { title: string; show?: string } {
  const t = raw.replace(/\s*[|–—-]\s*Apple Podcasts\s*$/i, '').replace(/\s+on Apple Podcasts\s*$/i, '').replace(/\s+på Apple Podcasts\s*$/i, '').trim();
  const dash = t.split(/\s+[–—|]\s+/);
  if (dash.length >= 2) return { title: dash.slice(0, -1).join(' – '), show: dash.at(-1) };
  return { title: t };
}

const toPodkast = (r: Raindrop): Podkast => {
  const { title, show } = splitTitle(r.title);
  return { id: String(r._id), title, show, url: r.link, cover: r.cover || undefined, note: r.note?.trim() || undefined, date: r.created };
};

export function podkastLoader(): Loader {
  return {
    name: 'podkaster',
    load: async ({ store, logger, parseData }) => {
      if (!PODKAST.collectionId) { store.clear(); return; }
      let items: Raindrop[] | null;
      try {
        items = await fetchRaindrops(PODKAST.collectionId);
      } catch (err) {
        logger.warn(`${(err as Error).message}. Podkastene er ikke oppdatert.`);
        return;
      }
      if (!items) return;
      store.clear();
      for (const p of items.map(toPodkast)) store.set({ id: p.id, data: await parseData({ id: p.id, data: { ...p } }) });
      logger.info(`Podkaster: ${items.length} fra Raindrop`);
    },
  };
}
