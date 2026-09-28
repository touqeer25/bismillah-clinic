// v105: بیچ کے ترجمے لیبل فائل میں شامل کرتا ہے — **مگر قفل شدہ کو کبھی نہیں بدلتا**
// Usage: node tools/merge_ur.js /tmp/bX_draft.tsv
const fs=require('fs'),path=require('path');const R=path.resolve(__dirname,'..');
const F=R+'/ur/rubric_labels_ur.json', L=JSON.parse(fs.readFileSync(F,'utf8'));
const locked=new Set(L.locked||[]);
let add=0,upd=0,skip=0;
fs.readFileSync(process.argv[2],'utf8').split('\n').filter(Boolean).forEach(line=>{
  const [lab,,ur,how]=line.split('\t');
  if(!ur||/^\?/.test(ur)||how==='نامکمل') return;
  const k=lab.trim().toLowerCase();
  if(locked.has(k)){ skip++; return; }                 // 🔒 نظرثانی شدہ — ہاتھ نہ لگاؤ
  if(L.labels[k]===undefined){ L.labels[k]=ur; add++; }
  else if(L.labels[k]!==ur){ L.labels[k]=ur; upd++; }
});
L.meta.count=Object.keys(L.labels).length;
fs.writeFileSync(F, JSON.stringify(L,null,1));
console.log('نئے: '+add+'   بدلے: '+upd+'   🔒 محفوظ (نہیں چھیڑے): '+skip+'   کل: '+L.meta.count);
