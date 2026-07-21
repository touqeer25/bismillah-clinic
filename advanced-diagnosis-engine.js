/* Advanced Diagnosis Engine v1
 * Clinical decision-support only — not a replacement for physician judgment.
 * Uses broad rule/score based knowledge from advanced-diagnosis-knowledge.js
 */
(function(global){
'use strict';

function $(id){ return document.getElementById(id); }
function lang(){ return global.currentLang || 'ur'; }
function T(obj){ if(!obj) return ''; return obj[lang()] || obj.en || obj.ur || obj.roman || ''; }
function esc(s){
    if(global.escapeHtml) return global.escapeHtml(String(s||''));
    var d=document.createElement('div'); d.textContent=String(s||''); return d.innerHTML;
}
function toast(msg,type){ if(global.showToast) global.showToast(msg,type); else alert(msg); }

function norm(s){
    return String(s||'')
        .toLowerCase()
        .replace(/[۔،؛]/g,' ')
        .replace(/[\n\r\t]+/g,' ')
        .replace(/\s+/g,' ')
        .trim();
}
function negatedAround(text, idx, len){
    var before=text.substring(Math.max(0, idx-28), idx);
    var after=text.substring(idx+len, Math.min(text.length, idx+len+18));
    var neg=/\b(no|not|without|denies|deny|absent|nahin|nahi|nahe|no\s+)\b|نہیں|نھيں|نہيں|نہ |بغیر|نفی/.test(before+' '+after);
    return neg;
}
function findPattern(text, pattern){
    var p=String(pattern||'').toLowerCase();
    if(!p) return -1;
    return text.indexOf(p);
}
function parseDuration(original){
    var s=String(original||'');
    var m=s.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|گھنٹ|ghant|hour)/i);
    if(m) return {value:parseFloat(m[1]), unit:'hours', label:m[0]};
    m=s.match(/(\d+(?:\.\d+)?)\s*(days?|دن|din|roz)/i);
    if(m) return {value:parseFloat(m[1]), unit:'days', label:m[0]};
    m=s.match(/(\d+(?:\.\d+)?)\s*(weeks?|ہفت|haft)/i);
    if(m) return {value:parseFloat(m[1]), unit:'weeks', label:m[0]};
    m=s.match(/(\d+(?:\.\d+)?)\s*(months?|ماہ|mah|month)/i);
    if(m) return {value:parseFloat(m[1]), unit:'months', label:m[0]};
    if(/chronic|old|recurrent|بار بار|پران|دائمی|chalta|purana/i.test(s)) return {value:null, unit:'chronic', label:'chronic/recurrent'};
    return null;
}
function parseTemp(original){
    var s=String(original||'');
    var m=s.match(/\b(9[5-9]|10[0-9]|11[0-9])(?:\.\d+)?\s*(?:°?\s*f|ف|fahrenheit)?\b/i);
    if(m) return parseFloat(m[0]);
    return null;
}

function extractSymptoms(statement, extraKeys){
    var K=global.ADX_KNOWLEDGE || {symptoms:{}};
    var text=norm(statement);
    var found={}, neg={}, evidence={};
    Object.keys(K.symptoms||{}).forEach(function(key){
        var item=K.symptoms[key]||{};
        var pats=item.patterns||[];
        for(var i=0;i<pats.length;i++){
            var pat=norm(pats[i]);
            var idx=findPattern(text, pat);
            if(idx>=0){
                if(negatedAround(text,idx,pat.length)){ neg[key]=true; }
                else { found[key]=true; evidence[key]=pats[i]; }
                break;
            }
        }
    });
    (extraKeys||[]).forEach(function(k){ found[k]=true; evidence[k]='selected'; });
    var temp=parseTemp(statement);
    if(temp!==null){ evidence.temperature=temp; if(temp>=103) found.high_fever=true; }
    var duration=parseDuration(statement);
    return {found:found, negated:neg, evidence:evidence, duration:duration, temperature:temp, text:statement};
}

function scoreConditions(ex){
    var K=global.ADX_KNOWLEDGE || {conditions:[]};
    var results=[];
    (K.conditions||[]).forEach(function(c){
        var features=c.features||{};
        var score=0, max=0, matched=[], missing=[], opposed=[];
        Object.keys(features).forEach(function(k){
            var w=parseFloat(features[k])||0;
            var aw=Math.abs(w);
            if(w>0) max += aw;
            if(w>0 && ex.found[k]){ score += w; matched.push({key:k, weight:w}); }
            else if(w>0 && ex.negated[k]){ score -= Math.min(w,2); opposed.push({key:k, weight:w}); }
            else if(w>0 && w>=2){ missing.push({key:k, weight:w}); }
            else if(w<0 && ex.found[k]){ score += w; opposed.push({key:k, weight:w}); }
        });
        if(max<=0) return;
        var raw=Math.max(0, score);
        var pct=Math.round((raw/max)*100);
        var matchedWeight=matched.reduce(function(a,b){return a+b.weight;},0);
        // Avoid noisy differentials based on a single common symptom.
        // Allow single-feature matches only when the feature is highly characteristic.
        var singleStrong = matched.length===1 && matched[0].weight>=4 && pct>=45;
        var multiUseful = matched.length>=2 && (pct>=18 || matchedWeight>=3);
        if(singleStrong || multiUseful){
            var confidence = pct>=70 ? 'high' : (pct>=45 ? 'medium' : 'low');
            results.push({condition:c, score:raw, max:max, percentage:Math.min(99,pct), confidence:confidence, matched:matched, missing:missing.slice(0,6), opposed:opposed});
        }
    });
    results.sort(function(a,b){
        var sev={emergency:3, urgent:2, routine:1};
        var sd=(sev[b.condition.severity||'routine']||1)-(sev[a.condition.severity||'routine']||1);
        if((b.percentage>=45 || a.percentage>=45) && sd!==0 && (b.condition.severity==='emergency' || a.condition.severity==='emergency')) return sd;
        return b.percentage-a.percentage || b.score-a.score;
    });
    return results;
}
function symptomName(key){
    var K=global.ADX_KNOWLEDGE||{symptoms:{}};
    var s=K.symptoms[key]; return s ? T(s) : key;
}
function collectRedFlags(ex, results){
    var red=[];
    var RF={
        severe_headache:'Sudden/severe headache', neck_stiffness:'Neck stiffness with fever/headache', confusion:'Confusion/altered sensorium', seizure:'Seizure/fits',
        breathlessness:'Breathlessness', chest_pain:'Chest pain', sweating_cold:'Cold sweat/collapse', left_arm_pain:'Cardiac radiation',
        bleeding:'Bleeding', blood_sputum:'Blood in sputum', bloody_diarrhea:'Blood in stool', black_stool:'Black stool',
        severe_abdominal_pain:'Severe abdominal pain', persistent_vomiting:'Persistent vomiting', low_urine:'Low urine', fainting:'Fainting/collapse',
        vision_loss:'Vision loss', pregnancy:'Pregnancy-related caution', poor_feeding:'Child poor feeding'
    };
    Object.keys(RF).forEach(function(k){ if(ex.found[k]) red.push({key:k,label:symptomName(k), reason:RF[k], level:'danger'}); });
    results.slice(0,8).forEach(function(r){
        if((r.condition.severity==='emergency' && r.percentage>=25) || (r.condition.severity==='urgent' && r.percentage>=45)){
            red.push({key:r.condition.id,label:T(r.condition.name), reason:r.condition.severity==='emergency'?'Emergency differential present':'Urgent differential present', level:r.condition.severity==='emergency'?'danger':'warning'});
        }
    });
    var seen={};
    return red.filter(function(x){ var id=x.key+'|'+x.reason; if(seen[id]) return false; seen[id]=1; return true; });
}
function collectQuestions(ex, results){
    var K=global.ADX_KNOWLEDGE||{};
    var qs=[], seen={};
    function add(q, why){
        var t=String(q||'').trim(); if(!t || seen[t]) return; seen[t]=1; qs.push({q:t, why:why||''});
    }
    results.slice(0,5).forEach(function(r){
        var g=r.condition.group||'general';
        (K.groupQuestions&&K.groupQuestions[g]||[]).forEach(function(q){add(q,T(r.condition.name));});
        r.missing.slice(0,4).forEach(function(m){ add('Confirm/ask about: '+symptomName(m.key), T(r.condition.name)); });
    });
    if(qs.length<5){ (K.groupQuestions&&K.groupQuestions.general||[]).forEach(function(q){add(q,'general');}); }
    return qs.slice(0,14);
}
function collectTests(results, redFlags){
    var K=global.ADX_KNOWLEDGE||{};
    var out=[], seen={};
    function add(test, priority, reason){
        var id=test.toLowerCase(); if(seen[id]) return; seen[id]=1; out.push({test:test, priority:priority||'Recommended', reason:reason||''});
    }
    if(redFlags.length){ add('Urgent clinical examination / vitals', 'Urgent', 'Red flag present'); }
    results.slice(0,7).forEach(function(r){
        var g=r.condition.group||'general';
        (K.groupTests&&K.groupTests[g]||[]).forEach(function(t){ add(t[0],t[1],t[2]+' — '+T(r.condition.name)); });
    });
    return out.slice(0,18);
}
function collectRubrics(ex, results){
    var K=global.ADX_KNOWLEDGE||{};
    var out=[], seen={};
    function add(key, rr){
        var id=rr[0]+'|'+rr[1]+'|'+rr[2]; if(seen[id]) return; seen[id]=1;
        out.push({symptom:key, book:rr[0], chapter:rr[1], path:rr[2], weight: key==='fever'?2:3});
    }
    Object.keys(ex.found).forEach(function(k){ (K.rubrics&&K.rubrics[k]||[]).forEach(function(rr){add(k,rr);}); });
    results.slice(0,5).forEach(function(r){
        Object.keys(r.condition.features||{}).forEach(function(k){ if(ex.found[k]) (K.rubrics&&K.rubrics[k]||[]).forEach(function(rr){add(k,rr);}); });
    });
    return out.slice(0,30);
}
function collectRemedyQuestions(results){
    var K=global.ADX_KNOWLEDGE||{};
    var out=[], seen={};
    results.slice(0,6).forEach(function(r){
        var g=r.condition.group;
        (K.remedyQuestions&&K.remedyQuestions[g]||[]).forEach(function(q){
            var tx=T(q.q); if(seen[tx]) return; seen[tx]=1; out.push(q);
        });
    });
    return out.slice(0,10);
}
function analyze(statement, extraKeys){
    var ex=extractSymptoms(statement, extraKeys||[]);
    var results=scoreConditions(ex);
    var red=collectRedFlags(ex, results);
    return {
        extracted:ex,
        differentials:results.slice(0,20),
        redFlags:red,
        questions:collectQuestions(ex, results),
        tests:collectTests(results, red),
        rubrics:collectRubrics(ex, results),
        remedyQuestions:collectRemedyQuestions(results)
    };
}


