#!/usr/bin/env node
// Importerer innlegg og artikler fra et LinkedIn-dataarkiv til src/content/artikler/.
//
// Bruk:  npm run import:linkedin -- "<sti til utpakket LinkedIn-arkiv>"
//
// - Innlegg leses fra Shares.csv, artikler fra Articles/Articles/*.html.
// - Alt importeres som utkast (draft: true), så du kan se gjennom før publisering.
// - Filer som finnes fra før, røres ikke. Det er trygt å kjøre skriptet flere ganger.
// - Bilder lastes ned til public/bilder/linkedin/.

import fs from 'node:fs';
import path from 'node:path';

// Kortere innlegg (nyheter, stillingsannonser, delte lenker) hoppes over. Endre med --min=400.
const MIN_TEGN = Number(process.argv.find((a) => a.startsWith('--min='))?.slice(6) ?? 1200);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT_DIR = process.env.LINKEDIN_OUT_DIR ?? path.join(ROOT, 'src/content/artikler');
const IMG_DIR = process.env.LINKEDIN_IMG_DIR ?? path.join(ROOT, 'public/bilder/linkedin');

// ---------- hjelpere ----------

// CSV-tolker som tåler sitater, doble anførselstegn og linjeskift inne i felt.
export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [header, ...data] = rows.filter((r) => r.some((f) => f.trim()));
  return data.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), r[i] ?? ''])));
}

export function slugify(s) {
  return s
    .toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
    .replace(/-+[^-]*$/, (m) => (m.length > 15 ? '' : m)) // ikke kutt midt i et langt ord
    .replace(/-+$/, '') || 'innlegg';
}

const decodeEntities = (s) =>
  s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));

const yamlStr = (s) => JSON.stringify(s); // JSON-strenger er gyldig YAML

