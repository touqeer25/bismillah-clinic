//#SPLIT ==================================================================
//#SPLIT 🔬 تفریق / نکاسی — کتابوں کی گواہی + موضوع کے الفاظ (انجن + دکھاوا)
//#SPLIT اصل: js/08b-rep-differentiation.js — سطریں 166 تا 196، 475 تا 497
//#SPLIT ⚠ کوڈ میں ایک حرف بھی تبدیل نہیں — صرف کاٹ کر منتقل کیا گیا ہے۔
//#SPLIT ==================================================================
// ---------- کتابوں کی گواہی ----------
var REP_THEME_SYN={"brooding": "brood, dwell, grievance, rumin, sorrow, silent, taciturn, sits, weep", "absent": "forgetful, memory, dreamy, abstract, distract, inattentive, absorbed, confus", "abstraction": "absent, dreamy, absorbed, thought, forgetful", "anger": "irritab, rage, violent, quarrel, contradict, vexation, passion", "anxiety": "anxious, fear, apprehens, restless, dread, uneasi", "company": "alone, solitude, company, strangers, society", "confusion": "confus, dull, stupid, bewilder, muddled, dazed", "consolation": "consol, sympathy, comfort, weep, grief", "delusion": "delusion, imagin, illusion, fancies, hallucin, thinks he", "despair": "despair, hopeless, despond, suicid, weary of life", "dullness": "dull, sluggish, stupid, slow, comprehend, think", "fear": "fear, fright, terror, dread, afraid, panic", "forgetful": "forget, memory, absent, remember", "grief": "grief, sorrow, weep, cry, consol, disappoint, mourn, sad", "hurry": "hurr, haste, hasty, impatien, rapid", "indifference": "indifferen, apath, listless, careless, no interest", "irritability": "irritab, cross, peevish, ill-humor, snappish, anger", "jealousy": "jealous, suspic, envy", "loquacity": "loquac, talkative, talks, chatter, garrulous", "memory": "memory, forget, remember, recollect", "mistakes": "mistake, wrong word, misplac, error, writing, speaking", "restlessness": "restless, uneasy, tossing, cannot keep still, agitat", "sadness": "sad, melanchol, depress, gloomy, weep, despond", "sensitive": "sensitiv, oversensitiv, noise, light, odor, touch, offended", "starting": "start, startled, jump, fright, noise", "suspicious": "suspic, distrust, mistrust, jealous", "talking": "talk, speech, loquac, silent, taciturn", "weeping": "weep, cry, tear, sob, laugh", "ailments": "effects of, after, from, ailments", "timidity": "timid, bashful, shy, cowardly, courage", "religious": "religio, pray, salvation, sin, conscience", "insanity": "insan, mania, madness, raving, delirium", "delirium": "delirium, raving, mutter, unconscious, stupor", "unconsciousness": "unconscious, stupor, coma, faint, insensib", "excitement": "excit, exalt, agitat, elated, nervous", "concentration": "concentrat, attention, think, apply, study", "thoughts": "thought, ideas, rush, vanish, persistent", "dwells": "dwell, brood, past, disagreeable, grievance, rumin", "weary": "weary, tired of life, loath, disgust, suicid", "sighing": "sigh, breath, sob, deep breath", "mood": "mood, changeable, alternat, humor, variable", "haughty": "haught, proud, arrogan, contempt, superior", "contemptuous": "contempt, scorn, disdain, haught", "lamenting": "lament, moan, groan, complain, wail", "shrieking": "shriek, scream, cry out, brain cry, screech", "violent": "violen, rage, strike, bite, destroy, fury", "obstinate": "obstina, headstrong, stubborn, contrar, self-will", "cheerful": "cheerful, gay, merry, happy, laugh, mirth", "laughing": "laugh, mirth, giggl, silly, alternat weep", "sympathetic": "sympath, compassion, affection, kind", "malicious": "malic, spiteful, cruel, revenge, wicked", "cursing": "curs, swear, abusive, profan", "kleptomania": "steal, theft, kleptoman", "death": "death, dying, die, dread of death", "home": "home, homesick, nostalgia, leave", "business": "business, affairs, indifferen, neglect, aversion to work", "work": "work, labor, aversion, industrious, occupation", "answers": "answer, question, reply, repeat, slowly, abrupt", "speech": "speech, stammer, talk, word, mutter, hasty", "gestures": "gesture, motion, picking, grasping, hands", "awkward": "awkward, drops, clumsy, stumble", "biting": "bit, gnaw, nails, spoon", "carried": "carried, wants to be, quiet, rock", "indignation": "mortification, humiliat, insult, offen, scorn, contempt, injustice, wrong, reproach", "mortification": "indignation, humiliat, insult, offen, shame, disgrace, chagrin", "humiliation": "mortification, indignation, insult, disgrace, shame, contempt", "insult": "indignation, mortification, offen, affront, reproach, contempt", "reproach": "reproach, blame, insult, remorse, self-reproach, conscience", "disappointment": "disappoint, deceiv, betray, unrequited, friendship, love", "vexation": "vexation, anger, chagrin, annoy, indignation, quarrel", "suppressed": "suppress, reserved, silent, unexpressed, concealed, restrain"};   // ربرک کے پہلے لفظ سے موضوع کے مترادفات (کتابوں کی گواہی + میٹیریا میڈیکا)
function repDiffThemeWordsFor(ctx){
    if(!ctx) return '';
    var t=ctx.full||''; var base=_repDiffBaseTitle(t).split(',')[0];
    var words=base.split(/[^A-Za-z]+/).filter(function(w){ return w.length>=4; });
    repExtractSeeTargets(t).forEach(function(x){ x.split(/[,;]|\band\b/i).forEach(function(w){ w=w.trim(); if(w.length>=4)words.push(w); }); });
    var STOP={mind:1,general:1,generals:1,symptom:1,symptoms:1,part:1,parts:1,side:1,with:1,from:1,during:1,after:1,before:1,while:1,when:1,which:1,than:1,that:1,this:1,other:1,things:1};
    var out=[]; words.forEach(function(w){ var orig=w.toLowerCase(); w=orig.replace(/(ness|ing|ed|es|s)$/,''); if(w.length<4&&orig.length>=5) w=orig.substring(0,Math.max(3,w.length)); if(w.length>=3&&out.indexOf(w)===-1&&!STOP[w])out.push(w); });
    // 🔑 v90 (صارف کے اصولی اعتراض کے بعد): مترادفات اب **خودکار شامل نہیں** ہوتے۔
    //   indignation اور mortification الگ کیفیتیں ہیں اور ان کے ربرکس بھی الگ — ایپ انہیں ایک نہیں کہے گی۔
    //   لغت اب صرف **تجویز** دیتی ہے (repDiffThemeSugg)، فیصلہ ڈاکٹر کا۔
    return out.join(', ');
}
function repDiffThemeRegex(words){
    var parts=String(words||'').split(/[,،]/).map(function(w){ return w.trim().toLowerCase(); }).filter(function(w){ return w.length>=3; });
    if(!parts.length) return null;
    return new RegExp(parts.map(function(w){ return w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }).join('|'),'i');
}
// 🔑 v90: لغت سے **تجاویز** — موجودہ الفاظ کے قریبی موضوعات، جو ابھی شامل نہیں
function repDiffThemeSugg(){
    var cur=String(repDiffTheme||'').toLowerCase().split(/[,\s]+/).filter(Boolean), out=[];
    cur.forEach(function(w){
        Object.keys(REP_THEME_SYN).forEach(function(k){
            if(w.length<4||k.substring(0,5)!==w.substring(0,5)) return;
            REP_THEME_SYN[k].split(',').forEach(function(x){
                x=x.trim().toLowerCase(); if(!x||x.length<4) return;
                if(cur.indexOf(x)!==-1||out.indexOf(x)!==-1) return;
                for(var i=0;i<cur.length;i++) if(cur[i].indexOf(x)===0||x.indexOf(cur[i])===0) return;   // وہی لفظ دوسری شکل میں
                out.push(x);
            });
        });
    });
    return out.slice(0,10);
}
function repDiffThemeAdd(w){
    var cur=String(repDiffTheme||'').trim();
    repDiffTheme=cur?(cur.replace(/[,\s]+$/,'')+', '+w):w;
    var i=document.getElementById('repDiffThemeInp'); if(i)i.value=repDiffTheme;
    repDiffRenderBody();
}
// کون سا لفظ اس ربرک پر لگا — شفافیت کے لیے
function repDiffWhyWords(title){
    var ws=String(repDiffTheme||'').toLowerCase().split(/[,\s]+/).filter(function(w){ return w.length>=3; });
    var T=String(title||'').toLowerCase(), hit=[];
    ws.forEach(function(w){ if(T.indexOf(w)!==-1&&hit.indexOf(w)===-1) hit.push(w); });
    return hit;
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

// 🔑 v84 (صارف): «کتابوں کی گواہی» کی اصلاح — پہلے یہ ٹیب گیارہ کتابوں کی پوری فائلیں (≈۵۶ MB)
//   ایک ساتھ منگواتا تھا، اور اگر ایک بھی فیچ ناکام ہو جاتی تو خالی نتیجہ ہمیشہ کے لیے کیش ہو جاتا تھا
//   (repEnsureAllBooks دوبارہ کوشش نہیں کرتا)۔ اب:
//     • صارف خود چنتا ہے کہ کون سی کتابیں دیکھنی ہیں (حجم سامنے لکھا ہے)
//     • کتابیں ایک ایک کر کے آتی ہیں اور پیش رفت نظر آتی ہے
//     • ناکام کتاب کیش نہیں ہوتی — «دوبارہ کوشش» سے پھر منگوائی جا سکتی ہے
//   ⚠ گواہی کا انجن (repDiffBooksWitness) بالکل نہیں چھیڑا گیا — صرف لوڈنگ اور دکھاوا بدلا ہے۔
var REP_DIFF_BOOKSEL_KEY='bc_rep_diff_booksel';
var REP_DIFF_BOOK_MB={publicum:11.1,kent:10.3,kent_de:18.4,synthesis91:14.2,allen_fever:0.5,hs_clinical:0.6,keynotes_cc:0.1,nosodes:0.1,hering_mind:0.9,boger_times:0.3,tissues_bd:0.1};
var REP_DIFF_BOOKSEL_DEF=['synthesis91','hering_mind','hs_clinical','keynotes_cc','nosodes','allen_fever','boger_times','tissues_bd'];
var _repDiffBooks={};          // id -> data (صرف کامیاب کتابیں)
var _repDiffBookState={};      // id -> 'load' | 'err'
var _repDiffBooksBusy=false;
var repDiffBookSel=(function(){ try{ var v=JSON.parse(localStorage.getItem(REP_DIFF_BOOKSEL_KEY)||'null'); if(v&&v.length) return v; }catch(e){} return REP_DIFF_BOOKSEL_DEF.slice(); })();
function repDiffBookSelSave(){ try{ localStorage.setItem(REP_DIFF_BOOKSEL_KEY,JSON.stringify(repDiffBookSel)); }catch(e){} }
function repDiffBookToggle(id){
    var k=repDiffBookSel.indexOf(id); if(k===-1) repDiffBookSel.push(id); else repDiffBookSel.splice(k,1);
    repDiffBookSelSave(); repDiffRenderBody();
}
function repDiffBookWanted(){ var cur=repDiffCtx?repDiffCtx.book:repDiffScopeBook(); return repDiffBookSel.filter(function(id){ return id!==cur&&REP_BOOK_INFO[id]; }); }
function repDiffBooksMB(ids){ var s=0; ids.forEach(function(id){ s+=(REP_DIFF_BOOK_MB[id]||1); }); return Math.round(s*10)/10; }
// ایک ایک کر کے لوڈ — ہر کتاب کے بعد دوبارہ دکھاؤ (تاکہ نتیجہ بڑھتا ہوا نظر آئے)
function repDiffBooksLoad(){
    if(_repDiffBooksBusy) return;
    var todo=repDiffBookWanted().filter(function(id){ return !_repDiffBooks[id]; });
    if(!todo.length){ repDiffRenderBody(); return; }
    _repDiffBooksBusy=true;
    (function step(k){
        if(k>=todo.length){ _repDiffBooksBusy=false; repDiffRenderBody(); return; }
        var id=todo[k], info=REP_BOOK_INFO[id]||{};
        _repDiffBookState[id]='load'; repDiffRenderBody();
        fetch(info.dataFile+'?'+REP_DATA_V).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
            .then(function(d){ _repDiffBooks[id]=d; delete _repDiffBookState[id]; })
            .catch(function(e){ _repDiffBookState[id]='err'; console.warn('books-witness load fail',id,e); })
            .then(function(){ repDiffRenderBody(); setTimeout(function(){ step(k+1); },0); });
    })(0);
}
function repDiffBooksRetry(){ Object.keys(_repDiffBookState).forEach(function(id){ if(_repDiffBookState[id]==='err') delete _repDiffBookState[id]; }); repDiffBooksLoad(); }
function repDiffBooksTabHtml(last,inCase){
    var L=repLangText, R=repDiffSel.slice();
    if(!R.length&&repDiffCtx&&repDiffCtx.rems){ var rems=repDiffCtx.rems; R=Object.keys(rems).sort(function(a,b){ return (repDiffGrade(rems[b])-repDiffGrade(rems[a]))||a.localeCompare(b); }).slice(0,5); }
    var h='<p class="rep-tool-sub">'+L({ur:'اسی موضوع پر باقی کتابوں کی اندراجات — دوسرے مصنفین کی گواہی۔ موضوع کے الفاظ ربرک کے عنوان اور «(See …)» سے خودکار بنے ہیں؛ ترمیم کر کے دوبارہ چلائیں۔ صرف وہ ربرکس جن میں کوئی چنی ہوئی ریمیڈی موجود ہو۔',en:'Entries of the other books on the same theme — the testimony of other authors. Theme words are auto-derived from the rubric title and "(See …)"; edit and re-run. Only rubrics containing a chosen remedy are shown.',roman:'Baqi kitabon ki gawahi.'})+'</p>';
    h+='<div class="rep-diff-theme"><label>🔎 '+L({ur:'موضوع کے الفاظ:',en:'Theme words:',roman:'Theme words:'})+' <input type="text" id="repDiffThemeInp" value="'+_repAttr(repDiffTheme)+'" dir="ltr" placeholder="absent, forget, memory" onkeydown="if(event.key===\'Enter\')repDiffThemeApply()"></label> <button class="rc-btn" onclick="repDiffThemeApply()">↻</button>'
        +' <span class="cnt">'+L({ur:'ریمیڈیز:',en:'remedies:',roman:'remedies:'})+' '+R.map(function(a){ return '<b dir="ltr">'+escapeHtml(a)+'</b>'; }).join(', ')+'</span></div>';
    var sug=repDiffThemeSugg();
    if(sug.length){
        h+='<div class="rep-diff-sugg"><span class="rep-diff-sugg-lbl">'+L({ur:'قریبی موضوعات — دبا کر شامل کریں:',en:'Related themes — click to add:',roman:'Qareebi mauzooat:'})+'</span> ';
        sug.forEach(function(w){ h+='<button type="button" class="rep-diff-sugbtn" onclick="repDiffThemeAdd(\''+_repJs(w)+'\')" dir="ltr">＋ '+escapeHtml(w)+'</button> '; });
        h+='<span class="rep-diff-sugg-note">'+L({ur:'یہ الگ ربرکس ہیں، ایک ہی بات نہیں — صرف پڑھنے کے لیے',en:'These are separate rubrics, not the same thing — for reading only',roman:'Ye alag rubrics hain'})+'</span></div>';
    }
    // ---- کتابوں کا انتخاب ----
    var cur=repDiffCtx?repDiffCtx.book:repDiffScopeBook(), want=repDiffBookWanted();
    var have=want.filter(function(id){ return !!_repDiffBooks[id]; }), errs=want.filter(function(id){ return _repDiffBookState[id]==='err'; });
    var left=want.filter(function(id){ return !_repDiffBooks[id]&&_repDiffBookState[id]!=='err'; });
    h+='<div class="rep-diff-bookpick"><div class="rep-diff-bookpick-head">📚 '+L({ur:'کن کتابوں سے گواہی لی جائے؟',en:'Which books to consult?',roman:'Kaun si kitabein?'})
        +' <span class="cnt">'+have.length+'/'+want.length+' '+L({ur:'لوڈ شدہ',en:'loaded',roman:'loaded'})+'</span>';
    if(left.length) h+=' <button class="rc-btn primary" onclick="repDiffBooksLoad()"'+(_repDiffBooksBusy?' disabled':'')+'>'+(_repDiffBooksBusy?'⏳ '+L({ur:'آ رہی ہیں…',en:'loading…',roman:'loading…'}):'⬇ '+L({ur:'لوڈ کریں',en:'Load',roman:'Load'})+' ('+repDiffBooksMB(left)+' MB)')+'</button>';
    if(errs.length) h+=' <button class="rc-btn" onclick="repDiffBooksRetry()">↻ '+L({ur:'دوبارہ کوشش',en:'Retry',roman:'Retry'})+' ('+errs.length+')</button>';
    h+='</div><div class="rep-diff-bookchips">';
    Object.keys(REP_BOOK_INFO).forEach(function(id){
        if(id===cur) return;
        var on=repDiffBookSel.indexOf(id)!==-1, st=_repDiffBooks[id]?'ok':(_repDiffBookState[id]||'');
        var mark=st==='ok'?'✅':(st==='load'?'⏳':(st==='err'?'⚠':''));
        h+='<label class="rep-diff-bookchip'+(on?' on':'')+'" title="'+_repAttr((REP_BOOK_INFO[id].name||id)+' — '+(REP_DIFF_BOOK_MB[id]||'?')+' MB')+'">'
            +'<input type="checkbox" '+(on?'checked':'')+' onchange="repDiffBookToggle(\''+_repJs(id)+'\')"> '
            +escapeHtml(REP_BOOK_INFO[id].abbr||id)+' <small>'+(REP_DIFF_BOOK_MB[id]||'?')+'M</small> '+mark+'</label> ';
    });
    h+='</div></div>';
    if(!R.length) return h+'<div class="rep-tool-note">'+L({ur:'پہلے ریمیڈیز چنیں',en:'Pick remedies first',roman:'Pehle remedies chunein'})+'</div>';
    if(!repDiffTheme.trim()) return h+'<div class="rep-tool-note">'+L({ur:'موضوع کے الفاظ لکھیں (مثلاً grief, sigh, consol)',en:'Enter theme words (e.g. grief, sigh, consol)',roman:'Theme words likhein'})+'</div>';
    if(!want.length) return h+'<div class="rep-tool-note">'+L({ur:'اوپر سے کم از کم ایک کتاب چنیں',en:'Tick at least one book above',roman:'Kam az kam ek kitab chunein'})+'</div>';
    var groups=repDiffBooksWitness(R,_repDiffBooks,cur,repDiffTheme);
    if(!have.length) return h+'<div class="rep-tool-note">⬇ '+L({ur:'ابھی کوئی کتاب لوڈ نہیں — اوپر «لوڈ کریں» دبائیں',en:'No book loaded yet — press Load above',roman:'Pehle Load dabaein'})+'</div>';
    if(!groups.length) return h+'<div class="rep-tool-note">'+L({ur:'لوڈ شدہ کتابوں میں اس موضوع پر ان ریمیڈیز کی کوئی اندراج نہیں',en:'No entries for these remedies on this theme in the loaded books',roman:'Koi indraaj nahi'})+'</div>';
    h+='<div class="rep-diff-legend">'+R.map(function(a,i){ return '<span>'+(i+1)+' = <b dir="ltr">'+escapeHtml(a)+'</b></span>'; }).join('')+'</div>';
    groups.forEach(function(g){
        var bi=REP_BOOK_INFO[g.book]||{name:g.book};
        h+='<div class="rep-diff-sec"><div class="rep-diff-sechead">'+repBookBadgeHtml(g.book)+' '+escapeHtml(bi.name)+' <span class="cnt">'+g.total+'</span></div>';
        g.rows.forEach(function(x){
            var why=repDiffWhyWords(x.t);
            h+='<div class="rep-diff-witrow">'+repDiffRowHtml({x:x,N:x.N,g:Math.max.apply(null,x.vec),vec:x.vec,score:x.present*repDiffSpec(x.N)},R,inCase,false)
                +(why.length?'<span class="rep-diff-why" dir="ltr" title="'+_repAttr(L({ur:'یہ سطر اس لفظ کی وجہ سے آئی',en:'matched because of this word',roman:'is lafz ki wajah se'}))+'">🔎 '+escapeHtml(why.join(' · '))+'</span>':'')+'</div>';
        });
        h+='</div>';
    });
    return h;
}
function repDiffThemeApply(){ var i=document.getElementById('repDiffThemeInp'); if(i)repDiffTheme=i.value; if(repDiffLast) repDiffRenderBody(); else repDiffRun(); }   // 🔑 v84
