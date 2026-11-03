import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = 'http://127.0.0.1:8765/';
const pages = [
  'index.html',
  'projects.html',
  'projects/ecommerce-platform.html',
  'projects/systems-integration.html',
  'projects/engineering-lab.html'
];
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
    const scriptErrors = [];
    page.on('pageerror', err => scriptErrors.push(err.message));
    for (const file of pages) {
      const response = await page.goto(base + file, { waitUntil: 'domcontentloaded' });
      assert.ok(response.ok(), file + ' returned ' + response.status());
      assert.equal(await page.locator('main#main-content').count(), 1);
      assert.equal(await page.locator('h1').count(), 1, file + ' needs one primary heading');
      assert.equal(await page.locator('a[href$="projects.html"]').first().count(), 1);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 3);
      assert.ok(!overflow, file + ' must not overflow viewport width ' + viewport.width);
      if (file === 'index.html' || file === 'projects.html') {
        assert.equal(await page.locator('.project-card').count(), 3, 'Expected 3 case study cards on ' + file);
        assert.equal(await page.locator('a.project-case-link').count(), 3);
      } else {
        assert.equal(await page.locator('.case-content .case-section').count(), 3);
        assert.equal(await page.locator('.case-breadcrumb a').count(), 2);
      }
    }
    assert.deepEqual(scriptErrors, [], 'Browser errors on ' + viewport.width + 'px');
    await page.close();
    console.log('PASS project pages, case-study content, mobile/desktop layout at ' + viewport.width + 'px');
  }

  const home = await browser.newPage({ reducedMotion: 'reduce' });
  await home.goto(base, { waitUntil: 'domcontentloaded' });
  const cardLinks = await home.locator('a.project-case-link').evaluateAll(
    links => links.map(l => l.getAttribute('href'))
  );
  assert.deepEqual(cardLinks, [
    'projects/ecommerce-platform.html',
    'projects/systems-integration.html',
    'projects/engineering-lab.html'
  ]);
  await home.locator('a.project-case-link').first().click();
  await home.waitForURL(/projects\/ecommerce-platform\.html/);
  assert.match(await home.locator('main').innerText(), /Alharam Tools/);
  assert.match(await home.locator('main').innerText(), /الهرم المثالي/);
  assert.equal(await home.locator('a[href="https://alharamtools.com.sa/"]').count(), 1);
  console.log('PASS project card navigation and public Alharam Tools attribution');

  await home.goto(base, { waitUntil: 'domcontentloaded' });
  await home.waitForFunction(() => document.documentElement.dataset.cliReady === '3.1');
  await home.locator('.cli-chip[data-command="projects"]').click();
  await home.waitForFunction(() => {
    const out = document.querySelector('#terminalBody')?.textContent || '';
    return out.includes('Featured Projects') && out.includes('Raspberry Pi & 3D Printing Lab');
  }, { timeout: 15000 });
  await home.waitForFunction(() => !document.querySelector('#cliInput')?.readOnly);
  assert.equal(await home.locator('#terminalBody a[href="projects/ecommerce-platform.html"]').count(), 1);
  assert.equal(await home.locator('#terminalBody a[href="projects/engineering-lab.html"]').count(), 1);
  assert.equal(await home.locator('#cliInputDock').count(), 1);
  console.log('PASS CLI projects lists linked case studies and preserves input dock');

  await home.goto(base + 'projects.html', { waitUntil: 'domcontentloaded' });
  await home.locator('#themeToggle').click();
  assert.equal(await home.locator('body.light-theme').count(), 1);
  console.log('PASS project index retains existing theme toggle');
  await home.close();
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