// ==================== ADX Phase 2/3: Rubric selection + basic repertorization ====================
var adxChapterCache = {};
var lastRepertoryRows = [];
var lastMatchedRubrics = [];
var lastRepertoryErrors = [];
var adxRemedyAnswers = {};
var adxLastSavedCaseId = null;
function ensureRubricSelection(a){
    if(!a || !a.rubrics) return;
    if(a._rubricSelectionInitialized) return;
    a.rubrics.forEach(function(r, i){ r.selected = i < 18; }); // select the most relevant first 18 by default
    a._rubricSelectionInitialized = true;
}
function selectedRubrics(){
    if(!lastAnalysis || !lastAnalysis.rubrics) return [];
    ensureRubricSelection(lastAnalysis);
    return lastAnalysis.rubrics.filter(function(r){ return r.selected !== false; });
}
function toggleRubric(idx){
    if(!lastAnalysis || !lastAnalysis.rubrics || !lastAnalysis.rubrics[idx]) return;
    lastAnalysis.rubrics[idx].selected = !(lastAnalysis.rubrics[idx].selected !== false);
    var out=$('adxResults'); if(out) out.innerHTML=renderAnalysis(lastAnalysis);
}
function setAllRubrics(state){
    if(!lastAnalysis || !lastAnalysis.rubrics) return;
    lastAnalysis.rubrics.forEach(function(r){ r.selected = !!state; });
    var out=$('adxResults'); if(out) out.innerHTML=renderAnalysis(lastAnalysis);
}
function bookInfo(book){
    if(global.REP_BOOK_INFO && global.REP_BOOK_INFO[book]) return global.REP_BOOK_INFO[book];
    return {
        publicum:{abbr:'Pub',name:'Repertorium Publicum',chapDir:'repertory_chapters/'},
        kent:{abbr:'Kent',name:'Kent English',chapDir:'kent_chapters/'},
        synthesis91:{abbr:'Syn',name:'Synthesis 9.1',chapDir:'synthesis91_raw_chapters/'},
        kent_de:{abbr:'K-DE',name:'Kent German',chapDir:'kent_de_chapters/'}
    }[book] || {abbr:book,name:book,chapDir:''};
}
function openRubricSearch(idx){
    if(!lastAnalysis || !lastAnalysis.rubrics || !lastAnalysis.rubrics[idx]) return;
    var r=lastAnalysis.rubrics[idx];
    try{
        var btn=document.querySelector('[data-page="repertoryBrowser"]');
        if(typeof showPage==='function') showPage('repertoryBrowser', btn);
        setTimeout(function(){
            var sel=$('repBookSelect');
            if(sel){ sel.value=r.book; }
            if(typeof repCurrentBook!=='undefined') global.repCurrentBook=r.book;
            if(typeof switchRepertoryBook==='function') switchRepertoryBook();
            setTimeout(function(){
                if(typeof repSearchMode!=='undefined') global.repSearchMode='book';
                if(typeof updateRepSearchModeUI==='function') updateRepSearchModeUI();
                var inp=$('repBrowserSearch');
                if(inp){ inp.value=r.path; }
                if(typeof searchRepertoryBrowser==='function') searchRepertoryBrowser();
            },350);
        },120);
    }catch(e){ console.error(e); toast('Could not open repertory search','error'); }
}
function normRubric(s){
    return String(s||'').toLowerCase().replace(/[۔،;:()\[\]{}]/g,' ').replace(/\s+-\s+/g,' - ').replace(/[^a-z0-9\-\s]+/g,' ').replace(/\s+/g,' ').trim();
}
function remedyKey(abbr){
    var k=String(abbr||'').toLowerCase().replace(/\.$/,'').trim();
    var aliases={
        'drosera':'dros','drosera.':'dros','bryonia':'bry','belladonna':'bell','arsenicum':'ars','arsenicum-album':'ars',
        'gelsemium':'gels','eupatorium-perfoliatum':'eup-per','rhus-tox':'rhus-t','rhus toxicodendron':'rhus-t',
        'nux vomica':'nux-v','nux-vomica':'nux-v','pulsatilla':'puls','sulphur':'sulph','arnica':'arn'
    };
    return aliases[k] || k;
}
function fetchChapter(book, chapter){
    var key=book+'|'+chapter;
    if(adxChapterCache[key]) return Promise.resolve(adxChapterCache[key]);
    var info=bookInfo(book);
    var url=(info.chapDir||'')+chapter+'.json?v=12';
    return fetch(url).then(function(r){ if(!r.ok) throw new Error(url); return r.json(); }).then(function(d){ adxChapterCache[key]=d; return d; });
}
function scoreRubricMatch(path, query){
    var p=normRubric(path), q=normRubric(query);
    if(!p || !q) return 0;
    if(p===q) return 1000;
    if(p.endsWith(q)) return 850;
    if(p.indexOf(q)!==-1) return 750;
    var words=q.split(/\s+/).filter(function(w){ return w.length>1 && !/^(and|or|the|in|of|to|as|if)$/.test(w); });
    if(!words.length) return 0;
    var hit=0;
    words.forEach(function(w){ if(p.indexOf(w)!==-1) hit++; });
    var ratio=hit/words.length;
    if(ratio>=1) return 650;
    if(ratio>=0.75) return 450;
    if(ratio>=0.5) return 250;
    return 0;
}
function findBestRubric(data, query){
    var best=null, bestScore=0;
    Object.keys(data||{}).forEach(function(rid){
        var rec=data[rid]; if(!rec) return;
        var t=rec.path||rec.de_path||rec.t||'';
        var sc=scoreRubricMatch(t, query);
        if(sc>bestScore){ bestScore=sc; best={rid:rid, rec:rec, path:t, score:sc}; }
    });
    return bestScore>=250 ? best : null;
}
function renderRemedyAnalysis(rows, matchedRubrics, errors){
    var h='';
    h+='<div style="margin-top:10px;padding:10px;border-radius:8px;background:#f4fbf7;border:1px solid #a9dfbf;">';
    h+='<div style="font-weight:bold;color:#145a32;margin-bottom:6px;">💊 '+esc(T({ur:'Repertorization from selected rubrics',en:'Repertorization from selected rubrics',roman:'Repertorization'}))+'</div>';
    if(errors && errors.length){ h+='<div style="font-size:11px;color:#b03a2e;margin-bottom:5px;">⚠️ '+esc(errors.length)+' rubric(s) not found/loaded</div>'; }
    if(!rows.length){
        h+='<div style="color:#95a5a6;font-size:12px;">No remedy result. Select more exact rubrics or open repertory search.</div></div>';
        return h;
    }
    h+='<div style="font-size:11px;color:#566573;margin-bottom:6px;">'+matchedRubrics.length+' matched rubric(s). Score = grade × rubric weight + coverage bonus.</div>';
    h+='<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;background:white;"><thead><tr style="background:#eafaf1;color:#145a32;"><th style="padding:6px;text-align:left;">#</th><th style="padding:6px;text-align:left;">Remedy</th><th style="padding:6px;text-align:left;">Score</th><th style="padding:6px;text-align:left;">Coverage</th><th style="padding:6px;text-align:left;">Matched rubrics</th></tr></thead><tbody>';
    rows.slice(0,25).forEach(function(r,i){
        h+='<tr style="border-bottom:1px solid #eef2f5;"><td style="padding:5px;">'+(i+1)+'</td><td style="padding:5px;font-weight:bold;color:#1a5276;">'+esc(r.display)+'</td><td style="padding:5px;">'+Math.round(r.score)+'</td><td style="padding:5px;">'+r.coverage+'</td><td style="padding:5px;color:#7f8c8d;">'+r.matches.slice(0,4).map(function(m){return esc(m);}).join(' | ')+'</td></tr>';
    });
    h+='</tbody></table></div>';
    h+='<div style="margin-top:8px;font-size:11px;color:#7f8c8d;">'+esc(T({ur:'نوٹ: یہ ابتدائی repertorization ہے۔ Rubrics کو doctor confirm/modify کرے، پھر final remedy differentiation کریں۔',en:'Note: This is preliminary repertorization. Doctor should confirm/modify rubrics before final remedy differentiation.',roman:'Preliminary repertorization.'}))+'</div>';
    h+='</div>';
    return h;
}

