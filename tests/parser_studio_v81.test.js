// tests/parser_studio_v81.test.js — v81 پارسر انجن: صفحات، فارمیٹس، کراس-چیک، ایڈیٹ آپس، ZIP
// Run: node tests/parser_studio_v81.test.js
const PE = require('../js/parser-engine.js');
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const KNOWN = { 'acon': 1, 'bell': 1, 'rhus-t': 1, 'nux-v': 1, 'sep': 1, 'lyc': 1, 'calc': 1, 'sulph': 1, 'nat-m': 1, 'puls': 1, 'ars': 1, 'bry': 1, 'merc': 1, 'hep': 1, 'phos': 1 };

// --- 1) ریمیڈی ٹوکن + گریڈ اسٹائل ---
let r = PE.parseRemTokens('acon. 3 bell. 2 rhus-t', 'digits', KNOWN);
ok(r.rem.acon === 3 && r.rem.bell === 2 && r.rem['rhus-t'] === 1, 'digits: acon 3, bell 2, rhus-t 1');
r = PE.parseRemTokens('nux-v II sep III lyc', 'roman', KNOWN);
ok(r.rem['nux-v'] === 2 && r.rem.sep === 3 && r.rem.lyc === 1, 'roman: II=2, III=3, بغیر=1');
r = PE.parseRemTokens('calc ** sulph *', 'stars', KNOWN);
ok(r.rem.calc === 2 && r.rem.sulph === 1, 'stars: **=2, *=1');
r = PE.parseRemTokens('fear of dogs in company', 'digits', KNOWN);
ok(Object.keys(r.rem).length === 0, 'عام الفاظ ریمیڈی نہیں بنتی');
r = PE.parseRemTokens('acon 3, bell, 2, ars', 'digits', KNOWN);
ok(r.rem.acon === 3 && r.rem.bell === 2 && r.rem.ars === 1, 'کوما/الگ grade ٹوکن بھی');

// --- 2) صفحہ تقسیم ---
let pg = PE.splitPages('p1 line\nmore\fp2 here\n\f\fp3', { mode: 'formfeed' });
ok(pg.length === 3 && pg[0].text.indexOf('p1') === 0 && pg[2].text.indexOf('p3') === 0, 'formfeed: 3 صفحات');
pg = PE.splitPages('a\nb\nc\nd\ne', { mode: 'every', n: 2 });
ok(pg.length === 3 && pg[1].text === 'c\nd', 'every-N: 2-2 لکیریں');
pg = PE.splitPages('Page 1\ntext\nPage 2\nmore', { mode: 'regex', regex: '^page\\s+\\d+' });
ok(pg.length === 2 && pg[0].text.indexOf('Page 1') === 0, 'regex: page markers');

// --- 3) path/rem تقسیم ---
let s = PE.splitPathRem('MIND - fear - dogs, of   acon. 3 bell. 2', { sep: 'dash', known: KNOWN });
ok(s.path === 'MIND - fear - dogs, of' && s.remStr.indexOf('acon') === 0, '2sp تقسیم: path + rem');
s = PE.splitPathRem('FEAR, dogs, of acon. 3 bell. 2', { sep: 'comma', known: KNOWN });
ok(s.path.toLowerCase().indexOf('fear') === 0 && s.remStr.indexOf('acon') === 0, 'tail-run: بغیر دو خالی جگہ بھی');
ok(PE.segs('MIND - ABSENT - of mind', 'dash').join('|') === 'MIND|ABSENT|of mind', 'dash segs');
ok(PE.segs('BALL, as if, ascending (a, b)', 'comma').length === 3, 'comma segs: پیرنٹھیسس محفوظ');

