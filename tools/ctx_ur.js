// v105: سیاق کے امیدوار — وہ (والد → بچہ) جوڑے جو سب سے زیادہ آتے ہیں اور جن کا سیاق ابھی درج نہیں
// Usage: node tools/ctx_ur.js kent 40
const fs=require('fs'),path=require('path');const R=path.resolve(__dirname,'..');
const {JSDOM}=require(process.env.JSDOM_PATH||'/tmp/jsd/node_modules/jsdom');
const book=process.argv[2]||'kent', TOP=+process.argv[3]||40;
const L=JSON.parse(fs.readFileSync(R+'/ur/rubric_labels_ur.json','utf8'));
const w=new JSDOM('<div id="repRubricContent"></div>',{runScripts:'dangerously',url:'http://localhost/'}).window;w.escapeHtml=s=>s;
w.eval(fs.readFileSync(R+'/js/repertory/LOAD_ORDER.txt','utf8').split(/\s+/).filter(Boolean).map(f=>fs.readFileSync(R+'/js/repertory/'+f,'utf8')).join('\n'));w.repCurrentBook=book;
const dir=R+'/'+w.REP_BOOK_INFO[book].chapDir, pair={};
for(const c of JSON.parse(fs.readFileSync(dir+'_index.json'))){
  const t=w.buildRubricTree(JSON.parse(fs.readFileSync(dir+c.key+'.json')));const rows=[];w.repTreeFlatten(t,[],'',0,rows,'');
  rows.forEach(r=>{ if(!r.labels||r.labels.length<2) return;
    const par=String(r.labels[r.labels.length-2]||'').toLowerCase().trim();
    const me=String(r.label||'').replace(/ \[\d+\]$/,'').toLowerCase().trim();
    if(!par||!me) return; const k=par+'|'+me; pair[k]=(pair[k]||0)+1; });
}
const have=L.ctx||{}, lab=L.labels||{};
const out=Object.entries(pair).filter(([k])=>!have[k])
  .map(([k,n])=>{const [p,c]=k.split('|');return {k,n,p,c,ur:lab[c]||'—'};})
  .sort((a,b)=>b.n-a.n).slice(0,TOP);
console.log('سیاق کے امیدوار (جو ابھی درج نہیں) — سب سے زیادہ آنے والے '+TOP+':\n');
out.forEach(o=>console.log('  ['+String(o.n).padStart(3)+']  '+(o.p+' › '+o.c).padEnd(52).substring(0,52)+'  اب: '+o.ur));
