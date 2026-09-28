// v104: اردو ترجمے کی **خودکار جانچ** — مشتبہ ترجمے خود ڈھونڈتا ہے، ترتیب: کتنی بار آتا ہے
// Usage: node tools/qa_ur.js [book] [top]      (کینٹ کی تعداد کے ساتھ درجہ بندی)
const fs=require('fs'),path=require('path');const R=path.resolve(__dirname,'..');
const {JSDOM}=require(process.env.JSDOM_PATH||'/tmp/jsd/node_modules/jsdom');
const book=process.argv[2]||'kent', TOP=+process.argv[3]||60;
const L=JSON.parse(fs.readFileSync(R+'/ur/rubric_labels_ur.json','utf8')).labels;
// منظور شدہ مستثنیات (صارف نے خود پسند کیے)
const KEEP={'leg':1,'dinner':1,'generals':1,'fits':1,'ilium':1,'sacrum':1,'mucus':1,'chilliness':1,
            'iliac region':1,'sacral region':1,'language':1,'feces':1};

// ---------- ۱. ہر لیبل کتنی بار آتا ہے ----------
const w=new JSDOM('<div id="repRubricContent"></div>',{runScripts:'dangerously',url:'http://localhost/'}).window;w.escapeHtml=s=>s;
w.eval(fs.readFileSync(R+'/js/repertory/LOAD_ORDER.txt','utf8').split(/\s+/).filter(Boolean).map(f=>fs.readFileSync(R+'/js/repertory/'+f,'utf8')).join('\n'));w.repCurrentBook=book;
const dir=R+'/'+w.REP_BOOK_INFO[book].chapDir, freq={};
for(const c of JSON.parse(fs.readFileSync(dir+'_index.json'))){
  const t=w.buildRubricTree(JSON.parse(fs.readFileSync(dir+c.key+'.json')));const rows=[];w.repTreeFlatten(t,[],'',0,rows,'');
  rows.forEach(r=>{const l=r.label.replace(/ \[\d+\]$/,'').trim().toLowerCase(); if(l) freq[l]=(freq[l]||0)+1;});
}

// ---------- ۲. مشتبہ ترجمے کے قاعدے ----------
const URDU=/[\u0600-\u06FF]/;
const POST=['کا','کے','کی','سے','پر','میں','تک','کو','ساتھ'];
function issues(en,ur){
  const out=[];
  if(!URDU.test(ur)) out.push('اردو ہی نہیں');
  if(/[A-Za-z]{2,}/.test(ur)) out.push('انگریزی الفاظ');
  const par=ur.match(/\(([^)]*)\)/);
  if(par&&!/دیکھیے/.test(ur)){
    const inner=par[1].trim().split(/\s+/).length, outer=ur.replace(/\([^)]*\)/,'').trim().split(/\s+/).length;
    if(inner<=2&&outer<=2) out.push('قوسین = متبادل — ایک چنیں');
  }
  const wds=ur.split(/\s+/);
  // اردو میں تکرار جائز ہے: باری باری · بار بار · رک رک · ادھر ادھر …
  const REDUP={'باری':1,'بار':1,'رک':1,'ادھر':1,'وقفے':1,'ٹھہر':1,'کبھی':1,'جگہ':1,'دھیرے':1,'آہستہ':1,'الگ':1,'غڑ':1,'چھپ':1,'ساتھ':1};
  for(let i=1;i<wds.length;i++) if(wds[i]===wds[i-1]&&!REDUP[wds[i]]) out.push('دہرا لفظ «'+wds[i]+'»');
  if(POST.indexOf(wds[0])!==-1&&wds.length>1&&!/^کا |^کے |^کی /.test(ur)&&!/^(on|in|from|to|at|by|with|of|under|over|into|about|between|before|after|during|while|till|until)\b/i.test(en)) out.push('حرفِ اضافت سے شروع');
  const last=wds[wds.length-1];
  // «جاگنے پر» جیسے ٹکڑے درست ہیں — صرف تب مسئلہ جب انگریزی میں کوئی دُم کا لفظ ہی نہ ہو
  const hasEnTail=/\b(on|in|from|after|before|during|while|when|with|to|at|of|by|into|over|under|about|agg\.|amel\.)\b/i.test(en);
  if(POST.indexOf(last)!==-1&&!hasEnTail&&wds.length>3) out.push('ادھورا — «'+last+'» پر ختم');
  if(/باری باری\s+کے ساتھ/.test(ur)) out.push('«باری باری کے ساتھ» — بیچ میں اسم غائب');
  if(/\sوالا\s.*(ے|یں|اں)$/.test(ur)) out.push('صفت جمع سے میل نہیں («والا» → «والے»)');
  const enw=(en.match(/[a-z]+/gi)||[]).length, urw=wds.length;
  if(enw>=2&&urw>enw*2+2) out.push('بہت لمبا ترجمہ ('+enw+'→'+urw+' الفاظ)');
  if(/^کا\s/.test(ur)&&!/ of$/i.test(en)) out.push('بلا وجہ «کا» سے شروع');
  return out;
}
const bad=[];
Object.keys(L).forEach(k=>{ if(KEEP[k]) return; const p=issues(k,L[k]); if(p.length) bad.push({en:k,ur:L[k],n:freq[k]||0,p:p}); });
bad.sort((a,b)=>b.n-a.n||a.en.localeCompare(b.en));

const byRule={}; bad.forEach(b=>b.p.forEach(x=>{const k=x.replace(/«[^»]*»/g,'…');byRule[k]=(byRule[k]||0)+1;}));
console.log('کل لیبل: '+Object.keys(L).length+'   مشتبہ: '+bad.length+'   (ظہور کے لحاظ سے سرِفہرست '+TOP+' نیچے)\n');
console.log('— قسم کے لحاظ سے:');
Object.entries(byRule).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log('   %s  %s',String(v).padStart(5),k));
console.log('\n— سب سے زیادہ اثر والے:');
bad.slice(0,TOP).forEach(b=>console.log('  ['+String(b.n).padStart(3)+'] '+b.en.padEnd(38).substring(0,38)+' → '+b.ur.padEnd(34).substring(0,34)+'  ⚠ '+b.p.join(' · ')));
fs.writeFileSync('/tmp/qa_ur.tsv', bad.map(b=>[b.n,b.en,b.ur,b.p.join(' · ')].join('\t')).join('\n'));
console.log('\n(پوری فہرست: /tmp/qa_ur.tsv)');
