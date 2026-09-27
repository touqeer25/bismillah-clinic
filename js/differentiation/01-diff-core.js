//#SPLIT ==================================================================
//#SPLIT 🔬 تفریق / نکاسی — حالت، سیٹنگز اور ریاضی — سب سے پہلے لوڈ ہو
//#SPLIT اصل: js/08b-rep-differentiation.js — سطریں 1 تا 34
//#SPLIT ⚠ کوڈ میں ایک حرف بھی تبدیل نہیں — صرف کاٹ کر منتقل کیا گیا ہے۔
//#SPLIT ==================================================================
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
