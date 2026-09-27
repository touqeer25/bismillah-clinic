//#SPLIT ==================================================================
//#SPLIT 🔬 تفریق / نکاسی — کتابوں کی گواہی + موضوع کے الفاظ (انجن + دکھاوا)
//#SPLIT اصل: js/08b-rep-differentiation.js — سطریں 166 تا 196، 475 تا 497
//#SPLIT ⚠ کوڈ میں ایک حرف بھی تبدیل نہیں — صرف کاٹ کر منتقل کیا گیا ہے۔
//#SPLIT ==================================================================
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
