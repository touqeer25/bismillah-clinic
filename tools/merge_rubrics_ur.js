// v107: ہاتھ کے ترجمے ur/rubrics/<book>/<chapter>.json میں ضم کریں — قفل کا احترام، والد+اضافہ خود جوڑے
// Usage: node tools/merge_rubrics_ur.js kent mind /tmp/mind_1.tsv [--lock]
//   TSV: پہلا کالم key، آخری کالم اردو (export کی فائل جوں کی توں چلتی ہے)۔
//   اردو = «اضافہ» → جملہ = والد کا جملہ + « — » (سطح ۱) یا «، » (گہری سطح) + اضافہ
//   اردو = «+اضافہ» → والد کا جملہ + ایک جگہ + اضافہ (جب «—»/«،» کے بغیر بہتر پڑھا جائے، مثلاً «شام» + «+۶ بجے»)
//   اردو = «=پورا جملہ» → جوں کا توں (والد سے نہیں جڑتا)
//   خالی اردو → چھوڑ دیا جاتا ہے (پرانا رہتا ہے)۔  --lock → اس فائل کی ساری کلیدیں قفل (نظرثانی کے بعد)
const fs=require('fs'); const L=require('./rubrics_ur_lib.js');
const book=process.argv[2], ch=process.argv[3], file=process.argv[4], lock=process.argv.includes('--lock');
if(!book||!ch||!file){ console.error('Usage: node tools/merge_rubrics_ur.js kent mind file.tsv [--lock]'); process.exit(2); }
const w=L.appWindow(); const rows=L.chapterRows(w,book,ch); const byKey={}; rows.forEach(r=>byKey[r.key]=r);
const D=L.readUr(book,ch); const U=D.rubrics; const LK=new Set(D.locked);
const inp={}; fs.readFileSync(file,'utf8').split('\n').forEach((line,i)=>{ if(!line.trim()||(i===0&&/^key\t/.test(line))) return;
  const p=line.split('\t'); const k=p[0].trim(); let ur=(p[p.length-1]||'').trim(); if(!k||!ur) return; inp[k]=ur; });
let added=0,changed=0,kept=0,unknown=0,same=0; const order=[];
rows.forEach(r=>{                                   // ٹری کی ترتیب: والد پہلے، پھر بچے
  const raw=inp[r.key]; if(raw===undefined) return;
  let full;
  if(raw[0]==='=') full=raw.slice(1).trim();
  else if(!r.parentKey) full=raw.replace(/^\+/,'');
  else { const par=U[r.parentKey]; if(!par){ console.error('⚠ والد کا جملہ نہیں: '+r.full+'  → پورا جملہ «=…» لکھیں'); unknown++; return; }
         full=raw[0]==='+' ? par+' '+raw.slice(1).trim()            // «+اضافہ» → صرف ایک جگہ چھوڑ کر جوڑو (بغیر «—»/«،»)
                          : par+(r.depth===1?' — ':'، ')+raw; }
  full=full.replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));   // صارف کا اصول: ہندسے ہمیشہ 1 2 3 (اردو ہندسے نہیں)
  full=full.replace(/\s+/g,' ').replace(/\s+([،۔,])/g,'$1').trim();
  if(LK.has(r.key)&&U[r.key]!==full){ kept++; return; }
  if(U[r.key]===undefined) added++; else if(U[r.key]!==full) changed++; else same++;
  U[r.key]=full; order.push(r.key);
});
Object.keys(inp).forEach(k=>{ if(!byKey[k]){ unknown++; console.error('⚠ کلید ٹری میں نہیں: '+k); } });
// ترتیب: ٹری کے مطابق دوبارہ لکھو
const sorted={}; rows.forEach(r=>{ if(U[r.key]!==undefined) sorted[r.key]=U[r.key]; });
if(lock) order.forEach(k=>LK.add(k));
D.meta=Object.assign({},D.meta,{book,chapter:ch,version:1,order:'base-first',count:Object.keys(sorted).length,locked_count:LK.size,
  note:'ربرک کا پورا راستہ (چھوٹے حروف، (See …) نکال کر) → کینٹ کے مطلب کا اردو جملہ، بنیاد پہلے۔ صرف tools/merge_rubrics_ur.js سے لکھیں۔',
  updated:new Date().toISOString().slice(0,10)});
D.rubrics=sorted; D.locked=rows.filter(r=>LK.has(r.key)&&sorted[r.key]!==undefined).map(r=>r.key);
const f=L.writeUr(book,ch,D);
console.log(`${book}/${ch} → ${f}\n  نئے: ${added}   بدلے: ${changed}   ویسے ہی: ${same}   🔒 محفوظ (نہیں بدلے): ${kept}   ⚠ نامعلوم: ${unknown}\n  کل جملے: ${Object.keys(sorted).length} / ${rows.length} ربرک   قفل: ${D.locked.length}`);
