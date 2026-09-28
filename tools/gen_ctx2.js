// v106: سیاق کی دوسری کھیپ — بڑے ذہنی والدین کے لیے **سانچے**
//   delusions › X      →  «مغالطہ — X»
//   fear › X, of       →  «X کا خوف»
//   anger › X, at/from →  «X پر غصہ»
//   ailments from › X  →  «X کے بعد شکایات»
// Usage: node tools/gen_ctx2.js kent
const fs=require('fs'),path=require('path');const R=path.resolve(__dirname,'..');
const {JSDOM}=require(process.env.JSDOM_PATH||'/tmp/jsd/node_modules/jsdom');
const book=process.argv[2]||'kent';
const F=R+'/ur/rubric_labels_ur.json', L=JSON.parse(fs.readFileSync(F,'utf8'));
const lab=L.labels, ctx=L.ctx||(L.ctx={});
const OBL_EX={'بایاں':'بائیں','دایاں':'دائیں','قے':'قے','ہوا':'ہوا'};
function obl(u){ if(OBL_EX[u])return OBL_EX[u];
  if(/(میں|پر|سے|کے ساتھ|کی طرف|کے بعد|کے دوران|تک)$/.test(u))return u;
  u=u.replace(/ کا /g,' کے ');
  const w=u.split(' '); let l=w[w.length-1];
  if(/نا$/.test(l)) l=l.replace(/نا$/,'نے'); else if(/ہ$/.test(l)) l=l.replace(/ہ$/,'ے');
  else if(/[^ی]ا$/.test(l)) l=l.replace(/ا$/,'ے');
  w[w.length-1]=l; return w.join(' '); }
const T=k=>lab[String(k).trim().toLowerCase()]||null;
// بچے میں سے دُم کا لفظ الگ کرو: «death, of» → {core:'death', t:'of'}
function split(c){
  const m=c.match(/^(.+),\s*(of|at|from|about|when|with|to|in|on|after|before|during|while)$/i);
  return m?{core:m[1].trim(),t:m[2].toLowerCase()}:{core:c,t:null};
}
const TPL={
 'delusions':      (u,t)=> 'مغالطہ — '+u,
 'fear':           (u,t)=> (t==='of'||!t) ? obl(u)+' کا خوف' : obl(u)+' پر خوف',
 'fear (see anxiety)': (u,t)=> (t==='of'||!t) ? obl(u)+' کا خوف' : obl(u)+' پر خوف',
 'anger':          (u,t)=> (t==='at'||t==='about'||t==='when'||t==='from') ? obl(u)+' پر غصہ' : obl(u)+' — غصہ',
 'ailments from':  (u,t)=> obl(u)+' کے بعد شکایات',
 'weeping':        (u,t)=> (t==='at'||t==='from'||t==='when') ? obl(u)+' پر رونا' : obl(u)+' — رونا',
 'anxiety':        (u,t)=> (t==='about'||t==='of') ? obl(u)+' کی بے چینی' : obl(u)+' — بے چینی',
 'irritability':   (u,t)=> obl(u)+' — چڑچڑاپن',
 'sadness':        (u,t)=> obl(u)+' — اداسی',
 'despair':        (u,t)=> obl(u)+' — مایوسی',
 'indifference':   (u,t)=> obl(u)+' سے بے پروائی',
 'aversion':       (u,t)=> obl(u)+' سے بیزاری',
 'desires':        (u,t)=> obl(u)+' کی خواہش',
 'dreams':         (u,t)=> obl(u)+' کے خواب',
 'delirium':       (u,t)=> obl(u)+' — ہذیان',
 'confusion':      (u,t)=> obl(u)+' — ذہنی الجھن',
 'unconsciousness':(u,t)=> obl(u)+' — بے ہوشی',
 'restlessness':   (u,t)=> obl(u)+' — بے قراری',
 'excitement':     (u,t)=> obl(u)+' — اشتعال',
 'laughing':       (u,t)=> obl(u)+' — ہنسنا',
 'dullness':       (u,t)=> obl(u)+' — کند ذہنی',
 'starting':       (u,t)=> obl(u)+' پر چونک اٹھنا',
 'sensitive':      (u,t)=> obl(u)+' کے لیے حساس',
 'company':        (u,t)=> obl(u)+' — صحبت',
};
const w=new JSDOM('<div id="repRubricContent"></div>',{runScripts:'dangerously',url:'http://localhost/'}).window;w.escapeHtml=s=>s;
w.eval(fs.readFileSync(R+'/js/repertory/LOAD_ORDER.txt','utf8').split(/\s+/).filter(Boolean).map(f=>fs.readFileSync(R+'/js/repertory/'+f,'utf8')).join('\n'));w.repCurrentBook=book;
const dir=R+'/'+w.REP_BOOK_INFO[book].chapDir;
let made=0, seen=0;
for(const c of JSON.parse(fs.readFileSync(dir+'_index.json'))){
  const t=w.buildRubricTree(JSON.parse(fs.readFileSync(dir+c.key+'.json')));const rows=[];w.repTreeFlatten(t,[],'',0,rows,'');
  rows.forEach(r=>{
    if(!r.labels||r.labels.length<2) return;
    const par=String(r.labels[r.labels.length-2]).replace(/ \[\d+\]$/,'').toLowerCase().trim();
    const me=String(r.label).replace(/ \[\d+\]$/,'').toLowerCase().trim();
    const parKey=par.replace(/\s*\(\s*see\b[^)]*\)/ig,'').trim();
    const tpl=TPL[par]||TPL[parKey]; if(!tpl) return;
    const k=par+'|'+me; if(ctx[k]) return; seen++;
    const sp=split(me); const cu=T(me)||T(sp.core); if(!cu) return;
    // اگر بچہ خود وقت/شرط کا ٹکڑا ہو تو چھوڑ دو (پہلے سے صحیح ہے)
    if(/^(کے |کی |سے |پر |میں |تک |جب )/.test(cu)) return;
    const out=tpl(T(me)?cu:cu, sp.t);
    if(out){ ctx[k]=out.replace(/\s+/g,' ').trim(); made++; }
  });
}
L.meta.ctx_count=Object.keys(ctx).length;
fs.writeFileSync(F, JSON.stringify(L,null,1));
console.log('امیدوار: '+seen+'   نئے سیاق: '+made+'   کل: '+L.meta.ctx_count);
Object.entries(ctx).slice(-16).forEach(([k,v])=>console.log('   '+k.replace('|',' › ').padEnd(46).substring(0,46)+' → '+v));
