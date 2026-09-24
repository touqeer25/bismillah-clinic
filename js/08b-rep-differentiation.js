// ==================== 🔬 REMEDY DIFFERENTIATION / EXTRACTION (v55) ====================
// «ریمیڈی بمقابلہ ریمیڈی ایکسٹریکشن» — ریڈار اوپس کے "کمپیئر ریمیڈیز" جیسا:
//   2 تا 5 ریمیڈیز چنیں → دائرے (کھلا باب / پوری کتاب / تمام کتابیں) کے وہ ربرکس جہاں یہ آپس میں مختلف ہیں۔
//   درجہ بندی: خصوصی (صرف ایک موجود) · جزوی (کچھ موجود) · گریڈ کا فرق (سب موجود، گریڈ الگ) · مشترک (سب برابر)۔
//   اسکور = گریڈ × مخصوصیت، مخصوصیت = 1 / log2(2 + N)  (N = ربرک کی کل ریمیڈیز) → چھوٹا ربرک + اونچا گریڈ اوپر۔
//   ایک ریمیڈی = کی نوٹس ایکسٹریکشن؛ ربرک موڈ = ربرک کی تمام ریمیڈیز کا ہم رشتہ ربرکس پر تقابل؛
//   کتابوں کی گواہی = اسی موضوع پر باقی کتابوں کی اندراجات۔  کینٹ ڈیٹا کو ہاتھ نہیں لگایا جاتا — یہ اوپر کی تہہ ہے۔
// یہ ماڈیول 08-app-repertory.js کے بعد لوڈ ہوتا ہے اور اس کے ہیلپرز (repLangText, escapeHtml, loadSingleBookData,
// repEnsureAllBooks, repClipToggle, navigateToRubric …) استعمال کرتا ہے۔ ماڈل ونڈو نیویگیشن ہسٹری سے آزاد ہے۔

var REP_DIFF_MAX_REMS=5;
var REP_DIFF_ROW_CAP=400;      // ہر سیکشن میں زیادہ سے زیادہ قطاریں (کارکردگی)
var REP_DIFF_FEAT_CAP=60;      // ربرک موڈ میں زیادہ سے زیادہ فیچر کالم
var repDiffOpts={scope:'book',maxN:60,minG:1,sort:'score',mode:'compare',onlySingle:0,topOnly:0};
var REP_EXTR_CAP=600;                 // ✅ v68.7: ایک دوا کی مکمل فہرست میں زیادہ سے زیادہ قطاریں
var REP_DIFF_SCAN_STOP=250000;        // ✅ v68.7: فہرست بھرتے وقت زیادہ سے زیادہ ربرکس چھانٹے جائیں (پوری کتاب آسانی سے، تمام کتابیں حد تک)
var repDiffCtx=null;           // {book,ch,rid,full,rems:{abbr:grade}} — ربرک کا سیاق (ڈیٹیل پیج سے) یا null
var repDiffSel=[];             // چنی ہوئی ریمیڈیز (abbr)
var repDiffTab='excl';         // 'excl'|'grade'|'partial'|'common'|'rubric'|'books'
var repDiffLast=null;          // آخری نتیجہ {res,list,all,scopeBook,ms}
var repDiffTheme='';           // کتابوں کی گواہی کے لیے موضوع کے الفاظ (قابلِ ترمیم)
var _repRemSizeCache={};       // book -> {abbr: rubric count}
var _repDiffBusy=false;

function repDiffOptsLoad(){ try{ var d=JSON.parse(localStorage.getItem('bc_rep_diff_opts')||'{}'); if(d.scope)repDiffOpts.scope=d.scope; if(d.maxN!=null)repDiffOpts.maxN=d.maxN; if(d.minG)repDiffOpts.minG=d.minG; if(d.sort)repDiffOpts.sort=d.sort; if(d.mode)repDiffOpts.mode=d.mode; if(d.onlySingle)repDiffOpts.onlySingle=d.onlySingle; if(d.topOnly)repDiffOpts.topOnly=d.topOnly; }catch(e){} }
function repDiffOptsSave(){ try{ localStorage.setItem('bc_rep_diff_opts',JSON.stringify(repDiffOpts)); }catch(e){} }
repDiffOptsLoad();

// ---------- ریاضی ----------
function repDiffSpec(N){ return 1/(Math.log(2+Math.max(0,N))/Math.LN2); }          // مخصوصیت
function repDiffNormSize(size){ return Math.log(Math.max(0,size)+10)/Math.LN10; }   // پولی کریسٹ اصلاح
function repDiffGrade(g){ g=g||0; return g>=3?3:(g===2?2:(g>0?1:0)); }
function repDiffFmt(x){ return (Math.round(x*100)/100).toFixed(2); }

// ---------- ڈیٹا ----------
// ریمیڈی کا سائز: کتاب میں کتنے ربرکس میں موجود ہے (ایک بار گن کر محفوظ)
function repDiffRemedySizes(book,data){
    if(_repRemSizeCache[book]) return _repRemSizeCache[book];
    var c={};
    if(data){ Object.keys(data).forEach(function(ch){ var cd=data[ch]||{}; Object.keys(cd).forEach(function(rid){ var r=cd[rid]&&cd[rid].r; if(!r)return; for(var a in r) c[a]=(c[a]||0)+1; }); }); }
    _repRemSizeCache[book]=c; return c;
}
// دائرے کے ربرکس کی فہرست: [{book,ch,rid,t,r}]
function repDiffRubricList(scope,book,ch,cb,opts){
    // ✅ v68.7 fix 3: «ربرک کا سائز ≤» کی شرط اب یہیں لگتی ہے، فہرست بھرتے وقت —
    //   بڑے ربرکس object ہی نہیں بنتے، اس لیے پوری کتاب/تمام کتابیں والی اسکین سستی ہو جاتی ہے۔
    var maxN=(opts&&opts.maxN&&opts.maxN>0)?opts.maxN:Infinity;
    var need=opts&&opts._rems;                      // صرف وہ ربرکس جن میں کم از کم ایک منتخب دوا ہو
    var rems=need?opts._rems:null;
    var stop=opts&&opts._stop?REP_DIFF_SCAN_STOP:Infinity, scanned=0, skipped=0;
    function flat(bk,d,onlyCh){
        var out=[]; if(!d)return out;
        var want=onlyCh?String(normalizeChapterKey(bk,onlyCh)).toLowerCase():null;
        Object.keys(d).forEach(function(c){
            if(want!==null){ var ck=String(normalizeChapterKey(bk,c)).toLowerCase(); if(ck!==want&&String(c).toLowerCase()!==String(onlyCh).toLowerCase())return; }
            if(out.length>=stop) return;
            var cd=d[c]||{};
            Object.keys(cd).forEach(function(rid){
                var v=cd[rid]; if(!v||!v.r)return;
                if(scanned>=stop)return; scanned++;
                var r=v.r, n=0, sel=0;
                for(var a in r){ n++; if(rems&&rems[a]) sel++; }
                if(rems&&!sel)return;                              // جن میں سے ایک منتخب دوا بھی نہ ہو (خالی «دیکھیں» ربرکس سمیت)، وہ فہرست میں نہیں آتی                              // جن میں سے ایک منتخب دوا بھی نہ ہو، وہ فہرست میں نہیں آتی (خالی «دیکھیں» ربرکس بھی)
                if(n>maxN){ skipped++; return; }      // چھوٹا ربرک پہلے، ویکٹر بعد میں
                out.push({book:bk,ch:c,rid:rid,t:v.t||'',r:v.r});
            });
        });
        out.skipped=skipped; out.scanned=scanned;
        return out;
    }
    if(scope==='all'){
        repEnsureAllBooks(function(all){
            var list=[]; Object.keys(all||{}).forEach(function(bk){ list=list.concat(flat(bk,all[bk],null)); });
            list.skipped=skipped; list.scanned=scanned;
            cb(list,all||{});
        });
        return;
    }
    loadSingleBookData(book,function(d){
        var all={}; all[book]=d;
        var list=flat(book,d,scope==='chapter'?ch:null); cb(list,all);
    });
}

