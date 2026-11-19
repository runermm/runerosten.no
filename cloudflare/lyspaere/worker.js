// Lyspære-teller: lagrer bare et tall per tekst. Ingen informasjonskapsler, ingen IP-adresser, ingen navn.
//   GET  /?ids=artikler/a,anmeldelser/b  → { "artikler/a": 3, "anmeldelser/b": 0 }
//   POST /  { "id": "artikler/a", "retning": 1 }   (1 = tenn, -1 = angre)  → { "id": …, "n": 4 }

const GYLDIG = /^(artikler|anmeldelser)\/[a-z0-9-]{1,120}$/;

function cors(req, env) {
  const origin = req.headers.get('Origin') ?? '';
  const tillatt = (env.TILLATT ?? '').split(',').map((s) => s.trim());
  return {
    'Access-Control-Allow-Origin': tillatt.includes(origin) ? origin : tillatt[0] ?? '',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

const svar = (data, status, headers) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } });

export default {
  async fetch(req, env) {
    const h = cors(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });

    if (req.method === 'GET') {
      const ids = (new URL(req.url).searchParams.get('ids') ?? '')
        .split(',').filter((id) => GYLDIG.test(id)).slice(0, 100);
      const ut = Object.fromEntries(ids.map((id) => [id, 0]));
      if (ids.length) {
        const { results } = await env.DB
          .prepare(`SELECT id, n FROM lys WHERE id IN (${ids.map(() => '?').join(',')})`)
          .bind(...ids).all();
        for (const r of results) ut[r.id] = r.n;
      }
      return svar(ut, 200, { ...h, 'Cache-Control': 'no-store' });
    }

    if (req.method === 'POST') {
      // Bare fra nettstedet selv.
      const origin = req.headers.get('Origin') ?? '';
      if (!(env.TILLATT ?? '').split(',').map((s) => s.trim()).includes(origin)) return svar({ feil: 'ikke tillatt' }, 403, h);
      let body;
      try { body = await req.json(); } catch { return svar({ feil: 'ugyldig' }, 400, h); }
      const { id, retning } = body ?? {};
      if (!GYLDIG.test(id ?? '') || (retning !== 1 && retning !== -1)) return svar({ feil: 'ugyldig' }, 400, h);
      const rad = await env.DB
        .prepare('INSERT INTO lys (id, n) VALUES (?1, MAX(?2, 0)) ON CONFLICT(id) DO UPDATE SET n = MAX(n + ?2, 0) RETURNING n')
        .bind(id, retning).first();
      return svar({ id, n: rad?.n ?? 0 }, 200, h);
    }

    return svar({ feil: 'ukjent' }, 405, h);
  },
};
