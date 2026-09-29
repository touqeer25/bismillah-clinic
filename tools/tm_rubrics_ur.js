// v120: «ترجمہ یادداشت» (TM) — پہلے ترجمہ شدہ ابواب کے ٹکڑوں سے اگلے باب کی خودکار تجویز
// پچھلے بیچوں میں یہ کام ہاتھ سے ہوتا تھا (اپنی ہی عبارتوں کے ٹکڑے جوڑنا) — یہ اوزار وہی مکینکی کرتا ہے۔
// Usage: node tools/tm_rubrics_ur.js kent face [start] [count] [--src kent:head,kent:eye] [--vote u|m] > /tmp/face_tm.tsv
//   کالم: key · depth · en · parent_ur · legacy · tm (ترجمے کا مسودہ) · حالت (done|auto|part|todo) · بے ترجمہ حصہ
//   --vote u = صرف متفق (ایک ہی) ٹکڑے لگائیں (محمود) · --vote m = اکثریتی ترجمہ (ڈاکٹر کی نظرثانی کے لیے ⚙)
const fs=require('fs'); const L=require('./rubrics_ur_lib.js');
const book=process.argv[2]||'kent', ch=process.argv[3]||'face';
const nums=process.argv.slice(4).filter(a=>/^\d+$/.test(a)); const start=+nums[0]||0, count=+nums[1]||1e9;
const si=process.argv.indexOf('--src'); const vi=process.argv.indexOf('--vote');
const VOTE=(vi>0?process.argv[vi+1]:'u');
const SRC=(si>0?process.argv[si+1].split(','):[]).map(s=>{const p=s.split(':'); return {book:p[0]||book, chapter:p[1]};}).filter(x=>x.chapter);

// عضو کے جوڑے — عضو والا اردو ٹکڑا صرف اسی عضو کی ربرک میں لگے گا
const ORGANS=[['nose','ناک'],['nostril','نتھنوں'],['ear','کان'],['eye','آنکھ'],['vision','نظر'],['head','سر'],['forehead','ماتھے'],
 ['face','چہرہ'],['mouth','منہ'],['lip','ہونٹ'],['teeth','دانت'],['tooth','دانت'],['jaw','جبڑے'],['throat','گلا'],['tongue','زبان'],
 ['chin','ٹھوڑی'],['stomach','معدہ'],['chest','سینہ'],['back','کمر'],['abdomen','پیٹ'],['rectum','مقعد'],['bladder','مثانہ'],
 ['skin','جلد'],['hair','بال'],['sleep','نیند'],['cough','کھانسی'],['heart','دل'],['urine','پیشاب'],['stool','پاخانہ'],
 ['menses','حیض'],['sweat','پسینہ'],['fever','بخار'],['limbs','اعضا'],['arm','بازو'],['hand','ہاتھ'],['leg','ٹانگ'],['foot','پاؤں'],['knee','گھٹنے']];
function organOfEn(s){ const out=new Set(); const low=' '+String(s).toLowerCase().replace(/[()]/g,' ')+' ';
  ORGANS.forEach(([en])=>{ if(new RegExp('[ ,]'+en+'[ ,s]').test(low)) out.add(en); }); return out; }
function organOfUr(s){ const out=new Set(); ORGANS.forEach(([en,ur])=>{ if(String(s).indexOf(ur)>=0) out.add(en); }); return out; }

// ٹکڑوں کی صف بندی (DP، مونوٹونک): کئی انگریزی ٹکڑے ایک اردو ٹکڑے میں، یا ایک کے کئی اردو
function align(parts,segs){
  const n=parts.length,m=segs.length,INF=1e9;
  const dp=Array.from({length:n+1},()=>new Array(m+1).fill(INF));
  const bk=Array.from({length:n+1},()=>new Array(m+1).fill(null));
  dp[0][0]=0;
  for(let i=0;i<=n;i++)for(let j=0;j<=m;j++){
    if(dp[i][j]>=INF) continue;
    const put=(ni,nj,pen,tag)=>{ const c=dp[i][j]+pen; if(c<dp[ni][nj]){ dp[ni][nj]=c; bk[ni][nj]=[i,j,tag]; } };
    if(i<n&&j<m) put(i+1,j+1,0,1);                    // 1↔1
    if(i<n&&j+1<m) put(i+1,j+2,1.4,2);                // ایک انگریزی → دو اردو ٹکڑے
    if(i+1<n&&j<m) put(i+2,j+1,1.4,-1);               // دو انگریزی → ایک اردو ٹکڑا
    if(i+1<n&&j+1<m) put(i+2,j+2,1.2,0);              // ڈھیلا
  }
  if(dp[n][m]>=INF) return null;
  const pairs=[]; let i=n,j=m;
  while(i>0||j>0){ const b=bk[i][j]; if(!b) return null; const [pi,pj,tag]=b; if(tag===1||tag===0||tag===2||tag===-1) pairs.push([pi,pj]); i=pi; j=pj; }
  return pairs.reverse();
}

