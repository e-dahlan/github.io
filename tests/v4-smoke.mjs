import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const base='http://127.0.0.1:8765/';
const caseNames=['ecommerce-platform','ecommerce-migration','oracle-erp-integration','systems-integration','engineering-lab','home-network-selfhosting','smart-home-automation','baja-5b-maintenance'];
const xml=readFileSync('sitemap.xml','utf8');
for(const slug of caseNames)assert.ok(xml.includes('https://dahlan.me/projects/'+slug+'.html'),'Sitemap missing '+slug);
assert.ok(xml.includes('https://dahlan.me/projects.html'));
for(const image of ['portfolio','projects','commerce','engineering','hobby']) {
 const file='img/social/'+image+'.png';
 assert.ok(existsSync(file),'Missing original social preview: '+file);
 const png=readFileSync(file);
 assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a');
 assert.equal(png.readUInt32BE(16),1200);
 assert.equal(png.readUInt32BE(20),630);
}
console.log('PASS full sitemap and 1200×630 shareable preview cards');

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const files=['index.html','projects.html','resume.html','contact.html','404.html',...caseNames.map(s=>'projects/'+s+'.html')];
try {
for(const size of [{width:390,height:844},{width:1440,height:900}]){
 const page=await browser.newPage({viewport:size,reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const name of files){
  const response=await page.goto(base+name,{waitUntil:'domcontentloaded'});
  assert.ok(response.ok(),'Route HTTP failed '+name);
  assert.equal(await page.locator('main#main-content').count(),1,name+' missing main');
  assert.equal(await page.locator('h1').count(),1,name+' requires exactly one H1');
  const over=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+2);
  assert.equal(over,false,'Horizontal overflow '+name+' at '+size.width);
  assert.equal(await page.locator('footer .footer-nav a').count(),4,'Footer nav '+name);
  assert.equal(await page.locator('footer a[href="https://github.com/e-dahlan"]').count(),1);
  if(name!=='404.html'){
   const url=await page.locator('meta[property="og:image"]').getAttribute('content');
   assert.ok(url?.endsWith('.png'),'Social preview must be PNG: '+name);
  }
  if(name.startsWith('projects/')){
   assert.equal(await page.locator('.case-key-outcomes li').count(),3,name+' should have three concise outcomes');
   assert.equal(await page.locator('.case-related a').count(),2,'Related projects '+name);
   assert.equal(await page.locator('.case-breadcrumb').isVisible(),true,'Breadcrumb should be visible '+name);
  }
  if(name==='index.html' && size.width===390){
   const hero=await page.locator('.hero-section').boundingBox();
   assert.ok(hero.height<790,'Mobile hero should be more compact: '+hero.height);
   assert.equal(await page.locator('#cliDisclosure').getAttribute('open'),null);
   assert.equal(await page.locator('.career-highlights .impact-card').count(),3);
   assert.deepEqual(await page.locator('a.project-case-link').evaluateAll(els=>els.map(el=>el.getAttribute('href'))),[
    'projects/ecommerce-platform.html','projects/ecommerce-migration.html','projects/oracle-erp-integration.html']);
  }
  if(name==='projects.html'){
   assert.equal(await page.locator('.project-filter').count(),4);
   if(size.width===390){
    assert.equal(await page.locator('.project-category-nav').isVisible(),true,'Filters hidden by mobile nav CSS');
    await page.locator('[data-project-filter="home-lab"]').click();
    assert.equal(await page.locator('#home-lab').isVisible(),true);
    assert.equal(await page.locator('#professional-work').isHidden(),true);
    await page.locator('[data-project-filter="all"]').click();
   }
  }
  if(name==='contact.html'){
   const [form,ch]=await Promise.all([page.locator('#contactForm').boundingBox(),page.locator('.channels-grid').boundingBox()]);
   assert.ok(form.y < ch.y,'Contact form should appear before the list of channels');
   assert.equal(await page.locator('.channel-card').count(),3);
  }
  if(name==='resume.html'){
   const text=await page.locator('main').innerText();
   assert.ok(text.includes('Albawardi Tools and Hardware Co. L.L.C.'));
   assert.ok(!text.includes('438316') && !text.includes('zero operational downtime'));
   assert.equal(await page.locator('details.resume-extra').count(),1);
  }
  if(name==='404.html'){
   assert.equal(await page.locator('.error-quick-actions a').count(),2);
   assert.equal(await page.locator('details.error-game').getAttribute('open'),null);
   assert.equal(await page.locator('.error-quick-actions').isVisible(),true);
  }
  if(size.width===390){
   const menu=page.locator('.menu-toggle');
   assert.ok(await menu.isVisible(),'Missing mobile menu on '+name);
   await menu.click();
   assert.equal(await page.locator('#primary-navigation').isVisible(),true,'Mobile navigation unavailable on '+name);
   await menu.click();
   assert.equal(await page.locator('#primary-navigation').isHidden(),true);
  }
 }
 assert.deepEqual(errors,[],'JavaScript errors on '+size.width+'px viewport');
 await page.close();
 console.log('PASS '+size.width+'px: routes, filters, footer, hero, résumé, contact, error page, navigation');
}
} finally {await browser.close();}
