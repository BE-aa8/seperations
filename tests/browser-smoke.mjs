// Browser smoke test for every build (plan-v2-final.md, Section 14, item 4).
// Generic: it relies only on standard markup (tabs, range sliders, KaTeX, Plotly),
// so it grades the Claude and Gemini builds the same way.
//
// Usage:
//   python3 -m http.server 8000 -d site &      # serve the site folder
//   node tests/browser-smoke.mjs --base http://localhost:8000 --paths /,/gemini/ --out docs/screenshots/verification/run
// Exit code 1 if any check fails. Writes report.json and report.md to --out.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright'); // CommonJS require also finds a globally installed Playwright
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1]]);
  return acc;
}, []));
const BASE = (args.base || 'http://localhost:8000').replace(/\/$/, '');
const PATHS = (args.paths || '/').split(',');
const OUT = args.out || 'docs/screenshots/verification/latest';
mkdirSync(OUT, { recursive: true });

// Tab controls only (not panels): ARIA tabs, in-page nav links, or buttons/links carrying data-tab.
const TAB_SELECTOR = '[role="tab"], nav a[href^="#"], button[data-tab], a[data-tab]';

async function listTabs(page) {
  return page.$$eval(TAB_SELECTOR, (els) => {
    const seen = new Set();
    return els
      .filter((e) => e.offsetParent !== null || e.getClientRects().length)
      .map((e, i) => ({ i, label: (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40), href: e.getAttribute('href') || '' }))
      .filter((t) => t.label && !seen.has(t.label) && seen.add(t.label));
  });
}

async function clickTab(page, label) {
  const loc = page.locator(TAB_SELECTOR).filter({ hasText: label }).locator('visible=true').first();
  await loc.click();
  await page.waitForTimeout(700);
}

async function pageChecks(page) {
  return page.evaluate(() => {
    const visible = (el) => !!(el.offsetParent || el.getClientRects().length);
    const plots = [...document.querySelectorAll('.js-plotly-plot')].filter(visible);
    const body = document.body.innerText || '';
    return {
      katex: [...document.querySelectorAll('.katex')].filter(visible).length,
      katexErrors: [...document.querySelectorAll('.katex-error')].filter(visible).length,
      plots: plots.length,
      plotsUnrendered: plots.filter((p) => !p.querySelector('.main-svg')).length,
      nanText: /NaN|\bundefined\b|Infinity/.test(body),
      sliders: [...document.querySelectorAll('input[type="range"]')].filter(visible).length,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    };
  });
}

async function signature(page) {
  return page.evaluate(() => {
    const plots = [...document.querySelectorAll('.js-plotly-plot')].map((g) => JSON.stringify(g.data || []));
    const s = plots.join('|') + (document.querySelector('main') || document.body).innerText;
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return h;
  });
}