const w=L.appWindow();
const TM=new Map();   // seq -> {votes:Map(ur->n), organs:Set}
function feed(srcBook,srcCh,weight){
  const rows=L.chapterRows(w,srcBook,srcCh); const D=L.readUr(srcBook,srcCh); const R=D.rubrics;
  const root=(D.meta&&D.meta.root)||''; const src=srcBook+'/'+srcCh;
  rows.forEach(r=>{ const ur=R[r.key]; if(!ur) return;
    let body=ur;
    if(root && body.indexOf(root)===0) body=body.slice(root.length);
    else if(r.depth>=1 && body.indexOf(' — ')>=0) body=body.split(' — ').slice(1).join(' — ');
    const parts=r.key.split(', '); const segs=body.split('، ');
    const pairs=align(parts,segs); if(!pairs) return;
    const seqOf=(a,b)=>parts.slice(a,b+1).join(', '), segOf=(a,b)=>segs.slice(a,b+1).join('، ');
    for(let i=0;i<parts.length;i++){                       // ہر شروعات سے ہر جگہ کی ترتیب (کثیر سطحی یاد داشت)
      for(let j=i;j<parts.length;j++){
        const seq=seqOf(i,j); let val=null;
        const s=pairs.find(p=>p[0]===i), e=pairs.find(p=>p[0]===j);
        if(s&&e){ const si=pairs.indexOf(s), ei=pairs.indexOf(e); if(ei>=si) val=segOf(pairs[si][1],pairs[ei][1]); }
        if(!val) continue;
        let t=TM.get(seq); if(!t){ t={votes:new Map(),organs:new Set(),src:new Set()}; TM.set(seq,t); }
        t.votes.set(val,(t.votes.get(val)||0)+weight); organOfUr(val).forEach(o=>t.organs.add(o)); t.src.add(src);
      }
    }
  });
}
const targetDone=(L.readUr(book,ch).meta&&L.readUr(book,ch).meta.count)?true:false;
const srcList=SRC.length?SRC:[{book,chapter:ch}].concat(L.chapters(w,book).filter(c=>{const m=L.readUr(book,c).meta; return m&&m.count&&c!==ch;}).map(c=>({book,chapter:c})));
// پہلے سب ابواب، پھر اپنا باب (اپنے الفاظ کو ترجیح)
srcList.filter(s=>s.chapter!==ch).forEach(s=>{ try{ feed(s.book,s.chapter,1); }catch(e){ console.error('⚠ '+s.chapter+': '+e.message); } });
if(targetDone) try{ feed(book,ch,4); }catch(e){ console.error('⚠ '+ch+': '+e.message); }
console.error('TM: '+TM.size+' ٹکڑے · ابواب: '+srcList.map(s=>s.chapter).join(' '));

function lookup(seq,enContext){
  const t=TM.get(seq); if(!t) return null;
  const vals=[...t.votes.entries()].sort((a,b)=>b[1]-a[1]);
  if(VOTE==='u' && vals.length>1) return null;
  const ctxOrgs=organOfEn(enContext);
  for(const o of t.organs) if(!ctxOrgs.has(o)) return null;
  return vals[0][0];
}
function compose(key,en){
  const parts=key.split(', '); let out=[], i=0, miss=[];
  while(i<parts.length){
    let hit=null;
    for(let j=parts.length-1;j>=i;j--){ const v=lookup(parts.slice(i,j+1).join(', '),en); if(v){ hit={j,v}; break; } }
    if(hit){ out.push(hit.v); i=hit.j+1; } else { miss.push(parts[i]); i++; }
  }
  return {ur:out.join('، '),miss};
}
const rows=L.chapterRows(w,book,ch); const U=L.readUr(book,ch).rubrics; const ROOT=(L.readUr(book,ch).meta&&L.readUr(book,ch).meta.root)||'';
console.log(['key','depth','en','parent_ur','legacy','tm','حالت','بے ترجمہ'].join('\t'));
let a=0,p=0,t=0,d=0;
rows.slice(start,start+count).forEach(r=>{
  const done=U[r.key]||''; const c=compose(r.key,r.full);
  let st, full=done;
  if(done){ st='done'; d++; }
  else if(!c.miss.length){ st='auto'; a++; full=c.ur; }
  else if(c.ur){ st='part'; p++; full=c.ur; }
  else { st='todo'; t++; }
  console.log([r.key,r.depth,r.full,r.parentKey?(U[r.parentKey]||''):'',L.legacyRow(w,r),full,st,c.miss.join(', ')].join('\t'));
});
console.error(`${book}/${ch}: پہلے سے ${d} · خودکار ${a} · ادھورے ${p} · خالی ${t}`);
