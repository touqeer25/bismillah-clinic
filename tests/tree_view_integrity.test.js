// tests/tree_view_integrity.test.js — v79: کینٹ کے پورے درخت کی سالمیت (schema {t,r,oorep_id})
// معیار = ایپ کا اصلی طریقہ: paren-aware تقسیم (rep-chapters.js) + خودکار درمیانی فولڈرز (ensureNode)
const fs=require('fs'),path=require('path');
const R=path.resolve(__dirname,'..');
let n=0; const ok=(c,m)=>{n++; if(!c){console.error('✖ '+m); process.exit(1);}};
const psplit=t=>{let s=[],d=0,cur='';for(const ch of t){if(ch==='(')d++;else if(ch===')')d=Math.max(0,d-1);
  if(ch===','&&d===0&&cur.trim()){s.push(cur.trim());cur='';}else cur+=ch;}if(cur.trim())s.push(cur.trim());return s;};
const idx=JSON.parse(fs.readFileSync(path.join(R,'kent_chapters','_index.json'),'utf8'));
const master=JSON.parse(fs.readFileSync(path.join(R,'kent_repertory.json'),'utf8'));
ok(idx.length===Object.keys(master).length,'master == index');
const oidSeen=new Set();
for(const c of idx){
  const ch=master[c.key]; const rids=Object.keys(ch);
  ok(rids.length===c.rubrics,'rubric count '+c.key);
  ok(new Set(rids).size===rids.length,'unique rids '+c.key);
  for(const rid of rids){
    const v=ch[rid];
    ok(typeof v.t==='string'&&v.t.length,'title '+rid);
    const segs=psplit(v.t);
    ok(segs.length>0&&segs.every(s=>s.length>0),'path segments clean '+rid+' «'+v.t+'»');
    for(const g of Object.values(v.r)) ok(g===1||g===2||g===3,'grade 1..3 '+rid);
    if('oorep_id' in v){ ok(!oidSeen.has(v.oorep_id),'oorep_id unique '+rid); oidSeen.add(v.oorep_id); }
  }
}
console.log('✅ tree_view_integrity (v79): %d checks — %d chapters, %d rubrics, %d oorep ids, سب گریڈز 1-2-3',n,idx.length,idx.reduce((a,c)=>a+c.rubrics,0),oidSeen.size);
