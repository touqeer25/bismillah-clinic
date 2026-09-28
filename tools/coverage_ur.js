// اردو ترجمے کی کوریج: کینٹ کے کل لیبل-ظہور میں سے کتنے ترجمہ شدہ ہیں
const fs=require('fs'),path=require('path');const {JSDOM}=require(process.env.JSDOM_PATH||'/tmp/jsd/node_modules/jsdom');
const R=path.resolve(__dirname,'..'), book=process.argv[2]||'kent';
const w=new JSDOM('<div id="repRubricContent"></div>',{runScripts:'dangerously',url:'http://localhost/'}).window;w.escapeHtml=s=>s;
w.eval(fs.readFileSync(R+'/js/repertory/LOAD_ORDER.txt','utf8').split(/\s+/).filter(Boolean).map(f=>fs.readFileSync(R+'/js/repertory/'+f,'utf8')).join('\n'));w.repCurrentBook=book;
const dir=R+'/'+w.REP_BOOK_INFO[book].chapDir, have=JSON.parse(fs.readFileSync(R+'/ur/rubric_labels_ur.json','utf8')).labels;
let tot=0,done=0;
for(const c of JSON.parse(fs.readFileSync(dir+'_index.json'))){
  const t=w.buildRubricTree(JSON.parse(fs.readFileSync(dir+c.key+'.json')));const rows=[];w.repTreeFlatten(t,[],'',0,rows,'');
  rows.forEach(r=>{let l=r.label.replace(/ \[\d+\]$/,'').trim(); if(!l)return; tot++;
    if(/\(\s*see\b/i.test(l)) l=l.replace(/\s*\(\s*see\b[^)]*\)/ig,'').replace(/\s+,/g,',').replace(/,\s*$/,'').trim();   // v103 کی طرح
    if(have[l.toLowerCase()])done++;});
}
console.log(book+': کل لیبل-ظہور '+tot+'   ترجمہ شدہ '+done+'  ('+(100*done/tot).toFixed(1)+'%)');