// LinkedIn skriver hashtagger og omtaler i egne formater i eksporten.
export function cleanLinkedInText(text) {
  // Nyere eksporter pakker hver linje inn i anførselstegn: linje1"\n"linje2"\n""\n"linje3
  if (/"\r?\n"/.test(text)) {
    text = text.replace(/"\r?\n"/g, '\n').replace(/^"+|"+$/g, '');
  }
  return text
    .replace(/\{hashtag\|\\?#\|([^}]+)\}/g, '#$1')
    .replace(/@\[([^\]]+)\]\(urn:li:[^)]+\)/g, '$1')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Tar ut hashtagger: en avsluttende linje med bare hashtagger fjernes, andre beholdes som ord.
export function extractTags(text) {
  const tags = new Set();
  const lines = text.split('\n');
  while (lines.length && /^\s*(#[\p{L}\p{N}_]+[\s,]*)+$/u.test(lines.at(-1))) {
    for (const m of lines.pop().matchAll(/#([\p{L}\p{N}_]+)/gu)) tags.add(m[1].toLowerCase());
    while (lines.length && !lines.at(-1).trim()) lines.pop();
  }
  let body = lines.join('\n');
  body = body.replace(/(^|\s)#([\p{L}\p{N}_]+)/gu, (_, pre, tag) => {
    tags.add(tag.toLowerCase());
    return pre + tag;
  });
  return { body, tags: [...tags] };
}

// «DATAKRAFT VS. DØMMEKRAFT» → «Datakraft vs. dømmekraft». Kjente forkortelser beholdes.
const KEEP_UPPER = new Set(['KI', 'AI', 'VAR', 'NHH', 'USA', 'EU', 'IT', 'AGI', 'CEO', 'CTO']);
export function sentenceCase(s) {
  if (s !== s.toUpperCase()) return s; // bare titler i STORE BOKSTAVER endres
  const out = s.toLowerCase().replace(/[\p{L}\p{N}]+/gu, (w) => (KEEP_UPPER.has(w.toUpperCase()) ? w.toUpperCase() : w));
  return out.charAt(0).toUpperCase() + out.slice(1);
}

// Tittel: «TITTEL: resten» eller «Kort tittel: resten» (Runes vanlige stil), ellers første setning, maks ~90 tegn.
// Blir tittelen hele første setning, fjernes den fra brødteksten så den ikke står to ganger.
export function makeTitle(body) {
  const first = body.split('\n').find((l) => l.trim()) ?? '';
  const emoji = /^[\p{Extended_Pictographic}\p{Emoji_Presentation}️\s]+|[\p{Extended_Pictographic}\p{Emoji_Presentation}️\s]+$/gu;
  const clean = first.replace(emoji, '').trim();
  const colon = clean.match(/^([^:]{3,60}):\s+(.+)$/u);
  const lettersOnly = clean.replace(/[^\p{L}]/gu, '');
  if (lettersOnly && lettersOnly === lettersOnly.toUpperCase()) {
    // Hele første linje i store bokstaver er tittelen.
    return { title: sentenceCase(clean.replace(/[.:]$/, '').trim()), rest: body.slice(body.indexOf(first) + first.length).trim() };
  }
  if (colon) {
    // Teksten før kolon er tittelen; resten av linja blir første avsnitt (ingressen).
    return { title: sentenceCase(colon[1].trim()), rest: (colon[2] + body.slice(body.indexOf(first) + first.length)).trim() };
  }
  // Første setning; «vs.» og lignende avslutter ikke en setning.
  const sentence = clean.match(/^(.+?(?<!\bvs|\bca|\bf\.eks|\bbl\.a)[.!?])(\s|$)/u)?.[1] ?? clean;
  let title = sentence;
  let complete = true;
  if (title.length > 90) {
    // Kutt ved komma eller tankestrek hvis mulig, ellers ved et ord.
    const cut = title.slice(0, 90).match(/^(.{30,}?)[,;–—](?!.*[,;–—])/u)?.[1];
    title = cut ?? title.slice(0, 90).replace(/\s+\S*$/, '') + ' …';
    complete = false;
  }
  title = sentenceCase(title.replace(/[.:]$/, '').trim());
  let rest = body;
  if (complete) {
    const start = body.indexOf(first);
    const lineRest = first.slice(first.indexOf(sentence) + sentence.length).replace(emoji, '').trim();
    rest = (lineRest ? lineRest + '\n' : '') + body.slice(start + first.length);
  }
  return { title, rest: rest.trim() || body };
}

export function makeDescription(text) {
  const plain = text
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/^\*[^\n]*\*$/m, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/<?(https?:\/\/\S+?)>?(?=\s|$)/g, '').replace(/[*_>#]/g, '').replace(/\s+/g, ' ').trim();
  return plain.length <= 160 ? plain : plain.slice(0, 157).replace(/\s+\S*$/, '') + ' …';
}

// Vanlige nettadresser blir klikkbare lenker i Markdown.
const linkify = (s) => s.replace(/(^|[\s(])(https?:\/\/[^\s)]+)/g, '$1<$2>');

// Enkel HTML → Markdown for LinkedIn-artikler.
export function htmlToMarkdown(html) {
  let s = html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '')
    .replace(/<img[^>]*src="([^"]+)"[^>]*>/gi, (_, src) => `\n\n![](${src})\n\n`)
    .replace(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi, '\n\n## $1\n\n')
    .replace(/<h[3-6][^>]*>([\s\S]*?)<\/h[3-6]>/gi, '\n\n### $1\n\n')
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, t) => '\n\n> ' + t.trim() + '\n\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1')
    .replace(/<\/?(ul|ol)[^>]*>/gi, '\n')
    .replace(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    // Mellomrom innenfor fet/kursiv flyttes utenfor, ellers forsvinner de.
    .replace(/<(strong|b)\b[^>]*>(\s*)([\s\S]*?)(\s*)<\/\1>/gi, (_, _t, a, t, b) => (t.trim() ? `${a}**${t}**${b}` : a + b))
    .replace(/<(em|i)\b[^>]*>(\s*)([\s\S]*?)(\s*)<\/\1>/gi, (_, _t, a, t, b) => (t.trim() ? `${a}*${t}*${b}` : a + b))
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '');
  s = decodeEntities(s);
  return s
    .split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function downloadImage(url, baseName) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    const type = res.headers.get('content-type') ?? '';
    const ext = type.includes('png') ? 'png' : type.includes('gif') ? 'gif' : type.includes('webp') ? 'webp' : 'jpg';
    fs.mkdirSync(IMG_DIR, { recursive: true });
    const file = `${baseName}.${ext}`;
    fs.writeFileSync(path.join(IMG_DIR, file), Buffer.from(await res.arrayBuffer()));
    return `/bilder/linkedin/${file}`;
  } catch (err) {
    console.warn(`  ! Kunne ikke laste ned bilde (${err.message}): ${url.slice(0, 80)}…`);
    return null;
  }
}

const toIsoDate = (s) => {
  const d = new Date(s.trim().replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? '' : 'Z'));
  return isNaN(d) ? null : d.toISOString().slice(0, 10);
};

// Titler som allerede finnes på nettstedet (artikler og anmeldelsers overskrifter), så vi ikke importerer dobbelt.
const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
function existingTitles() {
  const titles = new Set();
  const dirs = [OUT_DIR, path.join(ROOT, 'src/content/anmeldelser')];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.md'))) {
      const fm = fs.readFileSync(path.join(dir, f), 'utf8').split('---')[1] ?? '';
      for (const m of fm.matchAll(/^(?:title|headline):\s*"?(.+?)"?\s*$/gm)) titles.add(norm(m[1]));
    }
  }
  return titles;
}

// Første avsnitt blir ingress (beskrivelse) og fjernes fra brødteksten, hvis det er passe kort.
export function splitLead(text) {
  const [first, ...rest] = text.split(/\n\s*\n/);
  if (first && first.length <= 400 && rest.length) return { lead: first.replace(/\s+/g, ' ').trim(), body: rest.join('\n\n') };
  return { lead: makeDescription(text), body: text };
}

