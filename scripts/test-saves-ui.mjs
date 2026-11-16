// Browser half of the save-compatibility test: opens saves from older
// releases in the built game, visits every tab and sub-tab, plays a month,
// and fails on any page error or crash screen.
// Run with `npm run test:saves-ui` (builds first). Pass a number to limit fixtures.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const limit = Number(process.argv[2] ?? 0);
const dir = path.resolve('tests/save-fixtures');
let files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
// one early and one late save per release and position keeps it quick
files = files.filter((f) => /-m(14|90)/.test(f) || f.includes('retired'));
const only = process.argv[3];
if (only) files = files.filter((f) => f.includes(only));
if (limit) files = files.slice(0, limit);

const port = 4317;
const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], { stdio: 'ignore' });
const url = `http://localhost:${port}/soccer-career/`;
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(url)).ok) break; } catch { /* not up yet */ }
  await new Promise((r) => setTimeout(r, 250));
}

// cloud containers ship a fixed Chromium; elsewhere Playwright finds its own
const exe = fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
let failed = 0;
for (const f of files) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await page.evaluate((raw) => { localStorage.clear(); localStorage.setItem('xi2_save_1', raw); }, fs.readFileSync(path.join(dir, f), 'utf8'));
  await page.reload();
  await page.getByText('Saved careers').waitFor({ timeout: 5000 });
  const step = async (label, fn, arg) => { await page.evaluate(fn, arg); await page.waitForTimeout(60); if (await page.getByText('Something broke on this screen').count()) errors.push(`crash screen after ${label}`); };
  const playBtn = page.locator('button.btn-sun', { hasText: /^(Play|View)$/ }).first();
  if (!(await playBtn.count())) errors.push('save not listed on the home screen');
  else {
    await playBtn.click();
    await page.waitForTimeout(150);
    if (!(await page.locator('button[aria-label="Main menu"]').count())) errors.push('game screen did not open');
    const tabs = await page.$$eval('button.chip', (bs) => bs.map((b) => b.textContent?.trim() ?? ''));
    for (let t = 0; t < tabs.length; t++) {
      await step(`tab ${tabs[t]}`, (i) => document.querySelectorAll('button.chip')[i]?.click(), t);
      const subs = await page.$$eval('div.overflow-x-auto.mb-5 > button', (bs) => bs.length);
      for (let s = 0; s < subs; s++) await step(`${tabs[t]} sub ${s}`, (i) => document.querySelectorAll('div.overflow-x-auto.mb-5 > button')[i]?.click(), s);
    }
    await step('play month', () => [...document.querySelectorAll('button')].find((b) => /^Play [A-Z][a-z]+ →$/.test(b.textContent?.trim() ?? '') && !b.disabled)?.click());
    await page.waitForTimeout(300);
    // the save must survive a reload (and have moved out of localStorage into IndexedDB)
    await page.reload();
    await page.getByText('Saved careers').waitFor({ timeout: 5000 });
    if (!(await page.locator('button.btn-sun', { hasText: /^(Play|View)$/ }).count())) errors.push('save missing after reload');
    if (await page.evaluate(() => localStorage.getItem('xi2_save_1'))) errors.push('save still in localStorage');
  }
  if (errors.length) { failed++; console.log(`FAIL ${f}: ${[...new Set(errors)].slice(0, 3).join(' | ')}`); }
  await page.close();
}
// other games on the same github.io origin can fill the shared localStorage quota:
// saving must still work and survive a reload
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await page.evaluate(() => {
    localStorage.clear();
    const chunk = 'x'.repeat(100_000);
    try { for (let i = 0; i < 1000; i++) localStorage.setItem(`other_game_${i}`, chunk); } catch { /* full */ }
    try { for (let i = 0; i < 1000; i++) localStorage.setItem(`other_small_${i}`, 'x'.repeat(1000)); } catch { /* full */ }
  });
  await page.reload();
  await page.getByText('Saved careers').waitFor({ timeout: 5000 });
  await page.locator('button', { hasText: 'Kick off career' }).click();
  await page.waitForTimeout(300);
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => /^Play [A-Z][a-z]+ →$/.test(b.textContent?.trim() ?? ''))?.click());
  await page.waitForTimeout(300);
  if (await page.getByText(/Save failed|storage is full/i).count()) errors.push('save failed with full localStorage');
  await page.reload();
  await page.getByText('Saved careers').waitFor({ timeout: 5000 });
  if (!(await page.locator('button.btn-sun', { hasText: /^(Play|View)$/ }).count())) errors.push('save missing after reload with full localStorage');
  console.log(errors.length ? `FAIL full-storage: ${errors.join(' | ')}` : 'full-storage scenario OK');
  if (errors.length) failed++;
  await page.close();
}
await browser.close();
server.kill();
console.log(`${failed ? `${failed} FAILED` : "all passed"}: ${files.length} saves + full-storage scenario`);
process.exit(failed ? 1 : 0);
