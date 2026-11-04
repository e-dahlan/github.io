import { chromium } from 'playwright';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

// Recreates printable archival snapshots from the saved PageSpeed report URLs.
// These are NOT byte-identical copies of PDFs the site owner previously exported.
const sources = [
  ['mobile-before.pdf', 'https://pagespeed.web.dev/analysis/https-www-alharamtools-com-sa/5k6d4fmwzo?form_factor=mobile', '48'],
  ['mobile-after.pdf', 'https://pagespeed.web.dev/analysis/https-www-alharamtools-com-sa/787eeb3a0v?form_factor=mobile', '82'],
  ['desktop-before.pdf', 'https://pagespeed.web.dev/analysis/https-www-alharamtools-com-sa/5k6d4fmwzo?form_factor=desktop', '60'],
  ['desktop-after.pdf', 'https://pagespeed.web.dev/analysis/https-www-alharamtools-com-sa/vpe4tlyynt?form_factor=desktop', '96']
];
const directory = '.github/pagespeed-reports/pdf';
await mkdir(directory, {recursive:true});
const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
try {
  for (const [filename, url, expected] of sources) {
    const page = await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1});
    const response = await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
    if (!response?.ok()) throw Error(filename + ' returned HTTP ' + response?.status());
    await page.waitForFunction((score) => {
      const text = document.body.innerText || '';
      return text.includes('PageSpeed Insights') && text.includes('Performance') && text.includes(score);
    }, expected, {timeout:90000});
    await page.waitForTimeout(6000);
    const title = await page.title();
    if (!title.includes('PageSpeed')) throw Error('Unexpected page: ' + title);
    await page.pdf({
      path:path.join(directory,filename),
      format:'A4',printBackground:true,preferCSSPageSize:false,
      margin:{top:'12mm',bottom:'12mm',left:'12mm',right:'12mm'}
    });
    const length=(await stat(path.join(directory,filename))).size;
    if (length<15000) throw Error('PDF unexpectedly small: '+filename+' '+length);
    console.log('Archived',filename,length,'bytes');
    await page.close();
  }
} finally {
  await browser.close();
}