async function testBuild(browser, path) {
  const name = path === '/' ? 'root' : path.replace(/\//g, '');
  const dir = join(OUT, name);
  mkdirSync(dir, { recursive: true });
  const result = { path, tabs: [], sliders: [], failures: [], consoleErrors: [] };
  const fail = (msg) => result.failures.push(msg);

  // ---------- desktop ----------
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  page.on('console', (m) => m.type() === 'error' && result.consoleErrors.push(m.text()));
  page.on('pageerror', (e) => result.consoleErrors.push(String(e)));
  const resp = await page.goto(BASE + path, { waitUntil: 'networkidle' }).catch((e) => ({ status: () => 0, err: e }));
  if (!resp || resp.status() >= 400 || resp.status() === 0) {
    result.skipped = `not reachable (HTTP ${resp && resp.status()})`;
    await page.close();
    return result;
  }
  await page.waitForTimeout(1000);
  const tabs = await listTabs(page);
  if (tabs.length < 7) fail(`found ${tabs.length} tabs, expected >= 7`);

  let simTab = null;
  let maxSliders = 0;
  for (const t of tabs) {
    await clickTab(page, t.label);
    const c = await pageChecks(page);
    const file = `desktop-${String(result.tabs.length + 1).padStart(2, '0')}-${t.label.replace(/[^a-z0-9]+/gi, '_').slice(0, 30)}.png`;
    await page.screenshot({ path: join(dir, file), fullPage: true });
    result.tabs.push({ label: t.label, ...c, screenshot: file });
    if (c.katexErrors) fail(`tab "${t.label}": ${c.katexErrors} KaTeX render errors`);
    if (c.plotsUnrendered) fail(`tab "${t.label}": ${c.plotsUnrendered} Plotly charts not rendered`);
    if (c.nanText) fail(`tab "${t.label}": page shows NaN/undefined/Infinity`);
    if (c.sliders > maxSliders) { maxSliders = c.sliders; simTab = t.label; }
  }
  const theory = result.tabs.find((t) => /theory/i.test(t.label));
  if (theory && theory.katex === 0) fail('Theory tab has no rendered KaTeX equations');

  // ---------- sliders: each must change a chart or a result ----------
  if (!simTab) fail('no tab with range sliders found');
  else {
    await clickTab(page, simTab);
    const n = await page.locator('input[type="range"]:visible').count();
    for (let k = 0; k < n; k++) {
      const s = page.locator('input[type="range"]:visible').nth(k);
      const id = (await s.getAttribute('id')) || (await s.getAttribute('name')) || `slider-${k}`;
      const before = await signature(page);
      await s.evaluate((el) => {
        const min = +el.min || 0, max = el.max === '' ? 100 : +el.max;
        const v = +el.value;
        const target = v + (max - min) * 0.3 <= max ? v + (max - min) * 0.3 : v - (max - min) * 0.3;
        el.value = String(target);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await page.waitForTimeout(400);
      const after = await signature(page);
      const c = await pageChecks(page);
      result.sliders.push({ id, changed: before !== after, nan: c.nanText });
      if (before === after) fail(`slider "${id}" changed nothing`);
      if (c.nanText) fail(`slider "${id}": NaN/undefined shown after moving it`);
    }
  }
  if (result.consoleErrors.length) fail(`${result.consoleErrors.length} console errors`);
  await page.close();

  // ---------- mobile 375 px ----------
  const m = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await m.goto(BASE + path, { waitUntil: 'networkidle' });
  await m.waitForTimeout(1000);
  for (const [idx, t] of (await listTabs(m)).entries()) {
    await clickTab(m, t.label).catch(() => {});
    const c = await pageChecks(m);
    const file = `mobile-${String(idx + 1).padStart(2, '0')}-${t.label.replace(/[^a-z0-9]+/gi, '_').slice(0, 30)}.png`;
    await m.screenshot({ path: join(dir, file), fullPage: true });
    if (c.scrollWidth > c.clientWidth + 1) fail(`mobile tab "${t.label}": horizontal scroll (${c.scrollWidth}px > ${c.clientWidth}px)`);
  }
  await m.close();
  return result;
}

const browser = await chromium.launch();
const results = [];
for (const p of PATHS) results.push(await testBuild(browser, p));
await browser.close();

writeFileSync(join(OUT, 'report.json'), JSON.stringify(results, null, 2));
const md = results.map((r) => [
  `## ${r.path}`,
  r.skipped ? `Skipped: ${r.skipped}` : `Tabs: ${r.tabs.length} · sliders tested: ${r.sliders.length} · failures: ${r.failures.length}`,
  ...r.failures.map((f) => `- ❌ ${f}`),
  ...(r.consoleErrors.length ? ['', 'Console errors:', ...r.consoleErrors.slice(0, 20).map((e) => `- ${e}`)] : []),
].join('\n')).join('\n\n');
writeFileSync(join(OUT, 'report.md'), `# Browser smoke test\n\n${md}\n`);
console.log(md);
process.exit(results.some((r) => !r.skipped && r.failures.length) ? 1 : 0);
