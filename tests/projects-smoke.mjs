import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = 'http://127.0.0.1:8765/';
const pages = [
  'index.html',
  'projects.html',
  'projects/ecommerce-platform.html',
  'projects/ecommerce-migration.html',
  'projects/oracle-erp-integration.html',
  'projects/systems-integration.html',
  'projects/engineering-lab.html',
  'projects/home-network-selfhosting.html',
  'projects/smart-home-automation.html',
  'projects/baja-5b-maintenance.html'
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
        const expected = file === 'index.html' ? 3 : 8;
        assert.equal(await page.locator('.project-card').count(), expected, 'Expected ' + expected + ' project cards on ' + file);
        assert.equal(await page.locator('a.project-case-link').count(), expected);
        assert.equal(await page.locator('.project-proof-thumb').count(), 2);
        if (file === 'projects.html') {
          assert.equal(await page.locator('.project-group').count(), 3);
          assert.deepEqual(await page.locator('.project-group .project-card').evaluateAll(
            cards => ['professional', 'home-lab', 'hobby'].map(x =>
              cards.filter(c => c.closest('[data-project-group]')?.dataset.projectGroup === x).length)
          ), [4, 3, 1]);
          assert.equal(await page.locator('.project-category-nav a').count(), 3);
        }
        for (const image of await page.locator('.project-proof-thumb').all()) {
          await image.scrollIntoViewIfNeeded();
          await image.evaluate(async img => {
            if (!img.complete) await new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
          });
          const width = await image.evaluate(img => img.naturalWidth);
          assert.ok(width > 0, file + ' has a missing evidence thumbnail');
        }
      } else {
        assert.equal(await page.locator('.case-content .case-section').count(), 3);
        assert.equal(await page.locator('.case-breadcrumb a').count(), 2);
        if (file.includes('ecommerce-platform') || file.includes('engineering-lab')) {
          const evidence = page.locator('.case-evidence img');
          assert.equal(await evidence.count(), 1);
          await evidence.scrollIntoViewIfNeeded();
          await evidence.evaluate(async img => {
            if (!img.complete) await new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
          });
          assert.ok(await evidence.evaluate(img => img.naturalWidth > 0), 'Case evidence should load');
        } else {
          assert.equal(await page.locator('.case-evidence').count(), 0);
        }
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
  assert.match(await home.locator('main').innerText(), /AL Haram Perfect Machinery & Equipment CO\.L\.L\.C\./);
  assert.doesNotMatch(await home.locator('main').innerText(), /Alharam Tools/);
  assert.equal(await home.locator('a[href="https://alharamtools.com.sa/"]').count(), 1);
  console.log('PASS project card navigation, screenshot evidence, and official company name');

  await home.goto(base, { waitUntil: 'domcontentloaded' });
  await home.waitForFunction(() => document.documentElement.dataset.cliReady === '3.1');
  await home.locator('.cli-chip[data-command="projects"]').click();
  await home.waitForFunction(() => {
    const out = document.querySelector('#terminalBody')?.textContent || '';
    return out.includes('Professional Work') && out.includes('HPI Baja 5B');
  }, { timeout: 15000 });
  await home.waitForFunction(() => !document.querySelector('#cliInput')?.readOnly);
  assert.equal(await home.locator('#terminalBody a[href="projects/ecommerce-platform.html"]').count(), 1);
  assert.equal(await home.locator('#terminalBody a[href="projects/engineering-lab.html"]').count(), 1);
  assert.equal(await home.locator('#terminalBody a[href="projects/ecommerce-migration.html"]').count(), 1);
  assert.equal(await home.locator('#terminalBody a[href="projects/oracle-erp-integration.html"]').count(), 1);
  assert.equal(await home.locator('#terminalBody a[href="projects/home-network-selfhosting.html"]').count(), 1);
  assert.equal(await home.locator('#terminalBody a[href="projects/smart-home-automation.html"]').count(), 1);
  assert.equal(await home.locator('#terminalBody a[href="projects/baja-5b-maintenance.html"]').count(), 1);
  assert.equal(await home.locator('#cliInputDock').count(), 1);
  console.log('PASS CLI projects lists linked case studies and preserves input dock');

  await home.goto(base + 'projects.html', { waitUntil: 'domcontentloaded' });
  await home.locator('#themeToggle').click();
  assert.equal(await home.locator('body.light-theme').count(), 1);
  console.log('PASS project index retains existing theme toggle');

  const cases = [
    ['ecommerce-migration.html', ['WooCommerce', 'Magento', 'previous professional role']],
    ['oracle-erp-integration.html', ['Oracle', 'stock', 'prices', 'invoice']],
    ['home-network-selfhosting.html', ['Netgear', 'Totolink X30', 'ZeroTier', 'Pi-hole', 'Uptime Kuma', 'Obico', 'Moonraker']],
    ['smart-home-automation.html', ['Home Assistant', 'openHAB', 'different brands']],
    ['baja-5b-maintenance.html', ['Baja 5B', 'Sub-C', '18650', 'kill-switch', 'carburetor']],
    ['engineering-lab.html', ['Ender 3 S1 Pro', 'BLTouch', 'Mainsail', 'Crowsnest', 'OrcaSlicer', 'Creality K2 SE Combo', 'CFS']]
  ];
  for (const [file, phrases] of cases) {
    await home.goto(base + 'projects/' + file, { waitUntil: 'domcontentloaded' });
    const actual = (await home.locator('main').innerText()).toLowerCase();
    for (const phrase of phrases) assert.ok(actual.includes(phrase.toLowerCase()), file + ' missing ' + phrase);
  }
  await home.goto(base + 'projects/ecommerce-migration.html', { waitUntil: 'domcontentloaded' });
  assert.ok(!(await home.locator('main').innerText()).includes('AL Haram Perfect Machinery & Equipment'));
  console.log('PASS career-migration scope, Oracle automation, home-lab details, hobby separation, and employer distinction');

  await home.close();
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
