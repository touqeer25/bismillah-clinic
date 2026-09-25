// ترجمے کے لیے ربرک لیبلز کی فہرست نکالتا ہے: وہ لیبل جن کا اردو ترجمہ ابھی ur/rubric_labels_ur.json میں نہیں۔
// Usage: node tools/export_rubric_labels.js kent [limit] > kent_todo.tsv   (label <TAB> تعداد، زیادہ استعمال والے پہلے)
// ترجمہ کر کے اسی ترتیب میں "label=اردو" لائنیں بنائیں اور tools/merge_rubric_labels.js سے ضم کریں۔
const fs=require('fs'),path=require('path');const {JSDOM}=require(process.env.JSDOM_PATH||'/tmp/jsd/node_modules/jsdom');
const R=path.resolve(__dirname,'..');const book=process.argv[2]||'kent', limit=+process.argv[3]||1e9;
const w=new JSDOM('<div id="repRubricContent"></div>',{runScripts:'dangerously',url:'http://localhost/'}).window;w.escapeHtml=s=>s;
w.eval(fs.readFileSync(R+'/js/08-app-repertory.js','utf8'));w.repCurrentBook=book;
const dir=R+'/'+w.REP_BOOK_INFO[book].chapDir, have=JSON.parse(fs.readFileSync(R+'/ur/rubric_labels_ur.json','utf8')).labels, C={};
for(const c of JSON.parse(fs.readFileSync(dir+'_index.json'))){const t=w.buildRubricTree(JSON.parse(fs.readFileSync(dir+c.key+'.json')));const rows=[];w.repTreeFlatten(t,[],'',0,rows,'');
  rows.forEach(r=>{const l=r.label.replace(/ \[\d+\]$/,'').trim(); if(!have[l.toLowerCase()])C[l]=(C[l]||0)+1;});}
Object.entries(C).sort((a,b)=>b[1]-a[1]).slice(0,limit).forEach(([l,n])=>console.log(l+'\t'+n));
