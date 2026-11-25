// Henter lagrede ting fra Readwise Reader når nettstedet bygges, ut fra tagger (se config.ts).
// Nøkkelen (READWISE_TOKEN) ligger i .env lokalt og som hemmelighet på GitHub.

import flyttet from './data/readwise-datoer.json';

const API = 'https://readwise.io/api/v3';

// Det nettstedet trenger av en lagret ting, uansett hvor den kommer fra.
export interface Bokmerke {
  id: string;
  title: string;
  link: string; // adressen til originalen, ikke Readwise-siden
  domain: string;
  note?: string;
  cover?: string;
  tags: string[];
  created: string;
}

// Feltene vi bruker fra Readwise. `tags` er et objekt med taggene som nøkler.
interface Dokument {
  id: string;
  url: string;
  source_url?: string | null;
  title?: string | null;
  notes?: string | null;
  image_url?: string | null;
  tags?: Record<string, { name?: string }> | string[] | null;
  saved_at?: string | null;
  created_at: string;
  parent_id?: string | null;
}

const gyldigUrl = (s?: string | null): string | undefined => {
  if (!s) return undefined;
  try {
    return /^https?:$/.test(new URL(s).protocol) ? s : undefined;
  } catch {
    return undefined;
  }
};

const taggnavn = (t: Dokument['tags']): string[] => {
  if (!t) return [];
  const navn = Array.isArray(t) ? t : Object.entries(t).map(([key, v]) => v?.name ?? key);
  return navn.map((n) => n.toLowerCase());
};

// Importen ga alt samme lagringsdato og mistet noen bilder, så flyttede ting beholder det de hadde i Raindrop.
const flyttetNokkel = (link: string): string => {
  const u = new URL(link);
  const q = ['v', 'i'].filter((k) => u.searchParams.has(k)).map((k) => `${k}=${u.searchParams.get(k)}`).join('&');
  return u.hostname.replace(/^www\./, '').toLowerCase() + u.pathname.replace(/\/+$/, '') + (q ? `?${q}` : '');
};

function tilBokmerke(d: Dokument): Bokmerke {
  const link = gyldigUrl(d.source_url) ?? d.url;
  const nokkel = flyttetNokkel(link);
  return {
    id: d.id,
    title: d.title?.trim() || link,
    link,
    domain: new URL(link).hostname.replace(/^www\./, ''),
    note: d.notes?.trim() || undefined,
    // Bilder hentes alltid over https, ellers advarer nettlesere og sikkerhetsfiltre om blandet innhold.
    cover: (gyldigUrl(d.image_url) ?? (flyttet.bilder as Record<string, string>)[nokkel])?.replace(/^http:\/\//, 'https://'),
    tags: taggnavn(d.tags),
    created: (flyttet.datoer as Record<string, string>)[nokkel] ?? d.saved_at ?? d.created_at,
  };
}

// Readwise tillater 20 kall i minuttet, så vi venter og prøver igjen hvis grensen nås.
async function hent<T>(url: string, token: string): Promise<T> {
  for (let forsok = 0; ; forsok++) {
    const res = await fetch(url, { headers: { Authorization: `Token ${token}` } });
    if (res.status === 429 && forsok < 3) {
      const sek = Number(res.headers.get('Retry-After')) || 60;
      await new Promise((r) => setTimeout(r, (sek + 1) * 1000));
      continue;
    }
    if (!res.ok) throw new Error(`Kunne ikke hente fra Readwise (${res.status})`);
    return (await res.json()) as T;
  }
}

async function hentAlle<T>(start: string, token: string): Promise<T[]> {
  const alle: T[] = [];
  let cursor: string | null | undefined;
  do {
    const url = new URL(start);
    if (cursor) url.searchParams.set('pageCursor', cursor);
    const side = await hent<{ results: T[]; nextPageCursor?: string | null }>(url.href, token);
    alle.push(...side.results);
    cursor = side.nextPageCursor;
  } while (cursor);
  return alle;
}

// Readwise filtrerer på taggens nøkkel, så navnene slås opp én gang per bygging.
let taggnokler: Promise<Map<string, string>> | undefined;
const nokler = (token: string) =>
  (taggnokler ??= hentAlle<{ key: string; name: string }>(`${API}/tags/`, token).then(
    (t) => new Map(t.map((x) => [x.name.toLowerCase(), x.key])),
  ));

const hentet = new Map<string, Promise<Bokmerke[]>>();

// Alt med en gitt tagg, nyeste først. null = ingen nøkkel.
export async function fetchBokmerker(tagg: string): Promise<Bokmerke[] | null> {
  const token = process.env.READWISE_TOKEN ?? import.meta.env.READWISE_TOKEN;
  if (!token) return null;
  const navn = tagg.toLowerCase();
  if (!hentet.has(navn)) {
    hentet.set(navn, (async () => {
      const key = (await nokler(token)).get(navn);
      if (!key) throw new Error(`Fant ikke taggen «${tagg}» i Readwise`);
      const url = new URL(`${API}/list/`);
      url.searchParams.set('tag', key);
      const dokumenter = await hentAlle<Dokument>(url.href, token);
      return dokumenter
        .filter((d) => !d.parent_id) // markeringer og notater er egne dokumenter
        .map(tilBokmerke)
        .sort((a, b) => b.created.localeCompare(a.created));
    })());
  }
  return hentet.get(navn)!;
}