// ---------- مرکزی حساب ----------
// R = ریمیڈیز؛ list = ربرکس؛ opts = {maxN,minG,sort}
function repDiffCompute(R,list,opts){
    var k=R.length, res={any:0,allPresent:0,commonEqual:0,excl:{},partial:[],grade:[],common:[],perRem:{},pair:{},cap:false};
    R.forEach(function(a){ res.excl[a]=[]; res.perRem[a]={inRubrics:0,excl:0,g3:0}; });
    var i,j;
    for(i=0;i<k;i++)for(j=i+1;j<k;j++)res.pair[R[i]+'|'+R[j]]={both:0,onlyA:0,onlyB:0};
    var maxN=(opts.maxN&&opts.maxN>0)?opts.maxN:Infinity, minG=opts.minG||1;
    list.forEach(function(x){
        var r=x.r, vec=new Array(k), present=0, first=-1, gmin=9, gmax=0, sum=0;
        for(i=0;i<k;i++){ var g=repDiffGrade(r[R[i]]); vec[i]=g; if(g){ present++; sum+=g; if(first<0)first=i; if(g<gmin)gmin=g; if(g>gmax)gmax=g; res.perRem[R[i]].inRubrics++; if(g===3)res.perRem[R[i]].g3++; } }
        if(!present) return;
        res.any++;
        var N=0; for(var a in r) N++;
        var spec=repDiffSpec(N);
        for(i=0;i<k;i++)for(j=i+1;j<k;j++){ var p=res.pair[R[i]+'|'+R[j]]; if(vec[i]&&vec[j])p.both++; else if(vec[i])p.onlyA++; else if(vec[j])p.onlyB++; }
        if(present===1){
            res.perRem[R[first]].excl++;
            if(vec[first]>=minG&&N<=maxN){ var L=res.excl[R[first]]; if(L.length<REP_DIFF_ROW_CAP*3) L.push({x:x,N:N,g:vec[first],vec:vec,score:vec[first]*spec}); else res.cap=true; }
        } else if(present<k){
            if(N<=maxN&&gmax>=minG){ if(res.partial.length<REP_DIFF_ROW_CAP*3) res.partial.push({x:x,N:N,g:gmax,vec:vec,score:sum*spec}); else res.cap=true; }
        } else {
            res.allPresent++;
            if(gmax>gmin){ if(N<=maxN&&res.grade.length<REP_DIFF_ROW_CAP*3) res.grade.push({x:x,N:N,g:gmax,vec:vec,score:(gmax-gmin)*spec}); }
            else { res.commonEqual++; if(N<=maxN&&res.common.length<REP_DIFF_ROW_CAP*3) res.common.push({x:x,N:N,g:gmax,vec:vec,score:gmax*spec}); }
        }
    });
    var cmp=(opts.sort==='grade')
        ? function(a,b){ return (b.g-a.g)||(a.N-b.N)||(b.score-a.score); }
        : function(a,b){ return (b.score-a.score)||(a.N-b.N)||(b.g-a.g); };
    R.forEach(function(a){ res.excl[a].sort(cmp); if(res.excl[a].length>REP_DIFF_ROW_CAP)res.excl[a]=res.excl[a].slice(0,REP_DIFF_ROW_CAP); });
    ['partial','grade','common'].forEach(function(key){ res[key].sort(cmp); if(res[key].length>REP_DIFF_ROW_CAP)res[key]=res[key].slice(0,REP_DIFF_ROW_CAP); });
    return res;
}

// ---------- ربرک موڈ: ربرک کی تمام ریمیڈیز کا ہم رشتہ ربرکس پر تقابل ----------
function _repDiffBaseTitle(t){ return String(t||'').replace(/\s*\((?:see|cmp\.?|comp\.?|cf\.?)[^)]*\)/gi,'').trim(); }
function _repDiffHead(t){ return _repDiffBaseTitle(String(t||'').split(',')[0]).toUpperCase(); }
// فیچر جھرمٹ: ذیلی ربرکس + «(See …)» کے اہداف (مع ان کے ذیلی ربرکس)
function repDiffClusterFor(ctx,bookData){
    var out=[]; if(!ctx||!bookData) return out;
    var d=bookData[ctx.ch]; if(!d){ var want=String(normalizeChapterKey(ctx.book,ctx.ch)).toLowerCase(); Object.keys(bookData).forEach(function(c){ if(String(normalizeChapterKey(ctx.book,c)).toLowerCase()===want) d=bookData[c]; }); }
    if(!d) return out;
    var main=d[ctx.rid]; var title=(main&&main.t)||ctx.full||''; var base=_repDiffBaseTitle(title);
    var S=(main&&main.r)||ctx.rems||{};
    var targets=repExtractSeeTargets(title).map(function(x){ return x.toUpperCase().replace(/\s+AND\s+/g,',').split(/[,;]/).map(function(s){return s.trim();}).filter(Boolean); });
    var tg=[]; targets.forEach(function(arr){ arr.forEach(function(s){ if(tg.indexOf(s)===-1)tg.push(s); }); });
    var seen={};
    Object.keys(d).forEach(function(rid){
        if(rid===ctx.rid) return;
        var v=d[rid]; if(!v||!v.r) return; var t=v.t||'';
        var kind='';
        if(t.indexOf(title+',')===0) kind='sub';
        else if(base&&t.indexOf(base+',')===0) kind='sub';
        else if(tg.length){ var head=_repDiffHead(t); for(var i=0;i<tg.length;i++){ if(head===tg[i]||head.indexOf(tg[i]+' ')===0){ kind='x'; break; } } }
        if(!kind) return;
        var shared=0; for(var a in v.r){ if(S[a])shared++; }
        if(!shared) return;
        var label=kind==='sub'?('⏱ '+t.substring(t.indexOf(',')+1).trim()):('↔ '+_repDiffBaseTitle(t));
        var key=kind+'|'+rid; if(seen[key])return; seen[key]=1;
        out.push({key:key,kind:kind,rid:rid,ch:ctx.ch,label:label,t:t,r:v.r,N:Object.keys(v.r).length,shared:shared});
    });
    out.sort(function(a,b){ return (a.shared-b.shared)||(a.N-b.N); });
    if(out.length>REP_DIFF_FEAT_CAP) out=out.slice(0,REP_DIFF_FEAT_CAP);
    return out;
}
function repDiffRubricMode(ctx,bookData,sizes){
    var feats=repDiffClusterFor(ctx,bookData);
    var d=bookData&&bookData[ctx.ch]; var main=d&&d[ctx.rid]; var S=(main&&main.r)||ctx.rems||{};
    var abbrs=Object.keys(S); var n=abbrs.length;
    var rareLimit=Math.max(2,Math.round(n*0.12));
    var rows=abbrs.map(function(a){
        var fs=[],score=0;
        feats.forEach(function(f){ var g=repDiffGrade(f.r[a]); if(!g)return; var spec=repDiffSpec(f.shared); score+=g*spec; fs.push({f:f,g:g,rare:f.shared<=rareLimit}); });
        var size=(sizes&&sizes[a])||0;
        return {abbr:a,g:repDiffGrade(S[a]),feats:fs,rawScore:score,score:score/repDiffNormSize(size),size:size,rare:fs.filter(function(x){return x.rare;})};
    });
    rows.sort(function(a,b){ return (b.g-a.g)||(b.score-a.score)||a.abbr.localeCompare(b.abbr); });
    return {feats:feats,rows:rows,n:n,rareLimit:rareLimit,title:(main&&main.t)||ctx.full||''};
}

// ---------- کتابوں کی گواہی ----------
var REP_THEME_SYN={"brooding": "brood, dwell, grievance, rumin, sorrow, silent, taciturn, sits, weep", "absent": "forgetful, memory, dreamy, abstract, distract, inattentive, absorbed, confus", "abstraction": "absent, dreamy, absorbed, thought, forgetful", "anger": "irritab, rage, violent, quarrel, contradict, vexation, passion", "anxiety": "anxious, fear, apprehens, restless, dread, uneasi", "company": "alone, solitude, company, strangers, society", "confusion": "confus, dull, stupid, bewilder, muddled, dazed", "consolation": "consol, sympathy, comfort, weep, grief", "delusion": "delusion, imagin, illusion, fancies, hallucin, thinks he", "despair": "despair, hopeless, despond, suicid, weary of life", "dullness": "dull, sluggish, stupid, slow, comprehend, think", "fear": "fear, fright, terror, dread, afraid, panic", "forgetful": "forget, memory, absent, remember", "grief": "grief, sorrow, weep, cry, consol, disappoint, mourn, sad", "hurry": "hurr, haste, hasty, impatien, rapid", "indifference": "indifferen, apath, listless, careless, no interest", "irritability": "irritab, cross, peevish, ill-humor, snappish, anger", "jealousy": "jealous, suspic, envy", "loquacity": "loquac, talkative, talks, chatter, garrulous", "memory": "memory, forget, remember, recollect", "mistakes": "mistake, wrong word, misplac, error, writing, speaking", "restlessness": "restless, uneasy, tossing, cannot keep still, agitat", "sadness": "sad, melanchol, depress, gloomy, weep, despond", "sensitive": "sensitiv, oversensitiv, noise, light, odor, touch, offended", "starting": "start, startled, jump, fright, noise", "suspicious": "suspic, distrust, mistrust, jealous", "talking": "talk, speech, loquac, silent, taciturn", "weeping": "weep, cry, tear, sob, laugh", "ailments": "effects of, after, from, ailments", "timidity": "timid, bashful, shy, cowardly, courage", "religious": "religio, pray, salvation, sin, conscience", "insanity": "insan, mania, madness, raving, delirium", "delirium": "delirium, raving, mutter, unconscious, stupor", "unconsciousness": "unconscious, stupor, coma, faint, insensib", "excitement": "excit, exalt, agitat, elated, nervous", "concentration": "concentrat, attention, think, apply, study", "thoughts": "thought, ideas, rush, vanish, persistent", "dwells": "dwell, brood, past, disagreeable, grievance, rumin", "weary": "weary, tired of life, loath, disgust, suicid", "sighing": "sigh, breath, sob, deep breath", "mood": "mood, changeable, alternat, humor, variable", "haughty": "haught, proud, arrogan, contempt, superior", "contemptuous": "contempt, scorn, disdain, haught", "lamenting": "lament, moan, groan, complain, wail", "shrieking": "shriek, scream, cry out, brain cry, screech", "violent": "violen, rage, strike, bite, destroy, fury", "obstinate": "obstina, headstrong, stubborn, contrar, self-will", "cheerful": "cheerful, gay, merry, happy, laugh, mirth", "laughing": "laugh, mirth, giggl, silly, alternat weep", "sympathetic": "sympath, compassion, affection, kind", "malicious": "malic, spiteful, cruel, revenge, wicked", "cursing": "curs, swear, abusive, profan", "kleptomania": "steal, theft, kleptoman", "death": "death, dying, die, dread of death", "home": "home, homesick, nostalgia, leave", "business": "business, affairs, indifferen, neglect, aversion to work", "work": "work, labor, aversion, industrious, occupation", "answers": "answer, question, reply, repeat, slowly, abrupt", "speech": "speech, stammer, talk, word, mutter, hasty", "gestures": "gesture, motion, picking, grasping, hands", "awkward": "awkward, drops, clumsy, stumble", "biting": "bit, gnaw, nails, spoon", "carried": "carried, wants to be, quiet, rock"};   // ربرک کے پہلے لفظ سے موضوع کے مترادفات (کتابوں کی گواہی + میٹیریا میڈیکا)
function repDiffThemeWordsFor(ctx){
    if(!ctx) return '';
    var t=ctx.full||''; var base=_repDiffBaseTitle(t).split(',')[0];
    var words=base.split(/[^A-Za-z]+/).filter(function(w){ return w.length>=4; });
    repExtractSeeTargets(t).forEach(function(x){ x.split(/[,;]|\band\b/i).forEach(function(w){ w=w.trim(); if(w.length>=4)words.push(w); }); });
    var STOP={mind:1,general:1,generals:1,symptom:1,symptoms:1,part:1,parts:1,side:1,with:1,from:1,during:1,after:1,before:1,while:1,when:1,which:1,than:1,that:1,this:1,other:1,things:1};
    var out=[]; words.forEach(function(w){ var orig=w.toLowerCase(); w=orig.replace(/(ness|ing|ed|es|s)$/,''); if(w.length<4&&orig.length>=5) w=orig.substring(0,Math.max(3,w.length)); if(w.length>=3&&out.indexOf(w)===-1&&!STOP[w])out.push(w); });
    var head=(out[0]||'').toLowerCase();
    Object.keys(REP_THEME_SYN).some(function(k){ if(head&&head.indexOf(k.substring(0,5))===0){ REP_THEME_SYN[k].split(',').forEach(function(w){ w=w.trim(); if(w&&out.indexOf(w)===-1)out.push(w); }); return true; } return false; });
    return out.join(', ');
}
function repDiffThemeRegex(words){
    var parts=String(words||'').split(/[,،]/).map(function(w){ return w.trim().toLowerCase(); }).filter(function(w){ return w.length>=3; });
    if(!parts.length) return null;
    return new RegExp(parts.map(function(w){ return w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }).join('|'),'i');
}
function repDiffBooksWitness(R,all,exceptBook,words){
    var re=repDiffThemeRegex(words); var out=[]; if(!re) return out;
    Object.keys(all||{}).forEach(function(bk){
        if(bk===exceptBook) return; var d=all[bk]; if(!d) return; var rows=[];
        Object.keys(d).forEach(function(c){ var cd=d[c]||{}; Object.keys(cd).forEach(function(rid){ var v=cd[rid]; if(!v||!v.r||!re.test(v.t||''))return;
            var vec=R.map(function(a){ return repDiffGrade(v.r[a]); }); var present=vec.filter(Boolean).length; if(!present)return;
            rows.push({book:bk,ch:c,rid:rid,t:v.t||'',N:Object.keys(v.r).length,vec:vec,present:present}); }); });
        rows.sort(function(a,b){ return (b.present-a.present)||(a.N-b.N); });
        if(rows.length) out.push({book:bk,rows:rows.slice(0,40),total:rows.length});
    });
    return out;
}