function cloneRowsWithDifferentiation(){
    var rows=(lastRepertoryRows||[]).map(function(r){
        return {key:r.key, display:r.display, baseScore:r.score, score:r.score, coverage:r.coverage, matches:(r.matches||[]).slice(), diff:0, reasons:[]};
    });
    var rowByKey={};
    rows.forEach(function(r){ rowByKey[remedyKey(r.key)]=r; rowByKey[remedyKey(r.display)]=r; });
    var qs=(lastAnalysis&&lastAnalysis.remedyQuestions)||[];
    Object.keys(adxRemedyAnswers||{}).forEach(function(i){
        var ans=adxRemedyAnswers[i];
        if(ans==='unknown') return;
        var q=qs[parseInt(i,10)]; if(!q) return;
        function apply(map, sign, label){
            Object.keys(map||{}).forEach(function(k){
                var rk=remedyKey(k), row=rowByKey[rk];
                if(!row) return;
                var val=(parseFloat(map[k])||1)*sign;
                row.score += val;
                row.diff += val;
                row.reasons.push(label+' '+(val>0?'+':'')+val);
            });
        }
        if(ans==='yes'){
            apply(q.supports, 4, 'yes supports');
            apply(q.opposes, -3, 'yes opposes');
        } else if(ans==='no'){
            apply(q.supports, -2, 'no reduces');
            apply(q.opposes, 1, 'no supports opposite');
        }
    });
    rows.sort(function(a,b){return b.score-a.score || b.coverage-a.coverage || a.display.localeCompare(b.display);});
    return rows;
}
function remedyConfidence(rows){
    if(!rows || !rows.length) return {label:'-', cls:'#7f8c8d', note:''};
    var answered=Object.keys(adxRemedyAnswers||{}).filter(function(k){return adxRemedyAnswers[k] && adxRemedyAnswers[k]!=='unknown';}).length;
    var top=rows[0], second=rows[1]||{score:0};
    var gap=top.score-second.score;
    if(answered>=3 && gap>=8) return {label:'High', cls:'#27ae60', note:'clear lead after differentiation'};
    if(answered>=2 && gap>=4) return {label:'Medium', cls:'#f39c12', note:'some differentiation support'};
    return {label:'Low / needs confirmation', cls:'#e67e22', note:'answer more remedy questions'};
}
function renderDifferentiationInteractive(){
    var qs=(lastAnalysis&&lastAnalysis.remedyQuestions)||[];
    if(!lastRepertoryRows.length) return '';
    var adjusted=cloneRowsWithDifferentiation();
    var conf=remedyConfidence(adjusted);
    var h='<div id="adxRemedyDiffInteractive" style="margin-top:10px;padding:10px;border-radius:8px;background:#fffaf0;border:1px solid #f5c16c;">';
    h+='<div style="font-weight:bold;color:#7d6608;margin-bottom:6px;">🎯 '+esc(T({ur:'Interactive remedy differentiation',en:'Interactive remedy differentiation',roman:'Interactive remedy differentiation'}))+'</div>';
    h+='<div style="font-size:12px;margin-bottom:8px;">'+esc(T({ur:'سوالات کے جواب دیں؛ remedies کا score اسی وقت update ہوگا۔',en:'Answer the questions; remedy scores update immediately.',roman:'Jawab dein; remedy score update ho ga.'}))+'</div>';
    if(qs.length){
        qs.forEach(function(q,i){
            var ans=adxRemedyAnswers[i]||'unknown';
            function btn(id,label,color){
                var active=ans===id;
                return '<button type="button" onclick="ADX_answerRemedyQuestion('+i+',\''+id+'\')" style="padding:4px 10px;border:none;border-radius:12px;margin:2px;cursor:pointer;background:'+(active?color:'#ecf0f1')+';color:'+(active?'white':'#2c3e50')+';font-size:11px;font-family:inherit;">'+label+'</button>';
            }
            var supports=q.supports?Object.keys(q.supports).join(', '):'';
            h+='<div style="padding:7px 8px;background:white;border:1px solid #f9e79f;border-radius:6px;margin:5px 0;font-size:12px;">';
            h+='<div><b>'+(i+1)+'.</b> '+esc(T(q.q))+(supports?' <small style="color:#7d6608;">→ '+esc(supports)+'</small>':'')+'</div>';
            h+='<div style="margin-top:4px;">'+btn('yes','✓ Yes','#27ae60')+btn('no','✕ No','#c0392b')+btn('unknown','? Unknown','#7f8c8d')+'</div>';
            h+='</div>';
        });
    } else {
        h+='<div style="color:#7f8c8d;font-size:12px;">No remedy differentiation questions for this case group yet.</div>';
    }
    h+='<div style="margin-top:10px;padding:8px;background:#f8fbff;border:1px solid #d6eaf8;border-radius:6px;">';
    h+='<b>'+esc(T({ur:'Current leading remedy',en:'Current leading remedy',roman:'Current leading remedy'}))+':</b> <span style="font-size:15px;color:#1a5276;font-weight:bold;">'+esc(adjusted[0]?adjusted[0].display:'-')+'</span> ';
    h+='<span style="background:'+conf.cls+';color:white;padding:2px 8px;border-radius:12px;font-size:10px;">'+esc(conf.label)+'</span> <small style="color:#7f8c8d;">'+esc(conf.note)+'</small>';
    h+='</div>';
    h+='<div style="overflow-x:auto;margin-top:8px;"><table style="width:100%;border-collapse:collapse;font-size:12px;background:white;"><thead><tr style="background:#fef5e7;color:#7d6608;"><th style="padding:5px;text-align:left;">#</th><th style="padding:5px;text-align:left;">Remedy</th><th style="padding:5px;text-align:left;">Adjusted</th><th style="padding:5px;text-align:left;">Base</th><th style="padding:5px;text-align:left;">Δ</th><th style="padding:5px;text-align:left;">Why changed</th></tr></thead><tbody>';
    adjusted.slice(0,12).forEach(function(r,i){
        h+='<tr style="border-bottom:1px solid #f4f6f7;"><td style="padding:5px;">'+(i+1)+'</td><td style="padding:5px;font-weight:bold;color:#1a5276;">'+esc(r.display)+'</td><td style="padding:5px;">'+Math.round(r.score)+'</td><td style="padding:5px;">'+Math.round(r.baseScore)+'</td><td style="padding:5px;color:'+(r.diff>=0?'#27ae60':'#c0392b')+';">'+(r.diff>0?'+':'')+Math.round(r.diff)+'</td><td style="padding:5px;color:#7f8c8d;">'+esc((r.reasons||[]).slice(0,3).join(' | '))+'</td></tr>';
    });
    h+='</tbody></table></div>';
    h+='</div>';
    return h;
}
function answerRemedyQuestion(i, ans){
    adxRemedyAnswers[i]=ans||'unknown';
    var box=$('adxRemedyDiffInteractive');
    if(box){ box.outerHTML=renderDifferentiationInteractive(); }
}
function rerenderRemedyAnalysis(){
    var box=$('adxRemedyAnalysis');
    if(box) box.innerHTML=renderRemedyAnalysis(lastRepertoryRows,lastMatchedRubrics,lastRepertoryErrors)+renderDifferentiationInteractive();
}
function analyzeSelectedRubrics(){
    if(!lastAnalysis){ toast('No analysis yet','error'); return; }
    var sel=selectedRubrics();
    var box=$('adxRemedyAnalysis');
    if(!box){ return; }
    if(!sel.length){ box.innerHTML='<div style="color:#e74c3c;font-size:12px;">Select at least one rubric.</div>'; return; }
    box.innerHTML='<div style="padding:10px;background:#fff7e6;border:1px solid #f5c16c;border-radius:8px;font-size:12px;">⏳ '+esc(T({ur:'Selected rubrics سے remedies نکالی جا رہی ہیں...',en:'Analyzing selected rubrics...',roman:'Rubrics analyze ho rahi hain...'}))+'</div>';
    var remedyMap={}, matched=[], errors=[];
    var chain=Promise.resolve();
    sel.forEach(function(r){
        chain=chain.then(function(){
            return fetchChapter(r.book,r.chapter).then(function(data){
                var best=findBestRubric(data,r.path);
                if(!best || !best.rec || !best.rec.r){ errors.push(r.book+'/'+r.chapter+': '+r.path); return; }
                matched.push({suggestion:r, found:best.path, rid:best.rid});
                Object.keys(best.rec.r||{}).forEach(function(abbr){
                    var key=remedyKey(abbr); if(!key) return;
                    var grade=parseInt(best.rec.r[abbr],10)||1;
                    var weight=parseFloat(r.weight)||2;
                    if(!remedyMap[key]) remedyMap[key]={key:key,display:abbr,score:0,coverage:0,matches:[]};
                    remedyMap[key].score += grade*weight;
                    remedyMap[key].coverage += 1;
                    remedyMap[key].matches.push(r.book+': '+best.path+' ('+grade+')');
                });
            }).catch(function(){ errors.push(r.book+'/'+r.chapter+': '+r.path); });
        });
    });
    chain.then(function(){
        var rows=Object.keys(remedyMap).map(function(k){ var x=remedyMap[k]; x.score += x.coverage*1.5; return x; });
        rows.sort(function(a,b){ return b.score-a.score || b.coverage-a.coverage || a.display.localeCompare(b.display); });
        lastRepertoryRows=rows; lastMatchedRubrics=matched; lastRepertoryErrors=errors; adxRemedyAnswers={};
        if(box) box.innerHTML=renderRemedyAnalysis(rows, matched, errors)+renderDifferentiationInteractive();
    });
}

