// v77: 📚 reading library (Organon 6th, Chronic Diseases) + Boger Times hierarchy + Hahnemann CD in materia medica
const fs=require('fs'), path=require('path'); const {JSDOM}=require('jsdom'); const R=path.join(__dirname,'..');
let fail=0; const ok=(c,m)=>{ if(!c){ fail++; console.log('✗',m); } else console.log('✓',m); };
const lib=JSON.parse(fs.readFileSync(R+'/library/_index.json')); ok(lib.books.length>=2,'library index has books');
const org=JSON.parse(fs.readFileSync(R+'/library/organon6.json'));
const paras=org.sections.filter(s=>/^§ \d+/.test(s.h)); ok(paras.length===291,'Organon: 291 §§ ('+paras.length+')');
ok(!org.sections.some(s=>/5th/.test(s.h)),'Organon: no 5th-edition variants');
ok(org.sections.find(s=>/^§ 270/.test(s.h)).p.join(' ').length>500,'Organon § 270 has text');
const mm=JSON.parse(fs.readFileSync(R+'/mm/_index.json')); ok(mm.books.hahnemann_chronic&&mm.avail.sulph.includes('hahnemann_chronic'),'CD remedies in mm index');
const cd=JSON.parse(fs.readFileSync(R+'/mm/hahnemann_chronic.json')); ok(Object.keys(cd.remedies).length===48,'CD: 48 remedies');
const bm=JSON.parse(fs.readFileSync(R+'/boger_times_chapters/morning.json')); const ts=Object.values(bm).map(x=>x.t);
['Sensorium, Vertigo, Break-fast, during','In Morning, Weakness, Rising, when, After','Head, Headache, Every morning, 9 A. M'].forEach(t=>ok(ts.includes(t),'Boger: '+t));
ok(fs.readFileSync(R+'/docs/boger_times_placement_report.md','utf8').includes('| heur |'),'Boger placement report');
const w=new JSDOM('<body></body>',{runScripts:'dangerously',url:'http://localhost/'}).window;
w.escapeHtml=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
w.fetch=(u)=>Promise.resolve({json:()=>Promise.resolve(JSON.parse(fs.readFileSync(R+'/'+u.split('?')[0])))});
w.eval(fs.readFileSync(R+'/js/08d-library.js','utf8'));
w.repLibOpen('organon6');
setTimeout(()=>{
  const d=w.document; ok(d.querySelectorAll('.rep-lib-ti').length===org.sections.length,'reader TOC lists all sections');
  d.getElementById('repLibPara').value='153'; w.repLibGoPara(); ok(/§ 153/.test(d.querySelector('.rep-lib-h').textContent),'go to § 153');
  d.getElementById('repLibQ').value='vital force'; w.repLibSearch(); ok(d.querySelectorAll('.rep-lib-hit').length>20,'search "vital force" hits: '+d.querySelectorAll('.rep-lib-hit').length);
  w.repLibSetBook('chronic_diseases'); setTimeout(()=>{ ok(d.querySelectorAll('.rep-lib-ti').length>100,'CD theory loads'); console.log(fail?'FAIL '+fail:'ALL OK'); process.exit(fail?1:0); },200);
},300);
