import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const CONSENT_HEAD = `<script id="cinedesi-consent-default">window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){dataLayer.push(arguments)};try{const c=localStorage.getItem("cinedesi-consent-v1");gtag("consent","default",{analytics_storage:c==="analytics"?"granted":"denied",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied",functionality_storage:"granted",security_storage:"granted",wait_for_update:500})}catch{gtag("consent","default",{analytics_storage:"denied",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied",functionality_storage:"granted",security_storage:"granted",wait_for_update:500})}</script><script defer src="/consent.js"></script><script defer src="/analytics.js"></script>`;

const stripLegacyAnalytics = (html) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (tag) => {
  if (/id=["']cinedesi-consent-default["']/i.test(tag)) return tag;
  const hasGaId = /G-J9HJVSKXVD/i.test(tag);
  const isGaLoader = /googletagmanager\.com\/gtag\/js/i.test(tag);
  const isGaConfig = /gtag\s*\(\s*["']config["']/i.test(tag);
  const isCineDesiLoader = /loadCineDesiAnalytics|data-cinedesi-ga/i.test(tag);
  return hasGaId && (isGaLoader || isGaConfig || isCineDesiLoader) ? '' : tag;
});

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

async function main() {
  const files = await walk('dist');
  let changed = 0;
  for (const file of files) {
    let html = stripLegacyAnalytics(await readFile(file, 'utf8'));
    if (html.includes('id="cinedesi-consent-default"')) {
      await writeFile(file, html, 'utf8');
      continue;
    }
    const headIndex = html.search(/<head[^>]*>/i);
    if (headIndex < 0) continue;
    const match = html.slice(headIndex).match(/<head[^>]*>/i);
    if (!match) continue;
    const insertAt = headIndex + match.index + match[0].length;
    html = html.slice(0, insertAt) + CONSENT_HEAD + html.slice(insertAt);
    await writeFile(file, html, 'utf8');
    changed += 1;
  }
  console.log(`Applied CineDesi privacy consent defaults and consent-aware analytics to ${changed} production HTML files.`);
}

await main();
