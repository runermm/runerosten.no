# Lyspære-telleren

En liten, gratis teller hos Cloudflare som husker hvor mange lyspærer hver tekst har fått.
Den lagrer bare tallet: ingen informasjonskapsler, IP-adresser eller navn.

## Oppsett (én gang)

1. Lag en gratis konto på https://dash.cloudflare.com/sign-up.
2. I denne mappen: `npx wrangler login` (logg inn i nettleseren).
3. `npx wrangler d1 create lyspaere` og lim inn `database_id` i `wrangler.toml`.
4. `npx wrangler d1 execute lyspaere --remote --file=schema.sql`
5. `npx wrangler deploy` og skriv adressen du får (https://lyspaere.<navn>.workers.dev) inn i
   `LYSPAERE.endpoint` i `src/config.ts`.

Test lokalt uten konto: `npx wrangler d1 execute lyspaere --local --file=schema.sql` og `npx wrangler dev --port 8787`,
og sett `endpoint` til `http://localhost:8787` mens du tester.
