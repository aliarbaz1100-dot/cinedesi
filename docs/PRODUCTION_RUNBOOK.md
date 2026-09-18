# CineDesi Production Runbook

## Production stack

- Domain: `cinedesi.online`
- Source control: GitHub (`aliarbaz1100-dot/cinedesi`)
- Hosting/deploy: Cloudflare Worker static assets
- Database/auth: Supabase
- Primary deploy workflow: `.github/workflows/deploy-cloudflare.yml`
- Health monitoring: `.github/workflows/health-check.yml`

## Non-negotiable production rules

1. Do not change movie/catalog records as part of UI, SEO, branding, security, performance, marketing, or infrastructure work.
2. Create a backup branch before risky production changes.
3. Do not deploy if the build smoke checks fail.
4. Do not expose service-role keys, passwords, private API keys, subscriber data, partner inquiries, or rights-request data in the repository.
5. Public movie pages must use published records only. Thin pages remain functional but noindex until content depth qualifies.
6. Advertising and sponsorship must remain clearly labeled and separate from editorial verification.

## Deploy flow

Every main-branch production deploy:

1. Generates the current catalog from published Supabase data.
2. Generates live collection pages, media kit, Watch on CineDesi landing page, RSS feed, and sitemap.
3. Builds the Vite frontend.
4. Generates functional title routes for every published title.
5. Applies privacy consent and consent-aware analytics.
6. Runs production smoke checks, including title-link integrity.
7. Archives the verified `dist/` build as a GitHub Actions artifact for 14 days.
8. Verifies Cloudflare credentials.
9. Deploys to the existing `cinedesi` Worker.
10. Notifies IndexNow about fresh/updated URLs.

## Rollback

If a production change causes a regression:

1. Identify the most recent successful deployment SHA in GitHub Actions.
2. Prefer a named `backup/pre-*` branch created immediately before the change.
3. Fast-forward or revert `main` to the known-good commit.
4. Let the normal deploy workflow rebuild and redeploy.
5. Verify homepage, catalog, a known title page, robots.txt, sitemap.xml, favicon and security headers.
6. Do not edit catalog rows to compensate for a frontend regression.

## Build backups

Each verified production deploy uploads a `cinedesi-production-<sha>` artifact with a 14-day retention window. Git history and named backup branches provide source rollback. Cloudflare Worker deployments also provide deployment history.

Database content is not copied into GitHub because it can include private form/subscriber data. Database backup/restore must remain inside the database provider's protected backup systems.

## Incident checks

For a site outage or broken deploy, check in this order:

- GitHub Actions latest deployment status.
- Build and smoke-check step.
- Cloudflare credential verification and Worker deploy step.
- `cinedesi.online/`, `catalog.html`, `robots.txt`, `sitemap.xml`.
- Known title route such as `title-jolly-llb-3-2025.html`.
- Supabase project health and RLS/security advisors.
- Playback failures separately from site availability.

## Search/indexing rules

- Strong title pages: `index,follow` and included in sitemap.
- Thin title pages: functional for users but `noindex,follow`.
- Legacy `movie.html?slug=...`: noindex.
- `admin.html` and unsubscribe utilities: noindex.
- The official C brand icon is the permanent CineDesi identity.
- Google favicon changes depend on recrawling and are not instant.

## Privacy and monetization

- Essential storage is available without analytics consent.
- Google Analytics loads only after the visitor allows analytics.
- Advertising storage remains disabled until a compliant advertising setup is intentionally enabled.
- `ads.txt` must not contain a fabricated AdSense publisher ID.
- Add a real seller record only after an advertising account is approved and the publisher ID is confirmed.