function uniqueSlug(base, used) {
  let slug = base, n = 2;
  while (used.has(slug) || fs.existsSync(path.join(OUT_DIR, `${slug}.md`))) {
    if (fs.existsSync(path.join(OUT_DIR, `${slug}.md`))) return { slug, exists: true };
    slug = `${base}-${n++}`;
  }
  used.add(slug);
  return { slug, exists: false };
}

function writeArticle({ slug, title, description, date, tags, linkedin, body }) {
  const fm = [
    '---',
    `title: ${yamlStr(title)}`,
    `description: ${yamlStr(description)}`,
    `date: ${date}`,
    `tags: [${tags.map(yamlStr).join(', ')}]`,
    linkedin ? `linkedin: ${yamlStr(linkedin)}` : null,
    'draft: true',
    '---',
    '',
  ].filter((l) => l !== null);
  fs.writeFileSync(path.join(OUT_DIR, `${slug}.md`), fm.join('\n') + body.trim() + '\n');
}

// ---------- import ----------

async function importShares(archive, used, stats) {
  const file = path.join(archive, 'Shares.csv');
  if (!fs.existsSync(file)) {
    console.log('Fant ikke Shares.csv (innlegg). Den kommer bare i det fullstendige arkivet.');
    return;
  }
  const rows = parseCsv(fs.readFileSync(file, 'utf8'));
  const known = existingTitles();
  console.log(`Innlegg: ${rows.length} i Shares.csv (tar med de på minst ${MIN_TEGN} tegn)`);
  for (const r of rows) {
    const raw = cleanLinkedInText(r.ShareCommentary ?? '');
    const date = toIsoDate(r.Date ?? '');
    if (raw.length < MIN_TEGN || !date) { stats.skipped++; continue; }
    const { body: noTags, tags } = extractTags(raw);
    const { title, rest } = makeTitle(noTags);
    if (known.has(norm(title))) { stats.existing++; console.log(`  = finnes allerede: ${title}`); continue; }
    const { slug, exists } = uniqueSlug(slugify(title), used);
    if (exists) { stats.existing++; continue; }
    const { lead, body: restBody } = splitLead(rest);
    let body = linkify(restBody);
    const media = (r.MediaUrl ?? '').trim();
    if (media) {
      const img = await downloadImage(media, slug);
      if (img) body = `![](${img})\n\n${body}`;
    }
    const shared = (r.SharedUrl ?? '').trim();
    if (shared) body += `\n\nLenke: <${shared}>`;
    writeArticle({ slug, title, description: lead, date, tags, linkedin: (r.ShareLink ?? '').trim() || undefined, body });
    stats.created.push(slug);
  }
}

async function importArticles(archive, used, stats) {
  const dir = path.join(archive, 'Articles', 'Articles');
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.html'));
  console.log(`Artikler: ${files.length} i Articles/`);
  for (const f of files) {
    const html = fs.readFileSync(path.join(dir, f), 'utf8');
    const title = decodeEntities(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() ?? f);
    const published = html.match(/class="published">Published on ([^<]+)</)?.[1]?.trim();
    const created = html.match(/class="created">Created on ([^<]+)</)?.[1]?.trim();
    const date = toIsoDate(published && published !== '---' ? published : created ?? f.slice(0, 19)) ?? toIsoDate(f.slice(0, 10));
    const bodyHtml = (html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html)
      .replace(/<h1[\s\S]*?<\/h1>/i, '')
      .replace(/<p class="(created|published)">[\s\S]*?<\/p>/gi, '');
    let body = htmlToMarkdown(bodyHtml);
    const { slug, exists } = uniqueSlug(slugify(title), used);
    if (exists) { stats.existing++; continue; }
    // Last ned bilder i artikkelen.
    let i = 1;
    for (const m of [...body.matchAll(/!\[\]\((https?:[^)]+)\)/g)]) {
      const local = await downloadImage(decodeEntities(m[1]), `${slug}-${i++}`);
      body = body.replace(m[0], local ? `![](${local})` : '');
    }
    if (published === '---') body = `*Dette er et utkast som aldri ble publisert på LinkedIn.*\n\n${body}`;
    writeArticle({ slug, title, description: makeDescription(body.replace(/^\*[^\n]*\*\n\n/, '')) || title, date, tags: [], body });
    stats.created.push(slug);
  }
}

async function main() {
  const archive = process.argv[2];
  if (!archive || !fs.existsSync(archive)) {
    console.error('Bruk: npm run import:linkedin -- "<sti til utpakket LinkedIn-arkiv>"');
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stats = { created: [], skipped: 0, existing: 0 };
  const used = new Set();
  await importShares(archive, used, stats);
  await importArticles(archive, used, stats);
  console.log(`\nFerdig: ${stats.created.length} nye utkast, ${stats.skipped} korte innlegg hoppet over, ${stats.existing} fantes fra før.`);
  for (const s of stats.created) console.log(`  + src/content/artikler/${s}.md`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
