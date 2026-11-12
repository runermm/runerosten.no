import { getCollection } from 'astro:content';

// Overskrift og undertekst for en anmeldelse i lister.
export const reviewListTitle = (d: { title: string; headline?: string; bookAuthor: string }) => ({
  title: d.headline ?? d.title,
  byline: d.headline ? `${d.title} av ${d.bookAuthor}` : `av ${d.bookAuthor}`,
});

export const formatDate = (d: Date) =>
  d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' });

// Utkast vises når du kjører lokalt, men publiseres ikke.
const visible = ({ data }: { data: { draft: boolean } }) => import.meta.env.DEV || !data.draft;

export async function getArtikler() {
  return (await getCollection('artikler', visible)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );
}

export async function getAnmeldelser() {
  return (await getCollection('anmeldelser', visible)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );
}

export async function getLeseliste() {
  const [items, anmeldelser] = await Promise.all([getCollection('leseliste'), getAnmeldelser()]);
  const norm = (s: string) => s.toLowerCase().trim();
  return items
    .map((i) => {
      // Bøker du har anmeldt, lenker til anmeldelsen din.
      const review =
        i.data.type === 'bok' ? anmeldelser.find((a) => norm(a.data.title) === norm(i.data.title)) : undefined;
      return { ...i.data, review: review ? { href: `/anmeldelser/${review.id}/`, rating: review.data.rating } : undefined };
    })
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());
}

export type LeselisteEntry = Awaited<ReturnType<typeof getLeseliste>>[number];
