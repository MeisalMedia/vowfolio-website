# vowfolio-studio

Repo for **studio.vowfolio.com** — interaktiv SPA-app for fotografer.
Marketing-siden (vowfolio.com) ligger i et eget repo: `vowfolio-website`.

## Språk

All kommunikasjon, kommentarer og commit-meldinger skal være på **norsk**.

## Git workflow

Push direkte til `main` er ok her — Cloudflare Pages auto-deployer fra main.

Men lag også en PR for historikkens skyld, så endringene er sporbare.

**Anbefalt arbeidsflyt:**
1. Opprett ny branch (kan hete hva som helst — `claude/foo`, `fix/bar`, osv.)
2. Commit endringene
3. Push branchen
4. Åpne PR mot main
5. Self-merge via GitHub UI (Cloudflare deployer automatisk)

**Akseptabelt for små fix:** push direkte til main + lag PR i ettertid for dokumentasjon.

iOS-repoen har strengere regel (alltid branch + PR + Helge godkjenner).

## Deploy

Statisk side hostet på Cloudflare Pages. Pushes til `main` trigger auto-deploy til https://studio.vowfolio.com.

Cloudflare Pages-prosjektet heter `studio` og bygger fra `/studio`-mappa i denne repoen.

Clean URLs støttes (f.eks. `/signup` serverer `studio/signup.html`).

## Hva ligger i denne repoen

- `studio/` — Studio SPA (Supabase, Quill-editor, hash-routing)
  - `index.html` — hovedapp
  - `signup.html` — onboarding-flyt
  - `_redirects` — SPA-fallback for klient-side ruting
- `wrangler.jsonc` — Cloudflare Workers-config (legacy, kan ryddes)

Filer som tidligere var her men nå er flyttet til `vowfolio-website` (Astro):
- index.html, pricing.html, contact.html, feedback.html, terms.html, privacy.html
- portal.html, portal-session.html, editor.html, quiz.html, signing.html
- styleguide.html, contact-embed.js, app-screens/

Disse filene kan ligge her som døde kopier inntil videre — de blir ikke serverte siden vowfolio.com nå peker på Astro-prosjektet.
