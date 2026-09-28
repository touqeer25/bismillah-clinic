// Bismillah Clinic — js/differentiation/02-diff-data.js
// 🔬 تفریق / نکاسی — ربرکس کی فہرست بنانا + ہر دوا کا حجم
// (v83 میں js/08b-rep-differentiation.js کو آٹھ حصوں میں بانٹا گیا؛ ترتیب LOAD_ORDER.txt میں)

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