// ==================== ADX Phase 4: Chronic generals, final decision, outcome tracking ====================
function val(id){ var el=$(id); return el ? String(el.value||'').trim() : ''; }
function setVal(id,v){ var el=$(id); if(el) el.value = v || ''; }
function collectCaseDetails(){
    return {
        thermal: val('adxThermal'), thirst: val('adxThirst'), appetite: val('adxAppetite'), cravings: val('adxCravings'), aversions: val('adxAversions'),
        sleep: val('adxSleep'), dreams: val('adxDreams'), mind: val('adxMind'), perspiration: val('adxPerspiration'), stool: val('adxStool'), urine: val('adxUrine'),
        miasm: val('adxMiasm'), generalsNotes: val('adxGeneralsNotes')
    };
}
function caseDetailsText(details){
    details = details || collectCaseDetails();
    var labels={thermal:'Thermal',thirst:'Thirst',appetite:'Appetite',cravings:'Cravings',aversions:'Aversions',sleep:'Sleep',dreams:'Dreams',mind:'Mind',perspiration:'Perspiration',stool:'Stool',urine:'Urine',miasm:'Miasm',generalsNotes:'Generals notes'};
    var arr=[];
    Object.keys(labels).forEach(function(k){ if(details[k]) arr.push(labels[k]+': '+details[k]); });
    return arr.join('; ');
}
function injectCaseDetailsPanel(){
    var ta=$('adxStatement');
    if(!ta || $('adxCaseDetailsPanel')) return;
    var div=document.createElement('div');
    div.id='adxCaseDetailsPanel';
    div.style.cssText='margin-top:10px;border:1px solid #d6eaf8;background:#fbfdff;border-radius:8px;padding:10px;';
    div.innerHTML = ''+
    '<details><summary style="cursor:pointer;font-weight:bold;color:#1a5276;">🧬 '+esc(T({ur:'Constitutional / generals / chronic details',en:'Constitutional / generals / chronic details',roman:'Generals / chronic details'}))+'</summary>'+
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;margin-top:10px;font-size:12px;">'+
    fieldHtml('adxThermal','Thermal','Hot / chilly / mixed')+
    fieldHtml('adxThirst','Thirst','Thirsty / thirstless / sips')+
    fieldHtml('adxAppetite','Appetite','low / normal / increased')+
    fieldHtml('adxCravings','Cravings','sweets, salt, sour...')+
    fieldHtml('adxAversions','Aversions','milk, eggs, meat...')+
    fieldHtml('adxSleep','Sleep','position, quality, time')+
    fieldHtml('adxDreams','Dreams','recurrent dreams')+
    fieldHtml('adxMind','Mind/emotions','fear, anger, grief, anxiety')+
    fieldHtml('adxPerspiration','Perspiration','amount, smell, location')+
    fieldHtml('adxStool','Stool generals','constipation/diarrhea pattern')+
    fieldHtml('adxUrine','Urine generals','burning/frequency/color')+
    fieldHtml('adxMiasm','Miasmatic tendency','psoric/sycotic/syphilitic/tubercular')+
    '</div><textarea id="adxGeneralsNotes" style="width:100%;min-height:48px;margin-top:8px;border:1px solid #d6eaf8;border-radius:6px;padding:7px;font-family:inherit;font-size:12px;" placeholder="Other generals, modalities, past history, family history..."></textarea>'+
    '</details>';
    ta.insertAdjacentElement('afterend', div);
}
function fieldHtml(id,label,ph){
    return '<label style="display:block;"><span style="font-weight:bold;color:#566573;">'+esc(label)+'</span><input id="'+id+'" type="text" placeholder="'+esc(ph)+'" style="width:100%;padding:6px;border:1px solid #d6eaf8;border-radius:6px;font-family:inherit;font-size:12px;box-sizing:border-box;"></label>';
}
function getAdjustedRows(){
    return lastRepertoryRows && lastRepertoryRows.length ? cloneRowsWithDifferentiation() : [];
}
function topRemedy(){
    var rows=getAdjustedRows();
    return rows.length ? rows[0] : null;
}
function getFinalDecision(){
    var topDx = lastAnalysis && lastAnalysis.differentials && lastAnalysis.differentials[0] ? T(lastAnalysis.differentials[0].condition.name) : '';
    var tr=topRemedy();
    return {
        diagnosis: val('adxFinalDiagnosis') || topDx,
        remedy: val('adxFinalRemedy') || (tr ? tr.display : ''),
        confidence: val('adxFinalConfidence') || '',
        notes: val('adxFinalNotes') || '',
        testsDone: val('adxTestsDone') || ''
    };
}
function getOutcome(){
    return {
        response: val('adxOutcomeResponse'), percent: val('adxOutcomePercent'), remedyResponse: val('adxOutcomeRemedyResponse'),
        newSymptoms: val('adxOutcomeNewSymptoms'), plan: val('adxOutcomePlan'), followupDate: val('adxFollowupDate')
    };
}
function storageGet(key){ try{return JSON.parse(localStorage.getItem(key)||'[]');}catch(e){return [];} }
function storageSet(key,val){ try{localStorage.setItem(key, JSON.stringify(val));}catch(e){ console.error(e); } }
function currentPatientHint(){
    var names=[];
    ['diagnosisPatientName','nvPatientName'].forEach(function(id){ var el=$(id); if(el && el.textContent) names.push(el.textContent.trim()); });
    if($('patientName') && $('patientName').value) names.push($('patientName').value.trim());
    return names[0] || '';
}
function finalCaseRecord(kind){
    var adjusted=getAdjustedRows();
    var fd=getFinalDecision();
    var out=getOutcome();
    return {
        id: adxLastSavedCaseId || ('adx_'+Date.now()+'_'+Math.random().toString(36).slice(2,7)),
        kind: kind || 'case', savedAt: new Date().toISOString(), patient: currentPatientHint(),
        statement: val('adxStatement'), extracted: lastAnalysis ? Object.keys(lastAnalysis.extracted.found||{}).map(symptomName) : [],
        redFlags: lastAnalysis ? (lastAnalysis.redFlags||[]).map(function(r){return r.label+' - '+r.reason;}) : [],
        differentials: lastAnalysis ? (lastAnalysis.differentials||[]).slice(0,8).map(function(r){return {id:r.condition.id, name:T(r.condition.name), percentage:r.percentage, severity:r.condition.severity};}) : [],
        selectedRubrics: selectedRubrics().map(function(r){return {book:r.book, chapter:r.chapter, path:r.path, symptom:r.symptom, weight:r.weight};}),
        topRemedies: adjusted.slice(0,10).map(function(r){return {remedy:r.display, score:Math.round(r.score), base:Math.round(r.baseScore||r.score), coverage:r.coverage};}),
        remedyAnswers: Object.assign({}, adxRemedyAnswers),
        finalDecision: fd, outcome: out, generals: collectCaseDetails()
    };
}
function saveFinalCase(){
    if(!lastAnalysis){ toast('No analysis yet','error'); return; }
    var rec=finalCaseRecord('final_decision');
    adxLastSavedCaseId=rec.id;
    var arr=storageGet('adx_case_records');
    var idx=arr.findIndex(function(x){return x.id===rec.id;});
    if(idx>=0) arr[idx]=rec; else arr.unshift(rec);
    storageSet('adx_case_records', arr.slice(0,300));
    copyFinalToVisit(false);
    toast('✅ Final diagnosis/remedy saved locally and copied to visit fields');
    var sim=$('adxSimilarCases'); if(sim) sim.innerHTML=renderSimilarCases();
}
function saveOutcome(){
    if(!lastAnalysis){ toast('No analysis yet','error'); return; }
    var rec=finalCaseRecord('followup_outcome');
    var arr=storageGet('adx_outcome_records'); arr.unshift(rec); storageSet('adx_outcome_records', arr.slice(0,300));
    toast('✅ Follow-up outcome saved locally');
    var sim=$('adxSimilarCases'); if(sim) sim.innerHTML=renderSimilarCases();
}
function finalSummaryText(){
    if(!lastAnalysis) return '';
    var fd=getFinalDecision(), out=getOutcome(), gen=caseDetailsText();
    var txt=finalSummaryText ? finalSummaryText() : summaryText(lastAnalysis);
    txt += '\n\nFINAL DECISION\nDiagnosis: '+(fd.diagnosis||'')+'\nRemedy: '+(fd.remedy||'')+'\nConfidence: '+(fd.confidence||'')+'\nNotes: '+(fd.notes||'');
    if(gen) txt += '\n\nGENERALS\n'+gen;
    if(out.response || out.percent || out.newSymptoms || out.plan){ txt += '\n\nFOLLOW-UP / OUTCOME\nResponse: '+(out.response||'')+' '+(out.percent||'')+'%\nRemedy response: '+(out.remedyResponse||'')+'\nNew symptoms: '+(out.newSymptoms||'')+'\nPlan: '+(out.plan||''); }
    return txt;
}
function copyFinalToVisit(showMsg){
    if(!lastAnalysis){ toast('No analysis yet','error'); return; }
    var fd=getFinalDecision(), txt=finalSummaryText();
    var dx = fd.diagnosis || (lastAnalysis.differentials[0] ? T(lastAnalysis.differentials[0].condition.name) : '');
    var rx = fd.remedy ? ('Suggested / final remedy: '+fd.remedy+'\nConfidence: '+(fd.confidence||'')+'\n'+(fd.notes||'')) : '';
    if($('nvDiagnosis')) $('nvDiagnosis').value = dx;
    if($('firstVisitDiagnosis')) $('firstVisitDiagnosis').value = dx;
    if(rx && $('nvPrescription')) $('nvPrescription').value = (($('nvPrescription').value||'')+'\n'+rx).trim();
    if(rx && $('firstVisitPrescription')) $('firstVisitPrescription').value = (($('firstVisitPrescription').value||'')+'\n'+rx).trim();
    if($('nvNotes')) $('nvNotes').value = (($('nvNotes').value||'')+'\n\n'+txt).trim();
    if($('firstVisitMethod')) $('firstVisitMethod').value = (($('firstVisitMethod').value||'')+'\n\n'+txt).trim();
    if(showMsg!==false) toast('✅ Final decision copied to visit fields');
}
function rubricOverlap(a,b){
    var A=(a.selectedRubrics||[]).map(function(r){return (r.book+'|'+r.chapter+'|'+r.path).toLowerCase();});
    var B=(b.selectedRubrics||[]).map(function(r){return (r.book+'|'+r.chapter+'|'+r.path).toLowerCase();});
    var set={}; A.forEach(function(x){set[x]=1;});
    var hit=0; B.forEach(function(x){ if(set[x]) hit++; });
    return hit;
}
function renderSimilarCases(){
    if(!lastAnalysis) return '';
    var cur=finalCaseRecord('compare');
    var cases=storageGet('adx_case_records').concat(storageGet('adx_outcome_records'));
    cases=cases.filter(function(c){return c.id!==cur.id;}).map(function(c){
        var dxHit=0;
        (cur.differentials||[]).slice(0,5).forEach(function(d){ (c.differentials||[]).slice(0,5).forEach(function(cd){ if(cd.id===d.id) dxHit+=2; }); });
        var symHit=0, ss={}; (cur.extracted||[]).forEach(function(x){ss[x]=1;}); (c.extracted||[]).forEach(function(x){ if(ss[x]) symHit++; });
        var rub=rubricOverlap(cur,c);
        c._sim=dxHit+symHit+rub*2;
        return c;
    }).filter(function(c){return c._sim>0;}).sort(function(a,b){return b._sim-a._sim;}).slice(0,5);
    if(!cases.length) return '<div style="color:#7f8c8d;font-size:12px;">No similar saved cases yet. Cases will appear here after you save final decisions/outcomes.</div>';
    var h='<div style="font-size:12px;">';
    cases.forEach(function(c){
        h+='<div style="padding:7px;background:white;border:1px solid #e5e8e8;border-radius:6px;margin:4px 0;">';
        h+='<b>'+esc((c.finalDecision&&c.finalDecision.diagnosis)||((c.differentials&&c.differentials[0]&&c.differentials[0].name)||'Case'))+'</b> — '+esc((c.finalDecision&&c.finalDecision.remedy)||'')+' <small style="color:#7f8c8d;">'+esc((c.savedAt||'').slice(0,10))+' | sim '+c._sim+'</small>';
        if(c.outcome && (c.outcome.response||c.outcome.percent)) h+='<div style="color:#27ae60;">Outcome: '+esc(c.outcome.response||'')+' '+esc(c.outcome.percent||'')+'%</div>';
        h+='</div>';
    });
    h+='</div>';
    return h;
}
function renderFinalDecisionPanel(a){
    var topDx=a.differentials&&a.differentials[0]?T(a.differentials[0].condition.name):'';
    var tr=topRemedy();
    var today=(new Date()).toISOString().split('T')[0];
    var h='<div class="disease-section"><div class="disease-section-title">✅ '+esc(T({ur:'Doctor final decision + follow-up tracking',en:'Doctor final decision + follow-up tracking',roman:'Final decision + follow-up'}))+'</div>';
    h+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px;">';
    h+='<label><b>Final diagnosis</b><input id="adxFinalDiagnosis" value="'+esc(topDx)+'" style="width:100%;padding:6px;border:1px solid #ddd;border-radius:6px;"></label>';
    h+='<label><b>Final remedy</b><input id="adxFinalRemedy" value="'+esc(tr?tr.display:'')+'" placeholder="e.g. Bry, Gels" style="width:100%;padding:6px;border:1px solid #ddd;border-radius:6px;"></label>';
    h+='<label><b>Confidence</b><select id="adxFinalConfidence" style="width:100%;padding:6px;border:1px solid #ddd;border-radius:6px;"><option></option><option>High</option><option>Medium</option><option>Low</option><option>Needs tests</option></select></label>';
    h+='<label><b>Tests done / results</b><input id="adxTestsDone" placeholder="CBC, platelets, BP..." style="width:100%;padding:6px;border:1px solid #ddd;border-radius:6px;"></label>';
    h+='</div><textarea id="adxFinalNotes" placeholder="Doctor notes / why final diagnosis or remedy selected..." style="width:100%;min-height:45px;margin-top:8px;padding:7px;border:1px solid #ddd;border-radius:6px;font-family:inherit;"></textarea>';
    h+='<details style="margin-top:10px;"><summary style="cursor:pointer;font-weight:bold;color:#1a5276;">📈 Follow-up / outcome</summary>';
    h+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;margin-top:8px;">';
    h+='<label><b>Response</b><select id="adxOutcomeResponse" style="width:100%;padding:6px;border:1px solid #ddd;border-radius:6px;"><option></option><option>Better</option><option>Same</option><option>Worse</option><option>New symptoms</option></select></label>';
    h+='<label><b>Improvement %</b><input id="adxOutcomePercent" type="number" min="0" max="100" placeholder="0-100" style="width:100%;padding:6px;border:1px solid #ddd;border-radius:6px;"></label>';
    h+='<label><b>Remedy response</b><select id="adxOutcomeRemedyResponse" style="width:100%;padding:6px;border:1px solid #ddd;border-radius:6px;"><option></option><option>Good response</option><option>Partial response</option><option>No response</option><option>Aggravation</option><option>Adverse effect</option></select></label>';
    h+='<label><b>Next follow-up</b><input id="adxFollowupDate" type="date" value="'+today+'" style="width:100%;padding:6px;border:1px solid #ddd;border-radius:6px;"></label>';
    h+='</div><textarea id="adxOutcomeNewSymptoms" placeholder="New symptoms / changed symptoms..." style="width:100%;min-height:42px;margin-top:8px;padding:7px;border:1px solid #ddd;border-radius:6px;font-family:inherit;"></textarea>';
    h+='<textarea id="adxOutcomePlan" placeholder="Follow-up plan / repeat / wait / change remedy / tests..." style="width:100%;min-height:42px;margin-top:6px;padding:7px;border:1px solid #ddd;border-radius:6px;font-family:inherit;"></textarea>';
    h+='</details>';
    h+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;"><button class="btn btn-success btn-sm" type="button" onclick="ADX_saveFinalCase()">💾 Save final decision</button><button class="btn btn-info btn-sm" type="button" onclick="ADX_saveOutcome()">📈 Save outcome</button><button class="btn btn-purple btn-sm" type="button" onclick="ADX_copyFinalToVisit()">🩺 Copy final to visit</button><button class="btn btn-light btn-sm" type="button" onclick="ADX_copyFinalSummary()">📋 Copy final summary</button></div>';
    h+='<div style="margin-top:10px;"><div style="font-weight:bold;color:#1a5276;margin-bottom:4px;">🗂 Similar saved cases / learning hints</div><div id="adxSimilarCases">'+renderSimilarCases()+'</div></div>';
    h+='</div>';
    return h;
}
function copyFinalSummary(){
    if(!lastAnalysis){ toast('No analysis yet','error'); return; }
    var txt=finalSummaryText();
    if(navigator.clipboard) navigator.clipboard.writeText(txt).then(function(){toast('✅ Final summary copied');}); else window.prompt('Copy',txt);
}

