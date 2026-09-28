// v100: پورے ربرک کا اردو جملہ — کینٹ کو **دائیں سے بائیں** پڑھ کر (صارف کی تحقیق کے مطابق)
// Usage: node tools/rubric_ur.js kent mind 12
const fs=require('fs'),path=require('path');const R=path.resolve(__dirname,'..');
const L=JSON.parse(fs.readFileSync(R+'/ur/rubric_labels_ur.json','utf8')).labels;
const T=k=>L[String(k).trim().toLowerCase()]||null;
// دُم کے حرفِ اضافت جو پچھلے ٹکڑے سے جڑ جاتے ہیں
const TAILW=['on','in','from','after','before','during','while','when','with','to','agg.','amel.'];
function obl(u){ return /نا$/.test(u)?u.replace(/نا$/,'نے'):(/ہ$/.test(u)?u.replace(/ہ$/,'ے'):u); }
const GLUE={'on':'پر','in':'میں','from':'سے','after':'کے بعد','before':'سے پہلے','during':'کے دوران',
            'while':'کرتے ہوئے','when':'پر','with':'کے ساتھ','to':'تک','agg.':'سے بگاڑ','amel.':'سے آرام'};
function rubricUr(title){
  let segs=title.split(',').map(s=>s.trim()).filter(Boolean);
  // ۱) دُم کے الفاظ پچھلے ٹکڑے سے جوڑ دو  →  «waking, on» = «جاگنے پر»
  const out=[];
  for(let i=0;i<segs.length;i++){
    const cur=segs[i], nxt=segs[i+1];
    if(nxt && TAILW.indexOf(nxt.toLowerCase())!==-1){
      const whole=T(cur+', '+nxt);                 // پہلے پورا جوڑ لغت میں دیکھو
      if(whole){ out.push(whole); i++; continue; }
      const h=T(cur); if(h){ out.push(obl(h)+' '+GLUE[nxt.toLowerCase()]); i++; continue; }
    }
    out.push(T(cur)||('['+cur+']'));
  }
  // ۲) کینٹ کو دائیں سے بائیں پڑھو → ترتیب الٹ دو
  return out.reverse().join('، ');
}
if(require.main===module){
  const book=process.argv[2]||'kent', ch=process.argv[3]||'mind', n=+process.argv[4]||12;
  const dir=R+'/'+(book==='kent'?'kent_chapters/':book+'_chapters/');
  const d=JSON.parse(fs.readFileSync(dir+ch+'.json','utf8'));
  let shown=0;
  for(const v of Object.values(d)){
    const t=v.t||''; if(t.split(',').length<3) continue;
    const ur=rubricUr(t); if(/\[/.test(ur)) continue;
    console.log('  '+t.padEnd(52).substring(0,52)+' →  '+ur); if(++shown>=n) break;
  }
}
module.exports={rubricUr};
