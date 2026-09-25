// Bismillah Clinic — js/repertory/rep-books.js — کتابوں کی فہرست (REP_BOOK_INFO) + حالت کے متغیرات — نئی کتاب صرف یہاں شامل کریں
// (v78: 08-app-repertory.js کو بغیر کسی کوڈ تبدیلی کے حصوں میں بانٹا گیا؛ لوڈ ترتیب index.html میں وہی رکھیں)
// ============================================================
// Bismillah Clinic — js/08-app-repertory.js
// REPERTORY BROWSER (books, chapters, tree, search)
// NOTE: Ye index.html ke inline script ka hissa hai (sirf jagah badli hai).
// WARNING: In files ka LOAD ORDER kabhi na badlein!
// ============================================================

// ==================== REPERTORY BROWSER ====================
// 🔑 per-book metadata so we can (a) load data/index files, (b) show abbreviations
var REP_BOOK_INFO = {
    publicum:    { abbr: 'Pub',  name: 'Repertorium Publicum', dataFile: 'repertory-data.json',                 chapDir: 'repertory_chapters/',        color:'#1a5276', tree:'prefix' },
    kent:        { abbr: 'Kent', name: 'Kent (English)',       dataFile: 'kent_repertory.json',                  chapDir: 'kent_chapters/',             color:'#16a085', tree:'prefix', notesFile:'kent_rubric_notes.json' },
    kent_de:     { abbr: 'K-DE', name: 'Kent (German)',        dataFile: 'kent_de_repertory_by_key.json',        chapDir: 'kent_de_chapters/',          color:'#d35400' },
    synthesis91: { abbr: 'Syn',  name: 'Syn 9.1 (Supplement)',  dataFile: 'synthesis91_raw_repertory_by_key.json', chapDir: 'synthesis91_raw_chapters/', color:'#8e44ad' },
    /* 🔑 Homeosetu سے کلون کی گئی 4 ریپرٹریز (Sep 2026) — ابواب کی ترتیب کتاب کے مطابق (keepOrder) */
    allen_fever: { abbr: 'A-Fev', name: 'Allen Fever Repertory',              dataFile: 'allen_fever_repertory.json', chapDir: 'allen_fever_chapters/', color:'#c0392b', tree:'prefix', keepOrder:true },
    hs_clinical: { abbr: 'Clin',  name: 'Clinical Repertory (Clarke/Boericke/Allen/Hering)', dataFile: 'hs_clinical_repertory.json', chapDir: 'hs_clinical_chapters/', color:'#2e86c1', tree:'prefix', keepOrder:true },
    keynotes_cc: { abbr: 'Key',   name: 'Keynotes & Clinical Concordance',    dataFile: 'keynotes_cc_repertory.json', chapDir: 'keynotes_cc_chapters/', color:'#7d6608', tree:'prefix', keepOrder:true },
    nosodes:     { abbr: 'Nos',   name: 'Intercurrent Nosodes & Sarcodes',    dataFile: 'nosodes_repertory.json',     chapDir: 'nosodes_chapters/',     color:'#117a65', tree:'prefix', keepOrder:true },
    // 🔑 v67: ہیرنگ — اینالیٹیکل ریپرٹری آف دی سمپٹمز آف دی مائنڈ (1881) — او سی آر سے تبدیل؛ گریڈ: II=3، I=2، باقی 1
    hering_mind: { abbr: 'H-Mind', name: 'Hering — Analytical Repertory of the Mind', dataFile: 'hering_mind_repertory.json', chapDir: 'hering_mind_chapters/', color:'#6e2c00', tree:'prefix', keepOrder:true },
    // 🔑 v68: بوگر — ٹائمز آف دی ریمیڈیز اینڈ مون فیزز (homeoint.org Séror ایڈیشن) — رنگ = اصل I/II مارکس
    boger_times: { abbr: 'Times', name: 'Boger — Times of Remedies & Moon Phases', dataFile: 'boger_times_repertory.json', chapDir: 'boger_times_chapters/', color:'#b9770e', tree:'prefix', keepOrder:true },
    // 🔑 v68: بورک و ڈیوی — ٹشو ریمیڈیز کا تھراپیوٹک حصہ (homeopathybooks.in) — rubric = disease، remedies = 12 نمک
    tissues_bd: { abbr: 'Tiss', name: 'Boericke & Dewey — Tissue Remedies', dataFile: 'tissues_bd_repertory.json', chapDir: 'tissues_bd_chapters/', color:'#16a085', tree:'prefix', keepOrder:true }
};
/* 🔑 کتاب کے مطابق رنگ / فولڈر — ہر جگہ یہی helper استعمال ہو (hard-coded ternaries نہیں) */
function repBookColor(book){ var bi=REP_BOOK_INFO[book]; return (bi&&bi.color)||'#8e44ad'; }
function repChapDir(book){ var bi=REP_BOOK_INFO[book||repCurrentBook]; return (bi&&bi.chapDir)||'repertory_chapters/'; }
// 🔑 v68.6: پوری کتاب، ایک باب اور ہر فہرست اِسی ایک نمبر سے منگوائی جائے — پہلے 'v=14' تین جگہ لکھا تھا اور
// _index.json بالکل بغیر نمبر کے، اس لیے نئی کتاب کا فہرست پرانے کیش سے پڑھا جاتا رہتا تھا۔
var REP_DATA_V='v=16';
var _allBooksData = null;       // {publicum:{...}, kent:{...}, ...} cache for all-books mode
var _allBookChapters = {};      // {publicum:[{key,name,rubrics}], ...} per-book chapter index (for name lookup)
var repLastSearchView = null;   // {results, info} saved for the "back to results" button
// 🔑 v45: ڈیفالٹ کتاب = Kent (صارف درخواست — ڈراپ ڈاؤن میں کینٹ ٹاپ پر)
var repCurrentBook = 'kent';
// 🔑 v45: ہر ریپرٹری کا ڈیفالٹ چیپٹر — کتاب کھلنے پر مائنڈ خود بخود کھلتا ہے (صارف درخواست)
var REP_DEFAULT_CHAPTER = { kent:'mind', publicum:'mind', synthesis91:'mind', kent_de:'gemuet', allen_fever:'type', hs_clinical:'clinical_clarke', keynotes_cc:'generalities', nosodes:'generalities', hering_mind:'ailments_from_emotions_and_exertions_of_the_mind', boger_times:'general_hour', tissues_bd:'tissue_therapeutics' };
var repChapterNames = [];
var repCurrentChapter = '';
var repTreeCache = {};
var _repFullData = null;
var repCurrentChKey = '', repCurrentChName = '', repCurrentFlatTree = [];

