// Henter leselisten fra Readwise Reader (taggen LESELISTE.tag) når nettstedet bygges.
// Nøkkelen (READWISE_TOKEN) ligger i .env lokalt og som hemmelighet på GitHub.
// Uten nøkkel brukes eksempeldata fra src/data/leseliste-eksempel.json.
import type { Loader } from 'astro/loaders';
import { LESELISTE } from './config';
import { fetchBokmerker, type Bokmerke } from './readwise';
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

// «Sult av Knut Hamsun | Bokelskere.no» → tittel «Sult», forfatter «Knut Hamsun»
function splitBookTitle(raw: string): { title: string; author?: string } {
  const clean = raw.replace(/\s+[|–—-]\s+[^|–—-]+$/, '').trim();
  const m = clean.match(/^(.+?)\s+(?:av|by)\s+(.+)$/i);
  return m ? { title: m[1].trim(), author: m[2].trim() } : { title: clean };
}

function toItem(r: Bokmerke): LeselisteItem {
  const bookTag = LESELISTE.bookTag.toLowerCase();
  const isBook = r.tags.includes(bookTag);
  const { title, author } = isBook ? splitBookTitle(r.title) : { title: r.title.trim(), author: undefined };
  return {
    id: r.id,
    type: isBook ? 'bok' : 'artikkel',
    title,
    author,
    url: r.link,
    source: r.domain,
    note: r.note,
    image: r.cover,
    date: r.created,
    tags: r.tags.filter((t) => t !== bookTag && t !== LESELISTE.tag.toLowerCase()),
  };
}

export async function fetchLeseliste(): Promise<LeselisteItem[] | null> {
  if (!LESELISTE.tag) return null;
  const items = await fetchBokmerker(LESELISTE.tag);
  return items && items.map(toItem);
}

export function leselisteLoader(): Loader {
  return {
    name: 'leseliste',
    load: async ({ store, logger, parseData }) => {
      let items: LeselisteItem[] | null;
      try {
        items = await fetchLeseliste();
      } catch (err) {
        // Readwise nede eller ugyldig nøkkel: behold det vi har fra før, og bygg videre.
        logger.warn(`${(err as Error).message}. Leselisten er ikke oppdatert.`);
        return;
      }
      const fraReadwise = items !== null;
      items ??= eksempel as LeselisteItem[];
      store.clear();
      for (const item of items) {
        store.set({ id: item.id, data: await parseData({ id: item.id, data: { ...item } }) });
      }
      logger.info(`Leseliste: ${items.length} ting ${fraReadwise ? 'fra Readwise' : '(eksempler – READWISE_TOKEN mangler)'}`);
    },
  };
}
