import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ reducedMotion: 'no-preference', viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.cliReady === '3.1', { timeout: 10000 });
  assert.equal((await page.locator('#cliStatus').textContent()).trim(), 'v3.1 · Ready');
  assert.equal(await page.locator('#cliPrompt').evaluate(el => el.parentElement?.id), 'cliInputDock');
  assert.equal(await page.locator('#cliInputDock').evaluate(el => el.previousElementSibling?.id), 'terminalBody');
  assert.equal(await page.locator('#cliInputDock').evaluate(el => el.nextElementSibling?.classList.contains('terminal-quick-chips')), true);
  assert.equal(await page.locator('#cliDisclosure').getAttribute('open'), null, 'Interactive terminal should not fill home by default');
  await page.locator('#cliDisclosure > summary').click();
  assert.ok(await page.locator('#terminalBody').isVisible());
  assert.equal(await page.locator('#cliTypingToggle').getAttribute('aria-pressed'), 'true');

  const input = page.locator('#cliInput');
  await page.locator('.cli-chip[data-command="help"]').click();
  await page.waitForFunction(() => document.querySelector('#cliInput')?.value?.length > 0, { timeout: 10000 });
  await page.waitForFunction(() => Array.from(document.querySelectorAll('#terminalBody .terminal-output')).some(el => el.textContent.includes('Portfolio commands')), { timeout: 15000 });
  await page.waitForFunction(() => document.querySelector('#cliInput')?.readOnly === false);
  assert.ok((await page.locator('#terminalBody').innerText()).includes('Portfolio commands'));

  // Reproduce the reported bug: long output scrolls while the prompt remains
  // completely below the transcript and above the quick command buttons.
  const geometry = await page.evaluate(() => {
    const transcript = document.querySelector('#terminalBody');
    const dock = document.querySelector('#cliInputDock');
    const commands = document.querySelector('.terminal-quick-chips');
    transcript.scrollTop = 0;
    const a = transcript.getBoundingClientRect();
    const b = dock.getBoundingClientRect();
    const c = commands.getBoundingClientRect();
    return {
      scrollable: transcript.scrollHeight > transcript.clientHeight,
      transcriptBottom: a.bottom,
      dockTop: b.top,
      dockBottom: b.bottom,
      commandsTop: c.top,
      scrollbar: getComputedStyle(transcript).scrollbarColor,
      inputParent: document.querySelector('#cliInput').parentElement?.id
    };
  });
  assert.ok(geometry.scrollable, 'The long help output should be scrollable');
  assert.ok(geometry.dockTop >= geometry.transcriptBottom - 1, 'Input dock must never overlap the transcript');
  assert.ok(geometry.commandsTop >= geometry.dockBottom - 1, 'Input dock must sit directly above the command buttons');
  assert.equal(geometry.inputParent, 'cliPrompt');
  assert.ok(geometry.scrollbar.includes('rgba('), 'Custom dark scrollbar should be applied');
  console.log('PASS fixed CLI input dock, overflow scrolling, and theme scrollbar');

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
  assert.equal(await page.locator('#cliInputDock').count(), 1);
  assert.equal(await page.locator('#cliInput').count(), 1);
  assert.equal(await input.isEditable(), true);
  assert.deepEqual(errors, []);
  console.log('PASS CLI home page: load, ready marker, chip typewriting, streamed help output, whoami, autocomplete, clear');

  const reduced = await browser.newPage({ reducedMotion: 'reduce' });
  await reduced.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'domcontentloaded' });
  await reduced.waitForFunction(() => document.documentElement.dataset.cliReady === '3.1');
  assert.equal(await reduced.locator('#cliTypingToggle').getAttribute('aria-pressed'), 'false');
  await reduced.locator('#cliDisclosure > summary').click();
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
  assert.equal(await intro.locator('#cliDisclosure').getAttribute('open'), null);
  await intro.locator('#cliDisclosure > summary').click();
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
