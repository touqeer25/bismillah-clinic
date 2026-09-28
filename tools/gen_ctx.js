// v105: سیاق کی خودکار تیاری — «والد + بچہ» ملا کر
//   menses › during  →  «حیض کے دوران»   (اکیلا «کے دوران» مبہم تھا)
// Usage: node tools/gen_ctx.js kent 4000
const fs=require('fs'),path=require('path');const R=path.resolve(__dirname,'..');
const {JSDOM}=require(process.env.JSDOM_PATH||'/tmp/jsd/node_modules/jsdom');
const book=process.argv[2]||'kent', LIMIT=+process.argv[3]||4000;
const F=R+'/ur/rubric_labels_ur.json', L=JSON.parse(fs.readFileSync(F,'utf8'));
const lab=L.labels, ctx=L.ctx||(L.ctx={});

const TAIL={'after':'کے بعد','before':'سے پہلے','during':'کے دوران','while':'کرتے ہوئے','on':'پر','in':'میں',
            'from':'سے','when':'پر','with':'کے ساتھ','to':'تک','agg.':'سے بگاڑ','amel.':'سے آرام'};
const OBL_EX={'بایاں':'بائیں','دایاں':'دائیں','قے':'قے','ہوا':'ہوا'};
function obl(u){ if(OBL_EX[u])return OBL_EX[u];
  if(/(میں|پر|سے|کے ساتھ|کی طرف|کے بعد|کے دوران|تک)$/.test(u))return u;
  u=u.replace(/ کا /g,' کے ').replace(/(^| )والا( |$)/g,'$1والے$2').replace(/(^| )ہوا( |$)/g,'$1ہوئے$2')
     .replace(/(^| )تپتا( |$)/g,'$1تپتے$2').replace(/(^| )گرما( |$)/g,'$1گرمے$2');
  const w=u.split(' '); let last=w[w.length-1];
  if(/نا$/.test(last)) last=last.replace(/نا$/,'نے');
  else if(/ہ$/.test(last)) last=last.replace(/ہ$/,'ے');
  else if(/[^ی]ا$/.test(last)) last=last.replace(/ا$/,'ے');
  w[w.length-1]=last; return w.join(' '); }
const FRAGMENT=/^(کے |کی |کا |سے |پر |میں |تک |کو |جب |اور |یا )/;         // والد خود ادھورا ہو تو چھوڑ دو
const FUNC=new Set(['during','after','before','while','on','in','from','when','with','to','at','of','by',
                    'agg.','amel.','and','or','then','till','until','as','if','not','the','a','an']);
const isTimeUr=u=>/بجے$|^صبح$|^شام$|^رات$|^دوپہر$|^سہ پہر$|^آدھی رات$|^دن میں$|^دوپہر سے پہلے$/.test(u);
function cont(u){ return /نا$/.test(u)?u.replace(/نا$/,'تے ہوئے'):u+' کے دوران'; }

// بچے کی وہ شکلیں جو اکیلے مبہم ہیں
function childKind(c){
  const k=c.toLowerCase().trim();
  if(TAIL[k]) return {kind:'tail',w:k};
  let m=k.match(/^(agg\.|amel\.)$/); if(m) return {kind:'tail',w:m[1]};
  m=k.match(/^(while|on|in|during|from|when|with)\s+(agg\.|amel\.)$/); if(m) return {kind:'tail2',w:m[1],k2:m[2]};
  m=k.match(/^(.+),\s*(after|before|during|while|on|in|from|when|with)$/); if(m) return null;  // خود مکمل ہے
  return null;
}
const w=new JSDOM('<div id="repRubricContent"></div>',{runScripts:'dangerously',url:'http://localhost/'}).window;w.escapeHtml=s=>s;
w.eval(fs.readFileSync(R+'/js/repertory/LOAD_ORDER.txt','utf8').split(/\s+/).filter(Boolean).map(f=>fs.readFileSync(R+'/js/repertory/'+f,'utf8')).join('\n'));w.repCurrentBook=book;
const dir=R+'/'+w.REP_BOOK_INFO[book].chapDir, pair={};
for(const c of JSON.parse(fs.readFileSync(dir+'_index.json'))){
  const t=w.buildRubricTree(JSON.parse(fs.readFileSync(dir+c.key+'.json')));const rows=[];w.repTreeFlatten(t,[],'',0,rows,'');
  rows.forEach(r=>{ if(!r.labels||r.labels.length<2) return;
    const par=String(r.labels[r.labels.length-2]||'').replace(/ \[\d+\]$/,'').toLowerCase().trim();
    const me=String(r.label||'').replace(/ \[\d+\]$/,'').toLowerCase().trim();
    if(par&&me) { const k=par+'|'+me; pair[k]=(pair[k]||0)+1; } });
}
let made=0;
Object.entries(pair).sort((a,b)=>b[1]-a[1]).forEach(([k,n])=>{
  if(made>=LIMIT||ctx[k]) return;
  const [p,c]=k.split('|'); const ck=childKind(c); if(!ck) return;
  if(FUNC.has(p)||/,\s*(on|in|from|after|before|during|while|when|with)$/i.test(p)) return;   // والد خود ٹکڑا
  const pu=lab[p]; if(!pu||FRAGMENT.test(pu)) return;
  let out=null;
  if(ck.kind==='tail'){
    if(isTimeUr(pu)&&(ck.w==='agg.'||ck.w==='amel.')) out = pu+(ck.w==='agg.'?' کو بگاڑ':' کو آرام');
    else out = (ck.w==='while')?cont(pu):(obl(pu)+' '+TAIL[ck.w]);
  }
  else if(ck.kind==='tail2'){ const mid=(ck.w==='while')?cont(pu):(obl(pu)+' '+TAIL[ck.w]);
    out = mid+' '+(ck.k2==='agg.'?'— بگاڑ':'— آرام'); }
  if(out) out=out.replace(/\s+/g,' ').trim();
  if(out){ ctx[k]=out; made++; }
});
L.meta.ctx_count=Object.keys(ctx).length;
fs.writeFileSync(F, JSON.stringify(L,null,1));
console.log('نئے سیاق بنے: '+made+'   کل سیاق: '+L.meta.ctx_count);
Object.entries(ctx).slice(-14).forEach(([k,v])=>console.log('   '+k.replace('|',' › ').padEnd(40).substring(0,40)+' → '+v));
