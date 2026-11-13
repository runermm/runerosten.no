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

// Programnavn fra Apples offentlige katalog, ut fra id-en i lenken (…/podcast/navn/id1528594034?i=…).
async function showNames(links: string[]): Promise<Map<string, string>> {
  const ids = [...new Set(links.map((l) => l.match(/\/id(\d+)/)?.[1]).filter(Boolean) as string[])];
  const names = new Map<string, string>();
  if (!ids.length) return names;
  try {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${ids.join(',')}`);
    const json = (await res.json()) as { results: { collectionId: number; collectionName: string }[] };
    for (const r of json.results) names.set(String(r.collectionId), r.collectionName);
  } catch {
    // Uten katalogen vises bare episodetittelen.
  }
  return names;
}

const toPodkast = (r: Raindrop, names: Map<string, string>): Podkast => {
  const { title, show } = splitTitle(r.title);
  const id = r.link.match(/\/id(\d+)/)?.[1];
  // Mindre omslag holder på forsiden (Apple-bilder kan skaleres i adressen).
  const cover = r.cover?.replace(/\/\d+x\d+bf\./, '/400x400bf.') || undefined;
  return { id: String(r._id), title, show: (id && names.get(id)) || show, url: r.link, cover, note: r.note?.trim() || undefined, date: r.created };
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
      const names = await showNames(items.map((r) => r.link));
      for (const p of items.map((r) => toPodkast(r, names))) store.set({ id: p.id, data: await parseData({ id: p.id, data: { ...p } }) });
      logger.info(`Podkaster: ${items.length} fra Raindrop`);
    },
  };
}
