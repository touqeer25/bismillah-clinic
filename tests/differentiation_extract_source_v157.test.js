'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
let passes = 0;
function ok(value, message) {
    if (!value) throw new Error('ناکام: ' + message);
    passes++;
    console.log('درست: ' + message);
}

const sourceDir = path.join(root, 'js/differentiation/08-diff-extract-src');
const parts = fs.readdirSync(sourceDir).filter((name) => name.endsWith('.js.part')).sort();
const manifest = read('js/differentiation/08-diff-extract-src/main.js.src');
ok(parts.length === 3, 'تفریق و نکاسی کے 3 موضوعاتی فعلی حصے الگ موجود ہیں');
for (const part of parts) {
    ok(manifest.includes('/* @include: ' + part + ' */'), 'مرکزی آغاز میں فعلی حصہ شامل ہے: ' + part);
    ok(fs.statSync(path.join(sourceDir, part)).size > 0, 'فعلی حصہ خالی نہیں: ' + part);
}
const engine = read('js/differentiation/08-diff-extract-src/00-extraction-engine.js.part');
const view = read('js/differentiation/08-diff-extract-src/01-extraction-view.js.part');
const actions = read('js/differentiation/08-diff-extract-src/02-extraction-actions.js.part');
ok(engine.includes('function repDiffExtract(') && !engine.includes('function repDiffRenderExtr('), 'نکاسی کا حسابی فعل نمائش سے الگ ہے');
ok(view.includes('function repDiffRenderExtr(') && !view.includes('function repDiffExtract('), 'نکاسی کے نتائج کی نمائش حسابی فعل سے الگ ہے');
ok(actions.includes('function repDiffTakeAll(') && actions.includes('function repDiffCopy('), 'کاپی اور کلپ بورڈ کی کارروائیاں الگ حصے میں ہیں');

const order = read('js/differentiation/LOAD_ORDER.txt').trim().split(/\r?\n/);
ok(order[order.length - 1] === '08-diff-extract.js' && order.length === 8, 'تفریق کی طے شدہ لوڈ ترتیب اور آٹھواں خانہ برقرار ہے');
const runtime = read('js/differentiation/08-diff-extract.js');
for (const name of ['repDiffExtract', 'repDiffRenderExtr', 'repDiffTakeAll', 'repDiffCopy']) {
    ok(runtime.includes('function ' + name + '('), 'موجودہ فعلی نام تیار فائل میں برقرار ہے: ' + name);
}

const build = cp.spawnSync(process.execPath, ['tools/build_differentiation_functions.js', '--check'], {
    cwd: root, encoding: 'utf8'
});
ok(build.status === 0, 'تیار تفریقی فائل الگ ماخذ حصوں سے عین یکساں ہے');
const syntax = cp.spawnSync(process.execPath, ['--check', 'js/differentiation/08-diff-extract.js'], {
    cwd: root, encoding: 'utf8'
});
ok(syntax.status === 0, 'تیار نکاسی فائل کی نحوی جانچ کامیاب');

console.log('تفریق و نکاسی کی ماخذ فائل بندی مکمل، درست دعوے: ' + passes);
