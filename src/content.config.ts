import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { leselisteLoader } from './leseliste';

const artikler = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/artikler' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    linkedin: z.string().url().optional(), // lenke til originalinnlegget
    draft: z.boolean().default(false),
  }),
});

const anmeldelser = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/anmeldelser' }),
  schema: z.object({
    title: z.string(), // bokens tittel
    headline: z.string().optional(), // egen overskrift for anmeldelsen
    bookAuthor: z.string(),
    published: z.number().int().optional(), // utgivelsesår
    publisher: z.string().optional(),
    genre: z.string().optional(),
    rating: z.number().int().min(1).max(6).optional(), // terningkast (valgfritt)
    description: z.string(),
    date: z.coerce.date(), // når anmeldelsen ble publisert
    bokelskere: z.string().url().optional(), // lenke til omtalen på bokelskere.no
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const leseliste = defineCollection({
  loader: leselisteLoader(),
  schema: z.object({
    id: z.string(),
    type: z.enum(['artikkel', 'bok']),
    title: z.string(),
    url: z.string().url(),
    source: z.string(),
    author: z.string().optional(),
    note: z.string().optional(),
    image: z.string().url().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { artikler, anmeldelser, leseliste };