// --- 4) صفحہ پارس + کراس-چیک (صاف صفحہ) ---
const page = [
  "MIND 41",                                      // skipRe شکل (صفحہ نمبر سرخی) — chapterRe نہیں
  "ABRUPT - affectionate   aur-m 2",
  "ABRUPT - harsh   anac 2, graph 1, lach 3",
  "  lyc 1",                                       // تسلسل (rem)
  "ABSENTMINDED - children   bar-c 1",
  "FEAR, dogs, of   acon 3 bell 2"
].join('\n');
const prof = { sep: 'dash', known: KNOWN, gradeStyle: 'digits', skipRe: '^MIND\\s+\\d+$' };
const parsed = PE.parseRepPage(page, prof);
ok(parsed.rows.length === 4, 'صفحہ: 4 ربرکس (تسلسل ضم) — ' + parsed.rows.length);
ok(parsed.rows[1].rem.lyc === 1 && parsed.rows[1].rem.lach === 3, 'تسلسل سطر rem ضم ہوئی');
let cc = PE.crossCheckRep(page, parsed, prof);
ok(cc.ok, 'کراس-چیک: صاف صفحہ = بالکل درست اور مکمل');
ok(cc.lines.total === 6 && cc.lines.unmapped === undefined || cc.lines.unmatched.length === 0, 'حساب: صفر بغیر حساب');
ok(cc.lines.skipped === 1, '1 سطر skip (صفحہ سرخی)');

// --- 5) کراس-چیک: ٹیمپر شدہ صفحہ پکڑے ---
const bad = PE.parseRepPage(page, prof);
bad.rows[0].rem = { aur: 3 };                       // ادویات/گریڈ بدل دیے
cc = PE.crossCheckRep(page, bad, prof);
ok(!cc.ok && cc.remCheck.length > 0, 'کراس-چیک: تبدیل شدہ rem پکڑتا ہے');
const page2 = page + '\nیہ لکیر بغیر کسی قاعدے کی ہے';  // unmatched سطر
const p2 = PE.parseRepPage(page2, prof);
cc = PE.crossCheckRep(page2, p2, prof);
ok(!cc.ok && cc.lines.unmatched.length === 1, 'کراس-چیک: بغیر حساب سطر = ناکام');

// --- 6) HTML (bold/italic) ---
const hl = PE.htmlLines('MIND<br>\n<b>acon</b> <i>bell</i> plain');
ok(hl.length === 2 && hl[1].styles.some(x => x.style === 'b') && hl[1].styles.some(x => x.style === 'i'), 'HTML: bold/italic نشان');

// --- 7) ایپ فارمیٹ + ضم ---
let ch = PE.rowsToChapter(parsed.rows, { sep: 'dash' });
ok(Object.keys(ch.data).length === 4 && ch.data.x2.t === 'ABRUPT - harsh' && ch.data.x2.r['lach'] === 3, 'rowsToChapter: {t,r} فارمیٹ');
const base = {};
let mg = PE.mergeChapter(base, parsed.rows, { mode: 'new', sep: 'dash' });
ok(mg.added === 4, 'merge new: 4 شامل');
mg = PE.mergeChapter(base, parsed.rows, { mode: 'merge', sep: 'dash' });
ok(mg.added === 0 && mg.merged === 4, 'merge: دہرے ربرکس پر ادویات ضم');
const before = JSON.stringify(base);
const tRow = [{ path: 'ABRUPT - harsh', rem: { lach: 1, sulph: 2 } }];
mg = PE.mergeChapter(base, tRow, { mode: 'merge', sep: 'dash' });
ok(base[Object.keys(base).find(k => base[k].t === 'ABRUPT - harsh')].r.lach === 3, 'merge: بلند grade قائم (lach=3 رہا)');
ok(base[Object.keys(base).find(k => base[k].t === 'ABRUPT - harsh')].r.sulph === 2, 'merge: نیا rem شامل (sulph=2)');
mg = PE.mergeChapter(base, parsed.rows, { mode: 'new', sep: 'dash' });
ok(mg.dups.length === 4, 'dup پتہ: نیا موڈ میں دہرے چھوڑ دیتے');

