# CineDesi Launch Checklist

Use this as a launch gate. A box should be checked only after it has been verified on production.

## Brand and trust

- [x] Permanent CineDesi C brand icon used across web/PWA metadata.
- [x] Official Organization/WebSite structured data on the homepage.
- [x] About, Contact, Editorial, Rights, Privacy, Terms, Copyright and Disclosure pages.
- [x] Sponsor/partner page and media kit.
- [ ] Confirm public social profile URLs, then add them to Organization `sameAs` metadata.
- [ ] Confirm Google has recrawled the new favicon and official brand signals.

## SEO and discovery

- [x] Sitemap generated from live published data.
- [x] 1 functional title route per published title.
- [x] Thin pages protected with `noindex,follow`.
- [x] Collection landing pages for major content groups.
- [x] Watch on CineDesi landing page.
- [x] RSS feed for latest published titles.
- [x] IndexNow notifications for fresh/updated URLs.
- [ ] Re-run Google Search Console indexing/coverage checks when the connected Search Console tool is available.
- [ ] Re-run a fresh external technical SEO crawl after crawler quotas reset.

## Content and rights

- [ ] Finish the remaining Watch on CineDesi source-review queue.
- [ ] Recheck titles with recent playback failures before public launch promotion.
- [ ] Keep unavailable or unverified full-play sources out of the public full-play experience.
- [ ] Confirm rights/source transparency remains visible on title pages.
- [ ] Continue improving thin title pages with useful original editorial context before indexing them.

## Performance

- [x] Static first hero paint.
- [x] Mobile catalog work yields to first interaction.
- [x] Analytics network load requires analytics consent.
- [x] Long-lived caching for versioned assets.
- [ ] Re-run mobile and desktop PageSpeed/Core Web Vitals after external audit limits reset.
- [ ] Investigate any route with a sustained LCP above the launch target.

## Security and operations

- [x] HSTS, nosniff, referrer policy and CSP-related response headers.
- [x] Admin routes blocked from indexing.
- [x] Supabase RLS enabled with public/admin separation.
- [x] Duplicate RLS policies cleaned up.
- [x] Production smoke checks before every deploy.
- [x] Verified build artifact retained for 14 days.
- [x] Backup branch created before risky batches.
- [x] Scheduled production health workflow.
- [ ] Review the intentionally public limited trending RPC warning periodically; do not expose raw analytics rows.

## Monetization

- [x] Advertising disclosure.
- [x] Media kit with factual platform-scale metrics only.
- [x] Partner inquiry route.
- [x] Consent controls prepared before advertising.
- [x] `ads.txt` intentionally contains no fake seller ID.
- [ ] Apply for AdSense only when content quality, rights posture and production stability are ready.
- [ ] Add the real AdSense seller record only after publisher ID confirmation.
- [ ] Define final sponsor inventory/pricing after stable traffic data exists.
- [ ] Do not sell editorial rankings, source verification or misleading placements.

## Marketing

- [x] Share-ready Open Graph/Twitter metadata.
- [x] Static search-friendly collection pages.
- [x] RSS and IndexNow discovery.
- [ ] Activate connected social publishing workflow once the social connector is actually exposed to ChatGPT actions.
- [ ] Create official public social handles/URLs consistently using the CineDesi C identity.
- [ ] Launch promotional campaign only after the technical/content launch gate above is complete.