// ---------- کھولنا / بند کرنا ----------
function repDiffOpenForRubric(){
    var d=(typeof repCurrentDetail!=='undefined'&&repCurrentDetail)||{};
    var node=(typeof repDetailNode==='function')?repDetailNode():null;
    var rems=(node&&node.remedies)||{};
    if(!d.rid){ showToast(repLangText({ur:'یہ ربرک تفریق کے لیے دستیاب نہیں',en:'This rubric is not available for differentiation',roman:'Ye rubric tafreeq ke liye dastiyab nahi'})); return; }
    repDiffCtx={book:repCurrentBook,ch:repCurrentChapter,rid:String(d.rid),full:d.full||'',rems:rems};
    repDiffSel=[]; repDiffTheme=repDiffThemeWordsFor(repDiffCtx); repDiffLast=null;
    repDiffTab='rubric';
    repDiffShow(); repDiffRun();
}
function repDiffOpenWithRemedies(arr,ctx){
    var list=(arr||[]).map(function(a){ return String(a||'').trim().toLowerCase(); }).filter(Boolean).slice(0,REP_DIFF_MAX_REMS);
    if(ctx){ repDiffCtx=ctx; } else if(!repDiffCtx||repDiffCtx.book!==repCurrentBook){ repDiffCtx=null; }
    repDiffSel=list; repDiffLast=null; repDiffTheme=repDiffCtx?repDiffThemeWordsFor(repDiffCtx):'';
    repDiffTab=list.length===1?'excl':'excl';
    repDiffShow(); if(list.length) repDiffRun(); else repDiffRenderBody();
}
function repDiffShow(){
    var m=document.getElementById('repDiffModal');
    if(!m){
        m=document.createElement('div'); m.id='repDiffModal'; m.className='rep-diff-modal';
        m.innerHTML='<div class="rep-diff-back" onclick="repDiffClose()"></div><div class="rep-diff-win" role="dialog" aria-modal="true"><div id="repDiffHead"></div><div id="repDiffBody" class="rep-diff-body"></div></div>';
        document.body.appendChild(m);
        document.addEventListener('keydown',function(ev){ if(ev.key==='Escape'){ var mm=document.getElementById('repDiffModal'); if(mm&&mm.style.display!=='none'&&mm.style.display!=='') repDiffClose(); } });
    }
    m.style.display='block'; document.body.classList.add('rep-diff-open');
    repDiffRenderHead();
}
function repDiffClose(){ var m=document.getElementById('repDiffModal'); if(m)m.style.display='none'; document.body.classList.remove('rep-diff-open'); }
function repDiffIsOpen(){ var m=document.getElementById('repDiffModal'); return !!(m&&m.style.display==='block'); }