function renderAnalysis(a){
    var K=global.ADX_KNOWLEDGE||{};
    var h='';
    var red=a.redFlags||[];
    h+='<div class="card" style="border-top:4px solid '+(red.length?'#e74c3c':'#27ae60')+';">';
    h+='<div class="card-title">🧠 '+esc(T({ur:'Advanced Diagnosis Result',en:'Advanced Diagnosis Result',roman:'Advanced Diagnosis Result'}))+'</div>';
    h+='<div style="font-size:12px;color:#7f8c8d;margin-bottom:8px;">'+esc(T({ur:'یہ clinical decision support ہے؛ final decision ڈاکٹر کریں۔',en:'Clinical decision support only; final decision by physician.',roman:'Clinical decision support only.'}))+'</div>';
    if(red.length){
        h+='<div class="emergency-alert" style="margin-bottom:12px;">⚠️ '+esc(T({ur:'Red flags / urgent possibilities detected. پہلے safety اور referral rule out کریں۔',en:'Red flags / urgent possibilities detected. Rule out safety/referral first.',roman:'Red flags detected.'}))+'</div>';
        red.slice(0,8).forEach(function(r){ h+='<div style="background:#fff5f5;border:1px solid #f5b7b1;border-radius:6px;padding:6px 9px;margin:4px 0;font-size:12px;"><b>'+esc(r.label)+'</b> — '+esc(r.reason)+'</div>'; });
    } else {
        h+='<div style="background:#eafaf1;border:1px solid #a9dfbf;border-radius:6px;padding:8px;margin-bottom:12px;font-size:12px;">✅ '+esc(T({ur:'فی الحال statement میں obvious emergency red flag نہیں ملا۔ پھر بھی vitals/exam ضروری ہیں۔',en:'No obvious emergency red flag in statement. Vitals/exam still required.',roman:'Obvious red flag nahi mila.'}))+'</div>';
    }
    var found=Object.keys(a.extracted.found||{}).filter(function(k){return K.symptoms&&K.symptoms[k];});
    h+='<div class="disease-section"><div class="disease-section-title">🧩 '+esc(T({ur:'Extracted symptoms',en:'Extracted symptoms',roman:'Extracted symptoms'}))+'</div>';
    if(a.extracted.duration) h+='<span class="test-item">Duration: '+esc(a.extracted.duration.label)+'</span> ';
    if(a.extracted.temperature!==null) h+='<span class="test-item">Temp: '+esc(a.extracted.temperature)+'°F</span> ';
    if(found.length){ found.slice(0,45).forEach(function(k){ h+='<span class="selected-chip" style="display:inline-block;margin:2px;">'+esc(symptomName(k))+'</span>'; }); }
    else h+='<span style="color:#95a5a6;">No structured symptom detected — add more detail.</span>';
    h+='</div>';

    h+='<div class="disease-section"><div class="disease-section-title">🔬 '+esc(T({ur:'Possible clinical differentials',en:'Possible clinical differentials',roman:'Possible clinical differentials'}))+'</div>';
    if(!a.differentials.length) h+='<div class="empty-state"><p>No match. Please enter more symptoms.</p></div>';
    a.differentials.slice(0,12).forEach(function(r,idx){
        var c=r.condition, cls=r.condition.severity==='emergency'?'#e74c3c':(r.condition.severity==='urgent'?'#f39c12':'#2980b9');
        h+='<div class="disease-card '+(r.confidence==='high'?'high-match':(r.confidence==='medium'?'medium-match':'low-match'))+'" style="border-right-color:'+cls+';">';
        h+='<div class="disease-header"><div class="disease-name">'+(idx+1)+'. '+esc(T(c.name))+'</div><span class="match-badge '+(r.confidence==='high'?'high':(r.confidence==='medium'?'medium':'low'))+'">'+r.percentage+'%</span></div>';
        h+='<div style="font-size:11px;color:#7f8c8d;">'+esc(c.group)+' | '+esc(c.severity||'routine')+'</div>';
        h+='<div style="font-size:12px;margin-top:5px;"><b>Matched:</b> '+r.matched.map(function(m){return esc(symptomName(m.key));}).join('، ')+'</div>';
        if(r.missing.length) h+='<div style="font-size:12px;color:#7f8c8d;"><b>Ask/missing:</b> '+r.missing.slice(0,5).map(function(m){return esc(symptomName(m.key));}).join('، ')+'</div>';
        h+='</div>';
    });
    h+='</div>';

    h+='<div class="disease-section"><div class="disease-section-title">❓ '+esc(T({ur:'Next best questions',en:'Next best questions',roman:'Next best questions'}))+'</div>';
    a.questions.slice(0,12).forEach(function(q,i){ h+='<div style="padding:6px 8px;background:#f8f9fa;border-radius:5px;margin:3px 0;font-size:12px;">'+(i+1)+'. '+esc(q.q)+' <small style="color:#7f8c8d;">('+esc(q.why)+')</small></div>'; });
    h+='</div>';

    h+='<div class="disease-section"><div class="disease-section-title">🧪 '+esc(T({ur:'Suggested tests / checks',en:'Suggested tests / checks',roman:'Suggested tests'}))+'</div>';
    a.tests.slice(0,16).forEach(function(t){ h+='<div style="display:inline-block;margin:2px;padding:5px 8px;border-radius:12px;background:#e8f4f8;font-size:11px;"><b>'+esc(t.priority)+':</b> '+esc(t.test)+'</div>'; });
    h+='</div>';

    ensureRubricSelection(a);
    h+='<div class="disease-section"><div class="disease-section-title">📚 '+esc(T({ur:'Suggested repertory rubrics',en:'Suggested repertory rubrics',roman:'Suggested repertory rubrics'}))+'</div>';
    if(!a.rubrics.length) h+='<div style="color:#95a5a6;font-size:12px;">No rubric suggestions yet.</div>';
    if(a.rubrics.length){
        h+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;"><button class="btn btn-success btn-sm" type="button" onclick="ADX_analyzeSelectedRubrics()">💊 '+esc(T({ur:'Selected rubrics سے remedies نکالیں',en:'Analyze selected rubrics',roman:'Selected rubrics analyze'}))+'</button><button class="btn btn-light btn-sm" type="button" onclick="ADX_setAllRubrics(true)">✓ All</button><button class="btn btn-light btn-sm" type="button" onclick="ADX_setAllRubrics(false)">✕ None</button></div>';
    }
    a.rubrics.slice(0,30).forEach(function(r,i){
        var checked = r.selected !== false ? ' checked' : '';
        h+='<div style="padding:6px 8px;background:#fff;border:1px solid #eef2f5;border-radius:6px;margin:3px 0;font-size:12px;display:flex;gap:7px;align-items:flex-start;flex-wrap:wrap;"><label style="display:flex;gap:5px;align-items:center;"><input type="checkbox" onchange="ADX_toggleRubric('+i+')"'+checked+'> <b>'+esc(r.book)+'</b></label><span>/ '+esc(r.chapter)+' — '+esc(r.path)+' <small style="color:#7f8c8d;">['+esc(symptomName(r.symptom))+']</small></span><button class="btn btn-info btn-xs" type="button" onclick="ADX_openRubricSearch('+i+')">🔍 '+esc(T({ur:'اوپن/سرچ',en:'Open/Search',roman:'Open/Search'}))+'</button></div>';
    });
    h+='<div id="adxRemedyAnalysis"></div>';
    h+='</div>';

    h+='<div class="disease-section"><div class="disease-section-title">💊 '+esc(T({ur:'Remedy differentiation questions',en:'Remedy differentiation questions',roman:'Remedy differentiation'}))+'</div>';
    if(!a.remedyQuestions.length) h+='<div style="color:#95a5a6;font-size:12px;">Select/confirm rubrics to generate remedy differentiation.</div>';
    a.remedyQuestions.forEach(function(q,i){
        var supp=q.supports?Object.keys(q.supports).join(', '):'';
        h+='<div style="padding:7px 9px;background:#fef9e7;border:1px solid #f9e79f;border-radius:6px;margin:4px 0;font-size:12px;">'+(i+1)+'. '+esc(T(q.q))+(supp?' <small style="color:#7d6608;">→ '+esc(supp)+'</small>':'')+'</div>';
    });
    h+='</div>';

    h+=renderFinalDecisionPanel(a);
    h+='<div class="action-buttons" style="margin-top:12px;"><button class="btn btn-info btn-sm" onclick="ADX_copySummary()">📋 Copy Summary</button><button class="btn btn-success btn-sm" onclick="ADX_copyToVisit()">🩺 Copy to Visit Fields</button></div>';
    h+='</div>';
    return h;
}
function summaryText(a){
    var lines=[];
    lines.push('Advanced Diagnosis Support Summary');
    if(a.redFlags.length){ lines.push('\nRED FLAGS:'); a.redFlags.forEach(function(r){ lines.push('- '+r.label+' — '+r.reason); }); }
    lines.push('\nExtracted symptoms: '+Object.keys(a.extracted.found||{}).map(symptomName).join(', '));
    lines.push('\nPossible differentials:');
    a.differentials.slice(0,10).forEach(function(r,i){ lines.push((i+1)+'. '+T(r.condition.name)+' ('+r.percentage+'%)'); });
    lines.push('\nSuggested tests:'); a.tests.slice(0,12).forEach(function(t){ lines.push('- '+t.priority+': '+t.test); });
    lines.push('\nSuggested rubrics:'); a.rubrics.slice(0,16).forEach(function(r){ lines.push('- '+r.book+'/'+r.chapter+': '+r.path); });
    return lines.join('\n');
}

