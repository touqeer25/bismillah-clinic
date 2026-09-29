// v118: نظرثانی کی فائل کسی بھی وقت json سے بنائیں — ذخیرہ کرنے کی ضرورت نہیں
// Usage: node tools/review_rubrics_ur.js kent eye > ur/review/eye_REVIEW.md     (یا  --all  سب ابواب ur/review/ میں)
const fs=require('fs'),path=require('path'); const L=require('./rubrics_ur_lib.js');
const book=process.argv[2]||'kent'; const all=process.argv.includes('--all'); const chArg=process.argv[3];
const w=L.appWindow();
function make(ch){
  const rows=L.chapterRows(w,book,ch); const D=L.readUr(book,ch); const R=D.rubrics; const auto=new Set(D.meta.auto||[]); const LK=new Set(D.locked||[]);
  const done=rows.filter(r=>R[r.key]).length; if(!done) return null;
  const head=[`# نظرثانی — ${book}/${ch} — ${done} / ${rows.length} ربرک · قفل ${LK.size} · خودکار جوڑ ⚙ ${auto.size}`,'',
  '> ہر ربرک کے سامنے اردو جملہ ہے (باب کی جڑ + والد کا حصہ + اِس صف کا اضافہ)۔ جو غلط لگے اُس کی قطار کے آخری خانے («اصلاح») میں درست لکھ دیں اور فائل واپس دیں؛ اصلاحات `tools/merge_rubrics_ur.js` سے ضم اور `--lock` سے قفل ہوں گی۔',
  '> ⚙ = پچھلی عبارتوں کے ٹکڑوں سے خودکار جوڑا ہوا (پہلے یہ دیکھیں) · 🔒 = ڈاکٹر کا منظور شدہ (قفل)۔ یہ فائل `node tools/review_rubrics_ur.js '+book+' '+ch+'` سے کسی بھی وقت دوبارہ بن جاتی ہے — گٹ ہب پر رکھنا ضروری نہیں۔','',
  '| # | ⚙ | سطح | انگریزی ربرک | **اردو جملہ** | اصلاح |','|---|---|---|---|---|---|'];
  const body=rows.map((r,i)=>`| ${i+1} | ${LK.has(r.key)?'🔒':(auto.has(r.key)?'⚙':'')} | ${r.depth} | ${r.full.replace(/\|/g,'/')} | **${R[r.key]||''}** |  |`);
  return head.concat(body).join('\n')+'\n';
}
if(all){ const dir=path.join(L.R,'ur','review'); fs.mkdirSync(dir,{recursive:true});
  L.chapters(w,book).forEach(ch=>{ const md=make(ch); if(md){ fs.writeFileSync(path.join(dir,`${book}_${ch}_REVIEW.md`),md); console.error('✓',ch); } });
} else if(chArg){ const md=make(chArg); if(md) process.stdout.write(md); else console.error('اس باب کا کوئی جملہ نہیں'); }
else console.error('Usage: node tools/review_rubrics_ur.js kent <chapter> | --all');