// ---------- ہیڈر: سیاق + ریمیڈی پکر + کنٹرولز + ٹیبز ----------
function repDiffScopeBook(){ return (repDiffCtx&&repDiffCtx.book)||repCurrentBook; }
function repDiffScopeCh(){ return (repDiffCtx&&repDiffCtx.ch)||repCurrentChapter; }
function repDiffRenderHead(){
    var el=document.getElementById('repDiffHead'); if(!el)return;
    var L=repLangText, bi=REP_BOOK_INFO[repDiffScopeBook()]||{abbr:'',name:''};
    var h='<div class="rep-diff-title"><b>🔬 '+L({ur:'تفریق / ایکسٹریکشن',en:'DIFFERENTIATION / EXTRACTION',roman:'TAFREEQ / EXTRACTION'})+'</b>'
        +'<span class="rep-diff-sub">'+L({ur:'ریمیڈیز چنیں → وہ ربرکس جہاں یہ آپس میں مختلف ہیں',en:'pick remedies → rubrics where they differ',roman:'remedies chunein → rubrics jahan ye mukhtalif hain'})+'</span>'
        +'<button class="rc-btn" onclick="repDiffClose()">✕ '+L({ur:'بند',en:'Close',roman:'Band'})+'</button></div>';
    // سیاق
    if(repDiffCtx){
        h+='<div class="rep-diff-ctx">'+repBookBadgeHtml(repDiffCtx.book)+' <span>'+escapeHtml(getChapterDisplayName(repDiffCtx.book,repDiffCtx.ch)||repDiffCtx.ch)+'</span> › <b dir="ltr">'+escapeHtml(repDiffCtx.full||'')+'</b>'
            +' <span class="cnt">('+Object.keys(repDiffCtx.rems||{}).length+' '+L({ur:'ادویات',en:'remedies',roman:'remedies'})+')</span>'
            +' <button class="rst-link" onclick="repDiffClearCtx()" title="'+L({ur:'ربرک کا سیاق ہٹائیں (صرف ریمیڈیز کا موازنہ)',en:'Drop rubric context (remedy-only comparison)',roman:'Rubric context hataein'})+'">✕</button></div>';
    }
    // ریمیڈی پکر
    h+='<div class="rep-diff-pick">';
    h+='<div class="rep-diff-sel">'+L({ur:'منتخب:',en:'Selected:',roman:'Selected:'})+' ';
    if(!repDiffSel.length) h+='<i class="rep-diff-hint">'+L({ur:'نیچے چپس پر کلک کریں یا مخفف لکھیں (زیادہ سے زیادہ 5)',en:'click chips below or type an abbreviation (max 5)',roman:'chips par click karein ya abbr likhein (max 5)'})+'</i>';
    repDiffSel.forEach(function(a){ h+='<span class="rep-diff-chip on" title="'+_repAttr(repRemedyTitle(a))+'"><b dir="ltr">'+escapeHtml(a)+'</b><button onclick="repDiffToggleRem(\''+_repJs(a)+'\')">✕</button></span>'; });
    h+='<span class="rep-diff-add"><input type="text" id="repDiffInput" list="repDiffRemList" placeholder="'+L({ur:'مخفف مثلاً nat-m',en:'abbr e.g. nat-m',roman:'abbr e.g. nat-m'})+'" onkeydown="if(event.key===\'Enter\'){repDiffAddTyped();}" dir="ltr"><button class="rc-btn" onclick="repDiffAddTyped()">＋</button></span>';
    h+='<datalist id="repDiffRemList">'+repDiffDatalistHtml()+'</datalist>';
    h+='</div>';
    if(repDiffCtx&&repDiffCtx.rems){
        var rems=repDiffCtx.rems, abbrs=Object.keys(rems); abbrs.sort(function(a,b){ return (repDiffGrade(rems[b])-repDiffGrade(rems[a]))||a.localeCompare(b); });
        h+='<div class="rep-diff-chips">';
        abbrs.forEach(function(a){ var g=repDiffGrade(rems[a]); var on=repDiffSel.indexOf(a)!==-1; h+='<span class="rep-remedy-tag g'+g+(on?' sel':'')+'" title="'+_repAttr(repRemedyTitle(a))+'" onclick="repDiffToggleRem(\''+_repJs(a)+'\')">'+(on?'✓ ':'')+escapeHtml(a)+'</span>'; });
        h+='</div>';
    }
    h+='</div>';
    // کنٹرولز
    var o=repDiffOpts;
    h+='<div class="rep-diff-ctl">'
        +'<label title="'+L({ur:'موازنہ = دوائیں آپس میں مختلف جگہیں؛ نکالنا = ایک دوا کی اپنی مکمل فہرست',en:'compare = where the remedies differ; extract = the full page list of one remedy',roman:'muwazna / nikalna'})+'">🧭 '+L({ur:'طریقہ',en:'Mode',roman:'Tareeqa'})+' <select onchange="repDiffSetOpt(\'mode\',this.value)">'
        +'<option value="compare"'+(o.mode!=='extract'?' selected':'')+'>'+L({ur:'دوائوں کا موازنہ',en:'Compare remedies',roman:'Muwazna'})+'</option>'
        +'<option value="extract"'+(o.mode==='extract'?' selected':'')+'>'+L({ur:'ایک دوا کی فہرست نکالنا',en:'Extract one remedy',roman:'Ek dawa ki fehrist'})+'</option></select></label>'
        +'<label>📚 '+L({ur:'دائرہ',en:'Scope',roman:'Scope'})+' <select onchange="repDiffSetOpt(\'scope\',this.value)">'
        +'<option value="chapter"'+(o.scope==='chapter'?' selected':'')+'>'+L({ur:'کھلا باب',en:'Open chapter',roman:'Khula baab'})+' ('+escapeHtml(getChapterDisplayName(repDiffScopeBook(),repDiffScopeCh())||repDiffScopeCh()||'')+')</option>'
        +'<option value="book"'+(o.scope==='book'?' selected':'')+'>'+L({ur:'پوری کتاب',en:'Whole book',roman:'Poori kitab'})+' ('+escapeHtml(bi.abbr)+')</option>'
        +'<option value="all"'+(o.scope==='all'?' selected':'')+'>'+L({ur:'تمام کتابیں',en:'All books',roman:'Tamam kitabein'})+' ('+Object.keys(REP_BOOK_INFO).length+')</option></select></label>'
        +'<label title="'+L({ur:'اس سے بڑے ربرکس اسکین ہی نہیں ہوتے (یہی اصل رفتار کا فرق ہے)',en:'larger rubrics are never scanned — this is where the speed comes from',roman:'barhe rubrics scan hi nahi hote'})+'">📏 '+L({ur:'ربرک کا سائز ≤',en:'Rubric size ≤',roman:'Rubric size ≤'})+' <select onchange="repDiffSetOpt(\'maxN\',parseInt(this.value,10))">'
        +[10,30,60,100,200,0].map(function(n){ return '<option value="'+n+'"'+(o.maxN===n?' selected':'')+'>'+(n?n:L({ur:'سب',en:'all',roman:'sab'}))+'</option>'; }).join('')+'</select></label>'
        +'<label>⭐ '+L({ur:'کم از کم گریڈ',en:'Min grade',roman:'Min grade'})+' <select onchange="repDiffSetOpt(\'minG\',parseInt(this.value,10))">'
        +[1,2,3].map(function(g){ return '<option value="'+g+'"'+(o.minG===g?' selected':'')+'>'+g+'</option>'; }).join('')+'</select></label>'
        +'<label>↕ '+L({ur:'ترتیب',en:'Sort',roman:'Sort'})+' <select onchange="repDiffSetOpt(\'sort\',this.value)">'
        +'<option value="score"'+(o.sort==='score'?' selected':'')+'>'+L({ur:'اسکور (گریڈ × مخصوصیت)',en:'score (grade × specificity)',roman:'score'})+'</option>'
        +'<option value="grade"'+(o.sort==='grade'?' selected':'')+'>'+L({ur:'پہلے گریڈ، پھر چھوٹا ربرک',en:'grade first, then smallest rubric',roman:'grade pehle, phir chhota rubric'})+'</option></select></label>'
        +'<button class="rc-btn primary" onclick="repDiffRun()">▶ '+L({ur:'چلائیں',en:'Run',roman:'Chalayein'})+'</button>'
        +'<button class="rc-btn" onclick="repDiffCopy()" title="'+L({ur:'نتیجہ متن کی شکل میں کاپی',en:'Copy result as text',roman:'Nateeja copy'})+'">📋</button>'
        +(repDiffLast&&repDiffLast.extract?'<button class="rc-btn primary" onclick="repDiffTakeAll()" title="'+L({ur:'تمام قطاریں فعال کلپ بورڈ میں ڈال دیں',en:'Put every row into the active clipboard',roman:'Sab qatarein clipboard mein'})+'">📥 '+L({ur:'سب کلپ بورڈ میں',en:'Take all',roman:'Sab clipboard mein'})+'</button>':'')
        +'</div>';
    // ٹیبز
    var res=repDiffLast&&repDiffLast.res, k=repDiffSel.length, o=o||repDiffOpts;
    function tab(id,lab,n){ return '<button class="'+(repDiffTab===id?'on':'')+'" onclick="repDiffSetTab(\''+id+'\')">'+lab+(n!=null?' <span class="cnt">'+n+'</span>':'')+'</button>'; }
    h+='<div class="rep-diff-tabs">';
    if(k===1&&o.mode==='extract') h+=tab('excl','🧲 '+L({ur:'نکالی ہوئی مکمل فہرست',en:'Extracted list',roman:'Extraction'}),repDiffLast&&repDiffLast.extract?repDiffLast.extract.rows.length:null);
    else if(k===1) h+=tab('excl','🔑 '+L({ur:'کی نوٹس (اس ریمیڈی کے ربرکس)',en:'Keynotes (rubrics of this remedy)',roman:'Keynotes'}),res?res.any:(repDiffLast&&repDiffLast.extract?repDiffLast.extract.k1:null));
    else { h+=tab('excl','🎯 '+L({ur:'خصوصی',en:'Exclusive',roman:'Khususi'}),res?Object.keys(res.excl).reduce(function(s,a){return s+res.perRem[a].excl;},0):null);
           h+=tab('grade','📶 '+L({ur:'گریڈ کا فرق',en:'Grade difference',roman:'Grade ka farq'}),res?res.grade.length:null);
           h+=tab('partial','◐ '+L({ur:'جزوی',en:'Partial',roman:'Juzvi'}),res?res.partial.length:null);
           h+=tab('common','≡ '+L({ur:'مشترک',en:'Common',roman:'Mushtarak'}),res?res.commonEqual:null); }
    if(repDiffCtx) h+=tab('rubric','🧮 '+L({ur:'ربرک کی ریمیڈیز کا تقابل',en:'Rubric remedies compared',roman:'Rubric ki remedies ka taqabul'}),null);
    h+=tab('books','📚 '+L({ur:'کتابوں کی گواہی',en:'Books witness',roman:'Kitabon ki gawahi'}),null);
    if(typeof repDiffMMTabHtml==='function') h+=tab('mm','📖 '+L({ur:'میٹیریا میڈیکا',en:'Materia medica',roman:'Materia medica'}),null);
    h+='</div>';
    el.innerHTML=h;
}
function repDiffDatalistHtml(){
    var names=(typeof _repRemedyNames!=='undefined'&&_repRemedyNames)||null; var out='';
    if(names){ Object.keys(names).slice(0,900).forEach(function(a){ out+='<option value="'+_repAttr(a)+'">'+escapeHtml(names[a])+'</option>'; }); }
    else if(repDiffCtx&&repDiffCtx.rems){ Object.keys(repDiffCtx.rems).forEach(function(a){ out+='<option value="'+_repAttr(a)+'"></option>'; }); }
    return out;
}
function repDiffClearCtx(){ repDiffCtx=null; repDiffTheme=''; if(repDiffTab==='rubric')repDiffTab='excl'; repDiffLast=null; repDiffRenderHead(); if(repDiffSel.length)repDiffRun(); else repDiffRenderBody(); }
function repDiffToggleRem(a){
    a=String(a||'').toLowerCase(); if(!a)return;
    var i=repDiffSel.indexOf(a);
    if(i!==-1) repDiffSel.splice(i,1);
    else { if(repDiffSel.length>=REP_DIFF_MAX_REMS){ showToast(repLangText({ur:'زیادہ سے زیادہ '+REP_DIFF_MAX_REMS+' ریمیڈیز',en:'Maximum '+REP_DIFF_MAX_REMS+' remedies',roman:'Max '+REP_DIFF_MAX_REMS+' remedies'})); return; } repDiffSel.push(a); }
    if(repDiffTab==='rubric'&&repDiffSel.length) repDiffTab='excl';
    repDiffLast=null; repDiffRenderHead();
    if(repDiffSel.length) repDiffRun(); else repDiffRenderBody();
}
function repDiffAddTyped(){
    var inp=document.getElementById('repDiffInput'); if(!inp)return; var v=String(inp.value||'').trim().toLowerCase(); if(!v)return;
    inp.value=''; repDiffToggleRem(v);
}
function repDiffSetOpt(k,v){ var old=repDiffOpts[k]; repDiffOpts[k]=v; repDiffOptsSave(); repDiffLast=null; repDiffRenderHead();
    if(k==='mode'){ if(repDiffSel.length||repDiffTab==='rubric'||repDiffTab==='books') repDiffRun(); return; }
    if(repDiffSel.length||repDiffTab==='rubric'||repDiffTab==='books') repDiffRun(); }
