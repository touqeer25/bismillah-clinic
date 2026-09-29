// v107: باب کا اردو «پڑھنے کے لیے» نکالیں + مشتبہ جملے — نظرثانی سے پہلے ضرور چلائیں
// Usage: node tools/qa_rubrics_ur.js kent mind [--all]      (--all = بغیر ترجمے والے بھی دکھاؤ)
const L=require('./rubrics_ur_lib.js');
const book=process.argv[2]||'kent', ch=process.argv[3]||'mind', all=process.argv.includes('--all');
const w=L.appWindow(); const rows=L.chapterRows(w,book,ch); const D=L.readUr(book,ch); const U=D.rubrics; const LK=new Set(D.locked);
let n=0,miss=0; const warn=[];
rows.forEach(r=>{
  const t=U[r.key];
  if(!t){ miss++; if(all) console.log('  '.repeat(r.depth)+'○ '+r.label+'   ⟵ (ترجمہ نہیں)'); return; }
  n++;
  // بنیاد = قریب ترین بزرگ جس کے جملے سے یہ جملہ شروع ہوتا ہے (ایپ کی repRubUrBase جیسی منطق)
  let p=null; for(let i=r.labels.length-1;i>=1;i--){ const a=U[w.repRubKey(r.labels.slice(0,i).join(', '))]; if(!a) continue;
    if(t.length>a.length&&t.indexOf(a)===0){ p=a; break; } const o=w.repRubUrObl(a); if(o&&t.length>o.length&&t.indexOf(o)===0){ p=o; break; } }   // مائل شکل («لکھنا»→«لکھنے») بھی بنیاد
  const ROOT=(D.meta&&D.meta.root)||''; if(!p&&ROOT&&t.length>ROOT.length&&t.indexOf(ROOT)===0) p=ROOT;
  const ext=!!p||(r.depth===0&&!ROOT);
  const flags=[];
  if(/[A-Za-z]{2,}/.test(t)) flags.push('انگریزی حروف');
  if(/\(/.test(t)&&!/\)/.test(t)) flags.push('قوسین ادھوری');
  if(/ہوے|ئے ئے|  /.test(t)) flags.push('ٹوٹا لفظ/دہری جگہ');
  if(!ext) flags.push('کسی بزرگ (والد/جڑ) کے جملے سے شروع نہیں — بالکل الگ جملہ');
  if(t.length<2) flags.push('بہت چھوٹا');
  if(/[۰-۹٠-٩]/.test(t)) flags.push('اردو ہندسے — صارف کا اصول: 1 2 3 لکھیں');
  if(flags.length) warn.push({r,t,flags});
  const shown=p?'…'+t.slice(p.length):t;
  console.log('  '.repeat(r.depth)+(LK.has(r.key)?'🔒':'•')+' '+r.label.padEnd(44).slice(0,44)+'  '+shown);
});
console.log(`\n${book}/${ch}: ترجمہ شدہ ${n} / ${rows.length}   باقی ${miss}   قفل ${D.locked.length}   ⚠ مشتبہ ${warn.length}`);
warn.slice(0,80).forEach(x=>console.log('  ⚠ '+x.r.full+'  →  '+x.t+'   ['+x.flags.join(' · ')+']'));
