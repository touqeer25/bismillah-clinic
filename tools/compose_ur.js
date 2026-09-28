// v96: لیبل کا خودکار ترجمہ — لغت + اردو کے صرفی قواعد۔ جو نہ بنے اسے «?» سے نشان زد۔
// Usage: node tools/compose_ur.js /tmp/b1.tsv > /tmp/b1_draft.tsv
const fs=require('fs'),path=require('path');const R=path.resolve(__dirname,'..');
const G=JSON.parse(fs.readFileSync(R+'/ur/glossary_core_v1.json','utf8')).terms;
const L=JSON.parse(fs.readFileSync(R+'/ur/rubric_labels_ur.json','utf8')).labels;
const T=k=>{k=String(k).trim().toLowerCase(); return G[k]||L[k]||null;};

// ---------- اردو کی صرف ----------
// مصدر (…نا) → حالتِ مجرور (…نے):  چلنا → چلنے سے
const OBL_EX={'بایاں':'بائیں','دایاں':'دائیں','قے':'قے','ہوا':'ہوا','دوا':'دوا','ہوا (شور)':'ہوا'};
const TIMEW=['صبح','شام','رات','دوپہر','سہ پہر','آدھی رات','دوپہر سے پہلے','دن میں'];
function obl(u){
  if(OBL_EX[u]) return OBL_EX[u];
  if(/(میں|پر|سے|کے ساتھ|کی طرف|کے بعد|کے دوران)$/.test(u)) return u;   // پہلے سے حرفِ اضافت لگا ہے
  if(/نا$/.test(u)) return u.replace(/نا$/,'نے');
  if(/ہ$/.test(u))  return u.replace(/ہ$/,'ے');        // کمرہ → کمرے، پسینہ → پسینے
  if(/[^ی]ا$/.test(u)) return u.replace(/ا$/,'ے');     // کندھا → کندھے
  if(/ے$/.test(u))  return u.replace(/ے$/,'وں');
  if(/یں$/.test(u)) return u.replace(/یں$/,'یوں');
  if(/اں$/.test(u)) return u.replace(/اں$/,'وں');
  return u;
}
const isTime=u=>TIMEW.indexOf(u)!==-1;
// مصدر → حالتِ فاعلی مسلسل: چلنا → چلتے ہوئے
function cont(u){ return /نا$/.test(u) ? u.replace(/نا$/,'تے ہوئے') : u+' کے دوران'; }
const isVerb=u=>/نا$/.test(u);

const NUM={'0':'۰','1':'۱','2':'۲','3':'۳','4':'۴','5':'۵','6':'۶','7':'۷','8':'۸','9':'۹'};
const urNum=s=>String(s).replace(/[0-9]/g,d=>NUM[d]);
function dayPart(h,ap){                       // گھنٹے کے مطابق دن کا حصہ
  h=+h; if(/a/i.test(ap)) return h>=5&&h<=11?'صبح':'رات';
  if(h===12) return 'دوپہر'; if(h<=3) return 'دوپہر'; if(h<=6) return 'سہ پہر';
  if(h<=8) return 'شام'; return 'رات';
}
function clock(l){
  let m=l.match(/^(\d{1,2})(?::(\d{2}))?\s*(a\.m\.|p\.m\.)$/i);
  if(m) return dayPart(m[1],m[3])+' '+urNum(m[1])+(m[2]?':'+urNum(m[2]):'')+' بجے';
  m=l.match(/^(\d{1,2})\s*(a\.m\.|p\.m\.)\s*to\s*(\d{1,2})\s*(a\.m\.|p\.m\.)$/i);
  if(m) return dayPart(m[1],m[2])+' '+urNum(m[1])+' سے '+(dayPart(m[3],m[4])!==dayPart(m[1],m[2])?dayPart(m[3],m[4])+' ':'')+urNum(m[3])+' بجے تک';
  return null;
}
// دُم کے الفاظ: «X, after» → «X کے بعد»
function tail(u,t){
  t=t.toLowerCase();
  if(t==='after')  return obl(u)+' کے بعد';
  if(t==='before') return obl(u)+' سے پہلے';
  if(t==='during') return obl(u)+' کے دوران';
  if(t==='while')  return cont(u);
  if(t==='on')     return obl(u)+' پر';
  if(t==='in')     return obl(u)+' میں';
  if(t==='from')   return obl(u)+' سے';
  if(t==='when')   return isVerb(u)? obl(u)+' پر' : 'جب '+u;
  if(t==='with')   return obl(u)+' کے ساتھ';
  if(t==='agg.')   return isTime(u)? u+' کو بگاڑ' : obl(u)+' سے بگاڑ';
  if(t==='amel.')  return isTime(u)? u+' کو آرام' : obl(u)+' سے آرام';
  return null;
}
const HEADPREP={'while':'کرتے ہوئے','on':'پر','in':'میں','during':'کے دوران','from':'سے','after':'کے بعد','before':'سے پہلے','when':'جب','at':'وقت','with':'کے ساتھ'};
const POST={'during':'کے دوران','while':'کے دوران','in':'میں','on':'پر','to':'کی طرف','from':'سے','with':'کے ساتھ','of':'کا','at':'پر','into':'کے اندر','by':'سے','about':'کے گرد','around':'کے گرد','under':'کے نیچے','over':'کے اوپر','behind':'کے پیچھے','before':'سے پہلے','after':'کے بعد'};