function repDiffSetTab(t){
    repDiffTab=t; repDiffRenderHead();
    var loaded=repDiffLast?Object.keys(repDiffLast.all||{}).length:0;
    if(t==='mm'){ repDiffRenderBody(); return; }                 // میٹیریا میڈیکا: اپنا ڈیٹا خود لوڈ کرتا ہے
    if(t==='books'&&loaded<2){ repDiffRun(); return; }          // کتابوں کی گواہی: باقی کتابیں خودکار لوڈ
    if(!repDiffLast&&(t==='rubric'||t==='books')){ repDiffRun(); return; }
    repDiffRenderBody();
}

// ---------- چلانا ----------
function repDiffRun(){
    var body=document.getElementById('repDiffBody'); if(!body)return;
    var L=repLangText;
    if(!repDiffSel.length&&repDiffTab!=='rubric'&&repDiffTab!=='books'&&repDiffTab!=='mm'){ repDiffRenderBody(); return; }
    if(_repDiffBusy) return; _repDiffBusy=true;
    body.innerHTML='<div class="rep-tool-loading">⏳ '+L({ur:'ڈیٹا لوڈ اور حساب ہو رہا ہے…',en:'Loading data and computing…',roman:'Data load aur hisaab…'})+'</div>';
    var scope=repDiffOpts.scope, book=repDiffScopeBook(), ch=repDiffScopeCh();
    var needAll=(scope==='all')||repDiffTab==='books';
    var t0=Date.now();
    var opt=Object.assign({},repDiffOpts);
    if(repDiffSel.length){ var m={}; repDiffSel.forEach(function(a){ m[a]=1; }); opt._rems=m; }
    opt._stop=true;                              // ✅ v68.7: لمبی اسکین پر جلدی رکنا
    var go=function(list,all){
        var scopeData=all[book]||null;
        var sizes=repDiffRemedySizes(book,scopeData);
        var single=(repDiffOpts.mode==='extract'&&repDiffSel.length===1);
        var extr=single?repDiffExtract(repDiffSel[0],list,repDiffOpts,sizes):null;
        var res=(single||!repDiffSel.length)?null:repDiffCompute(repDiffSel,list,repDiffOpts);
        repDiffLast={res:res,extract:extr,list:list,all:all,sizes:sizes,scopeBook:book,scope:scope,ms:Date.now()-t0,n:list.length,skipped:list.skipped||0,scanned:list.scanned||0};
        _repDiffBusy=false;
        repDiffRenderHead(); repDiffRenderBody();
    };
    if(needAll){
        repEnsureAllBooks(function(all){
            all=all||{};
            if(scope==='all'){ repDiffRubricList('all',book,ch,function(list,a2){ go(list,all); },opt); }
            else { repDiffRubricList(scope,book,ch,function(list,a2){ Object.keys(a2||{}).forEach(function(bk){ if(!all[bk])all[bk]=a2[bk]; }); go(list,all); },opt); }
        });
    } else {
        repDiffRubricList(scope,book,ch,function(list,all){ go(list,all||{}); },opt);
    }
}

