import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ reducedMotion: 'no-preference', viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.cliReady === '2.9', { timeout: 10000 });
  assert.equal(await page.locator('#cliStatus').innerText(), 'v2.9 · Ready');
  assert.equal(await page.locator('#cliPrompt').evaluate(el => el.parentElement?.id), 'terminalBody');
  assert.equal(await page.locator('#cliTypingToggle').getAttribute('aria-pressed'), 'true');

  const input = page.locator('#cliInput');
  await page.locator('.cli-chip[data-command="help"]').click();
  await page.waitForFunction(() => document.querySelector('#cliInput')?.value?.length > 0, { timeout: 10000 });
  await page.waitForFunction(() => Array.from(document.querySelectorAll('#terminalBody .terminal-output')).some(el => el.textContent.includes('Portfolio commands')), { timeout: 15000 });
  await page.waitForFunction(() => document.querySelector('#cliInput')?.readOnly === false);
  assert.ok((await page.locator('#terminalBody').innerText()).includes('Portfolio commands'));

  await input.fill('whoami');
  await input.press('Enter');
  await page.waitForFunction(() => document.querySelector('#terminalBody')?.textContent.includes('visitor — exploring the Edrees Dahlan portfolio'), { timeout: 15000 });

  await input.fill('pro');
  await input.press('Tab');
  assert.equal(await input.inputValue(), 'projects');
  await input.fill('');

  await page.locator('.cli-chip[data-command="clear"]').click();
  await page.waitForFunction(() => document.querySelectorAll('#terminalBody .terminal-output').length === 0, { timeout: 15000 });
  assert.equal(await page.locator('#cliPrompt').count(), 1);
  assert.equal(await page.locator('#cliInput').count(), 1);
  assert.equal(await input.isEditable(), true);
  assert.deepEqual(errors, []);
  console.log('PASS CLI home page: load, ready marker, chip typewriting, streamed help output, whoami, autocomplete, clear');

  const reduced = await browser.newPage({ reducedMotion: 'reduce' });
  await reduced.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'domcontentloaded' });
  await reduced.waitForFunction(() => document.documentElement.dataset.cliReady === '2.9');
  assert.equal(await reduced.locator('#cliTypingToggle').getAttribute('aria-pressed'), 'false');
  await reduced.locator('#cliTypingToggle').click();
  assert.equal(await reduced.locator('#cliTypingToggle').getAttribute('aria-pressed'), 'true');
  console.log('PASS reduced motion: explicit opt-in enables animation');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