var lastAnalysis=null;
function runUI(){
    var ta=$('adxStatement');
    if(!ta){ toast('Advanced diagnosis input not found','error'); return; }
    var text=ta.value.trim();
    if(text.length<5){ toast(T({ur:'براہ کرم مریض کی علامات لکھیں',en:'Please enter patient symptoms',roman:'Alamat likhein'}),'error'); return; }
    var extra=[];
    try{
        if(global.selectedSymptoms && global.SYMPTOMS_DB){
            global.selectedSymptoms.forEach(function(k){
                var s=global.SYMPTOMS_DB[k];
                if(s){ text += ' '+(s.en||'')+' '+(s.ur||''); }
            });
        }
    }catch(e){}
    var details=collectCaseDetails();
    var genText=caseDetailsText(details);
    if(genText) text += '\nGenerals: '+genText;
    lastAnalysis=analyze(text, extra);
    lastAnalysis.caseDetails=details;
    adxLastSavedCaseId=null;
    lastRepertoryRows=[]; lastMatchedRubrics=[]; lastRepertoryErrors=[]; adxRemedyAnswers={};
    var out=$('adxResults');
    if(out){ out.innerHTML=renderAnalysis(lastAnalysis); out.scrollIntoView({behavior:'smooth', block:'start'}); }
}
function clearUI(){
    if($('adxStatement')) $('adxStatement').value='';
    if($('adxResults')) $('adxResults').innerHTML='';
    lastAnalysis=null; lastRepertoryRows=[]; lastMatchedRubrics=[]; lastRepertoryErrors=[]; adxRemedyAnswers={}; adxLastSavedCaseId=null;
}
function copySummary(){
    if(!lastAnalysis){ toast('No analysis yet','error'); return; }
    var txt=summaryText(lastAnalysis);
    if(navigator.clipboard) navigator.clipboard.writeText(txt).then(function(){toast('✅ Copied');});
    else { window.prompt('Copy',txt); }
}
function copyToVisit(){
    if(!lastAnalysis){ toast('No analysis yet','error'); return; }
    if(val('adxFinalDiagnosis') || val('adxFinalRemedy')){ copyFinalToVisit(false); }
    var dx=lastAnalysis.differentials.slice(0,5).map(function(r,i){return (i+1)+'. '+T(r.condition.name)+' '+r.percentage+'%';}).join('\n');
    var sx=Object.keys(lastAnalysis.extracted.found||{}).map(symptomName).join(', ');
    var tests=lastAnalysis.tests.slice(0,10).map(function(t){return t.priority+': '+t.test;}).join('\n');
    var rubs=lastAnalysis.rubrics.slice(0,12).map(function(r){return r.book+'/'+r.chapter+': '+r.path;}).join('\n');
    if($('nvSymptoms')) $('nvSymptoms').value = sx;
    if($('nvDiagnosis')) $('nvDiagnosis').value = dx;
    if($('nvNotes')) $('nvNotes').value = (($('nvNotes').value||'')+'\n\nSuggested tests:\n'+tests+'\n\nSuggested rubrics:\n'+rubs).trim();
    if($('firstVisitSymptoms')) $('firstVisitSymptoms').value = sx;
    if($('firstVisitDiagnosis')) $('firstVisitDiagnosis').value = dx;
    toast('✅ Copied to available visit fields');
}


