import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ reducedMotion: 'no-preference', viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.cliReady === '3.0', { timeout: 10000 });
  assert.equal(await page.locator('#cliStatus').innerText(), 'v3.0 · Ready');
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
  await page.waitForFunction(() => document.querySelector('#terminalBody')?.textContent.includes('Edrees Dahlan'), { timeout: 15000 });

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
  await reduced.waitForFunction(() => document.documentElement.dataset.cliReady === '3.0');
  assert.equal(await reduced.locator('#cliTypingToggle').getAttribute('aria-pressed'), 'false');
  await reduced.locator('#cliTypingToggle').click();
  assert.equal(await reduced.locator('#cliTypingToggle').getAttribute('aria-pressed'), 'true');
  console.log('PASS reduced motion: explicit opt-in enables animation');

  const introContext = await browser.newContext({
    reducedMotion: 'no-preference',
    viewport: { width: 390, height: 844 }
  });
  const intro = await introContext.newPage();
  const introErrors = [];
  intro.on('pageerror', error => introErrors.push(error.message));

  await intro.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'domcontentloaded' });
  await intro.waitForFunction(() => document.documentElement.dataset.cliIntro === 'complete', { timeout: 25000 });
  const items = await intro.locator('#terminalBody .cli-welcome-output').allInnerTexts();
  assert.equal(items.length, 2, 'Autoplay should show precisely two commands');
  assert.match(items[0], /whoami/);
  assert.match(items[0], /Edrees Dahlan.*E-commerce Manager/);
  assert.match(items[1], /help/);
  assert.match(items[1], /Available commands/);
  assert.equal(await intro.locator('#cliPrompt').count(), 1);

  const layout = await intro.evaluate(() => {
    const frame = document.querySelector('.terminal-container').getBoundingClientRect();
    const hint = document.querySelector('.terminal-hint').getBoundingClientRect();
    const button = getComputedStyle(document.querySelector('#cliTypingToggle'));
    return { buttonBackground: button.backgroundColor, hintLeft: hint.left, hintRight: hint.right, frameLeft: frame.left, frameRight: frame.right };
  });
  assert.notEqual(layout.buttonBackground, 'rgb(255, 255, 255)', 'Typing button should use the dark custom styling');
  assert.ok(layout.hintLeft >= layout.frameLeft - 1);
  assert.ok(layout.hintRight <= layout.frameRight + 1);
  console.log('PASS autoplay welcome and dark CLI layout');

  await intro.reload({ waitUntil: 'domcontentloaded' });
  await intro.waitForTimeout(2600);
  assert.equal(await intro.locator('.cli-welcome-output').count(), 0, 'Autoplay should run only once per session');
  assert.deepEqual(introErrors, []);
  await introContext.close();
  console.log('PASS intro only once per browser session');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