function compose(label,depth){
  depth=depth||0;
  const R2=x=>{ if(depth>4) return null; const r=compose(x,depth+1); return (r&&!/^\?/.test(r[0]))?r[0]:null; };
  const l=label.trim(); let d=T(l); if(d) return [d,'لغت'];
  const TT=x=>T(x)||R2(x);
  const c=clock(l); if(c) return [c,'وقت'];
  let m;
  // «X agg.» / «X amel.»
  if((m=l.match(/^(.+?)[,\s]+(agg\.|amel\.)$/i))){
    const head=m[1].trim(), kind=m[2].toLowerCase()==='agg.'?'بگاڑ':'آرام';
    if(HEADPREP[head.toLowerCase()]) return [HEADPREP[head.toLowerCase()]+' '+kind,'قاعدہ'];
    const h=TT(head); if(h) return [isTime(h)? h+' کو '+kind : obl(h)+' سے '+kind,'قاعدہ'];
    // «A, B agg.» جیسے مرکبات
    const mm=head.match(/^(.+),\s*([a-z.]+)$/i);
    if(mm){ const hh=T(mm[1]); const tt=hh&&tail(hh,mm[2]); if(tt) return [tt+' — '+kind,'قاعدہ']; }
    return ['? '+l,'نامکمل'];
  }
  if(/^extending\s+downward$/i.test(l)) return ['نیچے کی طرف پھیلتا','قاعدہ'];
  if(/^extending\s+upward$/i.test(l))   return ['اوپر کی طرف پھیلتا','قاعدہ'];
  if((m=l.match(/^extending[,\s]+to\s+(.+)$/i))){ const h=TT(m[1]); return h?[obl(h)+' کی طرف پھیلتا','قاعدہ']:['? '+l,'نامکمل']; }
  // «X, دُم»
  if((m=l.match(/^(.+),\s*([a-z.]+)$/i))){
    const h=TT(m[1]); const t=h&&tail(h,m[2]); if(t) return [t,'قاعدہ'];
  }
  // «حرفِ جار + اسم» → «اسم + حرفِ اضافت»
  if((m=l.match(/^([a-z]+)\s+(.+)$/i)) && POST[m[1].toLowerCase()]){
    const h=TT(m[2]); if(h) return [obl(h)+' '+POST[m[1].toLowerCase()],'قاعدہ'];
  }
  // «X of» → «کا X»
  if((m=l.match(/^(.+)\s+of$/i))){ const h=TT(m[1]); if(h) return ['کا '+h,'قاعدہ']; }
  // «while X» → «X تے ہوئے»
  if((m=l.match(/^while\s+(.+)$/i))){ const h=TT(m[1]); if(h) return [cont(h),'قاعدہ']; }
  // مزید عام قاعدے (v99)
  if((m=l.match(/^(.+?),?\s*as if in(?: a| the)?\s+(.+)$/i))){ const a=TT(m[1]),b=TT(m[2]); if(a&&b) return [a+' — گویا '+b+' میں ہو','قاعدہ']; }
  if((m=l.match(/^as if in(?: a| the)?\s+(.+)$/i))){ const h=TT(m[1]); if(h) return ['گویا '+h+' میں ہو','قاعدہ']; }
  if((m=l.match(/^extending from\s+(.+?)\s+to\s+(.+)$/i))){ const a=TT(m[1]),b=TT(m[2]); if(a&&b) return [a+' سے '+obl(b)+' تک پھیلتا','قاعدہ']; }
  if((m=l.match(/^extending\s+(.+?)\s+to\s+(.+)$/i))){ const a=TT(m[1]),b=TT(m[2]); if(a&&b) return [a+' سے '+obl(b)+' تک پھیلتا','قاعدہ']; }
  if((m=l.match(/^(?:till|to)\s+(.+)$/i))){ const h=TT(m[1]); if(h) return [h+' تک','قاعدہ']; }
  if((m=l.match(/^(.+?),?\s*must$/i))||(m=l.match(/^must\s+(.+)$/i))){ const h=TT(m[1]); if(h) return [obl(h)+' پڑتا ہے','قاعدہ']; }
  if((m=l.match(/^(.+?),\s*compelled to$/i))){ const h=TT(m[1]); if(h) return [h+' پر مجبور','قاعدہ']; }
  if((m=l.match(/^using (?:the\s+)?(.+)$/i))){ const h=TT(m[1]); if(h) return [obl(h)+' استعمال کرنا','قاعدہ']; }
  if((m=l.match(/^(?:opening|closing) (?:the\s+)?(.+?),\s*on$/i))){ const h=TT(m[1]); if(h) return [obl(h)+(/^clos/i.test(l)?' بند':' کھولنے')+' کرنے پر','قاعدہ']; }
  if((m=l.match(/^turning (?:the\s+)?(.+?)\s+(up|upward|down|downward)$/i))){ const h=TT(m[1]); if(h) return [obl(h)+(/up/i.test(m[2])?' اوپر':' نیچے')+' گھمانا','قاعدہ']; }
  if((m=l.match(/^(.+?)\s+gradually$/i))){ const h=TT(m[1]); if(h) return ['رفتہ رفتہ '+h,'قاعدہ']; }
  if((m=l.match(/^over (?:the\s+)?whole\s+(.+)$/i))){ const h=TT(m[1]); if(h) return ['پورے '+obl(h)+' پر','قاعدہ']; }
  if((m=l.match(/^(.+?)\s+weather(?:,\s*in)?$/i))){ const h=TT(m[1]); if(h) return [h+' موسم','قاعدہ']; }
  if((m=l.match(/^waves of\s+(.+)$/i))){ const h=TT(m[1]); if(h) return [obl(h)+' کی لہریں','قاعدہ']; }
  // «alternating with X» · «(See Y)» · «loss of X» · «extending down/into/over X» · «until N»
  if((m=l.match(/^alternating with\s+(.+)$/i))){ const h=TT(m[1]); if(h) return ['باری باری '+obl(h)+' کے ساتھ','قاعدہ']; }   // 🔑 صارف: «باری باری» پہلے
  if((m=l.match(/^(.+?)\s*\((?:see|See)\s+(.+?)\)$/))){ const a=TT(m[1]), b=TT(m[2]); if(a&&b) return [a+' (دیکھیے '+b+')','قاعدہ']; if(a) return [a+' (دیکھیے '+m[2]+')','قاعدہ']; }
  if((m=l.match(/^loss of\s+(.+)$/i))){ const h=TT(m[1]); if(h) return [obl(h)+' کا ضیاع','قاعدہ']; }
  if((m=l.match(/^(.+),\s*loss of$/i))){ const h=TT(m[1]); if(h) return [obl(h)+' کا ضیاع','قاعدہ']; }
  if((m=l.match(/^extending\s+(?:down|downward)\s+(?:the\s+)?(.+)$/i))){ const h=TT(m[1]); if(h) return [obl(h)+' میں نیچے تک پھیلتا','قاعدہ']; }
  if((m=l.match(/^extending\s+(?:into|over)\s+(?:the\s+)?(.+)$/i))){ const h=TT(m[1]); if(h) return [obl(h)+' کے اندر پھیلتا','قاعدہ']; }
  if((m=l.match(/^until\s+(.+)$/i))){ const h=TT(m[1]); if(h) return [h+' تک','قاعدہ']; }
  if((m=l.match(/^(\d{1,2})\s*(?:to|until)\s*(\d{1,2})\s*(a\.m\.|p\.m\.)$/i))) { const c2=clock(m[1]+' '+m[3]), c3=clock(m[2]+' '+m[3]); if(c2&&c3) return [c2.replace(' بجے','')+' سے '+c3+' تک','وقت']; }
  if((m=l.match(/^of (?:the\s+)?(.+)$/i))){ const h=TT(m[1]); if(h) return ['کا '+h,'قاعدہ']; }
  if((m=l.match(/^heat of\s+(.+?),\s*with$/i))){ const h=TT(m[1]); if(h) return [obl(h)+' کی گرمی کے ساتھ','قاعدہ']; }
  if((m=l.match(/^(.+?)\s+of\s+(?:the\s+)?(.+)$/i))){ const a=TT(m[1]), b=TT(m[2]); if(a&&b) return [obl(b)+' کا '+a,'قاعدہ']; }
  if((m=l.match(/^suppression of\s+(.+)$/i))||(m=l.match(/^after suppression of\s+(.+)$/i))){ const h=TT(m[1]); if(h) return [obl(h)+' دب جانے سے','قاعدہ']; }
  if((m=l.match(/^(.+?),\s*compelled to$/i))){ const h=TT(m[1]); if(h) return [h+' پر مجبور','قاعدہ']; }
  if((m=l.match(/^(.+),\s*beginning to$/i))||(m=l.match(/^on beginning to\s*(.*)$/i))){ const h=m[1]?TT(m[1]):null; if(h) return [obl(h)+' شروع کرنے پر','قاعدہ']; }
  // «near X» / «between X and Y» / «X tastes» / «as from a X» / «abuse of X» / «X region» / «X muscles»
  if((m=l.match(/^near\s+(?:the\s+)?(.+)$/i))){ const h=TT(m[1]); if(h) return [obl(h)+' کے قریب','قاعدہ']; }
  if((m=l.match(/^between\s+(.+?)\s+and\s+(.+)$/i))){ const a=TT(m[1]),b=TT(m[2]); if(a&&b) return [a+' اور '+obl(b)+' کے درمیان','قاعدہ']; }
  if((m=l.match(/^(.+)\s+tastes$/i))){ const h=TT(m[1]); if(h) return [obl(h)+' کا ذائقہ','قاعدہ']; }
  if((m=l.match(/^(.+?),?\s*as (?:from|with|of)(?: a| an| the)?\s+(.+)$/i))){ const b=TT(m[2]); const a=TT(m[1]); if(a&&b) return [a+' — '+b+' جیسا','قاعدہ']; }
  if((m=l.match(/^as (?:from|with|of)(?: a| an| the)?\s+(.+)$/i))){ const h=TT(m[1]); if(h) return [h+' جیسا','قاعدہ']; }
  if((m=l.match(/^(?:abuse of|after abuse of)\s+(.+)$/i))){ const h=TT(m[1]); if(h) return [obl(h)+' کا زیادہ استعمال','قاعدہ']; }
  if((m=l.match(/^(.+),\s*abuse of$/i))){ const h=TT(m[1]); if(h) return [obl(h)+' کا زیادہ استعمال','قاعدہ']; }
  if((m=l.match(/^(.+)\s+region$/i))){ const h=TT(m[1]); if(h) return [obl(h)+' کا حصہ','قاعدہ']; }
  if((m=l.match(/^(.+)\s+muscles$/i))){ const h=TT(m[1]); if(h) return [obl(h)+' کے پٹھے','قاعدہ']; }
  if((m=l.match(/^(.+)\s+joints$/i))){ const h=TT(m[1]); if(h) return [obl(h)+' کے جوڑ','قاعدہ']; }
  if((m=l.match(/^(.+)\s+nails$/i))){ const h=TT(m[1]); if(h) return [obl(h)+' کے ناخن','قاعدہ']; }
  if((m=l.match(/^suppressed\s+(.+?),?\s*after$/i))){ const h=TT(m[1]); if(h) return [obl(h)+' دب جانے کے بعد','قاعدہ']; }
  if((m=l.match(/^every\s+(\w+)\s+days?$/i))){ const h=TT(m[1]); if(h) return ['ہر '+h+' دن بعد','قاعدہ']; }
  if((m=l.match(/^(.+),\s*while$/i))){ const h=TT(m[1]); if(h) return [cont(h),'قاعدہ']; }
  if((m=l.match(/^(.+),\s*on$/i))){ const h=TT(m[1]); if(h) return [obl(h)+' پر','قاعدہ']; }
  // «A, B» دونوں لغت میں
  if((m=l.match(/^(.+),\s*(.+)$/))){ const a=TT(m[1]), b=TT(m[2]); if(a&&b) return [a+' '+b,'قاعدہ']; }
  // دو الفاظ: صفت + اسم
  const p=l.split(/\s+/);
  if(p.length===2){ const a=TT(p[0]), b=TT(p[1]); if(a&&b) return [a+' '+b,'قاعدہ']; }
  return ['? '+l,'نامکمل'];
}
fs.readFileSync(process.argv[2],'utf8').split('\n').filter(Boolean).forEach(line=>{
  const [lab,n]=line.split('\t'); const [ur,how]=compose(lab);
  console.log([lab,n,ur,how].join('\t'));
});
