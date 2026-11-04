import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const origin = 'http://127.0.0.1:8765/';
const shots = [
  ['home-desktop','index.html',1440,900,null],
  ['home-mobile','index.html',390,844,null],
  ['projects-desktop','projects.html',1440,900,null],
  ['projects-mobile','projects.html',390,844,null],
  ['resume-desktop','resume.html',1440,900,null],
  ['resume-mobile','resume.html',390,844,null],
  ['contact-mobile','contact.html',390,844,null],
  ['case-desktop','projects/ecommerce-platform.html',1440,900,null],
  ['case-performance-mobile','projects/ecommerce-platform.html',390,844,'.case-performance'],
  ['404-mobile','404.html',390,844,null]
];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
await mkdir('.v4-screens',{recursive:true});
const output=[];
for(const [name,path,width,height,selector] of shots) {
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce'});
 const exceptions=[];
 page.on('pageerror',err=>exceptions.push(err.message));
 const resp=await page.goto(origin+path,{waitUntil:'domcontentloaded',timeout:40000});
 await page.waitForTimeout(650);
 if(selector) await page.locator(selector).scrollIntoViewIfNeeded();
 const screenshot=await page.screenshot({type:'jpeg',quality:65,animations:'disabled',fullPage:false});
 await writeFile('.v4-screens/'+name+'.b64',screenshot.toString('base64'),'utf8');
 const data=await page.evaluate(()=>{
   const box=(selector)=>{const e=document.querySelector(selector);if(!e)return null;const b=e.getBoundingClientRect();return {x:Math.round(b.x),y:Math.round(b.y+scrollY),w:Math.round(b.width),h:Math.round(b.height)};};
   const style=(selector)=>{const e=document.querySelector(selector);if(!e)return null;const s=getComputedStyle(e);return {font:s.fontSize,line:s.lineHeight,color:s.color,background:s.backgroundColor};};
   return {title:document.title,documentHeight:document.documentElement.scrollHeight,scrollWidth:document.documentElement.scrollWidth,
   clientWidth:document.documentElement.clientWidth,bodyScrollWidth:document.body.scrollWidth,
   header:box('header'),hero:box('.hero-section'),featuredProjects:box('#featured-projects'),terminal:box('.terminal-container'),
   services:box('.services-grid'),stats:box('.stats-grid'),firstCard:box('.project-card'),
   caseIntro:box('.case-hero'),performance:box('.case-performance'),form:box('#contactForm'),
   h1:style('h1'),body:style('body'),paragraph:style('main p'),nav:box('nav'),
   horizontalOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2};
 });
 output.push({name,url:path,width,height,status:resp?.status(),screenshotBytes:screenshot.length,exceptions,...data});
 await page.close();
}
await writeFile('.v4-screens/metrics.json',JSON.stringify(output,null,2));
console.log(JSON.stringify(output,null,2));
await browser.close();
