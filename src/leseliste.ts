// Henter leselisten fra Raindrop.io når nettstedet bygges.
// Nøkkelen (RAINDROP_TOKEN) ligger i .env lokalt, og som miljøvariabel hos hostingtjenesten.
// Uten nøkkel brukes eksempeldata fra src/data/leseliste-eksempel.json.
import type { Loader } from 'astro/loaders';
import { LESELISTE } from './config';
import eksempel from './data/leseliste-eksempel.json';

export interface LeselisteItem {
  id: string;
  type: 'artikkel' | 'bok';
  title: string;
  url: string;
  source: string; // nettsted, f.eks. «aftenposten.no»
  author?: string; // for bøker
  note?: string; // din kommentar
  image?: string;
  date: string; // ISO-dato
  tags: string[];
}

// Feltene vi bruker fra Raindrop sitt API.
interface Raindrop {
  _id: number;
  title: string;
  link: string;
  domain?: string;
  note?: string;
  cover?: string;
  tags?: string[];
  created: string;
}

// «Sult av Knut Hamsun | Bokelskere.no» → tittel «Sult», forfatter «Knut Hamsun»
function splitBookTitle(raw: string): { title: string; author?: string } {
  const clean = raw.replace(/\s+[|–—-]\s+[^|–—-]+$/, '').trim();
  const m = clean.match(/^(.+?)\s+(?:av|by)\s+(.+)$/i);
  return m ? { title: m[1].trim(), author: m[2].trim() } : { title: clean };
}

function toItem(r: Raindrop): LeselisteItem {
  const bookTag = LESELISTE.bookTag.toLowerCase();
  const tags = (r.tags ?? []).map((t) => t.toLowerCase());
  const isBook = tags.includes(bookTag);
  const { title, author } = isBook ? splitBookTitle(r.title) : { title: r.title.trim(), author: undefined };
  return {
    id: String(r._id),
    type: isBook ? 'bok' : 'artikkel',
    title,
    author,
    url: r.link,
    source: (r.domain ?? new URL(r.link).hostname).replace(/^www\./, ''),
    note: r.note?.trim() || undefined,
    image: r.cover || undefined,
    date: r.created,
    tags: tags.filter((t) => t !== bookTag),
  };
}

export async function fetchLeseliste(): Promise<LeselisteItem[] | null> {
  const token = process.env.RAINDROP_TOKEN ?? import.meta.env.RAINDROP_TOKEN;
  if (!token) return null;
  const items: Raindrop[] = [];
  for (let page = 0; page < 20; page++) {
    const url = `https://api.raindrop.io/rest/v1/raindrops/${LESELISTE.collectionId}?perpage=50&page=${page}&sort=-created`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Kunne ikke hente leselisten fra Raindrop (${res.status})`);
    const json = (await res.json()) as { items: Raindrop[] };
    items.push(...json.items);
    if (json.items.length < 50) break;
  }
  return items.map(toItem);
}

export function leselisteLoader(): Loader {
  return {
    name: 'leseliste',
    load: async ({ store, logger, parseData }) => {
      let items: LeselisteItem[] | null;
      try {
        items = await fetchLeseliste();
      } catch (err) {
        // Raindrop nede eller ugyldig nøkkel: behold det vi har fra før, og bygg videre.
        logger.warn(`${(err as Error).message}. Leselisten er ikke oppdatert.`);
        return;
      }
      const fromRaindrop = items !== null;
      items ??= eksempel as LeselisteItem[];
      store.clear();
      for (const item of items) {
        store.set({ id: item.id, data: await parseData({ id: item.id, data: { ...item } }) });
      }
      logger.info(`Leseliste: ${items.length} ting ${fromRaindrop ? 'fra Raindrop' : '(eksempler – RAINDROP_TOKEN mangler)'}`);
    },
  };
}
