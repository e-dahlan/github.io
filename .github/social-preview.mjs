import {chromium} from 'playwright';
import {mkdir, stat} from 'node:fs/promises';
import path from 'node:path';
const entries = [
  {file:'portfolio',label:'PERSONAL PORTFOLIO',title:'EDREES DAHLAN',desc:'E-commerce Manager & Computer Engineer',sub:'Commerce · Automation · Engineering',accent:'#38bdf8'},
  {file:'projects',label:'SELECTED PROJECTS',title:'WORK THAT WORKS',desc:'Real-world commerce and practical engineering',sub:'Professional work · Home lab · Hobbies',accent:'#a78bfa'},
  {file:'commerce',label:'PROFESSIONAL EXPERIENCE',title:'COMMERCE & SYSTEMS',desc:'Shopify · Magento · Oracle ERP',sub:'Better customer journeys and cleaner workflows',accent:'#38bdf8'},
  {file:'engineering',label:'PERSONAL ENGINEERING LAB',title:'BUILD. CONNECT. IMPROVE.',desc:'Klipper · Raspberry Pi · Home Networking',sub:'Hands-on systems and self-hosted services',accent:'#34d399'},
  {file:'hobby',label:'HANDS-ON HOBBIES',title:'HPI BAJA 5B',desc:'RC mechanics, maintenance & problem-solving',sub:'Beyond the day job',accent:'#fbbf24'}
];
const escape = value => value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
await mkdir('img/social',{recursive:true});
try {
  for(const item of entries){
    const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
    await page.setContent('<!doctype html><html><head><meta charset="utf-8"><style>'+
      '*{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px;overflow:hidden}'+
      'body{background:#080f21;color:#f8fbff;font-family:Arial,Helvetica,sans-serif;position:relative}'+
      'body:before{content:"";position:absolute;inset:-220px -160px auto auto;width:780px;height:780px;border-radius:100%;background:radial-gradient(circle,'+item.accent+'33,transparent 70%)}'+
      'body:after{content:"";position:absolute;inset:0;opacity:.16;background:linear-gradient(transparent 29px,#63749a33 30px),linear-gradient(90deg,transparent 29px,#63749a33 30px);background-size:30px 30px}'+
      '.outer{position:absolute;inset:40px;padding:56px 64px;border:1px solid #41547288;border-radius:30px;background:linear-gradient(140deg,#131c36ef,#091326eb);overflow:hidden;z-index:1}'+
      '.top{display:flex;align-items:center;gap:18px;font-size:21px;font-weight:700;letter-spacing:4px;color:'+item.accent+'}'+
      '.brand{height:56px;width:56px;display:grid;place-items:center;border-radius:16px;border:2px solid '+item.accent+';font-size:22px;letter-spacing:-2px;color:#fff;box-shadow:0 0 26px '+item.accent+'33}'+
      'h1{margin:76px 0 13px;font-size:65px;letter-spacing:-3px;font-weight:850;line-height:1.05;max-width:980px}'+
      '.desc{font-size:31px;color:#dbe6f8;line-height:1.4;max-width:960px}.bottom{position:absolute;bottom:52px;left:64px;right:64px;display:flex;justify-content:space-between;gap:15px;color:#9eb3d0;font-size:19px}'+
      '.domain{color:'+item.accent+';font-weight:700;letter-spacing:1px}'+
      '</style></head><body><div class="outer"><div class="top"><span class="brand">ED</span><span>'+escape(item.label)+'</span></div>'+
      '<h1>'+escape(item.title)+'</h1><div class="desc">'+escape(item.desc)+'</div>'+
      '<div class="bottom"><span>'+escape(item.sub)+'</span><span class="domain">dahlan.me</span></div></div></body></html>');
    const target=path.join('img','social',item.file+'.png');
    await page.screenshot({path:target,type:'png'});
    const info=await stat(target);
    if(info.size<10000)throw Error('Unusually small social image '+target);
    console.log(item.file, info.size);
    await page.close();
  }
} finally {await browser.close();}
