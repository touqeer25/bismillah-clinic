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

    h+='<div class="disease-section"><div class="disease-section-title">📚 '+esc(T({ur:'Suggested repertory rubrics',en:'Suggested repertory rubrics',roman:'Suggested repertory rubrics'}))+'</div>';
    if(!a.rubrics.length) h+='<div style="color:#95a5a6;font-size:12px;">No rubric suggestions yet.</div>';
    a.rubrics.slice(0,24).forEach(function(r){
        h+='<div style="padding:6px 8px;background:#fff;border:1px solid #eef2f5;border-radius:6px;margin:3px 0;font-size:12px;"><b>'+esc(r.book)+'</b> / '+esc(r.chapter)+' — '+esc(r.path)+' <small style="color:#7f8c8d;">['+esc(symptomName(r.symptom))+']</small></div>';
    });
    h+='</div>';

    h+='<div class="disease-section"><div class="disease-section-title">💊 '+esc(T({ur:'Remedy differentiation questions',en:'Remedy differentiation questions',roman:'Remedy differentiation'}))+'</div>';
    if(!a.remedyQuestions.length) h+='<div style="color:#95a5a6;font-size:12px;">Select/confirm rubrics to generate remedy differentiation.</div>';
    a.remedyQuestions.forEach(function(q,i){
        var supp=q.supports?Object.keys(q.supports).join(', '):'';
        h+='<div style="padding:7px 9px;background:#fef9e7;border:1px solid #f9e79f;border-radius:6px;margin:4px 0;font-size:12px;">'+(i+1)+'. '+esc(T(q.q))+(supp?' <small style="color:#7d6608;">→ '+esc(supp)+'</small>':'')+'</div>';
    });
    h+='</div>';

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
    lastAnalysis=analyze(text, extra);
    var out=$('adxResults');
    if(out){ out.innerHTML=renderAnalysis(lastAnalysis); out.scrollIntoView({behavior:'smooth', block:'start'}); }
}
function clearUI(){
    if($('adxStatement')) $('adxStatement').value='';
    if($('adxResults')) $('adxResults').innerHTML='';
    lastAnalysis=null;
}
function copySummary(){
    if(!lastAnalysis){ toast('No analysis yet','error'); return; }
    var txt=summaryText(lastAnalysis);
    if(navigator.clipboard) navigator.clipboard.writeText(txt).then(function(){toast('✅ Copied');});
    else { window.prompt('Copy',txt); }
}
function copyToVisit(){
    if(!lastAnalysis){ toast('No analysis yet','error'); return; }
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

function bind(){
    var b=$('adxAnalyzeBtn'); if(b && !b._adxBound){ b.addEventListener('click',runUI); b._adxBound=true; }
    var c=$('adxClearBtn'); if(c && !c._adxBound){ c.addEventListener('click',clearUI); c._adxBound=true; }
    var ta=$('adxStatement'); if(ta && !ta._adxBound){
        ta.addEventListener('keydown',function(e){ if((e.ctrlKey||e.metaKey) && e.key==='Enter') runUI(); });
        ta._adxBound=true;
    }
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind); else setTimeout(bind,0);

global.ADX_ENGINE={analyze:analyze, renderAnalysis:renderAnalysis, extractSymptoms:extractSymptoms, scoreConditions:scoreConditions};
global.ADX_run=runUI;
global.ADX_clear=clearUI;
global.ADX_copySummary=copySummary;
global.ADX_copyToVisit=copyToVisit;

})(window);
