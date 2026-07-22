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

// ==================== ADX Phase 9: Specialty-specific clinical scoring ====================
var ADX_SPECIALTY_SCORING = {
    fever:{
        focus:['viral_fever','dengue_fever','severe_dengue','malaria','typhoid','influenza','covid_like_viral','chikungunya','measles','sepsis','meningitis','pyelonephritis'],
        boost:{
            dengue_fever:{retro_orbital_pain:10,rash:7,bleeding:12,low_urine:6,bone_pain:6,body_ache:3},
            severe_dengue:{bleeding:15,low_urine:10,severe_abdominal_pain:10,persistent_vomiting:10,confusion:10,fainting:10},
            malaria:{chills:12,sweat:6,body_ache:2,vomiting:2},
            typhoid:{abdominal_pain:6,diarrhea:4,constipation:4,loss_appetite:4,weakness:3},
            influenza:{body_ache:6,cough:4,sore_throat:3,headache:3},
            chikungunya:{joint_pain:12,rash:5,body_ache:4},
            sepsis:{confusion:10,low_urine:8,breathlessness:8,fainting:8,high_fever:4},
            meningitis:{neck_stiffness:15,severe_headache:8,confusion:8,seizure:10,vomiting:4}
        }
    },
    headache:{
        focus:['migraine','tension_headache','cluster_headache','sinusitis','meningitis','stroke_tia','hypertensive_crisis','glaucoma_emergency'],
        boost:{
            migraine:{throbbing:8,photophobia:8,noise_sensitivity:5,nausea:5,vomiting:3},
            sinusitis:{facial_pain:10,nasal_blockage:6,nasal_discharge:5,fever:2},
            tension_headache:{anxiety:5,insomnia:4,neck_pain:4},
            meningitis:{fever:4,neck_stiffness:15,confusion:8,seizure:8},
            stroke_tia:{vision_loss:10,confusion:8,fainting:6,severe_headache:5},
            hypertensive_crisis:{severe_headache:8,chest_pain:6,vision_loss:8,confusion:6},
            glaucoma_emergency:{vision_loss:12,eye_redness:6,severe_headache:5,nausea:3}
        }
    },
    cough_chest:{
        focus:['common_cold','bronchitis','pneumonia','asthma_attack','copd_exacerbation','tuberculosis','covid_like_viral','myocardial_infarction','pulmonary_embolism','heart_failure'],
        boost:{
            pneumonia:{fever:5,yellow_sputum:8,breathlessness:10,chest_pain:5,weakness:3},
            asthma_attack:{wheezing:15,breathlessness:10,chest_tightness:6,cough:3},
            tuberculosis:{blood_sputum:12,weight_loss:10,night_sweat:10,fever:3,cough:4},
            bronchitis:{productive_cough:6,cough:5,wheezing:3},
            common_cold:{nasal_discharge:5,sneezing:5,nasal_blockage:3,sore_throat:2},
            myocardial_infarction:{chest_pain:8,sweating_cold:10,left_arm_pain:10,breathlessness:6,nausea:3},
            pulmonary_embolism:{breathlessness:12,chest_pain:8,fainting:6,blood_sputum:5},
            heart_failure:{breathlessness:8,edema:8,fatigue:4,cough:2}
        }
    },
    gi:{
        focus:['gastroenteritis','food_poisoning','dysentery','cholera_like_dehydrating_diarrhea','gastritis','gerd','peptic_ulcer','appendicitis','cholecystitis_gallstones','pancreatitis','ibs','constipation'],
        boost:{
            gastroenteritis:{diarrhea:8,vomiting:7,abdominal_pain:4,dehydration:6,fever:2},
            dysentery:{bloody_diarrhea:15,fever:5,abdominal_pain:4},
            cholera_like_dehydrating_diarrhea:{diarrhea:10,dehydration:15,low_urine:8,weakness:5},
            appendicitis:{right_lower_pain:15,fever:5,nausea:4,vomiting:4,loss_appetite:4},
            cholecystitis_gallstones:{right_upper_pain:15,nausea:4,vomiting:4,fever:3},
            pancreatitis:{severe_abdominal_pain:12,epigastric_pain:8,vomiting:6},
            peptic_ulcer:{epigastric_pain:8,black_stool:12,heartburn:4},
            gastritis:{epigastric_pain:7,heartburn:7,nausea:4}
        }
    },
    urinary:{
        focus:['cystitis','pyelonephritis','renal_colic_stone','acute_kidney_warning','bph_prostate','prostatitis'],
        boost:{
            cystitis:{burning_urine:12,frequent_urine:10,abdominal_pain:2},
            pyelonephritis:{fever:6,flank_pain:12,burning_urine:5,vomiting:4,weakness:3},
            renal_colic_stone:{flank_pain:15,blood_urine:8,vomiting:4},
            acute_kidney_warning:{low_urine:15,edema:8,confusion:5,vomiting:3},
            prostatitis:{fever:5,burning_urine:6,frequent_urine:4,pelvic_pain:8}
        }
    },
    female:{
        focus:['dysmenorrhea','menorrhagia','pcos','pid','vaginitis','pregnancy_warning','ectopic_pregnancy','miscarriage_threat','mastitis'],
        boost:{
            ectopic_pregnancy:{pregnancy:8,missed_period:8,severe_abdominal_pain:12,bleeding:8,fainting:10},
            pregnancy_warning:{pregnancy:8,bleeding:12,severe_abdominal_pain:8,fainting:6},
            miscarriage_threat:{pregnancy:8,bleeding:10,abdominal_pain:5},
            pid:{pelvic_pain:10,fever:5,vaginal_discharge:8,abdominal_pain:4},
            vaginitis:{vaginal_discharge:12,itching:6,burning_urine:3},
            dysmenorrhea:{painful_menses:15,abdominal_pain:4,nausea:2},
            menorrhagia:{heavy_menses:15,weakness:4,dizziness:4}
        }
    },
    child:{
        focus:['febrile_seizure','child_dehydration','bronchiolitis','croup','pneumonia','measles','viral_fever','gastroenteritis','sepsis'],
        boost:{
            febrile_seizure:{child:8,fever:6,seizure:15},
            child_dehydration:{child:8,dehydration:12,diarrhea:5,vomiting:5,poor_feeding:8,low_urine:8},
            bronchiolitis:{child:6,breathlessness:10,wheezing:8,cough:4,poor_feeding:5},
            croup:{child:8,cough:6,breathlessness:8,fever:2},
            pneumonia:{child:4,fever:5,cough:5,breathlessness:10,weakness:3},
            sepsis:{child:5,confusion:8,poor_feeding:8,high_fever:5,low_urine:5}
        }
    },
    skin:{
        focus:['urticaria','eczema','fungal_skin','scabies','cellulitis','abscess_boil','herpes_zoster','psoriasis','anaphylaxis','allergic_reaction'],
        boost:{
            anaphylaxis:{rash:8,itching:5,breathlessness:15,edema:8,fainting:10},
            urticaria:{itching:10,rash:10,skin_redness:5},
            cellulitis:{skin_redness:10,fever:5,edema:5},
            abscess_boil:{pus:15,skin_redness:5,fever:2},
            fungal_skin:{itching:6,scaly_skin:10,rash:4},
            eczema:{itching:8,scaly_skin:8,skin_redness:4},
            herpes_zoster:{vesicles:12,skin_redness:4}
        }
    },
    chronic:{
        focus:['diabetes_hyperglycemia','hypothyroidism','hyperthyroidism','anemia','tuberculosis','depression','fibromyalgia','ibs','rheumatoid_arthritis'],
        boost:{
            diabetes_hyperglycemia:{sugar_high:12,excessive_thirst:8,excessive_urination:8,weight_loss:5},
            hypothyroidism:{fatigue:5,cold_intolerance:10,constipation:5,edema:4,depression:3},
            hyperthyroidism:{heat_intolerance:10,palpitation:8,tremor:8,weight_loss:5,anxiety:4},
            anemia:{fatigue:8,weakness:8,breathlessness:5,dizziness:5},
            tuberculosis:{cough:4,weight_loss:10,night_sweat:10,fever:4},
            depression:{depression:12,insomnia:5,fatigue:5,loss_appetite:4},
            fibromyalgia:{body_ache:6,fatigue:8,insomnia:5,depression:3},
            rheumatoid_arthritis:{joint_pain:10,edema:5,fatigue:3}
        }
    }
};
// Additional module scoring configs added in Phase 10.
ADX_SPECIALTY_SCORING.cardiac_emergency={focus:['myocardial_infarction','angina','pulmonary_embolism','heart_failure','arrhythmia','hypertensive_crisis','panic_attack'],boost:{myocardial_infarction:{chest_pain:10,sweating_cold:12,left_arm_pain:12,breathlessness:8,nausea:4},angina:{chest_pain:8,left_arm_pain:5,breathlessness:4},pulmonary_embolism:{breathlessness:12,chest_pain:8,fainting:8,blood_sputum:6},heart_failure:{breathlessness:8,edema:8,fatigue:4,cough:3},arrhythmia:{palpitation:12,dizziness:6,fainting:8},hypertensive_crisis:{severe_headache:8,chest_pain:6,vision_loss:8,confusion:8}},textBoost:{myocardial_infarction:{'exertional/rest chest pain':{terms:['pain on exertion','chest pain at rest','central chest pain'],pts:8}},heart_failure:{'orthopnea/leg swelling':{terms:['orthopnea','worse lying flat','leg swelling'],pts:8}}}};
ADX_SPECIALTY_SCORING.ent_eye_dental={focus:['sinusitis','tonsillitis_pharyngitis','otitis_media','otitis_externa','conjunctivitis','allergic_conjunctivitis','glaucoma_emergency','dental_caries_abscess','gingivitis','aphthous_ulcer'],boost:{sinusitis:{facial_pain:10,nasal_blockage:6,nasal_discharge:5,headache:3},tonsillitis_pharyngitis:{sore_throat:12,fever:4},otitis_media:{ear_pain:10,fever:4,ear_discharge:5,child:2},conjunctivitis:{eye_redness:10,eye_discharge:8},glaucoma_emergency:{vision_loss:15,eye_redness:8,severe_headache:6,nausea:4},dental_caries_abscess:{tooth_pain:12,gum_swelling:8,fever:3,pus:4},gingivitis:{gum_swelling:8,gum_bleed:8}},textBoost:{sinusitis:{'worse bending forward':{terms:['worse bending forward'],pts:6}},glaucoma_emergency:{'severe red eye':{terms:['severe red eye','eye pain vomiting'],pts:8}}}};
ADX_SPECIALTY_SCORING.msk_injury={focus:['sprain_injury','osteoarthritis','rheumatoid_arthritis','gout','low_back_pain','sciatica','cervical_spondylosis','fibromyalgia'],boost:{sprain_injury:{injury:12,joint_pain:4,edema:5},rheumatoid_arthritis:{joint_pain:10,edema:6,fatigue:3,fever:2},gout:{joint_pain:8,skin_redness:6,edema:6},low_back_pain:{back_pain:12,injury:3},sciatica:{sciatica:15,back_pain:6},cervical_spondylosis:{neck_pain:10,headache:3,dizziness:2},fibromyalgia:{body_ache:8,fatigue:8,insomnia:5,depression:3}},textBoost:{rheumatoid_arthritis:{'morning stiffness':{terms:['morning stiffness'],pts:8}},gout:{'uric acid':{terms:['uric acid','big toe pain'],pts:6}},sciatica:{'radiating leg pain':{terms:['radiating leg pain','pain down leg'],pts:8}}}};
ADX_SPECIALTY_SCORING.endocrine_metabolic={focus:['diabetes_hyperglycemia','hypoglycemia','hypothyroidism','hyperthyroidism','anemia','dehydration','heat_exhaustion','heat_stroke'],boost:{diabetes_hyperglycemia:{sugar_high:15,excessive_thirst:8,excessive_urination:8,increased_hunger:5,weight_loss:5},hypoglycemia:{sugar_low:15,sweating_cold:8,tremor:8,confusion:8,fainting:8},hypothyroidism:{fatigue:6,cold_intolerance:12,constipation:5,edema:4,depression:4},hyperthyroidism:{heat_intolerance:12,palpitation:8,tremor:8,weight_loss:6,anxiety:4},anemia:{fatigue:8,weakness:8,breathlessness:5,dizziness:5},dehydration:{dehydration:15,low_urine:8,weakness:5,vomiting:3,diarrhea:3},heat_stroke:{high_fever:8,confusion:15,seizure:10,fainting:8}},textBoost:{diabetes_hyperglycemia:{'HbA1c/high reading':{terms:['hba1c','fasting sugar high','random sugar high'],pts:6}},anemia:{'low Hb/pale':{terms:['low hb','pale','hemoglobin low'],pts:8}},heat_stroke:{'heat exposure':{terms:['heat exposure','working in sun','garmi mein'],pts:8}}}};

function selectedSpecialtyKeyFromText(st){
    var s=String(st||'').toLowerCase();
    var m=s.match(/specialty module:\s*([a-z_]+)/i);
    if(m && ADX_SPECIALTY_SCORING[m[1]]) return m[1];
    // title clues from appended specialtyText
    if(s.indexOf('headache module')!==-1) return 'headache';
    if(s.indexOf('cough')!==-1 && s.indexOf('module')!==-1) return 'cough_chest';
    if(s.indexOf('abdomen')!==-1 || s.indexOf('gi module')!==-1) return 'gi';
    if(s.indexOf('urinary')!==-1 || s.indexOf('kidney')!==-1) return 'urinary';
    if(s.indexOf('female')!==-1) return 'female';
    if(s.indexOf('child')!==-1 || s.indexOf('pediatric')!==-1) return 'child';
    if(s.indexOf('skin module')!==-1) return 'skin';
    if(s.indexOf('chronic')!==-1) return 'chronic';
    if(s.indexOf('fever module')!==-1) return 'fever';
    if(s.indexOf('cardiac')!==-1 || s.indexOf('heart')!==-1) return 'cardiac_emergency';
    if(s.indexOf('ent')!==-1 || s.indexOf('eye')!==-1 || s.indexOf('dental')!==-1) return 'ent_eye_dental';
    if(s.indexOf('msk')!==-1 || s.indexOf('injury')!==-1) return 'msk_injury';
    if(s.indexOf('endocrine')!==-1 || s.indexOf('metabolic')!==-1) return 'endocrine_metabolic';
    return '';
}
function applySpecialtyScoring(results, ex, specialty){
    var key=(specialty&&specialty.module) || selectedSpecialtyKeyFromText(ex.text) || '';
    var cfg=ADX_SPECIALTY_SCORING[key];
    if(!cfg) return results;
    var condMap={};
    (global.ADX_KNOWLEDGE&&global.ADX_KNOWLEDGE.conditions||[]).forEach(function(c){condMap[c.id]=c;});
    var rowMap={};
    results.forEach(function(r){rowMap[r.condition.id]=r; r.specialtyModule=key; r.specialtyBonus=0; r.specialtyReasons=[];});
    function ensureRow(cid){
        if(rowMap[cid]) return rowMap[cid];
        var c=condMap[cid]; if(!c) return null;
        var features=c.features||{}, matched=[], missing=[], score=0, max=0;
        Object.keys(features).forEach(function(k){ var w=parseFloat(features[k])||0; if(w>0) max+=Math.abs(w); if(w>0 && ex.found[k]){score+=w; matched.push({key:k,weight:w});} else if(w>0 && w>=2){missing.push({key:k,weight:w});} });
        var row={condition:c,score:Math.max(0,score),max:max||1,percentage:Math.max(1,Math.round((Math.max(0,score)/(max||1))*100)),confidence:'low',matched:matched,missing:missing.slice(0,6),opposed:[],specialtyModule:key,specialtyBonus:0,specialtyReasons:[],specialtyAdded:true};
        results.push(row); rowMap[cid]=row; return row;
    }
    // Small focus boost keeps module-relevant diagnoses above noise.
    (cfg.focus||[]).forEach(function(cid){ var r=ensureRow(cid); if(r){ r.specialtyBonus += 2; r.specialtyReasons.push('module focus +2'); } });
    Object.keys(cfg.boost||{}).forEach(function(cid){
        var r=ensureRow(cid); if(!r) return;
        var rules=cfg.boost[cid]||{};
        Object.keys(rules).forEach(function(sym){
            if(ex.found[sym]){ var pts=parseFloat(rules[sym])||0; r.specialtyBonus += pts; r.specialtyReasons.push(symptomName(sym)+' +'+pts); }
        });
    });
    Object.keys(cfg.textBoost||{}).forEach(function(cid){
        var r=ensureRow(cid); if(!r) return;
        var rules=cfg.textBoost[cid]||{};
        Object.keys(rules).forEach(function(label){
            var obj=rules[label]||{}, pts=parseFloat(obj.pts)||0;
            if(pts && textHas(ex.text, obj.terms||[])){
                r.specialtyBonus += pts;
                r.specialtyReasons.push(label+' +'+pts);
            }
        });
    });
    results.forEach(function(r){
        if(r.specialtyBonus){
            r.score += r.specialtyBonus;
            r.percentage=Math.min(99, Math.max(r.percentage||0, Math.round((r.score/(r.max+10))*100)));
            r.confidence = r.percentage>=70 ? 'high' : (r.percentage>=45 ? 'medium' : 'low');
        }
    });
    results.sort(function(a,b){
        var sev={emergency:3, urgent:2, routine:1};
        var sd=(sev[b.condition.severity||'routine']||1)-(sev[a.condition.severity||'routine']||1);
        if((b.percentage>=45 || a.percentage>=45) && sd!==0 && (b.condition.severity==='emergency' || a.condition.severity==='emergency')) return sd;
        return b.percentage-a.percentage || (b.specialtyBonus||0)-(a.specialtyBonus||0) || b.score-a.score;
    });
    return results;
}
var ADX_SPECIALTY_EXTRA_RUBRICS = {
    fever:[{symptom:'fever_pattern',book:'kent',chapter:'fever',path:'FEVER, intermittent',weight:3,terms:['intermittent fever','alternate day','every other day','fever comes and goes']},{symptom:'dengue',book:'kent',chapter:'head',path:'PAIN, eyes, behind',weight:4,terms:['behind eyes','retro orbital','pain behind eyes']},{symptom:'dengue',book:'kent',chapter:'skin',path:'ERUPTIONS, rash',weight:3,terms:['rash','petechiae','red spots']},{symptom:'malaria',book:'kent',chapter:'chill',path:'CHILL, shaking',weight:4,terms:['rigor','shivering','shaking chill']},{symptom:'typhoid',book:'kent',chapter:'abdomen',path:'PAIN, fever, during',weight:3,terms:['abdominal pain with fever','typhoid']}],
    headache:[{symptom:'migraine',book:'kent',chapter:'head',path:'PAIN, one-sided',weight:4,terms:['one sided','unilateral']},{symptom:'migraine',book:'kent',chapter:'head',path:'PAIN, light, from',weight:4,terms:['light sensitivity','photophobia','worse light']},{symptom:'migraine',book:'kent',chapter:'head',path:'PAIN, noise, from',weight:3,terms:['noise sensitivity','worse noise']},{symptom:'sinus',book:'kent',chapter:'nose',path:'SINUSES, frontal',weight:3,terms:['sinus','facial pain','forehead sinus']},{symptom:'meningitis',book:'kent',chapter:'head',path:'PAIN, fever, during',weight:4,terms:['fever with headache','neck stiffness']}],
    cough_chest:[{symptom:'asthma',book:'kent',chapter:'respiration',path:'WHEEZING',weight:4,terms:['wheezing','seeti','wheeze']},{symptom:'pneumonia',book:'kent',chapter:'expectoration',path:'EXPECTORATION, yellow',weight:3,terms:['yellow sputum','green sputum']},{symptom:'tb',book:'kent',chapter:'cough',path:'COUGH, bloody expectoration',weight:5,terms:['blood in sputum','hemoptysis']},{symptom:'cardiac',book:'kent',chapter:'chest',path:'PAIN, heart',weight:4,terms:['heart pain','left arm','jaw pain']},{symptom:'dyspnea',book:'kent',chapter:'respiration',path:'DIFFICULT, lying, while',weight:3,terms:['orthopnea','worse lying','cannot lie flat']}],
    gi:[{symptom:'appendix',book:'kent',chapter:'abdomen',path:'PAIN, iliac region, right',weight:5,terms:['right lower abdomen','right iliac','appendix']},{symptom:'gallbladder',book:'kent',chapter:'abdomen',path:'PAIN, hypochondria, right',weight:5,terms:['right upper abdomen','gallbladder','right hypochondrium']},{symptom:'pancreas',book:'kent',chapter:'abdomen',path:'PAIN, epigastrium',weight:4,terms:['epigastric','upper abdomen','pancreatitis']},{symptom:'dysentery',book:'kent',chapter:'stool',path:'BLOODY',weight:5,terms:['bloody stool','blood in stool','bloody diarrhea']},{symptom:'dehydration',book:'kent',chapter:'generalities',path:'WEAKNESS, diarrhea, after',weight:3,terms:['dehydration','low urine','sunken eyes']}],
    urinary:[{symptom:'uti',book:'kent',chapter:'urethra',path:'BURNING, urination, during',weight:5,terms:['burning urination','dysuria']},{symptom:'uti',book:'kent',chapter:'bladder',path:'URINATION, frequent',weight:4,terms:['frequent urine','frequency']},{symptom:'stone',book:'kent',chapter:'kidneys',path:'PAIN, extending to bladder',weight:4,terms:['renal colic','stone','flank to groin']},{symptom:'hematuria',book:'kent',chapter:'urine',path:'BLOODY',weight:4,terms:['blood in urine','hematuria']},{symptom:'kidney_warning',book:'kent',chapter:'urine',path:'SUPPRESSED',weight:5,terms:['low urine','no urine','suppressed urine']}],
    female:[{symptom:'dysmenorrhea',book:'kent',chapter:'genitalia_female',path:'PAIN, uterus, menses, during',weight:5,terms:['period pain','dysmenorrhea']},{symptom:'menorrhagia',book:'kent',chapter:'genitalia_female',path:'MENSES, copious',weight:5,terms:['heavy menses','heavy period']},{symptom:'leucorrhea',book:'kent',chapter:'genitalia_female',path:'LEUCORRHEA',weight:4,terms:['leucorrhea','vaginal discharge']},{symptom:'pregnancy_warning',book:'kent',chapter:'genitalia_female',path:'MENSES, suppressed',weight:3,terms:['missed period','pregnancy']},{symptom:'pelvic',book:'kent',chapter:'genitalia_female',path:'PAIN, ovaries',weight:4,terms:['pelvic pain','ovary pain']}],
    child:[{symptom:'child_fever',book:'kent',chapter:'fever',path:'FEVER, children',weight:3,terms:['child fever','baby fever']},{symptom:'poor_feeding',book:'kent',chapter:'generalities',path:'WEAKNESS, children',weight:4,terms:['poor feeding','not feeding']},{symptom:'febrile_seizure',book:'kent',chapter:'generalities',path:'CONVULSIONS, fever, during',weight:5,terms:['febrile seizure','fit with fever']},{symptom:'child_cough',book:'kent',chapter:'cough',path:'COUGH, children',weight:3,terms:['child cough','baby cough']},{symptom:'child_diarrhea',book:'kent',chapter:'stool',path:'DIARRHEA, children',weight:3,terms:['child diarrhea','baby diarrhea']}],
    skin:[{symptom:'urticaria',book:'kent',chapter:'skin',path:'URTICARIA',weight:4,terms:['urticaria','hives']},{symptom:'eczema',book:'kent',chapter:'skin',path:'ECZEMA',weight:4,terms:['eczema']},{symptom:'fungal',book:'kent',chapter:'skin',path:'ERUPTIONS, ringworm',weight:3,terms:['fungal','ringworm','tinea']},{symptom:'abscess',book:'kent',chapter:'skin',path:'ABSCESS',weight:4,terms:['abscess','boil','pus']},{symptom:'vesicles',book:'kent',chapter:'skin',path:'VESICLES',weight:4,terms:['vesicles','blisters']}],
    chronic:[{symptom:'diabetes',book:'kent',chapter:'generalities',path:'DIABETES',weight:4,terms:['diabetes','high sugar']},{symptom:'thyroid',book:'kent',chapter:'generalities',path:'WEAKNESS',weight:3,terms:['thyroid','fatigue']},{symptom:'anemia',book:'kent',chapter:'generalities',path:'ANEMIA',weight:4,terms:['anemia','pale','low hb']},{symptom:'tb_chronic',book:'kent',chapter:'generalities',path:'TUBERCULOSIS',weight:4,terms:['tb','tuberculosis','night sweats']},{symptom:'mind_chronic',book:'kent',chapter:'mind',path:'ANXIETY',weight:3,terms:['anxiety','depression','stress']}],
    cardiac_emergency:[{symptom:'heart_pain',book:'kent',chapter:'chest',path:'PAIN, heart',weight:5,terms:['chest pain','heart pain']},{symptom:'radiation',book:'kent',chapter:'chest',path:'PAIN, extending to left arm',weight:5,terms:['left arm pain','radiation']},{symptom:'palpitation',book:'kent',chapter:'chest',path:'PALPITATION',weight:4,terms:['palpitation','heart racing']},{symptom:'dyspnea',book:'kent',chapter:'respiration',path:'DIFFICULT',weight:4,terms:['breathlessness','shortness of breath']}],
    ent_eye_dental:[{symptom:'sinus',book:'kent',chapter:'nose',path:'SINUSES',weight:4,terms:['sinus','facial pain']},{symptom:'ear_pain',book:'kent',chapter:'ear',path:'PAIN',weight:3,terms:['ear pain']},{symptom:'red_eye',book:'kent',chapter:'eye',path:'REDNESS',weight:3,terms:['red eye']},{symptom:'tooth',book:'kent',chapter:'teeth',path:'PAIN',weight:3,terms:['tooth pain']},{symptom:'mouth_ulcer',book:'kent',chapter:'mouth',path:'ULCERS',weight:3,terms:['mouth ulcer']}],
    msk_injury:[{symptom:'injury',book:'kent',chapter:'generalities',path:'INJURIES',weight:4,terms:['injury','trauma','fall']},{symptom:'back',book:'kent',chapter:'back',path:'PAIN',weight:3,terms:['back pain']},{symptom:'sciatica',book:'kent',chapter:'extremities',path:'PAIN, sciatic nerve',weight:4,terms:['sciatica']},{symptom:'joints',book:'kent',chapter:'extremities',path:'PAIN, joints',weight:4,terms:['joint pain']},{symptom:'gout',book:'kent',chapter:'extremities',path:'PAIN, gouty',weight:3,terms:['gout','uric acid']}],
    endocrine_metabolic:[{symptom:'diabetes',book:'kent',chapter:'generalities',path:'DIABETES',weight:4,terms:['high sugar','diabetes']},{symptom:'hypoglycemia',book:'kent',chapter:'generalities',path:'FAINTNESS',weight:4,terms:['low sugar','hypoglycemia']},{symptom:'thyroid',book:'kent',chapter:'generalities',path:'WEAKNESS',weight:3,terms:['thyroid','fatigue']},{symptom:'heat',book:'kent',chapter:'generalities',path:'HEAT, sensation of',weight:3,terms:['heat intolerance','hot patient']},{symptom:'cold',book:'kent',chapter:'generalities',path:'COLDNESS',weight:3,terms:['cold intolerance','chilly']}]
};