function openFromField(fieldId){
    var src=$(fieldId);
    var text=src ? (src.value||'').trim() : '';
    if(!text){ toast(T({ur:'پہلے علامات لکھیں',en:'Enter symptoms first',roman:'Pehle alamat likhein'}),'error'); return; }
    try{
        var btn=document.querySelector('[data-page="diagnosis"]');
        if(typeof showPage==='function') showPage('diagnosis', btn);
    }catch(e){}
    setTimeout(function(){
        var ta=$('adxStatement');
        if(ta){ ta.value=text; runUI(); }
    },250);
}
function injectDxButtons(){
    [
        {id:'firstVisitSymptoms', label:{ur:'🧠 ایڈوانس تشخیص',en:'🧠 Advanced Dx',roman:'🧠 Advanced Dx'}},
        {id:'nvSymptoms', label:{ur:'🧠 ایڈوانس تشخیص',en:'🧠 Advanced Dx',roman:'🧠 Advanced Dx'}}
    ].forEach(function(x){
        var el=$(x.id); if(!el || el._adxBtnAdded) return;
        var wrap=document.createElement('div');
        wrap.style.cssText='margin-top:5px;display:flex;gap:6px;justify-content:flex-end;';
        var b=document.createElement('button');
        b.type='button'; b.className='btn btn-purple btn-sm'; b.style.fontSize='11px';
        b.textContent=T(x.label);
        b.onclick=function(){ openFromField(x.id); };
        wrap.appendChild(b);
        el.insertAdjacentElement('afterend',wrap);
        el._adxBtnAdded=true;
    });
}
function bind(){
    injectCaseDetailsPanel();
    injectDxButtons();
    var b=$('adxAnalyzeBtn'); if(b && !b._adxBound){ b.addEventListener('click',runUI); b._adxBound=true; }
    var c=$('adxClearBtn'); if(c && !c._adxBound){ c.addEventListener('click',clearUI); c._adxBound=true; }
    var ta=$('adxStatement'); if(ta && !ta._adxBound){
        ta.addEventListener('keydown',function(e){ if((e.ctrlKey||e.metaKey) && e.key==='Enter') runUI(); });
        ta._adxBound=true;
    }
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind); else setTimeout(bind,0);
setTimeout(bind,800); // pages are already in DOM, but this guards delayed rendering

global.ADX_ENGINE={analyze:analyze, renderAnalysis:renderAnalysis, extractSymptoms:extractSymptoms, scoreConditions:scoreConditions};
global.ADX_run=runUI;
global.ADX_clear=clearUI;
global.ADX_copySummary=copySummary;
global.ADX_copyToVisit=copyToVisit;
global.ADX_toggleRubric=toggleRubric;
global.ADX_setAllRubrics=setAllRubrics;
global.ADX_openRubricSearch=openRubricSearch;
global.ADX_analyzeSelectedRubrics=analyzeSelectedRubrics;
global.ADX_answerRemedyQuestion=answerRemedyQuestion;
global.ADX_openFromField=openFromField;
global.ADX_injectDxButtons=injectDxButtons;
global.ADX_saveFinalCase=saveFinalCase;
global.ADX_saveOutcome=saveOutcome;
global.ADX_copyFinalToVisit=copyFinalToVisit;
global.ADX_copyFinalSummary=copyFinalSummary;
global.ADX_collectCaseDetails=collectCaseDetails;

})(window);
