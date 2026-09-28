// v96: اردو ترجمے کی خودکار جانچ — لغت کی پابندی، ٹکراؤ، بےقاعدگی
// Usage: node tools/check_rubric_labels.js            (لغت + لیبل فائل دونوں)
//        node tools/check_rubric_labels.js --labels-only
const fs=require('fs'),path=require('path');const R=path.resolve(__dirname,'..');
const rd=f=>JSON.parse(fs.readFileSync(path.join(R,f),'utf8'));
let warn=0,err=0;
const E=m=>{console.log('❌ '+m);err++;}, W=m=>{console.log('⚠  '+m);warn++;}, OK=m=>console.log('✅ '+m);

const G=rd('ur/glossary_core_v1.json'), terms=G.terms, alias=G.aliases||{};
const labels=rd('ur/rubric_labels_ur.json').labels;

// ۱) لغت کے اندر ٹکراؤ: ایک اردو ← کئی انگریزی (مستثنیات کے سوا)
const rev={};
Object.keys(terms).forEach(k=>{ const v=terms[k]; (rev[v]=rev[v]||[]).push(k); });
let col=0;
Object.keys(rev).forEach(v=>{
  const ks=rev[v]; if(ks.length<2) return;
  const base=ks.map(k=>alias[k]||k), uniq=[...new Set(base)];
  if(uniq.length>1){ E('ٹکراؤ: «'+v+'» ← '+ks.join(', ')+'  (دو مختلف اصطلاحیں ایک ہی اردو پر)'); col++; }
});
if(!col) OK('لغت میں کوئی ٹکراؤ نہیں — '+Object.keys(terms).length+' اصطلاحیں');

// ۲) خالی یا مشکوک ترجمے
Object.keys(terms).forEach(k=>{
  const v=terms[k]||'';
  if(!v.trim()) E('خالی ترجمہ: '+k);
  else if(/[A-Za-z]/.test(v)&&!/^[A-Z][a-z]+$/.test(v)) W('اردو میں انگریزی حروف: '+k+' → '+v);
});

// ۳) لیبل فائل: کیا وہ لغت سے متصادم تو نہیں؟
let clash=0,checked=0;
Object.keys(labels).forEach(l=>{
  const t=terms[l]; if(t===undefined) return; checked++;
  if(labels[l]!==t){ W('لیبل لغت سے مختلف: «'+l+'» → لیبل میں «'+labels[l]+'»، لغت میں «'+t+'»'); clash++; }
});
if(!clash) OK('لیبل فائل لغت کے مطابق ہے ('+checked+' مشترکہ اندراج جانچے گئے)');

// ۴) لیبل فائل کے اندر بےقاعدگی: ایک اردو ← کئی انگریزی لیبل
const rev2={};
Object.keys(labels).forEach(k=>{ (rev2[labels[k]]=rev2[labels[k]]||[]).push(k); });
let dup=0;
Object.keys(rev2).forEach(v=>{ if(rev2[v].length>1){ W('ایک ہی اردو کئی لیبلوں پر: «'+v+'» ← '+rev2[v].join(' | ')); dup++; } });
if(!dup) OK('لیبل فائل میں کوئی دہرا ترجمہ نہیں');

// ۵) اہم اصطلاحات کی موجودگی
['agg.','amel.','after','before','during','ailments from','extending','sensation as if']
  .forEach(k=>{ if(!terms[k]) E('بنیادی اصطلاح غائب: '+k); });

console.log('\n'+(err?('❌ خرابیاں: '+err+'   ⚠ تنبیہات: '+warn):('✅ سب ٹھیک'+(warn?('   ⚠ تنبیہات: '+warn):'')))); 
process.exit(err?1:0);
