'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'css/repertory-tabs-src');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
let passes = 0;
function ok(value, message) {
    if (!value) throw new Error('ناکام: ' + message);
    passes++;
    console.log('درست: ' + message);
}

const parts = fs.readdirSync(sourceDir).filter((name) => name.endsWith('.css.part')).sort();
const source = read('css/repertory-tabs-src/main.css.src');
const runtime = read('css/repertory-tabs.css');
ok(parts.length === 4, 'بیرونی خول کے چار طرزنامہ حصے الگ موجود ہیں');
for (const part of parts) {
    ok(source.includes('/* @include: ' + part + ' */'), 'مرکزی طرزنامہ فہرست میں حصہ شامل ہے: ' + part);
    ok(fs.statSync(path.join(sourceDir, part)).size > 0, 'طرزنامہ حصہ خالی نہیں: ' + part);
}
ok(!runtime.includes('@include:'), 'چلنے والی طرزنامہ فائل میں ماخذی نشان باقی نہیں');
const result = cp.spawnSync(process.execPath, ['tools/build_repertory_styles.js', '--check'], {
    cwd: root, encoding: 'utf8'
});
ok(result.status === 0, 'تیار طرزنامہ اور الگ حصوں کا متن یکساں ہے');

console.log('طرزنامہ فائل بندی کی جانچ مکمل، درست دعوے: ' + passes);
