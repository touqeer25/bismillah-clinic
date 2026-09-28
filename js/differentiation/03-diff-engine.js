// Bismillah Clinic — js/differentiation/03-diff-engine.js
// 🔬 تفریق / نکاسی — حساب کا انجن — خصوصی / گریڈ / جزوی / مشترک ایک ہی چکر میں
// (v83 میں js/08b-rep-differentiation.js کو آٹھ حصوں میں بانٹا گیا؛ ترتیب LOAD_ORDER.txt میں)

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