function specialtyRubricTemplates(key, ex, results){
    var out=[];
    function add(sym, book, chapter, path, weight){ out.push({symptom:sym||('module_'+key), book:book, chapter:chapter, path:path, weight:weight||3, specialtyTemplate:true, selected:true}); }
    if(key==='fever'){
        add('fever','kent','fever','FEVER',2); add('chills','kent','chill','CHILL',2); add('weakness','kent','generalities','WEAKNESS',3); add('body_ache','kent','generalities','PAIN, aching',3);
        if(ex.found.bone_pain) add('bone_pain','kent','generalities','PAIN, bones',4);
        if(ex.found.sweat) add('sweat','kent','perspiration','PERSPIRATION',2);
    } else if(key==='headache'){
        add('headache','kent','head','PAIN',3); if(ex.found.throbbing) add('throbbing','kent','head','PAIN, pulsating',4); if(ex.found.photophobia) add('photophobia','kent','vision','LIGHT, agg.',4); if(ex.found.nausea) add('nausea','kent','stomach','NAUSEA, headache, during',3);
    } else if(key==='cough_chest'){
        add('cough','kent','cough','COUGH',3); if(ex.found.dry_cough) add('dry_cough','kent','cough','COUGH, dry',3); if(ex.found.productive_cough) add('productive_cough','kent','expectoration','EXPECTORATION',3); if(ex.found.breathlessness) add('breathlessness','kent','respiration','DIFFICULT',4); if(ex.found.chest_pain) add('chest_pain','kent','chest','PAIN',3);
    } else if(key==='gi'){
        add('abdominal_pain','kent','abdomen','PAIN',3); if(ex.found.diarrhea) add('diarrhea','kent','stool','DIARRHEA',3); if(ex.found.vomiting) add('vomiting','kent','stomach','VOMITING',3); if(ex.found.nausea) add('nausea','kent','stomach','NAUSEA',3); if(ex.found.heartburn) add('heartburn','kent','stomach','HEARTBURN',3);
    } else if(key==='urinary'){
        if(ex.found.burning_urine) add('burning_urine','kent','urethra','BURNING',4); if(ex.found.frequent_urine) add('frequent_urine','kent','bladder','URINATION, frequent',3); if(ex.found.flank_pain) add('flank_pain','kent','kidneys','PAIN',4);
    } else if(key==='female'){
        if(ex.found.painful_menses) add('painful_menses','kent','genitalia_female','MENSES, painful',4); if(ex.found.heavy_menses) add('heavy_menses','kent','genitalia_female','MENSES, copious',4); if(ex.found.vaginal_discharge) add('vaginal_discharge','kent','genitalia_female','LEUCORRHEA',4); if(ex.found.pelvic_pain) add('pelvic_pain','kent','genitalia_female','PAIN, uterus',3);
    } else if(key==='child'){
        add('child','kent','generalities','CHILDREN, complaints of',2); if(ex.found.fever) add('fever','kent','fever','FEVER',2); if(ex.found.diarrhea) add('diarrhea','kent','stool','DIARRHEA',3); if(ex.found.cough) add('cough','kent','cough','COUGH',3);
    } else if(key==='skin'){
        if(ex.found.rash) add('rash','kent','skin','ERUPTIONS',3); if(ex.found.itching) add('itching','kent','skin','ITCHING',3); if(ex.found.vesicles) add('vesicles','kent','skin','VESICLES',3); if(ex.found.pus) add('pus','kent','skin','SUPPURATION',3);
    } else if(key==='chronic'){
        add('weakness','kent','generalities','WEAKNESS',3); if(ex.found.fatigue) add('fatigue','kent','generalities','WEARINESS',3); if(ex.found.anxiety) add('anxiety','kent','mind','ANXIETY',3); if(ex.found.insomnia) add('insomnia','kent','sleep','SLEEPLESSNESS',3);
    }
    (ADX_SPECIALTY_EXTRA_RUBRICS[key]||[]).forEach(function(rr){
        var ok=false;
        if(rr.when && ex.found[rr.when]) ok=true;
        if(rr.terms && textHas(ex.text, rr.terms)) ok=true;
        if(!rr.when && !rr.terms) ok=true;
        if(ok) add(rr.symptom||rr.when||('module_'+key), rr.book, rr.chapter, rr.path, rr.weight||3);
    });
    return out;
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
function analyze(statement, extraKeys, specialty){
    var ex=extractSymptoms(statement, extraKeys||[]);
    var results=scoreConditions(ex);
    results=applySpecialtyScoring(results, ex, specialty||null);
    var red=collectRedFlags(ex, results);
    var rubs=collectRubrics(ex, results);
    var skey=(specialty&&specialty.module) || selectedSpecialtyKeyFromText(ex.text) || '';
    specialtyRubricTemplates(skey, ex, results).forEach(function(r){
        var id=r.book+'|'+r.chapter+'|'+r.path;
        var exists=rubs.some(function(x){return (x.book+'|'+x.chapter+'|'+x.path)===id;});
        if(!exists) rubs.push(r);
    });
    return {
        extracted:ex,
        differentials:results.slice(0,20),
        redFlags:red,
        questions:collectQuestions(ex, results),
        tests:collectTests(results, red),
        rubrics:rubs.slice(0,40),
        remedyQuestions:collectRemedyQuestions(results),
        specialtyScoring:{module:skey}
    };
}


// ==================== ADX Phase 2/3: Rubric selection + basic repertorization ====================
var adxChapterCache = {};
var lastRepertoryRows = [];
var lastMatchedRubrics = [];
var lastRepertoryErrors = [];
var adxRemedyAnswers = {};
var adxLastSavedCaseId = null;
var adxRubricConfirmSeq = 0;
var ADX_CLOUD_TABLE = 'adx_records';
var adxCloudTableReady = null;
var adxCloudSyncBusy = false;
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
                if(inp){ inp.value=(r.confirmedPath||r.path); }
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
    var url=(info.chapDir||'')+chapter+'.json?v=24';
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

function rubricMatchStatus(score){
    if(score>=1000) return {label:'Exact', color:'#27ae60'};
    if(score>=850) return {label:'Strong', color:'#16a085'};
    if(score>=650) return {label:'Good', color:'#2980b9'};
    if(score>=450) return {label:'Fuzzy', color:'#f39c12'};
    if(score>=250) return {label:'Weak', color:'#e67e22'};
    return {label:'Not found', color:'#c0392b'};
}
function applyBestToRubric(r,best){
    if(!r || !best) return r;
    var st=rubricMatchStatus(best.score||0);
    r.confirmedPath=best.path;
    r.confirmedRid=best.rid;
    r.matchScore=best.score||0;
    r.matchStatus=st.label;
    r.matchColor=st.color;
    r.confirmedAt=new Date().toISOString();
    return r;
}
function confirmOneRubric(idx, silent){
    if(!lastAnalysis || !lastAnalysis.rubrics || !lastAnalysis.rubrics[idx]) return Promise.resolve(null);
    var r=lastAnalysis.rubrics[idx];
    r.matchStatus='checking'; r.matchColor='#7f8c8d';
    if(!silent){ var out=$('adxResults'); if(out) out.innerHTML=renderAnalysis(lastAnalysis); }
    return fetchChapter(r.book,r.chapter).then(function(data){
        var best=findBestRubric(data, r.path);
        if(best){ applyBestToRubric(r,best); }
        else { r.confirmedPath=''; r.confirmedRid=''; r.matchScore=0; r.matchStatus='Not found'; r.matchColor='#c0392b'; }
        return r;
    }).catch(function(){
        r.confirmedPath=''; r.confirmedRid=''; r.matchScore=0; r.matchStatus='Load error'; r.matchColor='#c0392b';
        return r;
    });
}
function confirmSuggestedRubrics(){
    if(!lastAnalysis || !lastAnalysis.rubrics || !lastAnalysis.rubrics.length){ toast('No rubrics to confirm','error'); return; }
    var seq=++adxRubricConfirmSeq;
    var box=$('adxRubricConfirmStatus');
    if(box) box.innerHTML='<span style="color:#7d6608;">⏳ Confirming exact rubric paths...</span>';
    var list=lastAnalysis.rubrics;
    var i=0, ok=0, miss=0;
    function step(){
        if(seq!==adxRubricConfirmSeq) return;
        if(i>=list.length){
            var out=$('adxResults'); if(out) out.innerHTML=renderAnalysis(lastAnalysis);
            toast('✅ Rubric confirmation complete: '+ok+' found, '+miss+' not found');
            return;
        }
        var cur=i++;
        if(box) box.innerHTML='⏳ '+i+'/'+list.length+' — '+esc(list[cur].book+'/'+list[cur].chapter);
        confirmOneRubric(cur,true).then(function(r){
            if(r && r.confirmedPath) ok++; else miss++;
            setTimeout(step,0);
        });
    }
    step();
}
function editRubricPath(idx){
    if(!lastAnalysis || !lastAnalysis.rubrics || !lastAnalysis.rubrics[idx]) return;
    var r=lastAnalysis.rubrics[idx];
    var val=prompt('Edit rubric path', r.confirmedPath||r.path||'');
    if(val===null) return;
    r.path=String(val||'').trim();
    r.confirmedPath=''; r.confirmedRid=''; r.matchScore=0; r.matchStatus='edited'; r.matchColor='#8e44ad';
    var out=$('adxResults'); if(out) out.innerHTML=renderAnalysis(lastAnalysis);
}
function removeRubric(idx){
    if(!lastAnalysis || !lastAnalysis.rubrics || !lastAnalysis.rubrics[idx]) return;
    lastAnalysis.rubrics.splice(idx,1);
    var out=$('adxResults'); if(out) out.innerHTML=renderAnalysis(lastAnalysis);
}
function addCustomRubric(){
    if(!lastAnalysis) return;
    var text=prompt('Add rubric as: book|chapter|rubric path\nExample: kent|head|PAIN, throbbing');
    if(!text) return;
    var parts=text.split('|');
    if(parts.length<3){ toast('Format: book|chapter|rubric path','error'); return; }
    lastAnalysis.rubrics=lastAnalysis.rubrics||[];
    lastAnalysis.rubrics.push({book:parts[0].trim(), chapter:parts[1].trim(), path:parts.slice(2).join('|').trim(), symptom:'custom', weight:3, selected:true, matchStatus:'custom', matchColor:'#8e44ad'});
    var out=$('adxResults'); if(out) out.innerHTML=renderAnalysis(lastAnalysis);
}
function openExactRubric(idx){
    if(!lastAnalysis || !lastAnalysis.rubrics || !lastAnalysis.rubrics[idx]) return;
    var r=lastAnalysis.rubrics[idx];
    if(r.confirmedRid && typeof navigateToRubric==='function'){
        try{
            var btn=document.querySelector('[data-page="repertoryBrowser"]');
            if(typeof showPage==='function') showPage('repertoryBrowser', btn);
            setTimeout(function(){ navigateToRubric(r.book, r.chapter, r.confirmedRid); },250);
            return;
        }catch(e){}
    }
    openRubricSearch(idx);
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


function textHas(txt, words){
    txt=String(txt||'').toLowerCase();
    for(var i=0;i<words.length;i++){ if(txt.indexOf(String(words[i]).toLowerCase())!==-1) return true; }
    return false;
}
function addConstitutionRule(out, remedy, pts, reason){
    if(!remedy || !pts) return;
    out.push({remedy:remedyKey(remedy), display:remedy, pts:pts, reason:reason});
}
function constitutionalSupportRules(details){
    details=details || collectCaseDetails();
    var out=[];
    var all=Object.keys(details||{}).map(function(k){return details[k]||'';}).join(' | ').toLowerCase();
    var thermal=String(details.thermal||'').toLowerCase();
    var thirst=String(details.thirst||'').toLowerCase();
    var appetite=String(details.appetite||'').toLowerCase();
    var cravings=String(details.cravings||'').toLowerCase();
    var aversions=String(details.aversions||'').toLowerCase();
    var sleep=String(details.sleep||'').toLowerCase();
    var dreams=String(details.dreams||'').toLowerCase();
    var mind=String(details.mind||'').toLowerCase();
    var persp=String(details.perspiration||'').toLowerCase();
    var stool=String(details.stool||'').toLowerCase();
    var urine=String(details.urine||'').toLowerCase();
    var miasm=String(details.miasm||'').toLowerCase();

    if(textHas(thermal,['chilly','cold','thand','سرد','ٹھنڈ'])){ addConstitutionRule(out,'ars',2,'chilly patient'); addConstitutionRule(out,'nux-v',2,'chilly patient'); addConstitutionRule(out,'sil',2,'chilly patient'); addConstitutionRule(out,'calc',2,'chilly patient'); addConstitutionRule(out,'hep',1,'chilly patient'); }
    if(textHas(thermal,['hot','warm','heat','garmi','گرم','گرمی'])){ addConstitutionRule(out,'sulph',2,'hot patient'); addConstitutionRule(out,'puls',2,'hot patient'); addConstitutionRule(out,'lach',2,'hot patient'); addConstitutionRule(out,'phos',1,'hot patient'); }
    if(textHas(thermal,['better warmth','warmth amel','گرمی سے بہتر','گرم سے بہتر'])){ addConstitutionRule(out,'ars',2,'better warmth'); addConstitutionRule(out,'rhus-t',2,'better warmth'); addConstitutionRule(out,'mag-p',1,'better warmth'); }
    if(textHas(thermal,['worse heat','warm room','گرمی سے خراب','گرم کمرہ'])){ addConstitutionRule(out,'puls',2,'worse heat/warm room'); addConstitutionRule(out,'sulph',2,'worse heat'); addConstitutionRule(out,'lach',1,'worse heat'); }
    if(textHas(thermal,['open air','کھلی ہوا','open hawa'])){ addConstitutionRule(out,'puls',2,'open air desire/amel'); addConstitutionRule(out,'phos',1,'open air'); }

    if(textHas(thirst,['thirstless','no thirst','less thirst','پیاس کم','پیاس نہیں','piyas kam'])){ addConstitutionRule(out,'gels',3,'thirstless'); addConstitutionRule(out,'puls',3,'thirstless'); addConstitutionRule(out,'apis',2,'thirstless'); }
    if(textHas(thirst,['small sips','sips','بار بار تھوڑا','چھوٹے گھونٹ','little often'])){ addConstitutionRule(out,'ars',3,'thirst for small sips'); }
    if(textHas(thirst,['great thirst','very thirsty','large quantities','زیادہ پیاس','piyas zyada','cold water'])){ addConstitutionRule(out,'bry',3,'great thirst'); addConstitutionRule(out,'phos',2,'cold drinks / thirst'); addConstitutionRule(out,'nat-m',2,'great thirst'); }

    if(textHas(appetite,['low','poor','کم','bhook kam'])){ addConstitutionRule(out,'gels',1,'low appetite'); addConstitutionRule(out,'puls',1,'low appetite'); }
    if(textHas(appetite,['increased','hungry','بھوک زیادہ'])){ addConstitutionRule(out,'iod',1,'increased appetite'); addConstitutionRule(out,'lyc',1,'hunger/appetite tendency'); }

    if(textHas(cravings,['sweet','sweets','میٹھا','mitha'])){ addConstitutionRule(out,'calc',2,'desire sweets'); addConstitutionRule(out,'arg-n',2,'desire sweets'); addConstitutionRule(out,'lyc',1,'desire sweets'); addConstitutionRule(out,'sulph',1,'desire sweets'); }
    if(textHas(cravings,['salt','salty','نمک','namak'])){ addConstitutionRule(out,'nat-m',3,'desire salt'); }
    if(textHas(cravings,['sour','کھٹا','khatta'])){ addConstitutionRule(out,'sep',2,'desire sour'); addConstitutionRule(out,'ant-c',1,'desire sour'); }
    if(textHas(cravings,['spicy','مصالحہ','mirch','مرچ'])){ addConstitutionRule(out,'nux-v',2,'desire spicy/stimulants'); }
    if(textHas(cravings,['egg','eggs','انڈا','anday'])){ addConstitutionRule(out,'calc',2,'desire eggs'); }
    if(textHas(cravings,['milk','دودھ','doodh'])){ addConstitutionRule(out,'phos',1,'desire milk'); addConstitutionRule(out,'calc',1,'desire milk'); }
    if(textHas(aversions,['milk','دودھ','doodh'])){ addConstitutionRule(out,'sep',2,'aversion milk'); addConstitutionRule(out,'nat-c',1,'aversion milk'); }
    if(textHas(aversions,['fat','oily','چکنائی','oil'])){ addConstitutionRule(out,'puls',2,'aversion fatty/oily'); }

    if(textHas(sleep,['right side','دائیں کروٹ'])){ addConstitutionRule(out,'lyc',1,'right side sleep'); }
    if(textHas(sleep,['left side','بائیں کروٹ'])){ addConstitutionRule(out,'phos',1,'left side sleep'); }
    if(textHas(sleep,['knee chest','knees','گھٹنے'])){ addConstitutionRule(out,'med',1,'knee-chest sleep tendency'); }
    if(textHas(sleep,['3 am','4 am','3-4','صبح 3','صبح 4'])){ addConstitutionRule(out,'kali-c',2,'waking 3-4 am'); addConstitutionRule(out,'nux-v',1,'early waking'); }
    if(textHas(sleep,['unrefreshing','not fresh','تازہ نہیں','neend se fresh nahi'])){ addConstitutionRule(out,'nux-v',1,'unrefreshing sleep'); addConstitutionRule(out,'sulph',1,'unrefreshing sleep'); }
    if(textHas(dreams,['falling','گرنے','girne'])){ addConstitutionRule(out,'thuja',1,'dreams falling'); }
    if(textHas(dreams,['dead','death','موت','murda'])){ addConstitutionRule(out,'ars',1,'death dreams/anxiety'); addConstitutionRule(out,'nat-m',1,'death dreams'); }

    if(textHas(mind,['anxiety','anxious','fear','خوف','گھبراہٹ','پریشانی'])){ addConstitutionRule(out,'ars',3,'anxiety/fear'); addConstitutionRule(out,'acon',2,'acute fear/panic'); addConstitutionRule(out,'phos',1,'anxiety with sensitivity'); }
    if(textHas(mind,['restless','بے چین','bechain'])){ addConstitutionRule(out,'ars',2,'restlessness'); addConstitutionRule(out,'rhus-t',2,'restlessness'); }
    if(textHas(mind,['irritable','anger','غصہ','چڑچڑا','chirchira'])){ addConstitutionRule(out,'nux-v',3,'irritability/anger'); addConstitutionRule(out,'cham',2,'irritable/chamomile state'); }
    if(textHas(mind,['grief','sad','sorrow','غم','اداسی'])){ addConstitutionRule(out,'ign',3,'grief'); addConstitutionRule(out,'nat-m',3,'silent grief'); }
    if(textHas(mind,['consolation worse','تسلی سے خراب','consolation agg'])){ addConstitutionRule(out,'nat-m',3,'consolation aggravates'); }
    if(textHas(mind,['weeps','weeping','cry','رونا','روتا'])){ addConstitutionRule(out,'puls',2,'weeping/needs consolation'); addConstitutionRule(out,'ign',1,'weeping grief'); }
    if(textHas(mind,['company','alone worse','اکیلا','company desire'])){ addConstitutionRule(out,'phos',2,'desires company'); addConstitutionRule(out,'puls',2,'desires consolation/company'); }
    if(textHas(mind,['fastidious','perfection','صفائی','ترتیب'])){ addConstitutionRule(out,'ars',2,'fastidious'); addConstitutionRule(out,'nux-v',1,'fastidious'); }

    if(textHas(persp,['head','سر','sar'])){ addConstitutionRule(out,'calc',2,'head perspiration'); }
    if(textHas(persp,['offensive','bad smell','بدبو','badboo'])){ addConstitutionRule(out,'sulph',2,'offensive sweat'); addConstitutionRule(out,'sil',2,'offensive sweat'); }
    if(textHas(persp,['profuse','زیادہ','bohat'])){ addConstitutionRule(out,'calc',1,'profuse sweat'); addConstitutionRule(out,'merc',1,'profuse sweat'); }

    if(textHas(stool,['constipation','قبض','qabz'])){ addConstitutionRule(out,'nux-v',2,'constipation tendency'); addConstitutionRule(out,'bry',2,'dry constipation'); addConstitutionRule(out,'alum',1,'constipation'); }
    if(textHas(stool,['morning diarrhea','صبح دست','subah dast'])){ addConstitutionRule(out,'sulph',2,'morning diarrhea'); }
    if(textHas(stool,['diarrhea','loose','دست'])){ addConstitutionRule(out,'ars',1,'diarrhea with weakness/anxiety'); addConstitutionRule(out,'puls',1,'loose stool tendency'); }
    if(textHas(urine,['burning','جلن','jalan'])){ addConstitutionRule(out,'canth',2,'burning urine'); addConstitutionRule(out,'sars',1,'urinary burning'); }
    if(textHas(urine,['frequent','بار بار','bar bar'])){ addConstitutionRule(out,'lyc',1,'urinary frequency'); addConstitutionRule(out,'canth',1,'urinary frequency'); }

    if(textHas(miasm,['psora','psoric','سورا'])){ addConstitutionRule(out,'sulph',2,'psoric tendency'); addConstitutionRule(out,'psor',2,'psoric tendency'); }
    if(textHas(miasm,['sycotic','sycosis','سائیکوٹک'])){ addConstitutionRule(out,'thuja',3,'sycotic tendency'); addConstitutionRule(out,'med',2,'sycotic tendency'); }
    if(textHas(miasm,['syphilitic','syphilis','سفلس'])){ addConstitutionRule(out,'merc',2,'syphilitic tendency'); addConstitutionRule(out,'aur',2,'syphilitic/destructive tendency'); }
    if(textHas(miasm,['tubercular','tb','ٹی بی'])){ addConstitutionRule(out,'tub',3,'tubercular tendency'); addConstitutionRule(out,'phos',2,'tubercular tendency'); }
    if(textHas(miasm,['cancer','cancerinic','carc','کینسر'])){ addConstitutionRule(out,'carc',3,'cancerinic tendency'); }

    if(textHas(all,['worse motion','motion worse','حرکت سے خراب'])){ addConstitutionRule(out,'bry',2,'worse motion general'); }
    if(textHas(all,['better motion','motion better','حرکت سے بہتر'])){ addConstitutionRule(out,'rhus-t',2,'better motion general'); }
    if(textHas(all,['better pressure','دباؤ سے بہتر'])){ addConstitutionRule(out,'bry',1,'better pressure'); addConstitutionRule(out,'mag-p',1,'better pressure'); }

    var merged={};
    out.forEach(function(x){
        var k=remedyKey(x.remedy);
        if(!merged[k]) merged[k]={remedy:k, display:x.display||x.remedy, pts:0, reasons:[]};
        merged[k].pts += x.pts;
        merged[k].reasons.push(x.reason+' +'+x.pts);
    });
    return Object.keys(merged).map(function(k){return merged[k];}).sort(function(a,b){return b.pts-a.pts;});
}
function applyConstitutionalSupport(rows){
    var details=(lastAnalysis&&lastAnalysis.caseDetails)||collectCaseDetails();
    var support=constitutionalSupportRules(details);
    if(!support.length) return {rows:rows, support:[]};
    var rowByKey={};
    rows.forEach(function(r){ rowByKey[remedyKey(r.key)]=r; rowByKey[remedyKey(r.display)]=r; });
    support.forEach(function(sup){
        var k=remedyKey(sup.remedy), row=rowByKey[k];
        if(!row && sup.pts>=4){
            row={key:k, display:sup.display||k, baseScore:0, score:0, coverage:0, matches:['Constitutional support only'], diff:0, reasons:[]};
            rows.push(row); rowByKey[k]=row;
        }
        if(row){
            row.score += sup.pts;
            row.constitutional = (row.constitutional||0)+sup.pts;
            row.diff += sup.pts;
            row.reasons = row.reasons || [];
            row.reasons.push('constitution +'+sup.pts);
            row.constitutionReasons = (row.constitutionReasons||[]).concat(sup.reasons.slice(0,4));
        }
    });
    return {rows:rows, support:support};
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
    applyConstitutionalSupport(rows);
    rows.sort(function(a,b){return b.score-a.score || b.coverage-a.coverage || a.display.localeCompare(b.display);});
    return rows;
}
function remedyConfidence(rows){
    if(!rows || !rows.length) return {label:'-', cls:'#7f8c8d', note:''};
    var answered=Object.keys(adxRemedyAnswers||{}).filter(function(k){return adxRemedyAnswers[k] && adxRemedyAnswers[k]!=='unknown';}).length;
    var top=rows[0], second=rows[1]||{score:0};
    var gap=top.score-second.score;
    var constitutionPts=top.constitutional||0;
    if(answered>=3 && gap>=8 && constitutionPts>=2) return {label:'High', cls:'#27ae60', note:'clear lead with differentiation + constitution'};
    if(answered>=3 && gap>=8) return {label:'High', cls:'#27ae60', note:'clear lead after differentiation'};
    if((answered>=2 && gap>=4) || (constitutionPts>=4 && gap>=4)) return {label:'Medium', cls:'#f39c12', note:'some differentiation/constitutional support'};
    return {label:'Low / needs confirmation', cls:'#e67e22', note:'answer more remedy questions and confirm generals'};
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
    var cSupport=constitutionalSupportRules((lastAnalysis&&lastAnalysis.caseDetails)||collectCaseDetails());
    if(cSupport.length){
        h+='<div style="margin-top:8px;padding:7px;background:#f4fbf7;border:1px solid #a9dfbf;border-radius:6px;font-size:12px;"><b>🧬 '+esc(T({ur:'Constitutional support',en:'Constitutional support',roman:'Constitutional support'}))+':</b> ';
        h+=cSupport.slice(0,8).map(function(x){return '<span style="display:inline-block;margin:2px;padding:2px 7px;border-radius:10px;background:#eafaf1;color:#145a32;">'+esc(x.display)+' +'+x.pts+'</span>';}).join(' ');
        h+='<div style="color:#7f8c8d;margin-top:4px;">'+esc(T({ur:'یہ score generals/chronic details سے آیا ہے؛ final remedy سے پہلے doctor confirm کرے۔',en:'These points come from generals/chronic details; doctor should confirm before final remedy.',roman:'Generals se support points.'}))+'</div></div>';
    }
    h+='<div style="overflow-x:auto;margin-top:8px;"><table style="width:100%;border-collapse:collapse;font-size:12px;background:white;"><thead><tr style="background:#fef5e7;color:#7d6608;"><th style="padding:5px;text-align:left;">#</th><th style="padding:5px;text-align:left;">Remedy</th><th style="padding:5px;text-align:left;">Adjusted</th><th style="padding:5px;text-align:left;">Base</th><th style="padding:5px;text-align:left;">Const.</th><th style="padding:5px;text-align:left;">Δ</th><th style="padding:5px;text-align:left;">Why changed</th></tr></thead><tbody>';
    adjusted.slice(0,12).forEach(function(r,i){
        h+='<tr style="border-bottom:1px solid #f4f6f7;"><td style="padding:5px;">'+(i+1)+'</td><td style="padding:5px;font-weight:bold;color:#1a5276;">'+esc(r.display)+'</td><td style="padding:5px;">'+Math.round(r.score)+'</td><td style="padding:5px;">'+Math.round(r.baseScore)+'</td><td style="padding:5px;color:#145a32;">'+(r.constitutional?('+'+Math.round(r.constitutional)):'-')+'</td><td style="padding:5px;color:'+(r.diff>=0?'#27ae60':'#c0392b')+';">'+(r.diff>0?'+':'')+Math.round(r.diff)+'</td><td style="padding:5px;color:#7f8c8d;">'+esc(((r.reasons||[]).slice(0,3).concat((r.constitutionReasons||[]).slice(0,2))).join(' | '))+'</td></tr>';
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
                var best=null;
                if(r.confirmedRid && data[r.confirmedRid]){
                    var rec0=data[r.confirmedRid];
                    best={rid:r.confirmedRid, rec:rec0, path:(rec0.path||rec0.de_path||rec0.t||r.confirmedPath||r.path), score:r.matchScore||1000};
                } else {
                    best=findBestRubric(data,(r.confirmedPath||r.path));
                    if(best) applyBestToRubric(r,best);
                }
                if(!best || !best.rec || !best.rec.r){ errors.push(r.book+'/'+r.chapter+': '+(r.confirmedPath||r.path)); return; }
                matched.push({suggestion:r, found:best.path, rid:best.rid, score:best.score});
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


// ==================== ADX Phase 11: Supabase / cloud sync ====================
function supabaseClient(){
    try { if(typeof sb !== 'undefined' && sb) return sb; } catch(e) {}
    return global.sb || null;
}
function adxRecordType(rec){
    if(!rec) return 'case';
    if(rec._source==='outcome' || rec.kind==='followup_outcome') return 'outcome';
    if(rec.record_type==='outcome') return 'outcome';
    return 'case';
}
function pendingAdxRecords(){ return storageGet('pending_adx_records'); }
function savePendingAdxRecord(rec, type, err){
    if(!rec || !rec.id) return;
    type = type || adxRecordType(rec);
    var arr=pendingAdxRecords();
    var id=type+'|'+rec.id;
    var item={id:id, recordType:type, record:rec, error:err?String(err.message||err):'', queuedAt:new Date().toISOString()};
    var idx=arr.findIndex(function(x){return x.id===id;});
    if(idx>=0) arr[idx]=item; else arr.push(item);
    storageSet('pending_adx_records', arr.slice(-500));
}
function removePendingAdxRecord(rec, type){
    if(!rec || !rec.id) return;
    type = type || adxRecordType(rec);
    var id=type+'|'+rec.id;
    storageSet('pending_adx_records', pendingAdxRecords().filter(function(x){return x.id!==id;}));
}
function updateStoredAdxRecord(rec, type){
    if(!rec || !rec.id) return;
    type = type || adxRecordType(rec);
    var key=type==='outcome'?'adx_outcome_records':'adx_case_records';
    var arr=storageGet(key);
    var idx=arr.findIndex(function(x){return x.id===rec.id;});
    if(idx>=0) arr[idx]=rec; else arr.unshift(rec);
    storageSet(key, arr.slice(0,500));
}
function setCloudStatus(msg, cls){
    var el=$('adxCloudStatus');
    if(el){
        el.innerHTML=msg||'';
        el.style.color=cls||'#7f8c8d';
    }
}
function adxRecordToDb(rec, type){
    type = type || adxRecordType(rec);
    var user='';
    try { user = (typeof currentUserData!=='undefined' && currentUserData && currentUserData.name) ? currentUserData.name : ''; } catch(e) {}
    return {
        id: rec.id,
        record_type: type,
        patient_id: rec.patientId || null,
        visit_ref: rec.visitRef || null,
        patient_name: rec.patient || null,
        saved_at: rec.savedAt || new Date().toISOString(),
        data: rec,
        created_by: user || null,
        updated_at: new Date().toISOString()
    };
}
function dbToAdxRecord(row){
    var rec = row.data || {};
    rec.id = rec.id || row.id;
    rec.kind = rec.kind || (row.record_type==='outcome' ? 'followup_outcome' : 'final_decision');
    rec.patientId = rec.patientId || row.patient_id || '';
    rec.visitRef = rec.visitRef || row.visit_ref || '';
    rec.patient = rec.patient || row.patient_name || '';
    rec.savedAt = rec.savedAt || row.saved_at || row.updated_at || new Date().toISOString();
    rec.cloudStatus='synced';
    rec.cloudSyncedAt=new Date().toISOString();
    return rec;
}
async function checkAdxCloudTable(force){
    if(!force && adxCloudTableReady!==null) return adxCloudTableReady;
    var client=supabaseClient();
    if(!client || !navigator.onLine){ adxCloudTableReady=false; return false; }
    try{
        var r=await client.from(ADX_CLOUD_TABLE).select('id').limit(1);
        if(r.error){
            console.warn('ADX cloud table not ready:', r.error.message||r.error);
            adxCloudTableReady=false;
            return false;
        }
        adxCloudTableReady=true;
        return true;
    }catch(e){
        console.warn('ADX cloud check failed:', e);
        adxCloudTableReady=false;
        return false;
    }
}
async function saveAdxRecordCloud(rec, type){
    var client=supabaseClient();
    if(!client) throw new Error('Supabase client not available');
    if(!(await checkAdxCloudTable(false))) throw new Error('ADX cloud table missing. Run supabase_adx_records_table.sql once.');
    var db=adxRecordToDb(rec,type);
    var r=await client.from(ADX_CLOUD_TABLE).upsert(db,{onConflict:'id'}).select();
    if(r.error) throw r.error;
    rec.cloudStatus='synced'; rec.cloudSyncedAt=new Date().toISOString();
    removePendingAdxRecord(rec,type);
    updateStoredAdxRecord(rec,type);
    return r.data && r.data[0];
}
function scheduleAdxCloudSave(rec, type){
    if(!rec || !rec.id) return;
    type = type || adxRecordType(rec);
    if(!navigator.onLine || !supabaseClient()){
        rec.cloudStatus='pending'; rec.cloudError='offline'; updateStoredAdxRecord(rec,type); savePendingAdxRecord(rec,type,'offline');
        setCloudStatus('☁️ ADX queued for cloud sync (offline)', '#d68910');
        return;
    }
    saveAdxRecordCloud(rec,type).then(function(){
        setCloudStatus('☁️ ADX synced to Supabase', '#27ae60');
    }).catch(function(e){
        rec.cloudStatus='pending'; rec.cloudError=String(e.message||e); updateStoredAdxRecord(rec,type); savePendingAdxRecord(rec,type,e);
        setCloudStatus('⚠️ ADX cloud pending: '+esc(e.message||e), '#c0392b');
    });
}
async function deleteAdxRecordCloud(id){
    if(!id || !navigator.onLine || !supabaseClient()) return;
    if(!(await checkAdxCloudTable(false))) return;
    try{ await supabaseClient().from(ADX_CLOUD_TABLE).delete().eq('id', id); }catch(e){ console.warn(e); }
}
function mergeCloudAdxRecords(rows){
    var caseMap={}, outMap={};
    storageGet('adx_case_records').forEach(function(x){caseMap[x.id]=x;});
    storageGet('adx_outcome_records').forEach(function(x){outMap[x.id]=x;});
    (rows||[]).forEach(function(row){
        var rec=dbToAdxRecord(row);
        if((row.record_type||adxRecordType(rec))==='outcome') outMap[rec.id]=rec;
        else caseMap[rec.id]=rec;
    });
    var cases=Object.keys(caseMap).map(function(k){return caseMap[k];}).sort(function(a,b){return String(b.savedAt||'').localeCompare(String(a.savedAt||''));}).slice(0,500);
    var outs=Object.keys(outMap).map(function(k){return outMap[k];}).sort(function(a,b){return String(b.savedAt||'').localeCompare(String(a.savedAt||''));}).slice(0,500);
    storageSet('adx_case_records', cases);
    storageSet('adx_outcome_records', outs);
}
async function pullAdxCloudRecords(showMsg){
    var client=supabaseClient();
    if(!client || !navigator.onLine){ if(showMsg!==false) toast('⚠️ Offline / Supabase unavailable','error'); return false; }
    if(!(await checkAdxCloudTable(true))){
        if(showMsg!==false) toast('⚠️ ADX Supabase table missing. Upload/run supabase_adx_records_table.sql first.','error');
        setCloudStatus('⚠️ Cloud table missing: run SQL setup file', '#c0392b');
        return false;
    }
    var r=await client.from(ADX_CLOUD_TABLE).select('*').order('saved_at',{ascending:false}).limit(1000);
    if(r.error){ if(showMsg!==false) toast('❌ Pull failed: '+r.error.message,'error'); return false; }
    mergeCloudAdxRecords(r.data||[]);
    if(showMsg!==false) toast('✅ Pulled '+(r.data||[]).length+' ADX cloud records');
    return true;
}
async function syncAdxRecordsWithCloud(showMsg){
    if(adxCloudSyncBusy) return;
    adxCloudSyncBusy=true;
    setCloudStatus('☁️ Syncing ADX records...', '#2980b9');
    try{
        var client=supabaseClient();
        if(!client || !navigator.onLine) throw new Error('Offline / Supabase unavailable');
        if(!(await checkAdxCloudTable(true))) throw new Error('ADX cloud table missing. Run supabase_adx_records_table.sql once.');
        var upload=[];
        storageGet('adx_case_records').forEach(function(r){upload.push({type:'case',rec:r});});
        storageGet('adx_outcome_records').forEach(function(r){upload.push({type:'outcome',rec:r});});
        pendingAdxRecords().forEach(function(x){ if(x && x.record) upload.push({type:x.recordType||adxRecordType(x.record), rec:x.record}); });
        var sent=0, failed=0;
        for(var i=0;i<upload.length;i++){
            try{ await saveAdxRecordCloud(upload[i].rec, upload[i].type); sent++; }
            catch(e){ failed++; savePendingAdxRecord(upload[i].rec, upload[i].type, e); }
        }
        var r=await client.from(ADX_CLOUD_TABLE).select('*').order('saved_at',{ascending:false}).limit(1000);
        if(r.error) throw r.error;
        mergeCloudAdxRecords(r.data||[]);
        setCloudStatus('☁️ Synced: '+sent+' uploaded, '+(r.data||[]).length+' cloud records pulled'+(failed?(', '+failed+' pending'):''), failed?'#d68910':'#27ae60');
        if(showMsg!==false) toast('✅ ADX cloud sync complete');
        if($('adxAnalyticsContent')) showAnalytics();
    }catch(e){
        setCloudStatus('⚠️ Cloud sync failed: '+esc(e.message||e), '#c0392b');
        if(showMsg!==false) toast('⚠️ ADX cloud sync failed: '+(e.message||e), 'error');
    }finally{ adxCloudSyncBusy=false; }
}
function cloudStatusSummary(){
    var pending=pendingAdxRecords().length;
    var local=storageGet('adx_case_records').length+storageGet('adx_outcome_records').length;
    return '<span style="font-size:11px;color:#7f8c8d;">Local ADX: '+local+' | Pending cloud: '+pending+'</span>';
}
function currentPatientHint(){
    var names=[];
    ['diagnosisPatientName','nvPatientName'].forEach(function(id){ var el=$(id); if(el && el.textContent) names.push(el.textContent.trim()); });
    if($('patientName') && $('patientName').value) names.push($('patientName').value.trim());
    return names[0] || '';
}

function currentPatientIdHint(){
    try{ if(typeof diagnosisPatientId!=='undefined' && diagnosisPatientId) return diagnosisPatientId; }catch(e){}
    if($('nvPatientId') && $('nvPatientId').value) return $('nvPatientId').value;
    if($('patientId') && $('patientId').value) return $('patientId').value;
    return '';
}
function currentVisitRefHint(){
    if($('nvVisitRef') && $('nvVisitRef').value) return $('nvVisitRef').value;
    if($('firstVisitRef') && $('firstVisitRef').value) return $('firstVisitRef').value;
    return '';
}
function finalCaseRecord(kind){
    var adjusted=getAdjustedRows();
    var fd=getFinalDecision();
    var out=getOutcome();
    return {
        id: adxLastSavedCaseId || ('adx_'+Date.now()+'_'+Math.random().toString(36).slice(2,7)),
        kind: kind || 'case', savedAt: new Date().toISOString(), patient: currentPatientHint(), patientId: currentPatientIdHint(), visitRef: currentVisitRefHint(),
        statement: val('adxStatement'), extracted: lastAnalysis ? Object.keys(lastAnalysis.extracted.found||{}).map(symptomName) : [],
        redFlags: lastAnalysis ? (lastAnalysis.redFlags||[]).map(function(r){return r.label+' - '+r.reason;}) : [],
        differentials: lastAnalysis ? (lastAnalysis.differentials||[]).slice(0,8).map(function(r){return {id:r.condition.id, name:T(r.condition.name), percentage:r.percentage, severity:r.condition.severity};}) : [],
        selectedRubrics: selectedRubrics().map(function(r){return {book:r.book, chapter:r.chapter, path:r.path, confirmedPath:r.confirmedPath||'', confirmedRid:r.confirmedRid||'', matchScore:r.matchScore||0, matchStatus:r.matchStatus||'', symptom:r.symptom, weight:r.weight};}),
        topRemedies: adjusted.slice(0,10).map(function(r){return {remedy:r.display, score:Math.round(r.score), base:Math.round(r.baseScore||r.score), constitutional:Math.round(r.constitutional||0), coverage:r.coverage};}),
        constitutionalSupport: constitutionalSupportRules(collectCaseDetails()).slice(0,12),
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
    scheduleAdxCloudSave(rec,'case');
    copyFinalToVisit(false);
    toast('✅ Final diagnosis/remedy saved locally and copied to visit fields');
    var sim=$('adxSimilarCases'); if(sim) sim.innerHTML=renderSimilarCases();
}
function saveOutcome(){
    if(!lastAnalysis){ toast('No analysis yet','error'); return; }
    var rec=finalCaseRecord('followup_outcome');
    var arr=storageGet('adx_outcome_records'); arr.unshift(rec); storageSet('adx_outcome_records', arr.slice(0,300));
    scheduleAdxCloudSave(rec,'outcome');
    toast('✅ Follow-up outcome saved locally');
    var sim=$('adxSimilarCases'); if(sim) sim.innerHTML=renderSimilarCases();
}
function finalSummaryText(){
    if(!lastAnalysis) return '';
    var fd=getFinalDecision(), out=getOutcome(), gen=caseDetailsText();
    var txt=summaryText(lastAnalysis);
    txt += '\n\nFINAL DECISION\nDiagnosis: '+(fd.diagnosis||'')+'\nRemedy: '+(fd.remedy||'')+'\nConfidence: '+(fd.confidence||'')+'\nNotes: '+(fd.notes||'');
    var sp=specialtyText(collectSpecialtyData());
    if(sp) txt += '\n\nSPECIALTY MODULE\n'+sp;
    if(gen) txt += '\n\nGENERALS\n'+gen;
    var cs=constitutionalSupportRules(collectCaseDetails());
    if(cs.length) txt += '\n\nCONSTITUTIONAL SUPPORT\n'+cs.slice(0,10).map(function(x){return x.display+' +'+x.pts+' ('+x.reasons.slice(0,3).join('; ')+')';}).join('\n');
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
        var patientBonus=(cur.patientId && c.patientId && cur.patientId===c.patientId)?5:0;
        c._sim=dxHit+symHit+rub*2+patientBonus;
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
        h+='<div style="font-size:11px;color:#7f8c8d;">'+esc(c.group)+' | '+esc(c.severity||'routine')+(r.specialtyBonus?' | specialty +'+Math.round(r.specialtyBonus):'')+'</div>';
        h+='<div style="font-size:12px;margin-top:5px;"><b>Matched:</b> '+r.matched.map(function(m){return esc(symptomName(m.key));}).join('، ')+'</div>';
        if(r.specialtyReasons && r.specialtyReasons.length) h+='<div style="font-size:11px;color:#8e44ad;"><b>Specialty:</b> '+esc(r.specialtyReasons.slice(0,4).join(' | '))+'</div>';
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
        h+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;"><button class="btn btn-success btn-sm" type="button" onclick="ADX_analyzeSelectedRubrics()">💊 '+esc(T({ur:'Selected rubrics سے remedies نکالیں',en:'Analyze selected rubrics',roman:'Selected rubrics analyze'}))+'</button><button class="btn btn-info btn-sm" type="button" onclick="ADX_confirmSuggestedRubrics()">🎯 '+esc(T({ur:'Exact rubrics confirm کریں',en:'Confirm exact rubrics',roman:'Exact rubrics confirm'}))+'</button><button class="btn btn-purple btn-sm" type="button" onclick="ADX_addCustomRubric()">➕ '+esc(T({ur:'Rubric add',en:'Add rubric',roman:'Add rubric'}))+'</button><button class="btn btn-light btn-sm" type="button" onclick="ADX_setAllRubrics(true)">✓ All</button><button class="btn btn-light btn-sm" type="button" onclick="ADX_setAllRubrics(false)">✕ None</button><span id="adxRubricConfirmStatus" style="font-size:11px;color:#7f8c8d;align-self:center;"></span></div>';
    }
    a.rubrics.slice(0,35).forEach(function(r,i){
        var checked = r.selected !== false ? ' checked' : '';
        var st=r.matchStatus?{label:r.matchStatus,color:(r.matchColor||'#7f8c8d')}:rubricMatchStatus(r.matchScore||0);
        var exact = r.confirmedPath ? ('<div style="flex-basis:100%;font-size:11px;color:#145a32;margin-left:22px;">✓ '+esc(T({ur:'Exact',en:'Exact',roman:'Exact'}))+': '+esc(r.confirmedPath)+' '+(r.confirmedRid?'<small>#'+esc(r.confirmedRid)+'</small>':'')+'</div>') : '';
        h+='<div style="padding:6px 8px;background:#fff;border:1px solid #eef2f5;border-radius:6px;margin:3px 0;font-size:12px;display:flex;gap:7px;align-items:flex-start;flex-wrap:wrap;"><label style="display:flex;gap:5px;align-items:center;"><input type="checkbox" onchange="ADX_toggleRubric('+i+')"'+checked+'> <b>'+esc(r.book)+'</b></label><span>/ '+esc(r.chapter)+' — '+esc(r.path)+' <small style="color:#7f8c8d;">['+esc(symptomName(r.symptom))+']</small></span><span style="background:'+st.color+';color:white;padding:1px 7px;border-radius:10px;font-size:10px;">'+esc(st.label)+'</span><button class="btn btn-info btn-xs" type="button" onclick="ADX_openExactRubric('+i+')">🔍 '+esc(T({ur:'اوپن',en:'Open',roman:'Open'}))+'</button><button class="btn btn-light btn-xs" type="button" onclick="ADX_confirmOneRubric('+i+')">🎯 '+esc(T({ur:'Confirm',en:'Confirm',roman:'Confirm'}))+'</button><button class="btn btn-light btn-xs" type="button" onclick="ADX_editRubricPath('+i+')">✎</button><button class="btn btn-light btn-xs" type="button" onclick="ADX_removeRubric('+i+')">✕</button>'+exact+'</div>';
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
    var specialty=collectSpecialtyData();
    var spText=specialtyText(specialty);
    if(genText) text += '\nGenerals: '+genText;
    if(spText) text += '\nSpecialty module: '+spText;
    lastAnalysis=analyze(text, extra, specialty);
    lastAnalysis.caseDetails=details;
    lastAnalysis.specialty=specialty;
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

// ==================== ADX Phase 8: Specialty guided modules ====================
var ADX_SPECIALTY_MODULES = {
    fever:{title:{ur:'Fever / بخار module',en:'Fever module',roman:'Fever module'}, red:['Confusion/altered sensorium','Neck stiffness','Bleeding/rash','Persistent vomiting','Severe abdominal pain','Low urine','Breathlessness','Fits/seizure'], questions:['Duration and maximum temperature?','Continuous, remittent or intermittent?','Chills/rigors and sweating?','Body/bone pain or retro-orbital pain?','Rash or bleeding?','Cough/sore throat?','Urinary burning?','Diarrhea/vomiting?','Dengue/malaria/typhoid exposure?'], findings:['fever 3 days','high fever 103 F','chills with fever','sweat after fever','body pain','bone breaking pain','pain behind eyes','rash','bleeding gums','vomiting','low urine','dengue exposure','malaria exposure','typhoid suspicion']},
    headache:{title:{ur:'Headache / سر درد module',en:'Headache module',roman:'Headache module'}, red:['Sudden worst headache','Fever with neck stiffness','Vision loss','Weakness/numbness/speech problem','High BP','Head injury','New headache after age 50'], questions:['Location and side?','Throbbing/pressing/burning?','Light/noise sensitivity?','Nausea or vomiting?','Sinus/nasal symptoms?','BP reading?','Neurological symptoms?','Better sleep/rest/pressure?'], findings:['headache','severe headache','throbbing headache','worse light','worse noise','better sleep','nausea with headache','vomiting with headache','forehead pain','one sided headache','neck stiffness','blurred vision','high BP']},
    cough_chest:{title:{ur:'Cough / Chest / سانس module',en:'Cough / chest module',roman:'Cough/chest module'}, red:['Severe breathlessness','Chest pain with sweating','Blue lips','Blood in sputum','SpO2 low','Cough > 2 weeks with weight loss/night sweats','Child with poor feeding'], questions:['Dry or productive cough?','Sputum color and amount?','Fever?','Breathlessness/wheezing?','Chest pain?','Blood in sputum?','Duration >2 weeks?','Asthma/TB/contact/smoking history?'], findings:['dry cough','productive cough','yellow sputum','green sputum','blood in sputum','breathlessness','wheezing','chest tightness','chest pain','fever with cough','cough more than 2 weeks','night sweats','weight loss','asthma history','TB contact']},
    gi:{title:{ur:'Abdomen / GI / پیٹ module',en:'Abdomen / GI module',roman:'Pait/GI module'}, red:['Severe sudden abdominal pain','Rigid abdomen','Blood in stool/vomit','Black stool','Persistent vomiting','Severe dehydration','Pregnancy with abdominal pain'], questions:['Pain location?','Relation to food?','Vomiting/diarrhea frequency?','Blood/black stool?','Fever?','Urine amount and dehydration?','Right lower or right upper pain?'], findings:['abdominal pain','epigastric pain','right lower abdominal pain','right upper abdominal pain','nausea','vomiting','persistent vomiting','diarrhea','bloody diarrhea','black stool','heartburn acidity','loss of appetite','dehydration','constipation']},
    urinary:{title:{ur:'Urinary / Kidney / پیشاب module',en:'Urinary / kidney module',roman:'Peshab/kidney module'}, red:['Fever with flank pain','Low/no urine','Blood in urine','Severe colic with vomiting','Pregnancy urinary infection'], questions:['Burning/frequency/urgency?','Fever?','Flank/loin pain?','Blood in urine?','Urine amount?','Stone history?','Pregnancy?'], findings:['burning urine','frequent urination','urgent urination','flank pain','kidney pain','blood in urine','low urine','fever with urinary symptoms','renal colic','stone history']},
    female:{title:{ur:'Female complaints / خواتین module',en:'Female complaints module',roman:'Female module'}, red:['Pregnancy with bleeding','Severe pelvic pain','Fainting with missed period','Heavy bleeding with weakness','Fever with pelvic pain/discharge'], questions:['LMP and pregnancy possibility?','Bleeding amount?','Pelvic pain?','Vaginal discharge/itching?','Fever?','Urinary symptoms?','Cycle regularity?'], findings:['pregnancy','missed period','pelvic pain','vaginal discharge','itching vaginal','heavy menses','painful menses','irregular menses','bleeding in pregnancy','fever with pelvic pain','breast pain']},
    child:{title:{ur:'Child fever / Pediatric module',en:'Child / pediatric module',roman:'Child module'}, red:['Age <3 months fever','Poor feeding','Lethargy/confusion','Fits','Breathlessness','Dehydration','Persistent vomiting','Non-blanching rash'], questions:['Age and weight?','Feeding?','Urine count?','Breathing difficulty?','Fits/lethargy?','Vomiting/diarrhea?','Rash?','Vaccination status?'], findings:['child fever','baby not feeding','poor feeding','child lethargic','fits with fever','child breathlessness','child dehydration','low urine child','vomiting child','diarrhea child','rash child']},
    skin:{title:{ur:'Skin / جلد module',en:'Skin module',roman:'Skin module'}, red:['Rapidly spreading redness with fever','Facial/lip/tongue swelling','Breathlessness with rash','Severe pain/necrosis','Immunocompromised/diabetic infection'], questions:['Itching or pain?','Rash type: red/scaly/blister/pus?','Fever?','Trigger/allergy/contact?','Distribution?','Recurrent?'], findings:['rash','itching','red skin','scaly skin','blisters vesicles','pus boil abscess','urticaria hives','fungal skin','eczema','scabies','allergy rash']},
    chronic:{title:{ur:'Chronic / Constitutional module',en:'Chronic / constitutional module',roman:'Chronic module'}, red:['Unexplained weight loss','Night sweats','Persistent fever','Blood in stool/urine/sputum','Progressive weakness','New lump'], questions:['Main chronic complaint timeline?','Thermal state?','Thirst/appetite/cravings/aversions?','Sleep/dreams?','Mind/emotional state?','Past/family history?','Suppression/medication history?'], findings:['chronic complaint','recurrent complaint','weight loss','night sweats','fatigue chronic','hot patient','chilly patient','thirstless','small sips','desire sweets','desire salt','grief','anxiety','insomnia','family history']}
};
function pushUnique(arr, items){
    (items||[]).forEach(function(x){ if(arr.indexOf(x)===-1) arr.push(x); });
}
function expandSpecialtyData(){
    function addModule(key, obj){
        if(!ADX_SPECIALTY_MODULES[key]) ADX_SPECIALTY_MODULES[key]=obj;
        else { pushUnique(ADX_SPECIALTY_MODULES[key].red, obj.red); pushUnique(ADX_SPECIALTY_MODULES[key].questions, obj.questions); pushUnique(ADX_SPECIALTY_MODULES[key].findings, obj.findings); }
    }
    addModule('cardiac_emergency',{title:{ur:'Cardiac emergency / دل module',en:'Cardiac emergency module',roman:'Cardiac module'}, red:['Chest pain with sweating','Left arm/jaw radiation','Severe breathlessness','Fainting/low BP','Known diabetes/hypertension','Irregular pulse'], questions:['Exact chest pain site and character?','Radiation to left arm/jaw/back?','Sweating/nausea/breathlessness?','Pain on exertion or at rest?','BP, sugar, pulse, ECG available?','Past heart disease?'], findings:['central chest pain','left arm pain','jaw pain','cold sweat','breathlessness with chest pain','palpitation','fainting','high BP','diabetes history','pain on exertion']});
    addModule('ent_eye_dental',{title:{ur:'ENT / Eye / Dental module',en:'ENT / Eye / Dental module',roman:'ENT Eye Dental'}, red:['Vision loss','Severe red eye with headache/vomiting','Facial swelling with fever','Ear pain with mastoid swelling','Dental abscess with fever','Difficulty swallowing/breathing'], questions:['Main site: ear/nose/throat/eye/tooth?','Discharge color?','Fever or swelling?','Vision/hearing affected?','Pain worse chewing/swallowing?','Allergy/sneezing or infection?'], findings:['ear pain','ear discharge','sore throat','tonsil pain','runny nose','blocked nose','sneezing','facial pain sinus','red eye','eye discharge','vision loss','tooth pain','gum swelling','mouth ulcer']});
    addModule('msk_injury',{title:{ur:'MSK / injury / جوڑ درد module',en:'MSK / injury module',roman:'MSK injury'}, red:['Trauma with deformity','Loss of power/sensation','Severe back pain with bladder/bowel issue','Hot swollen joint with fever','Unable to bear weight','Progressive neurological signs'], questions:['Injury or spontaneous?','Exact joint/area?','Swelling/redness/heat?','Worse first motion or continued motion?','Radiation/numbness/weakness?','Fever or morning stiffness?'], findings:['injury trauma fall','joint pain','joint swelling','hot red joint','back pain','low back pain','sciatica','neck pain','morning stiffness','better motion','worse motion','gout uric acid']});
    addModule('endocrine_metabolic',{title:{ur:'Endocrine / metabolic module',en:'Endocrine / metabolic module',roman:'Endocrine module'}, red:['Low sugar confusion/fainting','Very high sugar with vomiting/dehydration','Heat stroke confusion','Severe weakness with dehydration','New severe weight loss','Palpitations with tremor'], questions:['Blood sugar reading?','Thirst/urination/appetite?','Weight change?','Heat/cold intolerance?','Tremor/palpitations?','Diet/medication history?','CBC/TSH/HbA1c available?'], findings:['high sugar','low sugar','excessive thirst','frequent urination','increased hunger','weight loss','fatigue','cold intolerance','heat intolerance','tremor','palpitation','dehydration','heat stroke']});
    pushUnique(ADX_SPECIALTY_MODULES.fever.questions,['Platelet count or CBC available?','Fever pattern: quotidian/alternate day/step-ladder?','Any recent mosquito bites or contaminated food?','Any antibiotics/antipyretics already taken?']);
    pushUnique(ADX_SPECIALTY_MODULES.fever.findings,['platelets low','alternate day fever','step ladder fever','mosquito exposure','contaminated food','antibiotics taken','paracetamol response']);
    pushUnique(ADX_SPECIALTY_MODULES.headache.questions,['Aura before headache?','Worse bending forward?','Temporal relation to menses?','Any weakness/numbness/speech problem?']);
    pushUnique(ADX_SPECIALTY_MODULES.headache.findings,['aura before headache','worse bending forward','headache during menses','weakness one side','speech problem']);
    pushUnique(ADX_SPECIALTY_MODULES.cough_chest.questions,['SpO2 reading?','Orthopnea or worse lying flat?','Night cough?','Any leg swelling?']);
    pushUnique(ADX_SPECIALTY_MODULES.cough_chest.findings,['SpO2 low','orthopnea','night cough','leg swelling','worse lying flat']);
    pushUnique(ADX_SPECIALTY_MODULES.gi.questions,['Pain migration?','Stool frequency and dehydration signs?','Any jaundice?','Any recent outside food?']);
    pushUnique(ADX_SPECIALTY_MODULES.gi.findings,['pain migrated to right lower abdomen','outside food','jaundice','watery diarrhea','tenesmus']);
    pushUnique(ADX_SPECIALTY_MODULES.urinary.questions,['Pregnancy?','Diabetes?','Urine smell/color?','Pain radiates to groin?']);
    pushUnique(ADX_SPECIALTY_MODULES.urinary.findings,['pain radiates to groin','diabetes with UTI','foul urine','cloudy urine']);
    pushUnique(ADX_SPECIALTY_MODULES.female.questions,['Postpartum or breastfeeding?','Foul smell discharge?','Pain relation to cycle?','Any contraception/IUD?']);
    pushUnique(ADX_SPECIALTY_MODULES.female.findings,['postpartum fever','breastfeeding mastitis','foul vaginal discharge','IUD history','pain mid-cycle']);
    pushUnique(ADX_SPECIALTY_MODULES.child.questions,['Activity/playfulness?','Respiratory rate?','Capillary refill/cold extremities?','Danger signs according to mother?']);
    pushUnique(ADX_SPECIALTY_MODULES.child.findings,['child not playful','fast breathing child','cold extremities child','mother says very sick']);
    pushUnique(ADX_SPECIALTY_MODULES.skin.questions,['Blanching or non-blanching rash?','Pain out of proportion?','Contact/food/drug trigger?','Family itching at night?']);
    pushUnique(ADX_SPECIALTY_MODULES.skin.findings,['non blanching rash','drug allergy','food allergy','family itching at night','pain out of proportion']);
    pushUnique(ADX_SPECIALTY_MODULES.chronic.questions,['Medication suppression history?','Repeated antibiotics/steroids?','Family history: diabetes/TB/cancer/asthma?','Personal timeline from first illness?']);
    pushUnique(ADX_SPECIALTY_MODULES.chronic.findings,['repeated antibiotics','steroid history','family diabetes','family TB','family cancer','suppressed eruptions']);
}
expandSpecialtyData();

function specialtyOptionHtml(){ var h=''; Object.keys(ADX_SPECIALTY_MODULES).forEach(function(k){ h+='<option value="'+k+'">'+esc(T(ADX_SPECIALTY_MODULES[k].title))+'</option>'; }); return h; }
function renderSpecialtyModule(key){
    var m=ADX_SPECIALTY_MODULES[key] || ADX_SPECIALTY_MODULES.fever;
    var h='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px;margin-top:8px;">';
    h+='<div><div style="font-weight:bold;color:#c0392b;margin-bottom:4px;">⚠️ Red flags to rule out</div>'+(m.red||[]).map(function(x){return '<div style="font-size:12px;padding:3px 0;">• '+esc(x)+'</div>';}).join('')+'</div>';
    h+='<div><div style="font-weight:bold;color:#1a5276;margin-bottom:4px;">❓ Focused questions</div>'+(m.questions||[]).map(function(x,i){return '<div style="font-size:12px;padding:3px 0;">'+(i+1)+'. '+esc(x)+'</div>';}).join('')+'</div>';
    h+='</div><div style="margin-top:8px;"><div style="font-weight:bold;color:#145a32;margin-bottom:4px;">➕ Quick findings</div>';
    (m.findings||[]).forEach(function(x){ h+='<button type="button" onclick="ADX_addSpecialtyFinding(\''+String(x).replace(/'/g,"\\'")+'\')" style="margin:2px;padding:4px 8px;border:none;border-radius:12px;background:#eafaf1;color:#145a32;cursor:pointer;font-size:11px;font-family:inherit;">+'+esc(x)+'</button>'; });
    h+='</div>'; return h;
}
function injectSpecialtyPanel(){
    var anchor=$('adxCaseDetailsPanel') || $('adxStatement'); if(!anchor || $('adxSpecialtyPanel')) return;
    var div=document.createElement('div'); div.id='adxSpecialtyPanel'; div.style.cssText='margin-top:10px;border:1px solid #e8daef;background:#fdfbff;border-radius:8px;padding:10px;';
    div.innerHTML='<details open><summary style="cursor:pointer;font-weight:bold;color:#8e44ad;">🧭 '+esc(T({ur:'Specialty guided modules',en:'Specialty guided modules',roman:'Specialty modules'}))+'</summary>'+
        '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;"><label style="font-weight:bold;color:#566573;">Module:</label><select id="adxSpecialtySelect" onchange="ADX_renderSpecialtySelected()" style="padding:6px;border:1px solid #d7bde2;border-radius:6px;font-family:inherit;">'+specialtyOptionHtml()+'</select><button type="button" class="btn btn-info btn-sm" onclick="ADX_addSpecialtyToStatement()">➕ Add notes to statement</button></div>'+
        '<div id="adxSpecialtyContent">'+renderSpecialtyModule('fever')+'</div>'+
        '<textarea id="adxSpecialtyNotes" style="width:100%;min-height:55px;margin-top:8px;border:1px solid #d7bde2;border-radius:6px;padding:7px;font-family:inherit;font-size:12px;" placeholder="Selected module findings / answers will appear here..."></textarea>'+
        '</details>';
    anchor.insertAdjacentElement('afterend', div);
}
function renderSpecialtySelected(){ var sel=$('adxSpecialtySelect'); var c=$('adxSpecialtyContent'); if(c) c.innerHTML=renderSpecialtyModule(sel?sel.value:'fever'); }
function addSpecialtyFinding(txt){ var ta=$('adxSpecialtyNotes'); if(!ta) return; var line='• '+txt; if(ta.value.indexOf(line)===-1) ta.value=(ta.value?ta.value+'\n':'')+line; }
function addSpecialtyToStatement(){ var notes=val('adxSpecialtyNotes'); if(!notes){ toast('No specialty findings selected','error'); return; } var ta=$('adxStatement'); if(ta) ta.value=(ta.value?ta.value+'\n':'')+'Specialty findings:\n'+notes; }
function collectSpecialtyData(){ var sel=$('adxSpecialtySelect'); var key=sel?sel.value:'fever'; var m=ADX_SPECIALTY_MODULES[key]||ADX_SPECIALTY_MODULES.fever; return {module:key,title:T(m.title),notes:val('adxSpecialtyNotes')}; }
function specialtyText(data){ data=data||collectSpecialtyData(); return (data.title||'')+(data.notes?': '+data.notes.replace(/\n/g,'; '):''); }

// ==================== ADX Phase 5: Outcome analytics dashboard + records manager ====================
function allAdxRecords(){
    var cases=storageGet('adx_case_records').map(function(x){x._source='case'; return x;});
    var outs=storageGet('adx_outcome_records').map(function(x){x._source='outcome'; return x;});
    var all=cases.concat(outs);
    all.sort(function(a,b){ return String(b.savedAt||'').localeCompare(String(a.savedAt||'')); });
    return all;
}
function safePct(x){ var n=parseFloat(x); return isNaN(n)?null:n; }
function countBy(arr, fn){
    var m={}; arr.forEach(function(x){ var k=fn(x)||'Unknown'; m[k]=(m[k]||0)+1; });
    return Object.keys(m).map(function(k){return {name:k,count:m[k]};}).sort(function(a,b){return b.count-a.count || a.name.localeCompare(b.name);});
}
function avg(nums){ nums=nums.filter(function(n){return typeof n==='number'&&!isNaN(n);}); if(!nums.length) return null; return Math.round(nums.reduce(function(a,b){return a+b;},0)/nums.length); }
function analyticsData(){
    var cases=storageGet('adx_case_records');
    var outcomes=storageGet('adx_outcome_records');
    var all=allAdxRecords();
    var outcomePerc=outcomes.map(function(r){return safePct(r.outcome&&r.outcome.percent);}).filter(function(n){return n!==null;});
    var byDiagnosis=countBy(all, function(r){ return (r.finalDecision&&r.finalDecision.diagnosis) || (r.differentials&&r.differentials[0]&&r.differentials[0].name); });
    var byRemedy=countBy(all, function(r){ return (r.finalDecision&&r.finalDecision.remedy) || (r.topRemedies&&r.topRemedies[0]&&r.topRemedies[0].remedy); });
    var byResponse=countBy(outcomes, function(r){ return r.outcome&&r.outcome.response; });
    var redFlagCount=all.filter(function(r){ return r.redFlags && r.redFlags.length; }).length;
    var remedyStats={};
    outcomes.forEach(function(r){
        var rem=(r.finalDecision&&r.finalDecision.remedy) || (r.topRemedies&&r.topRemedies[0]&&r.topRemedies[0].remedy) || 'Unknown';
        if(!remedyStats[rem]) remedyStats[rem]={name:rem,count:0,better:0,perc:[]};
        remedyStats[rem].count++;
        if((r.outcome&&r.outcome.response)==='Better') remedyStats[rem].better++;
        var p=safePct(r.outcome&&r.outcome.percent); if(p!==null) remedyStats[rem].perc.push(p);
    });
    var remedyRows=Object.keys(remedyStats).map(function(k){ var x=remedyStats[k]; x.avg=avg(x.perc); return x; }).sort(function(a,b){return b.count-a.count || (b.avg||0)-(a.avg||0);});
    return {cases:cases,outcomes:outcomes,all:all,total:all.length,avgImprovement:avg(outcomePerc),byDiagnosis:byDiagnosis,byRemedy:byRemedy,byResponse:byResponse,redFlagCount:redFlagCount,remedyRows:remedyRows};
}
function barHtml(rows, color){
    if(!rows.length) return '<div style="color:#95a5a6;font-size:12px;">No data yet</div>';
    var max=Math.max.apply(null, rows.map(function(r){return r.count;}));
    var h='';
    rows.slice(0,8).forEach(function(r){
        var w=max?Math.round((r.count/max)*100):0;
        h+='<div style="margin:5px 0;font-size:12px;"><div style="display:flex;justify-content:space-between;gap:8px;"><span>'+esc(r.name)+'</span><b>'+r.count+'</b></div><div style="height:7px;background:#ecf0f1;border-radius:6px;overflow:hidden;"><div style="height:7px;width:'+w+'%;background:'+color+';"></div></div></div>';
    });
    return h;
}
function renderAnalyticsDashboard(){
    var d=analyticsData();
    var h='<div style="padding:10px;background:#ffffff;border:1px solid #d6eaf8;border-radius:8px;">';
    h+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-bottom:10px;">';
    function card(label,val,color){ return '<div style="background:'+color+';color:white;border-radius:8px;padding:10px;text-align:center;"><div style="font-size:20px;font-weight:bold;">'+esc(val)+'</div><div style="font-size:11px;opacity:.9;">'+esc(label)+'</div></div>'; }
    h+=card('Saved cases', d.cases.length, '#1a5276');
    h+=card('Outcome records', d.outcomes.length, '#16a085');
    h+=card('Avg improvement', d.avgImprovement===null?'-':(d.avgImprovement+'%'), '#8e44ad');
    h+=card('Red-flag cases', d.redFlagCount, '#c0392b');
    h+='</div>';
    h+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;">';
    h+='<div><div style="font-weight:bold;color:#1a5276;margin-bottom:5px;">Top diagnoses</div>'+barHtml(d.byDiagnosis,'#2980b9')+'</div>';
    h+='<div><div style="font-weight:bold;color:#1a5276;margin-bottom:5px;">Top remedies</div>'+barHtml(d.byRemedy,'#27ae60')+'</div>';
    h+='<div><div style="font-weight:bold;color:#1a5276;margin-bottom:5px;">Outcome response</div>'+barHtml(d.byResponse,'#f39c12')+'</div>';
    h+='</div>';
    if(d.remedyRows.length){
        h+='<div style="margin-top:12px;font-weight:bold;color:#1a5276;">Remedy outcome hints</div><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;background:white;"><thead><tr style="background:#eafaf1;"><th style="text-align:left;padding:5px;">Remedy</th><th style="text-align:left;padding:5px;">Cases</th><th style="text-align:left;padding:5px;">Better</th><th style="text-align:left;padding:5px;">Avg %</th></tr></thead><tbody>';
        d.remedyRows.slice(0,10).forEach(function(r){ h+='<tr style="border-bottom:1px solid #eef2f5;"><td style="padding:5px;font-weight:bold;">'+esc(r.name)+'</td><td style="padding:5px;">'+r.count+'</td><td style="padding:5px;">'+r.better+'</td><td style="padding:5px;">'+(r.avg===null?'-':r.avg+'%')+'</td></tr>'; });
        h+='</tbody></table></div>';
    }
    h+=renderRecentRecords(d.all);
    h+='</div>';
    return h;
}
function renderRecentRecords(records){
    var h='<div style="margin-top:12px;font-weight:bold;color:#1a5276;">Recent ADX records</div>';
    if(!records.length) return h+'<div style="color:#95a5a6;font-size:12px;">No saved ADX records yet.</div>';
    h+='<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;background:white;"><thead><tr style="background:#f4f6f8;"><th style="padding:5px;text-align:left;">Date</th><th style="padding:5px;text-align:left;">Type</th><th style="padding:5px;text-align:left;">Patient/Visit</th><th style="padding:5px;text-align:left;">Diagnosis</th><th style="padding:5px;text-align:left;">Remedy</th><th style="padding:5px;text-align:left;">Outcome</th><th style="padding:5px;text-align:left;">Actions</th></tr></thead><tbody>';
    records.slice(0,20).forEach(function(r){
        var diag=(r.finalDecision&&r.finalDecision.diagnosis) || (r.differentials&&r.differentials[0]&&r.differentials[0].name) || '';
        var rem=(r.finalDecision&&r.finalDecision.remedy) || (r.topRemedies&&r.topRemedies[0]&&r.topRemedies[0].remedy) || '';
        var out=(r.outcome&&r.outcome.response? r.outcome.response+' '+(r.outcome.percent||'')+'%' : '');
        var pv=(r.patient||'')+(r.visitRef?(' / '+r.visitRef):'');
        h+='<tr style="border-bottom:1px solid #eef2f5;"><td style="padding:5px;">'+esc(String(r.savedAt||'').slice(0,10))+'</td><td style="padding:5px;">'+esc(r._source||'')+'</td><td style="padding:5px;">'+esc(pv)+'</td><td style="padding:5px;">'+esc(diag)+'</td><td style="padding:5px;">'+esc(rem)+'</td><td style="padding:5px;">'+esc(out)+'</td><td style="padding:5px;"><button class="btn btn-info btn-xs" type="button" onclick="ADX_loadRecord(\''+esc(r.id)+'\',\''+esc(r._source)+'\')">Load</button> <button class="btn btn-light btn-xs" type="button" onclick="ADX_deleteRecord(\''+esc(r.id)+'\',\''+esc(r._source)+'\')">Delete</button></td></tr>';
    });
    h+='</tbody></table></div>';
    return h;
}
function showAnalytics(){ var c=$('adxAnalyticsContent'); if(c) c.innerHTML=renderAnalyticsDashboard(); }
function injectAnalyticsPanel(){
    if($('adxAnalyticsPanel')) return;
    var host=$('adxResults') || $('diagnosisResults'); if(!host) return;
    var div=document.createElement('div'); div.id='adxAnalyticsPanel';
    div.className='card';
    div.style.cssText='margin-top:14px;border-top:4px solid #8e44ad;';
    div.innerHTML='<div class="card-title">📊 '+esc(T({ur:'ADX outcome analytics / records',en:'ADX outcome analytics / records',roman:'ADX records'}))+'</div>'+
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;"><button class="btn btn-purple btn-sm" type="button" onclick="ADX_showAnalytics()">📊 Show analytics</button><button class="btn btn-success btn-sm" type="button" onclick="ADX_syncCloud()">☁️ Sync Supabase</button><button class="btn btn-info btn-sm" type="button" onclick="ADX_pullCloud()">☁️ Pull cloud</button><button class="btn btn-info btn-sm" type="button" onclick="ADX_exportRecords()">⬇️ Export ADX records</button><button class="btn btn-success btn-sm" type="button" onclick="ADX_importRecords()">⬆️ Import ADX records</button><button class="btn btn-light btn-sm" type="button" onclick="ADX_clearRecords()">🗑️ Clear local ADX records</button></div><div id="adxCloudStatus" style="font-size:11px;margin-bottom:8px;color:#7f8c8d;">'+cloudStatusSummary()+'</div>'+
        '<div id="adxAnalyticsContent" style="font-size:12px;color:#7f8c8d;">'+esc(T({ur:'Final decisions/outcomes save کرنے کے بعد analytics یہاں دیکھیں۔ Supabase sync کے لیے SQL setup file ایک بار run کریں۔',en:'Save final decisions/outcomes, then view analytics here. Run the SQL setup file once for Supabase sync.',roman:'Records save kar ke analytics dekhein. Supabase ke liye SQL setup file run karein.'}))+'</div>';
    host.insertAdjacentElement('afterend', div);
}
function exportRecords(){
    var data={version:'v19', exportedAt:new Date().toISOString(), caseRecords:storageGet('adx_case_records'), outcomeRecords:storageGet('adx_outcome_records')};
    var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    var url=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=url; a.download='adx-records-'+new Date().toISOString().slice(0,10)+'.json'; a.click(); URL.revokeObjectURL(url);
}
function importRecords(){
    var inp=document.createElement('input'); inp.type='file'; inp.accept='.json,application/json';
    inp.onchange=function(){
        var f=inp.files&&inp.files[0]; if(!f) return;
        var reader=new FileReader();
        reader.onload=function(e){
            try{
                var data=JSON.parse(e.target.result||'{}');
                function merge(key, incoming){
                    var arr=storageGet(key), map={}; arr.forEach(function(x){map[x.id]=x;});
                    (incoming||[]).forEach(function(x){ if(x && x.id) map[x.id]=x; });
                    storageSet(key, Object.keys(map).map(function(k){return map[k];}).sort(function(a,b){return String(b.savedAt||'').localeCompare(String(a.savedAt||''));}).slice(0,500));
                }
                merge('adx_case_records', data.caseRecords || data.cases || []);
                merge('adx_outcome_records', data.outcomeRecords || data.outcomes || []);
                toast('✅ ADX records imported'); showAnalytics();
            }catch(err){ toast('❌ Invalid ADX records file','error'); }
        };
        reader.readAsText(f);
    };
    inp.click();
}
function clearRecords(){
    if(!confirm(T({ur:'کیا واقعی تمام local ADX case/outcome records delete کرنے ہیں؟',en:'Delete all local ADX case/outcome records?',roman:'ADX local records delete karne hain?'}))) return;
    localStorage.removeItem('adx_case_records'); localStorage.removeItem('adx_outcome_records'); toast('🗑️ Cleared'); showAnalytics();
}
function loadRecord(id, source){
    var arr=source==='outcome'?storageGet('adx_outcome_records'):storageGet('adx_case_records');
    var rec=arr.find(function(x){return x.id===id;}); if(!rec){ toast('Record not found','error'); return; }
    var ta=$('adxStatement'); if(ta) ta.value=rec.statement||'';
    setVal('adxFinalDiagnosis', rec.finalDecision&&rec.finalDecision.diagnosis);
    setVal('adxFinalRemedy', rec.finalDecision&&rec.finalDecision.remedy);
    setVal('adxFinalConfidence', rec.finalDecision&&rec.finalDecision.confidence);
    setVal('adxFinalNotes', rec.finalDecision&&rec.finalDecision.notes);
    setVal('adxTestsDone', rec.finalDecision&&rec.finalDecision.testsDone);
    if(rec.generals){ Object.keys(rec.generals).forEach(function(k){ var id='adx'+k.charAt(0).toUpperCase()+k.slice(1); setVal(id, rec.generals[k]); }); }
    if(rec.specialty){ setVal('adxSpecialtyNotes', rec.specialty.notes||''); var sel=$('adxSpecialtySelect'); if(sel && rec.specialty.module){ sel.value=rec.specialty.module; renderSpecialtySelected(); } }
    if(ta && ta.value) runUI();
    toast('✅ Record loaded');
}
function deleteRecord(id, source){
    var key=source==='outcome'?'adx_outcome_records':'adx_case_records';
    var arr=storageGet(key).filter(function(x){return x.id!==id;}); storageSet(key, arr); deleteAdxRecordCloud(id); showAnalytics(); toast('Deleted');
}

// ==================== ADX Phase 12: Guided Acute/Chronic side-by-side assistant ====================
var ADX_GUIDED_STATE = { mode:'acute', focus:'fever', stage:'confirm', answers:{}, lastUpdated:null };
function guidedModules(){ return { fever:{ur:'بخار',en:'Fever',roman:'Fever'}, headache:{ur:'سر درد',en:'Headache',roman:'Headache'}, cough_chest:{ur:'کھانسی/سانس',en:'Cough / Chest',roman:'Cough/Chest'}, gi:{ur:'پیٹ/GI',en:'Abdomen / GI',roman:'Pait/GI'}, urinary:{ur:'پیشاب/گردہ',en:'Urinary / Kidney',roman:'Urinary'}, female:{ur:'خواتین',en:'Female complaints',roman:'Female'}, child:{ur:'بچہ',en:'Child / Pediatric',roman:'Child'}, skin:{ur:'جلد',en:'Skin',roman:'Skin'}, cardiac_emergency:{ur:'دل/سینہ',en:'Cardiac emergency',roman:'Cardiac'}, ent_eye_dental:{ur:'ENT/آنکھ/دانت',en:'ENT / Eye / Dental',roman:'ENT/Eye/Dental'}, msk_injury:{ur:'جوڑ/چوٹ',en:'MSK / Injury',roman:'MSK/Injury'}, endocrine_metabolic:{ur:'شوگر/تھائرائڈ',en:'Endocrine / Metabolic',roman:'Endocrine'} }; }
function ans(label, fact, dx, rx, extra){ var o={label:label, fact:fact, dx:dx||{}, rx:rx||{}}; Object.keys(extra||{}).forEach(function(k){o[k]=extra[k];}); return o; }
var ADX_GUIDED_DATA = {
 fever:{ confirm:[
  {id:'fever_pattern',q:{ur:'بخار کا pattern کیا ہے؟',en:'What is the fever pattern?'},answers:[ans({ur:'مسلسل',en:'Continuous'},'Continuous fever',{viral_fever:2,typhoid:3,influenza:1}),ans({ur:'آتا جاتا',en:'Comes and goes'},'Intermittent fever',{malaria:3,viral_fever:1}),ans({ur:'ایک دن چھوڑ کر',en:'Alternate day'},'Fever on alternate days',{malaria:6}),ans({ur:'شام کو بڑھتا',en:'Evening rise'},'Fever rises in evening',{typhoid:4,tuberculosis:2}),ans({ur:'اچانک تیز',en:'Sudden high'},'Sudden high fever',{dengue_fever:3,influenza:2})]},
  {id:'chills',q:{ur:'کپکپی/سردی؟',en:'Chills / rigors?'},answers:[ans({ur:'شدید کپکپی',en:'Severe rigors'},'Severe rigors with fever',{malaria:6,sepsis:2}),ans({ur:'بخار سے پہلے',en:'Before fever'},'Chills before fever',{malaria:5}),ans({ur:'بخار کے ساتھ',en:'During fever'},'Chills during fever',{malaria:3,viral_fever:1}),ans({ur:'نہیں',en:'No chills'},'No chills',{dengue_fever:1,viral_fever:1})]},
  {id:'pains',q:{ur:'جسم/ہڈی/جوڑ درد؟',en:'Body, bone or joint pains?'},answers:[ans({ur:'ہڈی ٹوٹنے جیسا',en:'Bone-breaking'},'Bone-breaking pains',{dengue_fever:4,chikungunya:2},{'eup-per':6}),ans({ur:'جوڑ بہت درد',en:'Severe joint pain'},'Severe joint pain',{chikungunya:6,dengue_fever:2},{'rhus-t':2}),ans({ur:'عام جسم درد',en:'General body ache'},'General body ache',{viral_fever:2,dengue_fever:2,influenza:3},{gels:1,'eup-per':1}),ans({ur:'نہیں',en:'No'},'No significant body pain',{viral_fever:1})]},
  {id:'eyes_rash',q:{ur:'آنکھوں کے پیچھے درد یا rash/bleeding؟',en:'Pain behind eyes or rash/bleeding?'},answers:[ans({ur:'آنکھوں کے پیچھے درد',en:'Pain behind eyes'},'Pain behind eyes',{dengue_fever:6}),ans({ur:'Rash',en:'Rash'},'Skin rash with fever',{dengue_fever:4,chikungunya:3,measles:3}),ans({ur:'Bleeding',en:'Bleeding'},'Bleeding with fever',{severe_dengue:8,dengue_fever:4,sepsis:3},{},{red:true}),ans({ur:'کچھ نہیں',en:'None'},'No rash or bleeding',{viral_fever:1})]},
  {id:'gi_urine',q:{ur:'قے، پیٹ، دست یا پیشاب؟',en:'Vomiting, abdomen, stool or urine?'},answers:[ans({ur:'بار بار قے',en:'Persistent vomiting'},'Persistent vomiting',{severe_dengue:6,gastroenteritis:3,sepsis:2},{ars:2,verat:2},{red:true}),ans({ur:'پیٹ درد',en:'Abdominal pain'},'Abdominal pain with fever',{typhoid:3,severe_dengue:3,appendicitis:2}),ans({ur:'دست',en:'Diarrhea'},'Diarrhea with fever',{gastroenteritis:4,typhoid:2},{ars:2,verat:2}),ans({ur:'پیشاب کم',en:'Low urine'},'Low urine',{severe_dengue:6,sepsis:4,dehydration:5},{ars:1},{red:true}),ans({ur:'پیشاب میں جلن',en:'Burning urine'},'Burning urination with fever',{cystitis:5,pyelonephritis:4})]},
  {id:'resp_neuro',q:{ur:'سانس یا دماغی علامات؟',en:'Breathing or neurological signs?'},answers:[ans({ur:'سانس تنگ',en:'Breathless'},'Breathlessness with fever',{pneumonia:5,sepsis:4,covid_like_viral:3},{},{red:true}),ans({ur:'کنفیوژن/غنودگی',en:'Confusion'},'Confusion with fever',{sepsis:6,meningitis:5,severe_dengue:3},{},{red:true}),ans({ur:'گردن اکڑی',en:'Neck stiffness'},'Neck stiffness with fever',{meningitis:8},{},{red:true}),ans({ur:'دورہ',en:'Fits/seizure'},'Seizure during fever',{meningitis:6,febrile_seizure:6,sepsis:3},{},{red:true}),ans({ur:'نہیں',en:'None'},'No breathlessness or neuro red flag',{viral_fever:1})]},
  {id:'exposure',q:{ur:'Exposure / وجہ؟',en:'Exposure or likely source?'},answers:[ans({ur:'Mosquito',en:'Mosquito exposure'},'Mosquito exposure',{dengue_fever:3,malaria:3,chikungunya:3}),ans({ur:'گندا کھانا/پانی',en:'Contaminated food/water'},'Contaminated food or water',{typhoid:4,gastroenteritis:3}),ans({ur:'کھانسی/فلو رابطہ',en:'Flu contact'},'Flu/respiratory contact',{influenza:3,covid_like_viral:2}),ans({ur:'UTI history',en:'UTI history'},'Urinary infection tendency',{cystitis:3,pyelonephritis:2})]}
 ], remedy:[
  {id:'rx_bone',q:{ur:'ہڈی ٹوٹنے جیسا درد prominent؟',en:'Bone-breaking pains prominent?'},answers:[ans({ur:'ہاں شدید',en:'Yes severe'},'Severe bone-breaking pains',{}, {'eup-per':8}),ans({ur:'ہلکا',en:'Mild'},'Mild bone pains',{}, {'eup-per':3}),ans({ur:'نہیں',en:'No'},'No bone-breaking pains',{}, {})]},
  {id:'rx_gels',q:{ur:'غنودگی، پلکیں بھاری، پیاس کم؟',en:'Drowsy, heavy eyelids, thirstless?'},answers:[ans({ur:'ہاں',en:'Yes'},'Drowsy, heavy eyelids, thirstless',{}, {gels:8}),ans({ur:'صرف کمزوری',en:'Weak only'},'Great weakness without clear drowsiness',{}, {gels:3}),ans({ur:'نہیں',en:'No'},'No Gelsemium state',{}, {})]},
  {id:'rx_bry',q:{ur:'حرکت سے worse، آرام چاہتا، پیاس زیادہ؟',en:'Worse motion, wants rest, thirsty?'},answers:[ans({ur:'ہاں',en:'Yes'},'Worse from motion, wants rest, thirsty',{}, {bry:8}),ans({ur:'صرف پیاس',en:'Thirst only'},'Great thirst',{}, {bry:3,'nat-m':2}),ans({ur:'نہیں',en:'No'},'Not Bryonia motion/thirst picture',{}, {})]},
  {id:'rx_rhus',q:{ur:'آرام سے اکڑن، حرکت سے بہتر؟',en:'Restlessness/stiffness better motion?'},answers:[ans({ur:'ہاں',en:'Yes'},'Restlessness, stiffness better by motion',{}, {'rhus-t':8}),ans({ur:'بے چین مگر better motion نہیں',en:'Restless only'},'Restlessness without clear better motion',{}, {ars:3}),ans({ur:'نہیں',en:'No'},'No Rhus-tox modality',{}, {})]},
  {id:'rx_bell',q:{ur:'اچانک heat، سرخی، throbbing؟',en:'Sudden heat, redness, throbbing?'},answers:[ans({ur:'ہاں',en:'Yes'},'Sudden heat, red face, throbbing',{}, {bell:8}),ans({ur:'صرف throbbing',en:'Throbbing only'},'Throbbing pains',{}, {bell:3,glon:3}),ans({ur:'نہیں',en:'No'},'No Belladonna picture',{}, {})]},
  {id:'rx_ars',q:{ur:'بے چینی، anxiety، چھوٹے گھونٹ، بہت کمزوری؟',en:'Anxiety, restlessness, small sips, great weakness?'},answers:[ans({ur:'ہاں',en:'Yes'},'Anxious, restless, small sips, great weakness',{}, {ars:8}),ans({ur:'صرف کمزوری',en:'Weakness only'},'Marked weakness',{}, {ars:2,chin:2}),ans({ur:'نہیں',en:'No'},'No Arsenicum state',{}, {})]}
 ]},
 generic:{ confirm:[{id:'generic_main',q:{ur:'اصل فوکس کیا ہے؟',en:'What is the main focus?'},answers:[ans({ur:'درد',en:'Pain'},'Main focus is pain',{},{}),ans({ur:'انفیکشن/بخار',en:'Infection/fever'},'Infective/fever focus',{},{}),ans({ur:'فنکشن/جنرل',en:'General/function'},'General functional complaint',{},{}),ans({ur:'ریڈ فلیگ نہیں',en:'No red flags'},'No obvious red flags reported',{}, {})]}, {id:'generic_modality',q:{ur:'کس سے فرق پڑتا ہے؟',en:'Modalities?'},answers:[ans({ur:'حرکت سے خراب',en:'Worse motion'},'Worse from motion',{}, {bry:3}),ans({ur:'حرکت سے بہتر',en:'Better motion'},'Better by motion',{}, {'rhus-t':3}),ans({ur:'گرمی سے بہتر',en:'Better warmth'},'Better by warmth',{}, {ars:2,'rhus-t':2}),ans({ur:'ٹھنڈ سے بہتر',en:'Better cold'},'Better by cold applications',{}, {apis:2})]}], remedy:[{id:'generic_rx',q:{ur:'عمومی ریمیڈی فرق؟',en:'General remedy differentiators?'},answers:[ans({ur:'بے چینی/anxiety',en:'Anxiety/restlessness'},'Anxiety and restlessness',{}, {ars:3,acon:2}),ans({ur:'سستی/غنودگی',en:'Drowsy/dull'},'Drowsy dull state',{}, {gels:3}),ans({ur:'irritable/غصہ',en:'Irritable'},'Irritable angry state',{}, {'nux-v':3,cham:2}),ans({ur:'رونا/تسلی چاہے',en:'Weepy wants consolation'},'Weepy wants consolation',{}, {puls:3})]}]},
 chronic:{ confirm:[
  {id:'chr_timeline',q:{ur:'مرض کب سے ہے؟',en:'How long has this been present?'},answers:[ans({ur:'مہینوں سے',en:'Months'},'Chronic complaint for months',{},{}),ans({ur:'سالوں سے',en:'Years'},'Chronic complaint for years',{},{}),ans({ur:'بچپن سے',en:'Since childhood'},'Complaint since childhood',{}, {calc:2,sil:2}),ans({ur:'بار بار',en:'Recurrent'},'Recurrent complaint',{}, {tub:2,psor:1})]},
  {id:'chr_thermal',q:{ur:'Thermal state؟',en:'Thermal state?'},answers:[ans({ur:'Chilly',en:'Chilly'},'Chilly patient',{}, {ars:3,'nux-v':3,sil:2,calc:2},{detail:{id:'adxThermal',value:'chilly'}}),ans({ur:'Hot',en:'Hot'},'Hot patient',{}, {sulph:3,puls:2,lach:2},{detail:{id:'adxThermal',value:'hot'}}),ans({ur:'گرمی سے بہتر',en:'Better warmth'},'Better by warmth',{}, {ars:3,'rhus-t':2},{detail:{id:'adxThermal',value:'better warmth'}}),ans({ur:'کھلی ہوا بہتر',en:'Better open air'},'Better in open air',{}, {puls:3,phos:1},{detail:{id:'adxThermal',value:'better open air'}})]},
  {id:'chr_thirst',q:{ur:'پیاس؟',en:'Thirst?'},answers:[ans({ur:'پیاس کم',en:'Thirstless'},'Thirstless',{}, {puls:3,gels:3,apis:2},{detail:{id:'adxThirst',value:'thirstless'}}),ans({ur:'چھوٹے گھونٹ',en:'Small sips'},'Thirst for small sips',{}, {ars:5},{detail:{id:'adxThirst',value:'small sips'}}),ans({ur:'زیادہ پیاس',en:'Great thirst'},'Great thirst',{}, {bry:3,'nat-m':3,phos:2},{detail:{id:'adxThirst',value:'great thirst'}}),ans({ur:'ٹھنڈا پانی',en:'Cold water'},'Desire cold water',{}, {phos:3,bry:2},{detail:{id:'adxThirst',value:'cold water'}})]},
  {id:'chr_food',q:{ur:'Cravings / aversions؟',en:'Cravings / aversions?'},answers:[ans({ur:'میٹھا',en:'Sweets'},'Desires sweets',{}, {calc:3,'arg-n':2,lyc:2},{detail:{id:'adxCravings',value:'sweets'}}),ans({ur:'نمک',en:'Salt'},'Desires salt',{}, {'nat-m':5},{detail:{id:'adxCravings',value:'salt'}}),ans({ur:'چکنائی سے نفرت',en:'Aversion fats'},'Aversion to fatty/oily food',{}, {puls:3},{detail:{id:'adxAversions',value:'fats/oily'}}),ans({ur:'مصالحہ/stimulants',en:'Spicy/stimulants'},'Desires spicy/stimulants',{}, {'nux-v':3},{detail:{id:'adxCravings',value:'spicy/stimulants'}})]},
  {id:'chr_mind',q:{ur:'Mind/emotions؟',en:'Mind / emotions?'},answers:[ans({ur:'Anxiety/fear',en:'Anxiety/fear'},'Anxiety and fear',{}, {ars:4,acon:2,phos:1},{detail:{id:'adxMind',value:'anxiety fear'}}),ans({ur:'غصہ/irritable',en:'Anger/irritable'},'Irritable angry',{}, {'nux-v':4,cham:2},{detail:{id:'adxMind',value:'irritable anger'}}),ans({ur:'غم/grief',en:'Grief'},'Ailments from grief',{}, {ign:4,'nat-m':4},{detail:{id:'adxMind',value:'grief'}}),ans({ur:'رونا/تسلی',en:'Weepy/needs consolation'},'Weepy wants consolation',{}, {puls:4},{detail:{id:'adxMind',value:'weeping wants consolation'}})]},
  {id:'chr_miasm',q:{ur:'Miasmatic tendency؟',en:'Miasmatic tendency?'},answers:[ans({ur:'Psoric',en:'Psoric'},'Psoric tendency',{}, {sulph:3,psor:3},{detail:{id:'adxMiasm',value:'psoric'}}),ans({ur:'Sycotic',en:'Sycotic'},'Sycotic tendency',{}, {thuja:4,med:3},{detail:{id:'adxMiasm',value:'sycotic'}}),ans({ur:'Tubercular',en:'Tubercular'},'Tubercular tendency',{}, {tub:5,phos:3},{detail:{id:'adxMiasm',value:'tubercular'}}),ans({ur:'Cancerinic',en:'Cancerinic'},'Cancerinic tendency',{}, {carc:5},{detail:{id:'adxMiasm',value:'cancerinic'}})]}
 ], remedy:[]}
};
// ==================== ADX Phase 13: Fever Guided Module v2 (Kent-style, toggle/multi-select) ====================
function expandGuidedFeverKentV2(){
    if(!ADX_GUIDED_DATA.fever) return;
    function exists(stage,id){ return (ADX_GUIDED_DATA.fever[stage]||[]).some(function(q){return q.id===id;}); }
    function add(stage,q){ if(!exists(stage,q.id)) ADX_GUIDED_DATA.fever[stage].push(q); }
    (ADX_GUIDED_DATA.fever.confirm||[]).forEach(function(q){ q.type='multi'; });
    (ADX_GUIDED_DATA.fever.remedy||[]).forEach(function(q){ q.type='multi'; });
    add('confirm',{id:'kent_duration_onset',type:'multi',cat:'Kent case-taking',q:{ur:'مدت، آغاز اور cause؟',en:'Duration, onset and cause?'},answers:[
        ans({ur:'24 گھنٹے سے کم',en:'Less than 24h'},'Fever began within last 24 hours',{viral_fever:1},{acon:2}),
        ans({ur:'1-3 دن',en:'1-3 days'},'Fever duration 1 to 3 days',{viral_fever:2,dengue_fever:1,influenza:2}),
        ans({ur:'3-5 دن',en:'3-5 days'},'Fever duration 3 to 5 days',{dengue_fever:2,malaria:2,typhoid:1}),
        ans({ur:'5 دن سے زیادہ',en:'More than 5 days'},'Fever lasting more than 5 days',{typhoid:4,malaria:2,tuberculosis:1}),
        ans({ur:'Cold exposure',en:'After cold exposure'},'Fever after cold exposure',{viral_fever:1},{acon:5,hep:2}),
        ans({ur:'Heat/sun exposure',en:'After heat/sun'},'Fever after heat or sun exposure',{heat_exhaustion:3,heat_stroke:2},{glon:3,bell:2}),
        ans({ur:'Mosquito exposure',en:'Mosquito exposure'},'Mosquito exposure before fever',{dengue_fever:3,malaria:3,chikungunya:2}),
        ans({ur:'Contaminated food/water',en:'Contaminated food/water'},'Contaminated food or water before fever',{typhoid:4,gastroenteritis:3})
    ]});
    add('confirm',{id:'kent_time_stage',type:'multi',cat:'Kent: time and stages',q:{ur:'وقت، stages اور periodicity؟',en:'Time, stages and periodicity?'},answers:[
        ans({ur:'شام کو بڑھتا',en:'Evening rise'},'Fever rises in evening',{typhoid:4,tuberculosis:2}),
        ans({ur:'رات کو worse',en:'Worse at night'},'Fever worse at night',{tuberculosis:2},{ars:2}),
        ans({ur:'خاص گھنٹہ',en:'Fixed hour'},'Fever comes at a fixed hour',{malaria:4},{cedr:4,'nat-m':2}),
        ans({ur:'Chill → heat → sweat',en:'Distinct stages'},'Distinct chill, heat and sweat stages',{malaria:5},{chin:2,cedr:2}),
        ans({ur:'Sweat سے آرام',en:'Sweat relieves'},'Sweat relieves the fever',{malaria:3},{chin:3}),
        ans({ur:'Attacks کے درمیان ٹھیک',en:'Well between attacks'},'Feels well between fever paroxysms',{malaria:5},{chin:3,cedr:3}),
        ans({ur:'Heat/chill alternate',en:'Heat/chill alternate'},'Heat and chill alternate or are mingled',{malaria:2,sepsis:1},{ars:2,'nux-v':1})
    ]});
    add('confirm',{id:'kent_chill_course',type:'multi',cat:'Kent: chill course/modalities',q:{ur:'Chill کہاں سے شروع، warm/cold سے فرق؟',en:'Chill begins where; warm/cold modalities?'},answers:[
        ans({ur:'پیٹھ/کمر سے',en:'Begins in back'},'Chill begins in the back',{malaria:2},{'nux-v':2,sep:1}),
        ans({ur:'ہاتھ پاؤں سے',en:'Begins in hands/feet'},'Chill begins in hands or feet',{malaria:2},{sil:1,ars:1}),
        ans({ur:'Internal coldness',en:'Internal coldness'},'Internal coldness apart from chill',{}, {ars:2}),
        ans({ur:'ایک حصہ گرم ایک ٹھنڈا',en:'One part hot/cold'},'One part hot while another part cold',{}, {puls:2}),
        ans({ur:'Gooseflesh',en:'Gooseflesh'},'Gooseflesh with chill',{malaria:1},{'nux-v':1}),
        ans({ur:'گرمی/کمبل چاہے',en:'Desires warmth'},'Desires warmth, stove, sun or wraps',{}, {ars:3,'nux-v':2,hep:1}),
        ans({ur:'گرمی سے بہتر',en:'Better warmth'},'Fever state better from warmth',{}, {ars:3,'rhus-t':2}),
        ans({ur:'ٹھنڈ سے بہتر',en:'Better cold'},'Fever state better from cold or uncovering',{}, {puls:2,apis:2})
    ]});
    add('confirm',{id:'kent_thirst_sweat_skin',type:'multi',cat:'Kent: thirst, skin, sweat, pulse',q:{ur:'پیاس، skin، sweat، pulse؟',en:'Thirst, skin, sweat and pulse?'},answers:[
        ans({ur:'Chill میں پیاس',en:'Thirst in chill'},'Thirst during chill',{malaria:1},{ars:2,'nux-v':2}),
        ans({ur:'Heat میں پیاس',en:'Thirst in heat'},'Thirst during fever heat',{}, {bry:3,'nat-m':2}),
        ans({ur:'پیاس نہیں',en:'Thirstless'},'Thirstless during fever',{dengue_fever:1,viral_fever:1},{gels:4,puls:3,apis:2}),
        ans({ur:'چھوٹے گھونٹ',en:'Small sips'},'Thirst for small frequent sips',{}, {ars:5}),
        ans({ur:'Hot dry skin',en:'Hot dry skin'},'Skin hot and dry during fever',{}, {acon:3,bell:3}),
        ans({ur:'Red face',en:'Red face'},'Red face with fever',{}, {bell:4}),
        ans({ur:'Purple/dusky',en:'Purple/dusky'},'Skin purple or dusky in fever',{sepsis:4,severe_dengue:3},{lach:3,'crot-h':3}),
        ans({ur:'Cold sweat',en:'Cold sweat'},'Cold sweat with fever or collapse',{sepsis:3,dehydration:2},{verat:5,ars:2}),
        ans({ur:'Sweat weakens',en:'Sweat weakens'},'Sweat leaves patient weak',{}, {chin:5}),
        ans({ur:'Weak pulse',en:'Weak pulse'},'Pulse weak or imperceptible',{sepsis:3,dehydration:2},{verat:3,ars:2})
    ]});
    add('confirm',{id:'clinical_concomitants',type:'multi',cat:'Clinical differential + concomitants',q:{ur:'ساتھ کون کون سی علامات ہیں؟',en:'Which concomitant symptoms are present?'},answers:[
        ans({ur:'آنکھوں کے پیچھے درد',en:'Pain behind eyes'},'Pain behind eyes with fever',{dengue_fever:6}),
        ans({ur:'Bone-breaking pain',en:'Bone-breaking pain'},'Bone-breaking pains with fever',{dengue_fever:4,chikungunya:2},{'eup-per':7}),
        ans({ur:'Joint pain',en:'Joint pain'},'Joint pains with fever',{chikungunya:6,dengue_fever:2},{'rhus-t':2}),
        ans({ur:'Cough',en:'Cough'},'Cough with fever',{influenza:2,pneumonia:3,covid_like_viral:2},{bry:1,phos:1}),
        ans({ur:'Vomiting',en:'Vomiting'},'Vomiting with fever',{gastroenteritis:3,typhoid:1,severe_dengue:2},{ars:2,verat:2,ip:2}),
        ans({ur:'Abdominal pain',en:'Abdominal pain'},'Abdominal pain with fever',{typhoid:3,severe_dengue:3,appendicitis:2}),
        ans({ur:'Diarrhea',en:'Diarrhea'},'Diarrhea with fever',{gastroenteritis:4,typhoid:2},{ars:2,verat:2,podo:2}),
        ans({ur:'Burning urine',en:'Burning urine'},'Burning urination with fever',{cystitis:5,pyelonephritis:4},{canth:5,apis:2}),
        ans({ur:'Low urine',en:'Low urine'},'Low urine with fever',{severe_dengue:6,sepsis:4,dehydration:5},{ars:1},{red:true}),
        ans({ur:'Rash',en:'Rash'},'Rash with fever',{dengue_fever:4,chikungunya:3,measles:3}),
        ans({ur:'Bleeding',en:'Bleeding'},'Bleeding with fever',{severe_dengue:8,dengue_fever:4,sepsis:3},{'crot-h':4,lach:2,phos:2},{red:true})
    ]});
    add('confirm',{id:'red_flags_fever',type:'multi',cat:'Red flag gate',q:{ur:'خطرے کی علامات؟',en:'Red flags?'},answers:[
        ans({ur:'Confusion',en:'Confusion'},'Confusion or altered sensorium with fever',{sepsis:6,meningitis:5,severe_dengue:3},{},{red:true}),
        ans({ur:'Neck stiffness',en:'Neck stiffness'},'Neck stiffness with fever',{meningitis:8},{},{red:true}),
        ans({ur:'Fits',en:'Seizure/fits'},'Seizure during fever',{meningitis:6,febrile_seizure:6,sepsis:3},{},{red:true}),
        ans({ur:'Breathless',en:'Breathless'},'Breathlessness with fever',{pneumonia:5,sepsis:4,covid_like_viral:3},{},{red:true}),
        ans({ur:'Persistent vomiting',en:'Persistent vomiting'},'Persistent vomiting with fever',{severe_dengue:6,gastroenteritis:3,sepsis:2},{},{red:true}),
        ans({ur:'Severe abdominal pain',en:'Severe abdominal pain'},'Severe abdominal pain with fever',{severe_dengue:6,appendicitis:4,pancreatitis:3},{},{red:true}),
        ans({ur:'Cold extremities/collapse',en:'Cold extremities/collapse'},'Cold extremities or collapse with fever',{sepsis:6,dehydration:4,severe_dengue:4},{verat:3,ars:2},{red:true}),
        ans({ur:'Child poor feeding',en:'Child poor feeding'},'Child not feeding with fever',{child_dehydration:5,sepsis:4},{},{red:true})
    ]});
    add('remedy',{id:'rx_periodic',type:'multi',cat:'Periodic/chill fever remedies',q:{ur:'Periodic/chill fever remedy clues؟',en:'Periodic/chill fever remedy clues?'},answers:[
        ans({ur:'Same hour periodic',en:'Same hour periodic'},'Periodic fever at same hour',{}, {cedr:7,'nat-m':3}),
        ans({ur:'Weak after sweat/fluid loss',en:'Weak after sweat/fluid loss'},'Weakness after sweat, diarrhea, bleeding or fluid loss',{}, {chin:8}),
        ans({ur:'Chilly irritable gastric',en:'Chilly irritable gastric'},'Chilly irritable fever with gastric/stimulant history',{}, {'nux-v':7}),
        ans({ur:'Thirst in heat',en:'Thirst in heat'},'Great thirst during fever heat',{}, {bry:3,'nat-m':4})
    ]});
    add('remedy',{id:'rx_typhoid_low',type:'multi',cat:'Typhoid/low fever states',q:{ur:'Typhoid یا low fever state؟',en:'Typhoid or low fever state?'},answers:[
        ans({ur:'Toxic/stupor',en:'Toxic stupor'},'Toxic typhoid state with stupor',{}, {bapt:8}),
        ans({ur:'Body scattered',en:'Body scattered'},'Feels as if body is scattered in bed',{}, {bapt:8}),
        ans({ur:'Muttering delirium',en:'Muttering delirium'},'Muttering delirium or jerking',{}, {hyos:6}),
        ans({ur:'Slides down bed',en:'Slides down bed'},'Great prostration, slides down in bed',{}, {'mur-ac':7}),
        ans({ur:'Apathy/debility',en:'Apathy/debility'},'Apathy and debility after fever',{}, {'ph-ac':7})
    ]});
    add('remedy',{id:'rx_gi_resp_urine',type:'multi',cat:'GI/Resp/Urine fever remedies',q:{ur:'GI/Resp/Urine fever remedy clues؟',en:'GI/Resp/Urine fever remedy clues?'},answers:[
        ans({ur:'Vomiting diarrhea collapse',en:'Vomiting diarrhea collapse'},'Vomiting and diarrhea with cold sweat/collapse',{}, {verat:8,ars:3}),
        ans({ur:'Persistent nausea',en:'Persistent nausea'},'Persistent nausea with fever',{}, {ip:6}),
        ans({ur:'Profuse diarrhea',en:'Profuse diarrhea'},'Profuse diarrhea with fever',{}, {podo:5,ars:3,verat:3}),
        ans({ur:'Respiratory weakness',en:'Respiratory weakness'},'Respiratory fever with weakness/chest involvement',{}, {phos:5,'ant-t':4,bry:3}),
        ans({ur:'Rattling chest',en:'Rattling chest'},'Rattling chest with difficult expectoration',{}, {'ant-t':7}),
        ans({ur:'Urinary burning',en:'Urinary burning'},'Fever with cutting burning urination',{}, {canth:8,apis:3,sars:2}),
        ans({ur:'Flank/kidney radiation',en:'Flank/kidney radiation'},'Fever with flank pain radiating to bladder/groin',{}, {berb:6,sars:3})
    ]});
}
expandGuidedFeverKentV2();

function expandGuidedFeverV3(){
    if(!ADX_GUIDED_DATA.fever) return;
    function exists(stage,id){ return (ADX_GUIDED_DATA.fever[stage]||[]).some(function(q){return q.id===id;}); }
    function add(stage,q){ if(!exists(stage,q.id)) ADX_GUIDED_DATA.fever[stage].push(q); }
    (ADX_GUIDED_DATA.fever.confirm||[]).forEach(function(q){ q.type='multi'; });
    (ADX_GUIDED_DATA.fever.remedy||[]).forEach(function(q){ q.type='multi'; });
    add('confirm',{id:'fever_simple_seasonal',type:'multi',cat:'Common / simple / seasonal fever',q:{ur:'سادہ، موسمی یا وائرل بخار کی نشانیاں؟',en:'Simple, seasonal or viral fever signs?'},answers:[ans({ur:'موسم بدلنے سے',en:'After weather change'},'Fever after change of weather',{viral_fever:3,common_cold:2},{acon:2,'ferr-p':2}),ans({ur:'ٹھنڈی ہوا/بارش کے بعد',en:'After cold wind/rain'},'Fever after cold wind or getting wet',{viral_fever:2,common_cold:2},{acon:4,'rhus-t':2,dulc:2}),ans({ur:'گھر میں viral چل رہا',en:'Viral exposure at home'},'Viral fever exposure in family or locality',{viral_fever:4,influenza:2}),ans({ur:'صرف بخار + کمزوری',en:'Fever with weakness only'},'Fever with weakness but no localizing symptoms',{viral_fever:3},{gels:3,'ferr-p':2}),ans({ur:'Body ache + flu feeling',en:'Body ache flu-like'},'Flu-like fever with body aches',{influenza:5,viral_fever:2},{gels:3,'eup-per':2}),ans({ur:'Paracetamol سے وقتی آرام',en:'Temporary relief from antipyretic'},'Fever temporarily relieved by antipyretic',{viral_fever:1})]});
    add('confirm',{id:'fever_ent_throat',type:'multi',cat:'ENT / throat / tonsils with fever',q:{ur:'نزلہ، گلا، ٹانسلز یا ناک کی علامات؟',en:'Cold, throat, tonsils or nasal symptoms?'},answers:[ans({ur:'ناک بہنا',en:'Runny nose'},'Runny nose with fever',{common_cold:5,allergic_rhinitis:2,influenza:1},{puls:1}),ans({ur:'ناک بند',en:'Nasal blockage'},'Blocked nose with fever',{common_cold:3,sinusitis:3}),ans({ur:'چھینکیں',en:'Sneezing'},'Sneezing with fever/cold',{common_cold:3,allergic_rhinitis:3}),ans({ur:'گلا درد',en:'Sore throat'},'Sore throat with fever',{tonsillitis_pharyngitis:6,influenza:2},{bell:2,merc:2,hep:1}),ans({ur:'نگلنے میں درد',en:'Pain on swallowing'},'Pain on swallowing with fever',{tonsillitis_pharyngitis:5},{bell:2,phyt:2,merc:1}),ans({ur:'ٹانسلز سوجے',en:'Swollen tonsils'},'Swollen tonsils with fever',{tonsillitis_pharyngitis:6},{bell:2,merc:2,'bar-c':1}),ans({ur:'سفید spots/pus',en:'White spots/pus'},'White spots or pus on tonsils',{tonsillitis_pharyngitis:7},{hep:3,merc:3,phyt:2}),ans({ur:'گردن glands',en:'Neck glands swollen'},'Neck glands swollen with throat fever',{tonsillitis_pharyngitis:3,mumps:1},{merc:2,phyt:1,'bar-c':1}),ans({ur:'کھانسی نہیں',en:'No cough'},'Sore throat fever without cough',{tonsillitis_pharyngitis:2})]});
    add('confirm',{id:'fever_resp_detail',type:'multi',cat:'Respiratory fever details',q:{ur:'کھانسی، بلغم، سانس یا سینہ؟',en:'Cough, sputum, breathing or chest?'},answers:[ans({ur:'خشک کھانسی',en:'Dry cough'},'Dry cough with fever',{bronchitis:2,influenza:2,covid_like_viral:2},{acon:2,bry:2,spong:2}),ans({ur:'بلغم والی کھانسی',en:'Productive cough'},'Productive cough with fever',{bronchitis:4,pneumonia:3},{phos:2,'ant-t':2}),ans({ur:'پیلا/سبز بلغم',en:'Yellow/green sputum'},'Yellow or green sputum with fever',{pneumonia:5,bronchitis:3},{hep:2,puls:2,phos:1}),ans({ur:'بلغم میں خون',en:'Blood in sputum'},'Blood in sputum with fever',{tuberculosis:6,pneumonia:2,pulmonary_embolism:2},{phos:3,'crot-h':2},{red:true}),ans({ur:'سانس پھولنا',en:'Breathlessness'},'Breathlessness with fever',{pneumonia:5,asthma_attack:4,sepsis:3,covid_like_viral:3},{ars:2,phos:2},{red:true}),ans({ur:'Wheezing',en:'Wheezing'},'Wheezing with fever/cough',{asthma_attack:7,bronchitis:2},{ars:2,ip:2}),ans({ur:'سانس سے سینہ درد',en:'Chest pain breathing'},'Chest pain worse breathing with fever',{pneumonia:4,pleurisy:4},{bry:4,phos:2}),ans({ur:'SpO2 کم',en:'Low SpO2'},'Low oxygen saturation with fever',{pneumonia:6,covid_like_viral:5,sepsis:4},{},{red:true})]});
    add('confirm',{id:'fever_headache_detail',type:'multi',cat:'Headache with fever — location/sensation/modality',q:{ur:'بخار کے ساتھ سر درد کی تفصیل؟',en:'Headache with fever details?'},answers:[ans({ur:'پیشانی',en:'Forehead'},'Forehead headache with fever',{sinusitis:2,viral_fever:1},{bell:1,gels:1}),ans({ur:'ایک طرف',en:'One-sided'},'One-sided headache with fever',{migraine:3},{sang:2}),ans({ur:'آنکھوں کے پیچھے',en:'Behind eyes'},'Pain behind eyes with fever',{dengue_fever:6,sinusitis:1}),ans({ur:'دھڑکن',en:'Throbbing'},'Throbbing headache with fever',{migraine:2},{bell:4,glon:3}),ans({ur:'دباؤ/بھاری',en:'Pressing/heavy'},'Pressing or heavy headache with fever',{viral_fever:1},{gels:2}),ans({ur:'روشنی سے worse',en:'Worse light'},'Headache worse from light',{migraine:3,meningitis:1},{bell:2}),ans({ur:'حرکت سے worse',en:'Worse motion'},'Headache worse from motion',{migraine:1},{bry:4}),ans({ur:'نیند سے بہتر',en:'Better sleep'},'Headache better by sleep',{migraine:2},{sang:2,'nux-v':1}),ans({ur:'جھکنے سے worse',en:'Worse bending'},'Headache worse bending forward',{sinusitis:4})]});
    add('confirm',{id:'fever_abdomen_detail',type:'multi',cat:'Abdominal pain with fever — location/sensation/modality',q:{ur:'پیٹ درد کی لوکیشن، سینسیشن، موڈیلٹی؟',en:'Abdominal pain location, sensation and modality?'},answers:[ans({ur:'معدہ/اوپر',en:'Epigastric'},'Epigastric pain with fever',{gastritis:2,pancreatitis:3,typhoid:1},{'nux-v':2,ars:1}),ans({ur:'ناف کے گرد',en:'Around umbilicus'},'Umbilical abdominal pain with fever',{gastroenteritis:2,typhoid:2}),ans({ur:'دائیں نچلا',en:'Right lower'},'Right lower abdominal pain with fever',{appendicitis:7},{},{red:true}),ans({ur:'دائیں اوپر',en:'Right upper'},'Right upper abdominal pain with fever',{cholecystitis_gallstones:5,viral_hepatitis:3}),ans({ur:'مروڑ/cramps',en:'Cramping'},'Cramping abdominal pain with fever',{gastroenteritis:3},{coloc:2,'nux-v':1}),ans({ur:'جلن/burning',en:'Burning'},'Burning abdominal pain with fever',{gastritis:2},{ars:2,'nux-v':1}),ans({ur:'دباؤ سے بہتر',en:'Better pressure'},'Abdominal pain better by pressure',{}, {coloc:3,'mag-p':2}),ans({ur:'دوہرا ہونے سے بہتر',en:'Better bending double'},'Abdominal pain better bending double',{}, {coloc:4}),ans({ur:'حرکت سے worse',en:'Worse motion'},'Abdominal pain worse from motion',{appendicitis:1},{bry:2})]});
    add('confirm',{id:'fever_diarrhea_detail',type:'multi',cat:'Diarrhea with fever — details',q:{ur:'اسہال کی تفصیل؟',en:'Diarrhea with fever details?'},answers:[ans({ur:'پانی جیسے',en:'Watery'},'Watery diarrhea with fever',{gastroenteritis:4,cholera_like_dehydrating_diarrhea:4},{ars:2,verat:3,podo:2}),ans({ur:'بار بار',en:'Frequent'},'Frequent stools with fever',{gastroenteritis:3},{ars:1,verat:2}),ans({ur:'خون',en:'Blood'},'Bloody diarrhea with fever',{dysentery:7},{merc:2,'nit-ac':1},{red:true}),ans({ur:'Mucus',en:'Mucus'},'Mucus in stool with fever',{dysentery:4},{merc:2}),ans({ur:'Tenesmus',en:'Tenesmus'},'Tenesmus with fever and stool',{dysentery:4},{merc:2,'nux-v':2}),ans({ur:'بدبودار',en:'Offensive'},'Offensive stool with fever',{gastroenteritis:2},{ars:1,podo:1}),ans({ur:'Dehydration',en:'Dehydration'},'Dehydration with diarrhea and fever',{dehydration:6,cholera_like_dehydrating_diarrhea:5},{verat:4,ars:2},{red:true})]});
    add('confirm',{id:'fever_mouth_appetite_generals',type:'multi',cat:'Fever generals — mouth, appetite, thirst, mind',q:{ur:'منہ کا ذائقہ، بھوک، پیاس، ذہنی حالت؟',en:'Mouth taste, appetite, thirst and mental state?'},answers:[ans({ur:'کڑوا ذائقہ',en:'Bitter taste'},'Bitter taste in mouth with fever',{}, {'nux-v':2,bry:1}),ans({ur:'بد ذائقہ',en:'Bad taste'},'Bad taste in mouth with fever',{}, {merc:1,'nux-v':1}),ans({ur:'ذائقہ ختم',en:'Loss of taste'},'Loss of taste with fever',{viral_fever:1,covid_like_viral:2}),ans({ur:'بھوک کم',en:'Loss appetite'},'Loss of appetite with fever',{typhoid:2,viral_fever:1},{gels:1}),ans({ur:'غنودگی',en:'Drowsy'},'Drowsy dull state with fever',{viral_fever:1},{gels:5,bapt:2}),ans({ur:'بے چینی',en:'Restless'},'Restless during fever',{sepsis:1},{ars:4,'rhus-t':2}),ans({ur:'Irritable',en:'Irritable'},'Irritable during fever',{}, {'nux-v':3,cham:2}),ans({ur:'Delirium',en:'Delirium'},'Delirium during fever',{meningitis:3,sepsis:3,typhoid:2},{bell:3,hyos:3},{red:true})]});
    add('confirm',{id:'fever_age_specific',type:'multi',cat:'Age-specific fever',q:{ur:'عمر کے حساب سے خاص علامات؟',en:'Age-specific fever signs?'},answers:[ans({ur:'3 ماہ سے کم بچہ',en:'Infant <3 months'},'Fever in infant under 3 months',{sepsis:4,child_dehydration:3},{},{red:true}),ans({ur:'بچہ دودھ نہیں پی رہا',en:'Child not feeding'},'Child not feeding with fever',{child_dehydration:5,sepsis:4},{},{red:true}),ans({ur:'بچہ نہیں کھیل رہا',en:'Child not playful'},'Child not playful or unusually dull with fever',{sepsis:4,child_dehydration:3},{},{red:true}),ans({ur:'بچے کو fast breathing',en:'Child fast breathing'},'Fast breathing in child with fever',{pneumonia:5,bronchiolitis:3},{},{red:true}),ans({ur:'بچے کو fits',en:'Child fits'},'Fits in child with fever',{febrile_seizure:6,meningitis:4},{},{red:true}),ans({ur:'بوڑھے میں confusion',en:'Elderly confusion'},'Confusion in elderly with fever',{sepsis:5,pneumonia:3,pyelonephritis:2},{},{red:true}),ans({ur:'حاملہ',en:'Pregnancy'},'Pregnancy with fever',{pyelonephritis:2,pregnancy_warning:2},{},{red:true}),ans({ur:'Diabetes',en:'Diabetes'},'Diabetes with fever',{sepsis:2,pyelonephritis:2,cellulitis:2})]});
    add('remedy',{id:'rx_throat_resp',type:'multi',cat:'Therapeutic: throat/respiratory fever',q:{ur:'گلا/کھانسی والے بخار کی ریمیڈی علامات؟',en:'Throat/respiratory fever remedy clues?'},answers:[ans({ur:'Red hot throat/tonsils',en:'Red hot throat'},'Red hot throat with fever',{}, {bell:5}),ans({ur:'Pus/white spots tonsils',en:'Pus on tonsils'},'Tonsillar pus or white spots',{}, {hep:4,merc:4,phyt:3}),ans({ur:'Throat pain to ear',en:'Throat pain to ear'},'Throat pain extends to ear',{}, {phyt:4,hep:2}),ans({ur:'Dry cough worse motion',en:'Dry cough worse motion'},'Dry cough with chest pain worse motion',{}, {bry:5}),ans({ur:'Rattling chest',en:'Rattling chest'},'Rattling chest with difficult expectoration',{}, {'ant-t':6}),ans({ur:'Thirst cold water respiratory',en:'Thirst cold water'},'Respiratory fever with thirst for cold water',{}, {phos:5}),ans({ur:'Dry barking cough',en:'Dry barking cough'},'Dry barking/croupy cough with fever',{}, {spong:4,hep:3,acon:2}),ans({ur:'Nausea with cough',en:'Nausea with cough'},'Nausea with cough and fever',{}, {ip:4})]});
}
expandGuidedFeverV3();

function guidedQuestions(){
    if(ADX_GUIDED_STATE.mode==='chronic') return ADX_GUIDED_DATA.chronic.confirm;
    var mod=ADX_GUIDED_DATA[ADX_GUIDED_STATE.focus] || ADX_GUIDED_DATA.generic;
    return mod[ADX_GUIDED_STATE.stage] || mod.confirm || [];
}
function guidedQuestionMap(){
    var map={};
    Object.keys(ADX_GUIDED_DATA).forEach(function(m){
        ['confirm','remedy'].forEach(function(st){ (ADX_GUIDED_DATA[m][st]||[]).forEach(function(q){ map[q.id]=q; }); });
    });
    return map;
}
function guidedSelectedList(qid){
    var x=ADX_GUIDED_STATE.answers[qid];
    if(!x) return [];
    return Array.isArray(x) ? x : [x];
}
function guidedIsSelected(qid, answer){
    return guidedSelectedList(qid).some(function(a){ return a && a.fact===answer.fact; });
}
function guidedAllAnswers(){
    var arr=[];
    var data=ADX_GUIDED_STATE.mode==='chronic'?ADX_GUIDED_DATA.chronic:(ADX_GUIDED_DATA[ADX_GUIDED_STATE.focus]||ADX_GUIDED_DATA.generic);
    ['confirm','remedy'].forEach(function(stage){
        (data[stage]||[]).forEach(function(q){ guidedSelectedList(q.id).forEach(function(a){ if(a) arr.push({q:q,a:a}); }); });
    });
    return arr;
}
function guidedFacts(){ return guidedAllAnswers().map(function(x){return x.a.fact;}); }
function guidedScores(kind){
    var scores={};
    guidedAllAnswers().forEach(function(x){
        var obj=kind==='rx'?x.a.rx:x.a.dx;
        Object.keys(obj||{}).forEach(function(k){ scores[k]=(scores[k]||0)+(parseFloat(obj[k])||0); });
    });
    return Object.keys(scores).map(function(k){return {key:k,score:scores[k]};}).sort(function(a,b){return b.score-a.score;});
}
function guidedApplyDetails(){
    guidedAllAnswers().forEach(function(x){
        if(x.a.detail && x.a.detail.id){
            var old=val(x.a.detail.id);
            if(old.indexOf(x.a.detail.value)===-1) setVal(x.a.detail.id,(old?old+'; ':'')+x.a.detail.value);
        }
    });
}
function guidedCaseText(){
    var base=val('adxGuidedBaseText');
    var facts=guidedFacts();
    var lines=[];
    if(base) lines.push(base);
    if(ADX_GUIDED_STATE.mode==='acute') lines.push('Focus complaint: '+(guidedModules()[ADX_GUIDED_STATE.focus]?T(guidedModules()[ADX_GUIDED_STATE.focus]):ADX_GUIDED_STATE.focus));
    else lines.push('Mode: Chronic / Constitutional');
    if(facts.length) lines.push('Guided findings:\n- '+facts.join('\n- '));
    return lines.join('\n');
}
function guidedRemoveAnswer(qid, fact){
    var list=guidedSelectedList(qid).filter(function(a){return a.fact!==fact;});
    if(list.length) ADX_GUIDED_STATE.answers[qid]=list;
    else delete ADX_GUIDED_STATE.answers[qid];
    guidedRender();
}

function guidedBars(rows, color){ if(!rows.length) return '<div style="color:#95a5a6;font-size:12px;">No score yet</div>'; var max=Math.max.apply(null, rows.map(function(r){return r.score;})); var h=''; rows.slice(0,8).forEach(function(r){ var w=max?Math.round(r.score/max*100):0; h+='<div style="margin:4px 0;font-size:12px;"><div style="display:flex;justify-content:space-between;"><span>'+esc(r.key)+'</span><b>'+r.score+'</b></div><div style="height:7px;background:#ecf0f1;border-radius:7px;overflow:hidden;"><div style="width:'+w+'%;height:7px;background:'+color+';"></div></div></div>'; }); return h; }
function renderGuidedAssistant(){
    var questions=guidedQuestions(), mods=guidedModules();
    var h='<div style="border:1px solid #b7d7f0;background:#f8fbff;border-radius:10px;padding:12px;margin:12px 0;box-shadow:0 2px 8px rgba(0,0,0,.06);">';
    h+='<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;"><div style="font-weight:bold;color:#1a5276;font-size:15px;">🧭 '+esc(T({ur:'Guided Assistant — Acute / Chronic',en:'Guided Assistant — Acute / Chronic',roman:'Guided Assistant'}))+'</div><div style="display:flex;gap:5px;flex-wrap:wrap;">';
    function modeBtn(m,label){ var active=ADX_GUIDED_STATE.mode===m; return '<button type="button" onclick="ADX_guidedSetMode(\''+m+'\')" style="padding:5px 12px;border:none;border-radius:15px;background:'+(active?'#8e44ad':'#ecf0f1')+';color:'+(active?'white':'#2c3e50')+';cursor:pointer;font-family:inherit;font-size:12px;">'+label+'</button>'; }
    h+=modeBtn('acute','Acute')+modeBtn('chronic','Chronic')+'</div></div>';
    h+='<div style="display:grid;grid-template-columns:minmax(280px,1fr) minmax(300px,1fr);gap:12px;align-items:start;">';
    h+='<div style="background:white;border:1px solid #d6eaf8;border-radius:8px;padding:10px;"><div style="font-weight:bold;color:#145a32;margin-bottom:6px;">📝 '+esc(T({ur:'Case Builder / علامات',en:'Case Builder / Symptoms',roman:'Case Builder'}))+'</div>';
    h+='<textarea id="adxGuidedBaseText" placeholder="Main complaint / patient words..." style="width:100%;min-height:85px;border:1px solid #d6eaf8;border-radius:6px;padding:8px;font-family:inherit;font-size:12px;box-sizing:border-box;">'+esc(val('adxGuidedBaseText'))+'</textarea>';
    var selectedPairs=guidedAllAnswers(); h+='<div style="margin-top:8px;font-weight:bold;color:#566573;">Added findings</div><div style="min-height:45px;background:#f8f9fa;border-radius:6px;padding:6px;">'+(selectedPairs.length?selectedPairs.map(function(x){return '<span style="display:inline-block;margin:2px;padding:3px 8px;background:#eafaf1;color:#145a32;border-radius:12px;font-size:11px;">'+esc(x.a.fact)+' <button type="button" onclick="ADX_guidedRemoveAnswer(\''+x.q.id+'\',\''+String(x.a.fact).replace(/'/g,"\\'")+'\')" style="border:none;background:transparent;color:#c0392b;cursor:pointer;font-weight:bold;">×</button></span>';}).join(''):'<span style="color:#95a5a6;font-size:12px;">Click answers on the right.</span>')+'</div>';
    h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;"><div><b style="font-size:12px;color:#1a5276;">Diagnosis focus</b>'+guidedBars(guidedScores('dx'),'#2980b9')+'</div><div><b style="font-size:12px;color:#7d6608;">Remedy focus</b>'+guidedBars(guidedScores('rx'),'#f39c12')+'</div></div>';
    h+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;"><button type="button" class="btn btn-success btn-sm" onclick="ADX_guidedAnalyzeFull()">🧠 Analyze full ADX</button><button type="button" class="btn btn-info btn-sm" onclick="ADX_guidedTransfer()">➕ Add to main statement</button><button type="button" class="btn btn-light btn-sm" onclick="ADX_guidedClear()">🔄 Clear guided</button></div></div>';
    h+='<div style="background:white;border:1px solid #d6eaf8;border-radius:8px;padding:10px;"><div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px;">';
    if(ADX_GUIDED_STATE.mode==='acute'){
        h+='<label style="font-weight:bold;color:#566573;">Focus</label><select id="adxGuidedFocus" onchange="ADX_guidedSetFocus(this.value)" style="padding:5px;border:1px solid #d6eaf8;border-radius:6px;font-family:inherit;">'; Object.keys(mods).forEach(function(k){ h+='<option value="'+k+'"'+(ADX_GUIDED_STATE.focus===k?' selected':'')+'>'+esc(T(mods[k]))+'</option>'; }); h+='</select>';
        function stageBtn(st,label){ var active=ADX_GUIDED_STATE.stage===st; return '<button type="button" onclick="ADX_guidedSetStage(\''+st+'\')" style="padding:5px 10px;border:none;border-radius:12px;background:'+(active?'#1a5276':'#ecf0f1')+';color:'+(active?'white':'#2c3e50')+';font-size:11px;cursor:pointer;">'+label+'</button>'; }
        h+=stageBtn('confirm','1 Disease type')+stageBtn('remedy','2 Remedy select');
    } else h+='<span style="font-weight:bold;color:#8e44ad;">Chronic totality questions</span>';
    h+='</div>';
    questions.forEach(function(q){ h+='<div style="border:1px solid #eef2f5;border-radius:8px;padding:8px;margin:7px 0;background:#fbfcfd;"><div style="font-weight:bold;color:#1a5276;margin-bottom:5px;">'+esc(T(q.q))+'</div>'; (q.answers||[]).forEach(function(a,idx){ var selected=guidedIsSelected(q.id,a); h+='<button type="button" onclick="ADX_guidedAnswer(\''+q.id+'\','+idx+')" style="margin:2px;padding:5px 9px;border:none;border-radius:14px;background:'+(selected?'#27ae60':'#ecf0f1')+';color:'+(selected?'white':'#2c3e50')+';font-size:11px;cursor:pointer;font-family:inherit;">'+esc(T(a.label))+'</button>'; }); h+='</div>'; });
    h+='</div></div></div>'; return h;
}
function injectGuidedAssistantPanel(){ var ta=$('adxStatement'); if(!ta || $('adxGuidedPanel')) return; var div=document.createElement('div'); div.id='adxGuidedPanel'; div.innerHTML=renderGuidedAssistant(); ta.parentNode.insertBefore(div, ta); }
function guidedRender(){ var p=$('adxGuidedPanel'); if(p) p.innerHTML=renderGuidedAssistant(); }
function guidedSetMode(m){ ADX_GUIDED_STATE.mode=m; ADX_GUIDED_STATE.stage=m==='chronic'?'confirm':ADX_GUIDED_STATE.stage; guidedRender(); }
function guidedSetFocus(f){ ADX_GUIDED_STATE.focus=f; try{ var sel=$('adxSpecialtySelect'); if(sel){ sel.value=f; renderSpecialtySelected(); } }catch(e){} guidedRender(); }
function guidedSetStage(st){ ADX_GUIDED_STATE.stage=st; guidedRender(); }
function guidedAnswer(qid, idx){
    var q=guidedQuestionMap()[qid]; if(!q || !q.answers[idx]) return;
    var a=q.answers[idx];
    var list=guidedSelectedList(qid);
    var exists=list.some(function(x){return x.fact===a.fact;});
    if(exists){
        list=list.filter(function(x){return x.fact!==a.fact;});
    } else {
        if(q.type==='single') list=[a];
        else list.push(a);
    }
    if(list.length) ADX_GUIDED_STATE.answers[qid]=list;
    else delete ADX_GUIDED_STATE.answers[qid];
    ADX_GUIDED_STATE.lastUpdated=new Date().toISOString();
    if(a.red && !exists) toast('⚠️ Red flag answer added — check safety/referral','error');
    guidedRender();
}
function guidedClear(){ ADX_GUIDED_STATE.answers={}; ADX_GUIDED_STATE.lastUpdated=null; setVal('adxGuidedBaseText',''); guidedRender(); }
function guidedTransfer(){ var txt=guidedCaseText(); if(!txt.trim()){ toast('No guided data yet','error'); return; } var ta=$('adxStatement'); if(ta) ta.value=(ta.value?ta.value+'\n':'')+txt; var notes=$('adxSpecialtyNotes'); if(notes) notes.value=(notes.value?notes.value+'\n':'')+guidedFacts().map(function(f){return '• '+f;}).join('\n'); if(ADX_GUIDED_STATE.mode==='acute'){ var sel=$('adxSpecialtySelect'); if(sel){ sel.value=ADX_GUIDED_STATE.focus; renderSpecialtySelected(); } } guidedApplyDetails(); toast('✅ Guided findings added to main statement'); }
function guidedAnalyzeFull(){ guidedTransfer(); runUI(); }

function bind(){
    injectGuidedAssistantPanel();
    injectCaseDetailsPanel();
    injectSpecialtyPanel();
    injectDxButtons();
    injectAnalyticsPanel();
    var b=$('adxAnalyzeBtn'); if(b && !b._adxBound){ b.addEventListener('click',runUI); b._adxBound=true; }
    var c=$('adxClearBtn'); if(c && !c._adxBound){ c.addEventListener('click',clearUI); c._adxBound=true; }
    var ta=$('adxStatement'); if(ta && !ta._adxBound){
        ta.addEventListener('keydown',function(e){ if((e.ctrlKey||e.metaKey) && e.key==='Enter') runUI(); });
        ta._adxBound=true;
    }
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind); else setTimeout(bind,0);
setTimeout(bind,800); // pages are already in DOM, but this guards delayed rendering
try { window.addEventListener('online', function(){ syncAdxRecordsWithCloud(false); }); } catch(e) {}
setTimeout(function(){ if(navigator.onLine) syncAdxRecordsWithCloud(false); }, 2500);

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
global.ADX_showAnalytics=showAnalytics;
global.ADX_exportRecords=exportRecords;
global.ADX_importRecords=importRecords;
global.ADX_clearRecords=clearRecords;
global.ADX_loadRecord=loadRecord;
global.ADX_deleteRecord=deleteRecord;
global.ADX_renderAnalyticsDashboard=renderAnalyticsDashboard;
global.ADX_renderSpecialtySelected=renderSpecialtySelected;
global.ADX_addSpecialtyFinding=addSpecialtyFinding;
global.ADX_addSpecialtyToStatement=addSpecialtyToStatement;
global.ADX_collectSpecialtyData=collectSpecialtyData;
global.ADX_applySpecialtyScoring=applySpecialtyScoring;
global.ADX_specialtyRubricTemplates=specialtyRubricTemplates;
global.ADX_constitutionalSupportRules=constitutionalSupportRules;
global.ADX_confirmSuggestedRubrics=confirmSuggestedRubrics;
global.ADX_confirmOneRubric=function(i){ confirmOneRubric(i,false).then(function(){ var out=$('adxResults'); if(out) out.innerHTML=renderAnalysis(lastAnalysis); }); };
global.ADX_editRubricPath=editRubricPath;
global.ADX_removeRubric=removeRubric;
global.ADX_addCustomRubric=addCustomRubric;
global.ADX_openExactRubric=openExactRubric;
global.ADX_syncCloud=function(){ syncAdxRecordsWithCloud(true); };
global.ADX_pullCloud=function(){ pullAdxCloudRecords(true).then(function(){ showAnalytics(); }); };
global.ADX_checkCloudTable=function(){ return checkAdxCloudTable(true); };
global.ADX_guidedRender=guidedRender;
global.ADX_guidedSetMode=guidedSetMode;
global.ADX_guidedSetFocus=guidedSetFocus;
global.ADX_guidedSetStage=guidedSetStage;
global.ADX_guidedAnswer=guidedAnswer;
global.ADX_guidedRemoveAnswer=guidedRemoveAnswer;
global.ADX_guidedClear=guidedClear;
global.ADX_guidedTransfer=guidedTransfer;
global.ADX_guidedAnalyzeFull=guidedAnalyzeFull;

})(window);