// ---------- باڈی ----------
function repDiffInCaseSet(){ var s={}; for(var ci=0;ci<REP_N_CLIPS;ci++)(repClipboards[ci]||[]).forEach(function(it){ s[it.book+'|'+String(it.rid)]=ci+1; }); return s; }
function repDiffDots(vec,R){ var h=''; for(var i=0;i<vec.length;i++){ var g=vec[i]; h+='<span class="rep-diff-dot'+(g?' d'+g:' d0')+'" title="'+_repAttr(R[i]+' = '+(g||0))+'">'+(g||'·')+'</span>'; } return h; }
function repDiffRowHtml(row,R,inCase,showBook){
    var x=row.x, key=x.book+'|'+x.rid, inC=inCase[key];
    var chName=getChapterDisplayName(x.book,x.ch)||x.ch;
    var h='<div class="rep-diff-row">'
        +'<button class="rpc-chk sr'+(repClipFind(repActiveClip,x.book,x.rid)!==-1?' on':'')+'" title="'+repLangText({ur:'فعال کلپ بورڈ میں شامل/خارج',en:'Add to / remove from active clipboard',roman:'Active clipboard mein shamil/kharij'})+'" onclick="repDiffClipToggle(this,\''+_repJs(x.book)+'\',\''+_repJs(x.ch)+'\',\''+_repJs(x.rid)+'\',\''+_repJs(x.t)+'\','+row.N+')">'+(repClipFind(repActiveClip,x.book,x.rid)!==-1?'✓':'')+'</button>'
        +(showBook?repBookBadgeHtml(x.book)+' ':'')
        +'<span class="rep-diff-ch">'+escapeHtml(chName)+' ›</span> '
        +'<span class="rep-diff-t" dir="ltr" onclick="repDiffGo(\''+_repJs(x.book)+'\',\''+_repJs(x.ch)+'\',\''+_repJs(x.rid)+'\')">'+escapeHtml(x.t)+'</span>'
        +'<span class="rep-diff-n" title="'+repLangText({ur:'ربرک کی کل ریمیڈیز',en:'remedies in rubric',roman:'rubric ki kul remedies'})+'">'+row.N+'</span>'
        +'<span class="rep-diff-vec">'+repDiffDots(row.vec,R)+'</span>'
        +'<span class="rep-diff-score" title="'+repLangText({ur:'اسکور',en:'score',roman:'score'})+'">'+repDiffFmt(row.score)+'</span>'
        +(inC?'<span class="rep-diff-incase" title="'+repLangText({ur:'کیس میں موجود — کلپ بورڈ '+inC,en:'Already in case — clipboard '+inC,roman:'Case mein mojood — clipboard '+inC})+'">📋'+inC+'</span>':'')
        +'</div>';
    return h;
}
function repDiffRenderBody(){
    var body=document.getElementById('repDiffBody'); if(!body)return;
    var L=repLangText, last=repDiffLast, R=repDiffSel.slice();
    if(repDiffTab==='mm'&&typeof repDiffMMTabHtml==='function'){ body.innerHTML=repDiffMMTabHtml(last); body.scrollTop=0; return; }
    if(last&&last.extract&&repDiffTab==='excl'){ repDiffRenderExtr(last); return; }
    if(!R.length&&repDiffTab!=='rubric'&&repDiffTab!=='books'){
        body.innerHTML='<div class="rep-tool-loading">'+L({ur:'اوپر 1 تا 5 ریمیڈیز چنیں — ایک ریمیڈی = اس کے کی نوٹس ربرکس؛ 2 تا 5 = آپس کا فرق',en:'Pick 1–5 remedies above — one remedy = its keynote rubrics; 2–5 = their differences',roman:'Ooper 1–5 remedies chunein'})+'</div>';
        return;
    }
    if(!last){ body.innerHTML='<div class="rep-tool-loading">⏳</div>'; return; }
    var res=last.res, inCase=repDiffInCaseSet(), showBook=(last.scope==='all'), h='';
    // خلاصہ پٹی
    if(res){
        h+='<div class="rep-diff-sum">';
        h+='<span>'+L({ur:'دائرہ:',en:'Scope:',roman:'Scope:'})+' <b>'+last.n.toLocaleString()+'</b> '+L({ur:'ربرکس',en:'rubrics',roman:'rubrics'})+'</span>';
        h+='<span>'+L({ur:'کسی ایک میں:',en:'Any present:',roman:'Any present:'})+' <b>'+res.any.toLocaleString()+'</b></span>';
        if(R.length>1) h+='<span>'+L({ur:'سب موجود:',en:'All present:',roman:'All present:'})+' <b>'+res.allPresent.toLocaleString()+'</b> ('+L({ur:'برابر گریڈ',en:'equal grades',roman:'barabar grade'})+' '+res.commonEqual.toLocaleString()+')</span>';
        R.forEach(function(a){ var p=res.perRem[a]; h+='<span class="rep-diff-remsum"><b dir="ltr">'+escapeHtml(a)+'</b> '+L({ur:'موجود',en:'in',roman:'in'})+' '+(((last.sizes&&last.sizes[a])||0)||p.inRubrics).toLocaleString()+(R.length>1?' · '+L({ur:'خصوصی',en:'exclusive',roman:'exclusive'})+' <b>'+p.excl.toLocaleString()+'</b>':'')+' · '+L({ur:'گریڈ 3',en:'grade 3',roman:'grade 3'})+' '+p.g3+' · '+L({ur:'سائز',en:'size',roman:'size'})+' '+((last.sizes&&last.sizes[a])||0).toLocaleString()+'</span>'; });
        h+='<span class="rep-diff-ms">'+last.ms+' ms</span>';
        h+='</div>';
        if(last.skipped) h+='<div class="rep-diff-note">'+L({ur:last.skipped.toLocaleString()+' بڑے ربرکس سائز کی حد سے باہر رکھے گئے (گنتیاں پوری کتاب سے ہیں)',en:last.skipped.toLocaleString()+' large rubrics skipped by the size cap (counts are book-wide)',roman:'barhe rubrics bahar'})+'</div>';
        if(R.length>1){
            h+='<div class="rep-diff-pairs">';
            Object.keys(res.pair).forEach(function(k){ var p=res.pair[k], ab=k.split('|'); h+='<span title="'+L({ur:'صرف پہلی / صرف دوسری / دونوں',en:'only first / only second / both',roman:'sirf pehli / sirf doosri / dono'})+'"><b dir="ltr">'+escapeHtml(ab[0])+'</b> ⇄ <b dir="ltr">'+escapeHtml(ab[1])+'</b>: '+p.onlyA+' / '+p.onlyB+' / '+p.both+'</span>'; });
            h+='</div>';
        }
        if(res.cap) h+='<div class="rep-tool-note">⚠ '+L({ur:'فہرستیں بہت لمبی تھیں — سائز/گریڈ فلٹر سخت کریں',en:'Lists were very long — tighten size/grade filters',roman:'Lists lambi thin — filter sakht karein'})+'</div>';
    }
    var t=repDiffTab;
    if(t==='excl'&&res){
        if(R.length===1){
            var a0=R[0], L0=res.excl[a0];
            h+='<div class="rep-diff-sec"><div class="rep-diff-sechead">🔑 <b dir="ltr">'+escapeHtml(a0)+'</b> — '+escapeHtml(repRemedyTitle(a0))+' · '+L({ur:'ربرکس (فلٹر کے بعد)',en:'rubrics (after filters)',roman:'rubrics (filter ke baad)'})+' '+L0.length+'</div>';
            h+=L0.length?L0.map(function(r){ return repDiffRowHtml(r,R,inCase,showBook); }).join(''):'<div class="rep-tool-note">'+L({ur:'فلٹر میں کچھ نہیں — سائز بڑھائیں یا گریڈ کم کریں',en:'Nothing within filters — raise size or lower grade',roman:'Filter mein kuch nahi'})+'</div>';
            h+='</div>';
        } else {
            h+='<p class="rep-tool-sub">'+L({ur:'خصوصی = صرف یہی ریمیڈی موجود، باقی چنی ہوئی غائب۔ چھوٹا ربرک + اونچا گریڈ = مضبوط تفریق۔ ☑ سے ربرک کیس میں شامل، متن پر کلک = ربرک کھولیں۔',en:'Exclusive = only this remedy present, the other chosen ones absent. Small rubric + high grade = strong differentiation. ☑ adds the rubric to the case, click the text to open it.',roman:'Exclusive = sirf yehi remedy mojood. ☑ = case mein shamil.'})+'</p>';
            h+='<div class="rep-diff-cols">';
            R.forEach(function(a){
                var Lx=res.excl[a];
                h+='<div class="rep-diff-col"><div class="rep-diff-colhead"><b dir="ltr">'+escapeHtml(a)+'</b> <small>'+escapeHtml(repRemedyTitle(a).replace(/^.*= /,''))+'</small><span class="cnt">'+res.perRem[a].excl.toLocaleString()+' · '+L({ur:'دکھائے',en:'shown',roman:'shown'})+' '+Lx.length+'</span></div>';
                h+=Lx.length?Lx.map(function(r){ return repDiffRowHtml(r,R,inCase,showBook); }).join(''):'<div class="rep-tool-note">—</div>';
                h+='</div>';
            });
            h+='</div>';
        }
    } else if(t==='grade'&&res){
        h+='<p class="rep-tool-sub">'+L({ur:'سب چنی ہوئی ریمیڈیز موجود، مگر گریڈ الگ — شدت کا فرق۔ ترتیب: بڑا فرق + چھوٹا ربرک پہلے۔',en:'All chosen remedies present but with different grades — a difference of intensity. Larger gap + smaller rubric first.',roman:'Sab mojood, grade alag.'})+'</p>';
        h+='<div class="rep-diff-legend">'+R.map(function(a,i){ return '<span>'+(i+1)+' = <b dir="ltr">'+escapeHtml(a)+'</b></span>'; }).join('')+'</div>';
        h+=res.grade.length?res.grade.map(function(r){ return repDiffRowHtml(r,R,inCase,showBook); }).join(''):'<div class="rep-tool-note">—</div>';
    } else if(t==='partial'&&res){
        h+='<p class="rep-tool-sub">'+L({ur:'کچھ چنی ہوئی ریمیڈیز موجود، کچھ غائب (· = غائب)۔',en:'Some chosen remedies present, some absent (· = absent).',roman:'Kuch mojood, kuch ghaib.'})+'</p>';
        h+='<div class="rep-diff-legend">'+R.map(function(a,i){ return '<span>'+(i+1)+' = <b dir="ltr">'+escapeHtml(a)+'</b></span>'; }).join('')+'</div>';
        h+=res.partial.length?res.partial.map(function(r){ return repDiffRowHtml(r,R,inCase,showBook); }).join(''):'<div class="rep-tool-note">—</div>';
    } else if(t==='common'&&res){
        h+='<p class="rep-tool-sub">'+L({ur:'سب موجود، گریڈ برابر — فیصلے کے لیے بیکار، مگر یہ ان کا مشترکہ خاکہ ہے۔',en:'All present with equal grades — useless for deciding, but this is their shared picture.',roman:'Sab mojood, barabar grade.'})+'</p>';
        h+=res.common.length?res.common.map(function(r){ return repDiffRowHtml(r,R,inCase,showBook); }).join(''):'<div class="rep-tool-note">—</div>';
    } else if(t==='rubric'){
        h+=repDiffRubricTabHtml(last,inCase);
    } else if(t==='books'){
        h+=repDiffBooksTabHtml(last,inCase);
    } else if(t==='mm'&&typeof repDiffMMTabHtml==='function'){
        h+=repDiffMMTabHtml(last);
    }
    body.innerHTML=h; body.scrollTop=0;
}
// ربرک موڈ ٹیب
function repDiffRubricTabHtml(last,inCase){
    var L=repLangText; if(!repDiffCtx) return '<div class="rep-tool-loading">'+L({ur:'ربرک کا سیاق نہیں — ربرک کے صفحے سے 🔬 کھولیں',en:'No rubric context — open 🔬 from a rubric page',roman:'Rubric context nahi'})+'</div>';
    var bookData=last.all[repDiffCtx.book]; if(!bookData) return '<div class="rep-tool-loading">—</div>';
    var rm=repDiffRubricMode(repDiffCtx,bookData,repDiffRemedySizes(repDiffCtx.book,bookData));
    var h='<p class="rep-tool-sub">'+L({ur:'ربرک کی ہر ریمیڈی کا اس کے ذیلی ربرکس اور «(See …)» والے ہم رشتہ ربرکس پر پروفائل۔ کالم نایاب سے عام کی طرف (بریکٹ = ربرک کی کتنی ریمیڈیز اس فیچر میں بھی ہیں)۔ ⭐ = نایاب فیچر (≤ '+rm.rareLimit+')۔ اسکور = Σ گریڈ × مخصوصیت ÷ ریمیڈی کا سائز۔ ☐ سے 2 تا 5 ریمیڈیز چن کر «خصوصی» ٹیب دیکھیں۔',en:'Profile of every remedy of this rubric over its sub-rubrics and "(See …)" related rubrics. Columns from rare to common (bracket = how many of the rubric\'s remedies share the feature). ⭐ = rare feature (≤ '+rm.rareLimit+'). Score = Σ grade × specificity ÷ remedy size. Tick ☐ to pick 2–5 remedies for the Exclusive tab.',roman:'Har remedy ka profile; ⭐ = nayab feature.'})+'</p>';
    if(!rm.feats.length) return h+'<div class="rep-tool-note">'+L({ur:'اس ربرک کے ذیلی یا ہم رشتہ ربرکس نہیں ملے — «خصوصی» ٹیب استعمال کریں۔',en:'No sub-rubrics or related rubrics found for this rubric — use the Exclusive tab.',roman:'Zeli/ham-rishta rubrics nahi mile.'})+'</div>';
    h+='<div class="rep-diff-sum"><span>'+L({ur:'ریمیڈیز:',en:'Remedies:',roman:'Remedies:'})+' <b>'+rm.n+'</b></span><span>'+L({ur:'فیچرز:',en:'Features:',roman:'Features:'})+' <b>'+rm.feats.length+'</b> ('+rm.feats.filter(function(f){return f.kind==='sub';}).length+' '+L({ur:'ذیلی',en:'sub',roman:'zeli'})+' + '+rm.feats.filter(function(f){return f.kind==='x';}).length+' ↔)</span>'
        +'<span>'+L({ur:'بغیر کسی فیچر کے:',en:'Without any feature:',roman:'Bila feature:'})+' <b>'+rm.rows.filter(function(r){return !r.feats.length;}).length+'</b> — '+L({ur:'ان کے لیے میٹیریا میڈیکا لازم',en:'materia medica needed for these',roman:'in ke liye MM lazim'})+'</span></div>';
    h+='<div class="rep-diff-tblwrap"><table class="rep-diff-tbl"><thead><tr><th class="st">☐</th><th class="st">'+L({ur:'ریمیڈی',en:'Remedy',roman:'Remedy'})+'</th><th title="'+L({ur:'اس ربرک میں گریڈ',en:'grade in this rubric',roman:'is rubric mein grade'})+'">G</th><th title="'+L({ur:'اسکور',en:'score',roman:'score'})+'">Σ</th><th>'+L({ur:'نایاب فیچرز',en:'Rare features',roman:'Nayab features'})+'</th>';
    rm.feats.forEach(function(f){ h+='<th class="ft" title="'+_repAttr(f.t+' — '+f.N+' remedies; shared '+f.shared)+'"><div class="rep-diff-fth" dir="ltr">'+escapeHtml(f.label.length>34?f.label.substring(0,33)+'…':f.label)+' <small>['+f.shared+']</small></div></th>'; });
    h+='</tr></thead><tbody>';
    rm.rows.forEach(function(r){
        var on=repDiffSel.indexOf(r.abbr)!==-1;
        h+='<tr class="'+(on?'sel':'')+'"><td class="st"><input type="checkbox" '+(on?'checked':'')+' onchange="repDiffToggleRem(\''+_repJs(r.abbr)+'\')"></td>'
            +'<td class="st rem"><b dir="ltr" title="'+_repAttr(repRemedyTitle(r.abbr))+'" onclick="repDiffOpenWithRemedies([\''+_repJs(r.abbr)+'\'],repDiffCtx)">'+escapeHtml(r.abbr)+'</b> <small>'+r.size.toLocaleString()+'</small></td>'
            +'<td><span class="rep-diff-dot d'+r.g+'">'+r.g+'</span></td><td class="sc">'+repDiffFmt(r.score)+'</td>'
            +'<td class="rare" dir="ltr">'+(r.rare.length?r.rare.map(function(x){ return '<span class="rep-diff-rare" title="'+_repAttr(x.f.t)+'">⭐ '+escapeHtml(x.f.label.replace(/^[⏱↔]\s*/,''))+' <small>['+x.f.shared+']</small></span>'; }).join(' '):'<span class="rep-diff-none">—</span>')+'</td>';
        var byKey={}; r.feats.forEach(function(x){ byKey[x.f.key]=x.g; });
        rm.feats.forEach(function(f){ var g=byKey[f.key]||0; h+='<td class="c">'+(g?'<i class="rep-gr-dot d'+g+'" title="'+_repAttr(r.abbr+' = '+g+' — '+f.t)+'"></i>':'')+'</td>'; });
        h+='</tr>';
    });
    h+='</tbody></table></div>';
    return h;
}
// کتابوں کی گواہی ٹیب
function repDiffBooksTabHtml(last,inCase){
    var L=repLangText, R=repDiffSel.slice();
    if(!R.length&&repDiffCtx&&repDiffCtx.rems){ var rems=repDiffCtx.rems; R=Object.keys(rems).sort(function(a,b){ return (repDiffGrade(rems[b])-repDiffGrade(rems[a]))||a.localeCompare(b); }).slice(0,5); }
    var h='<p class="rep-tool-sub">'+L({ur:'اسی موضوع پر باقی کتابوں کی اندراجات — دوسرے مصنفین کی گواہی۔ موضوع کے الفاظ ربرک کے عنوان اور «(See …)» سے خودکار بنے ہیں؛ ترمیم کر کے دوبارہ چلائیں۔ صرف وہ ربرکس جن میں کوئی چنی ہوئی ریمیڈی موجود ہو۔',en:'Entries of the other books on the same theme — the testimony of other authors. Theme words are auto-derived from the rubric title and "(See …)"; edit and re-run. Only rubrics containing a chosen remedy are shown.',roman:'Baqi kitabon ki gawahi.'})+'</p>';
    h+='<div class="rep-diff-theme"><label>🔎 '+L({ur:'موضوع کے الفاظ:',en:'Theme words:',roman:'Theme words:'})+' <input type="text" id="repDiffThemeInp" value="'+_repAttr(repDiffTheme)+'" dir="ltr" placeholder="absent, forget, memory" onkeydown="if(event.key===\'Enter\')repDiffThemeApply()"></label> <button class="rc-btn" onclick="repDiffThemeApply()">↻</button>'
        +' <span class="cnt">'+L({ur:'ریمیڈیز:',en:'remedies:',roman:'remedies:'})+' '+R.map(function(a){ return '<b dir="ltr">'+escapeHtml(a)+'</b>'; }).join(', ')+'</span></div>';
    if(!R.length) return h+'<div class="rep-tool-note">'+L({ur:'پہلے ریمیڈیز چنیں',en:'Pick remedies first',roman:'Pehle remedies chunein'})+'</div>';
    if(!repDiffTheme.trim()) return h+'<div class="rep-tool-note">'+L({ur:'موضوع کے الفاظ لکھیں (مثلاً grief, sigh, consol)',en:'Enter theme words (e.g. grief, sigh, consol)',roman:'Theme words likhein'})+'</div>';
    var groups=repDiffBooksWitness(R,last.all,repDiffCtx?repDiffCtx.book:repDiffScopeBook(),repDiffTheme);
    var loaded=Object.keys(last.all||{}).length;
    if(loaded<2) h+='<div class="rep-tool-note">⏳ '+L({ur:'باقی کتابیں لوڈ نہیں — «چلائیں» دبائیں',en:'Other books not loaded — press Run',roman:'Baqi kitabein load nahi — Run dabaein'})+'</div>';
    if(!groups.length) return h+'<div class="rep-tool-note">'+L({ur:'باقی کتابوں میں اس موضوع پر ان ریمیڈیز کی کوئی اندراج نہیں',en:'No entries for these remedies on this theme in the other books',roman:'Koi indraaj nahi'})+'</div>';
    h+='<div class="rep-diff-legend">'+R.map(function(a,i){ return '<span>'+(i+1)+' = <b dir="ltr">'+escapeHtml(a)+'</b></span>'; }).join('')+'</div>';
    groups.forEach(function(g){
        var bi=REP_BOOK_INFO[g.book]||{name:g.book};
        h+='<div class="rep-diff-sec"><div class="rep-diff-sechead">'+repBookBadgeHtml(g.book)+' '+escapeHtml(bi.name)+' <span class="cnt">'+g.total+'</span></div>';
        g.rows.forEach(function(x){ h+=repDiffRowHtml({x:x,N:x.N,g:Math.max.apply(null,x.vec),vec:x.vec,score:x.present*repDiffSpec(x.N)},R,inCase,false); });
        h+='</div>';
    });
    return h;
}
function repDiffThemeApply(){ var i=document.getElementById('repDiffThemeInp'); if(i)repDiffTheme=i.value; if(repDiffLast&&Object.keys(repDiffLast.all||{}).length>1) repDiffRenderBody(); else repDiffRun(); }