// --- 8) ایڈیٹر آپس ---
const d = {};
const r1 = PE.opAddRubric(d, 'FEAR, dogs', { acon: 3 }, { rid: 'x1' });
const r2 = PE.opAddRubric(d, 'FEAR, dogs, of', { bell: 2 }, { rid: 'x2' });
const r3 = PE.opAddRubric(d, 'FEAR, dogs, of, snapping', { calc: 1 }, { rid: 'x3' });
ok(d.x2.t === 'FEAR, dogs, of', 'opAddRubric');
PE.opAddRem(d, 'x1', 'Puls.', 2);
ok(d.x1.r.puls === 2, 'opAddRem (نارملائز)');
PE.opSetGrade(d, 'x1', 'acon', 1);
ok(d.x1.r.acon === 1, 'opSetGrade');
PE.opDelRem(d, 'x1', 'puls');
ok(!d.x1.r.puls, 'opDelRem');
let rp = PE.opDelRubric(d, 'x2', { reParent: true, reparent: true, sep: 'comma' });
ok(!d.x2 && d.x3.t === 'FEAR, dogs, snapping' && rp.reparented === 1, 'opDelRubric: بچوں کو والد دوبارہ');
const moved = PE.opMoveSubtree(d, 'x3', 'ANGER', { sep: 'comma' });
ok(d.x3.t === 'ANGER, snapping' && moved === 1, 'opMoveSubtree: ٹری منتقل');
PE.opSetPath(d, 'x3', 'ANGER, in children');
ok(d.x3.t === 'ANGER, in children', 'opSetPath: ٹری درست');

// --- 9) مواد (بک) پارس ---
const bpage = ['§ ORGANON', 'First paragraph line one.', 'continues here.', '', 'Second paragraph.', '§ § 2', 'Another para.'].join('\n');
const bp = PE.parseContentPage(bpage, { headRe: '^§\\s+(.+)$' });
ok(bp.entries.length === 1 && bp.entries[0].sections.length === 2 && bp.entries[0].sections[0].p.length === 2, 'بک: سیکشن + پیراگراف');
let ccB = PE.crossCheckContent(bpage, bp);
ok(ccB.ok && ccB.lines.unmatched.length === 0, 'بک کراس-چیک: سب سطریں کا حساب');
const lib = PE.contentToLibBook(bp.entries, { title: 'Organon', author: 'Hahnemann', year: 1842 });
ok(lib.sections[0].h === 'ORGANON' && lib.sections[0].p[0].indexOf('First') === 0, 'library فارمیٹ: {title,sections:[{h,p}]}');

// --- 10) مٹیریا میڈیکا ---
const mpage = ['Aconitum napellus', 'Introduction: Fear and anxiety.', 'Modalities: Worse cold.', 'Belladonna', 'Head: Throbbing.'].join('\n');
const mp = PE.parseContentPage(mpage, { entryRe: '^(Aconitum napellus|Belladonna)\\s*$', headRe: '^([A-Za-z]+):' });
ok(mp.entries.length === 2 && mp.entries[0].sections.length === 2, 'MM: ریمیڈی + سیکشن');
let mm = PE.contentToMMBook(mp.entries.map(e => ({ ...e, abbr: e.name.split(' ')[0].toLowerCase() })), { id: 'test_mm', title: 'Test' });
ok(mm.remedies.aconitum && mm.remedies.aconitum.sections[0].p[0].indexOf('Fear') > -1, 'mm فارمیٹ: {remedies:{abbr:{sections}}}');

// --- 11) CRC + ZIP ---
ok(PE.crc32(new TextEncoder().encode('123456789')) === 0xCBF43926, 'crc32 معیاری طے');
const zip = PE.makeZip({ 'a.txt': 'hello', 'dir/b.json': '{"x":1}' });
const z8 = zip;
const sig = (z8[0] | (z8[1] << 8) | (z8[2] << 16) | (z8[3] << 24)) >>> 0;
ok(sig === 0x04034b50, 'ZIP: local header');
const eb = z8.length - 22;
const eocd = (z8[eb] | (z8[eb + 1] << 8) | (z8[eb + 2] << 16) | (z8[eb + 3] << 24)) >>> 0;
ok(eocd === 0x06054b50, 'ZIP: EOCD');
const txt = new TextDecoder().decode(z8);
ok(txt.indexOf('a.txt') > -1 && txt.indexOf('dir/b.json') > -1 && txt.indexOf('hello') > -1, 'ZIP: نام + مواد موجود');

console.log(fails ? 'FAILURES: ' + fails : 'ALL v81 PARSER ENGINE CHECKS PASSED');
process.exit(fails ? 1 : 0);
