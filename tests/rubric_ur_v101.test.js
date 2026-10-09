// v101: پورے ربرک کا اردو جملہ — دائیں سے بائیں
const fs=require('fs'),path=require('path');const {JSDOM}=require(process.env.JSDOM_PATH||'/tmp/jsd/node_modules/jsdom');
const ROOT=path.resolve(__dirname,'..');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const rd=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const w=new JSDOM('<!doctype html><html><body></body></html>',{runScripts:'dangerously',url:'http://localhost/'}).window;
w.escapeHtml=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
w._repAttr=s=>String(s||'').replace(/"/g,'&quot;');
w.currentLang='ur';
const _J=JSON.parse(rd('ur/rubric_labels_ur.json'));
w._repUrLabels=_J.labels; w._repUrCtx=_J.ctx||{}; w._locked=new Set(_J.locked||[]);
w.repUrLabelsOn=()=>w.currentLang==='ur';
w.repUrLabelObj=function(l){let s=String(l||'').replace(/ \[\d+\]$/,'');
  if(/\(\s*see\b/i.test(s)) s=s.replace(/\s*\(\s*see\b[^)]*\)/ig,'').replace(/\s+,/g,',').replace(/,\s*$/,'').trim();
  const k=s.toLowerCase().trim();return w._repUrLabels[k]?{t:w._repUrLabels[k],auto:false}:null;};
w.eval(rd('js/17-rubric-ur.js'));

// ---------- A. ترتیب الٹی ہونی چاہیے ----------
const a=w.repRubricUrFull('PAIN, morning, waking, on');
ok(/^جاگنے پر/.test(a),'A1 سب سے خاص شرط پہلے آتی ہے: "'+a+'"');
ok(/درد$/.test(a),'A2 بنیادی علامت آخر میں: "'+a+'"');
const b=w.repRubricUrFull('ANGER, consoled, when');
ok(b==='تسلی دیے جانے پر، غصہ','A3 ANGER, consoled, when → "'+b+'"');
const c=w.repRubricUrFull('ABSENT-MINDED (See Forgetful), reading, while');
ok(/^پڑھتے ہوئے،/.test(c),'A4 «while» فعل کو «…تے ہوئے» بناتا ہے: "'+c+'"');
const d=w.repRubricUrFull('PAIN, eating, after');
ok(d==='کھانے کے بعد، درد','A5 «after» جڑ کر «کھانے کے بعد»: "'+d+'"');
const e=w.repRubricUrFull('ANXIETY, air, in open agg.');
ok(/بگاڑ|کھلی ہوا/.test(e),'A6 agg. والا ٹکڑا بھی بنتا ہے: "'+e+'"');

// ---------- B. حفاظتیں ----------
ok(w.repRubricUrFull('ZZZ QQQ, wibble wobble')==='','B1 ترجمہ نہ ہو تو خالی (ادھورا جملہ نہیں)');
ok(/<span dir="ltr">/.test(w.repRubricUrFull('PAIN, wibble wobble',{keepEnglish:true})),'B2 keepEnglish پر انگریزی ٹکڑا رہتا ہے');
w.currentLang='en'; ok(w.repRubricUrHtml('PAIN, eating, after')==='','B3 انگریزی زبان میں کچھ نہیں دکھاتا'); w.currentLang='ur';
ok(/dir="rtl"/.test(w.repRubricUrHtml('PAIN, eating, after')),'B4 اردو میں dir=rtl کے ساتھ آتا ہے');
ok(w.repPathUrHtml('MIND - ANGER - evening')!=='','B5 راستہ (A - B - C) بھی چلتا ہے');

// ---------- C. ایپ میں جڑا ہوا ----------
const idx=rd('index.html');
ok(/js\/17-rubric-ur\.js\?v=\d+/.test(idx)&&/css\/rubric-ur\.css\?v=\d+/.test(idx),'C1 index.html میں فائل + سجاوٹ');
ok(/repRubricUrHtml\(x\.t,'rep-diff-ur'\)/.test(rd('js/differentiation/07-diff-views.js')),'C2 تفریق کی ہر سطر پر');
ok(/repPathUrHtml\(it\.path\|\|'','rep-wb-ur'\)/.test(rd('js/repertory/rep-workbench.js')),'C3 کلپ بورڈ کی ہر سطر پر');
ok(/repPathUrHtml\(d\.translationFull\|\|full\|\|'','rpd-title-ur'\)/.test(rd('js/repertory/rep-rubric-detail.js')),'C4 ربرک کے صفحے کے عنوان پر (v143: اصل ترجمہ-کلید translationFull سے)');
const sw=rd('service-worker.js');
ok(sw.includes('./js/17-rubric-ur.js')&&sw.includes('./css/rubric-ur.css')&&sw.includes('./ur/rubric_labels_ur.json'),'C5 سروس ورکر میں (آف لائن ترجمہ)');

// ---------- D. اصل کینٹ ڈیٹا پر ----------
let tot=0,made=0;
for(const ch of []){ // v167: head کے سارے فعال ربرکس کے ہاتھ سے لکھے جملے ur/rubrics/kent/head.json میں (6320/6320) — کمپوزر کی اس موٹ سے باہر؛ v178: stomach (2940/2940) اور mind (v163 مکمل فائل) بھی — اب ہر kent باب کی مکمل چپٹر-فائل ہے، کمپوزر- probes فی-باب ٹیسٹوں میں 100% کوریج کے طور پر محفوظ
  const p2=path.join(ROOT,'kent_chapters',ch+'.json'); if(!fs.existsSync(p2)) continue;
  for(const v of Object.values(JSON.parse(fs.readFileSync(p2,'utf8')))){
    const t=v.t||''; if(t.split(',').length<3) continue; tot++; if(w.repRubricUrFull(t)) made++;
  }
}
if(tot) ok(made/tot>0.5,'D1 اصل کینٹ: '+made+'/'+tot+' ('+(100*made/tot).toFixed(0)+'%) مرکب ربرکس کا مکمل اردو جملہ بنا');
// ---------- E. v103: کراس ریفرنس ----------
const x1=w.repXrefSplit('ABANDONED (SEE FORSAKEN)');
ok(x1.head==='ABANDONED'&&x1.xref==='(See Forsaken)','E1 اشارہ الگ + عنوانی حروف: '+x1.xref);
const x2=w.repXrefSplit('AMOROUS (SEE LEWDNESS AND LASCIVIOUS, ALSO GENITALIA)');
ok(x2.xref==='(See Lewdness and Lascivious, also Genitalia)','E2 چھوٹے الفاظ چھوٹے رہتے ہیں: '+x2.xref);
ok(/<span class="rep-xref">/.test(w.repXrefHtml('ABANDONED (SEE FORSAKEN)')),'E3 اشارے کا اپنا خانہ (الگ انداز)');
const u1=w.repRubricUrFull('ABSENT-MINDED (See Forgetful), reading, while');
ok(u1&&!/دیکھیے/.test(u1),'E4 اردو میں اشارے کا ترجمہ نہیں: "'+u1+'"');
ok(w.repRubricUrFull('periodical attacks of, short lasting')==='مختصر رہنے والے وقفے دار دورے','E5 صارف کی نشان زدہ غلطی درست: "'+w.repRubricUrFull('periodical attacks of, short lasting')+'"');
ok(/rep-xref/.test(rd('js/repertory/rep-tree.js'))||/repXrefHtml/.test(rd('js/repertory/rep-tree.js')),'E6 ٹری کی سطر میں لاگو');
ok(/repXrefHtml/.test(rd('js/repertory/rep-rubric-detail.js')),'E7 ربرک کے عنوان میں لاگو');
ok(/repXrefHtml/.test(rd('js/differentiation/07-diff-views.js')),'E8 تفریق کی سطر میں لاگو');

// ---------- F. v105: سیاق + قفل ----------
ok(Object.keys(w._repUrCtx).length>500,'F1 سیاق کے اندراج: '+Object.keys(w._repUrCtx).length);
ok(w._repUrCtx['menses|during']==='حیض کے دوران','F2 «menses › during» = '+w._repUrCtx['menses|during']);
ok(w._repUrCtx['anger|absent persons, at']==='غیر حاضر لوگوں پر غصہ','F3 مبہم لیبل والد کے ساتھ صاف ہوا');
ok(!/کے دوران سے/.test(JSON.stringify(w._repUrCtx)),'F4 ادھورے والد سے سیاق نہیں بنا');
ok(w._locked.size>1000,'F5 قفل شدہ ترجمے: '+w._locked.size);
['absent persons, at','leg','dinner','timidity','with silent grief'].forEach(k=>ok(w._locked.has(k),'F6 قفل: '+k));
ok(/repUrCtxLookup/.test(rd('js/repertory/rep-tree.js')),'F7 ایپ سیاق پڑھتی ہے');
ok(/locked/.test(rd('tools/merge_ur.js')),'F8 merge اوزار قفل کا احترام کرتا ہے');

console.log(fails?'\nFAILURES: '+fails:'\nALL v105 RUBRIC-UR CHECKS PASSED');
process.exit(fails?1:0);