// ---------- اعمال ----------
function repDiffClipToggle(btn,book,ch,rid,path,rems){
    var added=repClipToggle(repActiveClip,book,ch,rid,path,rems||0);
    if(btn){ btn.classList.toggle('on',added); btn.textContent=added?'✓':''; }
    if(typeof repCmpSyncChecks==='function') repCmpSyncChecks(book,rid,added);
    showToast((added?'☑ ':'☐ ')+repLangText({ur:added?repClipLabel(repActiveClip)+' میں شامل':repClipLabel(repActiveClip)+' سے ہٹا دیا',en:added?'Added to '+repClipLabel(repActiveClip):'Removed from '+repClipLabel(repActiveClip),roman:added?repClipLabel(repActiveClip)+' mein shamil':repClipLabel(repActiveClip)+' se hata diya'}));
    if(typeof repCmpPanelRender==='function') repCmpPanelRender();
}
// ==================== ✅ v68.7: «ایک دوا کی فہرست نکالنا» (remedy extraction) ====================
// ریڈار اوپس جیسا: ایک دوا چنیں، اور اُس کی وہ ساری جگہیں نکالیں جن میں وہ دوا ہے —
//   شرط کے ساتھ: ربرک کا سائز ≤، کم از کم گریڈ، صرف انوکھی جگہیں (جن میں اور کوئی نہ ہو)،
//   اور صرف پہلے نمبر کی جگہیں (outranking)۔ یہ سب فہرست بھرتے ہوئے چھانتا ہے، بعد میں نہیں۔
function repDiffExtract(abbr,list,opts,sizes){
    var out={abbr:abbr,total:0,top:0,single:0,rows:[],cap:false,skipped:0};
    if(!abbr||!list||!list.length) return out;
    var minG=opts.minG||1, maxN=(opts.maxN&&opts.maxN>0)?opts.maxN:Infinity, onlyOnly=!!opts.onlySingle, topOnly=!!opts.topOnly;
    for(var i=0;i<list.length;i++){
        var x=list[i], r=x.r||{};
        var g=repDiffGrade(r[abbr]); if(g<minG) continue;
        var n=0,best=0,bestA=null;
        for(var a in r){ var gg=repDiffGrade(r[a]); n++; if(gg>best){best=gg;bestA=a;} else if(gg===best&&bestA&&a<bestA)bestA=a; }
        out.total++;
        var isSingle=(n===1), isTop=(g>=best);
        if(isSingle) out.single++;
        if(isTop) out.top++;
        if(onlyOnly&&!isSingle) continue;
        if(topOnly&&!isTop) continue;
        if(n>maxN){ out.skipped++; continue; }
        out.rows.push({x:x,N:n,g:g,score:g*repDiffSpec(n),peer:isSingle?'':bestA,pg:best});
    }
    out.rows.sort(function(a,b){ return (b.g-a.g)||(a.N-b.N)||(b.score-a.score); });
    if(out.rows.length>REP_EXTR_CAP){ out.rows.length=REP_EXTR_CAP; out.cap=true; }
    out.k1=out.total;
    return out;
}
function repDiffExtrRowHtml(row,abbr){
    var x=row.x, inC=repDiffInCaseSet()[x.book+'|'+String(x.rid)];
    var peer=row.peer&&row.pg>row.g?(' <span class="rep-diff-hint">'+abbr+' → '+row.g+' · '+escapeHtml(row.peer)+' → '+row.pg+'</span>'):'';
    return '<div class="rep-diff-row">'
        +'<button class="rpc-chk sr'+(repClipFind(repActiveClip,x.book,x.rid)!==-1?' on':'')+'" title="'+repLangText({ur:'فعال کلپ بورڈ میں شامل/خارج',en:'Add to / remove from active clipboard',roman:'Active clipboard mein shamil/kharij'})+'" onclick="repDiffClipToggle(this,\''+_repJs(x.book)+'\',\''+_repJs(x.ch)+'\',\''+_repJs(x.rid)+'\',\''+_repJs(x.t)+'\','+row.N+')">'+(repClipFind(repActiveClip,x.book,x.rid)!==-1?'✓':'')+'</button>'
        +'<span class="rep-diff-ch">'+escapeHtml(getChapterDisplayName(x.book,x.ch)||x.ch)+' ›</span> '
        +'<span class="rep-diff-t" dir="ltr" onclick="repDiffGo(\''+_repJs(x.book)+'\',\''+_repJs(x.ch)+'\',\''+_repJs(x.rid)+'\')">'+escapeHtml(x.t)+'</span>'+peer
        +'<span class="rep-diff-n" title="'+repLangText({ur:'ربرک کی کل ریمیڈیز',en:'remedies in rubric',roman:'rubric ki kul remedies'})+'">'+row.N+'</span>'
        +'<span class="rep-diff-vec"><span class="rep-diff-dot d'+row.g+'">'+row.g+'</span></span>'
        +'<span class="rep-diff-score">'+repDiffFmt(row.score)+'</span>'
        +(inC?'<span class="rep-diff-incase">📋'+inC+'</span>':'')
        +'</div>';
}
function repDiffRenderExtr(last){
    var L=repLangText, e=last.extract, body=document.getElementById('repDiffBody'); if(!body||!e)return;
    var h='<div class="rep-diff-sum">'
        +'<span class="rep-diff-chip on"><b dir="ltr">'+escapeHtml(e.abbr)+'</b> <button onclick="repDiffToggleRem(\''+_repJs(e.abbr)+'\')">✕</button></span> '
        +'<span>'+L({ur:'اس کتاب میں کل جگہیں',en:'rubrics in scope',roman:'kul jagahain'})+': <b>'+e.total+'</b></span>'
        +'<span>'+L({ur:'انوکھی',en:'single-remedy',roman:'anokhi'})+': <b>'+e.single+'</b></span>'
        +'<span>'+L({ur:'پہلے نمبر پر',en:'not outranked',roman:'pehle number par'})+': <b>'+e.top+'</b></span>'
        +'<span>'+L({ur:'دکھائی جا رہی',en:'shown',roman:'dikhai ja rahi'})+': <b>'+e.rows.length+'</b>'+L({ur:' (اوپر والی شرط کے بعد)',en:' (after filters)',roman:' (shart ke baad)'})+'</span>'
        +'</div>';
    if(e.cap) h+='<div class="rep-diff-note">ℹ '+L({ur:'فہرست لمبی تھی، '+REP_EXTR_CAP+' بہترین قطاریں دکھائی گئیں۔ چھانٹنی لگائیں تو سب نظر آئیں گی۔',en:'Long list — top '+REP_EXTR_CAP+' rows shown; add filters to see the rest.',roman:'Lambi fehrist'})+'</div>';
    if(last.scanned>REP_DIFF_SCAN_STOP) h+='<div class="rep-diff-note">⚠ '+L({ur:'اسکین چھوٹی رکھی گئی: '+last.scanned+' ربرکس چھانٹے گئے، مقررہ حد تک۔ دائرہ چھوٹا (باب یا کتاب) رکھیں تو سب کچھ دیکھا جائے گا۔',en:'Scan capped at '+last.scanned+' rubrics. Narrow the scope (chapter or book) to be exhaustive.',roman:'Scan chhoti rakhi'})+'</div>';
    if(e.skipped) h+='<div class="rep-diff-note">'+L({ur:e.skipped+' بڑی جگہیں سائز کی شرط سے باہر رہیں',en:e.skipped+' large rubrics filtered out by the size cap',roman:e.skipped+' barhi jagahain bahar'})+'</div>';
    var o=repDiffOpts;
    h+='<div class="rep-diff-ctl">'
        +'<label><input type="checkbox" '+(o.onlySingle?'checked':'')+' onchange="repDiffSetOpt(\'onlySingle\',this.checked?1:0)"> '+L({ur:'صرف انوکھی جگہیں (اکیلے یہی دوا)',en:'single-remedy pages only',roman:'anokhi'})+'</label>'
        +'<label><input type="checkbox" '+(o.topOnly?'checked':'')+' onchange="repDiffSetOpt(\'topOnly\',this.checked?1:0)"> '+L({ur:'صرف جہاں یہ دوا سب سے اوپر ہے',en:'where this remedy outranks the rest',roman:'sab se ooper'})+'</label>'
        +'<button class="rc-btn primary" onclick="repDiffTakeAll()">📥 '+L({ur:'سب کلپ بورڈ میں',en:'Take all into clipboard',roman:'Sab clipboard mein'})+'</button>'
        +'<button class="rc-btn" onclick="repDiffCopy()">📋</button>'
        +'</div>';
    if(!e.rows.length) h+='<div class="rep-tool-loading">'+L({ur:'اس دائرے اور ان شرائط کے تحت کوئی جگہ نہیں ملی۔',en:'Nothing in this scope with these filters.',roman:'Koi jagah nahi mili'})+'</div>';
    else { h+='<div class="rep-diff-rows" dir="ltr">'; for(var i=0;i<e.rows.length;i++) h+=repDiffExtrRowHtml(e.rows[i],e.abbr); h+='</div>'; }
    body.innerHTML=h; body.scrollTop=0;
}
// نکالی ہوئی پوری فہرست ایک ساتھ فعال کلپ بورڈ میں
function repDiffTakeAll(){
    var last=repDiffLast, e=last&&last.extract;
    var rows=e?e.rows:(last&&last.res?[]:[]);
    if(!rows.length){ showToast(repLangText({ur:'پہلے چلائیں',en:'Run first',roman:'Pehle chalayein'})); return; }
    var added=0;
    for(var i=rows.length-1;i>=0;i--){ var x=rows[i].x;
        if(repClipFind(repActiveClip,x.book,x.rid)===-1){ repClipboards[repActiveClip].unshift({book:x.book,ch:x.ch,rid:String(x.rid),path:x.t,rems:rows[i].N,ts:Date.now()}); added++; }
    }
    if(added){ repClipsSave(); repRenderDock(); if(typeof repCmpPanelRender==='function')repCmpPanelRender(); repDiffRenderExtr(last); repDiffRenderHead(); }
    showToast('📥 '+(added?repLangText({ur:added+' جگہیں '+repClipLabel(repActiveClip)+' میں ڈال دیں',en:added+' rubrics added to '+repClipLabel(repActiveClip),roman:added+' jagahain clipboard mein'}):repLangText({ur:'سب پہلے سے موجود تھیں',en:'already there',roman:'sab mojood thin'})));
}
function repDiffGo(book,ch,rid){ repDiffClose(); navigateToRubric(book,ch,rid,true); }
function repDiffCopy(){
    var last=repDiffLast; if(!last||!last.res){ showToast(repLangText({ur:'پہلے چلائیں',en:'Run first',roman:'Pehle chalayein'})); return; }
    var R=repDiffSel, res=last.res, lines=[];
    if(last.extract&&!res){ var e=last.extract; lines.push('EXTRACT — '+e.abbr+' — scope: '+last.scope+' ('+last.n+' rubrics scanned)');
        lines.push('total='+e.total+' single-remedy='+e.single+' not-outranked='+e.top+' shown='+e.rows.length);
        e.rows.forEach(function(r){ lines.push('  ['+r.g+'] ('+r.N+') '+(getChapterDisplayName(r.x.book,r.x.ch)||r.x.ch)+' › '+r.x.t); });
        var tx=lines.join('\n'); if(navigator.clipboard) navigator.clipboard.writeText(tx).then(function(){ showToast('📋 '+repLangText({ur:'فہرست کاپی ہو گئی',en:'List copied',roman:'Fehrist copy ho gayi'})); }); return; }
    lines.push('DIFFERENTIATION — '+R.join(' vs ')+' — scope: '+last.scope+' ('+last.n+' rubrics)'+(repDiffCtx?(' — rubric: '+repDiffCtx.full):''));
    lines.push('any='+res.any+' allPresent='+res.allPresent+' commonEqual='+res.commonEqual);
    R.forEach(function(a){ lines.push(''); lines.push('== '+a+' ('+repRemedyTitle(a)+') exclusive '+res.perRem[a].excl+' =='); res.excl[a].slice(0,40).forEach(function(r){ lines.push('  ['+r.g+'] ('+r.N+') '+(getChapterDisplayName(r.x.book,r.x.ch)||r.x.ch)+' › '+r.x.t); }); });
    if(res.grade.length){ lines.push(''); lines.push('== grade differences =='); res.grade.slice(0,40).forEach(function(r){ lines.push('  '+r.vec.join('/')+' ('+r.N+') '+r.x.t); }); }
    var txt=lines.join('\n');
    if(navigator.clipboard){ navigator.clipboard.writeText(txt).then(function(){ showToast('📋 '+repLangText({ur:'نتیجہ کاپی ہو گیا',en:'Result copied',roman:'Nateeja copy ho gaya'})); }); }
}
