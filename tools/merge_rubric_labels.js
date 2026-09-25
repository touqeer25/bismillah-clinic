// ترجمہ شدہ "label=اردو" لائنیں ur/rubric_labels_ur.json میں ضم کرتا ہے (پرانے ترجمے اوور رائٹ نہیں ہوتے، جب تک --force نہ ہو)
// Usage: node tools/merge_rubric_labels.js batch.txt [--force]
const fs=require('fs'),path=require('path');const F=path.resolve(__dirname,'..','ur','rubric_labels_ur.json');
const d=JSON.parse(fs.readFileSync(F,'utf8')), force=process.argv.includes('--force');let add=0,skip=0;
fs.readFileSync(process.argv[2],'utf8').split(/\r?\n/).forEach(line=>{const i=line.indexOf('=');if(i<1)return;const k=line.slice(0,i).trim().toLowerCase(),v=line.slice(i+1).trim();if(!v)return;
  if(d.labels[k]&&!force){skip++;return;} d.labels[k]=v;add++;});
d.meta.count=Object.keys(d.labels).length;fs.writeFileSync(F,JSON.stringify(d,null,0).replace(/","/g,'",\n"'));console.log('added',add,'skipped',skip,'total',d.meta.count);
