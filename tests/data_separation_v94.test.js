// v94: content lives in data/*.json, not inside JavaScript files.
// Verifies: the JSON parses, the loader assigns exactly the same globals as before,
// index.html no longer ships the old data-in-JS files, and the service worker caches the new ones.
const fs=require('fs'),path=require('path');const {JSDOM}=require(process.env.JSDOM_PATH||'/tmp/jsd/node_modules/jsdom');
const ROOT=path.resolve(__dirname,'..');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const rd=f=>fs.readFileSync(path.join(ROOT,f),'utf8');

// ---------- A. the JSON files themselves ----------
const dx=JSON.parse(rd('data/diagnosis.json')), tr=JSON.parse(rd('data/treatment.json')), kn=JSON.parse(rd('data/dx-knowledge.json'));
ok(Object.keys(dx.SYMPTOMS_DB).length>150&&dx.DISEASES_DB.length>150&&Object.keys(dx.CATEGORIES_DB).length>10,
   'A1 diagnosis.json: '+Object.keys(dx.SYMPTOMS_DB).length+' symptoms, '+dx.DISEASES_DB.length+' diseases, '+Object.keys(dx.CATEGORIES_DB).length+' categories');
ok(tr.STUDIO_SYS.length>5&&Object.keys(tr.TREATMENT_LIB).length>25&&Object.keys(tr.TREATMENT_MORE).length>25,
   'A2 treatment.json: '+tr.STUDIO_SYS.length+' systems, '+Object.keys(tr.TREATMENT_LIB).length+' treatments, '+Object.keys(tr.TREATMENT_MORE).length+' extra pools');
ok(Object.keys(kn.symptoms).length>100&&kn.conditions.length>100,
   'A3 dx-knowledge.json: '+Object.keys(kn.symptoms).length+' symptoms, '+kn.conditions.length+' conditions');
// language triplets survived the conversion
const anySys=tr.STUDIO_SYS[1]; ok(anySys.nm&&anySys.nm.ur&&anySys.nm.en&&anySys.nm.roman,'A4 three-language labels intact: '+JSON.stringify(anySys.nm));

// ---------- B. the loader assigns the very same globals ----------
(async()=>{
  const dom=new JSDOM('<!doctype html><html><body><div id="symptomsGrid"></div><div id="studioList"></div></body></html>',
      {runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/'});
  const w=dom.window;
  w.fetch=u=>{const f=path.join(ROOT,String(u).split('?')[0]);
      return fs.existsSync(f)?Promise.resolve({ok:true,json:()=>Promise.resolve(JSON.parse(fs.readFileSync(f,'utf8')))}):Promise.reject(new Error('404 '+u));};
  w.eval(rd('js/00-data-boot.js'));
  await w.BC_DATA_READY;
  ok(w.BC_DATA_STATE.failed.length===0&&w.BC_DATA_STATE.loaded.length===3,'B1 all three data files loaded, none failed');
  ['SYMPTOMS_DB','DISEASES_DB','CATEGORIES_DB','STUDIO_SYS','TREATMENT_LIB','TREATMENT_MORE','ADX_KNOWLEDGE']
      .forEach(g=>ok(typeof w[g]!=='undefined'&&w[g]!==null,'B2 global '+g+' is defined after boot'));
  ok(Object.keys(w.SYMPTOMS_DB).length===Object.keys(dx.SYMPTOMS_DB).length&&w.DISEASES_DB.length===dx.DISEASES_DB.length,'B3 globals carry the full content');
  ok(typeof w.ADX_KNOWLEDGE.conditions!=='undefined','B4 ADX_KNOWLEDGE keeps its shape (engine reads .conditions / .symptoms)');

  // ---------- C. nothing still ships data as code ----------
  const idx=rd('index.html');
  ['diagnosis-data.js','advanced-diagnosis-knowledge.js','js/10-treatment-data.js','js/12-treatment-more.js']
      .forEach(f=>ok(idx.indexOf('src="'+f)===-1,'C1 index.html no longer loads '+f));
  ok(/js\/00-data-boot\.js\?v=\d+/.test(idx),'C2 index.html loads the data loader with a ?v=');
  ok(idx.indexOf('js/00-data-boot.js')<idx.indexOf('js/01-app-core.js'),'C3 the loader comes first');
  ['diagnosis-data.js','advanced-diagnosis-knowledge.js','js/10-treatment-data.js','js/12-treatment-more.js']
      .forEach(f=>ok(!fs.existsSync(path.join(ROOT,f)),'C4 old data-in-JS file deleted: '+f));
  const sw=rd('service-worker.js');
  ok(['./data/diagnosis.json','./data/treatment.json','./data/dx-knowledge.json','./js/00-data-boot.js'].every(f=>sw.includes(f)),'C5 service worker caches the new data files');
  ok(!/diagnosis-data\.js|10-treatment-data\.js|12-treatment-more\.js|08b-rep-differentiation/.test(sw),'C6 service worker no longer asks for deleted files');

  // ---------- D. no CSS rule is completely shadowed by a later file ----------
  const cssOrder=[...rd('index.html').matchAll(/<link rel="stylesheet" href="(css\/[^"?]+)/g)].map(m=>m[1]);
  const topRules=f=>{const src=rd(f).replace(/\/\*[\s\S]*?\*\//g,' ');const out=[];let i=0;
    while(i<src.length){const mm=/@media[^{]*\{/g;mm.lastIndex=i;const m=mm.exec(src);
      const bb=/([^{}@]+)\{([^{}]*)\}/g;bb.lastIndex=i;const b=bb.exec(src);
      if(m&&(!b||m.index<b.index)){let d=1,j=mm.lastIndex;while(j<src.length&&d){d+=(src[j]==='{')-(src[j]==='}');j++;}i=j;continue;}
      if(!b)break; const sel=b[1].trim().replace(/\s+/g,' ');
      if(sel&&sel[0]!=='@'){const props={};b[2].split(';').forEach(d=>{if(d.includes(':'))props[d.split(':')[0].trim()]=1;});out.push([sel,props]);}
      i=bb.lastIndex;}
    return out;};
  const parsed=Object.fromEntries(cssOrder.map(f=>[f,topRules(f)]));
  let shadowed=[];
  cssOrder.forEach((f,i)=>{const later=cssOrder.slice(i+1).flatMap(g=>parsed[g]);
    parsed[f].forEach(([sel,props])=>{const cov={};later.forEach(([s2,p2])=>{if(s2===sel)Object.assign(cov,p2);});
      if(Object.keys(props).length&&Object.keys(props).every(k=>k in cov))shadowed.push(f+' '+sel);});});
  ok(shadowed.length===0,'D1 no CSS rule is fully overridden by a later file'+(shadowed.length?': '+shadowed.join(' | '):''));
  ok(cssOrder.every(f=>{const s=rd(f);return (s.split('{').length===s.split('}').length);}),'D2 every CSS file has balanced braces');

  console.log(fails?'\nFAILURES: '+fails:'\nALL v94 DATA-SEPARATION CHECKS PASSED');
  process.exit(fails?1:0);
})().catch(e=>{console.log('CRASH '+e.stack);process.exit(1);});
